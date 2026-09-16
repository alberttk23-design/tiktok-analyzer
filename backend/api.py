import csv
import io
import json
import uuid
import asyncio
from typing import Optional
from pathlib import Path
from collections import Counter
from fastapi import FastAPI, BackgroundTasks, Query, Response, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import backend.db as db
import backend.crawler as crawler
import backend.comment_crawler as comment_crawler
import backend.ai_engine as ai_engine

BASE_DIR = Path(__file__).resolve().parent.parent

app = FastAPI(
    title="TikTok Creative AI",
    version="2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    keyword: str
    limit: int = 20


class CrawlCommentsRequest(BaseModel):
    max_comments: int = 1000


class CrawlTopCommentsRequest(BaseModel):
    keyword: str
    top_n: int = 10
    max_comments_per_video: int = 100
    crawl_all: bool = False


class MasterAnalysisRequest(BaseModel):
    keyword: str
    engine: str = "gemini"
    api_key: Optional[str] = None


class MultimodalBatchRequest(BaseModel):
    keyword: str
    top_n: int = 5


class CreatorBookingRequest(BaseModel):
    booking_status: str = "new"
    booking_notes: str = ""
    booking_price: float = 0.0


class CreatorBatchEnrichRequest(BaseModel):
    keyword: Optional[str] = None
    max_count: int = 20


class CreateFolderRequest(BaseModel):
    name: str
    description: Optional[str] = ""


class RenameFolderRequest(BaseModel):
    new_name: str



def execute_pipeline(job_id: str, keyword: str, limit: int):
    """Background task to run Crawler (with history check, 20 new videos, comments) and AI Analysis."""
    try:
        print(f"[API Pipeline] Starting job {job_id} for keyword '{keyword}'...")
        # Step 1: Crawler with deduplication against SQLite & initial comment fetch
        crawler.crawl_tiktok_videos(keyword, target_count=limit, job_id=job_id)

        # Step 2: AI Analysis incorporating comment insights
        ai_engine.run_ai_analysis_pipeline(keyword, job_id=job_id)

        # Step 3: Local Master Holistic Synthesis
        try:
            ai_engine.generate_master_holistic_analysis(keyword)
        except Exception as me:
            print(f"[API Pipeline] Master analysis notice: {me}")

        print(f"[API Pipeline] Job {job_id} completed successfully.")
    except Exception as e:
        print(f"[API Pipeline Error] Job {job_id} failed: {e}")
        db.update_job(job_id, status="failed", message=f"Pipeline error: {str(e)}")


@app.get("/")
def root():
    return {
        "app": "TikTok Creative AI",
        "status": "ready",
        "version": "2.0"
    }


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    """Start automated crawl, comment intelligence, and AI analysis job for a keyword."""
    keyword = req.keyword.strip()
    if not keyword:
        return {"error": "Keyword is required"}

    job_id = str(uuid.uuid4())[:8]
    db.create_job(job_id, keyword)

    background_tasks.add_task(
        execute_pipeline,
        job_id=job_id,
        keyword=keyword,
        limit=req.limit
    )

    return {
        "job_id": job_id,
        "status": "started",
        "keyword": keyword,
        "message": f"Started crawler & AI analysis job for '{keyword}'"
    }


@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str):
    """Check progress of a running job."""
    job = db.get_job(job_id)
    if not job:
        return {"status": "not_found", "message": "Job ID not found"}
    return job


@app.get("/api/results")
def get_results(keyword: Optional[str] = Query(None)):
    """Fetch complete analysis results (videos, reviews, ideas, briefs, comment insights, master analysis) for keyword."""
    return db.get_results_by_keyword(keyword)


@app.post("/api/analyze-master")
def run_master_analysis_endpoint(req: MasterAnalysisRequest):
    """Run Master AI Analysis via either Gemini (Antigravity) or Ollama (Local M4)."""
    if req.engine == "ollama":
        result = ai_engine.generate_master_holistic_analysis(req.keyword)
    else:
        result = ai_engine.generate_gemini_master_analysis(req.keyword, api_key=req.api_key)
    return {
        "status": "success",
        "keyword": req.keyword,
        "engine": req.engine,
        "master_analysis": result
    }


@app.get("/api/master-analysis")
def get_master_analysis_endpoint(keyword: Optional[str] = Query(None), engine: Optional[str] = Query(None)):
    """Get stored master holistic analysis."""
    res = db.get_results_by_keyword(keyword)
    if engine:
        return (res.get("master_analyses") or {}).get(engine) or {}
    return res.get("master_analysis") or {}


