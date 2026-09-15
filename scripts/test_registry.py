import csv
from pathlib import Path


FILE = Path("data/video_registry.csv")


def load_registry():

    if not FILE.exists():
        return {}

    with open(
        FILE,
        encoding="utf-8"
    ) as f:

        rows = csv.DictReader(f)

        return {
            row["video_id"]: row
            for row in rows
        }


def add_video(video_id, url, keyword):

    registry = load_registry()

    if video_id in registry:
        print(
            "SKIP DUPLICATE:",
            video_id
        )
        return


    file_exists = FILE.exists()

    with open(
        FILE,
        "a",
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

        if not file_exists:
            writer.writeheader()


        writer.writerow({
            "video_id": video_id,
            "url": url,
            "keyword": keyword,
            "status": "queued"
        })


    print(
        "ADDED:",
        video_id
    )



if __name__ == "__main__":

    add_video(
        "123456",
        "https://tiktok.com/test",
        "faux olive tree"
    )

    add_video(
        "123456",
        "https://tiktok.com/test",
        "faux olive tree"
    )
