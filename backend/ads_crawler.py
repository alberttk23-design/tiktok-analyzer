import json
import logging
import random
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from playwright.sync_api import sync_playwright
import backend.db as db

PROFILE_DIR = BASE_DIR / "data" / "browser_profile"
logger = logging.getLogger("ads_crawler")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def dismiss_popups(page):
    """Dismiss TikTok announcement modals, cookie banners and revamp popups."""
    try:
        page.keyboard.press("Escape")
        page.evaluate("""() => {
            const modals = document.querySelectorAll('.byted-modal-wrapper, [class*="Popup"], .byted-modal-mask, [class*="creative_center_revamp"]');
            modals.forEach(m => m.remove());
        }""")
    except Exception as e:
        logger.debug(f"Popup dismiss notice: {e}")


def crawl_creative_center_ads(
    keyword: str = None,
    country: str = "US",
    period: int = 30,
    order_by: str = "for_you",
    max_ads: int = 40,
    job_id: str = None
) -> dict:
    """
    Crawls TikTok Creative Center Top Ads with high-performing auction data (CTR, Brand, Video, Likes).
    Uses persistent browser profile data/browser_profile to leverage real user session cookies.
    """
    if country not in ["US", "VN", "GB", "CA", "AU", "DE", "FR", "JP", "BR", "ID", "TH", "PH", "MY"]:
        country = "US"
    if period not in [7, 30, 180]:
        period = 30

    clean_kw = keyword.strip() if keyword else ""
    target_kw = clean_kw if clean_kw else f"Top Ads ({country})"

    if job_id:
        db.update_job(job_id, status="crawling_ads", progress=10, message=f"Khởi động trình duyệt cào Creative Center ({country})...")

    collected_ads_map = {}

    def handle_response(response):
        if "/top_ads/v2/list" in response.url:
            try:
                res_json = response.json()
                data_block = res_json.get("data", {})
                materials = data_block.get("materials", [])
                if materials:
                    new_in_batch = 0
                    for m in materials:
                        mid = str(m.get("id") or "")
                        if mid and mid not in collected_ads_map:
                            collected_ads_map[mid] = m
                            new_in_batch += 1
                    logger.info(f"[Ads Crawler] Intercepted {len(materials)} ads from packet ({new_in_batch} new). Total collected: {len(collected_ads_map)}")
            except Exception as e:
                logger.debug(f"[Ads Crawler] Notice parsing response: {e}")

    try:
        with sync_playwright() as p:
            logger.info(f"[Ads Crawler] Launching browser with profile: {PROFILE_DIR}...")
            context = p.chromium.launch_persistent_context(
                user_data_dir=str(PROFILE_DIR),
                headless=True,
                viewport={"width": 1440, "height": 950},
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = context.new_page()
            page.on("response", handle_response)

            base_url = f"https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en?period={period}&region={country}"
            logger.info(f"[Ads Crawler] Navigating to: {base_url}")

            if job_id:
                db.update_job(job_id, progress=25, message=f"Đang tải dữ liệu Creative Center...")

            page.goto(base_url, wait_until="domcontentloaded", timeout=40000)
            page.wait_for_timeout(3500)
            dismiss_popups(page)

            # If search keyword is requested, type into search box
            if clean_kw:
                if job_id:
                    db.update_job(job_id, progress=35, message=f"Tìm kiếm Ads theo từ khoá: '{clean_kw}'...")
                
                try:
                    search_input = page.wait_for_selector(
                        'input[placeholder*="brand or product"], input[placeholder*="Search"]',
                        timeout=7000
                    )
                    if search_input:
                        logger.info(f"[Ads Crawler] Typing search keyword: {clean_kw}")
                        search_input.click(force=True)
                        search_input.fill(clean_kw)
                        search_input.press("Enter")
                        page.wait_for_timeout(4000)
                        dismiss_popups(page)
                except Exception as e:
                    logger.warning(f"[Ads Crawler] Could not fill search input: {e}")

            # Scroll down to trigger pagination until max_ads is reached
            scroll_attempts = 0
            max_scrolls = 20
            stagnant_count = 0
            last_count = len(collected_ads_map)

            while len(collected_ads_map) < max_ads and scroll_attempts < max_scrolls:
                scroll_attempts += 1
                if job_id:
                    progress_pct = 40 + min(45, int((len(collected_ads_map) / max(1, max_ads)) * 45))
                    db.update_job(
                        job_id,
                        progress=progress_pct,
                        message=f"Đang cào dữ liệu Ads ({len(collected_ads_map)}/{max_ads} ads)..."
                    )

                # Scroll down
                page.mouse.wheel(0, 1800)
                page.keyboard.press("PageDown")
                page.wait_for_timeout(random.randint(1800, 2600))
                dismiss_popups(page)

                current_count = len(collected_ads_map)
                if current_count == last_count:
                    stagnant_count += 1
                    # Attempt aggressive scroll or end key
                    page.keyboard.press("End")
                    page.wait_for_timeout(1500)
                    if stagnant_count >= 5:
                        logger.info(f"[Ads Crawler] No new ads after {stagnant_count} scroll attempts. Ending scroll.")
                        break
                else:
                    stagnant_count = 0
                    last_count = current_count

            context.close()

        # Process and save collected ads
        ads_list = list(collected_ads_map.values())[:max_ads]
        logger.info(f"[Ads Crawler] Saving {len(ads_list)} ads to database for keyword '{target_kw}'...")

        saved_count = db.save_creative_ads(
            ads=ads_list,
            keyword=target_kw,
            country=country,
            period=period
        )

        if job_id:
            db.update_job(
                job_id,
                status="completed",
                progress=100,
                message=f"Hoàn thành! Đã cào và lưu thành công {saved_count} video Ads từ Creative Center."
            )

        summary = db.get_creative_ads_summary(keyword=target_kw)
        return {
            "status": "success",
            "keyword": target_kw,
            "country": country,
            "period": period,
            "total_crawled": len(ads_list),
            "saved_count": saved_count,
            "summary": summary
        }

    except Exception as e:
        logger.error(f"[Ads Crawler] Error during crawl: {e}", exc_info=True)
        if job_id:
            db.update_job(job_id, status="failed", progress=100, message=f"Lỗi cào Ads: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "keyword": target_kw
        }


if __name__ == "__main__":
    kw = sys.argv[1] if len(sys.argv) > 1 else ""
    country_arg = sys.argv[2] if len(sys.argv) > 2 else "US"
    res = crawl_creative_center_ads(keyword=kw, country=country_arg, max_ads=20)
    print("Result:", json.dumps(res, indent=2, ensure_ascii=False))
