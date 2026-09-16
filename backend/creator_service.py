import asyncio
import re
import json
import logging
from typing import Optional, List, Dict, Any
from playwright.async_api import async_playwright
import backend.db as db

logger = logging.getLogger(__name__)

EMAIL_REGEX = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')


def extract_email_from_text(text: str) -> str:
    if not text:
        return ""
    matches = EMAIL_REGEX.findall(text)
    if matches:
        return matches[0].strip()
    return ""


def parse_metric_string(val_str: str) -> int:
    """Parses strings like '58.9K', '1.2M', '450' into integers."""
    if not val_str:
        return 0
    clean = val_str.upper().replace(",", "").strip()
    try:
        if clean.endswith("K"):
            return int(float(clean[:-1]) * 1000)
        elif clean.endswith("M"):
            return int(float(clean[:-1]) * 1000000)
        elif clean.endswith("B"):
            return int(float(clean[:-1]) * 1000000000)
        return int(float(clean))
    except Exception:
        return 0


async def scrape_single_creator(creator: str, page=None) -> Dict[str, Any]:
    """
    Scrapes a single TikTok creator profile using Playwright stealth.
    Extracts: followerCount, videoCount, heartCount, nickname, signature, email, verified, avatarThumb.
    Saves to SQLite creators table.
    """
    clean_creator = creator.replace("@", "").strip()
    if not clean_creator:
        return {"error": "Invalid creator username"}

    url = f"https://www.tiktok.com/@{clean_creator}"
    owns_browser = False
    browser = None
    playwright_instance = None

    try:
        if page is None:
            owns_browser = True
            playwright_instance = await async_playwright().start()
            browser = await playwright_instance.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-blink-features=AutomationControlled"]
            )
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

        await page.goto(url, wait_until="networkidle", timeout=18000)
        content = await page.content()

        meta = {
            "creator": clean_creator,
            "nickname": clean_creator,
            "follower_count": 0,
            "video_count": 0,
            "heart_count": 0,
            "signature": "",
            "email": "",
            "verified": False,
            "avatar_url": ""
        }

        # 1. Parse JSON Rehydration state
        m = re.search(r'id=\"__UNIVERSAL_DATA_FOR_REHYDRATION__\"[^>]*>(.*?)</script>', content)
        if m:
            try:
                raw_json = json.loads(m.group(1))
                scope = raw_json.get("__DEFAULT_SCOPE__", {})
                user_detail = scope.get("webapp.user-detail", {})
                stats = user_detail.get("userInfo", {}).get("stats", {})
                user = user_detail.get("userInfo", {}).get("user", {})

                meta["follower_count"] = int(stats.get("followerCount") or 0)
                meta["video_count"] = int(stats.get("videoCount") or 0)
                meta["heart_count"] = int(stats.get("heartCount") or stats.get("heart") or 0)
                meta["nickname"] = user.get("nickname") or clean_creator
                meta["signature"] = user.get("signature") or ""
                meta["verified"] = bool(user.get("verified") or False)
                meta["avatar_url"] = user.get("avatarThumb") or user.get("avatarMedium") or ""
                meta["email"] = extract_email_from_text(meta["signature"])
            except Exception as e:
                logger.warning(f"Failed parsing rehydration JSON for @{clean_creator}: {e}")

        # 2. Fallback to DOM selectors if counts are 0
        if meta["follower_count"] == 0:
            followers_el = await page.query_selector('[data-e2e="followers-count"]')
            if followers_el:
                f_text = (await followers_el.inner_text()).strip()
                meta["follower_count"] = parse_metric_string(f_text)

        if not meta["signature"]:
            bio_el = await page.query_selector('[data-e2e="user-bio"]')
            if bio_el:
                meta["signature"] = (await bio_el.inner_text()).strip()
                meta["email"] = extract_email_from_text(meta["signature"])

        if meta["video_count"] == 0:
            vm = re.search(r'\"videoCount\":\s*(\d+)', content)
            if vm:
                meta["video_count"] = int(vm.group(1))

        # Save to database
        db.upsert_creator(meta)
        return meta

    except Exception as e:
        logger.error(f"Error scraping profile for @{clean_creator}: {e}")
        return {"error": str(e), "creator": clean_creator}
    finally:
        if owns_browser:
            if browser:
                await browser.close()
            if playwright_instance:
                await playwright_instance.stop()


async def batch_enrich_creators(keyword: Optional[str] = None, max_count: int = 20) -> List[Dict[str, Any]]:
    """
    Enriches top creators for a keyword by scraping their profiles in a single browser session.
    """
    creators_list = db.get_creators_with_analytics(keyword)
    # Target creators with highest max_views who have 0 followers
    to_scrape = [c["creator"] for c in creators_list if c["follower_count"] == 0]
    if len(to_scrape) < max_count:
        existing_set = set(to_scrape)
        for c in creators_list:
            if c["creator"] not in existing_set:
                to_scrape.append(c["creator"])
                if len(to_scrape) >= max_count:
                    break

    target_creators = to_scrape[:max_count]
    if not target_creators:
        return []

    results = []
    p = await async_playwright().start()
    browser = await p.chromium.launch(
        headless=True,
        args=["--no-sandbox", "--disable-blink-features=AutomationControlled"]
    )
    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
    page = await context.new_page()
    await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

    for creator_name in target_creators:
        try:
            res = await scrape_single_creator(creator_name, page=page)
            results.append(res)
            await asyncio.sleep(1.2)
        except Exception as e:
            logger.warning(f"Batch item failed for @{creator_name}: {e}")
            results.append({"creator": creator_name, "error": str(e)})

    await browser.close()
    await p.stop()
    return results
