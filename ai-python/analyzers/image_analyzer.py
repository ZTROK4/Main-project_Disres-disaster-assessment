import cv2
import requests
import tempfile
import os
from core.base_record import create_base_record

def analyze_image_from_url(file_url: str, yolo_model):
    record = create_base_record(file_url, "image")

    try:
        # Download image
        response = requests.get(file_url, timeout=20)
        
        response = requests.get(file_url, stream=True)

        print("STATUS:", response.status_code)
        print("HEADERS:", response.headers)
        print("CONTENT TYPE:", response.headers.get("Content-Type"))
        print("CONTENT LENGTH:", response.headers.get("Content-Length"))
        print("FINAL URL:", response.url)
        print("STATUS:", response.status_code)
        print("HEADERS:", response.headers)
        print("FIRST 200 BYTES:", response.content[:200])


        response.raise_for_status()

        if len(response.content) < 1024:
            record["raw_input_summary"] = "Image download failed or empty"
            return record

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(response.content)
            temp_path = tmp.name

        # Read image safely
        img = cv2.imread(temp_path)
        if img is None:
            record["raw_input_summary"] = "Image could not be decoded"
            return record

        results = yolo_model(img, conf=0.25)
        objects = []

        for r in results:
            for box in r.boxes:
                objects.append({
                    "label": yolo_model.names[int(box.cls[0])],
                    "confidence": round(float(box.conf[0]), 3)
                })

        record["detections"]["objects"] = objects
        record["raw_input_summary"] = f"{len(objects)} objects detected"
        record["confidence_overall"] = (
            sum(o["confidence"] for o in objects) / len(objects)
            if objects else 0.0
        )

        labels = {o["label"] for o in objects}
        record["inferred_disaster"]["type"] = (
            "fire disaster" if "fire" in labels else "unknown"
        )
        record["severity"] = "High" if "fire" in labels else "Moderate"

        return record

    except Exception as e:
        record["raw_input_summary"] = f"Image analysis error: {str(e)}"
        return record
