from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pipeline import run_research_pipeline
import os

app = FastAPI()

# Support both local development and production URLs
origins = [
    "http://localhost:5173",
    os.getenv("FRONTEND_URL", "*") 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TopicRequest(BaseModel):
    topic: str

@app.post("/research")
def research(body: TopicRequest):
    result = run_research_pipeline(body.topic)
    
    if "final_report" in result and hasattr(result["final_report"], "dict"):
        result["final_report"] = result["final_report"].dict()
    
    if "critique" in result and hasattr(result["critique"], "dict"):
        result["critique"] = result["critique"].dict()

    return result