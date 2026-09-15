from pathlib import Path
import json
import csv


BASE = Path(__file__).resolve().parent.parent

VIDEO_DIR = BASE / "data/videos"
RESULT_DIR = BASE / "data/results"
SPEECH_DIR = BASE / "data/speech_analysis"


def exists(path):
    return path.exists()


def main():

    videos = list(VIDEO_DIR.glob("*.mp4"))

    print("=" * 60)
    print("DATASET VALIDATION")
    print("=" * 60)

    ready = 0
    failed = 0

    for video in videos:

        vid = video.stem

        print("\n" + "-" * 60)
        print(vid)

        status = True


        # video
        if exists(video):
            print("✓ video")
        else:
            print("✗ video")
            status = False


        # metadata
        info = VIDEO_DIR / f"{vid}.info.json"

        if exists(info):

            try:
                data = json.loads(
                    info.read_text(
                        encoding="utf-8"
                    )
                )

                if data.get("view_count") and data.get("uploader"):
                    print("✓ metadata")
                else:
                    print("✗ metadata incomplete")
                    status = False

            except:
                print("✗ metadata broken")
                status = False

        else:
            print("✗ metadata missing")
            status = False



        # visual

        visual = RESULT_DIR / f"{vid}.json"

        if exists(visual):
            print("✓ visual analysis")
        else:
            print("✗ visual analysis missing")
            status = False



        # speech

        speech = SPEECH_DIR / f"{vid}.json"

        if exists(speech):
            print("✓ speech analysis")
        else:
            print("✗ speech analysis missing")
            status = False



        if status:

            print("STATUS: READY")
            ready += 1

        else:

            print("STATUS: FAILED")
            failed += 1



    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    print("READY :", ready)
    print("FAILED:", failed)



if __name__ == "__main__":
    main()
