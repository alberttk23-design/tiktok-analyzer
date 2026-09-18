import os
import json
import base64
import time
import shutil
import logging
import requests
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
import yt_dlp

logger = logging.getLogger("tiktok.vision")

BASE_DIR = Path(__file__).resolve().parent.parent
KEYFRAMES_DIR = BASE_DIR / "data" / "keyframes"
CACHE_DIR = BASE_DIR / "data" / "cache"

KEYFRAMES_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

OLLAMA_API_URL = "http://localhost:11434/api/generate"
VISION_MODEL = "qwen3-vl:4b"


def download_video_stream(video_url: str, video_id: str) -> Optional[Path]:
    """
    Download lightweight MP4 video stream (<=480p) using yt-dlp.
    Returns path to downloaded temp video file.
    """
    target_pattern = str(CACHE_DIR / f"{video_id}.%(ext)s")
    
    ydl_opts = {
        'format': 'bestvideo[height<=480]+bestaudio/best[height<=480]/best',
        'outtmpl': target_pattern,
        'quiet': True,
        'no_warnings': True,
        'socket_timeout': 20,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            downloaded_path = Path(ydl.prepare_filename(info))
            if downloaded_path.exists():
                return downloaded_path
    except Exception as e:
        logger.error(f"yt-dlp download failed for {video_url}: {e}")
        
    return None


def extract_keyframes(video_path: Path, video_id: str, duration: float = 15.0) -> List[str]:
    """
    Extract 3 representative keyframes using ffmpeg:
    1. Visual Hook (1.0s)
    2. Mid Demonstration (duration * 0.45)
    3. Final Result / CTA (max(duration - 2.0, 3.0))
    Returns list of paths to extracted JPG files.
    """
    t1 = 1.0
    t2 = max(2.5, duration * 0.45) if duration > 5 else 2.5
    t3 = max(t2 + 1.5, duration - 2.0) if duration > 5 else 4.0

    frame_paths = []
    timestamps = [("kf1", t1), ("kf2", t2), ("kf3", t3)]

    for name, ts in timestamps:
        out_jpg = KEYFRAMES_DIR / f"{video_id}_{name}.jpg"
        cmd = [
            "ffmpeg",
            "-y",
            "-ss", str(ts),
            "-i", str(video_path),
            "-vframes", "1",
            "-q:v", "3",
            str(out_jpg)
        ]
        try:
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10)
            if out_jpg.exists():
                frame_paths.append(str(out_jpg))
        except Exception as e:
            logger.warning(f"Failed to extract frame at {ts}s for {video_id}: {e}")

    # Fallback: if t3 failed or video was short, make sure at least kf1 exists
    if not frame_paths:
        out_jpg = KEYFRAMES_DIR / f"{video_id}_kf1.jpg"
        cmd = ["ffmpeg", "-y", "-ss", "0.5", "-i", str(video_path), "-vframes", "1", "-q:v", "3", str(out_jpg)]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10)
        if out_jpg.exists():
            frame_paths.append(str(out_jpg))

    return frame_paths


