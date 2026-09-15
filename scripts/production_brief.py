import json

from pathlib import Path

from mlx_vlm import load, generate


BASE = Path(__file__).resolve().parent.parent


INPUT = BASE / "data" / "final_video_ideas.json"

PRODUCT = BASE / "data" / "product_profile.json"

OUTPUT = BASE / "data" / "production_briefs.json"

PROMPT = BASE / "prompts" / "production_brief.txt"


MODEL = "mlx-community/Qwen3-VL-4B-Instruct-4bit"



def extract_json(text):

    start = text.find("{")

    end = text.rfind("}")


    if start == -1 or end == -1:

        return {
            "error": "No JSON found",
            "raw": text
        }


    raw = text[start:end+1]


    try:

        return json.loads(raw)


    except Exception:


        fixed = raw.replace(
            ",\n}",
            "\n}"
        )

        fixed = fixed.replace(
            ",\n]",
            "\n]"
        )


        try:

            return json.loads(fixed)

        except Exception:

            return {
                "error": "Invalid JSON",
                "raw": text
            }




def main():

    print("Loading model...")


    model, processor = load(MODEL)



    ideas = json.loads(

        INPUT.read_text(
            encoding="utf-8"
        )

    )


    product = json.loads(

        PRODUCT.read_text(
            encoding="utf-8"
        )

    )


    prompt = PROMPT.read_text(
        encoding="utf-8"
    )



    input_data = """

PRODUCT:

%s


APPROVED CREATIVE IDEAS:

%s

""" % (

        json.dumps(
            product,
            ensure_ascii=False,
            indent=2
        ),

        json.dumps(
            ideas,
            ensure_ascii=False,
            indent=2
        )

    )



    messages = [

        {

            "role": "user",

            "content": [

                {

                    "type": "text",

                    "text":
                    prompt +
                    "\n\n" +
                    input_data

                }

            ]

        }

    ]



    formatted = processor.apply_chat_template(

        messages,

        tokenize=False,

        add_generation_prompt=True

    )



    result = generate(

        model=model,

        processor=processor,

        prompt=formatted,

        max_tokens=2000,

        temperature=0

    )


    data = extract_json(
        result.text
    )


    OUTPUT.write_text(

        json.dumps(

            data,

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



if __name__ == "__main__":

    main()
