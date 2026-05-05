import pandas as pd
import numpy as np
from sklearn.ensemble import (
    RandomForestRegressor, GradientBoostingRegressor
)
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import (
    train_test_split, cross_val_score
)
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    mean_absolute_error, r2_score
)
import joblib

# Load data
df = pd.read_csv("fitness_dataset.csv")
print(f"Dataset size: {len(df)} rows")

# Encode categoricals
le_gender = LabelEncoder()
le_goal = LabelEncoder()
le_activity = LabelEncoder()

df["gender_enc"] = le_gender.fit_transform(df["gender"])
df["goal_enc"] = le_goal.fit_transform(df["goal_type"])
df["activity_enc"] = le_activity.fit_transform(
    df["activity_level"]
)

# Feature engineering
df["bmi"] = df["current_weight"] / (
    (df["height_cm"] / 100) ** 2
)
df["weight_diff"] = abs(
    df["current_weight"] - df["goal_weight"]
)
df["bmi_diff"] = df["bmi"] - (df["goal_weight"] / (
    (df["height_cm"] / 100) ** 2
))

# Features
features = [
    "age", "gender_enc", "height_cm",
    "current_weight", "goal_weight",
    "goal_enc", "activity_enc",
    "bmi", "weight_diff", "bmi_diff"
]

X = df[features]
y = df["weeks_to_goal"]

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train multiple models
models = {
    "Random Forest": RandomForestRegressor(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    ),
    "Gradient Boosting": GradientBoostingRegressor(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=6,
        random_state=42
    ),
    "Linear Regression": LinearRegression()
}

best_model = None
best_mae = float("inf")
best_name = ""

print("\n── Model Comparison ──")
for name, model in models.items():
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"{name}: MAE={mae:.2f} weeks, R²={r2:.4f}")

    if mae < best_mae:
        best_mae = mae
        best_model = model
        best_name = name

print(f"\n✅ Best model: {best_name}")
print(f"   MAE: {best_mae:.2f} weeks")

# Save
joblib.dump(best_model, "model.pkl")
joblib.dump(le_gender, "le_gender.pkl")
joblib.dump(le_goal, "le_goal.pkl")
joblib.dump(le_activity, "le_activity.pkl")

# Save feature names
import json
with open("features.json", "w") as f:
    json.dump(features, f)

print("\n✅ Model saved: model.pkl")
print("✅ Encoders saved")
print("✅ Features saved: features.json")