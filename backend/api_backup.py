from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import subprocess
import sys
import csv

from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


app = FastAPI(
    title="TikTok Intelligence AI"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):

    keyword: str
    limit: int = 20



@app.get("/")
def home():

    return {
        "app": "TikTok Intelligence AI",
        "status": "running"
    }



@app.get("/status")
def status():

    return {
        "status": "ready"
    }



@app.post("/analyze")
def analyze(request: AnalyzeRequest):

    process = subprocess.Popen(

        [
            sys.executable,
            str(
                BASE_DIR /
                "scripts" /
                "run_pipeline.py"
            )
        ],

        cwd=str(BASE_DIR)

    )


    return {

        "message": "Pipeline started",

        "keyword": request.keyword,

        "process_id": process.pid

    }



@app.get("/results")
def results():

    file = (
        BASE_DIR /
        "data" /
        "dataset.csv"
    )


    if not file.exists():

        return {
            "total": 0,
            "videos": []
        }



    videos = []


    with open(
        file,
        encoding="utf-8"
    ) as f:


        reader = csv.DictReader(f)


        for row in reader:


            videos.append({

                "video_id":
                    row.get("video_id",""),

                "creator":
                    row.get("creator",""),

                "views":
                    row.get("views",""),

                "likes":
                    row.get("likes",""),

                "comments":
                    row.get("comments",""),

                "hook":
                    row.get(
                        "spoken_hook_message",
                        ""
                    ),

                "angle":
                    row.get(
                        "spoken_primary_angle",
                        ""
                    ),

                "claims":
                    row.get(
                        "spoken_claims",
                        ""
                    ),

                "visual":
                    row.get(
                        "visual_primary_message",
                        ""
                    )

            })



    return {

        "total": len(videos),

        "videos": videos

    }
