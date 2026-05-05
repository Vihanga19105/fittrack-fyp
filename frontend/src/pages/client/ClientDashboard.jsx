import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import api from "../../api/api";
import AchievementBadges, {
  calculateBadges
} from "../../components/AchievementBadges";

const API = "http://localhost:8080/api";
const NAVY = "#0A2342";
const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT = "#E8F7FD";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const clientId = localStorage.getItem("userId");

  const [profile, setProfile] = useState({
    name: localStorage.getItem("name") || "User",
    weightKg: "--", goalType: "--",
    heightCm: "--", age: "--",
    goalWeight: null,
  });
  const [subscription, setSubscription] = useState(null);
  const [acceptedSubs, setAcceptedSubs] = useState([]);
  const [allSubs, setAllSubs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [todayMeals, setTodayMeals] = useState([]);
  const [todayExercises, setTodayExercises] = useState([]);
  const [targetCalories, setTargetCalories] = useState(0);
  const [latestBmi, setLatestBmi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expiryDays, setExpiryDays] = useState(null);
  const [expirySubscription, setExpirySubscription] = useState(null);
  const [badges, setBadges] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [bmiLogs, setBmiLogs] = useState([]);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [todayCompletions, setTodayCompletions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const todayJs = new Date().getDay();
  const todayNum = todayJs === 0 ? 7 : todayJs;

  const hasActiveSub = allSubs.some(s => s.status === "ACTIVE");

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest("#notif-panel") &&
          !e.target.closest("#notif-btn")) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const buildNotifications = (subs, wLogs, bLogs, unread, expiryDaysVal) => {
    const notifs = [];
    const stored = JSON.parse(localStorage.getItem("readNotifs") || "[]");
    const hasActive = subs.some(s => s.status === "ACTIVE");

    subs.filter(s => s.status === "ACCEPTED").forEach(s => {
      notifs.push({
        id: `accepted-${s.id}`,
        type: "success",
        icon: "✅",
        title: hasActive ? "Request Accepted (Blocked)" : "Request Accepted!",
        message: hasActive
          ? `${s.trainerName} accepted but you have an active subscription. Pay after it expires.`
          : `${s.trainerName} accepted your request. Pay now to activate.`,
        action: "/client/payments",
        actionLabel: hasActive ? "View" : "Pay Now",
        time: s.updatedAt || s.startDate,
        color: hasActive ? "#f59e0b" : "#10b981",
      });
    });

    subs.filter(s => s.status === "ACTIVE").forEach(s => {
      notifs.push({
        id: `active-${s.id}`,
        type: "info",
        icon: "💳",
        title: "Subscription Active",
        message: `Your plan with ${s.trainerName} is active until ${s.endDate}.`,
        action: "/client/payments",
        actionLabel: "View",
        time: s.startDate,
        color: BLUE,
      });
    });

    subs.filter(s => s.status === "REJECTED").forEach(s => {
      notifs.push({
        id: `rejected-${s.id}`,
        type: "error",
        icon: "❌",
        title: "Request Rejected",
        message: s.rejectionReason
          ? `${s.trainerName} rejected: "${s.rejectionReason}"`
          : `${s.trainerName} rejected your request.`,
        action: "/client/trainers",
        actionLabel: "Find Trainer",
        time: s.updatedAt,
        color: "#ef4444",
      });
    });

    if (expiryDaysVal !== null) {
      const expSub = subs.find(s => s.status === "ACTIVE");
      notifs.push({
        id: `expiry-${expSub?.id}`,
        type: "warning",
        icon: expiryDaysVal === 0 ? "🚨" : "⚠️",
        title: expiryDaysVal === 0 ? "Subscription Expires Today!" : "Subscription Expiring Soon",
        message: expiryDaysVal === 0
          ? `Your plan with ${expSub?.trainerName} expires today!`
          : `Your plan with ${expSub?.trainerName} expires in ${expiryDaysVal} day${expiryDaysVal !== 1 ? "s" : ""}.`,
        action: "/client/payments",
        actionLabel: "Renew",
        time: new Date().toISOString(),
        color: "#f59e0b",
      });
    }

    if (unread > 0) {
      notifs.push({
        id: `chat-${unread}`,
        type: "message",
        icon: "💬",
        title: "New Messages",
        message: `You have ${unread} unread message${unread !== 1 ? "s" : ""} from your trainer.`,
        action: "/client/chat",
        actionLabel: "View Messages",
        time: new Date().toISOString(),
        color: "#8b5cf6",
      });
    }

    if (wLogs.length > 0) {
      const lastLog = new Date(wLogs[wLogs.length - 1].loggedAt || wLogs[wLogs.length - 1].logDate);
      const daysSince = Math.floor((new Date() - lastLog) / (1000 * 60 * 60 * 24));
      if (daysSince >= 7) {
        notifs.push({
          id: "weight-reminder",
          type: "reminder",
          icon: "⚖️",
          title: "Log Your Weight",
          message: `You haven't logged weight in ${daysSince} days!`,
          action: "/client/progress",
          actionLabel: "Log Now",
          time: new Date().toISOString(),
          color: "#f59e0b",
        });
      }
    } else {
      notifs.push({
        id: "weight-first",
        type: "reminder",
        icon: "⚖️",
        title: "Log Your First Weight",
        message: "Start tracking progress by logging weight!",
        action: "/client/progress",
        actionLabel: "Log Now",
        time: new Date().toISOString(),
        color: BLUE,
      });
    }

    if (bLogs.length === 0) {
      notifs.push({
        id: "bmi-first",
        type: "reminder",
        icon: "📊",
        title: "Calculate Your BMI",
        message: "Track your health by calculating your BMI!",
        action: "/client/bmi",
        actionLabel: "Calculate",
        time: new Date().toISOString(),
        color: "#10b981",
      });
    }

    const unreadCount = notifs.filter(n => !stored.includes(n.id)).length;
    setUnreadNotifs(unreadCount);
    setNotifications(notifs);
  };

  const markAllRead = () => {
    const ids = notifications.map(n => n.id);
    localStorage.setItem("readNotifs", JSON.stringify(ids));
    setUnreadNotifs(0);
  };

  const loadAll = async () => {
    let profileData = {};
    let activeSubData = null;
    let wLogs = [];
    let bLogs = [];
    let weeklyCount = 0;
    let subsData = [];
    let unread = 0;
    let expDays = null;

    try {
      const profileRes = await api.get("/api/profile/client");
      profileData = profileRes.data;
      setProfile({
        name: profileRes.data.name || localStorage.getItem("name") || "User",
        weightKg: profileRes.data.weightKg || "--",
        goalType: profileRes.data.goalType || "--",
        heightCm: profileRes.data.heightCm || "--",
        age: profileRes.data.age || "--",
        goalWeight: profileRes.data.goalWeight || null,
      });
    } catch {}

    try {
      const subRes = await api.get("/api/subscriptions/my");
      subsData = subRes.data || [];
      setAllSubs(subsData);
      const accepted = subsData.filter(s => s.status === "ACCEPTED");
      setAcceptedSubs(accepted);
      const firstActive = subsData.find(s => s.status === "ACTIVE");
      activeSubData = firstActive;
      setSubscription(firstActive || accepted[0] || (subsData.length > 0 ? subsData[subsData.length - 1] : null));
      if (firstActive?.endDate) {
        const end = new Date(firstActive.endDate);
        const now = new Date();
        const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff <= 5) {
          expDays = diff;
          setExpiryDays(diff);
          setExpirySubscription(firstActive);
        }
      }
    } catch {}

    try {
      const chatRes = await axios.get(`${API}/chat/unread-count`, { headers: { Authorization: `Bearer ${token}` }});
      unread = chatRes.data.unreadCount || 0;
      setUnreadCount(unread);
    } catch {}

    try {
      const mealRes = await axios.get(`${API}/meal-plans/my-plan/${clientId}`, { headers: { Authorization: `Bearer ${token}` }});
      if (!mealRes.data.message) {
        const items = mealRes.data.items || [];
        setTodayMeals(items.filter(i => i.dayOfWeek === todayNum));
        setTargetCalories(mealRes.data.targetCalories || 0);
      }
    } catch {}

    try {
      const workoutRes = await axios.get(`${API}/workout/my`, { headers: { Authorization: `Bearer ${token}` }});
      const allEx = workoutRes.data.flatMap(p => p.exercises || []);
      setTodayExercises(allEx.filter(e => e.dayOfWeek === todayNum));
    } catch {}

    try {
      const bmiRes = await axios.get(`${API}/bmi/history`, { headers: { Authorization: `Bearer ${token}` }});
      bLogs = bmiRes.data || [];
      setBmiLogs(bLogs);
      if (bLogs.length > 0) setLatestBmi(bLogs[0]);
    } catch {}

    try {
      const wRes = await axios.get(`${API}/weight/history`, { headers: { Authorization: `Bearer ${token}` }});
      wLogs = wRes.data || [];
      setWeightLogs(wLogs);
    } catch {}

    try {
      const statsRes = await api.get("/api/workout-completion/weekly-stats");
      weeklyCount = (statsRes.data || []).reduce((s, d) => s + (d.count || 0), 0);
      setWeeklyWorkouts(weeklyCount);
    } catch {}

    try {
      const completionRes = await api.get("/api/workout-completion/today");
      setTodayCompletions(completionRes.data || []);
    } catch {}

    const earnedBadges = calculateBadges({
      weightLogs: wLogs,
      workoutCompletions: weeklyCount,
      bmiLogs: bLogs,
      goalWeight: profileData.goalWeight,
      subscriptionStartDate: activeSubData?.startDate,
    });
    setBadges(earnedBadges);
    buildNotifications(subsData, wLogs, bLogs, unread, expDays);
    setLoading(false);
  };

  const todayCalories = todayMeals.reduce((sum, i) => sum + i.calories, 0);
  const todayCompleted = todayExercises.filter(ex => todayCompletions.includes(ex.id)).length;
  const earnedBadgesCount = badges.filter(b => b.earned).length;

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE": return "#10b981";
      case "PENDING": return "#f59e0b";
      case "ACCEPTED": return BLUE;
      case "EXPIRED": return "#ef4444";
      default: return "#9ca3af";
    }
  };

  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const diff = Math.floor((new Date() - date) / (1000 * 60));
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#f0f9ff" }}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">💪</div>
          <p className="text-gray-400 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f0f9ff" }}>

      {/* ── HERO ── */}
      <div
        className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.70) 50%, rgba(41,171,226,0.80) 100%), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "200px",
        }}>

        {/* decorative circles */}
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-6 flex-wrap">

            {/* LEFT — greeting */}
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
                Welcome back
              </p>
              <h1 className="text-4xl font-black tracking-tight">
                {profile.name} 👋
              </h1>
              <p className="text-blue-100 mt-1 text-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long", month: "long", day: "numeric"
                })}
              </p>
              {earnedBadgesCount > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-blue-200">
                    🏆 {earnedBadgesCount} badge{earnedBadgesCount !== 1 ? "s" : ""} earned:
                  </span>
                  {badges.filter(b => b.earned).slice(0, 3).map(b => (
                    <span key={b.id} className="text-sm" title={b.label}>{b.icon}</span>
                  ))}
                  {earnedBadgesCount > 3 && (
                    <span className="text-xs text-blue-200">+{earnedBadgesCount - 3} more</span>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT — stat pills (desktop only) */}
            <div className="hidden md:flex flex-col gap-2 items-end">
              <div className="flex gap-2">
                <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                  <p className="text-xs text-blue-200 mb-0.5">Weight</p>
                  <p className="font-bold text-white text-lg leading-none">{profile.weightKg} <span className="text-xs font-normal">kg</span></p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                  <p className="text-xs text-blue-200 mb-0.5">Height</p>
                  <p className="font-bold text-white text-lg leading-none">{profile.heightCm} <span className="text-xs font-normal">cm</span></p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                  <p className="text-xs text-blue-200 mb-0.5">BMI</p>
                  <p className="font-bold text-white text-lg leading-none">{latestBmi ? latestBmi.bmiValue : "--"}</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                  <p className="text-xs text-blue-200 mb-0.5">Goal</p>
                  <p className="font-bold text-white text-sm leading-none">{profile.goalType}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── END HERO ── */}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* EXPIRY BANNER */}
        {expiryDays !== null && expirySubscription && (
          <div className="rounded-2xl shadow-sm border-l-4 p-5"
            style={{ background: expiryDays === 0 ? "#fef2f2" : "#fefce8", borderColor: expiryDays === 0 ? "#ef4444" : "#f59e0b" }}>
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl flex-shrink-0">{expiryDays === 0 ? "🚨" : "⚠️"}</span>
              <div>
                <p className="font-bold text-gray-800">
                  {expiryDays === 0 ? "Your subscription expires today!" : `Expires in ${expiryDays} day${expiryDays !== 1 ? "s" : ""}!`}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Trainer: <strong>{expirySubscription.trainerName}</strong> · Expires: {expirySubscription.endDate}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 ml-9">
              <button
                onClick={() => {
                  Swal.fire({
                    title: "Renew Subscription?",
                    html: `<p style="color:#6b7280;font-size:14px;">A new request will be sent to <strong>${expirySubscription.trainerName}</strong>.</p>`,
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonColor: BLUE,
                    cancelButtonColor: "#6b7280",
                    confirmButtonText: "Yes, Send Request",
                  }).then(async (result) => {
                    if (result.isConfirmed) {
                      try {
                        await api.post(`/api/subscriptions/${expirySubscription.id}/renew`);
                        Swal.fire({ title: "Renewal Requested! 🎉", icon: "success", confirmButtonColor: BLUE });
                        loadAll();
                      } catch (err) {
                        Swal.fire("Error", String(err?.response?.data || "Failed"), "error");
                      }
                    }
                  });
                }}
                className="flex-1 py-2.5 px-4 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                style={{ background: expiryDays === 0 ? "#ef4444" : "#f59e0b" }}>
                🔄 Renew with {expirySubscription.trainerName}
              </button>
              <button
                onClick={() => navigate("/client/trainers")}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 bg-white hover:opacity-80 transition-all"
                style={{ borderColor: expiryDays === 0 ? "#ef4444" : "#f59e0b", color: expiryDays === 0 ? "#ef4444" : "#92400e" }}>
                🔍 Find a New Trainer
              </button>
            </div>
          </div>
        )}

        {/* ACCEPTED BANNERS */}
        {!hasActiveSub && acceptedSubs.map((sub) => (
          <div key={sub.id}
            className="rounded-2xl shadow-sm border-l-4 p-5 flex items-start justify-between gap-4"
            style={{ background: "#f0fdf4", borderColor: "#10b981" }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-bold text-gray-800">{sub.trainerName} accepted your request!</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Complete payment to activate your plan.
                  {sub.trainerPrice && (
                    <span className="ml-1 font-semibold text-green-600">LKR {sub.trainerPrice.toLocaleString()}/month</span>
                  )}
                </p>
              </div>
            </div>
            <button onClick={() => navigate("/client/payments")}
              className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex-shrink-0"
              style={{ background: "#10b981" }}>
              Pay Now 💳
            </button>
          </div>
        ))}

        {/* HAS ACTIVE + other accepted */}
        {hasActiveSub && acceptedSubs.length > 0 && (
          <div className="rounded-2xl shadow-sm border-l-4 p-4 flex items-start gap-3"
            style={{ background: "#fefce8", borderColor: "#f59e0b" }}>
            <span className="text-xl flex-shrink-0">ℹ️</span>
            <div>
              <p className="font-bold text-gray-800 text-sm">
                {acceptedSubs.length} trainer acceptance{acceptedSubs.length > 1 ? "s" : ""} pending payment
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                You have an active subscription with <strong>{subscription?.trainerName}</strong>. You can only pay after it expires on <strong>{subscription?.endDate}</strong>.
              </p>
              <button onClick={() => navigate("/client/payments")}
                className="mt-1.5 text-xs font-semibold hover:underline"
                style={{ color: "#f59e0b" }}>
                Manage subscriptions →
              </button>
            </div>
          </div>
        )}

        {/* TODAY PROGRESS STRIP */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Calories Today", value: todayCalories > 0 ? `${todayCalories} kcal` : "0 kcal", sub: targetCalories > 0 ? `of ${targetCalories} kcal` : "No meal plan yet", icon: "🔥", color: "#ef4444", path: "/client/nutrition" },
            { label: "Exercises Today", value: `${todayCompleted}/${todayExercises.length}`, sub: todayExercises.length === 0 ? "Rest day" : "completed", icon: "💪", color: "#10b981", path: "/client/workout-plan" },
            { label: "Workouts This Week", value: weeklyWorkouts, sub: "exercises done", icon: "📊", color: "#8b5cf6", path: "/client/progress" },
          ].map(({ label, value, sub, icon, color, path }) => (
            <div key={label}
              onClick={() => navigate(path)}
              className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: `${color}20` }}>{icon}</div>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
              <p className="text-xl font-black" style={{ color }}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT 2 COLS */}
          <div className="lg:col-span-2 space-y-6">

            {/* ACHIEVEMENTS */}
            {earnedBadgesCount > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-800">🏆 My Achievements</h3>
                  <span className="text-xs text-gray-400">{earnedBadgesCount}/{badges.length} earned</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${(earnedBadgesCount / badges.length) * 100}%`, background: "linear-gradient(90deg, #f59e0b, #10b981)" }} />
                </div>
                <AchievementBadges badges={badges} showAll={false} />
                <button onClick={() => navigate("/client/progress")}
                  className="mt-3 text-xs font-semibold hover:underline"
                  style={{ color: BLUE }}>
                  View all achievements →
                </button>
              </div>
            )}

            {/* TODAY'S MEALS */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Today's Meals</h3>
                  <p className="text-xs text-gray-400">{DAYS[todayNum - 1]} · {todayCalories} / {targetCalories} kcal</p>
                </div>
                <button onClick={() => navigate("/client/nutrition")}
                  className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                  style={{ background: BLUE }}>
                  View Plan
                </button>
              </div>
              {todayMeals.length === 0 ? (
                <div className="text-center py-8 rounded-xl" style={{ background: BLUE_LIGHT }}>
                  <p className="text-3xl mb-2">🥗</p>
                  <p className="text-sm font-medium" style={{ color: BLUE_DARK }}>No meals planned for today</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {["Breakfast","Lunch","Snack","Dinner"].map((mt) => {
                    const items = todayMeals.filter(i => i.mealTime === mt);
                    if (items.length === 0) return null;
                    const kcal = items.reduce((s, i) => s + i.calories, 0);
                    return (
                      <div key={mt}
                        className="flex justify-between items-center px-4 py-3 rounded-xl"
                        style={{ background: "#f8fafc" }}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{mt === "Breakfast" ? "🌅" : mt === "Lunch" ? "☀️" : mt === "Snack" ? "🍎" : "🌙"}</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{mt}</p>
                            <p className="text-xs text-gray-400">{items.length} foods</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold" style={{ color: BLUE }}>{kcal} kcal</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* TODAY'S WORKOUT */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Today's Workout</h3>
                  <p className="text-xs text-gray-400">{DAYS[todayNum - 1]} · {todayCompleted}/{todayExercises.length} done</p>
                </div>
                <button onClick={() => navigate("/client/workout-plan")}
                  className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                  style={{ background: BLUE }}>
                  View Workout
                </button>
              </div>

              {todayExercises.length > 0 && (
                <div className="mb-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${todayExercises.length > 0 ? (todayCompleted / todayExercises.length) * 100 : 0}%`, background: BLUE }} />
                  </div>
                </div>
              )}

              {todayExercises.length === 0 ? (
                <div className="text-center py-8 rounded-xl" style={{ background: BLUE_LIGHT }}>
                  <p className="text-3xl mb-2">😴</p>
                  <p className="text-sm font-medium" style={{ color: BLUE_DARK }}>Rest day — no workout today!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayExercises.slice(0, 4).map((ex, i) => {
                    const isDone = todayCompletions.includes(ex.id);
                    return (
                      <div key={i}
                        className="flex justify-between items-center px-4 py-3 rounded-xl transition-all"
                        style={{ background: isDone ? BLUE_LIGHT : "#f8fafc", border: isDone ? `1px solid ${BLUE}40` : "1px solid transparent" }}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg text-white text-xs font-bold flex items-center justify-center"
                            style={{ background: isDone ? "#10b981" : BLUE }}>
                            {isDone ? "✓" : i + 1}
                          </div>
                          <p className="text-sm font-semibold text-gray-800">{ex.exerciseName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{ex.sets}×{ex.reps}</span>
                          {isDone && <span className="text-xs font-semibold text-green-500">✓</span>}
                        </div>
                      </div>
                    );
                  })}
                  {todayExercises.length > 4 && (
                    <p className="text-xs text-center" style={{ color: BLUE }}>+{todayExercises.length - 4} more</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COL */}
          <div className="space-y-4">

            {/* SUBSCRIPTION CARD */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">My Subscription</h3>
              {!subscription ? (
                <div className="text-center">
                  <p className="text-4xl mb-2">🏋️</p>
                  <p className="font-semibold text-gray-700 text-sm">No trainer yet</p>
                  <button onClick={() => navigate("/client/trainers")}
                    className="mt-3 w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: BLUE }}>
                    Find a Trainer
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full text-white font-bold text-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: BLUE }}>
                    {subscription.trainerName?.charAt(0)}
                  </div>
                  <p className="font-bold text-gray-800">{subscription.trainerName}</p>
                  <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: getStatusColor(subscription.status) }}>
                    {subscription.status}
                  </span>
                  {subscription.status === "ACTIVE" && (
                    <>
                      <p className="text-xs text-gray-400 mt-1">Until {subscription.endDate}</p>
                      {expiryDays !== null && (
                        <p className="text-xs font-semibold mt-1" style={{ color: expiryDays === 0 ? "#ef4444" : "#f59e0b" }}>
                          {expiryDays === 0 ? "⚠️ Expires today!" : `⚠️ ${expiryDays} days left`}
                        </p>
                      )}
                    </>
                  )}
                  <button onClick={() => navigate("/client/payments")}
                    className="mt-3 w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: BLUE }}>
                    {subscription.status === "ACCEPTED" ? "Pay Now 💳" : subscription.status === "EXPIRED" ? "Renew Plan" : "View Payments"}
                  </button>
                </div>
              )}
            </div>

            {/* CHAT */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-500">Messages</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs text-white font-bold" style={{ background: "#ef4444" }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button onClick={() => navigate("/client/chat")}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: BLUE }}>
                💬 Chat with Trainer
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </button>
            </div>

            {/* BMI */}
            {latestBmi && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Latest BMI</h3>
                <div className="text-center">
                  <p className="text-3xl font-bold" style={{ color: BLUE }}>{latestBmi.bmiValue}</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                    latestBmi.category === "Normal Weight" ? "bg-green-100 text-green-700"
                    : latestBmi.category === "Underweight" ? "bg-blue-100 text-blue-700"
                    : latestBmi.category === "Overweight" ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                  }`}>
                    {latestBmi.category}
                  </span>
                  <button onClick={() => navigate("/client/bmi")}
                    className="mt-3 w-full py-2 rounded-xl text-xs font-semibold border transition"
                    style={{ borderColor: BLUE, color: BLUE }}>
                    Update BMI
                  </button>
                </div>
              </div>
            )}

            {/* QUICK ACTIONS */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: "📊 View Progress", path: "/client/progress" },
                  { label: "⚖️ Log Weight", path: "/client/progress" },
                  { label: "🎯 Goal Predictor", path: "/goal-predictor" },
                  { label: "👤 Edit Profile", path: "/client/profile" },
                  { label: "💳 Payments", path: "/client/payments" },
                ].map(({ label, path }) => (
                  <button key={label}
                    onClick={() => navigate(path)}
                    className="w-full py-2.5 rounded-xl text-sm font-medium text-left px-4 transition hover:opacity-90"
                    style={{ background: BLUE_LIGHT, color: BLUE_DARK }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}