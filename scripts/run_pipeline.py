from pathlib import Path
import subprocess
import sys
import time


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

    print("\n")
    print("=" * 70)
    print("RUNNING:", script)
    print("=" * 70)

    start = time.time()

    result = subprocess.run(
        [
            sys.executable,
            str(BASE / script)
        ]
    )

    elapsed = time.time() - start

    if result.returncode != 0:

        print("FAILED:", script)
        sys.exit(1)


    print(
        f"DONE: {script} ({elapsed:.1f}s)"
    )

    return elapsed



def main():

    total_start = time.time()

    report = []


    print("=" * 70)
    print("TIKTOK ANALYSIS PIPELINE START")
    print("=" * 70)


    for step in STEPS:

        elapsed = run_step(step)

        report.append(
            (
                step,
                elapsed
            )
        )


    total_time = time.time() - total_start


    print("\n")
    print("=" * 70)
    print("PIPELINE REPORT")
    print("=" * 70)


    for name, seconds in report:

        print(
            f"{name:<35} {seconds:.1f}s"
        )


    print("-" * 70)

    print(
        f"TOTAL TIME: {total_time:.1f}s"
    )

    print("=" * 70)
    print("PIPELINE COMPLETE")
    print("=" * 70)



if __name__ == "__main__":

    main()
