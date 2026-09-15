from pathlib import Path
import csv
import json


BASE = Path(__file__).resolve().parent.parent

VIDEO_DIR = BASE / "data/videos"
OUTPUT = BASE / "data/video_registry_clean.csv"


def main():

    rows = []


    for video_file in VIDEO_DIR.glob("*.mp4"):

        video_id = video_file.stem

        info_file = VIDEO_DIR / f"{video_id}.info.json"


        uploader = ""


        if info_file.exists():

            try:

                data = json.loads(
                    info_file.read_text(
                        encoding="utf-8"
                    )
                )

                uploader = data.get(
                    "uploader",
                    ""
                )

            except:

                pass


        if uploader:

            url = (
                f"https://www.tiktok.com/"
                f"@{uploader}/video/{video_id}"
            )

        else:

            url = (
                f"https://www.tiktok.com/video/{video_id}"
            )


        rows.append({

            "video_id": video_id,

            "url": url,

            "keyword": "faux tree",

            "status": "downloaded"

        })


    with open(
        OUTPUT,
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

        writer.writerows(rows)


    print(
        "Registry rebuilt:",
        len(rows)
    )


if __name__ == "__main__":
    main()
