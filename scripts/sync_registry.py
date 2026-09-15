from pathlib import Path
import csv
import json


VIDEO_DIR = Path("data/videos")
REGISTRY = Path("data/video_registry.csv")


def load_existing():

    if not REGISTRY.exists():
        return {}

    with open(
        REGISTRY,
        encoding="utf-8"
    ) as f:

        return {
            row["video_id"]: row
            for row in csv.DictReader(f)
        }


def main():

    registry = load_existing()

    for video in VIDEO_DIR.glob("*.mp4"):

        vid = video.stem

        if vid not in registry:

            info = VIDEO_DIR / f"{vid}.info.json"

            uploader = ""
            url = ""

            if info.exists():

                data = json.loads(
                    info.read_text(
                        encoding="utf-8"
                    )
                )

                uploader = data.get(
                    "uploader",
                    ""
                )

                url = data.get(
                    "webpage_url",
                    ""
                )


            registry[vid] = {
                "video_id": vid,
                "url": url,
                "keyword": "",
                "status": "downloaded"
            }


    with open(
        REGISTRY,
        "w",
        newline="",
        encoding="utf-8"
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=[
                "video_id",
                "url",
                "keyword",
                "status"
            ]
        )

        writer.writeheader()

        writer.writerows(
            registry.values()
        )


    print(
        "Registry synced:",
        len(registry)
    )


if __name__ == "__main__":
    main()

