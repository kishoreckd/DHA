import asyncio
import html
import json
import logging
import re
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import httpx

from app.core.config import settings
from app.models.cwv import ReportFormat
from app.services.report_paths import report_dir_for_url


logger = logging.getLogger(__name__)

WEBPAGETEST_RESULT_PAGES = [
    ("summary", ""),
    ("details", "1/details/"),
    ("performance-review", "1/performance_optimization/"),
    ("content-breakdown", "1/breakdown/"),
    ("domains", "1/domains/"),
    ("screen-shot", "1/screen_shot/"),
]


class WebPageTestApiError(RuntimeError):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.details = details or {}


class WebPageTestTimeoutError(WebPageTestApiError):
    pass


async def capture_webpagetest_report(
    report_id: str,
    url: str,
    output_format: ReportFormat,
) -> tuple[dict[str, Path], dict[str, Any]]:
    return await asyncio.to_thread(
        _capture_webpagetest_report_sync,
        report_id,
        url,
        output_format,
    )


def _capture_webpagetest_report_sync(
    report_id: str,
    url: str,
    output_format: ReportFormat,
) -> tuple[dict[str, Path], dict[str, Any]]:
    logger.info("webpagetest capture started report_id=%s url=%s output_format=%s", report_id, url, output_format)
    reports_dir = report_dir_for_url("webpagetest", url)
    metadata: dict[str, Any] = {
        "source": "webpagetest_api",
        "base_url": settings.webpagetest_base_url,
        "target_url": url,
        "captured_at": datetime.now(UTC).isoformat(),
        "captures": {},
    }
    paths: dict[str, Path] = {}

    with httpx.Client(timeout=settings.request_timeout_seconds, follow_redirects=True) as client:
        for form_factor in ("desktop", "mobile"):
            form_factor_paths, capture_metadata = _capture_form_factor(
                client=client,
                report_id=report_id,
                target_url=url,
                output_format=output_format,
                reports_dir=reports_dir,
                form_factor=form_factor,
            )
            paths.update(form_factor_paths)
            metadata["captures"][form_factor] = capture_metadata

    metadata["artifact_paths"] = {key: str(path) for key, path in paths.items()}
    logger.info("webpagetest capture completed report_id=%s paths=%s", report_id, metadata["artifact_paths"])
    return paths, metadata


def _capture_form_factor(
    client: httpx.Client,
    report_id: str,
    target_url: str,
    output_format: ReportFormat,
    reports_dir: Path,
    form_factor: str,
) -> tuple[dict[str, Path], dict[str, Any]]:
    logger.info("webpagetest %s test started report_id=%s url=%s", form_factor, report_id, target_url)
    start_payload = _start_test(client, target_url, form_factor)
    test_id = _pick_nested(start_payload, ["data", "testId"])
    if not test_id:
        raise WebPageTestApiError(
            "WebPageTest did not return a test id.",
            {"form_factor": form_factor, "response": start_payload},
        )
    result_payload = _poll_test(client, str(test_id))
    artifact_paths = _save_artifact(
        report_id=report_id,
        form_factor=form_factor,
        output_format=output_format,
        reports_dir=reports_dir,
        start_payload=start_payload,
        result_payload=result_payload,
    )
    artifact_paths = {f"{form_factor}_{key}": path for key, path in artifact_paths.items()}
    primary_path = next(iter(artifact_paths.values()))
    metadata = {
        "form_factor": form_factor,
        "test_id": test_id,
        "report_url": _webpagetest_report_url(str(test_id)),
        "artifact_path": str(primary_path),
        "artifact_paths": {key: str(path) for key, path in artifact_paths.items()},
        "artifact_bytes": primary_path.stat().st_size,
        "summary": _summary(result_payload),
    }
    logger.info("webpagetest %s capture completed report_id=%s paths=%s", form_factor, report_id, metadata["artifact_paths"])
    return artifact_paths, metadata


def _start_test(client: httpx.Client, target_url: str, form_factor: str) -> dict[str, Any]:
    params: dict[str, Any] = {
        "url": target_url,
        "f": "json",
        "runs": settings.webpagetest_runs,
        "fvonly": 1,
    }
    if settings.webpagetest_api_key:
        params["k"] = settings.webpagetest_api_key
    if settings.webpagetest_location:
        params["location"] = settings.webpagetest_location
    if settings.webpagetest_connectivity:
        params["connectivity"] = settings.webpagetest_connectivity
    if form_factor == "mobile":
        params["mobile"] = 1

    response = _request(client, "GET", "runtest.php", params=params)
    payload = _response_json(response)
    status_code = int(payload.get("statusCode") or response.status_code)
    if status_code >= 400:
        raise WebPageTestApiError(
            f"WebPageTest failed to start {form_factor} test: {payload.get('statusText') or response.text[:500]}",
            {"status_code": status_code, "form_factor": form_factor, "response": payload},
        )
    return payload


