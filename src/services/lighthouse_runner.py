import asyncio
import json
import logging
import os
import shutil
import subprocess
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx

from app.core.config import settings
from app.models.cwv import ReportFormat
from app.services.report_paths import report_dir_for_url


logger = logging.getLogger(__name__)


class LighthouseRunError(RuntimeError):
    pass


async def capture_lighthouse_report(
    report_id: str,
    url: str,
    output_format: ReportFormat,
) -> tuple[dict[str, Path], dict[str, Any]]:
    return await asyncio.to_thread(
        _capture_lighthouse_report_sync,
        report_id,
        url,
        output_format,
        "lighthouse",
        "performance,accessibility,best-practices,seo",
        "lighthouse_cli",
    )


async def capture_lighthouse_best_practices_report(
    report_id: str,
    url: str,
    output_format: ReportFormat,
) -> tuple[dict[str, Path], dict[str, Any]]:
    return await asyncio.to_thread(
        _capture_lighthouse_report_sync,
        report_id,
        url,
        output_format,
        "best-practice/lighthouse",
        "best-practices",
        "lighthouse_best_practices_cli",
    )


def _capture_lighthouse_report_sync(
    report_id: str,
    url: str,
    output_format: ReportFormat,
    reports_subdir: str,
    only_categories: str,
    source: str,
) -> tuple[dict[str, Path], dict[str, Any]]:
    logger.info(
        "lighthouse capture started report_id=%s url=%s output_format=%s",
        report_id,
        url,
        output_format,
    )
    resolved_url = _resolve_final_url(url)
    reports_dir = report_dir_for_url(reports_subdir, url)
    metadata: dict[str, Any] = {
        "source": source,
        "target_url": url,
        "resolved_url": resolved_url,
        "only_categories": only_categories,
        "captured_at": datetime.now(UTC).isoformat(),
        "captures": {},
    }
    paths: dict[str, Path] = {}

    for form_factor in ("mobile", "desktop"):
        path, capture_metadata = _capture_lighthouse_form_factor(
            report_id=report_id,
            url=resolved_url,
            output_format=output_format,
            form_factor=form_factor,
            reports_dir=reports_dir,
            only_categories=only_categories,
        )
        paths[form_factor] = path
        metadata["captures"][form_factor] = capture_metadata

    metadata["artifact_paths"] = {key: str(path) for key, path in paths.items()}
    logger.info("lighthouse capture completed report_id=%s paths=%s", report_id, metadata["artifact_paths"])
    return paths, metadata


def _resolve_final_url(url: str) -> str:
    try:
        with httpx.Client(timeout=20, follow_redirects=True) as client:
            response = client.get(url)
            final_url = str(response.url)
            if final_url and final_url != url:
                logger.info("lighthouse url resolved original_url=%s final_url=%s", url, final_url)
            return final_url or url
    except httpx.HTTPError as exc:
        logger.warning("lighthouse url resolution failed url=%s error=%s", url, exc)
        return url


def _capture_lighthouse_form_factor(
    report_id: str,
    url: str,
    output_format: ReportFormat,
    form_factor: str,
    reports_dir: Path,
    only_categories: str,
) -> tuple[Path, dict[str, Any]]:
    suffix = f"{report_id}-{form_factor}"
    html_path = reports_dir / f"{suffix}.html"
    json_path = reports_dir / f"{suffix}.json"

    _run_lighthouse_cli(
        url=url,
        html_path=html_path,
        json_path=json_path,
        form_factor=form_factor,
        only_categories=only_categories,
    )

    metadata = _read_lighthouse_metadata(json_path)
    metadata.update(
        {
            "form_factor": form_factor,
            "html_artifact_path": str(html_path),
            "json_artifact_path": str(json_path),
        }
    )

    if output_format == ReportFormat.json:
        path = json_path
    elif output_format == ReportFormat.pdf:
        path = reports_dir / f"{suffix}.pdf"
        _render_lighthouse_html(html_path, path, output_format)
    elif output_format == ReportFormat.screenshot:
        path = reports_dir / f"{suffix}.png"
        _render_lighthouse_html(html_path, path, output_format)
    else:
        path = html_path

    metadata["artifact_path"] = str(path)
    metadata["artifact_bytes"] = path.stat().st_size
    logger.info(
        "lighthouse %s capture completed report_id=%s path=%s bytes=%s",
        form_factor,
        report_id,
        path,
        path.stat().st_size,
    )
    return path, metadata


