import asyncio
import html
import json
import logging
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus, urljoin

import httpx

from app.core.config import settings
from app.models.cwv import ReportFormat
from app.services.report_paths import report_dir_for_url


logger = logging.getLogger(__name__)


class CatchpointApiError(RuntimeError):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.details = details or {}


async def capture_catchpoint_api_report(
    report_id: str,
    url: str,
    output_format: ReportFormat,
) -> tuple[dict[str, Path], dict[str, Any]]:
    return await asyncio.to_thread(
        _capture_catchpoint_api_report_sync,
        report_id,
        url,
        output_format,
    )


def _capture_catchpoint_api_report_sync(
    report_id: str,
    url: str,
    output_format: ReportFormat,
) -> tuple[dict[str, Path], dict[str, Any]]:
    path = _build_api_path(url)
    reports_dir = report_dir_for_url("catchpoint", url)
    with _catchpoint_client() as client:
        response = _request(client, "GET", path)
        if response.status_code != 200:
            raise _api_error("Catchpoint API request failed.", response, {"api_path": path})
        payload = _response_json(response)

    artifact_path = _save_artifact(
        report_id=report_id,
        target_url=url,
        api_path=path,
        payload=payload,
        output_format=output_format,
        reports_dir=reports_dir,
    )
    metadata = {
        "source": "catchpoint_api",
        "target_url": url,
        "captured_at": datetime.now(UTC).isoformat(),
        "api_path": path,
        "captures": {
            "report": {
                "artifact_path": str(artifact_path),
                "artifact_bytes": artifact_path.stat().st_size,
                "summary": _payload_summary(payload),
            }
        },
        "artifact_paths": {"report": str(artifact_path)},
    }
    logger.info("catchpoint api capture completed report_id=%s path=%s", report_id, artifact_path)
    return {"report": artifact_path}, metadata


def _catchpoint_client() -> httpx.Client:
    auth_mode = _catchpoint_auth_mode()
    headers = {"Accept": "application/json"}
    auth: httpx.BasicAuth | None = None

    if auth_mode == "api_key":
        headers["Authorization"] = f"Bearer {settings.catchpoint_api_key}"
    elif auth_mode == "basic":
        auth = httpx.BasicAuth(settings.catchpoint_email or "", settings.catchpoint_password or "")
    elif auth_mode == "login":
        token = _login_for_token()
        headers["Authorization"] = f"Bearer {token}"
    else:
        raise CatchpointApiError(
            f"Unsupported Catchpoint auth mode: {settings.catchpoint_auth_mode}",
            {"auth_mode": settings.catchpoint_auth_mode, "supported_modes": ["auto", "api_key", "basic", "login"]},
        )

    return httpx.Client(
        timeout=settings.catchpoint_timeout_seconds,
        headers=headers,
        auth=auth,
    )


def _catchpoint_auth_mode() -> str:
    requested_mode = settings.catchpoint_auth_mode
    if requested_mode == "auto":
        if settings.catchpoint_api_key:
            return "api_key"
        if settings.catchpoint_email and settings.catchpoint_password:
            return "basic"
    if requested_mode == "api_key":
        if settings.catchpoint_api_key:
            return "api_key"
        raise CatchpointApiError(
            "Catchpoint API key auth requires CATCHPOINT_API_KEY in .env.",
            {"missing_env": "CATCHPOINT_API_KEY", "auth_mode": requested_mode},
        )
    if requested_mode in {"basic", "login"}:
        missing = [
            name
            for name, value in {
                "CATCHPOINT_EMAIL": settings.catchpoint_email,
                "CATCHPOINT_PASSWORD": settings.catchpoint_password,
            }.items()
            if not value
        ]
        if missing:
            raise CatchpointApiError(
                "Catchpoint email/password auth requires CATCHPOINT_EMAIL and CATCHPOINT_PASSWORD in .env.",
                {"missing_env": missing, "auth_mode": requested_mode},
            )
        return requested_mode

    raise CatchpointApiError(
        "Catchpoint authentication is not configured.",
        {
            "missing_env": ["CATCHPOINT_API_KEY or CATCHPOINT_EMAIL/CATCHPOINT_PASSWORD"],
            "auth_mode": requested_mode,
        },
    )


def _login_for_token() -> str:
    with httpx.Client(timeout=settings.catchpoint_timeout_seconds, headers={"Accept": "application/json"}) as client:
        response = _request(
            client,
            "POST",
            settings.catchpoint_auth_path,
            json={
                "email": settings.catchpoint_email,
                "username": settings.catchpoint_email,
                "password": settings.catchpoint_password,
            },
        )
        if response.status_code not in (200, 201):
            raise _api_error("Catchpoint login failed.", response, {"auth_path": settings.catchpoint_auth_path})
        payload = _response_json(response)
    token = _extract_token(payload)
    if not token:
        raise CatchpointApiError(
            "Catchpoint login response did not include a token.",
            {
                "auth_path": settings.catchpoint_auth_path,
                "response_keys": list(payload.keys()),
            },
        )
    return token


def _extract_token(payload: dict[str, Any]) -> str | None:
    for key in ("token", "access_token", "api_key", "apiKey", "key"):
        value = payload.get(key)
        if isinstance(value, str) and value:
            return value
    data = payload.get("data")
    if isinstance(data, dict):
        for key in ("token", "access_token", "api_key", "apiKey", "key"):
            value = data.get(key)
            if isinstance(value, str) and value:
                return value
    return None


