from fastapi import APIRouter
from schemas.analyze import AnalyzeRequest

# Load models (already initialized once)
from config.models import (
    yolo_model,
    whisper_model,
    classifier,
    nlp,
    labels
)

# Import analyzers
from analyzers.image_analyzer import analyze_image_from_url
from analyzers.video_analyzer import analyze_video_from_url
from analyzers.text_analyzer import analyze_text_from_url
from analyzers.audio_analyzer import analyze_audio_from_url

router = APIRouter()


# ================= IMAGE ANALYZER =================
@router.post("/analyze/image")
def analyze_image(req: AnalyzeRequest):
    result = analyze_image_from_url(
        req.fileUrl,
        yolo_model
    )

    result["input_id"] = req.inputId
    result["project_id"] = req.projectId
    result["source"] = "image"

    return result


# ================= VIDEO ANALYZER =================
@router.post("/analyze/video")
def analyze_video(req: AnalyzeRequest):
    result = analyze_video_from_url(
        req.fileUrl,
        yolo_model
    )

    result["input_id"] = req.inputId
    result["project_id"] = req.projectId
    result["source"] = "video"

    return result


# ================= TEXT ANALYZER =================
@router.post("/analyze/text")
def analyze_text(req: AnalyzeRequest):
    result = analyze_text_from_url(
        req.fileUrl,
        classifier,
        nlp,
        labels
    )

    result["input_id"] = req.inputId
    result["project_id"] = req.projectId
    result["source"] = "text"

    return result


# ================= AUDIO ANALYZER =================
@router.post("/analyze/audio")
def analyze_audio(req: AnalyzeRequest):
    result = analyze_audio_from_url(
        req.fileUrl,
        whisper_model,
        classifier,
        nlp,
        labels
    )

    result["input_id"] = req.inputId
    result["project_id"] = req.projectId
    result["source"] = "audio"

    return result
