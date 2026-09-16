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

    # Safe migration for new multimodal columns in analysis_reviews
    cursor.execute("PRAGMA table_info(analysis_reviews)")
    cols = {row["name"] for row in cursor.fetchall()}
    new_cols = [
        ("transcript", "TEXT"),
        ("spoken_hook", "TEXT"),
        ("visual_hook", "TEXT"),
        ("setting", "TEXT"),
        ("on_screen_text", "TEXT"),
        ("visual_style", "TEXT"),
        ("ad_angle", "TEXT"),
        ("keyframes_json", "TEXT")
    ]
    for col_name, col_type in new_cols:
        if col_name not in cols:
            cursor.execute(f"ALTER TABLE analysis_reviews ADD COLUMN {col_name} {col_type}")

    # Migration for creator_followers in videos
    cursor.execute("PRAGMA table_info(videos)")
    v_cols = {row["name"] for row in cursor.fetchall()}
    if "creator_followers" not in v_cols:
        cursor.execute("ALTER TABLE videos ADD COLUMN creator_followers INTEGER DEFAULT 0")

    # Migration for top_topics_json in comment_insights
    cursor.execute("PRAGMA table_info(comment_insights)")
    ci_cols = {row["name"] for row in cursor.fetchall()}
    if "top_topics_json" not in ci_cols:
        cursor.execute("ALTER TABLE comment_insights ADD COLUMN top_topics_json TEXT")

    # Migration for engine ('ollama' vs 'gemini') and composite PK in master_analysis
    cursor.execute("PRAGMA table_info(master_analysis)")
    ma_info = cursor.fetchall()
    has_engine = any(row["name"] == "engine" for row in ma_info)
    pk_count = sum(1 for row in ma_info if row["pk"] > 0)

    if not has_engine or pk_count < 2:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS master_analysis_v2 (
            keyword TEXT,
            engine TEXT DEFAULT 'gemini',
            summary TEXT,
            viral_triggers_json TEXT,
            friction_solutions_json TEXT,
            winning_blueprint TEXT,
            customer_interests_json TEXT,
            buying_desires_json TEXT,
            top_objections_json TEXT,
            voc_summary TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (keyword, engine)
        )
        """)
        try:
            cursor.execute("""
            INSERT OR IGNORE INTO master_analysis_v2 (
                keyword, engine, summary, viral_triggers_json, friction_solutions_json,
                winning_blueprint, customer_interests_json, buying_desires_json,
                top_objections_json, voc_summary, updated_at
            )
            SELECT 
                keyword, 'ollama', summary, viral_triggers_json, friction_solutions_json,
                winning_blueprint, customer_interests_json, buying_desires_json,
                top_objections_json, voc_summary, updated_at
            FROM master_analysis
            """)
            cursor.execute("DROP TABLE master_analysis")
            cursor.execute("ALTER TABLE master_analysis_v2 RENAME TO master_analysis")
        except Exception as e:
            print(f"[DB Migration Notice] master_analysis v2 migration: {e}")

    # Creators table for KOC Discovery & Booking CRM
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS creators (
        creator TEXT PRIMARY KEY,
        nickname TEXT,
        follower_count INTEGER DEFAULT 0,
        video_count INTEGER DEFAULT 0,
        heart_count INTEGER DEFAULT 0,
        signature TEXT,
        email TEXT,
        verified BOOLEAN DEFAULT 0,
        avatar_url TEXT,
        booking_status TEXT DEFAULT 'new',
        booking_notes TEXT DEFAULT '',
        booking_price REAL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Niche Folders table for project / niche isolation
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS niche_folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        description TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Populate niche_folders from any existing keywords in videos
    cursor.execute("""
    INSERT OR IGNORE INTO niche_folders (name)
    SELECT DISTINCT keyword FROM videos WHERE keyword IS NOT NULL AND keyword != ''
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
    data = dict(video_data)
    data.setdefault("creator_followers", 0)
    cursor.execute("""
    INSERT INTO videos (
        video_id, url, keyword, creator, caption, upload_date,
        duration_sec, views, likes, comments, reposts, saves,
        engagement_rate, score, creator_followers
    ) VALUES (
        :video_id, :url, :keyword, :creator, :caption, :upload_date,
        :duration_sec, :views, :likes, :comments, :reposts, :saves,
        :engagement_rate, :score, :creator_followers
    )
    ON CONFLICT(video_id) DO UPDATE SET
        views=excluded.views,
        likes=excluded.likes,
        comments=excluded.comments,
        reposts=excluded.reposts,
        saves=excluded.saves,
        engagement_rate=excluded.engagement_rate,
        score=excluded.score,
        creator_followers=excluded.creator_followers
    """, data)
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
    """Save synthesized Voice-of-Customer insights with topic clustering."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO comment_insights (
        video_id, keyword, total_crawled, buying_intent_json,
        objections_json, top_faqs_json, social_proof_json, top_topics_json, summary, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(video_id) DO UPDATE SET
        keyword = excluded.keyword,
        total_crawled = excluded.total_crawled,
        buying_intent_json = excluded.buying_intent_json,
        objections_json = excluded.objections_json,
        top_faqs_json = excluded.top_faqs_json,
        social_proof_json = excluded.social_proof_json,
        top_topics_json = excluded.top_topics_json,
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
        json.dumps(insights.get("top_topics", []), ensure_ascii=False),
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


def save_master_analysis(keyword: str, analysis: dict, engine: str = "gemini"):
    """Save holistic analysis for specified engine ('ollama' or 'gemini')."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO master_analysis (
        keyword, engine, summary, viral_triggers_json, friction_solutions_json, winning_blueprint,
        customer_interests_json, buying_desires_json, top_objections_json, voc_summary, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(keyword, engine) DO UPDATE SET
        summary = excluded.summary,
        viral_triggers_json = excluded.viral_triggers_json,
        friction_solutions_json = excluded.friction_solutions_json,
        winning_blueprint = excluded.winning_blueprint,
        customer_interests_json = excluded.customer_interests_json,
        buying_desires_json = excluded.buying_desires_json,
        top_objections_json = excluded.top_objections_json,
        voc_summary = excluded.voc_summary,
        updated_at = CURRENT_TIMESTAMP
    """, (
        keyword,
        engine,
        analysis.get("summary", ""),
        json.dumps(analysis.get("viral_triggers", []), ensure_ascii=False),
        json.dumps(analysis.get("friction_solutions", []), ensure_ascii=False),
        analysis.get("winning_blueprint", ""),
        json.dumps(analysis.get("customer_interests", []), ensure_ascii=False),
        json.dumps(analysis.get("buying_desires", []), ensure_ascii=False),
        json.dumps(analysis.get("top_objections", []), ensure_ascii=False),
        analysis.get("voc_summary", "")
    ))
    conn.commit()
    conn.close()


def get_master_analysis(keyword: str, engine: str = None):
    """Get stored master analysis for keyword and optional engine."""
    conn = get_db()
    cursor = conn.cursor()
    if engine:
        cursor.execute("SELECT * FROM master_analysis WHERE keyword = ? AND engine = ?", (keyword, engine))
    else:
        cursor.execute("SELECT * FROM master_analysis WHERE keyword = ? ORDER BY CASE WHEN engine = 'gemini' THEN 1 ELSE 2 END, updated_at DESC LIMIT 1", (keyword,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    item = dict(row)
    for key in ["viral_triggers_json", "friction_solutions_json", "customer_interests_json", "buying_desires_json", "top_objections_json"]:
        clean_key = key.replace("_json", "")
        try:
            item[clean_key] = json.loads(item.get(key) or "[]")
        except Exception:
            item[clean_key] = []
    return item


def get_all_master_analyses_for_keyword(keyword: str):
    """Get all master analyses for keyword mapped by engine ('ollama' and 'gemini')."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM master_analysis WHERE keyword = ?", (keyword,))
    rows = cursor.fetchall()
    conn.close()
    res = {}
    for row in rows:
        item = dict(row)
        for key in ["viral_triggers_json", "friction_solutions_json", "customer_interests_json", "buying_desires_json", "top_objections_json"]:
            clean_key = key.replace("_json", "")
            try:
                item[clean_key] = json.loads(item.get(key) or "[]")
            except Exception:
                item[clean_key] = []
        eng = item.get("engine") or "gemini"
        res[eng] = item
    return res


