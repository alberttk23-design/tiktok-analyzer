import json
import time
from pathlib import Path

from mlx_vlm import load, generate


PROJECT_DIR = Path(__file__).resolve().parent.parent

TRANSCRIPTS_DIR = PROJECT_DIR / "data" / "transcripts"

OUTPUT_DIR = PROJECT_DIR / "data" / "speech_analysis"

PROMPT_FILE = PROJECT_DIR / "prompts" / "speech_analysis.txt"

MODEL = "mlx-community/Qwen3-VL-4B-Instruct-4bit"


OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


def empty_result():

    return {
        "spoken_hook": {
            "type": "none",
            "message": None
        },

        "spoken_claims": [],

        "spoken_primary_angle": None,

        "spoken_persuasion": None,

        "comparison": {
            "present": False,
            "target": None
        },

        "spoken_cta": {
            "present": False,
            "type": None,
            "message": None
        }
    }



def extract_json(text):

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise ValueError(
            "Không tìm thấy JSON"
        )

    return json.loads(
        text[start:end + 1]
    )



def get_hook_transcript(segments):

    result = []

    for seg in segments:

        start = seg.get("start")

        text = (
            seg.get("text")
            or ""
        ).strip()


        if start is None:
            continue


        if start < 3 and text:

            result.append(text)


    return " ".join(result)



def main():

    files = sorted(
        TRANSCRIPTS_DIR.glob("*.json")
    )


    if not files:

        print(
            "Không có transcript"
        )

        return


    base_prompt = PROMPT_FILE.read_text(
        encoding="utf-8"
    )


    useful_files = []

    for f in files:

        data = json.loads(
            f.read_text(
                encoding="utf-8"
            )
        )


        if (
            data.get("transcript_valid")
            and data.get("meaningful_speech")
            and data.get("analysis_text")
        ):

            useful_files.append(f)


    print(
        f"Found transcripts: {len(files)}"
    )

    print(
        f"Meaningful speech: {len(useful_files)}"
    )


    model = None
    processor = None


    if useful_files:

        print(
            "Loading Qwen ONCE..."
        )

        start = time.time()

        model, processor = load(MODEL)

        print(
            f"Model loaded: {time.time()-start:.1f}s"
        )


    success = 0
    skipped = 0
    failed = 0


    for i, f in enumerate(files, 1):

        transcript = json.loads(
            f.read_text(
                encoding="utf-8"
            )
        )


        video_id = (
            transcript.get("video_id")
            or f.stem
        )


        output_file = (
            OUTPUT_DIR /
            f"{video_id}.json"
        )


        print(
            "\n" + "=" * 60
        )

        print(
            f"[{i}/{len(files)}] {video_id}"
        )


        # IMPORTANT:
        # Skip if already analyzed

        if output_file.exists():

            print(
                "SKIP - speech analysis exists"
            )

            skipped += 1

            continue



        meaningful = (

            transcript.get(
                "transcript_valid"
            )

            and transcript.get(
                "meaningful_speech"
            )

            and transcript.get(
                "analysis_text"
            )
        )


        if not meaningful:

            output_file.write_text(

                json.dumps(
                    empty_result(),
                    ensure_ascii=False,
                    indent=2
                ),

                encoding="utf-8"
            )


            print(
                "SKIP - no meaningful speech"
            )


            skipped += 1

            continue



        full_transcript = (
            transcript.get(
                "analysis_text",
                ""
            )
            .strip()
        )


        hook_transcript = get_hook_transcript(
            transcript.get(
                "segments",
                []
            )
        )


        full_prompt = f"""

{base_prompt}


HOOK TRANSCRIPT:

{hook_transcript}


FULL TRANSCRIPT:

{full_transcript}


Return JSON only.

"""


        messages = [

            {

                "role": "user",

                "content": [

                    {

                        "type": "text",

                        "text": full_prompt

                    }

                ]

            }

        ]


        formatted_prompt = processor.apply_chat_template(

            messages,

            tokenize=False,

            add_generation_prompt=True

        )


        start = time.time()


        try:

            result = generate(

                model=model,

                processor=processor,

                prompt=formatted_prompt,

                max_tokens=700,

                temperature=0.0,

                verbose=False

            )


            data = extract_json(
                result.text
            )


            output_file.write_text(

                json.dumps(
                    data,
                    ensure_ascii=False,
                    indent=2
                ),

                encoding="utf-8"

            )


            print(
                f"DONE - {time.time()-start:.1f}s"
            )


            print(
                json.dumps(
                    data,
                    ensure_ascii=False,
                    indent=2
                )
            )


            success += 1



        except Exception as e:

            print(
                "FAILED:",
                e
            )

            failed += 1



    print("\n")
    print(
        "SPEECH ANALYSIS COMPLETE"
    )

    print(
        "Success:",
        success
    )

    print(
        "Skipped:",
        skipped
    )

    print(
        "Failed:",
        failed
    )



if __name__ == "__main__":

    main()
