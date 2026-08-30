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

import pandas as pd
import joblib
from prediction_log import log_prediction

# Load model once at import time (not inside the function - loading is slow,
# you don't want to reload the model on every single prediction)
_pipeline = joblib.load("models/xgboost_model.pkl")
_preprocessor = _pipeline.named_steps["preprocessor"]
_classifier = _pipeline.named_steps["classifier"]


def risk_category_from_score(score):
    """Convert a 0-1 probability into a human-readable category."""
    if score >= 0.6:
        return "High"
    elif score >= 0.3:
        return "Medium"
    else:
        return "Low"


# -------------------------------------------------------------
# Mapping from raw model columns -> the 7 fixed factor buckets
# the website's pie/radar chart expects (see final_site/src/types/index.ts
# -> RiskFactors, and ProjectDetailPanel.tsx's pieData/radarData).
# Every one of your training columns must appear in exactly one bucket.
# -------------------------------------------------------------
FEATURE_CATEGORY_MAP = {
    "legal_disputes_count": "legal",

    "compensation_status": "compensation",
    "compensation_delay_days": "compensation",

    "rehab_status": "rehabilitation",
    "rehab_progress_pct": "rehabilitation",

    "land_type": "environment",
    "land_area_hectares": "environment",

    "documentation_completeness_pct": "documentation",

    "affected_families": "social",
    "stakeholder_responsiveness_score": "social",

    "approval_expected_days": "historicalDelay",
    "approval_actual_days": "historicalDelay",
    "notification_month": "historicalDelay",
    "notification_year": "historicalDelay",
    "state": "historicalDelay",
    "district": "historicalDelay",
    "project_type": "historicalDelay",
}

FACTOR_KEYS = [
    "legal", "compensation", "rehabilitation",
    "environment", "documentation", "social", "historicalDelay",
]

# Human-readable labels used when building keyReasons sentences
_PRETTY_NAMES = {
    "legal_disputes_count": "number of active legal disputes",
    "compensation_status": "compensation settlement status",
    "compensation_delay_days": "compensation disbursement delay",
    "rehab_status": "rehabilitation & resettlement stage",
    "rehab_progress_pct": "R&R progress",
    "land_type": "land type",
    "land_area_hectares": "land area required",
    "documentation_completeness_pct": "title/documentation completeness",
    "affected_families": "number of affected families",
    "stakeholder_responsiveness_score": "stakeholder responsiveness",
    "approval_expected_days": "expected approval timeline",
    "approval_actual_days": "actual approval timeline",
    "notification_month": "notification timing",
    "notification_year": "notification year",
    "state": "state-level historical pattern",
    "district": "district-level historical pattern",
    "project_type": "project type's historical delay pattern",
}


def _strip_prefix(feature_name: str) -> str:
    """Remove the ColumnTransformer prefix ('cat__', 'num__', 'remainder__')."""
    for prefix in ("cat__", "num__", "remainder__"):
        if feature_name.startswith(prefix):
            return feature_name[len(prefix):]
    return feature_name


def _base_column_for(clean_name: str):
    """
    Map a (prefix-stripped) transformed feature name back to its original
    training column. Numeric columns pass through unchanged; one-hot
    columns look like '<original_col>_<category_value>', so we match the
    longest known base column name that the feature starts with.
    """
    if clean_name in FEATURE_CATEGORY_MAP:
        return clean_name
    for base_col in sorted(FEATURE_CATEGORY_MAP, key=len, reverse=True):
        if clean_name.startswith(base_col + "_"):
            return base_col
    return None


