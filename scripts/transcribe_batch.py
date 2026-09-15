import json
import re
import time
from collections import Counter
from pathlib import Path

import mlx_whisper


PROJECT_DIR = Path(__file__).resolve().parent.parent

VIDEOS_DIR = PROJECT_DIR / "data" / "videos"
TRANSCRIPTS_DIR = PROJECT_DIR / "data" / "transcripts"

MODEL = "mlx-community/whisper-large-v3-turbo"

VIDEO_EXTENSIONS = {
    ".mp4",
    ".mov",
    ".m4v",
    ".webm"
}

TRANSCRIPTS_DIR.mkdir(
    parents=True,
    exist_ok=True
)


def normalize(text):

    text = (text or "").lower().strip()

    text = re.sub(
        r"[^a-z0-9\s]",
        "",
        text
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text



def check_quality(text, segments):

    clean_text = normalize(text)

    if not clean_text:
        return False, "empty_transcript"


    segment_texts = [
        normalize(seg.get("text"))
        for seg in segments
        if normalize(seg.get("text"))
    ]


    ratios = [
        seg.get("compression_ratio")
        for seg in segments
        if isinstance(
            seg.get("compression_ratio"),
            (int, float)
        )
    ]


    if ratios and max(ratios) > 4.0:
        return False, "extreme_compression_ratio"


    if len(segment_texts) >= 4:

        counts = Counter(segment_texts)

        _, count = counts.most_common(1)[0]

        if count >= 3 and count / len(segment_texts) >= 0.4:

            return False, "repeated_segment_loop"


    words = clean_text.split()


    if len(words) >= 20:

        unique_ratio = len(set(words)) / len(words)

        if unique_ratio < 0.2:

            return False, "extreme_word_repetition"


    return True, "ok"



def check_meaningful_speech(text):

    clean = normalize(text)

    words = clean.split()


    if not clean:
        return False, "no_speech_text"


    if len(words) < 5:
        return False, "too_little_speech"


    generic = {
        "thank you",
        "thanks",
        "okay",
        "ok",
        "yeah",
        "yes",
        "no",
        "wow",
        "bye",
        "hello",
        "hi",
    }


    if clean in generic:
        return False, "generic_speech_only"


    return True, "ok"



def main():

    videos = sorted(
        [
            p for p in VIDEOS_DIR.iterdir()
            if p.is_file()
            and p.suffix.lower() in VIDEO_EXTENSIONS
        ]
    )


    print(
        f"Found {len(videos)} videos\n"
    )


    valid_count = 0
    skipped_count = 0
    failed_count = 0


    for i, video in enumerate(videos, 1):

        output_file = (
            TRANSCRIPTS_DIR /
            f"{video.stem}.json"
        )


        print("=" * 60)

        print(
            f"[{i}/{len(videos)}] {video.name}"
        )


        # NEW: incremental check

        if output_file.exists():

            print(
                "SKIP - transcript đã tồn tại"
            )

            skipped_count += 1

            continue



        start = time.time()


        try:

            result = mlx_whisper.transcribe(
                str(video),
                path_or_hf_repo=MODEL,
                condition_on_previous_text=False,
                compression_ratio_threshold=2.4,
                logprob_threshold=-1.0,
                no_speech_threshold=0.6,
            )


            raw_text = (
                result.get("text")
                or ""
            ).strip()


            raw_segments = result.get(
                "segments",
                []
            )


            transcript_valid, quality_reason = check_quality(
                raw_text,
                raw_segments
            )


            meaningful_speech, speech_reason = check_meaningful_speech(
                raw_text
            )


            data = {

                "video_id": video.stem,

                "language": result.get(
                    "language"
                ),

                "transcript_valid":
                    transcript_valid,

                "quality_reason":
                    quality_reason,

                "meaningful_speech":
                    meaningful_speech,

                "speech_reason":
                    speech_reason,

                "text":
                    raw_text,

                "segments":
                    raw_segments
            }


            output_file.write_text(
                json.dumps(
                    data,
                    ensure_ascii=False,
                    indent=2
                ),
                encoding="utf-8"
            )


            elapsed = time.time() - start


            print(
                f"DONE - {elapsed:.1f}s"
            )

            valid_count += 1


        except Exception as e:

            print(
                "FAILED:",
                e
            )

            failed_count += 1



    print("\nTRANSCRIPTION COMPLETE")

    print(
        "Success:",
        valid_count
    )

    print(
        "Skipped:",
        skipped_count
    )

    print(
        "Failed:",
        failed_count
    )



if __name__ == "__main__":

    main()
