import csv
import json
from datetime import datetime
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
VIDEOS_DIR = PROJECT_DIR / "data" / "videos"
OUTPUT_FILE = PROJECT_DIR / "data" / "metadata.csv"

rows = []

for f in sorted(VIDEOS_DIR.glob("*.info.json")):
    d = json.loads(f.read_text(encoding="utf-8"))

    views = d.get("view_count") or 0
    likes = d.get("like_count") or 0
    comments = d.get("comment_count") or 0
    reposts = d.get("repost_count") or 0
    saves = d.get("save_count") or 0

    timestamp = d.get("timestamp")

    if timestamp:
        upload_date = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d")
    else:
        upload_date = ""

    if views > 0:
        engagement_rate = (likes + comments + reposts + saves) / views
        like_rate = likes / views
        save_rate = saves / views
        repost_rate = reposts / views
        comment_rate = comments / views
    else:
        engagement_rate = 0
        like_rate = 0
        save_rate = 0
        repost_rate = 0
        comment_rate = 0

    rows.append({
        "video_id": d.get("id"),
        "url": d.get("webpage_url"),
        "creator": d.get("uploader"),
        "caption": d.get("description"),
        "upload_date": upload_date,
        "duration_sec": d.get("duration"),
        "views": views,
        "likes": likes,
        "comments": comments,
        "reposts": reposts,
        "saves": saves,
        "engagement_rate": round(engagement_rate, 6),
        "like_rate": round(like_rate, 6),
        "save_rate": round(save_rate, 6),
        "repost_rate": round(repost_rate, 6),
        "comment_rate": round(comment_rate, 6),
        "track": d.get("track"),
        "artist": d.get("artist"),
    })

fieldnames = [
    "video_id",
    "url",
    "creator",
    "caption",
    "upload_date",
    "duration_sec",
    "views",
    "likes",
    "comments",
    "reposts",
    "saves",
    "engagement_rate",
    "like_rate",
    "save_rate",
    "repost_rate",
    "comment_rate",
    "track",
    "artist",
]

with open(OUTPUT_FILE, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Created: {OUTPUT_FILE}")
print(f"Videos: {len(rows)}")
