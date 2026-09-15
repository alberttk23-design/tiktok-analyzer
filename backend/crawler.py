import json
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from playwright.sync_api import sync_playwright
import backend.db as db
import backend.comment_crawler as comment_crawler
PROFILE_DIR = BASE_DIR / "data" / "browser_profile"
YTDLP_BIN = BASE_DIR / ".venv" / "bin" / "yt-dlp"

if not YTDLP_BIN.exists():
    YTDLP_BIN = Path("yt-dlp")


def extract_video_id(url):
    match = re.search(r"/video/(\d+)", url)
    if match:
        return match.group(1)
    return None


def fetch_video_metadata(url):
    """Fetch video metadata using yt-dlp without downloading the video."""
    cmd = [
        str(YTDLP_BIN),
        "--dump-json",
        "--no-download",
        "--no-warnings",
        url
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=40)
        if res.returncode == 0 and res.stdout.strip():
            return json.loads(res.stdout)
    except Exception as e:
        print(f"[Crawler] yt-dlp error for {url}: {e}")
    return {}


def calculate_viral_score(views, likes, comments, reposts, saves):
    """Calculate composite performance / viral score out of 100."""
    views = max(0, views or 0)
    likes = max(0, likes or 0)
    comments = max(0, comments or 0)
    reposts = max(0, reposts or 0)
    saves = max(0, saves or 0)

    if views > 0:
        engagement_rate = (likes + comments + reposts + saves) / views
    else:
        engagement_rate = 0.0

    # Views component (0 - 40 pts, maxes at 200k views)
    views_norm = min(views / 200000.0, 1.0) * 40.0

    # Engagement rate component (0 - 40 pts, 10% engagement = 40 pts)
    eng_norm = min(engagement_rate * 10.0, 1.0) * 40.0

    # Comments / community buzz component (0 - 20 pts, 100 comments = 20 pts)
    comments_norm = min(comments / 100.0, 1.0) * 20.0

    score = round(views_norm + eng_norm + comments_norm, 2)
    return round(engagement_rate, 6), score


