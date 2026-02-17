import requests
import tempfile
import os
from core.base_record import create_base_record
from utils.text_utils import clean_text, get_severity
from utils.location_utils import extract_location_from_text

def analyze_audio_from_url(file_url, whisper_model, classifier, nlp, labels):
    record = create_base_record(file_url, "audio")

    try:
        response = requests.get(file_url, stream=True, timeout=30)
        response.raise_for_status()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            for chunk in response.iter_content(8192):
                tmp.write(chunk)
            raw_path = tmp.name

        fixed_path = raw_path.replace(".wav", "_fixed.wav")

        # Force Whisper-compatible PCM
        exit_code = os.system(
            f'ffmpeg -y -i "{raw_path}" -ar 16000 -ac 1 -c:a pcm_s16le "{fixed_path}"'
        )
        if exit_code != 0 or not os.path.exists(fixed_path):
            record["raw_input_summary"] = "Audio normalization failed"
            return record

        text = whisper_model.transcribe(
            fixed_path,
            fp16=False
        )["text"]

        if not text.strip():
            record["raw_input_summary"] = "No speech detected"
            return record

        text = clean_text(text)
        doc = nlp(text)
        result = classifier(text, labels)

        record["raw_input_summary"] = text[:300]
        record["extracted_features"]["entities"] = [
            {"text": e.text, "label": e.label_} for e in doc.ents
        ]
        record["inferred_disaster"] = {
            "type": result["labels"][0],
            "scores": dict(zip(result["labels"], result["scores"]))
        }
        record["severity"] = get_severity(text)
        record["location"] = extract_location_from_text(doc)
        record["confidence_overall"] = float(result["scores"][0])

        return record

    except Exception as e:
        record["raw_input_summary"] = f"Audio analysis error: {str(e)}"
        return record