def _run_lighthouse_cli(
    url: str,
    html_path: Path,
    json_path: Path,
    form_factor: str,
    only_categories: str,
) -> None:
    lighthouse_cmd = Path("node_modules") / ".bin" / "lighthouse.cmd"
    if not lighthouse_cmd.exists():
        raise LighthouseRunError("Lighthouse CLI is not installed. Run `npm install lighthouse`.")

    chrome_path = _playwright_chromium_path()
    output_path_without_extension = html_path.with_suffix("")
    temp_dir = settings.lighthouse_temp_dir
    temp_dir.mkdir(parents=True, exist_ok=True)
    user_data_dir = temp_dir / f"{html_path.stem}-chrome-profile"
    if user_data_dir.exists():
        shutil.rmtree(user_data_dir, ignore_errors=True)
    command = [
        str(lighthouse_cmd),
        url,
        "--quiet",
        f"--chrome-flags=--headless=new --no-sandbox --disable-gpu --user-data-dir={user_data_dir.resolve()}",
        "--output=html",
        "--output=json",
        f"--output-path={output_path_without_extension}",
        f"--only-categories={only_categories}",
    ]
    if form_factor == "desktop":
        command.append("--preset=desktop")
    else:
        command.append("--form-factor=mobile")
    env = {
        **os.environ,
        "CHROME_PATH": chrome_path,
        "TMP": str(temp_dir.resolve()),
        "TEMP": str(temp_dir.resolve()),
    }
    logger.info("lighthouse cli started url=%s form_factor=%s chrome_path=%s", url, form_factor, chrome_path)
    completed = subprocess.run(
        command,
        cwd=Path.cwd(),
        env=env,
        capture_output=True,
        text=True,
        timeout=settings.lighthouse_timeout_seconds,
    )
    generated_html_path = Path(f"{output_path_without_extension}.report.html")
    generated_json_path = Path(f"{output_path_without_extension}.report.json")
    if generated_html_path.exists():
        generated_html_path.replace(html_path)
    if generated_json_path.exists():
        generated_json_path.replace(json_path)
    if completed.returncode != 0 and not (html_path.exists() and json_path.exists()):
        logger.error("lighthouse cli failed stdout=%s stderr=%s", completed.stdout, completed.stderr)
        raise LighthouseRunError(completed.stderr or completed.stdout or "Lighthouse CLI failed.")
    if completed.returncode != 0:
        logger.warning(
            "lighthouse cli returned non-zero after writing reports stdout=%s stderr=%s",
            completed.stdout,
            completed.stderr,
        )
    if not html_path.exists() or not json_path.exists():
        raise LighthouseRunError("Lighthouse did not create the expected report files.")
    logger.info("lighthouse cli completed html=%s json=%s", html_path, json_path)


def _playwright_chromium_path() -> str:
    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        raise LighthouseRunError(
            "Playwright is required to locate Chromium. Install playwright and run `playwright install chromium`."
        ) from exc

    with sync_playwright() as playwright:
        return playwright.chromium.executable_path


def _read_lighthouse_metadata(json_path: Path) -> dict[str, Any]:
    try:
        data = json.loads(json_path.read_text(encoding="utf-8"))
    except Exception:
        logger.exception("failed to read lighthouse json metadata path=%s", json_path)
        return {}

    categories = data.get("categories", {})
    return {
        "final_url": data.get("finalDisplayedUrl") or data.get("finalUrl"),
        "fetch_time": data.get("fetchTime"),
        "lighthouse_version": data.get("lighthouseVersion"),
        "scores": {
            key: round(value.get("score", 0) * 100)
            for key, value in categories.items()
            if isinstance(value, dict) and isinstance(value.get("score"), (int, float))
        },
    }


def _render_lighthouse_html(html_path: Path, output_path: Path, output_format: ReportFormat) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        raise LighthouseRunError(
            "Playwright is required to render Lighthouse PDF/screenshot outputs."
        ) from exc

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        try:
            page = browser.new_page(viewport={"width": 1440, "height": 1800})
            page.goto(html_path.resolve().as_uri(), wait_until="networkidle")
            if output_format == ReportFormat.pdf:
                page.pdf(path=str(output_path), format="A4", print_background=True)
            else:
                page.screenshot(path=str(output_path), full_page=True)
        finally:
            browser.close()
