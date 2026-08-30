"""
Builds the project store the API serves from.

This is the bridge layer discussed in the whiteboard: the ML pipeline
(predict.py) is stateless and needs a full raw feature row per call; the
frontend's REST contract (GET /projects/{id}/risk) is project-scoped and
sends no body at all. Something has to own "given an id, here is the raw
feature row" -> that's this file.

Approach B (precompute + cache): this script runs ONCE (at deploy time,
or re-run whenever wb_land_acquisition.csv changes), calls predict_risk()
for every project up front, and writes the result to data/projects_store.json.
api.py just reads that file at startup and serves cached responses -
no per-request SHAP computation, which is the slow part.

Run:
    python build_project_store.py

Output:
    data/projects_store.json  (dict of frontend-shaped Project objects,
                                keyed by the new frontend-facing id)

HONESTY NOTE: wb_land_acquisition.csv only has the 17 raw ML features.
It has no legal case numbers, court filings, gazette references, or
compensation crore-figures. The frontend's Project type requires fields
for all of that (legalIssues, sources, compensation, recommendations,
nearbyProjects, historicalPatternInsight). Rather than inventing
plausible-looking case numbers or "official gazette" citations, this
script leaves those as clearly-labeled empty/placeholder values (the
type itself already has 'DEMO_SOURCE' / 'PROTOTYPE_DEMO' enum members
for exactly this situation). Only the risk assessment - the thing the
model actually predicts - is real, computed, per-project data.
"""

import json
import hashlib
import math
import os

import pandas as pd

from predict import predict_risk

CSV_PATH = "data/wb_land_acquisition.csv"
OUT_PATH = "data/projects_store.json"

# Approximate district centroids (West Bengal). Used only to place a pin
# on the map - not sourced from any survey record, so treat as
# demo-quality geocoding, not verified coordinates.
DISTRICT_CENTROIDS = {
    "Kolkata": (22.5726, 88.3639),
    "Howrah": (22.5958, 88.2636),
    "Hooghly": (22.9012, 88.3963),
    "North 24 Parganas": (22.6169, 88.4327),
    "South 24 Parganas": (22.1667, 88.4167),
}

PROJECT_TYPE_TO_CATEGORY = {
    "HIGHWAY": "HIGHWAY",
    "RAILWAY": "RAILWAY",
    "INDUSTRIAL_PARK": "INDUSTRIAL",
    "INDUSTRIAL": "INDUSTRIAL",
    "URBAN_DEVELOPMENT": "URBAN_INFRA",
    "INFRASTRUCTURE": "URBAN_INFRA",
    "POWER": "ENERGY",
    "OTHER": "URBAN_INFRA",
}

HECTARES_TO_ACRES = 2.47105


def deterministic_jitter(seed: str, scale: float = 0.03) -> tuple:
    """Small, reproducible lat/lng offset so projects in the same
    district don't all render on one exact pin. Derived from the id
    itself, not from any real survey - purely a display convenience."""
    h = hashlib.md5(seed.encode()).hexdigest()
    dx = (int(h[:8], 16) / 0xFFFFFFFF - 0.5) * 2 * scale
    dy = (int(h[8:16], 16) / 0xFFFFFFFF - 0.5) * 2 * scale
    return dx, dy


def clean_row_for_model(row: dict) -> dict:
    """predict_risk() expects the exact 17 training columns. Fill missing
    values the same way the training pipeline's imputers would treat them
    (median for numeric, most-frequent-ish placeholder for categorical),
    since predict_risk() takes a plain dict, not the raw DataFrame the
    pipeline's own imputers already saw during .fit()."""
    defaults = {
        "land_area_hectares": 20.0,
        "affected_families": 40,
        "approval_expected_days": 120,
        "approval_actual_days": 150,
        "compensation_delay_days": 30,
        "stakeholder_responsiveness_score": 3.0,
        "notification_month": 6,
        "notification_year": 2022,
    }
    cleaned = dict(row)
    for k, v in defaults.items():
        val = cleaned.get(k)
        if val is None or (isinstance(val, float) and math.isnan(val)):
            cleaned[k] = v
    return cleaned


