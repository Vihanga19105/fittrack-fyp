from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import json
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Load model and encoders
model = joblib.load("model.pkl")
le_gender = joblib.load("le_gender.pkl")
le_goal = joblib.load("le_goal.pkl")
le_activity = joblib.load("le_activity.pkl")

with open("features.json") as f:
    FEATURES = json.load(f)

print("✅ ML Service ready on port 5001")

def get_tips(goal_type):
    tips = {
        "Weight Loss": [
            "Aim for a 400-500 calorie daily deficit",
            "Include protein in every meal to preserve muscle",
            "Drink 2-3 liters of water daily",
            "Sleep 7-8 hours for optimal fat loss"
        ],
        "Muscle Gain": [
            "Eat 1.6-2.2g of protein per kg bodyweight",
            "Progressive overload — increase weights weekly",
            "Sleep 8+ hours for muscle recovery",
            "Eat in a 200-300 calorie surplus"
        ],
        "General Fitness": [
            "Exercise at least 150 minutes per week",
            "Mix cardio and strength training",
            "Stay consistent — results take time",
            "Focus on whole foods and vegetables"
        ]
    }
    return tips.get(goal_type, tips["General Fitness"])

def get_milestones(current_weight, goal_weight, weeks_to_goal, goal_type):
    milestones = []
    total_diff = goal_weight - current_weight
    checkpoints = [0.25, 0.5, 0.75, 1.0]
    labels = ["25% there!", "Halfway! 🎉", "75% done!", "Goal reached! 🏆"]

    for i, pct in enumerate(checkpoints):
        week = round(weeks_to_goal * pct)
        weight = round(current_weight + total_diff * pct, 1)
        future_date = datetime.now() + timedelta(weeks=week)
        milestones.append({
            "week": week,
            "weight": weight,
            "label": labels[i],
            "date": future_date.strftime("%b %d, %Y")
        })

    return milestones

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "message": "FitTrack ML Service running",
        "model": str(type(model).__name__)
    })

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        # Extract inputs
        age = float(data["age"])
        gender = data["gender"]
        height_cm = float(data["heightCm"])
        current_weight = float(data["currentWeight"])
        goal_weight = float(data["goalWeight"])
        goal_type = data["goalType"]
        activity_level = data["activityLevel"]

        # Validate
        if not (15 <= age <= 70):
            return jsonify({"error": "Age must be between 15 and 70"}), 400
        if not (140 <= height_cm <= 220):
            return jsonify({"error": "Height must be 140-220 cm"}), 400
        if not (35 <= current_weight <= 200):
            return jsonify({"error": "Current weight must be 35-200 kg"}), 400
        if not (35 <= goal_weight <= 200):
            return jsonify({"error": "Goal weight must be 35-200 kg"}), 400

        weight_diff = abs(current_weight - goal_weight)
        if weight_diff > 60:
            return jsonify({"error": "Max weight difference is 60 kg"}), 400
        if weight_diff < 1:
            return jsonify({"error": "Min weight difference is 1 kg"}), 400

        if goal_type == "Weight Loss" and goal_weight >= current_weight:
            return jsonify({"error": "Goal weight must be less than current weight for Weight Loss"}), 400
        if goal_type == "Muscle Gain" and goal_weight <= current_weight:
            return jsonify({"error": "Goal weight must be more than current weight for Muscle Gain"}), 400

        # Encode
        try:
            gender_enc = le_gender.transform([gender])[0]
        except:
            gender_enc = 0

        try:
            goal_enc = le_goal.transform([goal_type])[0]
        except:
            goal_enc = 0

        try:
            activity_enc = le_activity.transform([activity_level])[0]
        except:
            activity_enc = 1

        # Feature engineering
        bmi = current_weight / ((height_cm / 100) ** 2)
        goal_bmi = goal_weight / ((height_cm / 100) ** 2)
        bmi_diff = bmi - goal_bmi

        # Predict
        features = pd.DataFrame([[
            age, gender_enc, height_cm,
            current_weight, goal_weight,
            goal_enc, activity_enc,
            bmi, weight_diff, bmi_diff
        ]], columns=[
            "age", "gender_enc", "height_cm",
            "current_weight", "goal_weight",
            "goal_enc", "activity_enc",
            "bmi", "weight_diff", "bmi_diff"
        ])

        weeks_raw = model.predict(features)[0]

        # Activity level fine-tuning
        activity_adjustments = {
            "Sedentary": 1.15,
            "Moderate": 1.0,
            "Active": 0.88,
            "Very Active": 0.75
        }
        adjustment = activity_adjustments.get(activity_level, 1.0)
        weeks_raw = weeks_raw * adjustment

        weeks = max(2, round(float(weeks_raw)))

        # Estimated date
        estimated_date = (
            datetime.now() + timedelta(weeks=weeks)
        ).strftime("%B %d, %Y")

        # Weekly change
        weekly_change = round(
            (goal_weight - current_weight) / weeks, 2
        )

        # BMI category
        bmi_rounded = round(bmi, 1)
        if bmi < 18.5:
            bmi_category = "Underweight"
        elif bmi < 25:
            bmi_category = "Normal"
        elif bmi < 30:
            bmi_category = "Overweight"
        else:
            bmi_category = "Obese"

        # Confidence range
        confidence = {
            "bestCase": max(2, round(weeks * 0.80)),
            "realistic": weeks,
            "worstCase": round(weeks * 1.25)
        }

        # Milestones
        milestones = get_milestones(
            current_weight, goal_weight, weeks, goal_type
        )

        # Tips
        tips = get_tips(goal_type)

        return jsonify({
            "weeksToGoal": weeks,
            "estimatedDate": estimated_date,
            "weeklyChange": weekly_change,
            "currentBmi": bmi_rounded,
            "bmiCategory": bmi_category,
            "goalType": goal_type,
            "confidence": confidence,
            "milestones": milestones,
            "tips": tips
        })

    except KeyError as e:
        return jsonify({"error": f"Missing field: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5001, debug=True)