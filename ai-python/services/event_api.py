from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

from core.event_inference import infer_disaster_event

router = APIRouter()


class EventInferRequest(BaseModel):
    projectId: str
    inputs: List[Dict[str, Any]]


@router.post("/events/infer")
def infer_event(req: EventInferRequest):
    if not req.inputs:
        raise HTTPException(
            status_code=400,
            detail="No analyzed inputs provided"
        )

    result = infer_disaster_event(
        project_id=req.projectId,
        inputs=req.inputs
    )

    return result
