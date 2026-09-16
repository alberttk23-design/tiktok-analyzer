import csv
import io
import json
import uuid
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


class MultimodalBatchRequest(BaseModel):
    keyword: str
    top_n: int = 5



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
def run_master_analysis_endpoint(req: AnalyzeRequest):
    """Run 100% Local Master AI Analysis via local Ollama without external APIs."""
    result = ai_engine.generate_master_holistic_analysis(req.keyword)
    return {
        "status": "success",
        "keyword": req.keyword,
        "master_analysis": result
    }


@app.get("/api/master-analysis")
def get_master_analysis_endpoint(keyword: Optional[str] = Query(None)):
    """Get stored master holistic analysis."""
    res = db.get_results_by_keyword(keyword)
    return res.get("master_analysis") or {}


@app.get("/api/keywords")
def get_keywords():
    """List all previously analyzed keywords and video counts."""
    return db.get_all_keywords()


@app.get("/api/history")
def get_history():
    """Get overall URL history & count."""
    video_ids, urls = db.get_existing_video_ids()
    return {
        "total_crawled_videos": len(video_ids),
        "total_urls": len(urls)
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



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api:app", host="127.0.0.1", port=8000, reload=True)
