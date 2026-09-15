from pathlib import Path
import csv
import sys
import time
from urllib.parse import quote

from playwright.sync_api import sync_playwright


BASE = Path(__file__).resolve().parent.parent

OUTPUT = BASE / "data" / "search_results.csv"

PROFILE = BASE / "data" / "browser_profile"


def save_results(results):

    OUTPUT.parent.mkdir(
        exist_ok=True
    )

    with open(
        OUTPUT,
        "w",
        newline="",
        encoding="utf-8"
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=[
                "video_id",
                "url",
                "keyword"
            ]
        )

        writer.writeheader()
        writer.writerows(results)



def collect(keyword, limit):

    results = []

    url = (
        "https://www.tiktok.com/search?q="
        + quote(keyword)
    )


    with sync_playwright() as p:

        context = p.chromium.launch_persistent_context(

            user_data_dir=str(PROFILE),

            headless=False,

            viewport={
                "width": 1440,
                "height": 1000
            },

            user_agent=
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120 Safari/537.36"

        )


        page = context.new_page()


        print("Opening:", url)


        page.goto(
            url,
            timeout=90000
        )


        time.sleep(5)


        # reload giống người dùng F5

        print("Reload page...")

        page.reload(
            timeout=90000
        )


        time.sleep(8)


        for i in range(8):

            print(
                "Scroll",
                i + 1
            )

            page.mouse.wheel(
                0,
                4000
            )

            time.sleep(3)



        links = page.locator(
            "a[href*='/video/']"
        )


        count = links.count()


        print(
            "Video links:",
            count
        )


        seen = set()


        for i in range(count):

            href = links.nth(i).get_attribute(
                "href"
            )


            if not href:
                continue


            video_id = (
                href.split("/video/")[-1]
                .split("?")[0]
                .strip("/")
            )


            if not video_id:
                continue


            if video_id in seen:
                continue


            seen.add(video_id)


            if href.startswith("/"):

                href = (
                    "https://www.tiktok.com"
                    + href
                )


            results.append({

                "video_id":
                    video_id,

                "url":
                    href,

                "keyword":
                    keyword

            })


            if len(results) >= limit:

                break



        context.close()


    return results



def main():

    if len(sys.argv) < 3:

        print(
            'python search_tiktok.py "keyword" limit'
        )

        return


    keyword = sys.argv[1]

    limit = int(sys.argv[2])


    print(
        "Searching:",
        keyword
    )


    results = collect(
        keyword,
        limit
    )


    print(
        "Found:",
        len(results)
    )


    save_results(results)


    print(
        "Saved:",
        OUTPUT
    )



if __name__ == "__main__":

    main()
