import sys
import json
import time
from pathlib import Path

from mlx_vlm import load, generate


PROJECT_DIR = Path(__file__).resolve().parent.parent
PROMPT_FILE = PROJECT_DIR / "prompts" / "video_analysis.txt"

MODEL = "mlx-community/Qwen3-VL-4B-Instruct-4bit"


def extract_json(text):
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise ValueError("Không tìm thấy JSON.")

    return json.loads(text[start:end + 1])


if len(sys.argv) < 2:
    print("Usage: python scripts/test_persistent.py video.mp4")
    sys.exit(1)


video = Path(sys.argv[1]).expanduser().resolve()

if not video.exists():
    print(f"Không tìm thấy video: {video}")
    sys.exit(1)

prompt = PROMPT_FILE.read_text(encoding="utf-8")

print("Loading Qwen...")
start = time.time()

model, processor = load(MODEL)
processor.video_processor.fps = 1

print(f"Model loaded in {time.time() - start:.1f}s")

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

print(f"Analyzing: {video.name}")
start = time.time()

result = generate(
    model=model,
    processor=processor,
    prompt=formatted_prompt,
    video=str(video),
    max_tokens=1800,
    temperature=0.0,
    verbose=False,
)

print(f"Analysis time: {time.time() - start:.1f}s")

data = extract_json(result.text)

print(json.dumps(data, ensure_ascii=False, indent=2))
