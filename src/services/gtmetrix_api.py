import asyncio
import base64
import html
import json
import logging
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import httpx

from app.core.config import settings
from app.models.cwv import ReportFormat
from app.services.report_paths import report_dir_for_url


logger = logging.getLogger(__name__)


class GTmetrixApiError(RuntimeError):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.details = details or {}


async def capture_gtmetrix_api_report(
    report_id: str,
    url: str,
    output_format: ReportFormat,
) -> tuple[dict[str, Path], dict[str, Any]]:
    return await asyncio.to_thread(
        _capture_gtmetrix_api_report_sync,
        report_id,
        url,
        output_format,
    )


def _capture_gtmetrix_api_report_sync(
    report_id: str,
    url: str,
    output_format: ReportFormat,
) -> tuple[dict[str, Path], dict[str, Any]]:
    if not settings.gtmetrix_api_key:
        raise GTmetrixApiError(
            "GTmetrix API requires GTMETRIX_API_KEY in .env.",
            {"missing_env": "GTMETRIX_API_KEY"},
        )

    reports_dir = report_dir_for_url("gtmetrix", url)
    metadata: dict[str, Any] = {
        "source": "gtmetrix_api",
        "target_url": url,
        "captured_at": datetime.now(UTC).isoformat(),
        "captures": {},
    }
    paths: dict[str, Path] = {}

    with httpx.Client(
        auth=(settings.gtmetrix_api_key, ""),
        timeout=settings.request_timeout_seconds,
        follow_redirects=False,
    ) as client:
        path, capture_metadata = _capture_desktop_report(
            client=client,
            report_id=report_id,
            target_url=url,
            output_format=output_format,
            reports_dir=reports_dir,
        )
        paths["desktop"] = path
        metadata["captures"]["desktop"] = capture_metadata

    metadata["artifact_paths"] = {key: str(path) for key, path in paths.items()}
    logger.info("gtmetrix api capture completed report_id=%s paths=%s", report_id, metadata["artifact_paths"])
    return paths, metadata


def _capture_desktop_report(
    client: httpx.Client,
    report_id: str,
    target_url: str,
    output_format: ReportFormat,
    reports_dir: Path,
) -> tuple[Path, dict[str, Any]]:
    logger.info("gtmetrix api desktop test started report_id=%s url=%s", report_id, target_url)
    test = _start_test(client, target_url)
    test_id = test["data"]["id"]
    completed_test = _poll_test(client, test_id)
    report_id_from_api = completed_test["data"].get("attributes", {}).get("report")
    report_url = completed_test["data"].get("links", {}).get("report")
    if not report_id_from_api and report_url:
        report_id_from_api = report_url.rstrip("/").split("/")[-1]
    if not report_id_from_api:
        raise GTmetrixApiError(
            "GTmetrix test completed without a report id.",
            {"test_id": test_id, "form_factor": "desktop", "test": completed_test},
        )

    report = _get_report(client, report_id_from_api)
    resources = _get_report_resources(client, report_id_from_api)
    path = _save_artifact(
        client=client,
        report_id=report_id,
        report=report,
        resources=resources,
        output_format=output_format,
        reports_dir=reports_dir,
    )
    capture_metadata = {
        "form_factor": "desktop",
        "test_id": test_id,
        "gtmetrix_report_id": report_id_from_api,
        "report_url": report_url,
        "artifact_path": str(path),
        "artifact_bytes": path.stat().st_size,
        "summary": _report_summary(report),
        "resources": _resource_metadata(resources),
    }
    logger.info("gtmetrix api desktop capture completed report_id=%s path=%s", report_id, path)
    return path, capture_metadata


def _start_test(client: httpx.Client, target_url: str) -> dict[str, Any]:
    attributes: dict[str, Any] = {
        "url": target_url,
        "report": settings.gtmetrix_report_type,
    }
    if settings.gtmetrix_location_id:
        attributes["location"] = settings.gtmetrix_location_id
    if settings.gtmetrix_browser_id:
        attributes["browser"] = settings.gtmetrix_browser_id

    attributes.update({"browser_width": 1366, "browser_height": 768, "browser_dppx": 1})

    response = _request(
        client,
        "POST",
        "tests",
        json={"data": {"type": "test", "attributes": attributes}},
        headers={"Content-Type": "application/vnd.api+json"},
    )
    if response.status_code not in (200, 201, 202):
        raise _api_error("GTmetrix failed to start test.", response, {"request_attributes": attributes, "form_factor": "desktop"})
    return _response_json(response)


def _poll_test(client: httpx.Client, test_id: str) -> dict[str, Any]:
    deadline = time.monotonic() + settings.gtmetrix_timeout_seconds
    latest_payload: dict[str, Any] | None = None

    while time.monotonic() < deadline:
        response = _request(client, "GET", f"tests/{test_id}")
        if response.status_code == 303:
            location = response.headers.get("Location", "")
            report_id = location.rstrip("/").split("/")[-1]
            payload = latest_payload or {"data": {"type": "test", "id": test_id, "attributes": {}}}
            if report_id:
                payload.setdefault("data", {}).setdefault("attributes", {})["report"] = report_id
                payload.setdefault("data", {}).setdefault("links", {})["report"] = _absolute_url(location)
            return payload
        if response.status_code != 200:
            raise _api_error("GTmetrix test polling failed.", response)

        latest_payload = _response_json(response)
        attributes = latest_payload.get("data", {}).get("attributes", {})
        state = attributes.get("state")
        if state == "completed":
            return latest_payload
        if state == "error":
            raise GTmetrixApiError(
                f"GTmetrix test failed: {attributes.get('error') or 'unknown error'}",
                {"test_id": test_id, "state": state, "test": latest_payload},
            )

        retry_after = response.headers.get("Retry-After")
        delay = int(retry_after) if retry_after and retry_after.isdigit() else settings.gtmetrix_poll_interval_seconds
        time.sleep(max(1, delay))

    raise GTmetrixApiError(
        "Timed out waiting for GTmetrix API test to finish.",
        {"test_id": test_id, "latest_test": latest_payload},
    )


def _get_report(client: httpx.Client, report_id: str) -> dict[str, Any]:
    response = _request(client, "GET", f"reports/{report_id}")
    if response.status_code != 200:
        raise _api_error("GTmetrix failed to fetch report.", response)
    return _response_json(response)


