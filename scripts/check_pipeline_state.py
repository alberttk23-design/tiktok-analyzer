from pathlib import Path


BASE = Path(__file__).resolve().parent.parent

VIDEO_DIR = BASE / "data/videos"
RESULT_DIR = BASE / "data/results"
TRANSCRIPT_DIR = BASE / "data/transcripts"
SPEECH_DIR = BASE / "data/speech_analysis"


def check(video_id):

    video = VIDEO_DIR / f"{video_id}.mp4"
    visual = RESULT_DIR / f"{video_id}.json"
    transcript = TRANSCRIPT_DIR / f"{video_id}.json"
    speech = SPEECH_DIR / f"{video_id}.json"


    print("\nVIDEO:", video_id)

    print(
        "download:",
        "✓" if video.exists() else "✗"
    )

    print(
        "visual:",
        "✓" if visual.exists() else "✗"
    )

    print(
        "transcript:",
        "✓" if transcript.exists() else "✗"
    )

    print(
        "speech:",
        "✓" if speech.exists() else "✗"
    )


    if (
        video.exists()
        and visual.exists()
        and transcript.exists()
        and speech.exists()
    ):

        print(
            "STATUS: COMPLETE"
        )

    else:

        print(
            "STATUS: INCOMPLETE"
        )



def main():

    videos = list(
        VIDEO_DIR.glob("*.mp4")
    )


    print(
        "VIDEOS:",
        len(videos)
    )


    for video in videos:

        check(
            video.stem
        )


if __name__ == "__main__":

    main()
