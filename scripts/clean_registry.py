from pathlib import Path
import csv
import re


BASE = Path(__file__).resolve().parent.parent

INPUT = BASE / "data/video_registry.csv"
OUTPUT = BASE / "data/video_registry_clean.csv"


def extract_url(line):

    match = re.search(
        r"https://www\.tiktok\.com/[^\s,\)]+",
        line
    )

    if match:
        return match.group(0)

    match = re.search(
        r"https://tiktok\.com/[^\s,\)]+",
        line
    )

    if match:
        return match.group(0)

    return ""


def clean():

    result = {}

    with open(
        INPUT,
        encoding="utf-8"
    ) as f:

        lines = f.readlines()


    for line in lines[1:]:

        if not line.strip():
            continue


        video_match = re.search(
            r"\b\d{15,20}\b",
            line
        )


        if not video_match:
            continue


        video_id = video_match.group(0)


        url = extract_url(line)


        status = "downloaded"

        if "queued" in line:
            status = "queued"


        keyword = ""

        if "faux tree" in line:
            keyword = "faux tree"

        elif "faux olive tree" in line:
            keyword = "faux olive tree"


        result[video_id] = {

            "video_id": video_id,

            "url": url,

            "keyword": keyword,

            "status": status

        }


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

        writer.writerows(
            result.values()
        )


    print(
        "Cleaned:",
        len(result)
    )


if __name__ == "__main__":
    clean()
