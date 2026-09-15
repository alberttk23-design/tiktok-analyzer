from pathlib import Path


BASE = Path(__file__).resolve().parent.parent

DATA = BASE / "data"



def clean(text):

    fixes = {

        "â€™": "’",
        "â€˜": "‘",
        "â€œ": "“",
        "â€\x9d": "”",

        "â€”": "—",
        "â€“": "–",

        "Â°": "°",

        "â€¦": "…",

        "â€¢": "•",

    }


    for old, new in fixes.items():

        text = text.replace(old, new)


    return text




def main():

    files = list(DATA.glob("*.json"))


    for file in files:

        print("Cleaning:", file.name)


        text = file.read_text(
            encoding="utf-8"
        )


        text = clean(text)


        file.write_text(
            text,
            encoding="utf-8"
        )


    print()

    print("DONE")




if __name__ == "__main__":

    main()