def _build_api_path(target_url: str) -> str:
    template = settings.catchpoint_api_path_template.strip()
    if not template:
        raise CatchpointApiError(
            "Catchpoint API requires CATCHPOINT_API_PATH_TEMPLATE in .env.",
            {"missing_env": "CATCHPOINT_API_PATH_TEMPLATE"},
        )
    if "{test_id}" in template and not settings.catchpoint_test_id:
        raise CatchpointApiError(
            "Catchpoint API path template contains {test_id}, but CATCHPOINT_TEST_ID is empty.",
            {
                "missing_env": "CATCHPOINT_TEST_ID",
                "template": template,
                "example": "tests/{test_id}",
            },
        )
    return template.format(
        test_id=settings.catchpoint_test_id or "",
        url=target_url,
        encoded_url=quote_plus(target_url),
    ).lstrip("/")


def _save_artifact(
    report_id: str,
    target_url: str,
    api_path: str,
    payload: dict[str, Any],
    output_format: ReportFormat,
    reports_dir: Path,
) -> Path:
    if output_format == ReportFormat.json:
        path = reports_dir / f"{report_id}.json"
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return path

    html_path = reports_dir / f"{report_id}.html"
    html_path.write_text(_render_report_html(target_url, api_path, payload), encoding="utf-8")
    if output_format == ReportFormat.pdf:
        path = reports_dir / f"{report_id}.pdf"
        _render_html_artifact(html_path, path, output_format)
        return path
    if output_format == ReportFormat.screenshot:
        path = reports_dir / f"{report_id}.png"
        _render_html_artifact(html_path, path, output_format)
        return path
    return html_path


def _render_report_html(target_url: str, api_path: str, payload: dict[str, Any]) -> str:
    summary = _payload_summary(payload)
    raw_json = html.escape(json.dumps(payload, indent=2))
    rows = "".join(
        f"<tr><th>{_escape(str(key).replace('_', ' ').title())}</th><td>{_escape(value)}</td></tr>"
        for key, value in summary.items()
    )
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Catchpoint Report</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 0; background: #f5f7f9; color: #23313a; }}
    header {{ background: #fff; border-bottom: 1px solid #d8dee4; padding: 24px 40px; }}
    main {{ padding: 28px 40px 48px; }}
    section {{ background: #fff; border: 1px solid #d8dee4; padding: 24px 28px; margin-bottom: 24px; }}
    table {{ border-collapse: collapse; width: 100%; margin: 12px 0 22px; }}
    th, td {{ border-bottom: 1px solid #e1e5e8; padding: 10px 12px; text-align: left; vertical-align: top; }}
    th {{ background: #f7f9fa; width: 280px; }}
    pre {{ background: #101820; color: #d8f3dc; padding: 16px; overflow: auto; max-height: 720px; }}
    .muted {{ color: #60717c; font-size: 13px; }}
  </style>
</head>
<body>
  <header>
    <h1>Catchpoint API Report</h1>
    <div>{_escape(target_url)}</div>
    <div class="muted">API path: {_escape(api_path)}</div>
  </header>
  <main>
    <section>
      <h2>Summary</h2>
      <table>{rows}</table>
    </section>
    <section>
      <h2>Raw Catchpoint Response</h2>
      <pre>{raw_json}</pre>
    </section>
  </main>
</body>
</html>"""


def _payload_summary(payload: dict[str, Any]) -> dict[str, Any]:
    if isinstance(payload.get("data"), dict):
        source = payload["data"]
    else:
        source = payload
    summary: dict[str, Any] = {}
    for key in (
        "id",
        "name",
        "testName",
        "test_name",
        "testUrl",
        "test_url",
        "url",
        "type",
        "status",
        "product",
        "division",
        "folder",
        "created",
        "updated",
        "lastRun",
        "last_run",
    ):
        if key in source:
            summary[key] = source[key]
    if not summary:
        summary = {
            "response_type": type(payload).__name__,
            "top_level_keys": ", ".join(payload.keys()),
        }
    return summary


def _render_html_artifact(html_path: Path, output_path: Path, output_format: ReportFormat) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        raise CatchpointApiError("Playwright is required to render Catchpoint PDF/screenshot outputs.") from exc

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


def _request(client: httpx.Client, method: str, path: str, **kwargs: Any) -> httpx.Response:
    try:
        return client.request(method, _absolute_url(path), **kwargs)
    except httpx.RequestError as exc:
        raise CatchpointApiError(f"Catchpoint API request failed: {exc}", {"request_url": str(exc.request.url)}) from exc


def _absolute_url(path: str) -> str:
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return urljoin(settings.catchpoint_api_base_url.rstrip("/") + "/", path.lstrip("/")
    )


def _response_json(response: httpx.Response) -> dict[str, Any]:
    try:
        return response.json()
    except ValueError as exc:
        raise CatchpointApiError(
            "Catchpoint API response was not JSON.",
            {"status_code": response.status_code, "body": response.text[:1000]},
        ) from exc


def _api_error(message: str, response: httpx.Response, extra: dict[str, Any] | None = None) -> CatchpointApiError:
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
    return CatchpointApiError(message, details)


def _escape(value: Any) -> str:
    return html.escape("" if value is None else str(value))
