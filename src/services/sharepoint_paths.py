import re
from urllib.parse import urlparse

from app.core.config import settings


def _clean_segment(value: str) -> str:
    cleaned = re.sub(r'[~"#%&*:<>?/\\{|}]', " ", value)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .")
    return cleaned or "Unknown"


def _company_name_from_url(url: str) -> str:
    hostname = urlparse(url).hostname or urlparse(f"https://{url}").hostname or url
    hostname = hostname.lower().removeprefix("www.")
    name = hostname.split(".")[0]
    words = [word for word in re.split(r"[-_\s]+", name) if word]
    return _clean_segment(" ".join(word.capitalize() for word in words))


def build_sharepoint_report_folder(url: str, route_folder: str) -> str:
    company_folder = _clean_segment(
        f"{_company_name_from_url(url)} - {settings.sharepoint_reports_project_suffix}"
    )
    segments = [
        settings.sharepoint_reports_root,
        company_folder,
        settings.sharepoint_reports_automation_folder,
        route_folder,
    ]
    return "/".join(_clean_segment(segment) for segment in segments)
