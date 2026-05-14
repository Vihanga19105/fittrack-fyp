import { useEffect, useState, useRef } from "react";
import axios from "axios";
import api from "../../api/api";
import Swal from "sweetalert2";
import {
  LineChart, Line, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, PieChart, Pie, Cell,
} from "recharts";

const API       = "http://localhost:8080/api";
const BLUE      = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT= "#E8F7FD";

export default function ClientProgress() {
  const token = localStorage.getItem("token");
  const fileInputRef = useRef(null);

  const [profile,     setProfile]     = useState({ weightKg: null, goalType: "--", heightCm: null, age: null, goalWeight: null });
  const [logs,        setLogs]        = useState([]);
  const [bmiLogs,     setBmiLogs]     = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [photos,      setPhotos]      = useState([]);
  const [weightInput, setWeightInput] = useState("");
  const [noteInput,   setNoteInput]   = useState("");
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("weight");

  // photo state
  const [photoPreview,   setPhotoPreview]   = useState(null);
  const [photoDate,      setPhotoDate]      = useState(new Date().toISOString().split("T")[0]);
  const [photoNote,      setPhotoNote]      = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhoto,  setSelectedPhoto]  = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const r = await api.get("/api/profile/client");
      setProfile({ weightKg: r.data.weightKg || null, goalType: r.data.goalType || "--", heightCm: r.data.heightCm || null, age: r.data.age || null, goalWeight: r.data.goalWeight || null });
    } catch {}
    try { const r = await axios.get(`${API}/weight/history`, { headers: { Authorization: `Bearer ${token}` } }); setLogs(r.data); } catch {}
    try { const r = await axios.get(`${API}/bmi/history`,   { headers: { Authorization: `Bearer ${token}` } }); setBmiLogs(r.data); } catch {}
    try { const r = await api.get("/api/workout-completion/weekly-stats"); setWeeklyStats(r.data); } catch {}
    try { const r = await api.get("/api/progress-photos"); setPhotos(r.data); } catch {}
    setLoading(false);
  };

  // ── weight helpers ──
  const daysSince = () => { if (!logs.length) return null; return Math.floor((new Date() - new Date(logs[logs.length - 1].loggedAt)) / 86400000); };
  const daysSinceLastLog  = daysSince();
  const needsWeightUpdate = daysSinceLastLog !== null && daysSinceLastLog >= 14;
  const currentWeight     = logs.length > 0 ? logs[logs.length - 1].weightKg : profile.weightKg;
  const startWeight       = logs.length > 0 ? logs[0].weightKg : null;
  const weightChange      = startWeight && currentWeight ? (currentWeight - startWeight).toFixed(1) : null;
  const goalWeight        = profile.goalWeight;
  const goalProgress      = goalWeight && startWeight && currentWeight ? Math.min(Math.round(Math.abs(startWeight - currentWeight) / Math.abs(startWeight - goalWeight) * 100), 100) : 0;
  const distanceToGoal    = goalWeight && currentWeight ? Math.abs(currentWeight - goalWeight).toFixed(1) : null;
  const isNearGoal        = distanceToGoal !== null && distanceToGoal <= 2;
  const isGoalReached     = distanceToGoal !== null && distanceToGoal <= 0.5;

  const handleLogWeight = async () => {
    if (!weightInput) return;
    setSaving(true);
    try {
      await axios.post(`${API}/weight/log`, { weightKg: parseFloat(weightInput), note: noteInput }, { headers: { Authorization: `Bearer ${token}` } });
      const nw = parseFloat(weightInput);
      setWeightInput(""); setNoteInput("");
      await loadAll();
      if (goalWeight) {
        const dist = Math.abs(nw - goalWeight);
        if (dist <= 0.5) Swal.fire({ title: "🏆 Goal Reached!", html: `<p>You've reached your goal of <strong>${goalWeight} kg</strong>! 🎉</p>`, icon: "success", confirmButtonColor: BLUE });
        else if (dist <= 2) Swal.fire({ title: "🎯 Almost There!", html: `<p>Only <strong>${dist.toFixed(1)} kg</strong> away!</p>`, icon: "success", confirmButtonColor: BLUE });
      }
    } catch { Swal.fire("Error", "Failed to log weight", "error"); }
    setSaving(false);
  };

  const handleDeleteLog = async (id) => {
    const r = await Swal.fire({ title: "Delete this log?", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280", confirmButtonText: "Delete" });
    if (!r.isConfirmed) return;
    try { await axios.delete(`${API}/weight/${id}`, { headers: { Authorization: `Bearer ${token}` } }); loadAll(); } catch {}
  };

  // ── photo handlers ──
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { Swal.fire("Error", "Photo must be less than 3MB", "error"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    if (!photoPreview) { Swal.fire("", "Please select a photo first", "warning"); return; }
    setUploadingPhoto(true);
    try {
      await api.post("/api/progress-photos", { photo: photoPreview, note: photoNote, photoDate });
      setPhotoPreview(null); setPhotoNote(""); setPhotoDate(new Date().toISOString().split("T")[0]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadAll();
      Swal.fire({ title: "Photo Uploaded! 📸", icon: "success", timer: 1500, showConfirmButton: false });
    } catch { Swal.fire("Error", "Failed to upload photo", "error"); }
    setUploadingPhoto(false);
  };

  const handlePhotoDelete = async (id) => {
    const r = await Swal.fire({ title: "Delete this photo?", text: "This cannot be undone", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280", confirmButtonText: "Delete" });
    if (!r.isConfirmed) return;
    try { await api.delete(`/api/progress-photos/${id}`); setSelectedPhoto(null); loadAll(); }
    catch { Swal.fire("Error", "Failed to delete photo", "error"); }
  };

  // ── chart data ──
  const weightChartData  = logs.map(l => ({ date: new Date(l.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }), weight: l.weightKg, goal: goalWeight ? parseFloat(goalWeight) : null }));
  const bmiChartData     = bmiLogs.map(l => ({ date: new Date(l.recordedAt || l.createdAt || l.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }), bmi: l.bmiValue }));
  const workoutChartData = weeklyStats.map(d => ({ day: d.dayName, exercises: d.count }));
  const getBmiColor      = (b) => b < 18.5 ? "#3b82f6" : b < 25 ? "#22c55e" : b < 30 ? "#f97316" : "#ef4444";
  const latestBmi        = bmiLogs.length > 0 ? bmiLogs[0].bmiValue : null;
  const totalWeekly      = weeklyStats.reduce((s, d) => s + d.count, 0);
  const activeDays       = weeklyStats.filter(d => d.count > 0).length;
  const bestDay          = weeklyStats.length > 0 ? Math.max(...weeklyStats.map(d => d.count)) : 0;
  const goalPieData      = [{ name: "Completed", value: goalProgress, fill: BLUE }, { name: "Remaining", value: 100 - goalProgress, fill: "#e5e7eb" }];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#f0f9ff" }}>
      <div className="text-center"><div className="text-5xl mb-4 animate-bounce">📊</div><p className="text-gray-400 animate-pulse">Loading your progress...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#f0f9ff" }}>

      {/* HERO */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{ backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.70) 50%, rgba(41,171,226,0.80) 100%), url('https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1400&q=80')`, backgroundSize: "cover", backgroundPosition: "center", minHeight: "200px" }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">My Progress</p>
            <h1 className="text-4xl font-black tracking-tight">Progress Tracking 📊</h1>
            <p className="text-blue-100 mt-1 text-sm">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
            <p className="text-blue-200 text-sm mt-1">Track your weight, BMI, workouts and progress photos</p>
          </div>
          <div className="hidden md:flex gap-2 flex-wrap">
            {[
              { label: "Current",  value: currentWeight ? `${currentWeight} kg` : "--" },
              { label: "Goal",     value: goalWeight    ? `${goalWeight} kg`    : "--" },
              { label: "BMI",      value: latestBmi     || "--"                        },
              { label: "Progress", value: `${goalProgress}%`                           },
              { label: "Photos",   value: photos.length                                },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                <p className="text-xs text-blue-200 mb-0.5">{label}</p>
                <p className="font-bold text-white text-lg leading-none">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* BANNERS */}
        {needsWeightUpdate && (
          <div className="bg-white rounded-2xl shadow-sm border-l-4 p-4 flex items-center justify-between gap-4" style={{ borderColor: "#f59e0b" }}>
            <div className="flex items-center gap-3"><span className="text-2xl">⚠️</span>
              <div><p className="font-bold text-gray-800 text-sm">Time to update your weight!</p><p className="text-xs text-gray-500 mt-0.5">You haven't logged in <strong>{daysSinceLastLog} days</strong>.</p></div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0" style={{ background: "#fef3c7", color: "#92400e" }}>{daysSinceLastLog}d ago</span>
          </div>
        )}
        {isGoalReached && (
          <div className="rounded-2xl p-5 text-white text-center" style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
            <p className="text-3xl mb-2">🏆</p><p className="text-xl font-black">Goal Achieved!</p>
            <p className="text-green-100 text-sm mt-1">You've reached your goal weight of {goalWeight} kg!</p>
          </div>
        )}
        {isNearGoal && !isGoalReached && (
          <div className="bg-white rounded-2xl shadow-sm border-l-4 p-4" style={{ borderColor: "#10b981" }}>
            <div className="flex items-center gap-3"><span className="text-2xl">🎯</span>
              <p className="text-sm text-gray-700">Only <strong className="text-green-600">{distanceToGoal} kg</strong> away from your goal of {goalWeight} kg. Keep pushing! 💪</p>
            </div>
          </div>
        )}

        {/* STAT CARDS + PIE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[
              { label: "Current Weight", value: currentWeight ? `${currentWeight} kg` : "—",                                              icon: "⚖️", color: BLUE      },
              { label: "Goal Weight",    value: goalWeight    ? `${goalWeight} kg`    : "Not set",                                        icon: "🎯", color: "#10b981" },
              { label: "Total Change",   value: weightChange  ? `${weightChange > 0 ? "+" : ""}${weightChange} kg` : "—",                icon: weightChange < 0 ? "📉" : "📈", color: weightChange < 0 ? "#10b981" : "#ef4444" },
              { label: "Latest BMI",     value: latestBmi     ? latestBmi.toFixed(1)  : "—",                                             icon: "💪", color: latestBmi ? getBmiColor(latestBmi) : BLUE },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${color}20` }}>{icon}</div>
                <div><p className="text-xs text-gray-500">{label}</p><p className="font-bold text-gray-800 text-lg leading-tight">{value}</p></div>
              </div>
            ))}
            {goalWeight && logs.length > 0 && (
              <div className="col-span-2 bg-white rounded-2xl shadow-sm p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-800">🏁 Goal Progress</h3>
                  <span className="text-sm font-bold" style={{ color: goalProgress >= 100 ? "#22c55e" : BLUE }}>{goalProgress}%</span>
                </div>
                <div className="h-4 rounded-full bg-gray-100 overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${goalProgress}%`, background: goalProgress >= 100 ? "#22c55e" : `linear-gradient(90deg, ${BLUE_DARK}, ${BLUE})` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400"><span>Start: {startWeight} kg</span><span>Goal: {goalWeight} kg</span></div>
              </div>
            )}
          </div>
          {goalWeight && (
            <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center justify-center">
              <h3 className="font-bold text-gray-800 mb-2 self-start">Goal Achievement</h3>
              <PieChart width={180} height={180}>
                <Pie data={goalPieData} cx={90} cy={90} innerRadius={55} outerRadius={80} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                  {goalPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
              </PieChart>
              <div className="text-center -mt-2">
                <p className="text-3xl font-black" style={{ color: BLUE }}>{goalProgress}%</p>
                <p className="text-xs text-gray-400">to goal</p>
              </div>
              {distanceToGoal && <p className="text-xs text-gray-500 mt-2 text-center">{distanceToGoal} kg remaining</p>}
            </div>
          )}
        </div>

        {/* LOG WEIGHT */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">➕ Log Today's Weight</h3>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[140px]">
              <input type="number" placeholder="Weight (kg)" value={weightInput} onChange={e => setWeightInput(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none pr-12 transition-all"
                onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">kg</span>
            </div>
            <input type="text" placeholder="Note (optional)" value={noteInput} onChange={e => setNoteInput(e.target.value)}
              className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none min-w-[140px]"
              onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
            <button onClick={handleLogWeight} disabled={saving || !weightInput}
              className="px-6 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-all" style={{ background: BLUE }}>
              {saving ? "Saving..." : "Log Weight"}
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { id: "weight",  label: "⚖️ Weight"   },
              { id: "bmi",     label: "💪 BMI"       },
              { id: "workout", label: "🏋️ Workouts"  },
              { id: "photos",  label: `📸 Photos${photos.length > 0 ? ` (${photos.length})` : ""}` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-3 text-sm font-semibold transition-all"
                style={{ borderBottom: activeTab === tab.id ? `2px solid ${BLUE}` : "2px solid transparent", color: activeTab === tab.id ? BLUE : "#9ca3af", background: activeTab === tab.id ? BLUE_LIGHT : "white" }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* WEIGHT */}
            {activeTab === "weight" && (
              <>
                <h3 className="font-bold text-gray-800 mb-4">Weight Progress</h3>
                {weightChartData.length < 2 ? (
                  <div className="text-center py-16 rounded-xl" style={{ background: BLUE_LIGHT }}><p className="text-4xl mb-3">📈</p><p className="font-semibold" style={{ color: BLUE_DARK }}>Log at least 2 entries to see chart</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={weightChartData}>
                      <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BLUE} stopOpacity={0.3}/><stop offset="95%" stopColor={BLUE} stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }}/>
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={v => `${v}kg`}/>
                      <Tooltip formatter={(v, n) => [`${v} kg`, n === "weight" ? "Weight" : "Goal"]}/>
                      <Area type="monotone" dataKey="weight" stroke={BLUE} strokeWidth={2.5} fill="url(#wg)" dot={{ fill: BLUE, r: 4 }} activeDot={{ r: 6 }}/>
                      {goalWeight && <Line type="monotone" dataKey="goal" stroke="#22c55e" strokeWidth={2} strokeDasharray="6 4" dot={false}/>}
                      {goalWeight && <ReferenceLine y={parseFloat(goalWeight)} stroke="#22c55e" strokeDasharray="6 4" label={{ value: `Goal: ${goalWeight}kg`, fill: "#22c55e", fontSize: 11 }}/>}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </>
            )}

            {/* BMI */}
            {activeTab === "bmi" && (
              <>
                <h3 className="font-bold text-gray-800 mb-4">BMI History</h3>
                {bmiChartData.length === 0 ? (
  <div className="text-center py-16 rounded-xl" style={{ background: BLUE_LIGHT }}>
    <p className="text-4xl mb-3">💪</p>
    <p className="font-semibold" style={{ color: BLUE_DARK }}>No BMI readings yet</p>
  </div>
) : bmiChartData.length === 1 ? (
  <div className="p-5 rounded-xl mb-4" style={{ background: BLUE_LIGHT }}>
    <p className="text-xs text-gray-400 mb-1">Your BMI reading</p>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-3xl font-black" style={{ color: BLUE }}>{bmiChartData[0].bmi}</p>
        <p className="text-sm font-semibold mt-1" style={{ color: getBmiColor(bmiChartData[0].bmi) }}>
          {bmiLogs[0].category}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{bmiChartData[0].date}</p>
      </div>
      <div className="text-5xl">💪</div>
    </div>
    <p className="text-xs text-gray-400 mt-3">Log another BMI reading to see your progress chart</p>
  </div>
) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={bmiChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }}/>
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} domain={["auto","auto"]}/>
                      <Tooltip formatter={v => [`${v}`, "BMI"]}/>
                      <ReferenceLine y={18.5} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: "18.5", fontSize: 10, fill: "#3b82f6" }}/>
                      <ReferenceLine y={25}   stroke="#22c55e" strokeDasharray="4 4" label={{ value: "25",   fontSize: 10, fill: "#22c55e" }}/>
                      <ReferenceLine y={30}   stroke="#f97316" strokeDasharray="4 4" label={{ value: "30",   fontSize: 10, fill: "#f97316" }}/>
                      <Line type="monotone" dataKey="bmi" stroke={BLUE} strokeWidth={2.5} dot={{ fill: BLUE, r: 4 }} activeDot={{ r: 6 }}/>
                    </LineChart>
                  </ResponsiveContainer>
                )}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[{ label: "Underweight", range: "< 18.5", color: "#3b82f6" }, { label: "Normal", range: "18.5–25", color: "#22c55e" }, { label: "Overweight", range: "25–30", color: "#f97316" }, { label: "Obese", range: "> 30", color: "#ef4444" }].map(z => (
                    <div key={z.label} className="text-center p-2 rounded-xl" style={{ background: `${z.color}15` }}>
                      <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ background: z.color }}/><p className="text-xs font-semibold" style={{ color: z.color }}>{z.label}</p><p className="text-xs text-gray-400">{z.range}</p>
                    </div>
                  ))}
                </div>
                {latestBmi && (
                  <div className="mt-4 p-4 rounded-xl" style={{ background: "#f9fafb" }}>
                    <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-2">
                      <div style={{ width: "20%", background: "#3b82f6" }} className="rounded-l-full"/><div style={{ width: "25%", background: "#22c55e" }}/><div style={{ width: "20%", background: "#f59e0b" }}/><div style={{ width: "35%", background: "#ef4444" }} className="rounded-r-full"/>
                    </div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: getBmiColor(latestBmi) }}/><p className="text-xs font-semibold text-gray-600">Your BMI: <span style={{ color: getBmiColor(latestBmi) }}>{latestBmi}</span></p></div>
                  </div>
                )}
              </>
            )}

            {/* WORKOUT */}
            {activeTab === "workout" && (
              <>
                <h3 className="font-bold text-gray-800 mb-4">Weekly Workout Completion</h3>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="text-center p-3 rounded-xl" style={{ background: BLUE_LIGHT }}><p className="text-2xl font-black" style={{ color: BLUE }}>{totalWeekly}</p><p className="text-xs text-gray-400">This week</p></div>
                  <div className="text-center p-3 rounded-xl" style={{ background: "#f0fdf4" }}><p className="text-2xl font-black text-green-500">{activeDays}</p><p className="text-xs text-gray-400">Active days</p></div>
                  <div className="text-center p-3 rounded-xl" style={{ background: "#fef3c7" }}><p className="text-2xl font-black text-yellow-500">{bestDay}</p><p className="text-xs text-gray-400">Best day</p></div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={workoutChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/><XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }}/><YAxis tick={{ fontSize: 11, fill: "#9ca3af" }}/>
                    <Tooltip formatter={v => [`${v} exercises`, "Completed"]}/><Bar dataKey="exercises" fill={BLUE} radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-5"><h4 className="font-bold text-gray-700 text-sm mb-3">Daily Activity</h4>
                  <div className="grid grid-cols-7 gap-2">{workoutChartData.map((d, i) => (
                    <div key={i} className="text-center">
                      <div className="w-full aspect-square rounded-xl flex items-center justify-center text-sm font-bold mb-1" style={{ background: d.exercises > 0 ? BLUE : "#f1f5f9", color: d.exercises > 0 ? "white" : "#9ca3af" }}>{d.exercises > 0 ? d.exercises : "—"}</div>
                      <p className="text-xs text-gray-400">{d.day?.slice(0,3)}</p>
                    </div>
                  ))}</div>
                </div>
              </>
            )}

            {/* ══ PHOTOS TAB ══ */}
            {activeTab === "photos" && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-gray-800">Progress Photos 📸</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Track your body changes over time — optional but powerful!</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: BLUE_LIGHT, color: BLUE_DARK }}>
                    {photos.length} photo{photos.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* UPLOAD FORM */}
                <div className="rounded-2xl p-5 mb-6 border-2 border-dashed transition-all"
                  style={{ borderColor: photoPreview ? BLUE : "#e5e7eb", background: photoPreview ? BLUE_LIGHT : "#f9fafb" }}>
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm">Upload a Progress Photo</h4>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0">
                      {photoPreview ? (
                        <div className="relative">
                          <img src={photoPreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl border-2" style={{ borderColor: BLUE }}/>
                          <button onClick={() => { setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => fileInputRef.current?.click()}
                          className="w-32 h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 hover:opacity-80 transition-all"
                          style={{ borderColor: BLUE, background: "white" }}>
                          <span className="text-3xl">📷</span>
                          <span className="text-xs font-semibold" style={{ color: BLUE }}>Choose Photo</span>
                        </button>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect}/>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Photo Date</label>
                        <input type="date" value={photoDate} onChange={e => setPhotoDate(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none"
                          onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = "#e5e7eb"}/>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Note (optional)</label>
                        <input type="text" placeholder="e.g. After 1 month, Week 4 check-in..." value={photoNote} onChange={e => setPhotoNote(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none"
                          onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = "#e5e7eb"}/>
                      </div>
                      <button onClick={handlePhotoUpload} disabled={uploadingPhoto || !photoPreview}
                        className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-all" style={{ background: BLUE }}>
                        {uploadingPhoto ? "Uploading..." : "📤 Upload Photo"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* GALLERY */}
                {photos.length === 0 ? (
                  <div className="text-center py-12 rounded-xl" style={{ background: BLUE_LIGHT }}>
                    <p className="text-5xl mb-3">📷</p>
                    <p className="font-semibold text-gray-600">No progress photos yet</p>
                    <p className="text-xs text-gray-400 mt-2">Upload your first photo to start your visual journey!</p>
                  </div>
                ) : (
                  <>
                    <h4 className="font-bold text-gray-700 mb-3">Your Progress Journey</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {photos.map((photo, idx) => (
                        <div key={photo.id} className="relative group cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                          <img src={photo.photo} alt={`Progress ${idx + 1}`}
                            className="w-full aspect-square object-cover rounded-2xl border-2 border-gray-100 group-hover:border-blue-300 transition-all group-hover:shadow-md"/>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl p-3">
                            <p className="text-white text-xs font-semibold">
                              {photo.photoDate ? new Date(photo.photoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                            </p>
                            {photo.note && <p className="text-white/80 text-xs truncate">{photo.note}</p>}
                          </div>
                          {idx === 0 && <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: BLUE }}>Start</span>}
                          {idx === photos.length - 1 && photos.length > 1 && <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#10b981" }}>Latest</span>}
                        </div>
                      ))}
                    </div>

                    {/* BEFORE / AFTER */}
                    {photos.length >= 2 && (
                      <div className="mt-6">
                        <h4 className="font-bold text-gray-700 mb-3">Before & After Comparison</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { photo: photos[0],               label: "BEFORE", color: "#f59e0b" },
                            { photo: photos[photos.length-1], label: "AFTER",  color: "#10b981" },
                          ].map(({ photo, label, color }) => (
                            <div key={label} className="relative">
                              <img src={photo.photo} alt={label} className="w-full aspect-square object-cover rounded-2xl border-2" style={{ borderColor: color }}/>
                              <span className="absolute top-3 left-3 text-xs font-black px-3 py-1.5 rounded-full text-white" style={{ background: color }}>{label}</span>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl p-3">
                                <p className="text-white text-xs font-semibold">
                                  {photo.photoDate ? new Date(photo.photoDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
                                </p>
                                {photo.note && <p className="text-white/80 text-xs">{photo.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* WEIGHT HISTORY TABLE */}
        {logs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-4">📋 Weight Log History</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...logs].reverse().map((log, i) => {
                const prev = logs[logs.length - 1 - i - 1];
                const change = prev ? (log.weightKg - prev.weightKg).toFixed(1) : null;
                return (
                  <div key={log.id} className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: BLUE }}/>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{log.weightKg} kg
                          {change && <span className="ml-2 text-xs font-normal" style={{ color: change < 0 ? "#22c55e" : "#ef4444" }}>{change > 0 ? "+" : ""}{change} kg</span>}
                        </p>
                        {log.note && <p className="text-xs text-gray-400">{log.note}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-gray-400">{new Date(log.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      <button onClick={() => handleDeleteLog(log.id)} className="text-red-400 hover:text-red-600 text-xs font-bold transition">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* LIGHTBOX */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto.photo} alt="Progress" className="w-full rounded-2xl object-contain max-h-[70vh]"/>
            <div className="bg-white rounded-2xl p-4 mt-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {selectedPhoto.photoDate ? new Date(selectedPhoto.photoDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
                </p>
                {selectedPhoto.note && <p className="text-xs text-gray-400 mt-0.5">{selectedPhoto.note}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handlePhotoDelete(selectedPhoto.id)} className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-red-500 hover:bg-red-600 transition-all">🗑️ Delete</button>
                <button onClick={() => setSelectedPhoto(null)} className="px-4 py-2 rounded-xl text-gray-600 text-sm font-semibold bg-gray-100 hover:bg-gray-200 transition-all">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}