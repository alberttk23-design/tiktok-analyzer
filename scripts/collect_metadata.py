from pathlib import Path
import csv
import subprocess
import json


BASE = Path(__file__).resolve().parent.parent

INPUT = BASE / "data/search_results.csv"

OUTPUT = BASE / "data/metadata.csv"



def get_metadata(url):

    cmd = [
        "yt-dlp",
        "--dump-json",
        "--no-download",
        url
    ]

    try:

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode != 0:
            return {}

        return json.loads(
            result.stdout
        )

    except Exception:

        return {}



def main():

    rows = []


    with open(
        INPUT,
        encoding="utf-8"
    ) as f:

        videos = list(
            csv.DictReader(f)
        )


    for i, video in enumerate(videos,1):

        print(
            "="*50
        )

        print(
            f"[{i}/{len(videos)}]",
            video["video_id"]
        )


        info = get_metadata(
            video["url"]
        )


        rows.append({

            "video_id":
                video["video_id"],

            "url":
                video["url"],

            "creator":
                info.get("uploader",""),

            "caption":
                info.get("description",""),

            "views":
                info.get("view_count",0),

            "likes":
                info.get("like_count",0),

            "comments":
                info.get("comment_count",0),

            "shares":
                info.get("repost_count",0),

            "duration":
                info.get("duration",0),

            "upload_date":
                info.get("upload_date",""),

            "keyword":
                video["keyword"]

        })


        print(
            "DONE"
        )


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
                "creator",
                "caption",
                "views",
                "likes",
                "comments",
                "shares",
                "duration",
                "upload_date",
                "keyword"
            ]
        )


        writer.writeheader()

        writer.writerows(rows)



    print()
    print(
        "Saved:",
        OUTPUT
    )



if __name__ == "__main__":
    main()