def _poll_test(client: httpx.Client, test_id: str) -> dict[str, Any]:
    deadline = time.monotonic() + settings.webpagetest_timeout_seconds
    latest_payload: dict[str, Any] | None = None

    while time.monotonic() < deadline:
        response = _request(client, "GET", "jsonResult.php", params={"test": test_id, "f": "json"})
        payload = _response_json(response)
        latest_payload = payload
        status_code = int(payload.get("statusCode") or response.status_code)
        status_text = str(payload.get("statusText") or "")
        if status_code == 200 and payload.get("data"):
            return payload
        if status_code >= 400:
            raise WebPageTestApiError(
                f"WebPageTest test failed: {status_text or response.text[:500]}",
                {"test_id": test_id, "status_code": status_code, "response": payload},
            )
        logger.info("webpagetest test pending test_id=%s status_code=%s status=%s", test_id, status_code, status_text)
        time.sleep(max(1, settings.webpagetest_poll_interval_seconds))

    status_text = str((latest_payload or {}).get("statusText") or "")
    status_code = (latest_payload or {}).get("statusCode")
    raise WebPageTestTimeoutError(
        f"Timed out waiting for WebPageTest to finish. Latest status: {status_text or status_code or 'unknown'}.",
        {
            "test_id": test_id,
            "status_code": status_code,
            "status_text": status_text,
            "report_url": _webpagetest_report_url(test_id),
            "retry_after_seconds": settings.webpagetest_poll_interval_seconds,
            "configured_timeout_seconds": settings.webpagetest_timeout_seconds,
            "fix": "Increase WEBPAGETEST_TIMEOUT_SECONDS in .env, or open report_url later because the test is still queued/running.",
            "latest_response": latest_payload,
        },
    )


def _save_artifact(
    report_id: str,
    form_factor: str,
    output_format: ReportFormat,
    reports_dir: Path,
    start_payload: dict[str, Any],
    result_payload: dict[str, Any],
) -> dict[str, Path]:
    suffix = f"{report_id}-{form_factor}"
    if output_format == ReportFormat.json:
        path = reports_dir / f"{suffix}.json"
        path.write_text(json.dumps({"start": start_payload, "result": result_payload}, indent=2), encoding="utf-8")
        return {"json": path}

    test_id = str(_pick_nested(start_payload, ["data", "testId"]) or result_payload.get("data", {}).get("id"))
    if output_format == ReportFormat.html:
        return _save_rendered_result_pages(test_id, suffix, reports_dir)

    if output_format == ReportFormat.pdf:
        output_path = reports_dir / f"{suffix}.pdf"
    elif output_format == ReportFormat.screenshot:
        output_path = reports_dir / f"{suffix}.png"
    else:
        return _save_rendered_result_pages(test_id, suffix, reports_dir)
    _render_live_result_artifact(test_id, output_path, output_format)
    return {output_format.value: output_path}


def _save_rendered_result_pages(test_id: str, suffix: str, reports_dir: Path) -> dict[str, Path]:
    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        raise WebPageTestApiError(
            "Playwright is required to save WebPageTest HTML result pages."
        ) from exc

    page_paths = {
        page_key: reports_dir / f"{suffix}-{page_key}.html"
        for page_key, _ in WEBPAGETEST_RESULT_PAGES
    }
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        try:
            page = browser.new_page(viewport={"width": 1440, "height": 1800})
            page.set_default_timeout(settings.webpagetest_render_timeout_seconds * 1000)
            for page_key, page_path in WEBPAGETEST_RESULT_PAGES:
                url = _webpagetest_result_page_url(test_id, page_path)
                logger.info("webpagetest rendered html save started url=%s", url)
                page.goto(url, wait_until="domcontentloaded")
                content = _prepare_saved_webpagetest_html(page.content(), test_id, page_paths)
                page_paths[page_key].write_text(content, encoding="utf-8")
                logger.info("webpagetest rendered html saved path=%s", page_paths[page_key])
        finally:
            browser.close()
    return {page_key: page_path for page_key, page_path in page_paths.items()}


