import sqlite3
import json
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "tiktok.db"


def get_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Videos table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT UNIQUE,
        url TEXT UNIQUE,
        keyword TEXT,
        creator TEXT,
        caption TEXT,
        upload_date TEXT,
        duration_sec INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        reposts INTEGER DEFAULT 0,
        saves INTEGER DEFAULT 0,
        engagement_rate REAL DEFAULT 0.0,
        score REAL DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # AI Reviews table (Hook, Viral, Buyer Psychology, Winning Formula)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analysis_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT,
        keyword TEXT,
        hook TEXT,
        viral TEXT,
        buyer_psychology TEXT,
        winning_formula TEXT,
        viral_score REAL DEFAULT 0.0,
        hook_score REAL DEFAULT 0.0,
        conversion_score REAL DEFAULT 0.0,
        strengths TEXT,
        weaknesses TEXT,
        raw_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(video_id) REFERENCES videos(video_id)
    )
    """)

    # Creative Ideas table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS creative_ideas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT,
        title TEXT,
        hook TEXT,
        angle TEXT,
        shot_list TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Production Briefs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS production_briefs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT,
        title TEXT,
        objective TEXT,
        target_audience TEXT,
        script TEXT,
        guidelines TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Crawl / Analysis Jobs table for tracking progress
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS crawl_jobs (
        job_id TEXT PRIMARY KEY,
        keyword TEXT,
        status TEXT,
        progress INTEGER DEFAULT 0,
        message TEXT,
        new_videos_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Video Comments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS video_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT,
        cid TEXT UNIQUE,
        username TEXT,
        text TEXT,
        digg_count INTEGER DEFAULT 0,
        reply_count INTEGER DEFAULT 0,
        created_time INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(video_id) REFERENCES videos(video_id)
    )
    """)

    # Comment Insights table (Voice of Customer)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS comment_insights (
        video_id TEXT PRIMARY KEY,
        keyword TEXT,
        total_crawled INTEGER DEFAULT 0,
        buying_intent_json TEXT,
        objections_json TEXT,
        top_faqs_json TEXT,
        social_proof_json TEXT,
        summary TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(video_id) REFERENCES videos(video_id)
    )
    """)

    # Master Overall AI Analysis table (100% Local Synthesis)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS master_analysis (
        keyword TEXT PRIMARY KEY,
        summary TEXT,
        viral_triggers_json TEXT,
        friction_solutions_json TEXT,
        winning_blueprint TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()


def get_existing_video_ids():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT video_id, url FROM videos")
    rows = cursor.fetchall()
    conn.close()
    video_ids = {r["video_id"] for r in rows if r["video_id"]}
    urls = {r["url"] for r in rows if r["url"]}
    return video_ids, urls


def save_video(video_data):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO videos (
        video_id, url, keyword, creator, caption, upload_date,
        duration_sec, views, likes, comments, reposts, saves,
        engagement_rate, score
    ) VALUES (
        :video_id, :url, :keyword, :creator, :caption, :upload_date,
        :duration_sec, :views, :likes, :comments, :reposts, :saves,
        :engagement_rate, :score
    )
    ON CONFLICT(video_id) DO UPDATE SET
        views=excluded.views,
        likes=excluded.likes,
        comments=excluded.comments,
        reposts=excluded.reposts,
        saves=excluded.saves,
        engagement_rate=excluded.engagement_rate,
        score=excluded.score
    """, video_data)
    conn.commit()
    conn.close()


def save_comments(video_id: str, comments: list):
    """Batch save clean non-author comments to SQLite."""
    if not comments:
        return
    conn = get_db()
    cursor = conn.cursor()
    for c in comments:
        cursor.execute("""
        INSERT INTO video_comments (
            video_id, cid, username, text, digg_count, reply_count, created_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(cid) DO UPDATE SET
            digg_count = excluded.digg_count,
            reply_count = excluded.reply_count
        """, (
            str(video_id),
            str(c.get("cid")),
            c.get("username", ""),
            c.get("text", ""),
            int(c.get("digg_count", 0)),
            int(c.get("reply_count", 0)),
            int(c.get("created_time", 0))
        ))
    conn.commit()
    conn.close()