def save_review(review_data):
    conn = get_db()
    cursor = conn.cursor()
    vid = review_data.get("video_id")
    if vid:
        cursor.execute("DELETE FROM analysis_reviews WHERE video_id = ?", (str(vid),))

    data = dict(review_data)
    data.setdefault("transcript", "")
    data.setdefault("spoken_hook", "")
    data.setdefault("visual_hook", "")
    data.setdefault("setting", "")
    data.setdefault("on_screen_text", "")
    data.setdefault("visual_style", "")
    data.setdefault("ad_angle", "")
    kf = data.get("keyframes")
    data["keyframes_json"] = json.dumps(kf, ensure_ascii=False) if isinstance(kf, list) else data.get("keyframes_json", "[]")

    cursor.execute("""
    INSERT INTO analysis_reviews (
        video_id, keyword, hook, viral, buyer_psychology, winning_formula,
        viral_score, hook_score, conversion_score, strengths, weaknesses, raw_json,
        transcript, spoken_hook, visual_hook, setting, on_screen_text, visual_style, ad_angle, keyframes_json
    ) VALUES (
        :video_id, :keyword, :hook, :viral, :buyer_psychology, :winning_formula,
        :viral_score, :hook_score, :conversion_score, :strengths, :weaknesses, :raw_json,
        :transcript, :spoken_hook, :visual_hook, :setting, :on_screen_text, :visual_style, :ad_angle, :keyframes_json
    )
    """, data)
    conn.commit()
    conn.close()


