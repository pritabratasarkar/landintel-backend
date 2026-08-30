"""
Step 6: Reusable Prediction Function
-------------------------------------------------------------
This wraps model loading + prediction + explanation into ONE function
you can call from anywhere - a script, a notebook, or (later) an API
endpoint that the website calls.

This is the shape your final integration will take:
    predict_risk(project_features_dict) -> {risk_score, risk_category, top_factors}

Run this file directly to see an example:
    python predict.py
"""

import os
import pandas as pd
import joblib
from prediction_log import log_prediction

MODEL_PATH = "models/xgboost_model.pkl"

# Load model once at import time (not inside the function - loading is slow,
# you don't want to reload the model on every single prediction).
# If the model hasn't been trained yet (models/xgboost_model.pkl missing),
# don't crash the whole process on import - the API layer checks
# `model_is_ready()` and returns a clear error to callers instead.
_pipeline = None
_preprocessor = None
_classifier = None
_load_error = None

if os.path.exists(MODEL_PATH):
    try:
        _pipeline = joblib.load(MODEL_PATH)
        _preprocessor = _pipeline.named_steps["preprocessor"]
        _classifier = _pipeline.named_steps["classifier"]
    except Exception as exc:  # pragma: no cover - defensive
        _load_error = str(exc)
else:
    _load_error = (
        f"Model file not found at '{MODEL_PATH}'. Run `python train_xgboost.py` "
        "first to train and save the model."
    )


def model_is_ready() -> bool:
    return _pipeline is not None


def model_status() -> dict:
    return {"ready": model_is_ready(), "detail": _load_error}


def risk_category_from_score(score):
    """Convert a 0-1 probability into a human-readable category."""
    if score >= 0.6:
        return "High"
    elif score >= 0.3:
        return "Medium"
    else:
        return "Low"


def predict_risk(project_features: dict) -> dict:
    """
    Takes ONE project's features as a dictionary and returns:
        {
            "risk_score": float (0-1 probability of delay),
            "risk_category": "Low" / "Medium" / "High",
            "top_factors": list of the biggest contributing factors
        }

    Example input (must match the columns the model was trained on):
        {
            "state": "Bihar",
            "district": "Bihar_District_2",
            "project_type": "Highway",
            "land_type": "Agricultural",
            "land_area_hectares": 25.4,
            "affected_families": 60,
            "approval_expected_days": 90,
            "approval_actual_days": 140,
            "compensation_status": "Disputed",
            "compensation_delay_days": 80,
            "legal_disputes_count": 2,
            "documentation_completeness_pct": 55.0,
            "rehab_status": "Survey Done",
            "rehab_progress_pct": 20,
            "stakeholder_responsiveness_score": 3.5,
            "notification_month": 6,
            "notification_year": 2023
        }
    """
    if not model_is_ready():
        raise RuntimeError(model_status()["detail"])

    # Convert the single dict into a one-row DataFrame (model expects a table)
    X = pd.DataFrame([project_features])

    # Predict probability of delay
    risk_score = float(_classifier.predict_proba(_preprocessor.transform(X))[0][1])
    category = risk_category_from_score(risk_score)

    # Get SHAP-based top factors for THIS project only
    import shap
    X_transformed = _preprocessor.transform(X)
    if hasattr(X_transformed, "toarray"):
        X_transformed = X_transformed.toarray()
    feature_names = _preprocessor.get_feature_names_out()
    X_transformed_df = pd.DataFrame(X_transformed, columns=feature_names)

    explainer = shap.TreeExplainer(_classifier)
    shap_values = explainer.shap_values(X_transformed_df)[0]

    contributions = pd.DataFrame({
        "feature": feature_names,
        "value": X_transformed_df.iloc[0].values,
        "shap_impact": shap_values
    })

    # Only keep factors that are actually "active" for this project:
    # - for one-hot columns, value must be 1 (the category that's actually true)
    # - for numeric columns (rehab_progress_pct etc.), always keep them
    numeric_cols = ["land_area_hectares", "affected_families", "approval_expected_days",
                     "approval_actual_days", "compensation_delay_days", "legal_disputes_count",
                     "documentation_completeness_pct", "rehab_progress_pct",
                     "stakeholder_responsiveness_score", "notification_month", "notification_year"]

    def is_active(row):
        clean_name = row["feature"].replace("remainder__", "").replace("cat__", "")
        if any(clean_name == col for col in numeric_cols):
            return True
        return row["value"] == 1

    contributions["active"] = contributions.apply(is_active, axis=1)
    active_contributions = contributions[contributions["active"]].copy()
    active_contributions["abs_impact"] = active_contributions["shap_impact"].abs()
    top_factors_df = active_contributions.sort_values("abs_impact", ascending=False).head(5)

    top_factors = []
    for _, r in top_factors_df.iterrows():
        clean_name = r["feature"].replace("remainder__", "").replace("cat__", "")
        direction = "increases" if r["shap_impact"] > 0 else "decreases"
        top_factors.append({
            "factor": clean_name,
            "value": r["value"],
            "effect": direction,
            "impact_strength": round(float(r["shap_impact"]), 3)
        })

    # Save this prediction so its real outcome can be recorded later,
    # and future retraining can learn from it (see prediction_log.py)
    prediction_id = log_prediction(project_features, risk_score, category)

    return {
        "prediction_id": prediction_id,
        "risk_score": round(risk_score, 3),
        "risk_category": category,
        "top_factors": top_factors
    }


if __name__ == "__main__":
    example_project = {
        "state": "Bihar",
        "district": "Bihar_District_2",
        "project_type": "Highway",
        "land_type": "Agricultural",
        "land_area_hectares": 25.4,
        "affected_families": 60,
        "approval_expected_days": 90,
        "approval_actual_days": 140,
        "compensation_status": "Disputed",
        "compensation_delay_days": 80,
        "legal_disputes_count": 2,
        "documentation_completeness_pct": 55.0,
        "rehab_status": "Survey Done",
        "rehab_progress_pct": 20,
        "stakeholder_responsiveness_score": 3.5,
        "notification_month": 6,
        "notification_year": 2023
    }

    result = predict_risk(example_project)

    print(f"Risk Score   : {result['risk_score']} ({result['risk_category']} risk)")
    print("\nTop contributing factors:")
    for f in result["top_factors"]:
        print(f"  - {f['factor']} = {f['value']} ({f['effect']} risk, strength: {f['impact_strength']})")
