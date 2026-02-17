import uuid
from datetime import datetime

def create_base_record(file, input_type):
    return {
        "input_id": str(uuid.uuid4()),
        "filename": file.name if hasattr(file, "name") else "text_input",
        "input_type": input_type,
        "timestamp": datetime.utcnow().isoformat(),

        "raw_input_summary": None,
        "extracted_features": {},
        "detections": {},

        "inferred_disaster": {},
        "severity": None,

        "location": {
            "raw_location": None,
            "coordinates": None
        },

        "confidence_overall": None
    }
