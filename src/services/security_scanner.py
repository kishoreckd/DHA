import asyncio
import html
import json
import logging
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus

import httpx

from app.core.config import settings
from app.models.cwv import MetricResult, ReportFormat
from app.services.report_paths import report_dir_for_url


logger = logging.getLogger(__name__)


class SecurityScanError(RuntimeError):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.details = details or {}


async def capture_security_report(
    report_id: str,
    url: str,
    output_format: ReportFormat,
) -> tuple[dict[str, Path], dict[str, Any], dict[str, MetricResult]]:
    return await asyncio.to_thread(_capture_security_report_sync, report_id, url, output_format)


def _capture_security_report_sync(
    report_id: str,
    url: str,
    output_format: ReportFormat,
) -> tuple[dict[str, Path], dict[str, Any], dict[str, MetricResult]]:
    logger.info("security scan started report_id=%s url=%s output_format=%s", report_id, url, output_format)
    reports_dir = report_dir_for_url("security", url)

    try:
        with httpx.Client(timeout=settings.security_scan_timeout_seconds, follow_redirects=True) as client:
            response = client.get(url, headers={"User-Agent": "DHA-SecurityScanner/1.0"})
    except httpx.RequestError as exc:
        raise SecurityScanError(
            f"Security scan request failed: {exc}",
            {"request_url": str(exc.request.url)},
        ) from exc

    headers = {key.lower(): value for key, value in response.headers.items()}
    checks = _build_checks(str(response.url), headers)
    metrics = _metrics_from_checks(checks)
    score = _score(checks)
    grade = _grade(score)

    metadata: dict[str, Any] = {
        "source": "security_headers_scan",
        "target_url": url,
        "final_url": str(response.url),
        "captured_at": datetime.now(UTC).isoformat(),
        "status_code": response.status_code,
        "score": score,
        "grade": grade,
        "external_tools": {
            "securityheaders": f"https://securityheaders.com/?q={quote_plus(url)}&followRedirects=on",
            "cdn77": "https://www.cdn77.com/",
        },
        "cdn77": _cdn77_summary(headers),
        "checks": checks,
        "headers": dict(response.headers),
    }

    artifact_paths = _save_artifact(report_id, reports_dir, output_format, metadata)
    metadata["artifact_paths"] = {key: str(path) for key, path in artifact_paths.items()}
    logger.info("security scan completed report_id=%s score=%s grade=%s", report_id, score, grade)
    return artifact_paths, metadata, metrics


def _build_checks(final_url: str, headers: dict[str, str]) -> list[dict[str, Any]]:
    csp = headers.get("content-security-policy", "")
    checks = [
        _check("https", "HTTPS", final_url.startswith("https://"), "The final URL should be served over HTTPS."),
        _check("hsts", "Strict-Transport-Security", bool(headers.get("strict-transport-security")), "Enable HSTS on HTTPS responses."),
        _check("csp", "Content-Security-Policy", bool(csp), "Define a Content Security Policy."),
        _check("csp_frame_ancestors", "CSP frame-ancestors", "frame-ancestors" in csp.lower(), "Set frame-ancestors in CSP."),
        _check(
            "x_content_type_options",
            "X-Content-Type-Options",
            headers.get("x-content-type-options", "").lower() == "nosniff",
            "Set X-Content-Type-Options to nosniff.",
        ),
        _check(
            "clickjacking",
            "Clickjacking protection",
            bool(headers.get("x-frame-options")) or "frame-ancestors" in csp.lower(),
            "Use X-Frame-Options or CSP frame-ancestors.",
        ),
        _check("referrer_policy", "Referrer-Policy", bool(headers.get("referrer-policy")), "Set a Referrer-Policy."),
        _check("permissions_policy", "Permissions-Policy", bool(headers.get("permissions-policy")), "Set a Permissions-Policy."),
        _check("coop", "Cross-Origin-Opener-Policy", bool(headers.get("cross-origin-opener-policy")), "Set COOP where compatible."),
    ]

    server_header = headers.get("server", "")
    checks.append(
        {
            "key": "server_header",
            "label": "Server header exposure",
            "status": "warn" if server_header else "pass",
            "present": bool(server_header),
            "value": server_header or None,
            "recommendation": "Avoid exposing detailed platform/version information in the Server header.",
        }
    )
    checks.append(_cdn77_check(headers))
    return checks


def _check(key: str, label: str, passed: bool, recommendation: str) -> dict[str, Any]:
    return {
        "key": key,
        "label": label,
        "status": "pass" if passed else "fail",
        "present": passed,
        "recommendation": recommendation,
    }


def _cdn77_check(headers: dict[str, str]) -> dict[str, Any]:
    evidence = _cdn77_evidence(headers)
    return {
        "key": "cdn77",
        "label": "CDN77 evidence",
        "status": "pass" if evidence else "warn",
        "present": bool(evidence),
        "value": evidence or None,
        "recommendation": "Use CDN77 or another CDN/WAF in front of public assets and APIs where appropriate.",
    }


