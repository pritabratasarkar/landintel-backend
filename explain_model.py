"""
Step 5: Explainability with SHAP
-------------------------------------------------------------
Loads the saved XGBoost model and explains WHY it predicts a
project as high-risk or low-risk - both overall and per-project.

Run:
    python explain_model.py
"""

import pandas as pd
import joblib
import shap
import matplotlib.pyplot as plt


def load_data(path="data/wb_land_acquisition.csv"):
    df = pd.read_csv(path)
    df = df.drop(columns=["delay_probability_raw"], errors="ignore")
    df = df.drop(columns=["project_id"])

    df["notification_date"] = pd.to_datetime(df["notification_date"])
    df["approval_date"] = pd.to_datetime(df["approval_date"])
    df["notification_month"] = df["notification_date"].dt.month
    df["notification_year"] = df["notification_date"].dt.year
    df = df.drop(columns=["notification_date", "approval_date"])

    return df


def main():
    # Load the trained pipeline (preprocessor + model bundled together)
    pipeline = joblib.load("models/xgboost_model.pkl")
    preprocessor = pipeline.named_steps["preprocessor"]
    classifier = pipeline.named_steps["classifier"]

    df = load_data()
    X = df.drop(columns=["delayed"])

    # Transform the raw data the same way the model was trained on
    X_transformed = preprocessor.transform(X)
    if hasattr(X_transformed, "toarray"):
        X_transformed = X_transformed.toarray()
    feature_names = preprocessor.get_feature_names_out()
    X_transformed_df = pd.DataFrame(X_transformed, columns=feature_names)

    # Build the SHAP explainer for tree-based models (fast, exact for XGBoost)
    explainer = shap.TreeExplainer(classifier)
    shap_values = explainer.shap_values(X_transformed_df)

    # ---- 1. Overall summary: which features matter most, across all projects ----
    plt.figure()
    shap.summary_plot(shap_values, X_transformed_df, show=False, max_display=15)
    plt.tight_layout()
    plt.savefig("shap_summary_overall.png", dpi=150)
    plt.close()
    print("Saved overall summary plot -> shap_summary_overall.png")

    # ---- 2. Per-project explanation: pick a few example projects ----
    sample_indices = [0, 1, 2]  # first 3 projects, change to inspect others

    for idx in sample_indices:
        project_shap = shap_values[idx]
        row = X_transformed_df.iloc[idx]

        # Get the top contributing factors for THIS project, sorted by impact
        contributions = pd.DataFrame({
            "feature": feature_names,
            "value": row.values,
            "shap_impact": project_shap
        })
        contributions["abs_impact"] = contributions["shap_impact"].abs()
        top_factors = contributions.sort_values("abs_impact", ascending=False).head(5)

        predicted_proba = classifier.predict_proba(
            X_transformed_df.iloc[[idx]]
        )[0][1]

        print(f"\n=== Project index {idx} — Predicted delay risk: {predicted_proba:.1%} ===")
        for _, r in top_factors.iterrows():
            direction = "increases" if r["shap_impact"] > 0 else "decreases"
            print(f"  - {r['feature']} (value={r['value']:.2f}) {direction} risk "
                  f"(impact: {r['shap_impact']:+.3f})")


if __name__ == "__main__":
    main()
