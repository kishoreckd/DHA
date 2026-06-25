import html
import json
import logging
from datetime import UTC, datetime
from pathlib import Path
from textwrap import wrap
from typing import Any

from app.core.config import settings
from app.models.cwv import CwvTool, MetricResult, ReportFormat


logger = logging.getLogger(__name__)


def render_report(
    report_id: str,
    tool: CwvTool,
    url: str,
    metrics: dict[str, MetricResult],
    output_format: ReportFormat,
    raw: dict[str, Any] | None = None,
) -> Path | None:
    logger.info(
        "report render started report_id=%s output_format=%s reports_dir=%s",
        report_id,
        output_format,
        settings.reports_dir,
    )
    settings.reports_dir.mkdir(parents=True, exist_ok=True)

    if output_format == ReportFormat.json:
        path = settings.reports_dir / f"{report_id}.json"
        path.write_text(
            json.dumps(
                {
                    "report_id": report_id,
                    "tool": tool,
                    "url": url,
                    "generated_at": datetime.now(UTC).isoformat(),
                    "metrics": {key: metric.dict() for key, metric in metrics.items()},
                    "raw": raw,
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        logger.info("report render completed report_id=%s path=%s bytes=%s", report_id, path, path.stat().st_size)
        return path

    if output_format == ReportFormat.pdf:
        path = settings.reports_dir / f"{report_id}.pdf"
        path.write_bytes(_simple_pdf(report_id, tool, url, metrics))
        logger.info("report render completed report_id=%s path=%s bytes=%s", report_id, path, path.stat().st_size)
        return path

    if output_format == ReportFormat.screenshot:
        path = settings.reports_dir / f"{report_id}.html"
        path.write_text(_html(report_id, tool, url, metrics, raw), encoding="utf-8")
        logger.info("report render completed report_id=%s path=%s bytes=%s", report_id, path, path.stat().st_size)
        return path

    path = settings.reports_dir / f"{report_id}.html"
    path.write_text(_html(report_id, tool, url, metrics, raw), encoding="utf-8")
    logger.info("report render completed report_id=%s path=%s bytes=%s", report_id, path, path.stat().st_size)
    return path


def _html(
    report_id: str,
    tool: CwvTool,
    url: str,
    metrics: dict[str, MetricResult],
    raw: dict[str, Any] | None = None,
) -> str:
    if tool == CwvTool.lighthouse:
        return _lighthouse_html(report_id, url, metrics, raw)
    return _pagespeed_html(report_id, url, metrics, raw)


def _pagespeed_html(
    report_id: str,
    url: str,
    metrics: dict[str, MetricResult],
    raw: dict[str, Any] | None = None,
) -> str:
    generated_at = datetime.now(UTC)
    mobile = (raw or {}).get("mobile", {})
    desktop = (raw or {}).get("desktop", {})
    field_source = mobile or desktop
    lab_source = mobile or desktop
    field_metrics = field_source.get("loadingExperience", {}).get("metrics", {})
    categories = lab_source.get("lighthouseResult", {}).get("categories", {})
    audits = lab_source.get("lighthouseResult", {}).get("audits", {})
    final_url = lab_source.get("lighthouseResult", {}).get("finalDisplayedUrl") or url
    cwv_status = _cwv_status(field_metrics)

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PageSpeed Insights - {html.escape(report_id)}</title>
  <style>
    :root {{ --blue: #1a73e8; --green: #0cce6b; --orange: #ffa400; --red: #ff4e42; --text: #202124; --muted: #5f6368; --line: #dadce0; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: Arial, Helvetica, sans-serif; color: var(--text); background: #fff; }}
    main {{ max-width: 980px; margin: 0 auto; padding: 22px 28px 44px; }}
    header {{ border-bottom: 1px solid var(--line); padding-bottom: 16px; }}
    .topline {{ display: flex; align-items: center; justify-content: space-between; gap: 16px; font-size: 12px; color: #3c4043; }}
    .brand {{ display: flex; align-items: center; gap: 8px; margin-top: 18px; color: #5f6368; font-size: 24px; }}
    .logo {{ width: 26px; height: 26px; border-radius: 50%; background: conic-gradient(var(--blue), #8ab4f8, #e8f0fe, var(--blue)); position: relative; }}
    .logo::after {{ content: ""; position: absolute; inset: 8px 5px 5px 8px; border-radius: 50%; background: #fff; }}
    .actions {{ display: flex; align-items: center; gap: 10px; }}
    .copy {{ border: 1px solid var(--line); background: #fff; color: var(--blue); border-radius: 4px; padding: 10px 18px; font-weight: 600; }}
    .docs {{ color: var(--blue); font-weight: 600; text-decoration: none; }}
    h1 {{ margin: 20px 0 14px; font-size: 25px; font-weight: 400; }}
    .search {{ display: grid; grid-template-columns: 1fr auto; gap: 16px; margin-bottom: 86px; }}
    .urlbox {{ border: 1px solid #bdc1c6; border-radius: 4px; padding: 14px 16px; font-size: 14px; color: #3c4043; overflow-wrap: anywhere; }}
    .analyze {{ background: #0b57d0; color: #fff; border: 0; border-radius: 4px; padding: 0 28px; font-weight: 600; }}
    .section-title {{ display: flex; align-items: center; gap: 12px; margin: 24px 0 14px; font-weight: 700; }}
    .doticon {{ width: 24px; height: 24px; border-radius: 50%; background: #e8f0fe; color: var(--blue); display: inline-grid; place-items: center; font-size: 14px; }}
    .tabs {{ margin-left: auto; display: inline-flex; border: 1px solid var(--line); border-radius: 3px; overflow: hidden; font-size: 12px; color: var(--muted); }}
    .tabs span {{ padding: 4px 8px; border-right: 1px solid var(--line); }}
    .tabs span:last-child {{ border-right: 0; }}
    .panel {{ border: 1px solid var(--line); border-radius: 8px; padding: 28px 10px 8px; }}
    .assessment {{ display: flex; align-items: center; justify-content: center; gap: 22px; margin-bottom: 32px; }}
    .pulse {{ width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; background: #fce8e6; color: var(--red); font-weight: 700; }}
    .failed {{ color: var(--red); font-weight: 700; }}
    .passed {{ color: var(--green); font-weight: 700; }}
    .metric-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; padding: 0 18px; }}
    .metric-grid.secondary {{ grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid var(--line); margin-top: 22px; padding-top: 18px; max-width: 620px; }}
    .metric-name {{ color: #3c4043; font-size: 14px; text-decoration: underline; margin-bottom: 12px; }}
    .metric-name::before {{ content: ""; display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; background: var(--metric-color); }}
    .metric-value {{ color: var(--metric-color); text-align: center; font-size: 18px; margin-bottom: 5px; }}
    .status {{ display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px; }}
    .good {{ background: #d7f2df; color: #137333; }}
    .needs_improvement {{ background: #fff0c2; color: #9a6700; }}
    .poor {{ background: #fce8e6; color: #c5221f; }}
    .not_available {{ background: #f1f3f4; color: #5f6368; }}
    .bar {{ height: 6px; display: grid; grid-template-columns: 72% 18% 10%; background: #eee; position: relative; }}
    .bar span:nth-child(1) {{ background: var(--green); }}
    .bar span:nth-child(2) {{ background: var(--orange); }}
    .bar span:nth-child(3) {{ background: var(--red); }}
    .marker {{ position: absolute; top: -5px; width: 1px; height: 16px; background: #777; left: var(--marker-left); }}
    .marker::after {{ content: ""; position: absolute; top: -4px; left: -3px; width: 7px; height: 7px; border-radius: 50%; border: 1px solid #777; background: #fff; }}
    .subhead {{ color: var(--muted); font-size: 12px; text-transform: uppercase; margin: 22px 0 0; padding-left: 0; }}
    .footnotes {{ margin-top: 26px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8f9fa; padding: 14px 28px; color: var(--muted); font-size: 12px; }}
    .score-row {{ display: flex; justify-content: center; gap: 56px; padding: 0 0 22px; border-bottom: 1px solid var(--line); }}
    .score {{ text-align: center; font-size: 12px; color: #3c4043; }}
    .circle {{ width: 52px; height: 52px; margin: 0 auto 8px; border-radius: 50%; display: grid; place-items: center; font-size: 18px; color: var(--score-color); background: conic-gradient(var(--score-color) calc(var(--score) * 1%), #f1f3f4 0); position: relative; }}
    .circle::before {{ content: ""; position: absolute; inset: 4px; border-radius: 50%; background: #fff; }}
    .circle span {{ position: relative; }}
    .dha-grid {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 18px; padding: 0 18px 12px; }}
    .dha-item {{ border-top: 1px solid #edf0f2; padding-top: 10px; font-size: 13px; }}
    .dha-item b {{ display: block; margin-bottom: 4px; }}
    @media (max-width: 760px) {{
      main {{ padding: 16px; }}
      .search, .metric-grid, .metric-grid.secondary, .footnotes, .dha-grid {{ grid-template-columns: 1fr; }}
      .score-row {{ gap: 18px; flex-wrap: wrap; }}
    }}
  </style>
</head>
<body>
  <main>
    <header>
      <div class="topline">
        <span>{html.escape(_format_short_datetime(generated_at))}</span>
        <span>PageSpeed Insights</span>
        <span class="actions"><button class="copy">Copy Link</button><a class="docs">Docs</a></span>
      </div>
      <div class="brand"><span class="logo"></span><span>PageSpeed Insights</span></div>
    </header>

    <h1>Report from {html.escape(_format_report_datetime(generated_at))}</h1>
    <div class="search">
      <div class="urlbox">{html.escape(final_url)}</div>
      <button class="analyze">Analyze</button>
    </div>

    <div class="section-title">
      <span class="doticon">i</span>
      <span>Discover what your real users are experiencing</span>
      <span class="tabs"><span>This URL</span><span>Origin</span></span>
    </div>
    <section class="panel">
      <div class="assessment">
        <div class="pulse">~</div>
        <div>Core Web Vitals Assessment: <span class="{html.escape(cwv_status['class'])}">{html.escape(cwv_status['label'])}</span></div>
      </div>
      <div class="metric-grid">
        {_field_metric("Largest Contentful Paint (LCP)", field_metrics.get("LARGEST_CONTENTFUL_PAINT_MS"), "ms", 2500, 4000, True)}
        {_field_metric("Interaction to Next Paint (INP)", field_metrics.get("INTERACTION_TO_NEXT_PAINT"), "ms", 200, 500, True)}
        {_field_metric("Cumulative Layout Shift (CLS)", field_metrics.get("CUMULATIVE_LAYOUT_SHIFT_SCORE"), "", 0.1, 0.25, False)}
      </div>
      <div class="subhead">Other notable metrics</div>
      <div class="metric-grid secondary">
        {_field_metric("First Contentful Paint (FCP)", field_metrics.get("FIRST_CONTENTFUL_PAINT_MS"), "ms", 1800, 3000, True)}
        {_field_metric("Time to First Byte (TTFB)", field_metrics.get("EXPERIMENTAL_TIME_TO_FIRST_BYTE"), "ms", 800, 1800, True)}
      </div>
      <div class="footnotes">
        <span>Latest 28-day period</span>
        <span>{html.escape(field_source.get("loadingExperience", {}).get("formFactor", "Various mobile devices").replace("_", " ").title())}</span>
        <span>Chrome UX Report field data</span>
        <span>Full visit durations</span>
        <span>Various network connections</span>
        <span>All Chrome versions</span>
      </div>
    </section>

    <div class="section-title"><span class="doticon">v</span><span>Diagnose performance issues</span></div>
    <section class="panel">
      <div class="score-row">
        {_score("Performance", categories.get("performance", {}).get("score"))}
        {_score("Accessibility", categories.get("accessibility", {}).get("score"))}
        {_score("Best Practices", categories.get("best-practices", {}).get("score"))}
        {_score("SEO", categories.get("seo", {}).get("score"))}
      </div>
      <div class="dha-grid">
        {_audit_item("Largest Contentful Paint", audits.get("largest-contentful-paint"))}
        {_audit_item("Total Blocking Time", audits.get("total-blocking-time"))}
        {_audit_item("Cumulative Layout Shift", audits.get("cumulative-layout-shift"))}
        {_audit_item("Speed Index", audits.get("speed-index"))}
        {_assessment_item(metrics.get("image_media_optimization"))}
        {_assessment_item(metrics.get("js_css_optimization"))}
        {_assessment_item(metrics.get("cdn_caching_behavior"))}
      </div>
    </section>
  </main>
</body>
</html>
"""


def _lighthouse_html(
    report_id: str,
    url: str,
    metrics: dict[str, MetricResult],
    raw: dict[str, Any] | None = None,
) -> str:
    generated_at = datetime.now(UTC)
    mobile = (raw or {}).get("mobile", {})
    desktop = (raw or {}).get("desktop", {})
    lab_source = mobile or desktop
    lighthouse = lab_source.get("lighthouseResult", {})
    categories = lighthouse.get("categories", {})
    audits = lighthouse.get("audits", {})
    final_url = lighthouse.get("finalDisplayedUrl") or url
    fetch_time = lighthouse.get("fetchTime") or generated_at.isoformat()
    environment = lighthouse.get("environment", {})

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lighthouse Report - {html.escape(report_id)}</title>
  <style>
    :root {{ --green:#0cce6b; --orange:#ffa400; --red:#ff4e42; --text:#202124; --muted:#5f6368; --line:#dadce0; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: Arial, Helvetica, sans-serif; color: var(--text); background: #fff; }}
    main {{ max-width: 1040px; margin: 0 auto; padding: 34px 28px 48px; }}
    header {{ border-bottom: 1px solid var(--line); padding-bottom: 22px; }}
    .brand {{ font-size: 28px; font-weight: 400; }}
    .url {{ margin-top: 10px; color: var(--muted); overflow-wrap: anywhere; }}
    .meta {{ margin-top: 10px; color: var(--muted); font-size: 12px; line-height: 1.6; }}
    .score-row {{ display: flex; justify-content: center; gap: 58px; padding: 32px 0; border-bottom: 1px solid var(--line); }}
    .score {{ text-align: center; font-size: 13px; color: #3c4043; }}
    .circle {{ width: 78px; height: 78px; margin: 0 auto 10px; border-radius: 50%; display: grid; place-items: center; font-size: 25px; color: var(--score-color); background: conic-gradient(var(--score-color) calc(var(--score) * 1%), #f1f3f4 0); position: relative; }}
    .circle::before {{ content: ""; position: absolute; inset: 6px; border-radius: 50%; background: #fff; }}
    .circle span {{ position: relative; }}
    h2 {{ font-size: 20px; font-weight: 400; margin: 28px 0 14px; }}
    .audit-grid, .dha-grid {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }}
    .audit, .dha-item {{ border-top: 1px solid #edf0f2; padding: 12px 0; font-size: 14px; }}
    .audit b, .dha-item b {{ display: block; margin-bottom: 5px; }}
    .status {{ display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px; margin-right: 6px; }}
    .good {{ background: #d7f2df; color: #137333; }}
    .needs_improvement {{ background: #fff0c2; color: #9a6700; }}
    .poor {{ background: #fce8e6; color: #c5221f; }}
    .not_available {{ background: #f1f3f4; color: #5f6368; }}
    @media (max-width: 760px) {{
      main {{ padding: 18px; }}
      .score-row {{ flex-wrap: wrap; gap: 22px; }}
      .audit-grid, .dha-grid {{ grid-template-columns: 1fr; }}
    }}
  </style>
</head>
<body>
  <main>
    <header>
      <div class="brand">Lighthouse Report</div>
      <div class="url">{html.escape(final_url)}</div>
      <div class="meta">
        Report ID: {html.escape(report_id)}<br>
        Generated: {html.escape(_format_report_datetime(generated_at))}<br>
        Lighthouse fetch time: {html.escape(str(fetch_time))}<br>
        User agent: {html.escape(str(environment.get("hostUserAgent", "Not available")))}
      </div>
    </header>

    <section class="score-row">
      {_score("Performance", categories.get("performance", {}).get("score"))}
      {_score("Accessibility", categories.get("accessibility", {}).get("score"))}
      {_score("Best Practices", categories.get("best-practices", {}).get("score"))}
      {_score("SEO", categories.get("seo", {}).get("score"))}
    </section>

    <h2>Lab Data</h2>
    <section class="audit-grid">
      {_audit_item("First Contentful Paint", audits.get("first-contentful-paint"))}
      {_audit_item("Largest Contentful Paint", audits.get("largest-contentful-paint"))}
      {_audit_item("Total Blocking Time", audits.get("total-blocking-time"))}
      {_audit_item("Cumulative Layout Shift", audits.get("cumulative-layout-shift"))}
      {_audit_item("Speed Index", audits.get("speed-index"))}
      {_audit_item("Time to Interactive", audits.get("interactive"))}
    </section>

    <h2>DHA CWV Assessment Mapping</h2>
    <section class="dha-grid">
      {_assessment_item(metrics.get("load_time_performance_web"))}
      {_assessment_item(metrics.get("load_time_performance_mobile"))}
      {_assessment_item(metrics.get("responsiveness_mobile_inp"))}
      {_assessment_item(metrics.get("visual_stability_mobile_cls"))}
      {_assessment_item(metrics.get("image_media_optimization"))}
      {_assessment_item(metrics.get("js_css_optimization"))}
      {_assessment_item(metrics.get("cdn_caching_behavior"))}
    </section>
  </main>
</body>
</html>
"""


def _score(label: str, score: float | None) -> str:
    value = round(score * 100) if isinstance(score, (int, float)) else None
    color = _score_color(value)
    display = str(value) if value is not None else "N/A"
    css_value = value if value is not None else 0
    return (
        f"<div class='score'><div class='circle' style='--score:{css_value}; --score-color:{color};'>"
        f"<span>{html.escape(display)}</span></div><div>{html.escape(label)}</div></div>"
    )


def _format_short_datetime(value: datetime) -> str:
    hour = value.hour % 12 or 12
    suffix = "AM" if value.hour < 12 else "PM"
    return f"{value.month}/{value.day}/{str(value.year)[-2:]}, {hour}:{value.minute:02d} {suffix}"


def _format_report_datetime(value: datetime) -> str:
    hour = value.hour % 12 or 12
    suffix = "AM" if value.hour < 12 else "PM"
    return f"{value.strftime('%b')} {value.day}, {value.year}, {hour}:{value.minute:02d}:{value.second:02d} {suffix}"


def _score_color(value: int | None) -> str:
    if value is None:
        return "#9aa0a6"
    if value >= 90:
        return "#0cce6b"
    if value >= 50:
        return "#ffa400"
    return "#ff4e42"


def _field_metric(
    label: str,
    metric: dict[str, Any] | None,
    unit: str,
    good_threshold: float,
    poor_threshold: float,
    is_milliseconds: bool,
) -> str:
    percentile = metric.get("percentile") if isinstance(metric, dict) else None
    normalized = _normalize_field_value(percentile, is_milliseconds, unit)
    category = metric.get("category") if isinstance(metric, dict) else None
    color = _field_color(category)
    display = _format_field_value(normalized, unit, is_milliseconds)
    marker = _marker_position(normalized, poor_threshold)
    return f"""
      <div class="metric" style="--metric-color:{color}; --marker-left:{marker}%;">
        <div class="metric-name">{html.escape(label)}</div>
        <div class="metric-value">{html.escape(display)}</div>
        <div class="bar"><span></span><span></span><span></span><i class="marker"></i></div>
      </div>
    """


def _normalize_field_value(value: Any, is_milliseconds: bool, unit: str) -> Any:
    if not isinstance(value, (int, float)):
        return value
    if is_milliseconds or unit:
        return value
    return value / 100 if value > 1 else value


def _format_field_value(value: Any, unit: str, is_milliseconds: bool) -> str:
    if not isinstance(value, (int, float)):
        return "Not available"
    if is_milliseconds and value >= 1000:
        return f"{round(value / 1000, 1)} s"
    if unit:
        return f"{round(value)} {unit}"
    return str(round(value / 1000, 3) if value > 10 else round(value, 3))


def _field_color(category: str | None) -> str:
    if category == "FAST":
        return "#0cce6b"
    if category == "AVERAGE":
        return "#ffa400"
    if category == "SLOW":
        return "#ff4e42"
    return "#9aa0a6"


def _marker_position(value: Any, max_value: float) -> int:
    if not isinstance(value, (int, float)) or max_value <= 0:
        return 0
    return max(0, min(100, round((value / max_value) * 90)))


def _cwv_status(field_metrics: dict[str, Any]) -> dict[str, str]:
    required = [
        field_metrics.get("LARGEST_CONTENTFUL_PAINT_MS", {}).get("category"),
        field_metrics.get("INTERACTION_TO_NEXT_PAINT", {}).get("category"),
        field_metrics.get("CUMULATIVE_LAYOUT_SHIFT_SCORE", {}).get("category"),
    ]
    if not any(required):
        return {"label": "Not enough data", "class": "failed"}
    if all(category == "FAST" for category in required):
        return {"label": "Passed", "class": "passed"}
    return {"label": "Failed", "class": "failed"}


def _audit_item(label: str, audit: dict[str, Any] | None) -> str:
    value = audit.get("displayValue") if isinstance(audit, dict) else None
    score = audit.get("score") if isinstance(audit, dict) else None
    status = "good" if score is not None and score >= 0.9 else "needs_improvement" if score is not None and score >= 0.5 else "poor"
    return (
        f"<div class='dha-item'><b>{html.escape(label)}</b>"
        f"<span class='status {status}'>{html.escape(status.replace('_', ' ').title())}</span> "
        f"{html.escape(value or 'Not available')}</div>"
    )


def _assessment_item(metric: MetricResult | None) -> str:
    if metric is None:
        return ""
    return (
        f"<div class='dha-item'><b>{html.escape(metric.label)}</b>"
        f"<span class='status {metric.status}'>{html.escape(metric.status.replace('_', ' ').title())}</span> "
        f"{html.escape(metric.value or '')}</div>"
    )


def _simple_pdf(report_id: str, tool: CwvTool, url: str, metrics: dict[str, MetricResult]) -> bytes:
    lines = [
        f"DHA Core Web Vitals Report - {tool.value.title()}",
        f"URL: {url}",
        f"Report ID: {report_id}",
        f"Generated: {datetime.now(UTC).isoformat()}",
        "",
    ]
    for metric in metrics.values():
        lines.append(f"{metric.label}: {metric.status} | {metric.value or 'N/A'}")

    escaped_lines = []
    y = 760
    for line in lines:
        for wrapped in wrap(line, 92) or [""]:
            escaped = wrapped.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            escaped_lines.append(f"BT /F1 10 Tf 40 {y} Td ({escaped}) Tj ET")
            y -= 14
            if y < 40:
                break

    content = "\n".join(escaped_lines).encode("latin-1", errors="replace")
    objects = [
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
        b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
        b"5 0 obj << /Length " + str(len(content)).encode() + b" >> stream\n" + content + b"\nendstream endobj",
    ]
    pdf = [b"%PDF-1.4\n"]
    offsets = []
    for obj in objects:
        offsets.append(sum(len(part) for part in pdf))
        pdf.append(obj + b"\n")
    xref_offset = sum(len(part) for part in pdf)
    pdf.append(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
    for offset in offsets:
        pdf.append(f"{offset:010d} 00000 n \n".encode())
    pdf.append(
        f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF".encode()
    )
    return b"".join(pdf)
