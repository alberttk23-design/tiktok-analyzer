import csv
from pathlib import Path


BASE = Path(__file__).resolve().parent.parent

INPUT = BASE / "data" / "metadata.csv"
OUTPUT = BASE / "data" / "dataset.csv"


def clean_key(key):
    return (
        key
        .replace("\\_", "_")
        .strip()
    )


def main():

    rows = []


    with open(
        INPUT,
        "r",
        encoding="utf-8",
        newline=""
    ) as f:

        reader = csv.reader(f)

        headers = next(reader)

        headers = [
            clean_key(x)
            for x in headers
        ]


        for line in reader:

            data = dict(
                zip(headers,line)
            )


            rows.append({

                "video_id": data.get("video_id",""),

                "url": data.get("url",""),

                "creator": data.get("creator",""),

                "caption": data.get("caption",""),

                "views": data.get("views",""),

                "likes": data.get("likes",""),

                "comments": data.get("comments",""),

                "hook": data.get("hook",""),

                "angle": data.get("angle",""),

                "claims": data.get("claims",""),

                "visual": data.get("visual","")

            })


    print("Videos found:",len(rows))


    with open(
        OUTPUT,
        "w",
        encoding="utf-8",
        newline=""
    ) as f:


        writer = csv.DictWriter(
            f,
            fieldnames=rows[0].keys(),
            quoting=csv.QUOTE_ALL
        )

        writer.writeheader()
        writer.writerows(rows)


    print("Created:",OUTPUT)
    print("Videos merged:",len(rows))


if __name__=="__main__":
    main()
