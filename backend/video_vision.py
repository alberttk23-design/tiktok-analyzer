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
                "images": [b64_image],
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "num_ctx": 4096
                }
            },
            timeout=60
        )
        
        if resp.status_code == 200:
            result_text = resp.json().get("response", "").strip()
            # Clean markdown formatting if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            try:
                parsed = json.loads(result_text)
                return {
                    "visual_hook": parsed.get("visual_hook", ""),
                    "setting": parsed.get("setting", ""),
                    "on_screen_text": parsed.get("on_screen_text", ""),
                    "visual_style": parsed.get("visual_style", "Aesthetic Room Tour")
                }
            except Exception:
                return {
                    "visual_hook": result_text[:200],
                    "setting": "Không gian nội thất",
                    "on_screen_text": "Xem khung hình",
                    "visual_style": "Product Showcase"
                }
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
        keyframe_urls = [f"/api/keyframe/{Path(p).name}" for p in keyframes]
        
        return {
            "transcript": audio_res.get("transcript", ""),
            "spoken_hook": audio_res.get("spoken_hook", ""),
            "language": audio_res.get("language", "en"),
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
