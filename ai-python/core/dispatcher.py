from analyzers.text_analyzer import analyze_text
from analyzers.image_analyzer import analyze_image
from analyzers.audio_analyzer import analyze_audio
from analyzers.video_analyzer import analyze_video

def process_file(file, models):
    name = file.name.lower()

    if name.endswith(".txt"):
        return analyze_text(
            file.read().decode(),
            file,
            models["classifier"],
            models["nlp"],
            models["labels"]
        )

    if name.endswith((".jpg", ".png")):
        path = f"temp_{file.name}"
        with open(path, "wb") as f:
            f.write(file.read())
        return analyze_image(path, file, models["yolo"])

    if name.endswith((".wav", ".mp3")):
        return analyze_audio(
            file,
            models["whisper"],
            models["classifier"],
            models["nlp"],
            models["labels"]
        )

    if name.endswith(".mp4"):
        return analyze_video(file, models["yolo"])

    return {"error": "Unsupported file type"}
