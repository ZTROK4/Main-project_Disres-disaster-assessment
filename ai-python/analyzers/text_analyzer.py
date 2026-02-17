import requests
from core.base_record import create_base_record
from utils.text_utils import clean_text, get_severity
from utils.location_utils import extract_location_from_text

def analyze_text_from_url(file_url, classifier, nlp, labels):
    record = create_base_record(file_url, "text")

    try:
        response = requests.get(file_url, timeout=15)
        response.raise_for_status()

        text = clean_text(response.text)
        if not text.strip():
            record["raw_input_summary"] = "Empty text file"
            return record

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
        record["raw_input_summary"] = f"Text analysis error: {str(e)}"
        return record
