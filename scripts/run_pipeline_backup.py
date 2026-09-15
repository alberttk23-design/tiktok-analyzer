from pathlib import Path
import subprocess
import sys


BASE = Path(__file__).resolve().parent


STEPS = [
    "build_queue.py",
    "download_queue.py",
    "build_metadata.py",
    "analyze_batch_persistent.py",
    "transcribe_batch.py",
    "analyze_speech_batch.py",
    "build_dataset.py"
]


def run_step(script):

    print("\n" + "=" * 60)
    print("RUNNING:", script)
    print("=" * 60)


    result = subprocess.run(
        [
            sys.executable,
            str(BASE / script)
        ]
    )


    if result.returncode != 0:
        print("FAILED:", script)
        sys.exit(1)


    print("DONE:", script)



def main():

    print("TIKTOK ANALYSIS PIPELINE START")


    for step in STEPS:
        run_step(step)


    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)



if __name__ == "__main__":
    main()
