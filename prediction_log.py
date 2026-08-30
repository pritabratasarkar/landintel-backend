"""
Step 8: Prediction Logging (the "memory" layer)
-------------------------------------------------------------
Every time predict_risk() is called, this logs the input features,
the predicted risk score, and a timestamp to a CSV file.

Later, once the REAL outcome of a project is known (delayed or not),
you update that same row with the actual result. That resolved data
is what gets fed back into retraining - THIS is how the model
"remembers" and improves over time.

This file is imported by predict.py / api.py - you don't run it directly.
"""

import pandas as pd
import os
from datetime import datetime
import uuid

LOG_PATH = "data/prediction_log.csv"


def log_prediction(project_features: dict, risk_score: float, risk_category: str) -> str:
    """
    Saves one prediction to the log. Returns a unique prediction_id
    so you can later match this row when the real outcome is known.
    """
    prediction_id = str(uuid.uuid4())[:8]

    row = {
        "prediction_id": prediction_id,
        "timestamp": datetime.now().isoformat(),
        **project_features,
        "predicted_risk_score": risk_score,
        "predicted_risk_category": risk_category,
        "actual_delayed": None,   # filled in later, once known
        "outcome_updated_at": None
    }

    os.makedirs("data", exist_ok=True)

    if os.path.exists(LOG_PATH):
        existing = pd.read_csv(LOG_PATH)
        updated = pd.concat([existing, pd.DataFrame([row])], ignore_index=True)
    else:
        updated = pd.DataFrame([row])

    updated.to_csv(LOG_PATH, index=False)
    return prediction_id


def update_outcome(prediction_id: str, actual_delayed: bool):
    """
    Call this once you know whether the project was ACTUALLY delayed.
    e.g. update_outcome("a1b2c3d4", True)
    """
    if not os.path.exists(LOG_PATH):
        print("No prediction log found yet.")
        return

    df = pd.read_csv(LOG_PATH)
    match = df["prediction_id"] == prediction_id

    if not match.any():
        print(f"No prediction found with id {prediction_id}")
        return

    # Force these two columns to a flexible (object) dtype first - otherwise
    # pandas may have inferred them as float64 (since they start out empty/NaN)
    # and then refuses to write text into them, raising a dtype error.
    df["actual_delayed"] = df["actual_delayed"].astype(object)
    df["outcome_updated_at"] = df["outcome_updated_at"].astype(object)

    df.loc[match, "actual_delayed"] = int(actual_delayed)
    df.loc[match, "outcome_updated_at"] = datetime.now().isoformat()
    df.to_csv(LOG_PATH, index=False)
    print(f"Updated outcome for prediction {prediction_id} -> delayed={actual_delayed}")


if __name__ == "__main__":
    # Quick demo of how this is used
    example_features = {
        "state": "Bihar", "district": "Bihar_District_2", "project_type": "Highway",
        "land_type": "Agricultural", "land_area_hectares": 25.4, "affected_families": 60,
        "approval_expected_days": 90, "approval_actual_days": 140,
        "compensation_status": "Disputed", "compensation_delay_days": 80,
        "legal_disputes_count": 2, "documentation_completeness_pct": 55.0,
        "rehab_status": "Survey Done", "rehab_progress_pct": 20,
        "stakeholder_responsiveness_score": 3.5, "notification_month": 6,
        "notification_year": 2023
    }

    pid = log_prediction(example_features, risk_score=0.897, risk_category="High")
    print(f"Logged prediction with id: {pid}")

    # Simulate finding out the real outcome later
    update_outcome(pid, actual_delayed=True)

    print("\nCurrent log:")
    print(pd.read_csv(LOG_PATH))
