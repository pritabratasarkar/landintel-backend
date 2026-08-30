import pandas as pd

df = pd.read_csv("data/wb_land_acquisition.csv")

# Basic shape and structure
print("Shape:", df.shape)
print("\nColumn names and types:\n", df.dtypes)

# Check target variable balance
print("\nDelay rate:\n", df["delayed"].value_counts(normalize=True))

# Check for missing values
print("\nMissing values:\n", df.isnull().sum())

# Summary statistics for numeric columns
print("\nNumeric summary:\n", df.describe())

# Check categorical columns
print("\nProject types:\n", df["project_type"].value_counts())
print("\nCompensation status:\n", df["compensation_status"].value_counts())
numeric_cols = df.select_dtypes(include="number").columns
correlations = df[numeric_cols].corr()["delayed"].sort_values(ascending=False)
print(correlations)