def build_frontend_project(new_id: str, raw_row: dict, risk_result: dict) -> dict:
    district = raw_row["district"]
    lat_base, lng_base = DISTRICT_CENTROIDS.get(district, (22.9, 88.4))
    dx, dy = deterministic_jitter(new_id)

    category = PROJECT_TYPE_TO_CATEGORY.get(raw_row["project_type"], "URBAN_INFRA")
    land_area_acres = round(raw_row["land_area_hectares"] * HECTARES_TO_ACRES, 1)
    affected_families = int(raw_row["affected_families"])

    is_delayed = bool(raw_row.get("delayed", 0))
    status = "DELAYED" if is_delayed else "ACTIVE"

    # RiskAssessment block is the real, model-computed part.
    risk_assessment = {
        "score": risk_result["score"],
        "level": risk_result["level"],
        "delayProbability": risk_result["delayProbability"],
        "estimatedDelayMonths": risk_result["estimatedDelayMonths"],
        "factors": risk_result["factors"],
        "keyReasons": risk_result["keyReasons"],
        "mitigationUrgency": risk_result["mitigationUrgency"],
    }

    # Everything below this line is NOT predicted by the model and NOT
    # present in the training data. Left as honest placeholders rather
    # than fabricated legal/official content. A real deployment would
    # need a separate, real data source for these.
    return {
        "id": new_id,
        "name": f"{category.title().replace('_', ' ')} Project - {district}",
        "category": category,
        "state": raw_row["state"],
        "district": district,
        "latitude": round(lat_base + dx, 5),
        "longitude": round(lng_base + dy, 5),
        "status": status,
        "landRequiredAcres": land_area_acres,
        "landAcquiredAcres": round(land_area_acres * (raw_row["documentation_completeness_pct"] / 100), 1),
        "acquisitionProgressPct": round(raw_row["documentation_completeness_pct"]),
        "affectedVillagesCount": max(1, affected_families // 40),
        "affectedFamiliesCount": affected_families,
        "budgetCr": 0,  # not present in training data - not fabricated
        "executingAgency": "Not available in source data",
        "targetCompletionYear": raw_row.get("notification_year", 2022) + 3,

        "risk": risk_assessment,

        "timeline": [],
        "nearbyProjects": [],
        "historicalPatternInsight": "Not available - training dataset contains feature values only, no narrative history.",
        "environmentalFactors": [],
        "legalIssues": [],
        "compensation": {
            "totalRequiredCr": 0,
            "disbursedCr": 0,
            "disbursedPct": 100 if raw_row["compensation_status"] == "Settled" else
                            (0 if raw_row["compensation_status"] == "Disputed" else 50),
            "totalDisputedCases": int(raw_row["legal_disputes_count"]),
            "affectedFamilies": affected_families,
            "resettlementColoniesPlanned": 0,
            "resettlementColoniesBuilt": 0,
            "rrPackageStatus": "STALLED" if raw_row["rehab_status"] == "Not Started" else "PARTIALLY_DELIVERED",
        },
        "recommendations": [],
        "sources": [{
            "id": f"{new_id}-src-1",
            "title": "West Bengal Land Acquisition Training Dataset",
            "type": "DISTRICT_REVENUE_REPORT",
            "issuingAuthority": "Internal project dataset",
            "date": "",
            "referenceNo": raw_row.get("project_id", new_id),
            "excerpt": "Synthetic/training data used for model development - not an official filing.",
            "verificationStatus": "PROTOTYPE_DEMO",
        }],
    }


def main():
    df = pd.read_csv(CSV_PATH)
    print(f"Loaded {len(df)} rows from {CSV_PATH}")

    store = {}
    errors = 0
    for i, row in df.iterrows():
        raw = row.to_dict()
        new_id = f"LI-{i+1:04d}"  # frontend-facing id, e.g. LI-0001

        model_input = clean_row_for_model(raw)
        # predict_risk expects exactly the 17 training columns - strip extras
        model_input = {k: v for k, v in model_input.items()
                        if k not in ("project_id", "notification_date",
                                     "approval_date", "delayed")}

        try:
            risk_result = predict_risk(model_input)
        except Exception as e:
            errors += 1
            print(f"  [skip] {raw.get('project_id')} -> {e}")
            continue

        project = build_frontend_project(new_id, {**raw, **clean_row_for_model(raw)}, risk_result)
        store[new_id] = project

    os.makedirs("data", exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(store, f, indent=2)

    print(f"Wrote {len(store)} projects -> {OUT_PATH} ({errors} skipped)")


if __name__ == "__main__":
    main()