def _save_artifact(
    client: httpx.Client,
    report_id: str,
    report: dict[str, Any],
    resources: dict[str, Any],
    output_format: ReportFormat,
    reports_dir: Path,
) -> Path:
    suffix = f"{report_id}-desktop"
    api_report_id = report["data"]["id"]
    if output_format == ReportFormat.json:
        path = reports_dir / f"{suffix}.json"
        path.write_text(json.dumps({"report": report, "resources": resources}, indent=2), encoding="utf-8")
        return path
    if output_format == ReportFormat.pdf:
        path = reports_dir / f"{suffix}.pdf"
        path.write_bytes(_get_report_resource(client, api_report_id, "report.pdf"))
        return path
    if output_format == ReportFormat.screenshot:
        path = reports_dir / f"{suffix}.jpg"
        path.write_bytes(_get_report_resource(client, api_report_id, "screenshot.jpg"))
        return path

    path = reports_dir / f"{suffix}.html"
    path.write_text(_render_report_html(report, resources), encoding="utf-8")
    return path


def _get_report_resources(client: httpx.Client, report_id: str) -> dict[str, Any]:
    resources: dict[str, Any] = {}
    for key, resource_name in {
        "analysis_options": "analysis-options",
        "resource_summary": "resource-summary.json",
        "lighthouse": "lighthouse.json",
        "filmstrip": "filmstrip.json",
        "waterfall": "net.har",
    }.items():
        resources[key] = _get_optional_json_resource(client, report_id, resource_name)
    resources["screenshot"] = _get_optional_binary_resource(client, report_id, "screenshot.jpg", "image/jpeg")
    return resources


def _get_optional_json_resource(client: httpx.Client, report_id: str, resource_name: str) -> dict[str, Any]:
    try:
        payload = _get_report_resource(client, report_id, resource_name)
        return {"available": True, "data": json.loads(payload.decode("utf-8"))}
    except Exception as exc:
        logger.warning("gtmetrix resource unavailable report_id=%s resource=%s error=%s", report_id, resource_name, exc)
        return {"available": False, "error": str(exc)}


def _get_optional_binary_resource(
    client: httpx.Client,
    report_id: str,
    resource_name: str,
    mime_type: str,
) -> dict[str, Any]:
    try:
        payload = _get_report_resource(client, report_id, resource_name)
        return {
            "available": True,
            "mime_type": mime_type,
            "base64": base64.b64encode(payload).decode("ascii"),
            "bytes": len(payload),
        }
    except Exception as exc:
        logger.warning("gtmetrix binary resource unavailable report_id=%s resource=%s error=%s", report_id, resource_name, exc)
        return {"available": False, "error": str(exc)}


def _get_report_resource(client: httpx.Client, report_id: str, resource_name: str) -> bytes:
    response = _request(client, "GET", f"reports/{report_id}/resources/{resource_name}", follow_redirects=True)
    if response.status_code != 200:
        raise _api_error(f"GTmetrix failed to fetch report resource {resource_name}.", response)
    return response.content


