from pydantic import BaseModel
from typing import Any, Dict, List


class TextGenRequest(BaseModel):
    project: Dict[str, Any]
    eventSummary: Dict[str, Any]
    inputs: List[Dict[str, Any]]
