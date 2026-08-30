"""
Step 7: FastAPI Wrapper
-------------------------------------------------------------
Exposes predict_risk() from predict.py as a web API endpoint,
so the website (or anything else) can call it over HTTP.

Run:
    uvicorn api:app --reload

Then open in your browser:
    http://127.0.0.1:8000/docs
(This gives you an interactive page to test the API without needing
the website at all.)
"""

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from predict import predict_risk, model_is_ready, model_status
from prediction_log import update_outcome

app = FastAPI(title="Land Acquisition Delay Risk API")

# Allow the LandIntel frontend (Vite dev server, or any origin listed in
# CORS_ALLOWED_ORIGINS) to call this API directly from the browser.
# Defaults are permissive for local development; tighten CORS_ALLOWED_ORIGINS
# in production (comma-separated list of exact origins).
_default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
_env_origins = os.environ.get("CORS_ALLOWED_ORIGINS")
allowed_origins = [o.strip() for o in _env_origins.split(",")] if _env_origins else _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# This defines exactly what fields the website must send, and their types.
# FastAPI automatically validates incoming requests against this - if a
# field is missing or the wrong type, it returns a clear error automatically.
class ProjectFeatures(BaseModel):
    state: str
    district: str
    project_type: str
    land_type: str
    land_area_hectares: float
    affected_families: int
    approval_expected_days: int
    approval_actual_days: int
    compensation_status: str
    compensation_delay_days: int
    legal_disputes_count: int
    documentation_completeness_pct: float
    rehab_status: str
    rehab_progress_pct: int
    stakeholder_responsiveness_score: float
    notification_month: int
    notification_year: int


@app.get("/")
def home():
    return {"message": "Land Acquisition Delay Risk API is running"}


@app.get("/health")
def health():
    """
    Used by the LandIntel frontend to decide whether to call this backend
    or fall back to its built-in demo dataset. Always returns 200 as long
    as the process is up; `model_ready` tells the caller whether /predict
    will actually work yet.
    """
    status = model_status()
    return {"status": "ok", "model_ready": status["ready"], "detail": status["detail"]}


@app.post("/predict")
def predict(project: ProjectFeatures):
    if not model_is_ready():
        raise HTTPException(
            status_code=503,
            detail=model_status()["detail"]
            or "Model is not loaded. Run `python train_xgboost.py` to train it first.",
        )
    # Convert the validated request into a plain dict, same shape predict_risk() expects
    try:
        result = predict_risk(project.dict())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return result


# Called later, once the REAL outcome of a project is known (e.g. an admin
# marks it as delayed or completed on time on the website). This is what
# lets future retraining "remember" and learn from past predictions.
class OutcomeUpdate(BaseModel):
    prediction_id: str
    actual_delayed: bool


@app.post("/outcome")
def report_outcome(update: OutcomeUpdate):
    update_outcome(update.prediction_id, update.actual_delayed)
    return {"message": f"Outcome recorded for prediction {update.prediction_id}"}
