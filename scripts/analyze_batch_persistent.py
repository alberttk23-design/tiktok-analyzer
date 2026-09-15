import json
import time
from pathlib import Path

from mlx_vlm import load, generate


PROJECT_DIR = Path(__file__).resolve().parent.parent
VIDEOS_DIR = PROJECT_DIR / "data" / "videos"
RESULTS_DIR = PROJECT_DIR / "data" / "results"
PROMPT_FILE = PROJECT_DIR / "prompts" / "video_analysis.txt"

MODEL = "mlx-community/Qwen3-VL-4B-Instruct-4bit"

VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v", ".webm"}


def extract_json(text):
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise ValueError("Không tìm thấy JSON trong output.")

    return json.loads(text[start:end + 1])


def main():
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    videos = sorted([
        p for p in VIDEOS_DIR.iterdir()
        if p.is_file() and p.suffix.lower() in VIDEO_EXTENSIONS
    ])

    if not videos:
        print("Không tìm thấy video trong data/videos")
        return

    prompt = PROMPT_FILE.read_text(encoding="utf-8")

    print(f"Found {len(videos)} videos")
    print("Loading Qwen ONCE...")

    load_start = time.time()

    model, processor = load(MODEL)

    # Giữ cấu hình đã test ổn
    processor.video_processor.fps = 1

    print(f"Model loaded in {time.time() - load_start:.1f}s\n")

    success = 0
    failed = 0
    skipped = 0

    for index, video in enumerate(videos, start=1):

        output_file = RESULTS_DIR / f"{video.stem}.json"

        print("=" * 60)
        print(f"[{index}/{len(videos)}] {video.name}")

        # Cho phép resume batch nếu bị dừng giữa chừng
        if output_file.exists():
            print("SKIP - JSON đã tồn tại")
            skipped += 1
            continue

        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "video",
                        "video": video.as_uri()
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]

        formatted_prompt = processor.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        start = time.time()

        try:
            result = generate(
                model=model,
                processor=processor,
                prompt=formatted_prompt,
                video=str(video),
                max_tokens=1400,
                temperature=0.0,
                verbose=False,
            )

            data = extract_json(result.text)

            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            elapsed = time.time() - start

            print(f"DONE - {elapsed:.1f}s")
            print(f"Saved: {output_file.name}")

            success += 1

        except Exception as e:
            elapsed = time.time() - start

            print(f"FAILED after {elapsed:.1f}s")
            print(e)

            # Lưu raw output nếu model trả JSON lỗi
            try:
                raw_file = RESULTS_DIR / f"{video.stem}_RAW.txt"
                raw_file.write_text(result.text, encoding="utf-8")
                print(f"Raw output saved: {raw_file.name}")
            except:
                pass

            failed += 1

    print("\n" + "=" * 60)
    print("BATCH COMPLETE")
    print(f"Success : {success}")
    print(f"Skipped : {skipped}")
    print(f"Failed  : {failed}")
    print("=" * 60)


if __name__ == "__main__":
    main()
