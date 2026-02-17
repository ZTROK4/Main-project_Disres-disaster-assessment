from fastapi import APIRouter, HTTPException
from schemas.textgen import TextGenRequest
from core.textgen import generate_text_report

router = APIRouter(prefix="/textgen", tags=["TextGen"])


@router.post("/report")
def generate_report(req: TextGenRequest):
    try:
        result = generate_text_report(
            project=req.project,
            event_summary=req.eventSummary,
            inputs=req.inputs
        )

        return result

    except Exception as e:
        print("❌ TextGen error:", e)
        raise HTTPException(
            status_code=500,
            detail="Text generation failed"
        )