def update_multimodal_analysis(video_id: str, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    kf = data.get("keyframes")
    kf_json = json.dumps(kf, ensure_ascii=False) if isinstance(kf, list) else data.get("keyframes_json", "[]")
    cursor.execute("""
    UPDATE analysis_reviews
    SET transcript = ?,
        spoken_hook = ?,
        visual_hook = ?,
        setting = ?,
        on_screen_text = ?,
        visual_style = ?,
        ad_angle = ?,
        keyframes_json = ?
    WHERE video_id = ?
    """, (
        data.get("transcript", ""),
        data.get("spoken_hook", ""),
        data.get("visual_hook", ""),
        data.get("setting", ""),
        data.get("on_screen_text", ""),
        data.get("visual_style", ""),
        data.get("ad_angle", "Aesthetic Room Tour"),
        kf_json,
        str(video_id)
    ))
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


def get_niche_folders():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        f.id,
        f.name,
        f.name as keyword,
        f.description,
        f.created_at,
        f.updated_at,
        COALESCE(v_stats.video_count, 0) as video_count,
        COALESCE(v_stats.total_views, 0) as total_views,
        COALESCE(v_stats.last_updated, f.created_at) as last_updated
    FROM niche_folders f
    LEFT JOIN (
        SELECT keyword, COUNT(*) as video_count, SUM(views) as total_views, MAX(created_at) as last_updated
        FROM videos
        GROUP BY keyword
    ) v_stats ON LOWER(f.name) = LOWER(v_stats.keyword)
    ORDER BY video_count DESC, f.updated_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_all_keywords():
    return get_niche_folders()


def create_niche_folder(name: str, description: str = ""):
    clean_name = name.strip()
    if not clean_name:
        raise ValueError("Tên thư mục ngách không được để trống")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO niche_folders (name, description, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(name) DO UPDATE SET
        description = CASE WHEN excluded.description != '' THEN excluded.description ELSE niche_folders.description END,
        updated_at = CURRENT_TIMESTAMP
    """, (clean_name, description))
    conn.commit()
    conn.close()
    return {"name": clean_name, "description": description}


def delete_niche_folder(name: str, delete_data: bool = True):
    clean_name = name.strip()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM niche_folders WHERE name = ?", (clean_name,))
    if delete_data:
        cursor.execute("SELECT video_id FROM videos WHERE keyword = ?", (clean_name,))
        vids = [r["video_id"] for r in cursor.fetchall()]
        if vids:
            placeholders = ",".join(["?"] * len(vids))
            cursor.execute(f"DELETE FROM video_comments WHERE video_id IN ({placeholders})", vids)
        cursor.execute("DELETE FROM videos WHERE keyword = ?", (clean_name,))
        cursor.execute("DELETE FROM analysis_reviews WHERE keyword = ?", (clean_name,))
        cursor.execute("DELETE FROM comment_insights WHERE keyword = ?", (clean_name,))
        cursor.execute("DELETE FROM creative_ideas WHERE keyword = ?", (clean_name,))
        cursor.execute("DELETE FROM production_briefs WHERE keyword = ?", (clean_name,))
        cursor.execute("DELETE FROM master_analysis WHERE keyword = ?", (clean_name,))
        cursor.execute("DELETE FROM crawl_jobs WHERE keyword = ?", (clean_name,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "name": clean_name}


def rename_niche_folder(old_name: str, new_name: str):
    old_c = old_name.strip()
    new_c = new_name.strip()
    if not new_c:
        raise ValueError("Tên thư mục mới không được để trống")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE niche_folders SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ?", (new_c, old_c))
    cursor.execute("UPDATE videos SET keyword = ? WHERE keyword = ?", (new_c, old_c))
    cursor.execute("UPDATE analysis_reviews SET keyword = ? WHERE keyword = ?", (new_c, old_c))
    cursor.execute("UPDATE comment_insights SET keyword = ? WHERE keyword = ?", (new_c, old_c))
    cursor.execute("UPDATE creative_ideas SET keyword = ? WHERE keyword = ?", (new_c, old_c))
    cursor.execute("UPDATE production_briefs SET keyword = ? WHERE keyword = ?", (new_c, old_c))
    cursor.execute("UPDATE master_analysis SET keyword = ? WHERE keyword = ?", (new_c, old_c))
    cursor.execute("UPDATE crawl_jobs SET keyword = ? WHERE keyword = ?", (new_c, old_c))
    conn.commit()
    conn.close()
    return {"old_name": old_c, "new_name": new_c}


def get_results_by_keyword(keyword=None):
    conn = get_db()
    cursor = conn.cursor()

    if not keyword:
        cursor.execute("SELECT name FROM niche_folders ORDER BY updated_at DESC LIMIT 1")
        row = cursor.fetchone()
        if row:
            keyword = row["name"]
        else:
            cursor.execute("SELECT keyword FROM videos ORDER BY id DESC LIMIT 1")
            row = cursor.fetchone()
            if row:
                keyword = row["keyword"]
            else:
                conn.close()
                return {"keyword": "", "videos": [], "reviews": [], "ideas": [], "briefs": [], "comment_insights": {}, "master_analysis": None, "master_analyses": {}}

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
        if item.get("keyframes_json"):
            try:
                item["keyframes"] = json.loads(item["keyframes_json"])
            except Exception:
                item["keyframes"] = []
        else:
            item["keyframes"] = []
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
        for key in ["buying_intent_json", "objections_json", "top_faqs_json", "social_proof_json", "top_topics_json"]:
            clean_key = key.replace("_json", "")
            try:
                item[clean_key] = json.loads(item.get(key) or "[]")
            except Exception:
                item[clean_key] = []
        insights_map[item["video_id"]] = item

    # Master analyses (both 'ollama' and 'gemini')
    cursor.execute("SELECT * FROM master_analysis WHERE keyword = ?", (keyword,))
    master_rows = cursor.fetchall()
    master_analyses = {}
    for mr in master_rows:
        m_item = dict(mr)
        for key in ["viral_triggers_json", "friction_solutions_json", "customer_interests_json", "buying_desires_json", "top_objections_json"]:
            clean_key = key.replace("_json", "")
            try:
                m_item[clean_key] = json.loads(m_item.get(key) or "[]")
            except Exception:
                m_item[clean_key] = []
        eng = m_item.get("engine") or "gemini"
        master_analyses[eng] = m_item

    master_analysis = master_analyses.get("gemini") or master_analyses.get("ollama") or None

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
        "master_analysis": master_analysis,
        "master_analyses": master_analyses
    }


def upsert_creator(data: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO creators (
        creator, nickname, follower_count, video_count, heart_count,
        signature, email, verified, avatar_url, updated_at
    ) VALUES (
        :creator, :nickname, :follower_count, :video_count, :heart_count,
        :signature, :email, :verified, :avatar_url, CURRENT_TIMESTAMP
    )
    ON CONFLICT(creator) DO UPDATE SET
        nickname=excluded.nickname,
        follower_count=excluded.follower_count,
        video_count=excluded.video_count,
        heart_count=excluded.heart_count,
        signature=excluded.signature,
        email=CASE WHEN excluded.email != '' THEN excluded.email ELSE creators.email END,
        verified=excluded.verified,
        avatar_url=excluded.avatar_url,
        updated_at=CURRENT_TIMESTAMP
    """, data)
    
    f_count = int(data.get("follower_count") or 0)
    if f_count > 0:
        cursor.execute("UPDATE videos SET creator_followers = ? WHERE creator = ?", (f_count, data["creator"]))
        
    conn.commit()
    conn.close()


def update_creator_booking(creator: str, booking_status: str, booking_notes: str, booking_price: float = 0.0):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO creators (creator) VALUES (?)", (creator,))
    cursor.execute("""
    UPDATE creators SET
        booking_status = ?,
        booking_notes = ?,
        booking_price = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE creator = ?
    """, (booking_status, booking_notes, booking_price, creator))
    conn.commit()
    conn.close()


def get_creator(creator: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM creators WHERE creator = ?", (creator,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_creators_with_analytics(keyword: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    
    if keyword:
        cursor.execute("""
        SELECT 
            creator,
            COUNT(*) as videos_in_niche,
            SUM(views) as total_views,
            MAX(views) as max_views,
            ROUND(AVG(views)) as avg_views,
            MAX(likes) as max_likes,
            MAX(saves) as max_saves,
            MAX(comments) as max_comments,
            MAX(score) as max_score
        FROM videos
        WHERE keyword = ?
        GROUP BY creator
        ORDER BY max_views DESC
        """, (keyword,))
    else:
        cursor.execute("""
        SELECT 
            creator,
            COUNT(*) as videos_in_niche,
            SUM(views) as total_views,
            MAX(views) as max_views,
            ROUND(AVG(views)) as avg_views,
            MAX(likes) as max_likes,
            MAX(saves) as max_saves,
            MAX(comments) as max_comments,
            MAX(score) as max_score
        FROM videos
        GROUP BY creator
        ORDER BY max_views DESC
        """)
    
    grouped_rows = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM creators")
    creators_meta = {r["creator"]: dict(r) for r in cursor.fetchall()}
    
    if keyword:
        cursor.execute("""
        SELECT video_id, creator, views, likes, saves, score, caption, url
        FROM videos
        WHERE keyword = ?
        ORDER BY views DESC
        """, (keyword,))
    else:
        cursor.execute("""
        SELECT video_id, creator, views, likes, saves, score, caption, url
        FROM videos
        ORDER BY views DESC
        """)
        
    all_videos = cursor.fetchall()
    creator_top_videos = {}
    for v in all_videos:
        c_name = v["creator"]
        if c_name not in creator_top_videos:
            creator_top_videos[c_name] = []
        if len(creator_top_videos[c_name]) < 3:
            creator_top_videos[c_name].append(dict(v))
            
    conn.close()
    
    results = []
    for g in grouped_rows:
        c_name = g["creator"]
        meta = creators_meta.get(c_name, {})
        follower_count = int(meta.get("follower_count") or 0)
        max_views = int(g["max_views"] or 0)
        
        if follower_count > 0:
            multiplier = round(max_views / follower_count, 1)
        else:
            multiplier = 0.0
            
        # Determine Tier
        if follower_count == 0:
            tier = "unverified"
            tier_label = "🔍 Cần quét Profile"
            tier_badge_color = "slate"
            tier_desc = "Chưa có thông tin số follower trực tiếp"
            recommendation = "Bấm 'Quét Profile' để phân tích đòn bẩy"
        elif multiplier >= 10.0 and follower_count < 20000:
            tier = "hidden_gem"
            tier_label = f"💎 Hidden Gem (Outlier {multiplier}x)"
            tier_badge_color = "emerald"
            tier_desc = f"Ít follow ({follower_count:,}) nhưng view bùng nổ {multiplier}x"
            recommendation = "⚡ Học kịch bản ngay / Booking giá hời ($20-$80)"
        elif 20000 <= follower_count <= 120000 and max_views >= 20000:
            tier = "real_traffic"
            tier_label = "🌿 Real Niche Traffic"
            tier_badge_color = "teal"
            tier_desc = f"Traffic thật ngách Decor ({follower_count:,} flw, {multiplier}x đòn bẩy)"
            recommendation = "Hợp tác Review chuyên sâu / Social Proof uy tín"
        elif multiplier >= 3.0 and follower_count < 60000:
            tier = "rising_star"
            tier_label = f"🚀 Rising Star ({multiplier}x)"
            tier_badge_color = "indigo"
            tier_desc = f"Kênh tăng trưởng mạnh ({follower_count:,} flw)"
            recommendation = "Booking gắn TikTok Shop / Đẩy mạnh Affiliate"
        elif follower_count > 120000:
            tier = "macro_authority"
            tier_label = "👑 Macro Authority"
            tier_badge_color = "amber"
            tier_desc = f"Tài khoản lớn / Thương hiệu ({follower_count:,} flw)"
            recommendation = "Chiến dịch Branding nhận diện diện rộng"
        elif follower_count > 40000 and multiplier < 0.1 and max_views < 5000:
            tier = "low_engagement"
            tier_label = "⚠️ Low Engagement Risk"
            tier_badge_color = "rose"
            tier_desc = "Follower cao nhưng view thấp (nguy cơ flop / bot)"
            recommendation = "Cảnh báo: Không khuyến nghị booking"
        else:
            tier = "standard"
            tier_label = "🎯 Standard Creator"
            tier_badge_color = "blue"
            tier_desc = f"KOC tiềm năng ({follower_count:,} flw, {multiplier}x)"
            recommendation = "Gửi hàng mẫu trải nghiệm sản phẩm"
            
        results.append({
            "creator": c_name,
            "nickname": meta.get("nickname") or c_name,
            "avatar_url": meta.get("avatar_url") or "",
            "follower_count": follower_count,
            "video_count": int(meta.get("video_count") or 0),
            "heart_count": int(meta.get("heart_count") or 0),
            "signature": meta.get("signature") or "",
            "email": meta.get("email") or "",
            "verified": bool(meta.get("verified") or 0),
            "booking_status": meta.get("booking_status") or "new",
            "booking_notes": meta.get("booking_notes") or "",
            "booking_price": float(meta.get("booking_price") or 0.0),
            "videos_in_niche": g["videos_in_niche"],
            "total_views": g["total_views"],
            "max_views": g["max_views"],
            "avg_views": g["avg_views"],
            "max_likes": g["max_likes"],
            "max_saves": g["max_saves"],
            "max_comments": g["max_comments"],
            "max_score": g["max_score"],
            "viral_multiplier": multiplier,
            "tier": tier,
            "tier_label": tier_label,
            "tier_badge_color": tier_badge_color,
            "tier_desc": tier_desc,
            "recommendation": recommendation,
            "top_videos": creator_top_videos.get(c_name, []),
            "profile_url": f"https://www.tiktok.com/@{c_name}"
        })
        
    return results


# Auto-initialize database schema
init_db()
