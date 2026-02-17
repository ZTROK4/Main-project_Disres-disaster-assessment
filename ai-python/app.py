from fastapi import FastAPI
from services.analysis_api import router as analysis_router
from services.event_api import router as event_router
from services.textgen_api import router as textgen_router

app = FastAPI(title="DisRes AI Service")

app.include_router(analysis_router)
app.include_router(event_router)
app.include_router(textgen_router)

@app.get("/health")
def health():
    return {"status": "AI service running"}
