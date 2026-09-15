import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
VIDEOS_DIR = PROJECT_DIR / "data" / "videos"
URL_FILE = PROJECT_DIR / "data" / "urls.txt"

VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

if not URL_FILE.exists():
    URL_FILE.write_text("", encoding="utf-8")
    print(f"Đã tạo: {URL_FILE}")
    print("Hãy dán mỗi TikTok URL trên một dòng rồi chạy lại.")
    sys.exit()

urls = [
    line.strip()
    for line in URL_FILE.read_text(encoding="utf-8").splitlines()
    if line.strip() and not line.strip().startswith("#")
]

if not urls:
    print("data/urls.txt chưa có TikTok URL.")
    sys.exit()

print(f"Found {len(urls)} URLs\n")

for i, url in enumerate(urls, 1):
    print("=" * 60)
    print(f"[{i}/{len(urls)}] {url}")

    cmd = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--impersonate", "Safari-18.4:Macos-15",
        "--no-playlist",
        "--write-info-json",
        "-o", str(VIDEOS_DIR / "%(id)s.%(ext)s"),
        url
    ]

    result = subprocess.run(cmd)

    if result.returncode == 0:
        print("DONE")
    else:
        print("FAILED")

print("\nDownload batch complete.")