def save_comment_insights(video_id: str, keyword: str, insights: dict):
    """Save synthesized Voice-of-Customer insights."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO comment_insights (
        video_id, keyword, total_crawled, buying_intent_json,
        objections_json, top_faqs_json, social_proof_json, summary, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(video_id) DO UPDATE SET
        keyword = excluded.keyword,
        total_crawled = excluded.total_crawled,
        buying_intent_json = excluded.buying_intent_json,
        objections_json = excluded.objections_json,
        top_faqs_json = excluded.top_faqs_json,
        social_proof_json = excluded.social_proof_json,
        summary = excluded.summary,
        updated_at = CURRENT_TIMESTAMP
    """, (
        str(video_id),
        keyword,
        insights.get("total_crawled", 0),
        json.dumps(insights.get("buying_intent", []), ensure_ascii=False),
        json.dumps(insights.get("objections", []), ensure_ascii=False),
        json.dumps(insights.get("top_faqs", []), ensure_ascii=False),
        json.dumps(insights.get("social_proof", []), ensure_ascii=False),
        insights.get("summary", "")
    ))
    conn.commit()
    conn.close()


def get_comment_insights(video_id: str):
    """Retrieve parsed comment insights for a video."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM comment_insights WHERE video_id = ?", (str(video_id),))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    item = dict(row)
    for key in ["buying_intent_json", "objections_json", "top_faqs_json", "social_proof_json"]:
        clean_key = key.replace("_json", "")
        try:
            item[clean_key] = json.loads(item.get(key) or "[]")
        except Exception:
            item[clean_key] = []
    return item


def get_video_comments(video_id: str, limit: int = 100):
    """Retrieve raw comments for a video."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM video_comments WHERE video_id = ? ORDER BY digg_count DESC, id DESC LIMIT ?
    """, (str(video_id), limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def save_master_analysis(keyword: str, analysis: dict):
    """Save 100% local holistic analysis."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO master_analysis (
        keyword, summary, viral_triggers_json, friction_solutions_json, winning_blueprint, updated_at
    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(keyword) DO UPDATE SET
        summary = excluded.summary,
        viral_triggers_json = excluded.viral_triggers_json,
        friction_solutions_json = excluded.friction_solutions_json,
        winning_blueprint = excluded.winning_blueprint,
        updated_at = CURRENT_TIMESTAMP
    """, (
        keyword,
        analysis.get("summary", ""),
        json.dumps(analysis.get("viral_triggers", []), ensure_ascii=False),
        json.dumps(analysis.get("friction_solutions", []), ensure_ascii=False),
        analysis.get("winning_blueprint", "")
    ))
    conn.commit()
    conn.close()


def get_master_analysis(keyword: str):
    """Get stored master analysis."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM master_analysis WHERE keyword = ?", (keyword,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    item = dict(row)
    try:
        item["viral_triggers"] = json.loads(item.get("viral_triggers_json") or "[]")
    except Exception:
        item["viral_triggers"] = []
    try:
        item["friction_solutions"] = json.loads(item.get("friction_solutions_json") or "[]")
    except Exception:
        item["friction_solutions"] = []
    return item


def save_review(review_data):
    conn = get_db()
    cursor = conn.cursor()
    vid = review_data.get("video_id")
    if vid:
        cursor.execute("DELETE FROM analysis_reviews WHERE video_id = ?", (str(vid),))
    cursor.execute("""
    INSERT INTO analysis_reviews (
        video_id, keyword, hook, viral, buyer_psychology, winning_formula,
        viral_score, hook_score, conversion_score, strengths, weaknesses, raw_json
    ) VALUES (
        :video_id, :keyword, :hook, :viral, :buyer_psychology, :winning_formula,
        :viral_score, :hook_score, :conversion_score, :strengths, :weaknesses, :raw_json
    )
    """, review_data)
    conn.commit()
    conn.close()


def save_creative_ideas(keyword, ideas):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM creative_ideas WHERE keyword = ?", (keyword,))
    for item in ideas:
        cursor.execute("""
        INSERT INTO creative_ideas (keyword, title, hook, angle, shot_list)
        VALUES (?, ?, ?, ?, ?)
        """, (
            keyword,
            item.get("title", ""),
            item.get("hook", ""),
            item.get("angle", ""),
            json.dumps(item.get("shot_list", []), ensure_ascii=False)
        ))
    conn.commit()
    conn.close()


def save_production_briefs(keyword, briefs):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM production_briefs WHERE keyword = ?", (keyword,))
    for item in briefs:
        cursor.execute("""
        INSERT INTO production_briefs (keyword, title, objective, target_audience, script, guidelines)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            keyword,
            item.get("title", ""),
            item.get("objective", ""),
            item.get("target_audience", ""),
            item.get("script", ""),
            json.dumps(item.get("guidelines", []), ensure_ascii=False)
        ))
    conn.commit()
    conn.close()


def create_job(job_id, keyword):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO crawl_jobs (job_id, keyword, status, progress, message)
    VALUES (?, ?, 'started', 0, 'Initializing crawler...')
    """, (job_id, keyword))
    conn.commit()
    conn.close()


def update_job(job_id, status=None, progress=None, message=None, new_videos_count=None):
    conn = get_db()
    cursor = conn.cursor()
    updates = ["updated_at = CURRENT_TIMESTAMP"]
    params = []
    if status is not None:
        updates.append("status = ?")
        params.append(status)
    if progress is not None:
        updates.append("progress = ?")
        params.append(progress)
    if message is not None:
        updates.append("message = ?")
        params.append(message)
    if new_videos_count is not None:
        updates.append("new_videos_count = ?")
        params.append(new_videos_count)

    params.append(job_id)
    sql = f"UPDATE crawl_jobs SET {', '.join(updates)} WHERE job_id = ?"
    cursor.execute(sql, params)
    conn.commit()
    conn.close()


def get_job(job_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM crawl_jobs WHERE job_id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


def get_all_keywords():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT keyword, COUNT(*) as video_count, MAX(created_at) as last_updated
    FROM videos
    GROUP BY keyword
    ORDER BY last_updated DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_results_by_keyword(keyword=None):
    conn = get_db()
    cursor = conn.cursor()

    if not keyword:
        cursor.execute("SELECT keyword FROM videos ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        if row:
            keyword = row["keyword"]
        else:
            conn.close()
            return {"keyword": "", "videos": [], "reviews": [], "ideas": [], "briefs": [], "comment_insights": {}, "master_analysis": None}

    cursor.execute("""
    SELECT * FROM videos WHERE keyword = ? ORDER BY score DESC
    """, (keyword,))
    videos = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
    SELECT ar.* FROM analysis_reviews ar
    INNER JOIN (
        SELECT video_id, MAX(id) as max_id
        FROM analysis_reviews
        WHERE keyword = ?
        GROUP BY video_id
    ) latest ON ar.id = latest.max_id
    ORDER BY ar.viral_score DESC
    """, (keyword,))
    reviews = []
    for r in cursor.fetchall():
        item = dict(r)
        if item.get("strengths"):
            try:
                item["strengths"] = json.loads(item["strengths"])
            except Exception:
                pass
        if item.get("weaknesses"):
            try:
                item["weaknesses"] = json.loads(item["weaknesses"])
            except Exception:
                pass
        reviews.append(item)

    cursor.execute("""
    SELECT * FROM creative_ideas WHERE keyword = ? ORDER BY id ASC
    """, (keyword,))
    ideas = []
    for r in cursor.fetchall():
        item = dict(r)
        if item.get("shot_list"):
            try:
                item["shot_list"] = json.loads(item["shot_list"])
            except Exception:
                pass
        ideas.append(item)

    cursor.execute("""
    SELECT * FROM production_briefs WHERE keyword = ? ORDER BY id ASC
    """, (keyword,))
    briefs = []
    for r in cursor.fetchall():
        item = dict(r)
        if item.get("guidelines"):
            try:
                item["guidelines"] = json.loads(item["guidelines"])
            except Exception:
                pass
        briefs.append(item)

    # Attach comment insights
    cursor.execute("SELECT * FROM comment_insights WHERE keyword = ?", (keyword,))
    insights_map = {}
    for r in cursor.fetchall():
        item = dict(r)
        for key in ["buying_intent_json", "objections_json", "top_faqs_json", "social_proof_json"]:
            clean_key = key.replace("_json", "")
            try:
                item[clean_key] = json.loads(item.get(key) or "[]")
            except Exception:
                item[clean_key] = []
        insights_map[item["video_id"]] = item

    # Master analysis
    cursor.execute("SELECT * FROM master_analysis WHERE keyword = ?", (keyword,))
    master_row = cursor.fetchone()
    master_analysis = None
    if master_row:
        master_analysis = dict(master_row)
        try:
            master_analysis["viral_triggers"] = json.loads(master_analysis.get("viral_triggers_json") or "[]")
        except Exception:
            master_analysis["viral_triggers"] = []
        try:
            master_analysis["friction_solutions"] = json.loads(master_analysis.get("friction_solutions_json") or "[]")
        except Exception:
            master_analysis["friction_solutions"] = []

    conn.close()

    # Auto-backfill reviews for any videos that were interrupted or crawled without analysis
    existing_reviewed_vids = {r.get("video_id") for r in reviews}
    missing_vids = [v for v in videos if v.get("video_id") not in existing_reviewed_vids]
    if missing_vids:
        import backend.ai_engine as ai_engine
        for v in missing_vids:
            vid = v.get("video_id")
            ins = insights_map.get(vid)
            fb = ai_engine.build_fallback_review(v, keyword, comment_insight=ins)
            save_review(fb)
            reviews.append(fb)

    return {
        "keyword": keyword,
        "videos": videos,
        "reviews": reviews,
        "ideas": ideas,
        "briefs": briefs,
        "comment_insights": insights_map,
        "master_analysis": master_analysis
    }


# Auto-initialize database schema
init_db()
