from pathlib import Path
import csv


BASE = Path(__file__).resolve().parent.parent

INPUT = BASE / "data" / "metadata.csv"

OUTPUT = BASE / "data" / "video_scores.csv"



def safe_int(value):

    try:
        return int(value)

    except:
        return 0



def normalize(value, max_value):

    if max_value == 0:
        return 0

    return min(
        value / max_value,
        1
    )



def main():

    with open(
        INPUT,
        encoding="utf-8"
    ) as f:

        videos = list(
            csv.DictReader(f)
        )


    if not videos:

        print("No data")

        return



    # max values

    max_views = max(
        safe_int(v["views"])
        for v in videos
    )


    scores = []


    for video in videos:


        views = safe_int(
            video["views"]
        )

        likes = safe_int(
            video["likes"]
        )

        comments = safe_int(
            video["comments"]
        )


        engagement = 0


        if views > 0:

            engagement = (
                likes + comments * 2
            ) / views



        score = (

            normalize(
                views,
                max_views
            )
            * 40

            +

            min(
                engagement * 100,
                100
            )
            * 0.4

            +

            min(
                comments / 100,
                1
            )
            * 20

        )


        scores.append({

            "video_id":
                video["video_id"],

            "creator":
                video["creator"],

            "views":
                views,

            "likes":
                likes,

            "comments":
                comments,

            "viral_score":
                round(score,2),

            "url":
                video["url"]

        })



    scores.sort(
        key=lambda x:
        x["viral_score"],
        reverse=True
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
                "creator",
                "views",
                "likes",
                "comments",
                "viral_score",
                "url"
            ]
        )

        writer.writeheader()

        writer.writerows(scores)



    print(
        "Created:",
        OUTPUT
    )


    print()

    print(
        "TOP VIDEOS:"
    )


    for item in scores[:5]:

        print(
            item["viral_score"],
            item["video_id"],
            item["views"]
        )



if __name__ == "__main__":
    main()
