import logging
from typing import Any

from app.models.cwv import MetricResult


AUDIT_MAP = {
    "lcp": "largest-contentful-paint",
    "inp": "experimental-interaction-to-next-paint",
    "cls": "cumulative-layout-shift",
    "tbt": "total-blocking-time",
    "si": "speed-index",
    "fcp": "first-contentful-paint",
    "image_modern": "modern-image-formats",
    "image_optimized": "uses-optimized-images",
    "offscreen_images": "offscreen-images",
    "unused_js": "unused-javascript",
    "unused_css": "unused-css-rules",
    "render_blocking": "render-blocking-resources",
    "cache": "uses-long-cache-ttl",
    "compression": "uses-text-compression",
}
logger = logging.getLogger(__name__)


def _audit(result: dict[str, Any], audit_id: str) -> dict[str, Any]:
    return (
        result.get("lighthouseResult", {})
        .get("audits", {})
        .get(audit_id, {})
    )


def _category_score(result: dict[str, Any], category: str) -> float | None:
    score = (
        result.get("lighthouseResult", {})
        .get("categories", {})
        .get(category, {})
        .get("score")
    )
    return round(score * 100, 2) if isinstance(score, (int, float)) else None


def _display(result: dict[str, Any], audit_id: str) -> str | None:
    audit = _audit(result, audit_id)
    return audit.get("displayValue") or (
        str(audit.get("numericValue")) if audit.get("numericValue") is not None else None
    )


def _score_status(score: float | None) -> str:
    if score is None:
        return "not_available"
    if score >= 90:
        return "good"
    if score >= 50:
        return "needs_improvement"
    return "poor"


def _audit_status(result: dict[str, Any], audit_id: str) -> str:
    score = _audit(result, audit_id).get("score")
    if score is None:
        return "not_available"
    if score >= 0.9:
        return "good"
    if score >= 0.5:
        return "needs_improvement"
    return "poor"


def _metric(label: str, result: dict[str, Any], audit_id: str, source: str) -> MetricResult:
    audit = _audit(result, audit_id)
    return MetricResult(
        label=label,
        value=_display(result, audit_id),
        score=audit.get("score"),
        status=_audit_status(result, audit_id),
        source=source,
        details={
            "audit_id": audit_id,
            "title": audit.get("title"),
            "description": audit.get("description"),
        },
    )


def process_pagespeed_results(results: dict[str, Any]) -> dict[str, MetricResult]:
    logger.info("cwv processing started")
    desktop = results["desktop"]
    mobile = results["mobile"]
    desktop_performance = _category_score(desktop, "performance")
    mobile_performance = _category_score(mobile, "performance")

    metrics = {
        "load_time_performance_web": MetricResult(
            label="Load Time & Performance (Web)",
            value=f"{desktop_performance}/100" if desktop_performance is not None else None,
            score=desktop_performance,
            status=_score_status(desktop_performance),
            source="Google PageSpeed Insights / Lighthouse desktop",
            details={
                "fcp": _display(desktop, AUDIT_MAP["fcp"]),
                "lcp": _display(desktop, AUDIT_MAP["lcp"]),
                "speed_index": _display(desktop, AUDIT_MAP["si"]),
            },
        ),
        "load_time_performance_mobile": MetricResult(
            label="Load Time & Performance (Mobile)",
            value=f"{mobile_performance}/100" if mobile_performance is not None else None,
            score=mobile_performance,
            status=_score_status(mobile_performance),
            source="Google PageSpeed Insights / Lighthouse mobile",
            details={
                "fcp": _display(mobile, AUDIT_MAP["fcp"]),
                "lcp": _display(mobile, AUDIT_MAP["lcp"]),
                "speed_index": _display(mobile, AUDIT_MAP["si"]),
            },
        ),
        "responsiveness_web_inp": _metric(
            "Responsiveness - Web (INP)", desktop, AUDIT_MAP["inp"], "Lighthouse desktop"
        ),
        "responsiveness_mobile_inp": _metric(
            "Responsiveness - Mobile (INP)", mobile, AUDIT_MAP["inp"], "Lighthouse mobile"
        ),
        "visual_stability_web_cls": _metric(
            "Visual Stability - Web (CLS)", desktop, AUDIT_MAP["cls"], "Lighthouse desktop"
        ),
        "visual_stability_mobile_cls": _metric(
            "Visual Stability - Mobile (CLS)", mobile, AUDIT_MAP["cls"], "Lighthouse mobile"
        ),
        "image_media_optimization": MetricResult(
            label="Image & Media Optimization",
            value="Image audits combined",
            score=None,
            status=_combined_status(mobile, ["image_modern", "image_optimized", "offscreen_images"]),
            source="Lighthouse mobile audits",
            details=_combined_details(mobile, ["image_modern", "image_optimized", "offscreen_images"]),
        ),
        "js_css_optimization": MetricResult(
            label="JS & CSS Optimization",
            value="JS/CSS audits combined",
            score=None,
            status=_combined_status(mobile, ["unused_js", "unused_css", "render_blocking"]),
            source="Lighthouse mobile audits",
            details=_combined_details(mobile, ["unused_js", "unused_css", "render_blocking"]),
        ),
        "cdn_caching_behavior": MetricResult(
            label="CDN & Caching Behavior",
            value="Caching and compression audits combined",
            score=None,
            status=_combined_status(mobile, ["cache", "compression"]),
            source="Lighthouse mobile audits / WebPageTest cache analysis equivalent",
            details=_combined_details(mobile, ["cache", "compression"]),
        ),
    }
    logger.info(
        "cwv processing completed metric_count=%s desktop_performance=%s mobile_performance=%s",
        len(metrics),
        desktop_performance,
        mobile_performance,
    )
    return metrics


def _combined_details(result: dict[str, Any], audit_keys: list[str]) -> dict[str, Any]:
    details: dict[str, Any] = {}
    for key in audit_keys:
        audit_id = AUDIT_MAP[key]
        audit = _audit(result, audit_id)
        details[audit_id] = {
            "title": audit.get("title"),
            "display_value": audit.get("displayValue"),
            "score": audit.get("score"),
        }
    return details


def _combined_status(result: dict[str, Any], audit_keys: list[str]) -> str:
    statuses = [_audit_status(result, AUDIT_MAP[key]) for key in audit_keys]
    if any(status == "poor" for status in statuses):
        return "poor"
    if any(status == "needs_improvement" for status in statuses):
        return "needs_improvement"
    if all(status == "not_available" for status in statuses):
        return "not_available"
    return "good"
