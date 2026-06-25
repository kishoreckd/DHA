import asyncio
import json
import logging
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.models.cwv import ReportFormat
from app.services.report_paths import report_dir_for_url


logger = logging.getLogger(__name__)


class PageSpeedScrapeError(RuntimeError):
    pass


async def capture_pagespeed_web_report(
    report_id: str,
    url: str,
    output_format: ReportFormat,
) -> tuple[dict[str, Path], dict[str, Any]]:
    return await asyncio.to_thread(
        _capture_pagespeed_web_report_sync,
        report_id,
        url,
        output_format,
    )


def _capture_pagespeed_web_report_sync(
    report_id: str,
    url: str,
    output_format: ReportFormat,
) -> tuple[dict[str, Path], dict[str, Any]]:
    logger.info(
        "pagespeed web capture started report_id=%s url=%s output_format=%s",
        report_id,
        url,
        output_format,
    )
    try:
        from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        logger.exception("pagespeed web capture dependency missing")
        raise PageSpeedScrapeError(
            "PageSpeed web capture requires Playwright. Install playwright and run `playwright install chromium`."
        ) from exc

    reports_dir = report_dir_for_url("pagespeed", url)
    timeout_ms = settings.pagespeed_ui_timeout_seconds * 1000
    metadata: dict[str, Any] = {
        "source": "pagespeed_web_ui",
        "target_url": url,
        "captured_at": datetime.now(UTC).isoformat(),
        "captures": {},
    }
    paths: dict[str, Path] = {}

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            try:
                for form_factor in ("mobile", "desktop"):
                    page = browser.new_page(viewport={"width": 1440, "height": 1800})
                    page.set_default_timeout(timeout_ms)
                    try:
                        path, capture_metadata = _capture_form_factor(
                            page=page,
                            report_id=report_id,
                            url=url,
                            output_format=output_format,
                            form_factor=form_factor,
                            timeout_ms=timeout_ms,
                            reports_dir=reports_dir,
                        )
                        paths[form_factor] = path
                        metadata["captures"][form_factor] = capture_metadata
                    finally:
                        page.close()
            finally:
                browser.close()
    except PlaywrightTimeoutError as exc:
        logger.exception("pagespeed web capture timed out report_id=%s url=%s", report_id, url)
        raise PageSpeedScrapeError(
            "Timed out waiting for the PageSpeed Insights web report to finish."
        ) from exc
    except PageSpeedScrapeError:
        raise
    except Exception as exc:
        logger.exception("pagespeed web capture failed report_id=%s url=%s", report_id, url)
        raise PageSpeedScrapeError(f"PageSpeed web capture failed: {exc}") from exc

    metadata["artifact_paths"] = {key: str(path) for key, path in paths.items()}
    logger.info("pagespeed web capture completed report_id=%s paths=%s", report_id, metadata["artifact_paths"])
    return paths, metadata


def _capture_form_factor(
    page,
    report_id: str,
    url: str,
    output_format: ReportFormat,
    form_factor: str,
    timeout_ms: int,
    reports_dir: Path,
) -> tuple[Path, dict[str, Any]]:
    logger.info("pagespeed %s capture started report_id=%s url=%s", form_factor, report_id, url)
    try:
        page.goto(settings.pagespeed_ui_url, wait_until="domcontentloaded", timeout=timeout_ms)
        _accept_cookies(page)
        _submit_url(page, url)
        _wait_for_report(page, timeout_ms)
        _select_form_factor(page, form_factor, timeout_ms)
        _wait_for_report(page, timeout_ms)
        _settle_before_capture(page, form_factor)
        _hydrate_lazy_report_sections(page, timeout_ms)
        _prepare_page_for_capture(page)
    except Exception:
        _save_debug_artifacts(page, report_id, form_factor, reports_dir)
        raise

    metadata = {
        "form_factor": form_factor,
        "final_page_url": page.url,
        "title": page.title(),
    }

    suffix = f"{report_id}-{form_factor}"
    if output_format == ReportFormat.pdf:
        path = reports_dir / f"{suffix}.pdf"
        page.pdf(path=str(path), format="A4", print_background=True)
    elif output_format == ReportFormat.screenshot:
        path = reports_dir / f"{suffix}.png"
        page.screenshot(path=str(path), full_page=True)
    elif output_format == ReportFormat.json:
        path = reports_dir / f"{suffix}.json"
        metadata["text"] = page.locator("body").inner_text(timeout=timeout_ms)
        path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    else:
        path = reports_dir / f"{suffix}.html"
        metadata["snapshot_type"] = "pagespeed_dom_html"
        _freeze_page_for_html(page)
        path.write_text(page.content(), encoding="utf-8")

    metadata["artifact_path"] = str(path)
    metadata["artifact_bytes"] = path.stat().st_size
    logger.info(
        "pagespeed %s capture completed report_id=%s path=%s bytes=%s",
        form_factor,
        report_id,
        path,
        path.stat().st_size,
    )
    return path, metadata


