from pathlib import Path


BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"


def repair(text):

    rounds = 0

    while "â" in text or "Â" in text:

        old = text

        try:
            text = text.encode(
                "latin1"
            ).decode(
                "utf-8"
            )

        except Exception:
            break


        rounds += 1


        if text == old:
            break


        if rounds > 5:
            break


    return text



def main():

    for file in DATA.glob("*.json"):

        print("Repair:", file.name)


        raw = file.read_text(
            encoding="utf-8"
        )


        fixed = repair(raw)


        file.write_text(
            fixed,
            encoding="utf-8"
        )


    print("DONE")



if __name__ == "__main__":
    main()