def _cdn77_summary(headers: dict[str, str]) -> dict[str, Any]:
    evidence = _cdn77_evidence(headers)
    return {
        "detected": bool(evidence),
        "evidence": evidence,
        "recommendation": "Validate CDN configuration, TLS, caching, compression, and WAF behavior in CDN77.",
    }


def _cdn77_evidence(headers: dict[str, str]) -> list[str]:
    evidence = []
    for key, value in headers.items():
        combined = f"{key}: {value}"
        if "cdn77" in combined.lower():
            evidence.append(combined)
    return evidence


def _metrics_from_checks(checks: list[dict[str, Any]]) -> dict[str, MetricResult]:
    return {
        check["key"]: MetricResult(
            label=check["label"],
            value=_metric_value(check.get("value")),
            score=1.0 if check["status"] == "pass" else 0.5 if check["status"] == "warn" else 0.0,
            status=check["status"],
            source="security_headers_scan",
            details={"recommendation": check["recommendation"], "present": check["present"]},
        )
        for check in checks
    }


def _score(checks: list[dict[str, Any]]) -> int:
    scored = [check for check in checks if check["key"] != "cdn77"]
    if not scored:
        return 0
    points = sum(1 for check in scored if check["status"] == "pass")
    points += sum(0.5 for check in scored if check["status"] == "warn")
    return round((points / len(scored)) * 100)


def _grade(score: int) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def _save_artifact(
    report_id: str,
    reports_dir: Path,
    output_format: ReportFormat,
    metadata: dict[str, Any],
) -> dict[str, Path]:
    if output_format == ReportFormat.json:
        output_path = reports_dir / f"{report_id}.json"
        output_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        return {"json": output_path}

    html_path = reports_dir / f"{report_id}.html"
    html_path.write_text(_render_html(metadata), encoding="utf-8")
    if output_format == ReportFormat.html:
        return {"html": html_path}

    if output_format == ReportFormat.pdf:
        output_path = reports_dir / f"{report_id}.pdf"
        _render_with_playwright(html_path, output_path, output_format)
        return {"pdf": output_path, "html": html_path}

    if output_format == ReportFormat.screenshot:
        output_path = reports_dir / f"{report_id}.png"
        _render_with_playwright(html_path, output_path, output_format)
        return {"screenshot": output_path, "html": html_path}

    return {"html": html_path}


def _render_html(metadata: dict[str, Any]) -> str:
    rows = "\n".join(
        "<tr>"
        f"<td>{_escape(check['label'])}</td>"
        f"<td><span class=\"status {check['status']}\">{_escape(check['status'].upper())}</span></td>"
        f"<td>{_escape(check.get('recommendation'))}</td>"
        "</tr>"
        for check in metadata["checks"]
    )
    external = metadata["external_tools"]
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>DHA Security Report</title>
  <style>
    body {{ margin: 32px; color: #18212f; font-family: Arial, sans-serif; line-height: 1.5; }}
    header {{ border-bottom: 1px solid #d9e0ea; margin-bottom: 24px; padding-bottom: 18px; }}
    h1 {{ font-size: 28px; margin: 0 0 8px; }}
    .meta {{ color: #536174; }}
    .score {{ display: inline-block; margin-top: 12px; padding: 8px 12px; background: #edf7f2; border: 1px solid #bcdccc; }}
    table {{ border-collapse: collapse; width: 100%; }}
    th, td {{ border-bottom: 1px solid #d9e0ea; padding: 10px; text-align: left; vertical-align: top; }}
    th {{ background: #f5f7fa; }}
    .status {{ font-weight: 700; }}
    .pass {{ color: #087443; }}
    .warn {{ color: #a05a00; }}
    .fail {{ color: #b42318; }}
    a {{ color: #155eef; }}
  </style>
</head>
<body>
  <header>
    <h1>Security Headers Report</h1>
    <div class="meta">{_escape(metadata["target_url"])} -> {_escape(metadata["final_url"])}</div>
    <div class="score">Grade {_escape(metadata["grade"])} / Score {_escape(metadata["score"])}</div>
  </header>
  <table>
    <thead><tr><th>Check</th><th>Status</th><th>Recommendation</th></tr></thead>
    <tbody>{rows}</tbody>
  </table>
  <h2>External Validation</h2>
  <p><a href="{_escape(external["securityheaders"])}">securityheaders.com scan</a></p>
  <p><a href="{_escape(external["cdn77"])}">CDN77 configuration and validation</a></p>
</body>
</html>
"""


def _render_with_playwright(input_path: Path, output_path: Path, output_format: ReportFormat) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        raise SecurityScanError("Playwright is required to render security report PDF/screenshot outputs.") from exc

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        try:
            page = browser.new_page(viewport={"width": 1280, "height": 1600})
            page.goto(input_path.resolve().as_uri(), wait_until="load")
            if output_format == ReportFormat.pdf:
                page.pdf(path=str(output_path), format="A4", print_background=True)
            else:
                page.screenshot(path=str(output_path), full_page=True)
        finally:
            browser.close()


def _escape(value: Any) -> str:
    return html.escape("" if value is None else str(value))


def _metric_value(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, list):
        return "; ".join(str(item) for item in value)
    return str(value)
