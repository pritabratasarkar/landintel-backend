"""
Step 7: FastAPI Wrapper
-------------------------------------------------------------
Exposes predict_risk() from predict.py as a web API endpoint, AND serves
the project-scoped GET endpoints the frontend's services/api.ts actually
calls (GET /projects, GET /projects/{id}, GET /projects/{id}/risk).

Why both exist:
- POST /predict is the raw, stateless "score any feature dict" endpoint -
  useful for testing the model directly (see /docs) or scoring a
  brand-new project that isn't in the store yet.
- GET /projects/... reads from a precomputed cache (data/projects_store.json,
  built by build_project_store.py) rather than calling the model live.
  This is "Approach B" from the design discussion: SHAP explanation is
  too slow to recompute on every page click, so it's computed once per
  project and cached. Re-run build_project_store.py whenever the
  underlying project data changes.

Setup:
    python build_project_store.py     # builds data/projects_store.json
    uvicorn api:app --reload          # serves it

Then open in your browser:
    http://127.0.0.1:8000/docs
"""

import json
import os

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from predict import predict_risk
from prediction_log import update_outcome

app = FastAPI(title="Land Acquisition Delay Risk API")

# The website runs on a different origin/port (e.g. Vite dev server on
# :5173) than this API (:8000). Without CORS, the browser silently blocks
# every fetch() call and api.ts just falls back to its bundled mock data -
# it won't crash, but it will also never show a real prediction.
# For a hackathon/dev setup, wide-open origins are fine; tighten this list
# to your real deployed website URL before going to production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

STORE_PATH = "data/projects_store.json"
_project_store: dict = {}


@app.on_event("startup")
def load_project_store():
    global _project_store
    if os.path.exists(STORE_PATH):
        with open(STORE_PATH) as f:
            _project_store = json.load(f)
        print(f"Loaded {len(_project_store)} projects from {STORE_PATH}")
    else:
        print(f"WARNING: {STORE_PATH} not found. Run build_project_store.py first. "
              f"GET /projects endpoints will return empty results until then.")
        _project_store = {}


@app.get("/health")
def health():
    # The frontend (checkBackendHealth() in src/services/api.ts) calls this
    # BEFORE it trusts this backend at all. If it's missing or slow, the
    # site quietly stays in "Demo Mode" on mock data forever.
    return {"status": "ok"}


@app.get("/")
def home():
    return {"message": "Land Acquisition Delay Risk API is running",
             "projects_loaded": len(_project_store)}


# ---------------------------------------------------------------------
# Project-scoped GET endpoints (what services/api.ts actually calls)
# ---------------------------------------------------------------------

@app.get("/projects")
def list_projects(
    status: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
):
    results = list(_project_store.values())

    if status and status != "ALL":
        results = [p for p in results if p["status"] == status]
    if risk_level and risk_level != "ALL":
        results = [p for p in results if p["risk"]["level"] == risk_level]
    if q:
        term = q.lower().strip()
        results = [
            p for p in results
            if term in p["name"].lower()
            or term in p["district"].lower()
            or term in p["state"].lower()
        ]
    return results


@app.get("/projects/{project_id}")
def get_project(project_id: str):
    project = _project_store.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return project


@app.get("/projects/{project_id}/risk")
def get_project_risk(project_id: str):
    project = _project_store.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return project["risk"]


@app.get("/projects/{project_id}/history")
def get_project_history(project_id: str):
    project = _project_store.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return project["timeline"]


@app.get("/projects/{project_id}/environment")
def get_project_environment(project_id: str):
    project = _project_store.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return project["environmentalFactors"]


@app.get("/projects/{project_id}/recommendations")
def get_project_recommendations(project_id: str):
    project = _project_store.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return project["recommendations"]


@app.get("/projects/{project_id}/sources")
def get_project_sources(project_id: str):
    project = _project_store.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return project["sources"]


# ---------------------------------------------------------------------
# Raw model access (unchanged from before) - useful for scoring a
# project that isn't in the precomputed store yet.
# ---------------------------------------------------------------------

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


@app.post("/predict")
def predict(project: ProjectFeatures):
    result = predict_risk(project.dict())
    return result


class OutcomeUpdate(BaseModel):
    prediction_id: str
    actual_delayed: bool


@app.post("/outcome")
def report_outcome(update: OutcomeUpdate):
    update_outcome(update.prediction_id, update.actual_delayed)
    return {"message": f"Outcome recorded for prediction {update.prediction_id}"}