def analyze_keyframes_with_qwen(frame_paths: List[str], caption: str = "") -> Dict[str, Any]:
    """
    Send the primary visual hook keyframe to local qwen3-vl:4b to analyze visual hook, setting, and text.
    """
    if not frame_paths:
        return {
            "visual_hook": "Không có hình ảnh để phân tích",
            "setting": "Chưa xác định",
            "on_screen_text": "Không có",
            "visual_style": "Standard"
        }

    # Use the primary opening visual hook frame (kf1)
    primary_frame = frame_paths[0]
    try:
        with open(primary_frame, "rb") as f:
            b64_image = base64.b64encode(f.read()).decode("utf-8")
    except Exception as e:
        logger.error(f"Error encoding image {primary_frame}: {e}")
        return {
            "visual_hook": "Lỗi đọc file ảnh",
            "setting": "Chưa xác định",
            "on_screen_text": "Không có",
            "visual_style": "Standard"
        }

    prompt = f"""Analyze this TikTok opening frame (0-1s visual hook).
Caption: "{caption}".
Return strict JSON with these keys:
{{
  "visual_hook": "1 short sentence describing what visually stops the user from scrolling in the first 2 seconds",
  "setting": "1 short sentence describing the room or background setting",
  "on_screen_text": "Text visible on screen, or 'None' if none",
  "visual_style": "1 category: Aesthetic Room Tour, POV Unboxing, Demonstration, Before/After, Selfie Talking Head, or ASMR Styling"
}}
Return ONLY valid JSON."""

    try:
        resp = requests.post(
            OLLAMA_API_URL,
            json={
                "model": VISION_MODEL,
                "prompt": prompt,
                "system": "You are a concise visual hook analyst. Respond immediately with valid JSON.",
                "images": [b64_image],
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "num_predict": 300,
                    "num_ctx": 8192
                }
            },
            timeout=120
        )
        
        if resp.status_code == 200:
            result_text = resp.json().get("response", "").strip()
            from backend.ai_engine import extract_json
            import re
            parsed = extract_json(result_text)
            if parsed and isinstance(parsed, dict):
                return {
                    "visual_hook": parsed.get("visual_hook", "") or "Cận cảnh chi tiết sản phẩm",
                    "setting": parsed.get("setting", "") or "Không gian nội thất",
                    "on_screen_text": parsed.get("on_screen_text", "") or "Không có",
                    "visual_style": parsed.get("visual_style", "Aesthetic Room Tour")
                }
            else:
                clean_txt = re.sub(r'<think>.*?</think>', '', result_text, flags=re.DOTALL).strip()
                return {
                    "visual_hook": clean_txt[:200] if clean_txt else "Cận cảnh chi tiết sản phẩm",
                    "setting": "Không gian nội thất",
                    "on_screen_text": "Xem khung hình",
                    "visual_style": "Product Showcase"
                }
        else:
            logger.warning(f"Ollama vision response {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        logger.error(f"Error calling Ollama vision model: {e}")

    return {
        "visual_hook": "Lỗi phân tích thị giác",
        "setting": "Chưa xác định",
        "on_screen_text": "Không có",
        "visual_style": "Standard"
    }


def analyze_video_multimodal_full(video_url: str, video_id: str, caption: str = "", duration: float = 15.0) -> Dict[str, Any]:
    """
    End-to-end multimodal processor for 1 video:
    1. Download stream (yt-dlp)
    2. Transcribe spoken audio (faster-whisper)
    3. Extract 3 keyframes (ffmpeg)
    4. Vision analysis of visual hook (qwen3-vl)
    5. Clean up temp mp4 video
    Returns combined multimodal analysis dict.
    """
    from backend.audio_transcriber import transcribe_media_file

    logger.info(f"Starting full multimodal pipeline for video {video_id}...")
    temp_vid = download_video_stream(video_url, video_id)
    
    if not temp_vid or not temp_vid.exists():
        logger.warning(f"Could not download stream for {video_id}. Falling back.")
        return {
            "transcript": "",
            "spoken_hook": "Không tải được video stream",
            "visual_hook": "Không có khung hình",
            "setting": "Chưa xác định",
            "on_screen_text": "",
            "visual_style": "Standard",
            "keyframes": []
        }

    try:
        # Step 1: Transcribe audio
        audio_res = transcribe_media_file(str(temp_vid), model_size="tiny")
        
        # Step 2: Extract keyframes
        keyframes = extract_keyframes(temp_vid, video_id, duration=duration)
        
        # Step 3: Vision analysis with Qwen-VL
        vision_res = analyze_keyframes_with_qwen(keyframes, caption=caption)
        
        # Relative URLs or paths for keyframes so UI can show them
        keyframe_urls = [f"/api/keyframe/{Path(p).name}" for p in keyframes] if keyframes else []

        # Step 4: Refine sound type based on Whisper audio transcription
        trans = audio_res.get("transcript", "").strip()
        spoken = audio_res.get("spoken_hook", "")
        caption_lower = caption.lower()

        if "asmr" in caption_lower or "asmr" in trans.lower():
            detected_stype = "asmr"
        elif trans and len(trans) > 10 and not ("không có lời thoại" in spoken.lower() or "background music only" in spoken.lower()):
            detected_stype = "voiceover"
        else:
            detected_stype = "music_only"

        try:
            from backend.db import update_video_sound
            update_video_sound(video_id, detected_stype)
        except Exception:
            pass

        return {
            "transcript": audio_res.get("transcript", ""),
            "spoken_hook": audio_res.get("spoken_hook", ""),
            "language": audio_res.get("language", "en"),
            "sound_type": detected_stype,
            "visual_hook": vision_res.get("visual_hook", ""),
            "setting": vision_res.get("setting", ""),
            "on_screen_text": vision_res.get("on_screen_text", ""),
            "visual_style": vision_res.get("visual_style", "Aesthetic Room Tour"),
            "keyframes": keyframe_urls
        }
    finally:
        # Clean up temporary downloaded video file to save disk space
        if temp_vid and temp_vid.exists():
            try:
                temp_vid.unlink()
            except Exception:
                pass


def batch_transcribe_niche(keyword: str, scope: str = "all", progress_callback=None) -> dict:
    """
    Batch transcribe ALL videos in a niche that don't yet have transcriptions.
    Downloads each video stream, runs Whisper, saves transcript, deletes mp4.
    
    Args:
        keyword: Niche keyword to process
        scope: "all" to transcribe everything, "voiceover_only" to only process voiceover-tagged videos
        progress_callback: Optional callable(done, total, message) for realtime progress updates
    
    Returns: Summary dict with counts
    """
    from backend.audio_transcriber import transcribe_media_file
    from backend import db

    conn = db.get_db()
    cursor = conn.cursor()

    # Find videos that need transcription (no transcript in analysis_reviews yet)
    scope_filter = ""
    if scope == "voiceover_only":
        scope_filter = "AND v.sound_type IN ('voiceover', 'voice_with_music')"
    
    cursor.execute(f"""
    SELECT v.video_id, v.url, v.caption, v.duration, v.sound_type
    FROM videos v
    LEFT JOIN analysis_reviews ar ON v.video_id = ar.video_id
    WHERE v.keyword = ?
      AND (ar.transcript IS NULL OR ar.transcript = '' OR ar.video_id IS NULL)
      {scope_filter}
    ORDER BY v.views DESC
    """, (keyword,))
    pending = [dict(r) for r in cursor.fetchall()]
    conn.close()

    total = len(pending)
    done = 0
    success = 0
    failed = 0

    logger.info(f"Batch transcribe: {total} videos pending for '{keyword}' (scope={scope})")

    for vid_info in pending:
        video_id = vid_info["video_id"]
        video_url = vid_info["url"]
        caption = vid_info.get("caption", "")
        duration = vid_info.get("duration", 15.0) or 15.0

        done += 1
        if progress_callback:
            progress_callback(done, total, f"Đang bóc băng video {done}/{total}: {video_id[:20]}...")

        try:
            # Download stream
            temp_vid = download_video_stream(video_url, video_id)
            if not temp_vid or not temp_vid.exists():
                logger.warning(f"Skipping {video_id}: download failed")
                failed += 1
                continue

            try:
                # Transcribe with Whisper
                audio_res = transcribe_media_file(str(temp_vid), model_size="tiny")
                transcript = audio_res.get("transcript", "").strip()
                spoken_hook = audio_res.get("spoken_hook", "").strip()

                # Refine sound_type based on actual audio content
                caption_lower = caption.lower()
                if "asmr" in caption_lower or "asmr" in transcript.lower():
                    detected_stype = "asmr"
                elif transcript and len(transcript) > 10 and not ("không có lời thoại" in spoken_hook.lower() or "background music only" in spoken_hook.lower()):
                    detected_stype = "voiceover"
                else:
                    detected_stype = "music_only"

                # Save to DB
                db.update_multimodal_analysis(video_id, {
                    "transcript": transcript,
                    "spoken_hook": spoken_hook,
                })
                db.update_video_sound(video_id, detected_stype)
                success += 1

            finally:
                if temp_vid and temp_vid.exists():
                    try:
                        temp_vid.unlink()
                    except Exception:
                        pass

        except Exception as e:
            logger.error(f"Error transcribing {video_id}: {e}")
            failed += 1

    result = {
        "keyword": keyword,
        "scope": scope,
        "total_pending": total,
        "success": success,
        "failed": failed,
    }
    logger.info(f"Batch transcribe complete: {result}")
    return result


def batch_extract_and_classify(keyword: str, progress_callback=None) -> dict:
    """
    Batch extract kf1 keyframe and classify visual content type for ALL videos
    in a niche that don't yet have visual_style classification.
    
    Args:
        keyword: Niche keyword to process
        progress_callback: Optional callable(done, total, message) for realtime progress
    
    Returns: Summary dict with content type distribution
    """
    from backend import db
    from collections import Counter

    conn = db.get_db()
    cursor = conn.cursor()

    # Find videos that need visual classification
    cursor.execute("""
    SELECT v.video_id, v.url, v.caption, v.duration
    FROM videos v
    LEFT JOIN analysis_reviews ar ON v.video_id = ar.video_id
    WHERE v.keyword = ?
      AND (ar.visual_style IS NULL OR ar.visual_style = '' OR ar.visual_style = 'Standard' OR ar.video_id IS NULL)
    ORDER BY v.views DESC
    """, (keyword,))
    pending = [dict(r) for r in cursor.fetchall()]
    conn.close()

    total = len(pending)
    done = 0
    success = 0
    failed = 0
    style_counter = Counter()

    logger.info(f"Batch keyframe classify: {total} videos pending for '{keyword}'")

    for vid_info in pending:
        video_id = vid_info["video_id"]
        video_url = vid_info["url"]
        caption = vid_info.get("caption", "")
        duration = vid_info.get("duration", 15.0) or 15.0

        done += 1
        if progress_callback:
            progress_callback(done, total, f"Đang phân loại hình ảnh {done}/{total}: {video_id[:20]}...")

        try:
            temp_vid = download_video_stream(video_url, video_id)
            if not temp_vid or not temp_vid.exists():
                logger.warning(f"Skipping {video_id}: download failed")
                failed += 1
                continue

            try:
                # Extract only kf1 (opening frame) for efficiency
                kf1_path = KEYFRAMES_DIR / f"{video_id}_kf1.jpg"
                cmd = ["ffmpeg", "-y", "-ss", "1.0", "-i", str(temp_vid), "-vframes", "1", "-q:v", "3", str(kf1_path)]
                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10)

                if kf1_path.exists():
                    # Classify with Qwen-VL
                    vision_res = analyze_keyframes_with_qwen([str(kf1_path)], caption=caption)
                    visual_style = vision_res.get("visual_style", "Standard")
                    style_counter[visual_style] += 1

                    # Save to DB
                    keyframe_urls = [f"/api/keyframe/{video_id}_kf1.jpg"]
                    db.update_multimodal_analysis(video_id, {
                        "visual_hook": vision_res.get("visual_hook", ""),
                        "setting": vision_res.get("setting", ""),
                        "on_screen_text": vision_res.get("on_screen_text", ""),
                        "visual_style": visual_style,
                        "keyframes": keyframe_urls,
                    })
                    success += 1
                else:
                    failed += 1

            finally:
                if temp_vid and temp_vid.exists():
                    try:
                        temp_vid.unlink()
                    except Exception:
                        pass

        except Exception as e:
            logger.error(f"Error classifying {video_id}: {e}")
            failed += 1

    # Build content type distribution
    total_classified = sum(style_counter.values())
    content_types = []
    for style_name, count in style_counter.most_common():
        content_types.append({
            "type": style_name,
            "count": count,
            "pct": round((count / max(1, total_classified)) * 100, 1)
        })

    result = {
        "keyword": keyword,
        "total_pending": total,
        "success": success,
        "failed": failed,
        "content_types": content_types,
        "total_classified": total_classified
    }
    logger.info(f"Batch keyframe classify complete: {result}")
    return result