def _submit_url(page, url: str) -> None:
    selectors = [
        "input[type='url']",
        "input[aria-label*='URL']",
        "input[placeholder*='URL']",
        "input",
    ]
    for selector in selectors:
        locator = page.locator(selector).first
        if locator.count() > 0:
            locator.fill(url)
            break
    else:
        raise PageSpeedScrapeError("Could not find the PageSpeed URL input.")

    analyze_button = page.get_by_role("button", name="Analyze")
    if analyze_button.count() > 0:
        analyze_button.first.click()
    else:
        page.keyboard.press("Enter")


def _accept_cookies(page) -> None:
    for name in ("Ok, Got it.", "OK, Got it.", "Accept all"):
        button = page.get_by_role("button", name=name)
        try:
            if button.count() > 0:
                button.first.click(timeout=2000)
                logger.info("pagespeed cookie banner accepted")
                return
        except Exception:
            continue


def _wait_for_report(page, timeout_ms: int) -> None:
    page.wait_for_url("**/analysis/**", timeout=timeout_ms)
    page.wait_for_load_state("domcontentloaded", timeout=timeout_ms)
    _wait_for_visible_report_text(page, timeout_ms)
    logger.info("pagespeed report loaded url=%s", page.url)


def _wait_for_visible_report_text(page, timeout_ms: int) -> None:
    page.wait_for_function(
        """
        () => {
          const visibleText = Array.from(document.querySelectorAll('body *'))
            .filter((element) => {
              const style = window.getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return style.visibility !== 'hidden'
                && style.display !== 'none'
                && rect.width > 0
                && rect.height > 0;
            })
            .map((element) => element.innerText || element.textContent || '')
            .join('\\n');

          const hasFieldResult = visibleText.includes('Core Web Vitals Assessment');
          const hasLabResult = visibleText.includes('Performance')
            && visibleText.includes('Accessibility')
            && visibleText.includes('Best Practices')
            && visibleText.includes('SEO');

          const stillRunning = visibleText.includes('Running analysis')
            || visibleText.includes('Analyzing page');

          return (hasFieldResult || hasLabResult) && !stillRunning;
        }
        """,
        timeout=timeout_ms,
    )


def _wait_for_lab_results(page, timeout_ms: int) -> None:
    _wait_for_visible_report_text(page, timeout_ms)
    logger.info("pagespeed lab results ready url=%s", page.url)


def _select_form_factor(page, form_factor: str, timeout_ms: int) -> None:
    target = "Desktop" if form_factor == "desktop" else "Mobile"
    tab_id = "#desktop_tab" if form_factor == "desktop" else "#mobile_tab"
    control = page.locator(tab_id)
    if control.count() == 0:
        control = page.get_by_role("link", name=target)
    if control.count() == 0:
        control = page.get_by_role("tab", name=target)
    if control.count() == 0:
        control = page.get_by_text(target, exact=True)
    if control.count() > 0:
        control.first.click()
        try:
            page.wait_for_url(f"**form_factor={form_factor}**", timeout=10000)
        except Exception:
            logger.info("pagespeed form factor URL did not change after tab click form_factor=%s", form_factor)
        page.wait_for_load_state("domcontentloaded", timeout=timeout_ms)
        _wait_for_report(page, timeout_ms)
        logger.info("pagespeed form factor selected form_factor=%s url=%s", form_factor, page.url)
        return

    current = page.url
    separator = "&" if "?" in current else "?"
    if "form_factor=" in current:
        import re

        next_url = re.sub(r"form_factor=[^&]+", f"form_factor={form_factor}", current)
    else:
        next_url = f"{current}{separator}form_factor={form_factor}"
    page.goto(next_url, wait_until="domcontentloaded", timeout=timeout_ms)
    _wait_for_report(page, timeout_ms)
    logger.info("pagespeed form factor selected by url form_factor=%s url=%s", form_factor, page.url)


