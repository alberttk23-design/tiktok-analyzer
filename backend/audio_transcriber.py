import os
import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger("tiktok.transcriber")

_WHISPER_MODEL = None

def get_whisper_model(model_size: str = "tiny"):
    """
    Lazy-load and cache the faster-whisper model.
    Using 'tiny' model on Apple Silicon CPU/NEON takes ~1s and consumes only ~75MB RAM.
    """
    global _WHISPER_MODEL
    if _WHISPER_MODEL is None:
        try:
            from faster_whisper import WhisperModel
            logger.info(f"Loading faster-whisper model: {model_size}...")
            t0 = time.time()
            _WHISPER_MODEL = WhisperModel(model_size, device="cpu", compute_type="int8")
            logger.info(f"Loaded faster-whisper model in {time.time() - t0:.2f}s")
        except Exception as e:
            logger.error(f"Failed to load faster-whisper model: {e}")
            raise e
    return _WHISPER_MODEL


def transcribe_media_file(file_path: str, model_size: str = "tiny") -> Dict[str, Any]:
    """
    Transcribe spoken audio from a local media file (mp4, mp3, etc.).
    Returns transcript, spoken_hook (first 4.0 seconds), and detected language.
    """
    path = Path(file_path)
    if not path.exists():
        logger.warning(f"Media file not found: {file_path}")
        return {
            "transcript": "",
            "spoken_hook": "",
            "language": "unknown",
            "segments": []
        }

    try:
        model = get_whisper_model(model_size)
        segments_raw, info = model.transcribe(str(path), beam_size=1)
        
        segments = []
        full_text_list = []
        spoken_hook_list = []
        
        for seg in segments_raw:
            clean_text = seg.text.strip()
            if not clean_text:
                continue
            segments.append({
                "start": round(seg.start, 2),
                "end": round(seg.end, 2),
                "text": clean_text
            })
            full_text_list.append(clean_text)
            
            # Capture words spoken in the opening hook window (first 4.0 seconds)
            if seg.start <= 4.0:
                spoken_hook_list.append(clean_text)
        
        full_transcript = " ".join(full_text_list).strip()
        spoken_hook = " ".join(spoken_hook_list).strip()
        
        # If hook is empty but video has transcript, use the first segment
        if not spoken_hook and segments:
            spoken_hook = segments[0]["text"]
            
        if not full_transcript:
            spoken_hook = "Âm thanh nền / Không có lời thoại (Background Music Only)"
            
        return {
            "transcript": full_transcript,
            "spoken_hook": spoken_hook,
            "language": info.language if info else "unknown",
            "duration": round(info.duration, 2) if info and hasattr(info, 'duration') else 0.0,
            "segments": segments
        }
    except Exception as e:
        logger.error(f"Error transcribing {file_path}: {e}")
        return {
            "transcript": "",
            "spoken_hook": f"Lỗi bóc băng: {str(e)}",
            "language": "error",
            "segments": []
        }
