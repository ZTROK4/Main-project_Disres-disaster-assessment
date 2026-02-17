from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    inputId: str
    projectId: str
    fileUrl: str
