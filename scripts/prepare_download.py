from pathlib import Path
import csv


BASE = Path(__file__).resolve().parent.parent


SEARCH_FILE = BASE / "data" / "search_results.csv"

REGISTRY_FILE = BASE / "data" / "video_registry.csv"

OUTPUT_FILE = BASE / "data" / "download_queue.csv"



def load_existing():

    existing = set()

    if REGISTRY_FILE.exists():

        with open(
            REGISTRY_FILE,
            encoding="utf-8"
        ) as f:

            for row in csv.DictReader(f):

                existing.add(
                    row["video_id"]
                )

    return existing



def main():

    existing = load_existing()


    if not SEARCH_FILE.exists():

        print(
            "No search results"
        )

        return


    queue = []

    seen = set()


    with open(
        SEARCH_FILE,
        encoding="utf-8"
    ) as f:


        for row in csv.DictReader(f):

            video_id = row["video_id"]


            if video_id in seen:

                print(
                    "DUPLICATE:",
                    video_id
                )

                continue


            seen.add(video_id)


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

                "video_id":
                    video_id,

                "url":
                    row["url"],

                "keyword":
                    row["keyword"],

                "status":
                    "queued"

            })


    with open(
        OUTPUT_FILE,
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
        "Download queue created:",
        len(queue)
    )



if __name__ == "__main__":

    main()