def compute_risk_factors(feature_names, values, shap_values):
    """
    Groups every model feature's SHAP contribution into the 7 fixed
    buckets the website expects, scaled 0-100 so they sum to ~100
    (perfect for both the pie chart, which normalizes by total anyway,
    and the radar chart, whose fullMark is 100).

    Returns: (factors_dict, key_reasons_list)
    """
    bucket_totals = {k: 0.0 for k in FACTOR_KEYS}
    # keep the single strongest contributing raw feature per bucket,
    # so we can write a human sentence for keyReasons later
    bucket_top_feature = {k: None for k in FACTOR_KEYS}

    for name, value, impact in zip(feature_names, values, shap_values):
        clean_name = _strip_prefix(name)

        # For one-hot columns, only the active category (value == 1)
        # actually describes this project - skip the inactive ones.
        base_col = _base_column_for(clean_name)
        if base_col is None:
            continue
        is_onehot = clean_name != base_col
        if is_onehot and value != 1:
            continue

        category = FEATURE_CATEGORY_MAP[base_col]
        abs_impact = abs(float(impact))
        bucket_totals[category] += abs_impact

        current_top = bucket_top_feature[category]
        if current_top is None or abs_impact > current_top["abs_impact"]:
            bucket_top_feature[category] = {
                "base_col": base_col,
                "value": value,
                "impact": float(impact),
                "abs_impact": abs_impact,
            }

    grand_total = sum(bucket_totals.values())
    if grand_total <= 0:
        # Fallback: no discernible signal, spread evenly rather than
        # sending an empty/zeroed chart to the frontend
        factors = {k: round(100 / len(FACTOR_KEYS)) for k in FACTOR_KEYS}
    else:
        factors = {
            k: round((bucket_totals[k] / grand_total) * 100)
            for k in FACTOR_KEYS
        }

    # Build keyReasons from the strongest feature in each of the top few buckets
    ranked_buckets = sorted(
        (b for b in bucket_top_feature.values() if b is not None),
        key=lambda b: b["abs_impact"],
        reverse=True,
    )
    key_reasons = []
    for b in ranked_buckets[:5]:
        label = _PRETTY_NAMES.get(b["base_col"], b["base_col"])
        direction = "is increasing" if b["impact"] > 0 else "is reducing"
        key_reasons.append(f"{label.capitalize()} {direction} delay risk")

    return factors, key_reasons


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
        # NOTE: fixed - was only stripping "cat__"/"remainder__", so numeric
        # columns (prefixed "num__" by the ColumnTransformer) never matched
        # and were silently dropped from top_factors before.
        clean_name = _strip_prefix(row["feature"])
        if any(clean_name == col for col in numeric_cols):
            return True
        return row["value"] == 1

    contributions["active"] = contributions.apply(is_active, axis=1)
    active_contributions = contributions[contributions["active"]].copy()
    active_contributions["abs_impact"] = active_contributions["shap_impact"].abs()
    top_factors_df = active_contributions.sort_values("abs_impact", ascending=False).head(7)

    top_factors = []
    for _, r in top_factors_df.iterrows():
        clean_name = _strip_prefix(r["feature"])
        direction = "increases" if r["shap_impact"] > 0 else "decreases"
        top_factors.append({
            "factor": clean_name,
            "value": r["value"],
            "effect": direction,
            "impact_strength": round(float(r["shap_impact"]), 3)
        })

    # Group the SHAP contributions into the 7 fixed buckets the website's
    # pie/radar charts expect (RiskFactors in types/index.ts), and build
    # plain-English keyReasons from the strongest one in each bucket.
    factors, key_reasons = compute_risk_factors(
        feature_names, X_transformed_df.iloc[0].values, shap_values
    )

    # Map onto the website's 5-tier RiskLevel + mitigationUrgency scale
    # (see final_site/src/config/riskConfig.ts) using the 0-100 score.
    score_0_100 = risk_score * 100
    if score_0_100 >= 85:
        risk_level, mitigation_urgency = "CRITICAL", "IMMEDIATE"
    elif score_0_100 >= 70:
        risk_level, mitigation_urgency = "HIGH", "HIGH"
    elif score_0_100 >= 46:
        risk_level, mitigation_urgency = "MEDIUM", "MODERATE"
    elif score_0_100 >= 25:
        risk_level, mitigation_urgency = "LOW_MEDIUM", "LOW"
    else:
        risk_level, mitigation_urgency = "LOW", "LOW"

    # Rough delay estimate: use actual-vs-expected approval gap if available,
    # otherwise fall back to a category-based heuristic.
    expected = project_features.get("approval_expected_days")
    actual = project_features.get("approval_actual_days")
    if expected is not None and actual is not None and actual > expected:
        estimated_delay_months = round((actual - expected) / 30)
    else:
        estimated_delay_months = {"Low": 1, "Medium": 6, "High": 14}.get(category, 6)

    # Save this prediction so its real outcome can be recorded later,
    # and future retraining can learn from it (see prediction_log.py)
    prediction_id = log_prediction(project_features, risk_score, category)

    return {
        "prediction_id": prediction_id,
        "risk_score": round(risk_score, 3),
        "risk_category": category,
        "top_factors": top_factors,

        # Shaped to match the website's RiskAssessment type exactly
        # (final_site/src/types/index.ts) so it can be dropped straight
        # into project.risk on the frontend.
        "score": round(score_0_100),
        "level": risk_level,
        "delayProbability": round(risk_score, 3),
        "estimatedDelayMonths": estimated_delay_months,
        "factors": factors,
        "keyReasons": key_reasons,
        "mitigationUrgency": mitigation_urgency,
    }


if __name__ == "__main__":
    example_project = {
        "state": "West Bengal",
        "district": "Kolkata",
        "project_type": "Highway",
        "land_type": "Agricultural",
        "land_area_hectares": 25.4,
        "affected_families": 80,
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
        "notification_year": 2022
    }

    result = predict_risk(example_project)

    print(f"Risk Score   : {result['risk_score']} ({result['risk_category']} risk)")
    print("\nTop contributing factors:")
    for f in result["top_factors"]:
        print(f"  - {f['factor']} = {f['value']} ({f['effect']} risk, strength: {f['impact_strength']})")
