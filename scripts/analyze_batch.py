from pathlib import Path
import subprocess
import sys

PROJECT_DIR = Path(__file__).resolve().parent.parent
VIDEOS_DIR = PROJECT_DIR / "data" / "videos"
ANALYZE_SCRIPT = PROJECT_DIR / "scripts" / "analyze.py"

VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v", ".webm"}

def main():
    videos = [
        p for p in VIDEOS_DIR.iterdir()
        if p.is_file() and p.suffix.lower() in VIDEO_EXTENSIONS
    ]

    if not videos:
        print("Không tìm thấy video trong data/videos")
        sys.exit(0)

    videos = sorted(videos)

    print(f"Found {len(videos)} videos.\n")

    success = 0
    failed = 0

    for index, video in enumerate(videos, start=1):
        print("=" * 60)
        print(f"[{index}/{len(videos)}] {video.name}")
        print("=" * 60)

        result = subprocess.run([
            sys.executable,
            str(ANALYZE_SCRIPT),
            str(video)
        ])

        if result.returncode == 0:
            success += 1
        else:
            failed += 1
            print(f"FAILED: {video.name}")

        print()

    print("=" * 60)
    print("BATCH COMPLETE")
    print(f"Success: {success}")
    print(f"Failed: {failed}")
    print("=" * 60)

if __name__ == "__main__":
    main()
