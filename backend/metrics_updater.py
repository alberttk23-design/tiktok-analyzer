import json
import random
import re
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import backend.db as db
from backend.crawler import calculate_viral_score, fetch_video_metadata

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
]


def fetch_single_video_stats(url: str, video_id: str = None) -> Optional[Dict]:
    """
    Fetch the latest live performance metrics (views, likes, comments, saves, shares)
    directly from TikTok hydration payload, falling back to yt-dlp if needed.
    """
    if not url:
        return None

    # 1. Primary Strategy: Direct Universal Rehydration extraction
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=9) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            m = re.search(r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>', html)
            if m:
                payload = json.loads(m.group(1))
                default_scope = payload.get("__DEFAULT_SCOPE__", {})
                item_info = (
                    default_scope.get("webapp.video-detail", {})
                    .get("itemInfo", {})
                    .get("itemStruct", {})
                )
                stats = item_info.get("stats")
                if stats:
                    views = int(stats.get("playCount") or 0)
                    likes = int(stats.get("diggCount") or 0)
                    comments = int(stats.get("commentCount") or 0)
                    saves = int(stats.get("collectCount") or 0)
                    reposts = int(stats.get("shareCount") or 0)

                    author_stats = item_info.get("authorStats") or {}
                    followers = int(author_stats.get("followerCount") or 0)

                    eng_rate, score = calculate_viral_score(views, likes, comments, reposts, saves)
                    return {
                        "video_id": video_id or item_info.get("id"),
                        "views": views,
                        "likes": likes,
                        "comments": comments,
                        "reposts": reposts,
                        "saves": saves,
                        "engagement_rate": eng_rate,
                        "score": score,
                        "creator_followers": followers,
                        "source": "tiktok_web",
                    }
    except Exception:
        pass

    # 2. Secondary Fallback: yt-dlp metadata extraction
    try:
        meta = fetch_video_metadata(url)
        if meta and meta.get("view_count") is not None:
            views = int(meta.get("view_count") or 0)
            likes = int(meta.get("like_count") or 0)
            comments = int(meta.get("comment_count") or 0)
            reposts = int(meta.get("repost_count") or 0)
            saves = int(meta.get("save_count") or 0)
            eng_rate, score = calculate_viral_score(views, likes, comments, reposts, saves)
            return {
                "video_id": video_id or meta.get("id"),
                "views": views,
                "likes": likes,
                "comments": comments,
                "reposts": reposts,
                "saves": saves,
                "engagement_rate": eng_rate,
                "score": score,
                "creator_followers": 0,
                "source": "yt-dlp",
            }
    except Exception:
        pass

    return None


def update_videos_metrics(
    keyword: Optional[str] = None,
    limit: Optional[int] = None,
    max_workers: int = 6,
    job_id: Optional[str] = None,
    progress_callback: Optional[Callable[[int, int, str, dict], None]] = None,
) -> Dict:
    """
    Batch refresh view counts, likes, comments, saves, shares, and viral scores
    for all crawled videos in the database.
    """
    t0 = time.time()
    videos = db.get_videos_for_metrics_update(keyword=keyword, limit=limit, order_by="views DESC")
    total_videos = len(videos)

    if total_videos == 0:
        if job_id:
            db.update_job(
                job_id,
                status="completed",
                progress=100,
                message="Không có video nào cần cập nhật chỉ số.",
            )
        return {
            "total_videos": 0,
            "updated_videos": 0,
            "elapsed_seconds": 0,
            "message": "Không tìm thấy video trong database.",
        }

    # Calculate baseline totals before update
    views_before = sum(int(v.get("views") or 0) for v in videos)
    likes_before = sum(int(v.get("likes") or 0) for v in videos)
    saves_before = sum(int(v.get("saves") or 0) for v in videos)
    comments_before = sum(int(v.get("comments") or 0) for v in videos)

    if job_id:
        db.update_job(
            job_id,
            status="processing",
            progress=5,
            message=f"Bắt đầu đồng bộ chỉ số cho {total_videos:,} video ({max_workers} luồng song song)...",
        )

    updated_updates = []
    success_count = 0
    failed_count = 0
    increased_count = 0

    views_after_dict = {v["video_id"]: int(v.get("views") or 0) for v in videos}
    likes_after_dict = {v["video_id"]: int(v.get("likes") or 0) for v in videos}
    saves_after_dict = {v["video_id"]: int(v.get("saves") or 0) for v in videos}
    comments_after_dict = {v["video_id"]: int(v.get("comments") or 0) for v in videos}

    # Helper function for worker threads
    def worker_fetch(v_record):
        vid = v_record["video_id"]
        v_url = v_record["url"]
        stats = fetch_single_video_stats(v_url, video_id=vid)
        return v_record, stats

    # Process in concurrent pool
    completed_so_far = 0
    last_reported_time = time.time()
    BATCH_COMMIT_SIZE = 20

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_vid = {executor.submit(worker_fetch, v): v for v in videos}

        for future in as_completed(future_to_vid):
            completed_so_far += 1
            v_rec, new_stats = future.result()
            vid = v_rec["video_id"]

            if new_stats:
                success_count += 1
                new_v = new_stats["views"]
                new_l = new_stats["likes"]
                new_s = new_stats["saves"]
                new_c = new_stats["comments"]

                old_v = int(v_rec.get("views") or 0)
                old_l = int(v_rec.get("likes") or 0)
                old_s = int(v_rec.get("saves") or 0)
                old_c = int(v_rec.get("comments") or 0)

                if new_v > old_v or new_l > old_l or new_s > old_s or new_c > old_c:
                    increased_count += 1

                views_after_dict[vid] = new_v
                likes_after_dict[vid] = new_l
                saves_after_dict[vid] = new_s
                comments_after_dict[vid] = new_c

                updated_updates.append(new_stats)
            else:
                failed_count += 1

            # Batch write to SQLite
            if len(updated_updates) >= BATCH_COMMIT_SIZE:
                db.batch_update_video_metrics(updated_updates)
                updated_updates = []

            # Progress notifications
            now = time.time()
            if (
                now - last_reported_time >= 1.2
                or completed_so_far == total_videos
                or completed_so_far % 15 == 0
            ):
                last_reported_time = now
                pct = 5 + int((completed_so_far / total_videos) * 90)

                views_gained = sum(views_after_dict.values()) - views_before
                likes_gained = sum(likes_after_dict.values()) - likes_before
                saves_gained = sum(saves_after_dict.values()) - saves_before

                msg = (
                    f"Đang đồng bộ: {completed_so_far:,}/{total_videos:,} video "
                    f"(+{views_gained:,} views, +{likes_gained:,} tim, +{saves_gained:,} lưu)..."
                )

                if job_id:
                    db.update_job(job_id, status="processing", progress=pct, message=msg)
                if progress_callback:
                    progress_callback(
                        completed_so_far,
                        total_videos,
                        msg,
                        {
                            "views_gained": views_gained,
                            "likes_gained": likes_gained,
                            "saves_gained": saves_gained,
                        },
                    )

    # Commit any remaining updates
    if updated_updates:
        db.batch_update_video_metrics(updated_updates)
        updated_updates = []

    elapsed = round(time.time() - t0, 2)
    views_final = sum(views_after_dict.values())
    likes_final = sum(likes_after_dict.values())
    saves_final = sum(saves_after_dict.values())
    comments_final = sum(comments_after_dict.values())

    views_gained = views_final - views_before
    likes_gained = likes_final - likes_before
    saves_gained = saves_final - saves_before
    comments_gained = comments_final - comments_before

    summary_msg = (
        f"Hoàn tất cập nhật {success_count:,}/{total_videos:,} video trong {elapsed}s! "
        f"Views mới: {views_final:,} (+{views_gained:,}), "
        f"Tim: {likes_final:,} (+{likes_gained:,}), "
        f"Lưu: {saves_final:,} (+{saves_gained:,}), "
        f"Bình luận: {comments_final:,} (+{comments_gained:,})."
    )

    if job_id:
        db.update_job(
            job_id,
            status="completed",
            progress=100,
            message=summary_msg,
            new_videos_count=increased_count,
        )

    return {
        "status": "success",
        "total_videos": total_videos,
        "success_count": success_count,
        "failed_count": failed_count,
        "increased_count": increased_count,
        "views_before": views_before,
        "views_after": views_final,
        "views_gained": views_gained,
        "likes_before": likes_before,
        "likes_after": likes_final,
        "likes_gained": likes_gained,
        "saves_before": saves_before,
        "saves_after": saves_final,
        "saves_gained": saves_gained,
        "comments_before": comments_before,
        "comments_after": comments_final,
        "comments_gained": comments_gained,
        "elapsed_seconds": elapsed,
        "summary_message": summary_msg,
    }


if __name__ == "__main__":
    kw = sys.argv[1] if len(sys.argv) > 1 else "faux olive tree"
    lim = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    print(f"Testing metrics updater for {kw} (limit={lim})...")
    res = update_videos_metrics(keyword=kw, limit=lim)
    print("Result:", json.dumps(res, indent=2, ensure_ascii=False))
