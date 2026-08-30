"""
Step 4: XGBoost Model - Land Acquisition Delay Prediction
-------------------------------------------------------------
Same data pipeline as the Logistic Regression baseline, but using
XGBoost - typically much stronger on structured/tabular data with
non-linear feature interactions.

Run:
    python train_xgboost.py
"""

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)
import joblib
import os


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
    df = load_data()

    X = df.drop(columns=["delayed"])
    y = df["delayed"]

    categorical_cols = X.select_dtypes(include="object").columns.tolist()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols),
        ],
        remainder="passthrough"
    )

    # scale_pos_weight helps XGBoost handle class imbalance (roughly: count(0)/count(1))
    neg, pos = y_train.value_counts()[0], y_train.value_counts()[1]
    scale_pos_weight = neg / pos

    model = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", XGBClassifier(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=scale_pos_weight,
            eval_metric="logloss",
            random_state=42
        ))
    ])

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    print("\n--- XGBoost Evaluation on Test Set ---")
    print("Accuracy :", round(accuracy_score(y_test, y_pred), 3))
    print("Precision:", round(precision_score(y_test, y_pred), 3))
    print("Recall   :", round(recall_score(y_test, y_pred), 3))
    print("F1 Score :", round(f1_score(y_test, y_pred), 3))
    print("ROC-AUC  :", round(roc_auc_score(y_test, y_proba), 3))
    print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred))
    print("\nFull Report:\n", classification_report(y_test, y_pred))

    os.makedirs("models", exist_ok=True)
    joblib.dump(model, "models/xgboost_model.pkl")
    print("\nModel saved -> models/xgboost_model.pkl")

    # Feature importance (quick look, SHAP comes next step for deeper explainability)
    feature_names = model.named_steps["preprocessor"].get_feature_names_out()
    importances = model.named_steps["classifier"].feature_importances_
    importance_df = pd.DataFrame({
        "feature": feature_names,
        "importance": importances
    }).sort_values("importance", ascending=False)

    print("\nTop 15 most important features:\n", importance_df.head(15).to_string(index=False))


if __name__ == "__main__":
    main()
