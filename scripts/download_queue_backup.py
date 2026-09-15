from pathlib import Path
import csv
import subprocess


BASE = Path(__file__).resolve().parent.parent

QUEUE_FILE = BASE / "data/download_queue.csv"
VIDEO_DIR = BASE / "data/videos"
REGISTRY_FILE = BASE / "data/video_registry.csv"


def load_queue():

    if not QUEUE_FILE.exists():
        return []

    with open(
        QUEUE_FILE,
        encoding="utf-8"
    ) as f:

        return list(csv.DictReader(f))


def save_queue(rows):

    with open(
        QUEUE_FILE,
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


def add_to_registry(row):

    existing = set()

    if REGISTRY_FILE.exists():

        with open(
            REGISTRY_FILE,
            encoding="utf-8"
        ) as f:

            for item in csv.DictReader(f):

                existing.add(
                    item["video_id"]
                )


    if row["video_id"] in existing:

        print(
            "Registry exists:",
            row["video_id"]
        )

        return


    file_exists = REGISTRY_FILE.exists()


    with open(
        REGISTRY_FILE,
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

            "video_id": row["video_id"],

            "url": row["url"],

            "keyword": row["keyword"],

            "status": "downloaded"

        })


    print(
        "Registry added:",
        row["video_id"]
    )


def download_video(row):

    video_id = row["video_id"]


    print("=" * 60)

    print(
        "Downloading:",
        video_id
    )


    output = str(
        VIDEO_DIR / "%(id)s.%(ext)s"
    )


    cmd = [

        "yt-dlp",

        "-o",

        output,

        row["url"]

    ]


    result = subprocess.run(cmd)


    if result.returncode == 0:

        print(
            "DONE:",
            video_id
        )

        return True


    print(
        "FAILED:",
        video_id
    )

    return False



def main():

    VIDEO_DIR.mkdir(
        exist_ok=True
    )


    rows = load_queue()


    for row in rows:


        if row["status"] != "queued":

            continue


        success = download_video(row)


        if success:

            row["status"] = "downloaded"

            add_to_registry(row)


    save_queue(rows)


    print()

    print(
        "DOWNLOAD QUEUE COMPLETE"
    )


if __name__ == "__main__":

    main()
