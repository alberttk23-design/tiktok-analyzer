import json
import csv
from pathlib import Path

from mlx_vlm import load, generate

from review_schema import ReviewResult


BASE = Path(__file__).resolve().parent.parent


DATASET = BASE / "data" / "dataset.csv"

OUTPUT = BASE / "data" / "review_results.json"

PROMPT = BASE / "prompts" / "review_analysis.txt"


MODEL = "mlx-community/Qwen3-VL-4B-Instruct-4bit"



def extract_json(text):

    start = text.find("{")

    end = text.rfind("}")


    if start == -1 or end == -1:

        return {}


    return json.loads(
        text[start:end+1]
    )




def calculate_priority(score):

    if score >= 85:
        return "HIGH"

    if score >=70:
        return "MEDIUM"

    return "LOW"




def main():


    prompt = PROMPT.read_text(
        encoding="utf-8"
    )


    print("Loading model...")

    model, processor = load(MODEL)


    results=[]


    with open(
        DATASET,
        encoding="utf-8"
    ) as f:

        rows=list(
            csv.DictReader(f)
        )



    for row in rows:


        print(
            "Review:",
            row["creator"]
        )


        input_data=f"""

Creator:
{row.get('creator')}

Views:
{row.get('views')}

Hook:
{row.get('spoken_hook_message')}

Angle:
{row.get('spoken_primary_angle')}

Claims:
{row.get('spoken_claims')}

Visual:
{row.get('visual_primary_message')}

"""


        messages=[

        {

        "role":"user",

        "content":[

        {

        "type":"text",

        "text":
        prompt+
        "\nVIDEO DATA:\n"+
        input_data

        }

        ]

        }

        ]


        formatted=processor.apply_chat_template(

            messages,

            tokenize=False,

            add_generation_prompt=True

        )


        output=generate(

            model=model,

            processor=processor,

            prompt=formatted,

            max_tokens=900,

            temperature=0

        )


        try:

            raw=extract_json(
                output.text
            )


            review=ReviewResult(
                video_id=row.get("video_id",""),
                creator=row.get("creator",""),
                **raw
            )


            data=review.model_dump()


            data["scores"]["overall"]=round(

                sum(
                    data["scores"].values()
                )/5

            )


            data["priority"]=calculate_priority(

                data["scores"]["overall"]

            )


        except Exception as e:


            data={

                "creator":
                row.get("creator"),

                "error":
                str(e)

            }



        results.append(data)



    OUTPUT.write_text(

        json.dumps(
            results,
            ensure_ascii=False,
            indent=2
        ),

        encoding="utf-8"

    )


    print()

    print(
        "DONE:",
        OUTPUT
    )



if __name__=="__main__":

    main()
