import re

def clean_text(text):
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    return text

def get_severity(text):
    t = text.lower()
    if any(w in t for w in ["dead", "collapse", "trapped", "explosion"]):
        return "Critical"
    elif any(w in t for w in ["injured", "fire", "help", "damage"]):
        return "High"
    return "Moderate"
