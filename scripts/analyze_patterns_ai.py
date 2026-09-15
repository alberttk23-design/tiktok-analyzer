from pathlib import Path
import json
from collections import Counter


BASE = Path(__file__).resolve().parent.parent

SCORES = BASE / "data" / "video_scores.csv"

SPEECH_DIR = BASE / "data" / "speech_analysis"

OUTPUT = BASE / "data" / "pattern_report.json"



def load_json_files():

    results = []

    for file in SPEECH_DIR.glob("*.json"):

        try:

            data = json.loads(
                file.read_text(
                    encoding="utf-8"
                )
            )

            results.append(data)

        except:

            pass

    return results



def count_values(items, key):

    counter = Counter()

    for item in items:

        value = item.get(key)

        if value:

            counter[value] += 1

    return counter



def main():

    speech = load_json_files()


    hooks = []

    angles = []

    persuasion = []


    for item in speech:


        hook = item.get(
            "spoken_hook",
            {}
        )


        if hook.get("type"):

            hooks.append(
                hook["type"]
            )


        if item.get(
            "spoken_primary_angle"
        ):

            angles.append(
                item["spoken_primary_angle"]
            )


        if item.get(
            "spoken_persuasion"
        ):

            persuasion.append(
                item["spoken_persuasion"]
            )



    report = {


        "dataset_size":
            len(speech),


        "hook_patterns":
            count_values(
                [
                    {
                        "type":x
                    }
                    for x in hooks
                ],
                "type"
            ),


        "winning_angles":
            Counter(
                angles
            ),


        "persuasion_patterns":
            Counter(
                persuasion
            )


    }


    # convert Counter

    for k,v in report.items():

        if isinstance(v, Counter):

            report[k] = dict(
                v.most_common()
            )



    OUTPUT.write_text(

        json.dumps(
            report,
            indent=2,
            ensure_ascii=False
        ),

        encoding="utf-8"

    )


    print(
        "Pattern report created:"
    )

    print(
        OUTPUT
    )


if __name__ == "__main__":

    main()
