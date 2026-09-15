from pathlib import Path
import subprocess
import time
import sys


BASE = Path(__file__).resolve().parent


STEPS = [

    "strategy_engine.py",

    "creative_generator.py",

    "creative_review.py",

    "production_brief.py"

]


def run_step(script):

    print("\n" + "=" * 70)

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

        print()

        print("FAILED:", script)

        sys.exit(1)


    print()

    print(

        "DONE:",

        script,

        f"({elapsed:.1f}s)"

    )




def main():

    print()

    print("=" * 70)

    print("AI CREATIVE PIPELINE START")

    print("=" * 70)



    total_start = time.time()


    for step in STEPS:

        run_step(step)



    total = time.time() - total_start


    print()

    print("=" * 70)

    print("PIPELINE COMPLETE")

    print("=" * 70)

    print()

    print(

        f"TOTAL TIME: {total:.1f}s"

    )





if __name__ == "__main__":

    main()
