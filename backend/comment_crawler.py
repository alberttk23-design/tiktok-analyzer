import json
import re
import time
import random
import urllib.request
import urllib.error
from typing import List, Dict, Any, Tuple

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15"
]

BUYING_INTENT_KEYWORDS = [
    "link", "where", "buy", "price", "how much", "cost", "amazon", "store",
    "planter", "pot", "size", "tall", "height", "shop", "bio", "available",
    "ship", "order", "code", "discount", "link please", "need this", "want"
]

OBJECTION_KEYWORDS = [
    "fake", "cheap", "plastic", "ugly", "expensive", "too much", "dust",
    "fall off", "leaves fall", "quality", "poor", "rip off", "scam",
    "shiny", "unrealistic", "return", "broken", "hard to", "waste"
]


def fetch_comments_for_video(video_id: str, max_comments: int = 1000, author_username: str = None) -> List[Dict[str, Any]]:
    """
    Fetch up to max_comments for a video using TikTok's internal Web API.
    Excludes author replies and stops when target is reached or has_more is 0.
    """
    base_url = "https://www.tiktok.com/api/comment/list/"
    all_comments = []
    seen_cids = set()
    cursor = 0
    count_per_page = 50
    consecutive_empty = 0

    print(f"[Comment Crawler] Starting crawl for video {video_id} (Target: up to {max_comments} comments)...")

    author_norm = (author_username or "").lower().strip("@")

    while len(all_comments) < max_comments and consecutive_empty < 3:
        params = {
            "aid": "1988",
            "aweme_id": str(video_id),
            "count": str(count_per_page),
            "cursor": str(cursor)
        }
        query_str = "&".join(f"{k}={v}" for k, v in params.items())
        target_url = f"{base_url}?{query_str}"

        req = urllib.request.Request(
            target_url,
            headers={
                "User-Agent": random.choice(USER_AGENTS),
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": f"https://www.tiktok.com/video/{video_id}"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                body = response.read().decode("utf-8")
                data = json.loads(body)

                comments_list = data.get("comments") or []
                if not comments_list:
                    consecutive_empty += 1
                    cursor += count_per_page
                    continue

                consecutive_empty = 0
                for c in comments_list:
                    if len(all_comments) >= max_comments:
                        break

                    cid = c.get("cid")
                    if not cid or cid in seen_cids:
                        continue
                    seen_cids.add(cid)

                    user_info = c.get("user") or {}
                    uname = user_info.get("unique_id") or user_info.get("nickname") or ""
                    
                    # Skip author replies
                    if author_norm and uname.lower() == author_norm:
                        continue
                    if c.get("author_pin", False) and uname.lower() == author_norm:
                        continue

                    text = c.get("text") or ""
                    clean_text = text.strip()
                    if not clean_text:
                        continue

                    all_comments.append({
                        "cid": str(cid),
                        "video_id": str(video_id),
                        "username": uname,
                        "text": clean_text,
                        "digg_count": c.get("digg_count") or 0,
                        "reply_count": c.get("reply_comment_total") or 0,
                        "created_time": c.get("create_time") or 0
                    })

                has_more = data.get("has_more", 0)
                next_cursor = data.get("cursor", cursor + count_per_page)

                if not has_more or next_cursor <= cursor:
                    print(f"[Comment Crawler] End of comments stream for video {video_id}.")
                    break

                cursor = next_cursor
                # Polite jitter delay
                time.sleep(random.uniform(0.15, 0.35))

        except Exception as e:
            print(f"[Comment Crawler] Request notice for cursor {cursor}: {e}")
            consecutive_empty += 1
            time.sleep(0.5)

    print(f"[Comment Crawler] Fetched {len(all_comments)} non-author comments for video {video_id}.")
    return all_comments


def extract_comment_insights(comments: List[Dict[str, Any]], keyword: str) -> Dict[str, Any]:
    """
    Preprocess and extract rich customer intelligence (Voice of Customer) from comments:
    1. Buying Intent (Questions about link, price, where to buy, planter)
    2. Customer Objections (Concerns about realism, plastic look, durability, cost)
    3. Social Proof & High-impact praise
    4. Top Customer FAQs
    """
    if not comments:
        return {
            "total_crawled": 0,
            "buying_intent": [],
            "objections": [],
            "top_faqs": [],
            "social_proof": [],
            "summary": "Chưa có đủ bình luận để phân tích."
        }

    buying_intent = []
    objections = []
    faqs = []
    social_proof = []

    seen_intent_texts = set()
    seen_objection_texts = set()

    for c in comments:
        text = c.get("text", "")
        lower = text.lower()
        diggs = c.get("digg_count", 0)

        # Check social proof (high likes)
        if diggs >= 3 or ("love" in lower and len(text) > 10):
            social_proof.append({
                "username": c.get("username"),
                "text": text,
                "likes": diggs
            })

        # Check questions / buying intent
        is_intent = any(k in lower for k in BUYING_INTENT_KEYWORDS)
        if is_intent and text not in seen_intent_texts:
            seen_intent_texts.add(text)
            buying_intent.append({
                "username": c.get("username"),
                "text": text,
                "likes": diggs
            })

        # Check objections
        is_obj = any(k in lower for k in OBJECTION_KEYWORDS)
        if is_obj and text not in seen_objection_texts:
            seen_objection_texts.add(text)
            objections.append({
                "username": c.get("username"),
                "text": text,
                "likes": diggs
            })

        # Check questions (contains '?')
        if "?" in text and len(text) > 8 and text not in seen_intent_texts:
            faqs.append({
                "username": c.get("username"),
                "text": text,
                "likes": diggs
            })

    # Sort by engagement (likes)
    buying_intent = sorted(buying_intent, key=lambda x: x["likes"], reverse=True)[:15]
    objections = sorted(objections, key=lambda x: x["likes"], reverse=True)[:15]
    social_proof = sorted(social_proof, key=lambda x: x["likes"], reverse=True)[:10]
    faqs = sorted(faqs, key=lambda x: x["likes"], reverse=True)[:10]

    # Generate synthesized summary text
    intent_ratio = round((len(buying_intent) / len(comments)) * 100, 1) if comments else 0
    obj_ratio = round((len(objections) / len(comments)) * 100, 1) if comments else 0

    summary = (
        f"Phân tích từ {len(comments):,} bình luận thực tế: "
        f"{intent_ratio}% người xem có ý định mua (hỏi link, hỏi chậu, hỏi giá). "
        f"{obj_ratio}% có thắc mắc/nghi ngại về độ chân thực hoặc kích thước."
    )

    return {
        "total_crawled": len(comments),
        "buying_intent": buying_intent,
        "objections": objections,
        "top_faqs": faqs,
        "social_proof": social_proof,
        "summary": summary
    }


if __name__ == "__main__":
    # Quick test on sample video
    test_vid = "7460210378484501791"
    res = fetch_comments_for_video(test_vid, max_comments=50)
    print(f"Sample comments: {len(res)}")
    insights = extract_comment_insights(res, "faux tree")
    print("Insights summary:", insights["summary"])
    print("Top buying intent:", insights["buying_intent"][:3])