def _prepare_page_for_capture(page) -> None:
    page.evaluate(
        """
        () => {
          document.querySelectorAll('[aria-label="Copy Link"], button').forEach((element) => {
            if (element.textContent && element.textContent.trim() === 'Analyze') return;
          });
          window.scrollTo(0, 0);
        }
        """
    )


def _settle_before_capture(page, form_factor: str) -> None:
    settle_seconds = settings.pagespeed_ui_settle_seconds
    if settle_seconds <= 0:
        return
    logger.info(
        "pagespeed settling before capture form_factor=%s seconds=%s url=%s",
        form_factor,
        settle_seconds,
        page.url,
    )
    time.sleep(settle_seconds)
    try:
        page.wait_for_load_state("networkidle", timeout=30000)
    except Exception:
        logger.info("pagespeed network did not become idle after settle form_factor=%s", form_factor)


def _hydrate_lazy_report_sections(page, timeout_ms: int) -> None:
    logger.info("pagespeed lazy section hydration started url=%s", page.url)
    page.evaluate(
        """
        async () => {
          const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
          const step = Math.max(500, Math.floor(window.innerHeight * 0.75));
          const maxScroll = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
          );

          for (let y = 0; y <= maxScroll + step; y += step) {
            window.scrollTo(0, y);
            await delay(450);
          }

          window.scrollTo(0, Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
          ));
          await delay(1200);
          window.scrollTo(0, 0);
          await delay(600);
        }
        """
    )
    page.wait_for_function(
        """
        () => {
          const text = document.body.innerText || '';
          const hasScoreSections = text.includes('Performance')
            && text.includes('Accessibility')
            && text.includes('Best Practices')
            && text.includes('SEO');
          const hasAuditContent = text.includes('METRICS')
            || text.includes('Passed audits')
            || text.includes('Opportunities')
            || text.includes('Diagnostics');
          return hasScoreSections && hasAuditContent;
        }
        """,
        timeout=timeout_ms,
    )
    logger.info("pagespeed lazy section hydration completed url=%s", page.url)


def _freeze_page_for_html(page) -> None:
    page.evaluate(
        """
        () => {
          window.scrollTo(0, 0);

          document.querySelectorAll('script').forEach((element) => element.remove());
          document.querySelectorAll('iframe').forEach((element) => element.remove());
          document.querySelectorAll('[aria-live]').forEach((element) => {
            if ((element.innerText || '').includes('Running analysis')) {
              element.remove();
            }
          });

          const style = document.createElement('style');
          style.setAttribute('data-cwv-freeze', 'true');
          style.textContent = `
            html, body { overflow: auto !important; }
            * { animation-play-state: paused !important; transition: none !important; }
            .glAfi { display: none !important; }
          `;
          document.head.appendChild(style);
        }
        """
    )


def _save_debug_artifacts(page, report_id: str, form_factor: str, reports_dir: Path) -> None:
    try:
        html_path = reports_dir / f"{report_id}-{form_factor}-debug.html"
        png_path = reports_dir / f"{report_id}-{form_factor}-debug.png"
        html_path.write_text(page.content(), encoding="utf-8")
        page.screenshot(path=str(png_path), full_page=True)
        logger.warning(
            "pagespeed debug artifacts saved report_id=%s form_factor=%s html=%s screenshot=%s url=%s",
            report_id,
            form_factor,
            html_path,
            png_path,
            page.url,
        )
    except Exception:
        logger.exception("failed to save pagespeed debug artifacts report_id=%s form_factor=%s", report_id, form_factor)
