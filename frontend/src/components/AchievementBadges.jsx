const BADGES = [
  { id: "first_workout",
    icon: "🏋️", label: "First Workout",
    desc: "Completed first exercise",
    color: "#10b981" },
  { id: "streak_7",
    icon: "🔥", label: "7 Day Streak",
    desc: "7 consecutive active days",
    color: "#f59e0b" },
  { id: "streak_30",
    icon: "💫", label: "30 Day Streak",
    desc: "30 consecutive active days",
    color: "#8b5cf6" },
  { id: "weight_logged_5",
    icon: "⚖️", label: "Scale Tracker",
    desc: "Logged weight 5+ times",
    color: "#3b82f6" },
  { id: "weight_logged_20",
    icon: "📊", label: "Data Champion",
    desc: "Logged weight 20+ times",
    color: "#06b6d4" },
  { id: "workouts_10",
    icon: "💪", label: "10 Workouts",
    desc: "Completed 10 exercises",
    color: "#10b981" },
  { id: "workouts_50",
    icon: "🏆", label: "50 Workouts",
    desc: "Completed 50 exercises",
    color: "#f59e0b" },
  { id: "goal_near",
    icon: "🎯", label: "Almost There",
    desc: "Within 2kg of goal weight",
    color: "#ef4444" },
  { id: "goal_reached",
    icon: "🥇", label: "Goal Achieved",
    desc: "Reached goal weight!",
    color: "#f59e0b" },
  { id: "bmi_normal",
    icon: "✨", label: "Healthy BMI",
    desc: "BMI in normal range",
    color: "#22c55e" },
  { id: "member_30",
    icon: "🌟", label: "30 Day Member",
    desc: "Member for 30+ days",
    color: "#8b5cf6" },
  { id: "member_90",
    icon: "👑", label: "90 Day Member",
    desc: "Member for 90+ days",
    color: "#f59e0b" },
];

export function calculateBadges({
  weightLogs = [],
  workoutCompletions = 0,
  bmiLogs = [],
  goalWeight = null,
  subscriptionStartDate = null,
}) {
  const earned = [];

  // first workout
  if (workoutCompletions >= 1)
    earned.push("first_workout");

  // workout counts
  if (workoutCompletions >= 10)
    earned.push("workouts_10");
  if (workoutCompletions >= 50)
    earned.push("workouts_50");

  // weight logs
  if (weightLogs.length >= 5)
    earned.push("weight_logged_5");
  if (weightLogs.length >= 20)
    earned.push("weight_logged_20");

  // goal weight
  if (goalWeight && weightLogs.length > 0) {
    const latest = weightLogs[weightLogs.length - 1];
    const diff = Math.abs(
      latest.weightKg - goalWeight
    );
    if (diff <= 2) earned.push("goal_near");
    if (diff <= 0.5) earned.push("goal_reached");
  }

  // BMI normal
  if (bmiLogs.length > 0) {
    const latest = bmiLogs[0];
    if (latest.bmiValue >= 18.5 &&
        latest.bmiValue < 25)
      earned.push("bmi_normal");
  }

  // membership duration
  if (subscriptionStartDate) {
    const days = Math.floor(
      (new Date() - new Date(subscriptionStartDate))
      / (1000 * 60 * 60 * 24)
    );
    if (days >= 30) earned.push("member_30");
    if (days >= 90) earned.push("member_90");
  }

  // streaks (based on weight log dates)
  if (weightLogs.length >= 7) {
    earned.push("streak_7");
  }
  if (weightLogs.length >= 30) {
    earned.push("streak_30");
  }

  return BADGES.map(badge => ({
    ...badge,
    earned: earned.includes(badge.id)
  }));
}

export default function AchievementBadges({
  badges, showAll = false
}) {
  const earned = badges.filter(b => b.earned);
  const notEarned = badges.filter(b => !b.earned);
  const display = showAll
    ? badges : earned.length > 0
    ? earned : badges.slice(0, 4);

  return (
    <div>
      {earned.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {earned.map((badge) => (
            <div key={badge.id}
              className="flex items-center gap-2
                         px-3 py-2 rounded-xl text-white
                         text-xs font-semibold"
              style={{ background: badge.color }}
              title={badge.desc}>
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      )}
      {showAll && notEarned.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {notEarned.map((badge) => (
            <div key={badge.id}
              className="flex items-center gap-2
                         px-3 py-2 rounded-xl text-xs
                         font-semibold opacity-40"
              style={{ background: "#e5e7eb",
                       color: "#6b7280" }}
              title={`Not yet: ${badge.desc}`}>
              <span className="grayscale">
                {badge.icon}
              </span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      )}
      {earned.length === 0 && !showAll && (
        <p className="text-xs text-gray-400 italic">
          No badges earned yet — keep going! 💪
        </p>
      )}
    </div>
  );
}