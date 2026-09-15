import sys
import json
import subprocess
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parent.parent
PROMPT_FILE = PROJECT_DIR / "prompts" / "video_analysis.txt"
RESULTS_DIR = PROJECT_DIR / "data" / "results"

MODEL = "Qwen/Qwen3-VL-4B-Instruct"


def extract_json(text):
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise ValueError("Không tìm thấy JSON trong output của model.")

    return text[start:end + 1]


def main():
    if len(sys.argv) < 2:
        print("Cách dùng:")
        print("python scripts/analyze.py /duong/dan/video.mp4")
        sys.exit(1)

    video_path = Path(sys.argv[1]).expanduser().resolve()

    if not video_path.exists():
        print(f"Không tìm thấy video: {video_path}")
        sys.exit(1)

    prompt = PROMPT_FILE.read_text(encoding="utf-8")

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Analyzing: {video_path.name}")

    command = [
        sys.executable,
        "-m",
        "mlx_vlm.generate",
        "--model",
        MODEL,
        "--video",
        str(video_path),
        "--prompt",
        prompt,
        "--max-tokens",
        "1800",
        "--no-verbose",
    ]

    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print("MODEL ERROR:")
        print(result.stderr)
        sys.exit(1)

    try:
        json_text = extract_json(result.stdout)
        data = json.loads(json_text)
    except Exception as e:
        print("Không parse được JSON.")
        print("Lỗi:", e)
        print("\nRAW OUTPUT:\n")
        print(result.stdout)
        sys.exit(1)

    output_file = RESULTS_DIR / f"{video_path.stem}.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("\nDONE")
    print(f"Saved to: {output_file}")


if __name__ == "__main__":
    main()
