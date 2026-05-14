import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ReferenceLine,
} from "recharts";
import api from "../../api/api";
import AchievementBadges, { calculateBadges } from "../../components/AchievementBadges";

const API        = "http://localhost:8080/api";
const TEAL       = "#14b8a6";
const TEAL_DARK  = "#0d9488";
const TEAL_LIGHT = "#f0fdfa";
const NAVY       = "#0A2342";

export default function TrainerClientProgress() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [bmiLogs, setBmiLogs] = useState([]);
  const [workoutStats, setWorkoutStats] = useState([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState("weight");

  const selectClient = async (client) => {
    setSelectedClient(client);
    setLoadingData(true);
    setActiveTab("weight");
    try {
      const [wRes, bRes, profileRes, workoutRes] = await Promise.all([
        axios.get(`${API}/weight/history/${client.clientId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API}/bmi/history/${client.clientId}`,   { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        api.get(`/api/profile/client/${client.clientId}`).catch(() => ({ data: {} })),
        axios.get(`${API}/workout-completion/client/${client.clientId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: {} })),
      ]);
      const wLogs   = [...(wRes.data || [])].sort((a, b) => new Date(a.loggedAt || a.logDate) - new Date(b.loggedAt || b.logDate));
      const bLogs   = bRes.data || [];
      const profile = profileRes.data || {};
      const byDate  = workoutRes.data || {};
      const total   = Object.values(byDate).reduce((s, v) => s + Number(v), 0);
      setWeightLogs(wLogs); setBmiLogs(bLogs); setClientProfile(profile); setTotalWorkouts(total);
      const stats = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        stats.push({ day: d.toLocaleDateString("en-US", { weekday: "short" }), count: byDate[key] || 0 });
      }
      setWorkoutStats(stats);
      setBadges(calculateBadges({ weightLogs: wLogs, workoutCompletions: total, bmiLogs: bLogs, goalWeight: profile.goalWeight, subscriptionStartDate: client.startDate }));
    } catch {}
    setLoadingData(false);
  };

  // ✅ Moved above useEffect
  const loadClients = async () => {
    try {
      const res = await api.get("/api/subscriptions/clients");
      setClients(res.data);
      if (res.data.length > 0) selectClient(res.data[0]);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadClients(); }, []);

  const weightChartData = weightLogs.map(log => ({
    date: new Date(log.loggedAt || log.logDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: log.weightKg, goal: clientProfile?.goalWeight || null,
  }));

  const bmiChartData = [...bmiLogs].reverse().map(log => ({
    date: new Date(log.recordedAt || log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    bmi: log.bmiValue,
  }));

  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weightKg : clientProfile?.weightKg;
  const startWeight   = weightLogs.length > 0 ? weightLogs[0].weightKg : null;
  const weightChange  = startWeight && currentWeight ? (currentWeight - startWeight).toFixed(1) : null;
  const latestBmi     = bmiLogs.length > 0 ? bmiLogs[0].bmiValue : null;
  const goalWeight    = clientProfile?.goalWeight;
  const goalProgress  = goalWeight && startWeight && currentWeight
    ? Math.min(Math.round(Math.abs(startWeight - currentWeight) / Math.abs(startWeight - goalWeight) * 100), 100) : 0;
  const earnedBadgesCount = badges.filter(b => b.earned).length;

  const getBmiColor = (bmi) => { if (!bmi) return "#9ca3af"; if (bmi < 18.5) return "#3b82f6"; if (bmi < 25) return "#22c55e"; if (bmi < 30) return "#f97316"; return "#ef4444"; };
  const getBmiLabel = (bmi) => { if (!bmi) return "—"; if (bmi < 18.5) return "Underweight"; if (bmi < 25) return "Normal"; if (bmi < 30) return "Overweight"; return "Obese"; };
  const getLastActiveText = () => {
    if (weightLogs.length === 0) return "No activity";
    const last = new Date(weightLogs[weightLogs.length - 1].loggedAt || weightLogs[weightLogs.length - 1].logDate);
    const days = Math.floor((new Date() - last) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Active today"; if (days === 1) return "Active yesterday"; return `Last active ${days} days ago`;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#f0fdf4" }}>
      <div className="text-center"><div className="text-5xl mb-4 animate-bounce">📊</div><p className="text-gray-400 animate-pulse">Loading clients...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "#f0fdf4" }}>
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(20,184,166,0.80) 100%), url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "180px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div>
            <button onClick={() => navigate("/trainer/dashboard")} className="flex items-center gap-1 text-teal-200 text-xs font-medium mb-3 hover:text-white transition-colors">← Back to Dashboard</button>
            <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Analytics</p>
            <h1 className="text-4xl font-black tracking-tight">Progress Monitor 📊</h1>
            <p className="text-teal-100 mt-1 text-sm">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
            <p className="text-teal-200 text-sm mt-1">{clients.length} active client{clients.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="hidden md:block bg-white/15 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 text-center">
            <p className="text-xs text-teal-200 mb-1">Clients Tracked</p>
            <p className="text-4xl font-black text-white">{clients.length}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {clients.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-gray-500 font-semibold">No active clients yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* CLIENT LIST */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h3 className="font-bold text-gray-500 mb-4 text-xs uppercase tracking-wide">Active Clients ({clients.length})</h3>
              <div className="space-y-2">
                {clients.map(c => {
                  const isSel = selectedClient?.clientId === c.clientId;
                  return (
                    <div key={c.id} onClick={() => selectClient(c)}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                      style={{ background: isSel ? TEAL_LIGHT : "transparent", border: isSel ? `1px solid ${TEAL}40` : "1px solid transparent" }}>
                      {/* ✅ Client photo in sidebar list */}
                      {c.clientProfileImage ? (
                        <img src={c.clientProfileImage} alt={c.clientName}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2" style={{ borderColor: isSel ? TEAL : "#e5e7eb" }} />
                      ) : (
                        <div className="w-10 h-10 rounded-full text-white font-bold text-sm flex items-center justify-center flex-shrink-0" style={{ background: TEAL }}>
                          {c.clientName?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{c.clientName}</p>
                        <p className="text-xs text-gray-400">Since {c.startDate}</p>
                      </div>
                      {isSel && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TEAL }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="lg:col-span-3 space-y-5">
              {selectedClient && (
                <>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {/* ✅ Client photo in header */}
                        {clientProfile?.profileImage ? (
                          <img src={clientProfile.profileImage} alt={selectedClient.clientName}
                            className="w-16 h-16 rounded-2xl object-cover border-2" style={{ borderColor: TEAL_LIGHT }} />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl text-white font-bold text-2xl flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${NAVY}, ${TEAL})` }}>
                            {selectedClient.clientName?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h2 className="font-bold text-gray-800 text-lg">{selectedClient.clientName}</h2>
                          <p className="text-sm text-gray-500">{selectedClient.clientEmail}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: TEAL }}>✓ Active</span>
                            <span className="text-xs text-gray-400">{getLastActiveText()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/trainer/client/${selectedClient.clientId}`)}
                          className="px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: TEAL }}>View Details</button>
                        <button onClick={() => navigate("/trainer/chat")}
                          className="px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: "#8b5cf6" }}>💬 Chat</button>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Achievements ({earnedBadgesCount}/{badges.length})</p>
                      </div>
                      <AchievementBadges badges={badges} showAll={false} />
                    </div>
                  </div>

                  {loadingData ? (
                    <div className="bg-white rounded-2xl p-12 text-center">
                      <div className="w-8 h-8 rounded-full border-4 animate-spin mx-auto mb-3" style={{ borderColor: TEAL, borderTopColor: "transparent" }} />
                      <p className="text-gray-400">Loading progress data...</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Current Weight", value: currentWeight ? `${currentWeight} kg` : "—", icon: "⚖️", color: TEAL },
                          { label: "Weight Change",  value: weightChange  ? `${weightChange > 0 ? "+" : ""}${weightChange} kg` : "—", icon: weightChange < 0 ? "📉" : "📈", color: weightChange < 0 ? "#10b981" : "#ef4444" },
                          { label: "Latest BMI",     value: latestBmi    ? Number(latestBmi).toFixed(1) : "—", icon: "💪", color: getBmiColor(latestBmi), sub: getBmiLabel(latestBmi) },
                          { label: "Workouts Done",  value: totalWorkouts, icon: "🏋️", color: "#8b5cf6" },
                        ].map(({ label, value, icon, color, sub }) => (
                          <div key={label} className="bg-white rounded-2xl shadow-sm p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg mb-2" style={{ background: `${color}20` }}>{icon}</div>
                            <p className="text-lg font-bold" style={{ color }}>{value}</p>
                            {sub && <p className="text-xs font-medium" style={{ color }}>{sub}</p>}
                            <p className="text-xs text-gray-400">{label}</p>
                          </div>
                        ))}
                      </div>

                      {goalWeight && startWeight && (
                        <div className="bg-white rounded-2xl shadow-sm p-5">
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-bold text-gray-800">🎯 Goal Progress</p>
                            <span className="text-sm font-bold" style={{ color: goalProgress >= 100 ? "#22c55e" : TEAL }}>{goalProgress}%</span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${goalProgress}%`, background: goalProgress >= 100 ? "#22c55e" : `linear-gradient(90deg, ${TEAL_DARK}, ${TEAL})` }} />
                          </div>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Start: {startWeight} kg</span><span>Current: {currentWeight} kg</span><span>Goal: {goalWeight} kg</span>
                          </div>
                        </div>
                      )}

                      {clientProfile && (
                        <div className="bg-white rounded-2xl shadow-sm p-5">
                          <p className="font-bold text-gray-800 mb-3">👤 Client Information</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { label: "Age",    value: clientProfile.age      ? `${clientProfile.age} yrs`      : "—" },
                              { label: "Gender", value: clientProfile.gender   || "—"                                   },
                              { label: "Height", value: clientProfile.heightCm ? `${clientProfile.heightCm} cm`  : "—" },
                              { label: "Goal",   value: clientProfile.goalType || "—"                                   },
                            ].map(item => (
                              <div key={item.label} className="p-3 rounded-xl" style={{ background: TEAL_LIGHT }}>
                                <p className="text-xs text-gray-400">{item.label}</p>
                                <p className="font-semibold text-gray-800 text-sm mt-0.5">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex border-b border-gray-100">
                          {[
                            { id: "weight", label: "📈 Weight" }, { id: "bmi", label: "💪 BMI" },
                            { id: "workout", label: "🏋️ Workouts" }, { id: "badges", label: "🏆 Badges" },
                          ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                              className="flex-1 py-3 text-xs font-semibold transition-all"
                              style={{ borderBottom: activeTab === tab.id ? `2px solid ${TEAL}` : "2px solid transparent", color: activeTab === tab.id ? TEAL : "#9ca3af", background: activeTab === tab.id ? TEAL_LIGHT : "white" }}>
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        <div className="p-6">
                          {activeTab === "weight" && (
                            <>
                              <div className="flex justify-between items-center mb-4">
                                <div><h3 className="font-bold text-gray-800">Weight Progress</h3><p className="text-xs text-gray-400">{weightChartData.length} entries logged</p></div>
                                {weightChange && <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: weightChange < 0 ? "#10b981" : "#ef4444" }}>{weightChange > 0 ? "+" : ""}{weightChange} kg</span>}
                              </div>
                              {weightChartData.length < 2 ? (
                                <div className="text-center py-12 rounded-xl" style={{ background: TEAL_LIGHT }}><p className="text-3xl mb-2">⚖️</p><p className="text-sm" style={{ color: TEAL_DARK }}>No weight logs yet</p></div>
                              ) : (
                                <ResponsiveContainer width="100%" height={250}>
                                  <AreaChart data={weightChartData}>
                                    <defs><linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={TEAL} stopOpacity={0.3} /><stop offset="95%" stopColor={TEAL} stopOpacity={0} /></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                                    <YAxis domain={["auto","auto"]} tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={v => `${v}kg`} />
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} formatter={(v, n) => [`${v} kg`, n === "weight" ? "Weight" : "Goal"]} />
                                    <Area type="monotone" dataKey="weight" stroke={TEAL} strokeWidth={2.5} fill="url(#wGrad)" dot={{ fill: TEAL, r: 4 }} activeDot={{ r: 6 }} name="weight" />
                                    {goalWeight && <ReferenceLine y={goalWeight} stroke="#22c55e" strokeDasharray="6 4" label={{ value: `Goal: ${goalWeight}kg`, fill: "#22c55e", fontSize: 11 }} />}
                                  </AreaChart>
                                </ResponsiveContainer>
                              )}
                            </>
                          )}

                          {activeTab === "bmi" && (
                            <>
                              <div className="flex justify-between items-center mb-4">
                                <div><h3 className="font-bold text-gray-800">BMI History</h3><p className="text-xs text-gray-400">{bmiChartData.length} measurements</p></div>
                                {latestBmi && <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: getBmiColor(latestBmi) }}>{getBmiLabel(latestBmi)}</span>}
                              </div>
                              {bmiChartData.length < 2 ? (
                                <div className="text-center py-12 rounded-xl" style={{ background: TEAL_LIGHT }}><p className="text-3xl mb-2">📊</p><p className="text-sm" style={{ color: TEAL_DARK }}>No BMI logs yet</p></div>
                              ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                  <LineChart data={bmiChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                                    <YAxis domain={["auto","auto"]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} formatter={v => [`${v}`, "BMI"]} />
                                    <ReferenceLine y={18.5} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: "18.5", fontSize: 10, fill: "#3b82f6" }} />
                                    <ReferenceLine y={25}   stroke="#22c55e" strokeDasharray="4 4" label={{ value: "25",   fontSize: 10, fill: "#22c55e" }} />
                                    <ReferenceLine y={30}   stroke="#f97316" strokeDasharray="4 4" label={{ value: "30",   fontSize: 10, fill: "#f97316" }} />
                                    <Line type="monotone" dataKey="bmi" stroke={TEAL} strokeWidth={2.5} dot={{ fill: TEAL, r: 4 }} activeDot={{ r: 6 }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              )}
                            </>
                          )}

                          {activeTab === "workout" && (
                            <>
                              <div className="flex justify-between items-center mb-4">
                                <div><h3 className="font-bold text-gray-800">Workout Activity</h3><p className="text-xs text-gray-400">Last 7 days</p></div>
                                <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: "#8b5cf6" }}>{totalWorkouts} total</span>
                              </div>
                              <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={workoutStats}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} formatter={v => [`${v} exercises`, "Completed"]} />
                                  <Bar dataKey="count" fill="#8b5cf6" radius={[6,6,0,0]} />
                                </BarChart>
                              </ResponsiveContainer>
                              <div className="grid grid-cols-3 gap-3 mt-4">
                                {[
                                  { label: "This Week",   value: workoutStats.reduce((s, d) => s + d.count, 0), color: "#8b5cf6" },
                                  { label: "Active Days", value: workoutStats.filter(d => d.count > 0).length,  color: TEAL      },
                                  { label: "Best Day",    value: Math.max(...workoutStats.map(d => d.count), 0), color: "#f59e0b" },
                                ].map(s => (
                                  <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: `${s.color}15` }}>
                                    <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                                    <p className="text-xs text-gray-400">{s.label}</p>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          {activeTab === "badges" && (
                            <>
                              <div className="flex justify-between items-center mb-4">
                                <div><h3 className="font-bold text-gray-800">Achievement Badges</h3><p className="text-xs text-gray-400">{earnedBadgesCount} of {badges.length} earned</p></div>
                                <span className="text-2xl">🏆</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                                <div className="h-full rounded-full" style={{ width: `${(earnedBadgesCount / badges.length) * 100}%`, background: `linear-gradient(90deg, #f59e0b, ${TEAL})` }} />
                              </div>
                              <AchievementBadges badges={badges} showAll={true} />
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}