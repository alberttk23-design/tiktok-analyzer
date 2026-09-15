from pathlib import Path
import csv
import re


BASE = Path(__file__).resolve().parent.parent

URL_FILE = BASE / "data/urls.txt"
REGISTRY_FILE = BASE / "data/video_registry.csv"
QUEUE_FILE = BASE / "data/download_queue.csv"


KEYWORD = "faux tree"


def extract_video_id(url):

    match = re.search(
        r"/video/(\d+)",
        url
    )

    if match:
        return match.group(1)

    return None


def load_registry():

    if not REGISTRY_FILE.exists():
        return set()

    with open(
        REGISTRY_FILE,
        encoding="utf-8"
    ) as f:

        return {
            row["video_id"]
            for row in csv.DictReader(f)
        }


def load_urls():

    if not URL_FILE.exists():
        return []

    return [
        x.strip()
        for x in URL_FILE.read_text(
            encoding="utf-8"
        ).splitlines()
        if x.strip()
    ]


def main():

    existing = load_registry()

    urls = load_urls()

    queue = []

    seen = set()


    for url in urls:

        video_id = extract_video_id(url)


        if not video_id:

            print(
                "INVALID:",
                url
            )

            continue


        # duplicate trong chính urls.txt

        if video_id in seen:

            print(
                "DUPLICATE INPUT:",
                video_id
            )

            continue


        seen.add(video_id)


        # đã tồn tại

        if video_id in existing:

            print(
                "SKIP EXIST:",
                video_id
            )

            continue


        print(
            "NEW:",
            video_id
        )


        queue.append({

            "video_id": video_id,

            "url": url,

            "keyword": KEYWORD,

            "status": "queued"

        })


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

        writer.writerows(queue)



    print()

    print(
        "Queue created:",
        len(queue)
    )


if __name__ == "__main__":
    main()
