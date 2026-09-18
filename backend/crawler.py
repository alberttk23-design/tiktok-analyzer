import json
import random
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


def generate_niche_search_queries(base_keyword: str) -> list:
    """
    Generate high-intent semantic query vectors for a product niche
    to bypass TikTok's ~100 search result ceiling and discover hundreds of new videos.
    Places primary hashtag vectors immediately after the base query.
    """
    kw = base_keyword.strip()
    clean_tag = re.sub(r'[^a-zA-Z0-9]', '', kw).lower()

    modifiers = [
        kw,                                                     # Vector 1: Base query first (e.g. "faux olive tree")
        f"#{clean_tag}" if clean_tag else f"#{kw}",            # Vector 2: Primary hashtag (e.g. "#fauxolivetree")
        f"amazon {kw}",                                         # Vector 3: Top shopping / storefront intent
        f"{kw} review",                                         # Vector 4: Buyer review & UGC proof
        f"honest {kw} review",                                  # Vector 5: Critical & authentic reviews
        f"realistic {kw}",                                      # Vector 6: Realism proof & quality comparison
        f"#{clean_tag}decor" if clean_tag else f"{kw} decor",    # Vector 7: Niche decor hashtag
        f"{kw} styling",                                        # Vector 8: Home decor styling & setup
        f"{kw} unboxing",                                       # Vector 9: Product unboxing
        f"best {kw}",                                           # Vector 10: Best recommendations
        f"#{clean_tag}finds" if clean_tag else f"{kw} finds",    # Vector 11: Niche finds hashtag
        f"{kw} tiktok shop",                                    # Vector 12: TikTok Shop showcase
        f"{kw} finds",                                          # Vector 13: Viral finds
        f"affordable {kw}",                                     # Vector 14: Budget / deal seekers
        f"{kw} haul",                                           # Vector 15: Shopping hauls
        f"{kw} aesthetic",                                      # Vector 16: Room aesthetic
        f"{kw} must haves",                                     # Vector 17: Viral must haves
        f"worth it {kw}",                                       # Vector 18: Buyer evaluation
        f"{kw} target",                                         # Vector 19: Alternative retail
        f"{kw} comparison",                                     # Vector 20: Comparative tests
        f"diy {kw}"                                             # Vector 21: DIY & craftsmanship
    ]
    seen = set()
    result = []
    for m in modifiers:
        clean = m.strip()
        if clean and clean not in seen:
            seen.add(clean)
            result.append(clean)
    return result


def load_and_ensure_search_results(page, search_url: str, query_str: str, max_retries: int = 3) -> bool:
    """
    Load TikTok search page and strictly guarantee that video cards / results
    are loaded into the DOM. If the page lags, shows 'Something went wrong',
    or fails to render video cards, automatically clicks 'Try again' or reloads (F5).
    """
    for attempt in range(1, max_retries + 1):
        print(f"[Crawler] Loading search vector '{query_str}' (Attempt {attempt}/{max_retries})...")
        try:
            if attempt == 1:
                page.goto(search_url, timeout=45000)
            else:
                print(f"[Crawler] Refreshing (F5) page for '{query_str}'...")
                page.reload(wait_until="domcontentloaded", timeout=45000)

            page.wait_for_load_state("domcontentloaded")
            page.wait_for_timeout(3000)
        except Exception as e:
            print(f"[Crawler] Navigation attempt {attempt} notice: {e}")

        # Auto-dismiss modal / login popups
        try:
            page.keyboard.press("Escape")
            page.evaluate("""() => {
                const modalClose = document.querySelector('[data-e2e="modal-close-inner-button"], button[aria-label="Close"]');
                if (modalClose) modalClose.click();
            }""")
        except Exception:
            pass

        # Check if error screen or "Try again" button is present
        has_err = page.evaluate("""() => {
            const errTitle = document.querySelector('[data-e2e="search-error-title"]');
            const btns = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
            return Boolean(errTitle || btns.includes('Try again'));
        }""")

        if has_err:
            print(f"[Crawler] TikTok showed 'Something went wrong' on '{query_str}'. Attempting recovery via 'Try again' / F5...")
            try:
                page.click("text='Try again'", timeout=2500)
                page.wait_for_timeout(3000)
            except Exception:
                page.reload(wait_until="domcontentloaded", timeout=30000)
                page.wait_for_timeout(3500)

        # Count actual video card elements in DOM
        cards_count = page.evaluate("""() => {
            return document.querySelectorAll('[data-e2e*="search_top-item"], [data-e2e*="search-item"], [class*="DivItemContainer"]').length;
        }""")

        if cards_count > 0:
            print(f"[Crawler] Successfully verified {cards_count} video cards loaded for '{query_str}'!")
            return True
        else:
            print(f"[Crawler] Notice: 0 video cards found on attempt {attempt}. Will retry/F5...")
            page.wait_for_timeout(2000)

    print(f"[Crawler] Could not load video cards for '{query_str}' after {max_retries} attempts.")
    return False


