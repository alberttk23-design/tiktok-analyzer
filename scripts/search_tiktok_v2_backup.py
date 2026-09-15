from pathlib import Path
import csv
import sys
import time
from urllib.parse import quote

from playwright.sync_api import sync_playwright


BASE = Path(__file__).resolve().parent.parent

OUTPUT = BASE / "data" / "search_results.csv"

DEBUG_HTML = BASE / "data" / "tiktok_debug.html"

DEBUG_IMAGE = BASE / "data" / "tiktok_debug.png"



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



def collect_videos(keyword, limit):

    results = []

    search_url = (
        "https://www.tiktok.com/search?q="
        + quote(keyword)
    )


    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=False
        )


        context = browser.new_context(

            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 "
                "Chrome/120 Safari/537.36"
            ),

            viewport={
                "width": 1440,
                "height": 1000
            }

        )


        page = context.new_page()


        print(
            "Opening:",
            search_url
        )


        try:

            page.goto(
                search_url,
                timeout=90000,
                wait_until="domcontentloaded"
            )

        except Exception as e:

            print(
                "Goto warning:",
                e
            )


        print(
            "Waiting TikTok render..."
        )


        time.sleep(8)


        for i in range(5):

            print(
                "Scrolling:",
                i + 1
            )

            page.mouse.wheel(
                0,
                3000
            )

            time.sleep(3)



        # Debug files

        page.screenshot(
            path=str(DEBUG_IMAGE),
            full_page=True
        )


        html = page.content()

        DEBUG_HTML.write_text(
            html,
            encoding="utf-8"
        )


        links = page.locator(
            "a"
        )


        total = links.count()


        print(
            "Total links:",
            total
        )


        seen = set()


        for i in range(total):

            href = links.nth(i).get_attribute(
                "href"
            )


            if not href:
                continue


            if "/video/" not in href:
                continue


            if href.startswith("/"):

                href = (
                    "https://www.tiktok.com"
                    + href
                )


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



        browser.close()



    return results




def main():

    if len(sys.argv) < 3:

        print(
            'Usage: python search_tiktok.py "keyword" limit'
        )

        return


    keyword = sys.argv[1]

    limit = int(sys.argv[2])


    print()

    print(
        "Searching:",
        keyword
    )


    results = collect_videos(
        keyword,
        limit
    )


    print()

    print(
        "Found:",
        len(results)
    )


    save_results(
        results
    )


    print(
        "Saved:",
        OUTPUT
    )

    print(
        "Debug:",
        DEBUG_IMAGE,
        DEBUG_HTML
    )



if __name__ == "__main__":

    main()
