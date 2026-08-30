"""
Step 3: Baseline Model - Land Acquisition Delay Prediction
-------------------------------------------------------------
Loads the synthetic data, encodes categorical columns, trains a
baseline Logistic Regression model, and evaluates it.

Run:
    python train_baseline.py
"""

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)
import joblib
import os


def load_data(path="data/wb_land_acquisition.csv"):
    df = pd.read_csv(path)

    # Drop the leak column - it directly encodes the answer
    df = df.drop(columns=["delay_probability_raw"], errors="ignore")

    # Drop identifier column - not predictive, just an ID
    df = df.drop(columns=["project_id"])

    # Convert dates to numeric features instead of dropping entirely
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
    numeric_cols = X.select_dtypes(include="number").columns.tolist()

    print("Categorical columns:", categorical_cols)
    print("Numeric columns:", numeric_cols)

    # Split BEFORE any fitting, to avoid data leakage from test set
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # One-hot encode categoricals, pass numeric columns through unchanged
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols),
        ],
        remainder="passthrough"
    )

    model = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced"))
    ])

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    print("\n--- Evaluation on Test Set ---")
    print("Accuracy :", round(accuracy_score(y_test, y_pred), 3))
    print("Precision:", round(precision_score(y_test, y_pred), 3))
    print("Recall   :", round(recall_score(y_test, y_pred), 3))
    print("F1 Score :", round(f1_score(y_test, y_pred), 3))
    print("ROC-AUC  :", round(roc_auc_score(y_test, y_proba), 3))
    print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred))
    print("\nFull Report:\n", classification_report(y_test, y_pred))

    os.makedirs("models", exist_ok=True)
    joblib.dump(model, "models/baseline_logistic_regression.pkl")
    print("\nModel saved -> models/baseline_logistic_regression.pkl")


if __name__ == "__main__":
    main()