def crawl_tiktok_videos(keyword, target_count=20, job_id=None, target_folder=None):
    """
    Search TikTok using Multi-Vector Query Expansion, filter out existing URLs from DB history,
    collect target_count brand-new videos, fetch metadata, comments, score, and store to DB.
    If target_folder is specified, saves all discovered videos under that niche folder name.
    """
    pool_keyword = (target_folder or keyword).strip()
    if job_id:
        db.update_job(job_id, status="crawling", progress=5, message=f"Loading history for '{pool_keyword}'...")

    existing_ids, existing_urls = db.get_existing_video_ids()
    print(f"[Crawler] Found {len(existing_ids)} existing videos in DB history.")

    query_vectors = generate_niche_search_queries(keyword)
    print(f"[Crawler] Generated {len(query_vectors)} intelligent search vectors for '{keyword}' (Saving into folder '{pool_keyword}'): {query_vectors}")

    discovered_new_videos = {}  # vid -> video_record
    seen_in_session = set()

    if job_id:
        db.update_job(job_id, status="crawling", progress=12, message=f"Starting Multi-Vector Stream Crawler for '{keyword}'...")

    PROFILE_DIR.mkdir(parents=True, exist_ok=True)

    current_vector_has_more = [True]

    def handle_response(response):
        """Intercept TikTok internal search API responses containing raw video metadata."""
        if ("/api/search/item/full/" in response.url or "/api/search/general/full/" in response.url) and response.status == 200:
            try:
                data = response.json()
                if data.get("has_more") == 0:
                    current_vector_has_more[0] = False

                items = data.get("item_list", []) or [e.get("item") for e in data.get("data", []) if e.get("item")]
                for item in items:
                    if not item or not isinstance(item, dict):
                        continue
                    vid = str(item.get("id") or item.get("video_id") or "")
                    if not vid or vid in seen_in_session:
                        continue
                    seen_in_session.add(vid)

                    author_obj = item.get("author") or {}
                    creator = author_obj.get("uniqueId") or author_obj.get("nickname") or "creator"
                    author_stats = item.get("authorStats") or {}
                    creator_followers = int(author_stats.get("followerCount") or author_obj.get("followerCount") or 0)
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

                    # Sound & Music Intelligence
                    music_obj = item.get("music") or item.get("musicItem") or {}
                    sound_title = str(music_obj.get("title") or "").strip()
                    sound_author = str(music_obj.get("authorName") or "").strip()
                    sound_id = str(music_obj.get("id") or "")
                    sound_original = 1 if bool(music_obj.get("original", False)) else 0

                    caption_lower = caption.lower()
                    title_lower = sound_title.lower()

                    is_orig = sound_original == 1 or any(sig in title_lower for sig in ["original sound", "sonido original", "som original", "original ton", "原創音樂", "原聲"])
                    is_commercial_song = not is_orig and bool(sound_title) and not ("original sound" in title_lower or "sonido original" in title_lower)

                    voiceover_signals = ["review", "honest", "unboxing", "haul", "talking", "story", "pov", "rant", "opinion", "thoughts", "listen", "i bought", "i found", "i ordered", "here is", "here are"]
                    has_voice_cues = any(sig in caption_lower or sig in title_lower for sig in voiceover_signals)

                    if is_commercial_song:
                        # Commercial / Licensed music track from TikTok Library (BGM / Song)
                        # Default to music_only (pure BGM) so silent unboxings with music are not mislabeled as voiceover
                        sound_type = "music_only"
                    elif is_orig:
                        # Genuine creator microphone recording (Original Audio)
                        if "asmr" in caption_lower or "asmr" in title_lower:
                            sound_type = "asmr"
                        else:
                            sound_type = "voiceover"
                    else:
                        sound_type = "music_only"

                    discovered_new_videos[vid] = {
                        "video_id": vid,
                        "url": clean_url,
                        "keyword": pool_keyword,  # All vectors pool under the parent niche folder keyword
                        "creator": creator,
                        "creator_followers": creator_followers,
                        "caption": caption,
                        "upload_date": upload_date,
                        "duration_sec": duration,
                        "views": views,
                        "likes": likes,
                        "comments": comments,
                        "reposts": reposts,
                        "saves": saves,
                        "engagement_rate": eng_rate,
                        "score": score,
                        "sound_title": sound_title,
                        "sound_author": sound_author,
                        "sound_original": sound_original,
                        "sound_type": sound_type,
                        "sound_id": sound_id
                    }
                    print(f"[Crawler Stream] Discovered NEW video #{len(discovered_new_videos)} (Scanned: {len(seen_in_session)}): @{creator} ({views:,} views) - {vid}")
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

        # Traverse query vectors until target_count brand-new videos are discovered
        for q_idx, query_str in enumerate(query_vectors):
            if len(discovered_new_videos) >= target_count:
                print(f"[Crawler] Successfully reached target {target_count} brand-new videos!")
                break

            current_vector_has_more[0] = True
            search_url = f"https://www.tiktok.com/search?q={quote(query_str)}"
            print(f"[Crawler] >>> Traversing Vector {q_idx + 1}/{len(query_vectors)}: '{query_str}' ({len(discovered_new_videos)}/{target_count} new found so far)")

            if job_id:
                pct = 15 + min(40, int((len(discovered_new_videos) / target_count) * 40))
                db.update_job(
                    job_id,
                    status="crawling",
                    progress=pct,
                    message=f"Scanning vector '{query_str}' ({len(discovered_new_videos)}/{target_count} new videos found)..."
                )

            # Load page and guarantee video cards are rendered (auto-reloads / F5 if lagged or 'Something went wrong')
            loaded = load_and_ensure_search_results(page, search_url, query_str, max_retries=3)
            if not loaded:
                print(f"[Crawler] Skipping vector '{query_str}' because video cards failed to render after F5 retries.")
                continue

            # Focus safely on page body without clicking on video cards
            try:
                page.evaluate("() => document.body.focus()")
                # Safe click on top margin / whitespace (never on video thumbnails)
                page.mouse.click(100, 100)
                page.keyboard.press("Escape")
                page.wait_for_timeout(200)
            except Exception:
                pass

            # Scale scroll depth based on desired batch size (more scrolls if targeting 100-200)
            max_scrolls_per_query = 35 if target_count >= 100 else (25 if target_count >= 50 else 18)
            max_stagnant = 7
            consecutive_stagnant = 0
            last_total_seen = len(seen_in_session)
            last_dom_cards = page.evaluate("""() => {
                return document.querySelectorAll('[data-e2e*="search_top-item"], [data-e2e*="search-item"], [class*="DivItemContainer"]').length;
            }""")

            for scroll_idx in range(max_scrolls_per_query):
                if len(discovered_new_videos) >= target_count:
                    break

                # Guard: if TikTok ever opens a video detail modal, dismiss it immediately to keep browsing the search list
                if "/video/" in page.url or page.evaluate("() => Boolean(document.querySelector('[data-e2e=\"modal-close-inner-button\"]'))"):
                    page.keyboard.press("Escape")
                    page.evaluate("""() => {
                        const closeBtn = document.querySelector('[data-e2e="modal-close-inner-button"], button[aria-label="Close"]');
                        if (closeBtn) closeBtn.click();
                    }""")
                    page.wait_for_timeout(200)

                # 1. Multi-step progressive wheel scroll in search results grid margin
                page.mouse.move(random.randint(200, 350), random.randint(300, 500))
                for _ in range(3):
                    page.mouse.wheel(0, random.randint(600, 950))
                    page.wait_for_timeout(random.randint(150, 250))

                # 2. Key navigation down on search grid
                page.keyboard.press("PageDown")
                page.keyboard.press("PageDown")
                page.wait_for_timeout(random.randint(200, 350))

                # 3. Direct container scroll on #grid-main / main to guarantee scroll events fire
                page.evaluate("""() => {
                    const targets = [
                        document.querySelector('main#grid-main'),
                        document.querySelector('main'),
                        document.querySelector('[class*="SearchGridLayoutCon"]'),
                        document.documentElement,
                        document.body
                    ];
                    for (const t of targets) {
                        if (t) {
                            t.scrollTop += 1200;
                            t.dispatchEvent(new Event('scroll', { bubbles: true }));
                        }
                    }
                }""")

                # 4. If stagnant, perform re-trigger gesture on container
                if consecutive_stagnant > 0:
                    page.evaluate("""() => {
                        const m = document.querySelector('main#grid-main') || document.querySelector('main') || document.documentElement;
                        if (m) {
                            m.scrollTop -= 350;
                            m.dispatchEvent(new Event('scroll', { bubbles: true }));
                        }
                    }""")
                    page.wait_for_timeout(300)
                    page.evaluate("""() => {
                        const m = document.querySelector('main#grid-main') || document.querySelector('main') || document.documentElement;
                        if (m) {
                            m.scrollTop += 800;
                            m.dispatchEvent(new Event('scroll', { bubbles: true }));
                        }
                    }""")
                    page.keyboard.press("End")

                # 5. Realistic human jitter wait for TikTok CDN & API packet streaming
                wait_delay = random.uniform(2.8, 3.8)
                time.sleep(wait_delay)

                current_total_seen = len(seen_in_session)
                current_dom_cards = page.evaluate("""() => {
                    return document.querySelectorAll('[data-e2e*="search_top-item"], [data-e2e*="search-item"], [class*="DivItemContainer"]').length;
                }""")

                # Dual progress check: network stream OR DOM cards count increase
                if current_total_seen > last_total_seen or current_dom_cards > last_dom_cards:
                    consecutive_stagnant = 0
                    last_total_seen = current_total_seen
                    last_dom_cards = current_dom_cards
                else:
                    consecutive_stagnant += 1
                    print(f"[Crawler] Vector '{query_str}': waiting/retrying scroll ({consecutive_stagnant}/{max_stagnant})...")

                    # If TikTok API officially returned has_more == 0, break early to next vector
                    if not current_vector_has_more[0]:
                        print(f"[Crawler] Vector '{query_str}' reported has_more=0 by TikTok API. Exhausted.")
                        break

                    if consecutive_stagnant >= max_stagnant:
                        print(f"[Crawler] Vector '{query_str}' exhausted after {max_stagnant} thorough retries. Switching to next vector.")
                        break

                if job_id:
                    pct = 15 + min(40, int((len(discovered_new_videos) / target_count) * 40))
                    db.update_job(
                        job_id,
                        progress=pct,
                        message=f"Searching '{query_str}': scanned {current_total_seen} videos, found {len(discovered_new_videos)}/{target_count} new..."
                    )

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
