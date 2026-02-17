import os
import whisper
import spacy
from ultralytics import YOLO
from transformers import pipeline

from config.settings import (
    DISASTER_LABELS,
    YOLO_MODEL_PATH,
    FFMPEG_PATH
)

# Ensure ffmpeg is on PATH (Windows)
os.environ["PATH"] = FFMPEG_PATH + ";" + os.environ.get("PATH", "")

# ---------------- YOLO ----------------
yolo_model = YOLO(YOLO_MODEL_PATH)

# ---------------- WHISPER ----------------
whisper_model = whisper.load_model("tiny")

# ---------------- NLP ----------------
nlp = spacy.load("en_core_web_sm")

# ---------------- ZERO-SHOT CLASSIFIER ----------------
classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"
)

# ---------------- LABELS ----------------
labels = DISASTER_LABELS
