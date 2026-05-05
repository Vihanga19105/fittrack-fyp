import pandas as pd
import numpy as np
import random

random.seed(42)
np.random.seed(42)

def calculate_weeks(current_weight, goal_weight,
                    height_cm, age, gender,
                    activity_level, goal_type):

    # BMR calculation (Mifflin-St Jeor)
    if gender == "Male":
        bmr = (10 * current_weight +
               6.25 * height_cm -
               5 * age + 5)
    else:
        bmr = (10 * current_weight +
               6.25 * height_cm -
               5 * age - 161)

    # Activity multiplier
    activity_multipliers = {
        "Sedentary": 1.2,
        "Moderate": 1.375,
        "Active": 1.55,
        "Very Active": 1.725
    }
    tdee = bmr * activity_multipliers.get(
        activity_level, 1.375
    )

    weight_diff = abs(current_weight - goal_weight)

    if goal_type == "Weight Loss":
        # calorie deficit per week
        deficit = 500 if activity_level in [
            "Active", "Very Active"
        ] else 400
        kg_per_week = deficit * 7 / 7700
        weeks = weight_diff / kg_per_week

    elif goal_type == "Muscle Gain":
        # slower process
        surplus = 300
        kg_per_week = surplus * 7 / 7700 * 0.4
        weeks = weight_diff / kg_per_week

    else:  # General Fitness
        kg_per_week = 0.3
        weeks = weight_diff / kg_per_week

    # age factor (older = slightly slower)
    age_factor = 1 + (age - 25) * 0.008
    weeks = weeks * age_factor

    # add realistic noise
    noise = np.random.normal(0, weeks * 0.08)
    weeks = max(2, weeks + noise)

    return round(weeks, 1)

rows = []
genders = ["Male", "Female"]
goals = ["Weight Loss", "Muscle Gain",
         "General Fitness"]
activities = ["Sedentary", "Moderate",
              "Active", "Very Active"]

count = 0
attempts = 0

while count < 5000 and attempts < 50000:
    attempts += 1

    gender = random.choice(genders)
    goal_type = random.choice(goals)
    activity = random.choice(activities)

    age = random.randint(15, 70)

    if gender == "Male":
        height = random.randint(155, 195)
        current_weight = round(
            random.uniform(55, 120), 1
        )
    else:
        height = random.randint(145, 180)
        current_weight = round(
            random.uniform(45, 100), 1
        )

    # set goal weight based on goal type
    if goal_type == "Weight Loss":
        diff = round(random.uniform(3, 30), 1)
        goal_weight = round(current_weight - diff, 1)
    elif goal_type == "Muscle Gain":
        diff = round(random.uniform(3, 20), 1)
        goal_weight = round(current_weight + diff, 1)
    else:
        diff = round(random.uniform(1, 15), 1)
        goal_weight = round(
            current_weight + random.choice([-1, 1])
            * diff, 1
        )

    # validate
    if goal_weight < 35 or goal_weight > 200:
        continue
    if current_weight < 35 or current_weight > 200:
        continue
    if abs(current_weight - goal_weight) > 60:
        continue
    if abs(current_weight - goal_weight) < 1:
        continue

    weeks = calculate_weeks(
        current_weight, goal_weight,
        height, age, gender,
        activity, goal_type
    )

    if weeks < 2 or weeks > 104:
        continue

    rows.append({
        "age": age,
        "gender": gender,
        "height_cm": height,
        "current_weight": current_weight,
        "goal_weight": goal_weight,
        "goal_type": goal_type,
        "activity_level": activity,
        "weeks_to_goal": weeks
    })
    count += 1

df = pd.DataFrame(rows)
df.to_csv("fitness_dataset.csv", index=False)
print(f"✅ Generated {len(df)} rows")
print(df.describe())
print("\nGoal type distribution:")
print(df["goal_type"].value_counts())
print("\nActivity distribution:")
print(df["activity_level"].value_counts())