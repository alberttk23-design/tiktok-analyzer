from pydantic import BaseModel
from typing import List


class Score(BaseModel):

    viral:int = 0
    hook:int = 0
    conversion:int = 0
    replication:int = 0
    overall:int = 0



class ReviewResult(BaseModel):

    video_id:str = ""

    creator:str = ""

    scores:Score = Score()

    review:str = ""

    strengths:List[str] = []

    weaknesses:List[str] = []

    buyer_psychology:str = ""

    winning_formula:List[str] = []

    brand_application:List[str] = []

    priority:str = "MEDIUM"
