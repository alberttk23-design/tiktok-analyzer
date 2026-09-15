from pathlib import Path


FILES = [
    "creative_strategy.json",
    "review_results.json",
    "video_ideas.json",
    "final_video_ideas.json",
    "production_briefs.json"
]


BASE = Path(__file__).resolve().parent.parent

DATA = BASE / "data"



def fix_text(text):

    replacements = {

        "â€™": "’",

        "â€˜": "‘",

        "â€œ": "“",

        "â€": "”",

        "â€”": "—",

        "â€“": "–",

        "Â°": "°",

        "â€¦": "…",

    }


    for bad, good in replacements.items():

        text = text.replace(
            bad,
            good
        )


    return text




def main():

    for filename in FILES:

        path = DATA / filename


        if not path.exists():

            print(
                "SKIP:",
                filename
            )

            continue


        text = path.read_text(
            encoding="utf-8"
        )


        text = fix_text(text)


        path.write_text(
            text,
            encoding="utf-8"
        )


        print(
            "FIXED:",
            filename
        )



if __name__ == "__main__":

    main()
