import logging
from pathlib import Path


class ScreenshotError(RuntimeError):
    pass


logger = logging.getLogger(__name__)


async def capture_report_screenshot(html_path: Path, png_path: Path) -> Path:
    logger.info("screenshot capture requested html_path=%s png_path=%s", html_path, png_path)
    try:
        from playwright.async_api import async_playwright
    except Exception as exc:
        logger.exception("screenshot dependency missing")
        raise ScreenshotError(
            "Screenshot output requires Playwright. Install playwright and run `playwright install chromium`."
        ) from exc

    async with async_playwright() as playwright:
        logger.info("screenshot browser launch started")
        browser = await playwright.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 1200})
        await page.goto(html_path.resolve().as_uri(), wait_until="networkidle")
        await page.screenshot(path=str(png_path), full_page=True)
        await browser.close()
    logger.info("screenshot capture completed png_path=%s bytes=%s", png_path, png_path.stat().st_size)
    return png_path
