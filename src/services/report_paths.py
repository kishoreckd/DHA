import re
from pathlib import Path
from urllib.parse import urlparse

from app.core.config import settings


def company_slug_from_url(url: str) -> str:
    hostname = urlparse(url).hostname or urlparse(f"https://{url}").hostname or url
    hostname = hostname.lower().removeprefix("www.")
    name = hostname.split(".")[0]
    slug = re.sub(r"[^a-z0-9]+", "-", name).strip("-")
    return slug or "unknown"


def report_dir_for_url(tool_path: str, url: str) -> Path:
    report_dir = settings.reports_dir / tool_path / company_slug_from_url(url)
    report_dir.mkdir(parents=True, exist_ok=True)
    return report_dir
