from collections import Counter
from datetime import datetime


def infer_disaster_event(project_id: str, inputs: list):
    disasters = []
    severities = []
    locations = []

    for i in inputs:
        # -------- Disaster Type --------
        inferred = i.get("inferred_disaster", {})
        disaster = inferred.get("type")

        if disaster and disaster != "unknown":
            disaster = disaster.replace(" disaster", "").strip().lower()
            disasters.append(disaster)

        # -------- Severity --------
        sev = i.get("severity", "Low")
        if isinstance(sev, str):
            sev = (
                sev.replace("🚨", "")
                .replace("⚠️", "")
                .replace("🟡", "")
                .strip()
            )
        severities.append(sev)

        # -------- Location --------
        loc = i.get("location", {}).get("coordinates")
        if loc and "lat" in loc and "lon" in loc:
            locations.append(loc)

    # -------- Final Disaster --------
    final_disaster = (
        Counter(disasters).most_common(1)[0][0]
        if disasters else "unknown"
    )

    # -------- Final Severity --------
    severity_rank = {
        "Low": 1,
        "Moderate": 2,
        "High": 3,
        "Critical": 4
    }

    final_severity = max(
        severities,
        key=lambda s: severity_rank.get(s, 1),
        default="Low"
    )

    # -------- Average Location --------
    avg_location = None
    if locations:
        avg_location = {
            "lat": sum(l["lat"] for l in locations) / len(locations),
            "lon": sum(l["lon"] for l in locations) / len(locations)
        }

    return {
        "projectId": project_id,
        "finalDisaster": final_disaster,
        "severity": final_severity,
        "location": avg_location,
        "confidence": round(len(disasters) / max(len(inputs), 1), 2),
        "inputsCount": len(inputs),
        "updatedAt": datetime.utcnow().isoformat()
    }