@app.get("/api/audio-summary")
def get_audio_summary_endpoint(keyword: Optional[str] = Query(None)):
    """Get aggregated audio intelligence (sound type distribution, top sounds) for a keyword/niche."""
    kw = keyword or db.get_latest_keyword()
    return db.get_niche_audio_summary(kw)


@app.get("/api/audio-intelligence")
def get_audio_intelligence_endpoint(keyword: Optional[str] = Query(None)):
    """Get full-featured Sound & Voice Intelligence (leaderboard, voice corpus, 4 frameworks)."""
    kw = keyword or db.get_latest_keyword()
    return db.get_full_audio_intelligence(kw)


@app.get("/api/voc-deep")
def get_voc_deep_endpoint(keyword: Optional[str] = Query(None)):
    """Get full-featured 6-Pillar Consumer Psychology & VoC Intelligence."""
    kw = keyword or db.get_latest_keyword()
    import backend.voc_engine as voc_engine
    return voc_engine.analyze_voc_deep(kw)




@app.get("/api/keywords")
def get_keywords():
    """List all previously analyzed keywords and video counts."""
    return db.get_all_keywords()


@app.get("/api/folders")
def get_folders_endpoint():
    """List all niche folders with video count and total views."""
    return {"folders": db.get_niche_folders()}


@app.post("/api/folders")
def create_folder_endpoint(req: CreateFolderRequest):
    """Create a new niche folder for isolated keyword analysis."""
    try:
        created = db.create_niche_folder(req.name, req.description or "")
        return {"status": "success", "folder": created}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/folders/{name}")