def _render_live_result_artifact(test_id: str, output_path: Path, output_format: ReportFormat) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        raise WebPageTestApiError(
            "Playwright is required to render WebPageTest PDF/screenshot outputs."
        ) from exc

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        try:
            page = browser.new_page(viewport={"width": 1440, "height": 1800})
            page.goto(_webpagetest_report_url(test_id), wait_until="networkidle")
            if output_format == ReportFormat.pdf:
                page.pdf(path=str(output_path), format="A4", print_background=True)
            else:
                page.screenshot(path=str(output_path), full_page=True)
        finally:
            browser.close()


def _webpagetest_result_page_url(test_id: str, page_path: str) -> str:
    return _absolute_url(f"result/{test_id}/{page_path}")


def _prepare_saved_webpagetest_html(content: str, test_id: str, page_paths: dict[str, Path]) -> str:
    content = _absolute_root_relative_links(content)
    for page_key, page_path in sorted(WEBPAGETEST_RESULT_PAGES, key=lambda item: len(item[1]), reverse=True):
        local_uri = page_paths[page_key].name
        live_url = _webpagetest_result_page_url(test_id, page_path)
        content = content.replace(live_url, local_uri)
        content = content.replace(live_url.rstrip("/"), local_uri)
        content = content.replace(f"/result/{test_id}/{page_path}", local_uri)
        content = content.replace(f"/result/{test_id}/{page_path}".rstrip("/"), local_uri)
    return content


def _absolute_root_relative_links(content: str) -> str:
    base_url = settings.webpagetest_base_url.rstrip("/")
    content = re.sub(r'((?:href|src|action)=["\'])/(?!/)', rf"\1{base_url}/", content)
    return re.sub(r"url\(/(?!/)", f"url({base_url}/", content)


def _summary(result_payload: dict[str, Any]) -> dict[str, Any]:
    data = result_payload.get("data", {})
    first_view = _first_view(data)
    return {
        "url": data.get("url"),
        "final_url": first_view.get("URL") or first_view.get("final_url"),
        "load_time": _format_ms(first_view.get("loadTime")),
        "first_contentful_paint": _format_ms(first_view.get("firstContentfulPaint")),
        "largest_contentful_paint": _format_ms(first_view.get("chromeUserTiming.LargestContentfulPaint") or first_view.get("largestContentfulPaint")),
        "cumulative_layout_shift": _format_number(first_view.get("chromeUserTiming.CumulativeLayoutShift") or first_view.get("cumulativeLayoutShift")),
        "total_blocking_time": _format_ms(first_view.get("TotalBlockingTime") or first_view.get("totalBlockingTime")),
        "speed_index": _format_ms(first_view.get("SpeedIndex")),
        "time_to_first_byte": _format_ms(first_view.get("TTFB")),
        "requests": first_view.get("requests"),
        "bytes_in": _format_bytes(first_view.get("bytesIn")),
        "dom_content_loaded": _format_ms(first_view.get("domContentLoadedEventStart")),
        "fully_loaded": _format_ms(first_view.get("fullyLoaded")),
        "render": _format_ms(first_view.get("render")),
        "visual_complete": _format_ms(first_view.get("visualComplete")),
    }


def _first_view(data: dict[str, Any]) -> dict[str, Any]:
    runs = data.get("runs")
    if isinstance(runs, dict) and runs:
        first_run = runs.get("1") or next(iter(runs.values()))
        if isinstance(first_run, dict) and isinstance(first_run.get("firstView"), dict):
            return first_run["firstView"]
    median = data.get("median")
    if isinstance(median, dict) and isinstance(median.get("firstView"), dict):
        return median["firstView"]
    return {}


def _flatten_first_view(data: dict[str, Any]) -> dict[str, Any]:
    picked: dict[str, Any] = {}
    for key in (
        "loadTime",
        "TTFB",
        "render",
        "firstContentfulPaint",
        "SpeedIndex",
        "visualComplete",
        "fullyLoaded",
        "bytesIn",
        "requests",
        "chromeUserTiming.LargestContentfulPaint",
        "chromeUserTiming.CumulativeLayoutShift",
        "TotalBlockingTime",
    ):
        if key in data:
            picked[key] = data[key]
    return picked


