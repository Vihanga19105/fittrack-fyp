import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import api from "../../api/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const NAVY      = "#0A2342";
const BLUE      = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT= "#E8F7FD";

const EX_COLORS = [
  { bg:"#fef3c7", border:"#f59e0b", btn:"#f59e0b", text:"#92400e" },
  { bg:"#ede9fe", border:"#8b5cf6", btn:"#8b5cf6", text:"#5b21b6" },
  { bg:"#dcfce7", border:"#22c55e", btn:"#22c55e", text:"#15803d" },
  { bg:"#fee2e2", border:"#ef4444", btn:"#ef4444", text:"#b91c1c" },
  { bg:"#e0f2fe", border:"#0ea5e9", btn:"#0ea5e9", text:"#0369a1" },
  { bg:"#fce7f3", border:"#ec4899", btn:"#ec4899", text:"#9d174d" },
];

// motivational YouTube video shown in hero
const MOTIVATIONAL_VIDEO = "https://www.youtube.com/embed/mgmVOuLgFB0";

const getYoutubeEmbed = (url) => {
  if (!url || url.trim() === "") return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const m = url.match(pattern);
    if (m?.[1]) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
};

const normalisePlan = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) return data.length > 0 ? data[0] : null;
  return data;
};

export default function ClientWorkoutPlan() {
  const [plan,         setPlan        ] = useState(null);
  const [loading,      setLoading     ] = useState(true);
  const [completedIds, setCompletedIds] = useState([]);
  const [weeklyStats,  setWeeklyStats ] = useState([]);
  const [activeTab,    setActiveTab   ] = useState("today");
  const [expandedEx,   setExpandedEx  ] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [seconds,      setSeconds     ] = useState(0);
  const [showMotivation, setShowMotivation] = useState(false);
  const timerRef = useRef(null);

  const todayJs  = new Date().getDay();
  const todayNum = todayJs === 0 ? 7 : todayJs;
  const [selectedDay, setSelectedDay] = useState(todayNum);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [planRes, completionsRes, statsRes] = await Promise.all([
        api.get("/api/workout/my"),
        api.get("/api/workout-completion/today").catch(() => ({ data: [] })),
        api.get("/api/workout-completion/weekly-stats").catch(() => ({ data: [] })),
      ]);
      const normalisedPlan = normalisePlan(planRes.data);
      setPlan(normalisedPlan);
      setCompletedIds(completionsRes.data || []);
      setWeeklyStats(statsRes.data || []);
    } catch (err) {
      console.error("[WorkoutPlan] load error:", err);
    }
    setLoading(false);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };

  const getDayExercises = (day) => {
    if (!plan?.exercises?.length) return [];
    return plan.exercises.filter(
      ex => parseInt(ex.dayOfWeek) === parseInt(day)
    );
  };

  const markDone = async (ex) => {
    if (completedIds.includes(ex.id)) return;
    try {
      await api.post("/api/workout-completion/complete", {
        exerciseId: ex.id,
        dayOfWeek: ex.dayOfWeek,
      });
      setCompletedIds(prev => [...prev, ex.id]);
      const statsRes = await api.get("/api/workout-completion/weekly-stats");
      setWeeklyStats(statsRes.data || []);
      Swal.fire({
        title: "Exercise Completed! 💪",
        text: `${ex.exerciseName} — great work!`,
        icon: "success", timer: 1500, showConfirmButton: false,
      });
    } catch {
      Swal.fire("Error", "Failed to save. Try again.", "error");
    }
  };

  const currentExercises = getDayExercises(selectedDay);
  const completedCount   = currentExercises.filter(ex => completedIds.includes(ex.id)).length;
  const totalCount       = currentExercises.length;
  const progress         = totalCount > 0 ? completedCount / totalCount : 0;
  const allDone          = totalCount > 0 && completedCount === totalCount;
  const totalWeekly      = weeklyStats.reduce((sum, d) => sum + (Number(d.count) || 0), 0);

  const chartData = DAYS.map((day, i) => ({
    day,
    count: Number(weeklyStats[i]?.count) || 0,
    isToday: i + 1 === todayNum,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#f0f9ff" }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
            style={{ background: BLUE }}>💪</div>
          <p className="text-gray-400 animate-pulse">Loading workout plan...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f0f9ff" }}>
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: BLUE_LIGHT }}>
            <span className="text-5xl">🏋️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">No Workout Plan Yet</h2>
          <p className="text-gray-400 text-sm">Your trainer hasn't assigned a workout plan yet. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f0f9ff" }}>

      {/* ── HERO — matches dashboard style ── */}
      <div
        className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.70) 50%, rgba(41,171,226,0.80) 100%), url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1400&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "200px",
        }}>

        {/* decorative circles */}
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-6 flex-wrap">

            {/* LEFT — title + date + stats */}
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
                My Workout Plan
              </p>
              <h1 className="text-4xl font-black tracking-tight">
                {plan.title || plan.planName || "Weekly Training"} 💪
              </h1>
              <p className="text-blue-100 mt-1 text-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long", month: "long", day: "numeric"
                })} · Assigned by{" "}
                <span className="text-white font-bold">{plan.trainerName || "Your Trainer"}</span>
              </p>

              {/* stat pills */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { label: "This Week",  value: `${totalWeekly} done`,             color: "#22c55e" },
                  { label: "Today",      value: `${completedCount}/${totalCount}`, color: BLUE      },
                  { label: "Progress",   value: `${Math.round(progress * 100)}%`,  color: "#f59e0b" },
                ].map(({ label, value, color }) => (
                  <div key={label}
                    className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                    <p className="text-xs text-blue-200">{label}</p>
                    <p className="font-bold text-sm" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — motivational video button */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowMotivation(true)}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/30 bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-all">
                <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">▶</span>
                </div>
                <div className="text-left">
                  <p className="text-white font-bold text-sm">Get Motivated</p>
                  <p className="text-blue-200 text-xs">Watch before workout</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* ── END HERO ── */}

      {/* MOTIVATIONAL VIDEO MODAL */}
      {showMotivation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setShowMotivation(false)}>
          <div
            className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3"
              style={{ background: NAVY }}>
              <p className="text-white font-bold">🔥 Get Motivated!</p>
              <button
                onClick={() => setShowMotivation(false)}
                className="text-white/60 hover:text-white text-xl font-bold transition-all">
                ✕
              </button>
            </div>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
              <iframe
                src={MOTIVATIONAL_VIDEO + "?autoplay=1"}
                title="Motivational Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              />
            </div>
            <div className="px-5 py-3 text-center" style={{ background: "#f9fafb" }}>
              <p className="text-xs text-gray-400">Close this and crush your workout! 💪</p>
            </div>
          </div>
        </div>
      )}

      {/* PROGRESS BAR */}
      {totalCount > 0 && (
        <div className="px-6 -mt-3 relative z-10">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-gray-500">Today's Progress</p>
              <p className="text-xs font-bold" style={{ color: allDone ? "#22c55e" : BLUE }}>
                {completedCount} of {totalCount} completed
              </p>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress * 100}%`,
                  background: allDone
                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                    : `linear-gradient(90deg, ${BLUE_DARK}, ${BLUE})`
                }} />
            </div>
            {allDone && (
              <p className="text-xs font-bold mt-2 text-green-600 text-center">
                All exercises completed — amazing work! 🎉
              </p>
            )}
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="px-6 mt-5 pb-10">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { id: "today",   label: "Today's Plan" },
              { id: "week",    label: "Full Week"    },
              { id: "history", label: "History"      },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-3 text-xs font-semibold transition-all"
                style={{
                  borderBottom: activeTab === tab.id ? `2px solid ${BLUE}` : "2px solid transparent",
                  color:        activeTab === tab.id ? BLUE : "#9ca3af",
                  background:   activeTab === tab.id ? BLUE_LIGHT : "white",
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">

            {/* ══ TODAY TAB ══ */}
            {activeTab === "today" && (
              <div className="space-y-5">

                {/* DAY STRIP */}
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS.map((day, i) => {
                    const dayNum  = i + 1;
                    const isToday = dayNum === todayNum;
                    const isSel   = dayNum === selectedDay;
                    const exCount = getDayExercises(dayNum).length;
                    return (
                      <button key={dayNum} onClick={() => setSelectedDay(dayNum)}
                        className="flex flex-col items-center py-2 rounded-xl transition-all duration-200"
                        style={{
                          background: isSel ? BLUE : isToday ? BLUE_LIGHT : "#f9fafb",
                          color:      isSel ? "white" : isToday ? BLUE_DARK : "#6b7280",
                          border:     isToday && !isSel ? `2px solid ${BLUE}40` : "2px solid transparent",
                          transform:  isSel ? "scale(1.05)" : "scale(1)",
                        }}>
                        <span className="text-xs font-medium">{day}</span>
                        <span className="text-sm font-bold mt-0.5">{dayNum}</span>
                        <span className="text-xs mt-0.5"
                          style={{ color: isSel ? "rgba(255,255,255,0.8)" : exCount > 0 ? BLUE : "#d1d5db" }}>
                          {exCount > 0 ? exCount : "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* DAY LABEL */}
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">
                    {DAYS[selectedDay - 1]}{selectedDay === todayNum ? " — Today" : ""}
                  </h3>
                  <span className="text-xs px-3 py-1 rounded-full"
                    style={{ background: BLUE_LIGHT, color: BLUE_DARK }}>
                    {currentExercises.length} exercise{currentExercises.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* REST DAY */}
                {currentExercises.length === 0 ? (
                  <div className="text-center py-16 rounded-2xl border-2 border-dashed"
                    style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                      style={{ background: BLUE_LIGHT }}>
                      <span className="text-3xl">😴</span>
                    </div>
                    <p className="font-bold text-gray-600">Rest Day</p>
                    <p className="text-xs text-gray-400 mt-1">Recovery is part of the process!</p>
                  </div>
                ) : (
                  <div className="space-y-3">

                    {allDone && selectedDay === todayNum && (
                      <div className="rounded-2xl p-4 text-white text-center"
                        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                        <p className="text-lg font-black">Workout Complete! 🎉</p>
                        <p className="text-green-100 text-xs mt-1">You crushed today's session!</p>
                      </div>
                    )}

                    {currentExercises.map((ex, idx) => {
                      const isDone     = completedIds.includes(ex.id);
                      const c          = EX_COLORS[idx % EX_COLORS.length];
                      const embedUrl   = getYoutubeEmbed(ex.mediaUrl);
                      const isExpanded = expandedEx === ex.id;

                      return (
                        <div key={ex.id}
                          className="rounded-2xl border-2 overflow-hidden transition-all"
                          style={{
                            borderColor: isDone ? "#22c55e" : c.border + "80",
                            background:  isDone ? "#f0fdf4" : "white",
                          }}>
                          <div className="h-1.5 w-full" style={{ background: isDone ? "#22c55e" : c.btn }} />
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center
                                              font-black text-white text-sm flex-shrink-0"
                                style={{ background: isDone ? "#22c55e" : c.btn }}>
                                {isDone ? "✓" : idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-800">{ex.exerciseName}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className="px-3 py-1 rounded-lg text-xs font-bold"
                                    style={{ background: c.bg, color: c.text }}>
                                    {ex.sets ?? "—"} Sets
                                  </span>
                                  <span className="px-3 py-1 rounded-lg text-xs font-bold"
                                    style={{ background: c.bg, color: c.text }}>
                                    {ex.reps ?? "—"} Reps
                                  </span>
                                  {isDone && (
                                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700">
                                      ✓ Completed
                                    </span>
                                  )}
                                </div>
                                {ex.notes && ex.notes.trim() !== "" && (
                                  <div className="mt-2 p-3 rounded-xl" style={{ background: c.bg }}>
                                    <p className="text-xs font-bold mb-0.5" style={{ color: c.text }}>Trainer Note:</p>
                                    <p className="text-xs text-gray-700 leading-relaxed">{ex.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 mt-3">
                              {!isDone ? (
                                <button onClick={() => markDone(ex)}
                                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold
                                             hover:opacity-90 transition-all active:scale-95"
                                  style={{ background: c.btn }}>
                                  Mark as Done
                                </button>
                              ) : (
                                <div className="flex-1 py-2.5 rounded-xl text-sm font-bold text-center bg-green-100 text-green-700">
                                  ✓ Completed
                                </div>
                              )}
                              {embedUrl && (
                                <button
                                  onClick={() => setExpandedEx(isExpanded ? null : ex.id)}
                                  className="px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
                                  style={{
                                    borderColor: "#ef4444",
                                    color:       "#ef4444",
                                    background:  isExpanded ? "#fee2e2" : "white",
                                  }}>
                                  {isExpanded ? "▲ Hide" : "▶ Watch"}
                                </button>
                              )}
                            </div>

                            {embedUrl && isExpanded && (
                              <div className="mt-3 rounded-xl overflow-hidden">
                                <iframe
                                  key={ex.id}
                                  width="100%"
                                  height="220"
                                  src={embedUrl}
                                  title={ex.exerciseName}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  style={{ borderRadius: "12px", display: "block" }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TIMER */}
                <div className="rounded-2xl p-4 border-2"
                  style={{
                    borderColor: timerRunning ? BLUE : "#e5e7eb",
                    background:  timerRunning ? BLUE_LIGHT : "#f9fafb",
                  }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1">Workout Timer</p>
                      <p className="text-4xl font-black tabular-nums"
                        style={{ color: timerRunning ? BLUE : "#374151" }}>
                        {formatTime(seconds)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setTimerRunning(p => !p)}
                        className="px-5 py-3 rounded-xl text-white font-bold text-sm"
                        style={{ background: timerRunning ? "#f59e0b" : BLUE }}>
                        {timerRunning ? "Pause" : "Start"}
                      </button>
                      <button onClick={() => { setTimerRunning(false); setSeconds(0); }}
                        className="px-4 py-3 rounded-xl font-bold text-sm bg-gray-200 text-gray-600">
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ FULL WEEK TAB ══ */}
            {activeTab === "week" && (
              <div className="space-y-3">
                {DAYS.map((day, i) => {
                  const dayNum  = i + 1;
                  const exs     = getDayExercises(dayNum);
                  const isToday = dayNum === todayNum;
                  const done    = Number(weeklyStats[i]?.count) || 0;
                  return (
                    <div key={dayNum} className="rounded-2xl border-2 overflow-hidden"
                      style={{
                        borderColor: isToday ? BLUE : done > 0 ? "#22c55e40" : "#f1f5f9",
                        background:  isToday ? BLUE_LIGHT : "white",
                      }}>
                      <div className="flex items-center justify-between px-4 py-3"
                        style={{ background: isToday ? `${BLUE}20` : "#f9fafb" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                            style={{ background: isToday ? BLUE : "#e5e7eb", color: isToday ? "white" : "#374151" }}>
                            {dayNum}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">
                              {day}
                              {isToday && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full text-white"
                                  style={{ background: BLUE }}>Today</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400">
                              {exs.length > 0 ? `${exs.length} exercises` : "Rest day"}
                            </p>
                          </div>
                        </div>
                        {done > 0 && (
                          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            {done} done
                          </span>
                        )}
                      </div>
                      {exs.length > 0 && (
                        <div className="px-4 py-3 space-y-2">
                          {exs.map((ex, idx) => {
                            const c      = EX_COLORS[idx % EX_COLORS.length];
                            const isDone = completedIds.includes(ex.id);
                            return (
                              <div key={ex.id}
                                className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                                style={{ background: isDone ? "#f0fdf4" : c.bg }}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center
                                                  text-white text-xs font-bold flex-shrink-0"
                                    style={{ background: isDone ? "#22c55e" : c.btn }}>
                                    {isDone ? "✓" : idx + 1}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{ex.exerciseName}</p>
                                    {ex.notes && ex.notes.trim() !== "" && (
                                      <p className="text-xs text-gray-400 mt-0.5 truncate">{ex.notes}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                                    style={{ background: isDone ? "#dcfce7" : c.bg, color: isDone ? "#16a34a" : c.text }}>
                                    {ex.sets}×{ex.reps}
                                  </span>
                                  {getYoutubeEmbed(ex.mediaUrl) && (
                                    <span className="text-xs px-2 py-0.5 rounded-lg bg-red-50 text-red-500 font-medium">
                                      ▶ video
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ HISTORY TAB ══ */}
            {activeTab === "history" && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">This Week's Activity</h3>
                  <p className="text-xs text-gray-400 mb-4">Exercises completed per day</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                        formatter={v => [`${v} exercises`, "Completed"]}
                      />
                      <Bar dataKey="count" radius={[6,6,0,0]}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.isToday ? BLUE_DARK : entry.count > 0 ? BLUE : "#e5e7eb"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total Done",  value: totalWeekly,                                   color: BLUE,      bg: BLUE_LIGHT },
                    { label: "Active Days", value: chartData.filter(d => d.count > 0).length,     color: "#22c55e", bg: "#f0fdf4"  },
                    { label: "Rest Days",   value: 7 - chartData.filter(d => d.count > 0).length, color: "#f59e0b", bg: "#fefce8" },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className="text-center p-4 rounded-2xl" style={{ background: bg }}>
                      <p className="text-2xl font-black" style={{ color }}>{value}</p>
                      <p className="text-xs text-gray-500 mt-1">{label}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="font-bold text-gray-700 text-sm mb-3">Daily Breakdown</h3>
                  <div className="space-y-2">
                    {chartData.map((d, i) => {
                      const maxCount = Math.max(...chartData.map(x => x.count), 1);
                      const pct = (d.count / maxCount) * 100;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-500 w-8">{d.day}</span>
                          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                background: d.isToday ? BLUE_DARK : d.count > 0 ? BLUE : "transparent"
                              }} />
                          </div>
                          <span className="text-xs font-bold w-12 text-right"
                            style={{ color: d.count > 0 ? BLUE : "#d1d5db" }}>
                            {d.count > 0 ? `${d.count} ex` : "rest"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl p-5"
                  style={{ background: `linear-gradient(135deg, ${NAVY}, ${BLUE_DARK})` }}>
                  <p className="text-white font-bold mb-3">Plan Information</p>
                  <div className="space-y-2">
                    {[
                      { label: "Plan Name",       value: plan?.title || plan?.planName || "Weekly Training" },
                      { label: "Trainer",         value: plan?.trainerName || "—"                          },
                      { label: "Total Exercises", value: `${plan?.exercises?.length || 0} exercises`       },
                      { label: "Description",     value: plan?.description || "No description"             },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-start gap-4">
                        <span className="text-blue-200 text-xs flex-shrink-0">{label}</span>
                        <span className="text-white text-xs font-semibold text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}