def delete_folder_endpoint(name: str, delete_data: bool = True):
    """Delete a niche folder and optionally its associated data."""
    try:
        res = db.delete_niche_folder(name, delete_data=delete_data)
        return {"status": "success", "deleted": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/folders/{name}/rename")
def rename_folder_endpoint(name: str, req: RenameFolderRequest):
    """Rename a niche folder and update associated data."""
    try:
        res = db.rename_niche_folder(name, req.new_name)
        return {"status": "success", "renamed": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/history")
def get_history():
    """Get overall URL history & count."""
    video_ids, urls = db.get_existing_video_ids()
    return {
        "total_crawled_videos": len(video_ids),
        "total_urls": len(urls)
    }


@app.post("/api/crawl-top-comments")
def crawl_top_comments_endpoint(req: CrawlTopCommentsRequest, background_tasks: BackgroundTasks):
    """
    Batch crawl up to 1000 comments across top N videos for a keyword,
    extract Voice-of-Customer topic clusters, and update the Master Holistic Analysis.
    """
    keyword = req.keyword.strip()
    if not keyword:
        raise HTTPException(status_code=400, detail="Keyword is required")

    def run_batch_crawl():
        conn = db.get_db()
        cursor = conn.cursor()
        if req.crawl_all:
            cursor.execute("""
            SELECT video_id, creator, comments FROM videos 
            WHERE keyword = ? AND comments > 0 ORDER BY comments DESC LIMIT 60
            """, (keyword,))
        else:
            cursor.execute("""
            SELECT video_id, creator, comments FROM videos 
            WHERE keyword = ? AND comments > 0 ORDER BY comments DESC LIMIT ?
            """, (keyword, req.top_n))
        top_vids = [dict(r) for r in cursor.fetchall()]
        conn.close()

        total_new_crawled = 0
        for v in top_vids:
            vid = v["video_id"]
            author = v.get("creator")
            max_limit = min(int(v.get("comments") or 100), 200) if req.crawl_all else req.max_comments_per_video
            cmts = comment_crawler.fetch_comments_for_video(
                video_id=vid,
                max_comments=max_limit,
                author_username=author
            )
            if cmts:
                db.save_comments(vid, cmts)
                ins = comment_crawler.extract_comment_insights(cmts, keyword)
                db.save_comment_insights(vid, keyword, ins)
                total_new_crawled += len(cmts)

        # Regenerate master holistic analysis with the updated comments
        ai_engine.generate_master_holistic_analysis(keyword)
        print(f"[API] Batch comments crawl complete for '{keyword}': {total_new_crawled} comments crawled.")

    background_tasks.add_task(run_batch_crawl)

    target_msg = "toàn bộ video trong ngách" if req.crawl_all else f"top {req.top_n} videos"
    return {
        "status": "started",
        "keyword": keyword,
        "message": f"Started crawling comments for {target_msg}..."
    }


@app.post("/api/videos/{video_id}/comments")
def crawl_video_comments_endpoint(video_id: str, req: CrawlCommentsRequest):
    """
    On-demand crawl up to 1000 comments for a specific video,
    excluding author replies, and extract Voice-of-Customer insights.
    """
    conn = db.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM videos WHERE video_id = ?", (video_id,))
    v = cursor.fetchone()
    conn.close()

    author = v["creator"] if v else None
    kw = v["keyword"] if v else "tiktok"

    comments = comment_crawler.fetch_comments_for_video(
        video_id=video_id,
        max_comments=req.max_comments,
        author_username=author
    )

    if comments:
        db.save_comments(video_id, comments)
        insights = comment_crawler.extract_comment_insights(comments, kw)
        db.save_comment_insights(video_id, kw, insights)
        return {
            "status": "success",
            "video_id": video_id,
            "total_crawled": len(comments),
            "insights": insights
        }

    return {
        "status": "empty",
        "video_id": video_id,
        "total_crawled": 0,
        "message": "No comments found on this video."
    }


@app.get("/api/videos/{video_id}/comments")
def get_video_comments_endpoint(video_id: str):
    """Get stored comments and insights for a specific video."""
    insights = db.get_comment_insights(video_id)
    comments = db.get_video_comments(video_id, limit=100)
    return {
        "video_id": video_id,
        "insights": insights or {},
        "comments": comments
    }


@app.get("/api/patterns")
def get_macro_patterns(keyword: Optional[str] = Query(None)):
    """Macro pattern analysis across all videos for a keyword."""
    res = db.get_results_by_keyword(keyword)
    videos = res.get("videos", [])
    reviews = res.get("reviews", [])

    if not videos:
        return {"keyword": keyword, "total_videos": 0, "patterns": {}}

    total_views = sum(v.get("views", 0) for v in videos)
    total_likes = sum(v.get("likes", 0) for v in videos)
    total_comments = sum(v.get("comments", 0) for v in videos)
    total_saves = sum(v.get("saves", 0) for v in videos)
    count = len(videos)

    avg_views = int(total_views / count) if count else 0
    avg_likes = int(total_likes / count) if count else 0
    avg_comments = int(total_comments / count) if count else 0
    avg_saves = int(total_saves / count) if count else 0
    avg_eng = round(sum(v.get("engagement_rate", 0) for v in videos) / count, 4) if count else 0

    top_video = max(videos, key=lambda x: x.get("views", 0)) if videos else {}

    hook_themes = Counter()
    buyer_themes = Counter()

    for r in reviews:
        hk = r.get("hook", "").lower()
        if "diy" in hk or "build" in hk:
            hook_themes["DIY / Hand-Crafted Process"] += 1
        elif "price" in hk or "bargain" in hk or "affordable" in hk or "amazon" in hk or "deal" in hk:
            hook_themes["Bargain Discovery / Price Contrast"] += 1
        elif "aesthetic" in hk or "look at" in hk or "realistic" in hk or "transform" in hk:
            hook_themes["Visual Shock / Room Transformation"] += 1
        else:
            hook_themes["Curiosity / Relatable Life Context"] += 1

        bp = r.get("buyer_psychology", "").lower()
        if "fomo" in bp or "luxury" in bp or "prestige" in bp:
            buyer_themes["Affordable Luxury & Social Validation"] += 1
        elif "anxiety" in bp or "maintenance" in bp or "convenience" in bp:
            buyer_themes["Zero-Effort Convenience (Problem Solver)"] += 1
        elif "trust" in bp or "real" in bp or "quality" in bp:
            buyer_themes["Realism & Tactile Quality Proof"] += 1
        else:
            buyer_themes["General Aesthetic Enhancement"] += 1

    return {
        "keyword": res.get("keyword", keyword),
        "total_videos": count,
        "metrics_summary": {
            "total_views": total_views,
            "avg_views": avg_views,
            "max_views": top_video.get("views", 0),
            "total_likes": total_likes,
            "avg_likes": avg_likes,
            "total_comments": total_comments,
            "avg_comments": avg_comments,
            "total_saves": total_saves,
            "avg_saves": avg_saves,
            "avg_engagement_rate": avg_eng,
            "save_to_view_ratio": round((total_saves / total_views * 100), 2) if total_views else 0.0,
            "comment_to_view_ratio": round((total_comments / total_views * 100), 3) if total_views else 0.0
        },
        "top_performing_video": {
            "video_id": top_video.get("video_id"),
            "url": top_video.get("url"),
            "creator": top_video.get("creator"),
            "views": top_video.get("views"),
            "likes": top_video.get("likes"),
            "saves": top_video.get("saves"),
            "score": top_video.get("score"),
            "caption": top_video.get("caption")
        },
        "hook_patterns": dict(hook_themes.most_common()),
        "buyer_psychology_patterns": dict(buyer_themes.most_common())
    }


@app.get("/api/export/json")
def export_json(keyword: Optional[str] = Query(None)):
    """Export all analysis results, video metrics, comment insights, and master local AI analysis."""
    data = db.get_results_by_keyword(keyword)
    kw = (data.get("keyword") or "tiktok").replace(" ", "_")
    filename = f"tiktok_analysis_{kw}.json"
    content = json.dumps(data, ensure_ascii=False, indent=2)

    # Save a local copy in exports/ folder
    try:
        exports_dir = BASE_DIR / "exports"
        exports_dir.mkdir(parents=True, exist_ok=True)
        (exports_dir / filename).write_text(content, encoding="utf-8")
    except Exception as e:
        print(f"[Export] Notice saving local JSON: {e}")

    return Response(
        content=content,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@app.get("/api/export/csv")
def export_csv(keyword: Optional[str] = Query(None)):
    """
    Export video metrics, creative breakdown, Voice of Customer,
    and a dedicated 'AI Phân Tích Tổng Thể' column as an Excel CSV.
    """
    data = db.get_results_by_keyword(keyword)
    videos = data.get("videos", [])
    reviews = {r.get("video_id"): r for r in data.get("reviews", [])}
    insights = data.get("comment_insights", {})
    master = data.get("master_analysis") or {}
    master_summary = master.get("summary") or "Thị trường có dung lượng lớn, người mua tìm kiếm tính thẩm mỹ cao nhưng băn khoăn về độ chân thực."

    output = io.StringIO()
    output.write("\ufeff")

    fieldnames = [
        "rank", "video_id", "creator", "views", "likes", "comments",
        "saves", "reposts", "engagement_rate", "score", "upload_date",
        "ad_angle", "spoken_hook", "visual_hook", "setting", "on_screen_text",
        "ai_phan_tich_tong_the",
        "hook_analysis", "viral_mechanics", "buyer_psychology",
        "winning_formula", "spoken_transcript", "top_buying_intent_questions",
        "top_customer_objections", "comments_analyzed_count",
        "url", "caption"
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for idx, v in enumerate(videos, 1):
        vid = v.get("video_id")
        rev = reviews.get(vid, {})
        ins = insights.get(vid, {})

        intent_q = "; ".join([q.get("text", "") for q in ins.get("buying_intent", [])[:4]])
        obj_text = "; ".join([o.get("text", "") for o in ins.get("objections", [])[:3]])

        # Strategic Holistic AI column for this video
        ai_col = f"[ĐÁNH GIÁ NGÁCH]: {master_summary} | [CHIẾN LƯỢC VIDEO #{idx}]: {rev.get('winning_formula', '')} | [TÂM LÝ KHÁCH]: {rev.get('buyer_psychology', '')}"

        writer.writerow({
            "rank": idx,
            "video_id": vid,
            "creator": v.get("creator"),
            "views": v.get("views"),
            "likes": v.get("likes"),
            "comments": v.get("comments"),
            "saves": v.get("saves"),
            "reposts": v.get("reposts"),
            "engagement_rate": v.get("engagement_rate"),
            "score": v.get("score"),
            "upload_date": v.get("upload_date"),
            "ad_angle": rev.get("ad_angle", ""),
            "spoken_hook": rev.get("spoken_hook", ""),
            "visual_hook": rev.get("visual_hook", ""),
            "setting": rev.get("setting", ""),
            "on_screen_text": rev.get("on_screen_text", ""),
            "ai_phan_tich_tong_the": ai_col,
            "hook_analysis": rev.get("hook", ""),
            "viral_mechanics": rev.get("viral", ""),
            "buyer_psychology": rev.get("buyer_psychology", ""),
            "winning_formula": rev.get("winning_formula", ""),
            "spoken_transcript": rev.get("transcript", ""),
            "top_buying_intent_questions": intent_q,
            "top_customer_objections": obj_text,
            "comments_analyzed_count": ins.get("total_crawled", 0),
            "url": v.get("url"),
            "caption": v.get("caption")
        })

    kw = (data.get("keyword") or "tiktok").replace(" ", "_")
    filename = f"tiktok_videos_{kw}.csv"
    csv_bytes = output.getvalue().encode("utf-8")

    # Save a local copy in exports/ folder
    try:
        exports_dir = BASE_DIR / "exports"
        exports_dir.mkdir(parents=True, exist_ok=True)
        (exports_dir / filename).write_bytes(csv_bytes)
    except Exception as e:
        print(f"[Export] Notice saving local CSV: {e}")

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@app.get("/api/keyframe/{filename}")
def get_keyframe(filename: str):
    file_path = BASE_DIR / "data" / "keyframes" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Keyframe not found")
    return FileResponse(str(file_path))


@app.post("/api/analyze-multimodal/{video_id}")
def analyze_video_multimodal_endpoint(video_id: str):
    """Run full local multimodal analysis (Whisper Audio + Qwen-VL Vision) for a video."""
    try:
        res = ai_engine.analyze_single_video_multimodal(video_id)
        return {"status": "success", "video_id": video_id, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze-multimodal-top")
def analyze_top_multimodal_endpoint(req: MultimodalBatchRequest, background_tasks: BackgroundTasks):
    """Deep analyze top N videos in background with Whisper & Qwen-VL."""
    job_id = str(uuid.uuid4())[:8]
    db.create_job(job_id, req.keyword)

    def run_batch():
        try:
            db.update_job(job_id, status="processing", message=f"Đang bóc băng Whisper & soi góc quay Qwen-VL cho Top {req.top_n} video...")
            ai_engine.analyze_top_videos_multimodal(req.keyword, top_n=req.top_n)
            db.update_job(job_id, status="completed", progress=100, message=f"Đã hoàn thành phân tích Multimodal cho Top {req.top_n} video!")
        except Exception as e:
            db.update_job(job_id, status="failed", message=str(e))

    background_tasks.add_task(run_batch)
    return {
        "job_id": job_id,
        "status": "started",
        "message": f"Bắt đầu chuỗi Multimodal AI cho Top {req.top_n} video từ khóa '{req.keyword}'"
    }


@app.get("/api/creators")
def get_creators_endpoint(keyword: Optional[str] = None):
    """Retrieve creators with analytics, tier classification, and booking status."""
    creators = db.get_creators_with_analytics(keyword)
    return {
        "keyword": keyword,
        "total_creators": len(creators),
        "creators": creators
    }


@app.post("/api/creators/{creator}/enrich")
async def enrich_single_creator_endpoint(creator: str):
    """Scrape live TikTok profile for a single creator (followers, video count, bio, email)."""
    import backend.creator_service as creator_service
    res = await creator_service.scrape_single_creator(creator)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return {"status": "success", "creator": creator, "data": res}


@app.post("/api/creators/{creator}/booking")
def update_creator_booking_endpoint(creator: str, req: CreatorBookingRequest):
    """Update creator booking status, notes, and agreed/quoted price."""
    db.update_creator_booking(
        creator=creator,
        booking_status=req.booking_status,
        booking_notes=req.booking_notes,
        booking_price=req.booking_price
    )
    return {"status": "success", "creator": creator, "booking": req.dict()}


@app.post("/api/creators/batch-enrich")
def batch_enrich_creators_endpoint(req: CreatorBatchEnrichRequest, background_tasks: BackgroundTasks):
    """Trigger background batch profile scraping for top creators."""
    import backend.creator_service as creator_service
    job_id = str(uuid.uuid4())[:8]
    kw = req.keyword or "all"
    db.create_job(job_id, kw)

    def run_enrich():
        try:
            db.update_job(job_id, status="processing", message=f"Đang quét live profile & email cho top {req.max_count} creator...")
            asyncio.run(creator_service.batch_enrich_creators(req.keyword, max_count=req.max_count))
            db.update_job(job_id, status="completed", progress=100, message=f"Đã cập nhật live profile cho top {req.max_count} creator!")
        except Exception as e:
            db.update_job(job_id, status="failed", message=str(e))

    background_tasks.add_task(run_enrich)
    return {
        "job_id": job_id,
        "status": "started",
        "message": f"Bắt đầu quét live profile cho top {req.max_count} KOC"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api:app", host="127.0.0.1", port=8000, reload=True)
