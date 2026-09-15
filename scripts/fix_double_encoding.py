from pathlib import Path


BASE = Path(__file__).resolve().parent.parent

DATA = BASE / "data"



def fix_encoding(text):

    try:

        return text.encode(
            "latin1"
        ).decode(
            "utf-8"
        )

    except Exception:

        return text




def main():

    for file in DATA.glob("*.json"):

        print(
            "Fixing:",
            file.name
        )


        text = file.read_text(
            encoding="utf-8"
        )


        fixed = fix_encoding(text)


        file.write_text(
            fixed,
            encoding="utf-8"
        )


    print()

    print("DONE")



if __name__ == "__main__":

    main()