def crawl_tiktok_videos(keyword, target_count=20, job_id=None):
    """
    Search TikTok for keyword, filter out existing URLs from DB history,
    collect target_count new videos, fetch metadata, comments, score, and store to DB.
    """
    if job_id:
        db.update_job(job_id, status="crawling", progress=5, message=f"Loading history for '{keyword}'...")

    existing_ids, existing_urls = db.get_existing_video_ids()
    print(f"[Crawler] Found {len(existing_ids)} existing videos in DB history.")

    search_url = f"https://www.tiktok.com/search/video?q={quote(keyword)}"
    discovered_new_videos = {}  # vid -> video_record
    seen_in_session = set()

    if job_id:
        db.update_job(job_id, status="crawling", progress=15, message=f"Opening TikTok stream for '{keyword}'...")

    PROFILE_DIR.mkdir(parents=True, exist_ok=True)

    def handle_response(response):
        """Intercept TikTok internal search API responses containing raw video metadata."""
        if ("/api/search/item/full/" in response.url or "/api/search/general/full/" in response.url) and response.status == 200:
            try:
                data = response.json()
                items = data.get("item_list", []) or [e.get("item") for e in data.get("data", []) if e.get("item")]
                print(f"[Crawler Stream] Intercepted batch with {len(items)} items from TikTok API.")
                for item in items:
                    if not item or not isinstance(item, dict):
                        continue
                    vid = str(item.get("id") or item.get("video_id") or "")
                    if not vid or vid in seen_in_session:
                        continue
                    seen_in_session.add(vid)

                    author_obj = item.get("author") or {}
                    creator = author_obj.get("uniqueId") or author_obj.get("nickname") or "creator"
                    clean_url = f"https://www.tiktok.com/@{creator}/video/{vid}"

                    # Check DB history to skip duplicates instantly
                    if vid in existing_ids or clean_url in existing_urls:
                        continue

                    stats = item.get("stats") or {}
                    views = int(stats.get("playCount") or 0)
                    likes = int(stats.get("diggCount") or 0)
                    comments = int(stats.get("commentCount") or 0)
                    saves = int(stats.get("collectCount") or 0)
                    reposts = int(stats.get("shareCount") or 0)
                    caption = item.get("desc") or ""

                    video_info = item.get("video") or {}
                    duration = int(video_info.get("duration") or 0)

                    create_time = item.get("createTime")
                    if create_time:
                        upload_date = datetime.fromtimestamp(int(create_time)).strftime("%Y-%m-%d")
                    else:
                        upload_date = datetime.now().strftime("%Y-%m-%d")

                    eng_rate, score = calculate_viral_score(views, likes, comments, reposts, saves)

                    discovered_new_videos[vid] = {
                        "video_id": vid,
                        "url": clean_url,
                        "keyword": keyword,
                        "creator": creator,
                        "caption": caption,
                        "upload_date": upload_date,
                        "duration_sec": duration,
                        "views": views,
                        "likes": likes,
                        "comments": comments,
                        "reposts": reposts,
                        "saves": saves,
                        "engagement_rate": eng_rate,
                        "score": score
                    }
                    print(f"[Crawler Stream] Discovered NEW video #{len(discovered_new_videos)}: @{creator} ({views:,} views) - {vid}")
            except Exception as e:
                print(f"[Crawler Stream] Notice parsing API packet: {e}")

    with sync_playwright() as p:
        print(f"[Crawler] Launching Playwright browser with profile {PROFILE_DIR}...")
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=False,
            viewport={"width": 1440, "height": 1000},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        page.on("response", handle_response)

        try:
            page.goto(search_url, timeout=60000)
            page.wait_for_timeout(4000)
        except Exception as e:
            print(f"[Crawler] Page navigation error: {e}")

        # Intelligent scroll loop: scroll until enough NEW videos are collected or end of search
        max_scroll_rounds = 45
        consecutive_stagnant = 0
        last_total_seen = len(seen_in_session)

        for scroll_idx in range(max_scroll_rounds):
            if len(discovered_new_videos) >= target_count:
                print(f"[Crawler] Successfully reached target {target_count} brand-new videos!")
                break

            # Scroll using DOM scroll, mouse wheel, and keyboard
            page.evaluate("window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});")
            page.mouse.wheel(0, 4000)
            page.keyboard.press("PageDown")
            page.keyboard.press("PageDown")
            page.wait_for_timeout(2500)

            current_total_seen = len(seen_in_session)
            if current_total_seen == last_total_seen:
                consecutive_stagnant += 1
                if consecutive_stagnant >= 6:
                    print(f"[Crawler] No new items incoming from TikTok API stream after {scroll_idx + 1} scrolls. Stopping.")
                    break
            else:
                consecutive_stagnant = 0
                last_total_seen = current_total_seen

            if job_id:
                pct = 15 + min(40, int((len(discovered_new_videos) / target_count) * 40))
                db.update_job(
                    job_id,
                    progress=pct,
                    message=f"Scanned {current_total_seen} videos from TikTok. Found {len(discovered_new_videos)}/{target_count} brand-new videos..."
                )

        # Fallback for any DOM links if API was throttled
        if len(discovered_new_videos) < target_count:
            dom_links = page.locator("a[href*='/video/']")
            d_count = dom_links.count()
            for i in range(d_count):
                if len(discovered_new_videos) >= target_count:
                    break
                href = dom_links.nth(i).get_attribute("href")
                if not href:
                    continue
                if href.startswith("/"):
                    href = "https://www.tiktok.com" + href
                clean_url = href.split("?")[0]
                vid = extract_video_id(clean_url)
                if vid and vid not in seen_in_session and vid not in existing_ids and vid not in discovered_new_videos:
                    seen_in_session.add(vid)
                    discovered_new_videos[vid] = {
                        "video_id": vid,
                        "url": clean_url,
                        "keyword": keyword,
                        "creator": "creator",
                        "caption": "",
                        "upload_date": datetime.now().strftime("%Y-%m-%d"),
                        "duration_sec": 0,
                        "views": 0,
                        "likes": 0,
                        "comments": 0,
                        "reposts": 0,
                        "saves": 0,
                        "engagement_rate": 0.0,
                        "score": 50.0,
                        "_need_ytdlp": True
                    }

        context.close()

    new_candidate_list = list(discovered_new_videos.values())[:target_count]
    print(f"[Crawler] Total new videos ready to process: {len(new_candidate_list)}")

    if not new_candidate_list:
        if job_id:
            db.update_job(job_id, status="crawling", progress=50, message="No new videos found (all existing in database).")
        return []

    processed_videos = []
    total_new = len(new_candidate_list)

    for idx, vrec in enumerate(new_candidate_list, 1):
        vid = vrec["video_id"]
        url = vrec["url"]
        creator = vrec["creator"]
        msg = f"Processing Voice of Customer [{idx}/{total_new}]: @{creator} ({vid})"
        print(f"[Crawler] {msg}")

        if job_id:
            pct = 55 + int((idx / total_new) * 20)
            db.update_job(job_id, status="fetching_metadata", progress=pct, message=msg, new_videos_count=len(processed_videos))

        # Only use yt-dlp fallback if metadata was not in API packet
        if vrec.get("_need_ytdlp"):
            meta = fetch_video_metadata(url)
            views = meta.get("view_count") or 0
            likes = meta.get("like_count") or 0
            comments = meta.get("comment_count") or 0
            reposts = meta.get("repost_count") or 0
            saves = meta.get("save_count") or 0
            creator = meta.get("uploader") or creator
            caption = meta.get("description") or meta.get("title") or ""
            duration = meta.get("duration") or 0
            timestamp = meta.get("timestamp")
            upload_date = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d") if timestamp else datetime.now().strftime("%Y-%m-%d")
            eng_rate, score = calculate_viral_score(views, likes, comments, reposts, saves)

            vrec.update({
                "creator": creator,
                "caption": caption,
                "upload_date": upload_date,
                "duration_sec": duration,
                "views": views,
                "likes": likes,
                "comments": comments,
                "reposts": reposts,
                "saves": saves,
                "engagement_rate": eng_rate,
                "score": score
            })
            vrec.pop("_need_ytdlp", None)

        db.save_video(vrec)
        processed_videos.append(vrec)

        # Automatically fetch initial comments & Voice of Customer insights
        try:
            comm_list = comment_crawler.fetch_comments_for_video(vid, max_comments=100, author_username=creator)
            if comm_list:
                db.save_comments(vid, comm_list)
                ins = comment_crawler.extract_comment_insights(comm_list, keyword)
                db.save_comment_insights(vid, keyword, ins)
        except Exception as e:
            print(f"[Crawler] Comment crawling notice for {vid}: {e}")

    print(f"[Crawler] Successfully saved {len(processed_videos)} brand-new videos to DB.")
    if job_id:
        db.update_job(
            job_id,
            progress=75,
            message=f"Saved {len(processed_videos)} new videos & customer insights to database.",
            new_videos_count=len(processed_videos)
        )

    return processed_videos


if __name__ == "__main__":
    kw = sys.argv[1] if len(sys.argv) > 1 else "faux olive tree"
    lim = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    crawl_tiktok_videos(kw, target_count=lim)