def _grade_box(score: Any, label: str, check: bool = False) -> str:
    grade = _score_grade(score, check)
    css_class = "bad" if grade in {"D", "F"} else "warn" if grade == "C" else ""
    display = "&#10003;" if grade == "CHECK" else _escape(grade)
    return f'<div class="grade"><div class="tile {css_class}">{display}</div><div class="grade-label">{label}</div></div>'


def _score_grade(score: Any, check: bool = False) -> str:
    number = _number(score)
    if number is None or number < 0:
        return "N/A"
    if check and number >= 80:
        return "CHECK"
    if number >= 90:
        return "A"
    if number >= 80:
        return "B"
    if number >= 70:
        return "C"
    if number >= 60:
        return "D"
    return "F"


def _image_or_link(url: Any, label: str) -> str:
    if not url:
        return f'<p class="muted">{_escape(label)} not returned.</p>'
    return f'<a href="{_escape(url)}"><img src="{_escape(url)}" alt="{_escape(label)}"></a>'


def _location_label(data: dict[str, Any]) -> str:
    location = data.get("location") or data.get("locationName") or data.get("from")
    return str(location or "WebPageTest")


def _browser_label(data: dict[str, Any], form_factor: str) -> str:
    browser = data.get("browser_name") or data.get("browser") or "Chrome"
    if form_factor == "mobile":
        return f"{browser} - Mobile"
    return str(browser)


def _date_label(data: dict[str, Any]) -> str:
    completed = data.get("completed") or data.get("completedTime") or data.get("date")
    return str(completed or datetime.now(UTC).strftime("%m/%d/%Y, %I:%M:%S %p"))


def _seconds(value: Any) -> str:
    number = _number(value)
    if number is None:
        return ""
    return f"{number / 1000:.3f}s"


def _summary_card(label: str, value: Any) -> str:
    return f'<div class="card"><div class="label">{_escape(label)}</div><div class="value">{_escape(value or "N/A")}</div></div>'


def _table(data: dict[str, Any]) -> str:
    if not data:
        return '<p class="muted">No data returned.</p>'
    rows = "\n".join(
        f"<tr><th>{_escape(str(key).replace('_', ' ').title())}</th><td>{_escape(value)}</td></tr>"
        for key, value in data.items()
        if value is not None
    )
    return f"<table>{rows}</table>" if rows else '<p class="muted">No data returned.</p>'


def _pick(data: dict[str, Any], keys: list[str]) -> dict[str, Any]:
    return {key: data.get(key) for key in keys if key in data}


def _pick_nested(data: dict[str, Any] | None, keys: list[str]) -> Any:
    current: Any = data
    for key in keys:
        if isinstance(current, dict):
            current = current.get(key)
        else:
            return None
    return current


def _format_ms(value: Any) -> str | None:
    number = _number(value)
    if number is None:
        return None
    if number >= 1000:
        return f"{number / 1000:.1f}s"
    return f"{round(number)}ms"


def _format_number(value: Any) -> str | None:
    number = _number(value)
    if number is None:
        return None
    return f"{number:.3f}".rstrip("0").rstrip(".")


def _format_bytes(value: Any) -> str | None:
    number = _number(value)
    if number is None:
        return None
    if number >= 1024 * 1024:
        return f"{number / (1024 * 1024):.2f}MB"
    if number >= 1024:
        return f"{number / 1024:.1f}KB"
    return f"{round(number)}B"


def _number(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip().replace(",", ""))
        except ValueError:
            return None
    return None


def _escape(value: Any) -> str:
    return html.escape("" if value is None else str(value))


def _webpagetest_report_url(test_id: str) -> str:
    return _absolute_url(f"result/{test_id}/")


def _request(client: httpx.Client, method: str, path: str, **kwargs: Any) -> httpx.Response:
    try:
        return client.request(method, _absolute_url(path), **kwargs)
    except httpx.RequestError as exc:
        raise WebPageTestApiError(
            f"WebPageTest request failed: {exc}",
            {"request_url": str(exc.request.url)},
        ) from exc


def _absolute_url(path: str) -> str:
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return urljoin(settings.webpagetest_base_url.rstrip("/") + "/", path.lstrip("/"))


def _response_json(response: httpx.Response) -> dict[str, Any]:
    try:
        return response.json()
    except ValueError as exc:
        raise WebPageTestApiError(
            "WebPageTest response was not JSON.",
            {
                "status_code": response.status_code,
                "request_url": str(response.url),
                "body": response.text[:2000],
            },
        ) from exc
