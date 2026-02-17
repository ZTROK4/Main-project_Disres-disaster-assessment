import requests
import json
from utils.serializer import make_json_safe

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.1:8b"


def _run_llm(prompt: str) -> str:
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False
        },
        timeout=15*60*1000
    )

    response.raise_for_status()
    return response.json().get("response", "").strip()


def generate_text_report(project, event_summary, inputs):
    safe_payload = {
        "project": make_json_safe(project),
        "event": make_json_safe(event_summary),
        "inputs": make_json_safe(inputs)
    }

    base_rules = """
You are an AI disaster response decision-support system.

Rules:
- Use ONLY the provided data
- Do NOT invent facts, locations, casualties, or resources
- If information is missing, explicitly say "Information not available"
- Be professional and concise
- No emojis
- No markdown tables
"""

    sections = {
        "situation": "Situation Understanding",
        "status": "Current Disaster Status",
        "immediateActions": "Step-by-Step Immediate Action Plan (next 6–12 hours)",
        "mitigation": "Step-by-Step Mitigation Measures",
        "coordination": "Resource and Agent Coordination",
        "contacts": "Emergency Contacts & Communication",
        "riskAssessment": "Risk Assessment",
        "summary": "Final Summary for Authorities"
    }

    results = {}
    full_text = []

    for key, title in sections.items():
        prompt = f"""
{base_rules}

Generate ONLY the section titled:
\"{title}\"

DISASTER DATA:
{json.dumps(safe_payload, indent=2)}
"""
        section_text = _run_llm(prompt)
        results[key] = section_text
        full_text.append(f"{title}\n{section_text}")

    return {
        "fullText": "\n\n".join(full_text),
        "sections": results
    }