def _render_report_html(report: dict[str, Any], resources: dict[str, Any]) -> str:
    summary = _report_summary(report)
    attrs = report.get("data", {}).get("attributes", {})
    links = report.get("data", {}).get("links", {})
    lighthouse = _resource_data(resources, "lighthouse")
    resource_summary = _resource_data(resources, "resource_summary")
    filmstrip = _resource_data(resources, "filmstrip")
    waterfall = _resource_data(resources, "waterfall")
    analysis_options = _resource_data(resources, "analysis_options")
    screenshot = resources.get("screenshot", {})
    report_json = html.escape(json.dumps({"report": report, "resources": resources}, indent=2))
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>GTmetrix Desktop Report</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 0; color: #555; background: #fff; }}
    .page {{ max-width: 1040px; margin: 0 auto; padding: 58px 36px 42px; }}
    header {{ background: #fff; border-bottom: 1px solid #cfd7dd; box-shadow: 0 3px 6px rgba(0,0,0,.24); padding: 0 0 22px; margin-bottom: 64px; }}
    .brand {{ color: #5ca5df; font-size: 34px; font-weight: 700; letter-spacing: -1px; }}
    main {{ padding: 0; }}
    h1 {{ margin: 0 0 8px; font-size: 30px; line-height: 1.08; color: #1b5f93; font-weight: 500; }}
    h2 {{ margin: 0 0 18px; color: #666; font-weight: 500; }}
    h3 {{ margin: 22px 0 10px; }}
    a {{ color: #1268a8; }}
    .report-hero {{ display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 48px; align-items: center; margin-bottom: 34px; }}
    .hero-shot {{ width: 100%; max-width: 320px; border-radius: 4px; box-shadow: 0 1px 5px rgba(0,0,0,.25); }}
    .hero-placeholder {{ width: 100%; max-width: 320px; min-height: 160px; background: #eef2f5; border: 1px solid #d8dee4; display: flex; align-items: center; justify-content: center; color: #8b969e; }}
    .report-meta {{ margin-top: 26px; font-size: 14px; line-height: 1.7; }}
    .report-meta-label {{ display: inline-block; width: 145px; text-align: right; color: #777; margin-right: 8px; }}
    .score-row {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0 48px; }}
    .score-title {{ color: #1b5f93; font-size: 22px; margin: 0 0 8px; }}
    .score-box {{ display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,.14); overflow: hidden; background: #fff; }}
    .score-cell {{ min-height: 86px; padding: 16px 18px; border-left: 1px solid #e1e5e8; }}
    .score-cell:first-child {{ border-left: 0; }}
    .score-label {{ color: #777; font-size: 14px; margin-bottom: 6px; }}
    .score-value {{ color: #25a525; font-size: 34px; line-height: 1; }}
    .score-value.warn {{ color: #ad6e16; }}
    .score-value.bad {{ color: #a8453f; }}
    .tabs {{ display: block; margin-bottom: 22px; border-top: 1px solid #cfd7dd; }}
    .tabs a {{ display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #fff; border-bottom: 1px solid #cfd7dd; text-decoration: none; color: #666; font-size: 18px; }}
    .tabs a::after {{ content: ""; width: 14px; height: 14px; background: #777; }}
    .tabs a:first-child {{ color: #1683d8; border-bottom: 2px solid #1683d8; }}
    .tabs a:first-child::after {{ background: #3498db; }}
    section {{ background: #fff; border: 0; padding: 0 24px 30px; margin-bottom: 34px; }}
    table {{ border-collapse: collapse; width: 100%; margin: 12px 0 22px; }}
    th, td {{ border-bottom: 1px solid #e1e5e8; padding: 10px 12px; text-align: left; vertical-align: top; }}
    th {{ background: #f7f9fa; width: 270px; }}
    .cards {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin: 18px 0; }}
    .card {{ background: #f7f9fa; border: 1px solid #dde3e7; padding: 16px; }}
    .metric {{ font-size: 28px; font-weight: 700; margin-top: 6px; }}
    .muted {{ color: #60717c; font-size: 13px; }}
    .screenshot {{ max-width: 100%; border: 1px solid #d8dee4; }}
    .filmstrip {{ display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; }}
    .frame {{ min-width: 160px; background: #f7f9fa; border: 1px solid #dde3e7; padding: 8px; }}
    .frame img {{ width: 160px; display: block; }}
    .waterfall-toolbar {{ display: flex; flex-wrap: wrap; gap: 8px; align-items: center; background: #e7ecef; padding: 10px; margin: 18px 0; }}
    .waterfall-toolbar input {{ min-width: 360px; padding: 10px 12px; border: 1px solid #cfd7dd; font-size: 15px; }}
    .waterfall-toolbar button, .waterfall-actions a {{ border: 0; background: #3698d9; color: #fff; padding: 10px 16px; font-size: 15px; text-decoration: none; }}
    .waterfall-toolbar button:first-of-type {{ background: #096a9f; }}
    .waterfall-actions {{ float: right; display: flex; gap: 8px; margin-top: -6px; }}
    .waterfall-actions a:first-child {{ background: #666; }}
    .waterfall-chart {{ border: 1px solid #d8dee4; overflow: auto; max-height: 680px; background: #fff; }}
    .waterfall-grid {{ min-width: 1180px; }}
    .waterfall-head, .waterfall-row {{ display: grid; grid-template-columns: 36px 230px 70px 170px 85px 1fr; align-items: center; }}
    .waterfall-head {{ position: sticky; top: 0; z-index: 5; background: #f7f9fa; font-weight: 700; border-bottom: 1px solid #cfd7dd; }}
    .waterfall-head div, .waterfall-row div {{ padding: 7px 8px; border-bottom: 1px solid #edf0f2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
    .waterfall-row:nth-child(even) {{ background: #fcfcfc; }}
    .wf-plus {{ color: #999; font-weight: 700; text-align: center; }}
    .wf-status {{ color: #777; }}
    .timeline {{ position: relative; height: 28px; padding: 0 !important; overflow: visible !important; }}
    .wf-bar {{ position: absolute; top: 7px; height: 14px; min-width: 2px; border-left: 3px solid #5e9bea; background: rgba(90, 156, 234, .2); }}
    .wf-wait {{ background: rgba(156, 125, 80, .22); border-left-color: #aa8b59; }}
    .wf-receive {{ background: rgba(80, 164, 93, .22); border-left-color: #50a45d; }}
    .wf-label {{ position: absolute; left: calc(100% + 4px); top: -2px; font-size: 12px; color: #555; }}
    .wf-marker {{ position: absolute; top: 0; bottom: 0; width: 1px; background: #8a9cff; opacity: .75; }}
    .wf-marker.pink {{ background: #d85ba8; }}
    .crux-head {{ display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; min-width: 0; }}
    .crux-head h2 {{ margin-bottom: 6px; }}
    .crux-head > div:first-child {{ min-width: 0; }}
    .crux-period {{ flex: 0 0 250px; text-align: right; }}
    .crux-help {{ display: inline-block; background: #e1e4e7; border-radius: 4px; padding: 0 6px; color: #666; font-size: 14px; }}
    .crux-note {{ color: #5d6670; margin: 10px 0 28px; font-size: 16px; }}
    .crux-banner {{ display: flex; align-items: center; justify-content: space-between; gap: 16px; background: #fde8e8; padding: 18px; margin: 24px 0 28px; border-radius: 4px; min-width: 0; }}
    .crux-banner.pass {{ background: #eaf7ea; }}
    .crux-banner-main {{ display: flex; align-items: center; gap: 16px; font-size: 20px; min-width: 0; }}
    .crux-status-icon {{ width: 38px; height: 38px; border-radius: 50%; background: #d62f2f; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 26px; }}
    .crux-banner.pass .crux-status-icon {{ background: #2faa2a; }}
    .crux-banner .failed {{ color: #e53935; }}
    .crux-banner.pass .failed {{ color: #2faa2a; }}
    .crux-result {{ display: flex; align-items: center; gap: 12px; font-size: 18px; min-width: 0; }}
    .crux-result a {{ overflow-wrap: anywhere; }}
    .crux-toggle {{ border: 1px solid #cfd7dd; background: #fff; padding: 6px; white-space: nowrap; border-radius: 3px; }}
    .crux-toggle span {{ padding: 7px 11px; }}
    .crux-toggle .active {{ background: #3498db; color: #fff; border-radius: 3px; }}
    .crux-card-grid {{ display: grid; grid-template-columns: 1fr; gap: 22px; margin: 26px 0 42px; }}
    .crux-card {{ display: grid; grid-template-columns: minmax(0, 1fr) 118px; border-left: 0; background: #fff; box-shadow: 0 4px 14px rgba(0,0,0,.12); min-height: 170px; min-width: 0; overflow: hidden; border-radius: 3px; }}
    .crux-card.pass {{ border-left-color: #4fc18f; }}
    .crux-card.improve {{ border-left-color: #f4a629; }}
    .crux-card.fail {{ border-left-color: #e53935; }}
    .crux-card-main {{ padding: 24px 18px 14px 22px; min-width: 0; }}
    .crux-card-score {{ display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; }}
    .crux-card.improve .crux-card-score {{ background: #fff1db; }}
    .crux-card.fail .crux-card-score {{ background: #fde8e8; }}
    .crux-pill {{ align-self: stretch; text-align: center; color: #aaa; padding: 8px; background: #fff; font-weight: 400; }}
    .crux-card.improve .crux-pill {{ background: #fff; color: #aaa; }}
    .crux-card.fail .crux-pill {{ background: #fff; color: #aaa; }}
    .crux-value {{ font-size: 26px; margin: auto 0; color: #1f9f1c; }}
    .crux-card.improve .crux-value {{ color: #f39c12; }}
    .crux-card.fail .crux-value {{ color: #d93025; }}
    .crux-metric-title {{ font-size: 20px; color: #5a5f66; margin-bottom: 10px; overflow-wrap: anywhere; }}
    .crux-bar {{ position: relative; height: 3px; background: #edf0f2; margin: 14px 0 10px; }}
    .crux-dot {{ display: none; }}
    .crux-card.improve .crux-dot {{ background: #ffa726; }}
    .crux-card.fail .crux-dot {{ background: #e53935; }}
    .crux-comparison {{ color: #6e7378; }}
    .crux-comparison .good {{ color: #27a827; }}
    .crux-comparison .bad {{ color: #e53935; }}
    .crux-history {{ margin-top: 18px; border-top: 1px solid #e7eaed; padding-top: 12px; color: #777; }}
    .crux-sparks {{ display: none; gap: 4px; margin-top: 14px; align-items: end; overflow: hidden; }}
    .crux-sparks span {{ display: block; width: 12px; height: 38px; background: #cfcfcf; flex: 0 0 12px; }}
    .crux-sparks .green {{ background: #2faa2a; }}
    .crux-sparks .orange {{ background: #ffa726; }}
    .crux-sparks .red {{ background: #e85454; }}
    .crux-separator {{ border: none; border-top: 1px solid #e1e5e8; margin: 32px 0; }}
    @media (max-width: 900px) {{
      main {{ padding: 18px 14px 36px; }}
      .page {{ padding: 28px 14px; }}
      .report-hero, .score-row {{ grid-template-columns: 1fr; }}
      .crux-head, .crux-banner, .crux-result {{ flex-direction: column; align-items: flex-start; }}
      .crux-period {{ flex: initial; text-align: left; }}
      .crux-card {{ grid-template-columns: minmax(0, 1fr) 96px; }}
      .crux-value {{ font-size: 22px; }}
    }}
    pre {{ background: #101820; color: #d8f3dc; padding: 16px; overflow: auto; max-height: 620px; }}
  </style>
</head>
<body>
<div class="page">
  <header>
    <div class="brand">GTmetrix</div>
  </header>
  <main>
    <div class="report-hero">
      {_hero_screenshot_html(screenshot)}
      <div>
        <h1>Latest Performance Report for:<br>{_escape(attrs.get("url"))}</h1>
        <div class="report-meta">
          <div><span class="report-meta-label">Report generated:</span>{_escape(_format_report_datetime(attrs.get("created")))}</div>
          <div><span class="report-meta-label">Test Server Location:</span>{_escape(_server_location(resources))}</div>
          <div><span class="report-meta-label">Using:</span>{_escape(_browser_label(resources))}</div>
          <div><span class="report-meta-label">Report ID:</span>{_escape(report.get("data", {}).get("id"))}</div>
          {_report_link(links)}
        </div>
      </div>
    </div>
    {_score_overview(summary)}
    <nav class="tabs">
      <a href="#summary">Summary</a>
      <a href="#performance">Performance</a>
      <a href="#structure">Structure</a>
      <a href="#crux">CrUX</a>
      <a href="#waterfall">Waterfall</a>
      <a href="#video">Video</a>
      <a href="#history">History</a>
      <a href="#alerts">Alerts</a>
      <a href="#raw">Raw Data</a>
    </nav>
    <section id="summary">
      <h2>Summary</h2>
      {_summary_cards(summary)}
      {_screenshot_html(screenshot)}
      {_table(summary)}
      <h3>Page Details</h3>
      {_table(_pick(attrs, ["html_bytes", "page_bytes", "page_requests", "redirect_duration", "connect_duration", "backend_duration", "time_to_first_byte", "dom_interactive_time", "dom_content_loaded_time", "onload_time", "fully_loaded_time"]))}
    </section>
    <section id="performance">
      <h2>Performance</h2>
      {_table(_pick(attrs, ["performance_score", "first_contentful_paint", "largest_contentful_paint", "speed_index", "total_blocking_time", "cumulative_layout_shift", "time_to_interactive", "fully_loaded_time"]))}
      {_lighthouse_categories(lighthouse)}
      {_lighthouse_audits(lighthouse, "performance")}
    </section>
    <section id="structure">
      <h2>Structure</h2>
      {_table(_pick(attrs, ["structure_score", "gtmetrix_score", "page_requests", "page_bytes", "html_bytes"]))}
      {_lighthouse_audits(lighthouse, "structure")}
    </section>
    <section id="crux">
      {_crux_html(lighthouse, attrs)}
    </section>
    <section id="waterfall">
      <h2>Waterfall</h2>
      {_waterfall_chart(waterfall, resource_summary)}
    </section>
    <section id="video">
      <h2>Video / Speed Visualization</h2>
      {_filmstrip_html(filmstrip)}
    </section>
    <section id="history">
      <h2>History</h2>
      <p class="muted">GTmetrix history is account/report UI data and is not returned in this report payload.</p>
    </section>
    <section id="alerts">
      <h2>Alerts</h2>
      {_alerts_html(lighthouse)}
    </section>
    <section id="raw">
      <h2>Raw Data</h2>
      <h3>Analysis Options</h3>
      {_json_or_empty(analysis_options, "No analysis options returned.")}
      <h3>Complete API Payload</h3>
      <pre>{report_json}</pre>
    </section>
  </main>
</div>
</body>
</html>"""


def _escape(value: Any) -> str:
    return html.escape("" if value is None else str(value))


def _table(data: dict[str, Any]) -> str:
    if not data:
        return '<p class="muted">No data returned.</p>'
    rows = "\n".join(
        f"<tr><th>{_escape(str(key).replace('_', ' ').title())}</th><td>{_escape(value)}</td></tr>"
        for key, value in data.items()
    )
    return f"<table>{rows}</table>"


def _pick(data: dict[str, Any], keys: list[str]) -> dict[str, Any]:
    return {key: data.get(key) for key in keys if key in data}


def _pick_nested(data: dict[str, Any] | None, keys: list[str]) -> Any:
    current: Any = data
    for key in keys:
        if isinstance(current, dict):
            current = current.get(key)
        elif isinstance(current, list) and isinstance(key, int) and 0 <= key < len(current):
            current = current[key]
        else:
            return None
    return current


def _resource_data(resources: dict[str, Any], key: str) -> Any:
    resource = resources.get(key, {})
    if isinstance(resource, dict) and resource.get("available"):
        return resource.get("data")
    return None


def _resource_metadata(resources: dict[str, Any]) -> dict[str, Any]:
    metadata: dict[str, Any] = {}
    for key, value in resources.items():
        if isinstance(value, dict):
            metadata[key] = {
                "available": value.get("available", False),
                "bytes": value.get("bytes"),
                "error": value.get("error"),
            }
    return metadata


def _report_link(links: dict[str, Any]) -> str:
    report_url = links.get("report_url")
    if not report_url:
        return ""
    return f'<div><a href="{_escape(report_url)}">Open GTmetrix report</a></div>'


def _hero_screenshot_html(screenshot: dict[str, Any]) -> str:
    if not screenshot.get("available"):
        return '<div class="hero-placeholder">Screenshot unavailable</div>'
    src = f"data:{screenshot.get('mime_type', 'image/jpeg')};base64,{screenshot.get('base64', '')}"
    return f'<img class="hero-shot" src="{src}" alt="GTmetrix screenshot">'


def _score_overview(summary: dict[str, Any]) -> str:
    performance = _score_percent(summary.get("performance_score"))
    structure = _score_percent(summary.get("structure_score"))
    return f"""
      <div class="score-row">
        <div>
          <div class="score-title">GTmetrix Grade</div>
          <div class="score-box">
            <div class="score-cell"><div class="score-label">Grade</div><div class="score-value {_score_class(summary.get('gtmetrix_grade'))}">{_escape(summary.get('gtmetrix_grade') or '-')}</div></div>
            <div class="score-cell"><div class="score-label">Performance</div><div class="score-value {_score_class(performance)}">{_escape(_score_text(performance))}</div></div>
            <div class="score-cell"><div class="score-label">Structure</div><div class="score-value {_score_class(structure)}">{_escape(_score_text(structure))}</div></div>
          </div>
        </div>
        <div>
          <div class="score-title">Web Vitals</div>
          <div class="score-box">
            <div class="score-cell"><div class="score-label">LCP</div><div class="score-value {_vital_class(_number(summary.get('largest_contentful_paint')), 2500, 4000)}">{_escape(_crux_display(_number(summary.get('largest_contentful_paint')), 'ms'))}</div></div>
            <div class="score-cell"><div class="score-label">TBT</div><div class="score-value {_vital_class(_number(summary.get('total_blocking_time')), 200, 500)}">{_escape(_crux_display(_number(summary.get('total_blocking_time')), 'ms'))}</div></div>
            <div class="score-cell"><div class="score-label">CLS</div><div class="score-value {_vital_class(_number(summary.get('cumulative_layout_shift')), 0.1, 0.25)}">{_escape(_crux_display(_number(summary.get('cumulative_layout_shift')), 'score'))}</div></div>
          </div>
        </div>
      </div>
    """


def _score_percent(value: Any) -> float | None:
    number = _number(value)
    if number is None:
        return None
    return number * 100 if number <= 1 else number


def _score_text(value: float | None) -> str:
    return "-" if value is None else f"{round(value)}%"


def _score_class(value: Any, good: float = 90, improve: float = 50) -> str:
    if isinstance(value, str):
        grade = value.upper()
        if grade in {"A", "B"}:
            return ""
        if grade == "C":
            return "warn"
        return "bad"
    number = _number(value)
    if number is None:
        return "bad"
    if number >= good:
        return ""
    if number >= improve:
        return "warn"
    return "bad"


def _vital_class(value: float | None, good: float, improve: float) -> str:
    if value is None:
        return "bad"
    if value <= good:
        return ""
    if value <= improve:
        return "warn"
    return "bad"


def _format_report_datetime(value: Any) -> str:
    if not value:
        return "-"
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed.strftime("%a, %b %d, %Y %I:%M %p %z")
    except ValueError:
        return str(value)


def _server_location(resources: dict[str, Any]) -> str:
    options = _resource_data(resources, "analysis_options")
    if isinstance(options, dict):
        for key in ("location", "test_location", "location_name"):
            value = options.get(key)
            if value:
                return str(value)
    return "-"


def _browser_label(resources: dict[str, Any]) -> str:
    options = _resource_data(resources, "analysis_options")
    if isinstance(options, dict):
        browser = options.get("browser") or options.get("browser_name")
        lighthouse = options.get("lighthouse_version")
        if browser and lighthouse:
            return f"{browser}, Lighthouse {lighthouse}"
        if browser:
            return str(browser)
    return "Chrome / Lighthouse"


def _summary_cards(summary: dict[str, Any]) -> str:
    card_keys = [
        "gtmetrix_grade",
        "performance_score",
        "structure_score",
        "largest_contentful_paint",
        "total_blocking_time",
        "cumulative_layout_shift",
        "fully_loaded_time",
    ]
    cards = "\n".join(
        f'<div class="card"><div class="muted">{_escape(key.replace("_", " ").title())}</div><div class="metric">{_escape(summary.get(key))}</div></div>'
        for key in card_keys
        if key in summary
    )
    return f'<div class="cards">{cards}</div>'


def _screenshot_html(screenshot: dict[str, Any]) -> str:
    if not screenshot.get("available"):
        return '<p class="muted">Screenshot resource was not returned.</p>'
    src = f"data:{screenshot.get('mime_type', 'image/jpeg')};base64,{screenshot.get('base64', '')}"
    return f'<h3>Screenshot</h3><img class="screenshot" src="{src}" alt="GTmetrix screenshot">'


def _lighthouse_categories(lighthouse: dict[str, Any] | None) -> str:
    categories = _pick_nested(lighthouse, ["categories"])
    if not isinstance(categories, dict):
        return '<p class="muted">No Lighthouse category data returned.</p>'
    data = {
        key: round(value.get("score", 0) * 100) if isinstance(value.get("score"), (int, float)) else value.get("score")
        for key, value in categories.items()
        if isinstance(value, dict)
    }
    return f"<h3>Lighthouse Categories</h3>{_table(data)}"


def _crux_html(lighthouse: dict[str, Any] | None, attrs: dict[str, Any]) -> str:
    origin_summary = _pick_nested(lighthouse, ["audits", "origin-summary"])
    field_data = _pick_nested(lighthouse, ["audits", "metrics", "details", "items", 0])
    target_url = attrs.get("url") or _pick_nested(field_data, ["url"]) or _pick_nested(origin_summary, ["url"])
    metrics = [
        _crux_metric(
            title="Largest Contentful Paint (LCP)",
            source_label="GTmetrix LCP",
            value=_number(attrs.get("largest_contentful_paint")),
            unit="ms",
            good=2500,
            improve=4000,
            max_value=5000,
        ),
        _crux_metric(
            title="Interaction to Next Paint (INP)",
            source_label="GTmetrix TBT",
            value=_inp_value(lighthouse, attrs),
            unit="ms",
            good=200,
            improve=500,
            max_value=800,
        ),
        _crux_metric(
            title="Cumulative Layout Shift (CLS)",
            source_label="GTmetrix CLS",
            value=_number(attrs.get("cumulative_layout_shift")),
            unit="score",
            good=0.1,
            improve=0.25,
            max_value=0.35,
        ),
        _crux_metric(
            title="First Contentful Paint (FCP)",
            source_label="GTmetrix FCP",
            value=_number(attrs.get("first_contentful_paint")),
            unit="ms",
            good=1800,
            improve=3000,
            max_value=4000,
        ),
        _crux_metric(
            title="Time to First Byte (TTFB)",
            source_label="GTmetrix TTFB",
            value=_number(attrs.get("time_to_first_byte")),
            unit="ms",
            good=800,
            improve=1800,
            max_value=2500,
        ),
    ]
    core_metrics = metrics[:3]
    core_values_available = all(metric["raw_value"] is not None for metric in core_metrics)
    assessment_passed = core_values_available and all(metric["status"] == "pass" for metric in core_metrics)
    status_class = "pass" if assessment_passed else "fail"
    status_text = "Passed" if assessment_passed else "Failed"
    field_payload_available = bool(origin_summary or field_data)
    note = (
        "The following metrics use Google CrUX field data when returned by GTmetrix. "
        "Metrics are shown at the 75th percentile where field data is available."
        if field_payload_available
        else "GTmetrix API did not return Google CrUX field data for this run, so this view is styled like the CrUX tab using the available GTmetrix/Lighthouse values."
    )
    core_cards = "".join(_crux_metric_card(metric) for metric in core_metrics)
    other_cards = "".join(_crux_metric_card(metric) for metric in metrics[3:])
    return f"""
      <div class="crux-head">
        <div>
          <h2>CrUX Metrics (Latest 28 Day Collection Period) <span class="crux-help">?</span></h2>
          <p class="crux-note">{_escape(note)}</p>
        </div>
        <div class="crux-period"><strong>Collection Period:</strong> {_escape(_crux_collection_period())}</div>
      </div>
      <div class="crux-banner {status_class}">
        <div class="crux-banner-main">
          <span class="crux-status-icon">{'OK' if assessment_passed else 'X'}</span>
          <span>Core Web Vitals Assessment: <span class="failed">{_escape(status_text)}</span></span>
        </div>
        <div class="crux-result">
          <span>Results for: <a href="{_escape(target_url)}">{_escape(target_url)}</a></span>
          <span class="crux-toggle"><span class="active">This URL</span><span>Origin</span></span>
        </div>
      </div>
      <div class="crux-card-grid">{core_cards}</div>
      <hr class="crux-separator">
      <h3>Other Notable Metrics</h3>
      <div class="crux-card-grid">{other_cards}</div>
    """


def _crux_metric(
    title: str,
    source_label: str,
    value: float | None,
    unit: str,
    good: float,
    improve: float,
    max_value: float,
) -> dict[str, Any]:
    status = _crux_status(value, good, improve)
    comparison = _crux_comparison(value, good, unit)
    return {
        "title": title,
        "source_label": source_label,
        "raw_value": value,
        "unit": unit,
        "status": status,
        "status_label": {"pass": "Pass", "improve": "Improve", "fail": "Fail"}.get(status, "N/A"),
        "display": _crux_display(value, unit),
        "position": _crux_position(value, max_value),
        "comparison": comparison,
    }


def _crux_metric_card(metric: dict[str, Any]) -> str:
    return f"""
      <article class="crux-card {metric['status']}">
        <div class="crux-card-main">
          <div class="crux-metric-title">{_escape(metric['title'])}</div>
          <div class="crux-bar"><span class="crux-dot" style="left:{metric['position']:.2f}%"></span></div>
          <div class="crux-comparison">{_escape(metric['source_label'])} - {metric['comparison']}</div>
          <div class="crux-history">
            <span>Last month <a href="#">Upgrade to PRO for more history</a></span>
            {_crux_history_bars(metric['status'])}
          </div>
        </div>
        <div class="crux-card-score">
          <div class="crux-pill">{_escape(metric['status_label'])}</div>
          <div class="crux-value">{_escape(metric['display'])}</div>
        </div>
      </article>
    """


def _crux_status(value: float | None, good: float, improve: float) -> str:
    if value is None:
        return "fail"
    if value <= good:
        return "pass"
    if value <= improve:
        return "improve"
    return "fail"


def _crux_display(value: float | None, unit: str) -> str:
    if value is None:
        return "N/A"
    if unit == "score":
        return f"{value:.2f}".rstrip("0").rstrip(".")
    if value >= 1000:
        return f"{value / 1000:.1f}s"
    return f"{round(value)}ms"


def _crux_comparison(value: float | None, good: float, unit: str) -> str:
    if value is None:
        return '<span class="bad">N/A</span>'
    delta = value - good
    css_class = "good" if delta <= 0 else "bad"
    formatted = _crux_display(abs(delta), unit)
    prefix = "-" if delta <= 0 else "+"
    return f'<span class="{css_class}">{prefix}{_escape(formatted)}</span>'


def _crux_position(value: float | None, max_value: float) -> float:
    if value is None or max_value <= 0:
        return 96
    return max(0, min(96, value / max_value * 100))


def _crux_history_bars(status: str) -> str:
    trailing = {
        "pass": ["green", "green", "green", "green"],
        "improve": ["green", "green", "orange", "orange"],
        "fail": ["green", "orange", "red", "red"],
    }.get(status, ["red", "red", "red", "red"])
    bars = [""] * 20 + trailing
    return '<div class="crux-sparks">' + "".join(f'<span class="{_escape(color)}"></span>' for color in bars) + "</div>"


def _crux_collection_period() -> str:
    end = datetime.now(UTC).date() - timedelta(days=6)
    start = end - timedelta(days=27)
    return f"{start.strftime('%b')} {start.day} - {end.strftime('%b')} {end.day}, {end.year}"


def _inp_value(lighthouse: dict[str, Any] | None, attrs: dict[str, Any]) -> float | None:
    candidates = [
        _pick_nested(lighthouse, ["audits", "experimental-interaction-to-next-paint", "numericValue"]),
        _pick_nested(lighthouse, ["audits", "interaction-to-next-paint", "numericValue"]),
        attrs.get("interaction_to_next_paint"),
        attrs.get("total_blocking_time"),
    ]
    for candidate in candidates:
        value = _number(candidate)
        if value is not None:
            return value
    return None


def _number(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.strip().replace(",", "")
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def _lighthouse_audits(lighthouse: dict[str, Any] | None, section: str) -> str:
    audits = _pick_nested(lighthouse, ["audits"])
    if not isinstance(audits, dict):
        return '<p class="muted">No Lighthouse audit data returned.</p>'
    rows = []
    for audit_id, audit in audits.items():
        if not isinstance(audit, dict):
            continue
        score = audit.get("score")
        display_value = audit.get("displayValue")
        title = audit.get("title") or audit_id
        if section == "performance" and score is None and not display_value:
            continue
        if section == "structure" and score is not None and isinstance(score, (int, float)) and score >= 0.9:
            continue
        rows.append(
            "<tr>"
            f"<td>{_escape(title)}</td>"
            f"<td>{_escape(display_value)}</td>"
            f"<td>{_escape(score)}</td>"
            "</tr>"
        )
        if len(rows) >= 60:
            break
    if not rows:
        return '<p class="muted">No audit rows returned.</p>'
    return "<h3>Audits</h3><table><tr><th>Audit</th><th>Value</th><th>Score</th></tr>" + "\n".join(rows) + "</table>"


def _filmstrip_html(filmstrip: Any) -> str:
    frames = filmstrip
    if isinstance(filmstrip, dict):
        frames = filmstrip.get("frames") or filmstrip.get("filmstrip") or filmstrip.get("data")
    if not isinstance(frames, list) or not frames:
        return '<p class="muted">No filmstrip frames returned.</p>'
    items = []
    for frame in frames[:30]:
        if not isinstance(frame, dict):
            continue
        image = frame.get("data") or frame.get("image") or frame.get("screenshot")
        time_value = frame.get("time") or frame.get("timestamp") or frame.get("timing")
        if image and not str(image).startswith("data:"):
            image = f"data:image/jpeg;base64,{image}"
        image_html = f'<img src="{_escape(image)}" alt="Frame">' if image else ""
        items.append(f'<div class="frame"><div class="muted">{_escape(time_value)}</div>{image_html}</div>')
    return '<div class="filmstrip">' + "\n".join(items) + "</div>" if items else '<p class="muted">Filmstrip returned no renderable frames.</p>'


def _waterfall_chart(waterfall: Any, resource_summary: Any) -> str:
    entries = _pick_nested(waterfall, ["log", "entries"])
    if not isinstance(entries, list):
        return _json_or_empty(waterfall, "No HAR data returned.")

    base_time = _parse_started_ms(entries[0].get("startedDateTime")) if entries else 0
    max_end = max((_entry_offset_ms(entry, base_time) + float(entry.get("time") or 0) for entry in entries if isinstance(entry, dict)), default=1)
    scale = max(max_end, 1)
    markers = _waterfall_markers(waterfall, scale)
    rows = []
    for entry in entries[:180]:
        if not isinstance(entry, dict):
            continue
        request = entry.get("request", {})
        response = entry.get("response", {})
        url = str(request.get("url") or "")
        timings = entry.get("timings", {}) if isinstance(entry.get("timings"), dict) else {}
        offset = _entry_offset_ms(entry, base_time)
        total = max(float(entry.get("time") or 0), 1)
        wait = max(float(timings.get("wait") or 0), 0)
        receive = max(float(timings.get("receive") or 0), 0)
        left = min(98, offset / scale * 100)
        width = max(0.2, min(100 - left, total / scale * 100))
        wait_width = max(0.2, min(width, wait / scale * 100))
        receive_width = max(0.2, min(width, receive / scale * 100))
        receive_left = min(98, left + max(0, width - receive_width))
        rows.append(
            '<div class="waterfall-row" data-type="{kind}">'.format(kind=_escape(_resource_kind(url)))
            + f'<div class="wf-plus">+</div>'
            + f'<div title="{_escape(url)}">{_escape(_short_url(url))}</div>'
            + f'<div class="wf-status">{_escape(response.get("status"))}</div>'
            + f'<div title="{_escape(_domain(url))}">{_escape(_domain(url))}</div>'
            + f'<div>{_escape(_format_bytes(_body_size(response)))}</div>'
            + '<div class="timeline">'
            + markers
            + f'<span class="wf-bar wf-wait" style="left:{left:.3f}%;width:{wait_width:.3f}%"></span>'
            + f'<span class="wf-bar wf-receive" style="left:{receive_left:.3f}%;width:{receive_width:.3f}%"></span>'
            + f'<span class="wf-label" style="left:{min(96, left + width):.3f}%">{_escape(round(total))}ms</span>'
            + '</div></div>'
        )

    resource_json = _json_or_empty(resource_summary, "No resource summary returned.")
    download_script = html.escape(json.dumps(waterfall))
    return f"""
      <div class="waterfall-actions">
        <a href="#waterfall">Fullscreen</a>
        <a id="download-har" href="#">Download HAR</a>
      </div>
      <h3>Waterfall Chart</h3>
      <p>A request-by-request visualization of the page load.</p>
      <div class="waterfall-toolbar">
        <input id="wf-filter" placeholder="Filter requests..." oninput="filterWaterfall(this.value)">
        <button onclick="filterWaterfall('')">All</button>
        <button onclick="filterWaterfall('html')">HTML</button>
        <button onclick="filterWaterfall('js')">JS</button>
        <button onclick="filterWaterfall('css')">CSS</button>
        <button onclick="filterWaterfall('image')">Images</button>
        <button onclick="filterWaterfall('video')">Video</button>
        <button onclick="filterWaterfall('xhr')">XHR</button>
        <button onclick="filterWaterfall('font')">Fonts</button>
        <button onclick="filterWaterfall('other')">Other</button>
      </div>
      <div class="waterfall-chart">
        <div class="waterfall-grid">
          <div class="waterfall-head"><div></div><div>URL</div><div>Status</div><div>Domain</div><div>Size</div><div>Timeline</div></div>
          {''.join(rows)}
        </div>
      </div>
      <h3>Resource Summary</h3>
      {resource_json}
      <script type="application/json" id="har-json">{download_script}</script>
      <script>
        function filterWaterfall(value) {{
          const needle = String(value || '').toLowerCase();
          document.querySelectorAll('.waterfall-row').forEach((row) => {{
            const text = row.innerText.toLowerCase();
            const kind = (row.dataset.type || '').toLowerCase();
            row.style.display = !needle || text.includes(needle) || kind === needle ? '' : 'none';
          }});
          const input = document.getElementById('wf-filter');
          if (input && ['html','js','css','image','video','xhr','font','other',''].includes(needle)) input.value = needle;
        }}
        document.getElementById('download-har').addEventListener('click', function(event) {{
          event.preventDefault();
          const blob = new Blob([document.getElementById('har-json').textContent], {{type: 'application/json'}});
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'gtmetrix-waterfall.har';
          link.click();
          URL.revokeObjectURL(link.href);
        }});
      </script>
    """


def _parse_started_ms(value: Any) -> float:
    if not value:
        return 0
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).timestamp() * 1000
    except ValueError:
        return 0


def _entry_offset_ms(entry: dict[str, Any], base_time: float) -> float:
    return max(0, _parse_started_ms(entry.get("startedDateTime")) - base_time)


def _waterfall_markers(waterfall: Any, scale: float) -> str:
    pages = _pick_nested(waterfall, ["log", "pages"])
    timings = pages[0].get("pageTimings", {}) if isinstance(pages, list) and pages else {}
    markers = []
    for index, key in enumerate(("onContentLoad", "onLoad")):
        value = timings.get(key)
        if isinstance(value, (int, float)) and value >= 0:
            left = min(99, value / scale * 100)
            color = " pink" if index else ""
            markers.append(f'<span class="wf-marker{color}" title="{_escape(key)}" style="left:{left:.3f}%"></span>')
    return "".join(markers)


def _resource_kind(url: str) -> str:
    lower = url.lower().split("?", 1)[0]
    if lower.endswith((".html", ".htm", "/")):
        return "html"
    if lower.endswith(".js"):
        return "js"
    if lower.endswith(".css"):
        return "css"
    if lower.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif")):
        return "image"
    if lower.endswith((".mp4", ".webm", ".mov")):
        return "video"
    if lower.endswith((".woff", ".woff2", ".ttf", ".otf", ".eot")):
        return "font"
    if any(token in lower for token in ("xhr", "api", "graphql", "json")):
        return "xhr"
    return "other"


def _short_url(url: str) -> str:
    path = url.split("://", 1)[-1].split("/", 1)
    tail = "/" + path[1] if len(path) > 1 else "/"
    return tail if len(tail) <= 34 else tail[:31] + "..."


def _domain(url: str) -> str:
    return url.split("://", 1)[-1].split("/", 1)[0]


def _body_size(response: dict[str, Any]) -> int:
    content = response.get("content", {}) if isinstance(response, dict) else {}
    return int(content.get("size") or response.get("bodySize") or 0)


def _format_bytes(value: int) -> str:
    if value >= 1024 * 1024:
        return f"{value / (1024 * 1024):.2f}MB"
    if value >= 1024:
        return f"{value / 1024:.1f}KB"
    return f"{value}B"


def _alerts_html(lighthouse: dict[str, Any] | None) -> str:
    audits = _pick_nested(lighthouse, ["audits"])
    if not isinstance(audits, dict):
        return '<p class="muted">No alerts returned.</p>'
    alerts = {}
    for audit_id, audit in audits.items():
        if isinstance(audit, dict) and isinstance(audit.get("score"), (int, float)) and audit["score"] < 0.5:
            alerts[audit.get("title") or audit_id] = audit.get("displayValue") or audit.get("description")
    return _table(alerts) if alerts else '<p class="muted">No low-score Lighthouse alerts returned.</p>'


def _json_or_empty(data: Any, empty_message: str) -> str:
    if data is None or data == {} or data == []:
        return f'<p class="muted">{_escape(empty_message)}</p>'
    return f"<pre>{html.escape(json.dumps(data, indent=2))}</pre>"


def _report_summary(report: dict[str, Any]) -> dict[str, Any]:
    data = report.get("data", {})
    attributes = data.get("attributes", {})
    return {
        "report_id": data.get("id"),
        "url": attributes.get("url"),
        "gtmetrix_grade": attributes.get("gtmetrix_grade"),
        "performance_score": attributes.get("performance_score"),
        "structure_score": attributes.get("structure_score"),
        "largest_contentful_paint": attributes.get("largest_contentful_paint"),
        "total_blocking_time": attributes.get("total_blocking_time"),
        "cumulative_layout_shift": attributes.get("cumulative_layout_shift"),
        "fully_loaded_time": attributes.get("fully_loaded_time"),
        "created": attributes.get("created"),
        "expires": attributes.get("expires"),
    }


def _request(client: httpx.Client, method: str, path: str, **kwargs: Any) -> httpx.Response:
    try:
        return client.request(method, _absolute_url(path), **kwargs)
    except httpx.RequestError as exc:
        raise GTmetrixApiError(f"GTmetrix API request failed: {exc}", {"request_url": str(exc.request.url)}) from exc


def _absolute_url(path: str) -> str:
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return urljoin(settings.gtmetrix_api_base_url.rstrip("/") + "/", path.lstrip("/"))


def _response_json(response: httpx.Response) -> dict[str, Any]:
    try:
        return response.json()
    except ValueError as exc:
        raise GTmetrixApiError(
            "GTmetrix API response was not JSON.",
            {"status_code": response.status_code, "body": response.text[:1000]},
        ) from exc


def _api_error(
    message: str,
    response: httpx.Response,
    extra: dict[str, Any] | None = None,
) -> GTmetrixApiError:
    details: dict[str, Any] = {
        "status_code": response.status_code,
        "request_url": str(response.url),
        "body": response.text[:2000],
    }
    if extra:
        details.update(extra)
    try:
        details["json"] = response.json()
    except ValueError:
        pass
    errors = details.get("json", {}).get("errors")
    if isinstance(errors, list) and errors:
        details["gtmetrix_errors"] = errors
        first_error = errors[0]
        title = first_error.get("title")
        detail = first_error.get("detail")
        code = first_error.get("code")
        parts = [str(value) for value in (title, detail, code) if value]
        if parts:
            message = f"{message} {' - '.join(parts)}"
    return GTmetrixApiError(message, details)
