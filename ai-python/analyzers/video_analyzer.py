import cv2
import requests
import tempfile
from core.base_record import create_base_record

def analyze_video_from_url(file_url: str, yolo_model):
    record = create_base_record(file_url, "video")

    try:
        response = requests.get(file_url, stream=True, timeout=30)
        response.raise_for_status()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            for chunk in response.iter_content(8192):
                tmp.write(chunk)
            temp_path = tmp.name

        cap = cv2.VideoCapture(temp_path)
        if not cap.isOpened():
            record["raw_input_summary"] = "Video could not be opened"
            return record

        detections = []
        frames = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame is None:
                continue

            if frames % 10 == 0:
                results = yolo_model(frame, conf=0.25)
                for r in results:
                    for box in r.boxes:
                        detections.append(
                            yolo_model.names[int(box.cls[0])]
                        )
            frames += 1

        cap.release()

        unique_objects = list(set(detections))

        record["detections"]["objects"] = unique_objects
        record["raw_input_summary"] = f"{frames} frames analyzed"
        record["inferred_disaster"]["type"] = (
            "fire disaster" if "fire" in unique_objects else "unknown"
        )
        record["severity"] = "High" if len(detections) > 10 else "Moderate"
        record["confidence_overall"] = round(min(1.0, len(detections) / 20), 2)

        return record

    except Exception as e:
        record["raw_input_summary"] = f"Video analysis error: {str(e)}"
        return record
