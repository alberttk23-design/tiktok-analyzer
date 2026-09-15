import json

from pathlib import Path

from mlx_vlm import load, generate


BASE = Path(__file__).resolve().parent.parent


INPUT = BASE / "data" / "review_results.json"

OUTPUT = BASE / "data" / "creative_strategy.json"

PROMPT = BASE / "prompts" / "strategy_analysis.txt"


MODEL = "mlx-community/Qwen3-VL-4B-Instruct-4bit"



def extract_json(text):

    start = text.find("{")

    end = text.rfind("}")


    if start == -1 or end == -1:

        return {
            "error": text
        }


    return json.loads(
        text[start:end+1]
    )




def main():

    print("Loading model...")


    model, processor = load(MODEL)



    reviews = json.loads(

        INPUT.read_text(
            encoding="utf-8"
        )

    )


    prompt = PROMPT.read_text(
        encoding="utf-8"
    )



    content = json.dumps(

        reviews,

        ensure_ascii=False,

        indent=2

    )



    messages=[

    {

    "role":"user",

    "content":[

    {

    "type":"text",

    "text":
    prompt+
    "\n\nREVIEWS:\n"+
    content

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

        max_tokens=1200,

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



if __name__=="__main__":

    main()
