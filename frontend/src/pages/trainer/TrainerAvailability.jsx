import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import api from "../../api/api";

const TEAL       = "#14b8a6";
const TEAL_DARK  = "#0d9488";
const TEAL_LIGHT = "#f0fdfa";

const DEFAULT_SCHEDULE = [
  { day: "Monday",    from: "09:00", to: "18:00", enabled: true  },
  { day: "Tuesday",   from: "09:00", to: "18:00", enabled: true  },
  { day: "Wednesday", from: "09:00", to: "18:00", enabled: true  },
  { day: "Thursday",  from: "09:00", to: "18:00", enabled: true  },
  { day: "Friday",    from: "09:00", to: "18:00", enabled: true  },
  { day: "Saturday",  from: "09:00", to: "14:00", enabled: true  },
  { day: "Sunday",    from: "09:00", to: "18:00", enabled: false },
];

const DAY_ICONS = {
  Monday: "🌙", Tuesday: "🔥", Wednesday: "⚡",
  Thursday: "💪", Friday: "🎯", Saturday: "🌟", Sunday: "😴",
};

const DAY_SHORT = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
  Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

export default function TrainerAvailability() {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);

  // ── LOAD EXISTING AVAILABILITY ──
  useEffect(() => {
    api.get("/api/availability/my")
      .then(res => {
        if (res.data && res.data.length > 0) {
          // merge saved data into schedule
          const updated = DEFAULT_SCHEDULE.map(item => {
            const saved = res.data.find(s =>
              s.day?.toLowerCase() === item.day.toLowerCase() ||
              s.day?.substring(0, 3)?.toLowerCase() === item.day.substring(0, 3).toLowerCase()
            );
            if (saved) {
              return {
                ...item,
                from:    saved.startTime?.substring(0, 5) || item.from,
                to:      saved.endTime?.substring(0, 5)   || item.to,
                enabled: true,
              };
            }
            return { ...item, enabled: false };
          });
          setSchedule(updated);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateTime = (i, field, value) => {
    const updated = [...schedule];
    updated[i][field] = value;
    setSchedule(updated);
  };

  const toggleDay = (i) => {
    const updated = [...schedule];
    updated[i].enabled = !updated[i].enabled;
    setSchedule(updated);
  };

  const calcHours = (from, to) => {
    const [fh, fm] = from.split(":").map(Number);
    const [th, tm] = to.split(":").map(Number);
    return Math.max(0, ((th * 60 + tm) - (fh * 60 + fm)) / 60).toFixed(1);
  };

  const activeDays  = schedule.filter(s => s.enabled).length;
  const totalHours  = schedule
    .filter(s => s.enabled)
    .reduce((sum, s) => sum + parseFloat(calcHours(s.from, s.to)), 0)
    .toFixed(1);

  // ── SAVE ──
  const save = async () => {
    for (const s of schedule) {
      if (!s.enabled) continue;
      if (s.from >= s.to) {
        Swal.fire("Error", `${s.day}: End time must be after start time`, "error");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = schedule
        .filter(s => s.enabled)
        .map(s => ({
          day:       DAY_SHORT[s.day],
          startTime: s.from,
          endTime:   s.to,
        }));

      await api.post("/api/availability/save", payload);
      Swal.fire({
        title: "Availability Saved! ✅",
        text: `${activeDays} day${activeDays !== 1 ? "s" : ""}, ${totalHours} hrs/week`,
        icon: "success", timer: 2000, showConfirmButton: false,
      });
    } catch {
      Swal.fire("Error", "Failed to save availability. Please try again.", "error");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#f0fdf4" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 animate-spin mx-auto mb-3"
          style={{ borderColor: TEAL, borderTopColor: "transparent" }} />
        <p className="text-gray-400 animate-pulse">Loading schedule...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "#f0fdf4" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(20,184,166,0.80) 100%), url('https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "200px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Schedule</p>
            <h1 className="text-4xl font-black tracking-tight">Availability 📅</h1>
            <p className="text-teal-100 mt-1 text-sm">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-teal-200 text-sm mt-1">Set your weekly training schedule for clients to see</p>
          </div>
          {/* Stat pills */}
          <div className="hidden md:flex gap-2">
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
              <p className="text-xs text-teal-200 mb-0.5">Active Days</p>
              <p className="font-black text-white text-2xl leading-none">{activeDays}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
              <p className="text-xs text-teal-200 mb-0.5">Hrs / Week</p>
              <p className="font-black text-white text-2xl leading-none">{totalHours}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
              <p className="text-xs text-teal-200 mb-0.5">Rest Days</p>
              <p className="font-black text-white text-2xl leading-none">{7 - activeDays}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* WEEKLY SCHEDULE */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Weekly Schedule</h3>
              <p className="text-xs text-gray-400 mt-0.5">Toggle days on/off and set your working hours</p>
            </div>
            {/* Quick select all / none */}
            <div className="flex gap-2">
              <button
                onClick={() => setSchedule(prev => prev.map(s => ({ ...s, enabled: true })))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-90"
                style={{ borderColor: TEAL, color: TEAL }}>
                All Days
              </button>
              <button
                onClick={() => setSchedule(prev => prev.map(s => ({ ...s, enabled: false })))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
                None
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {schedule.map((item, i) => (
              <div key={item.day}
                className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl transition-all"
                style={{
                  background:   item.enabled ? TEAL_LIGHT : "#f9fafb",
                  border:       item.enabled ? `1px solid ${TEAL}30` : "1px solid #f1f5f9",
                }}>

                {/* DAY TOGGLE */}
                <div className="flex items-center gap-3 min-w-[160px]">
                  <button onClick={() => toggleDay(i)}
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                    style={{ background: item.enabled ? TEAL : "white", borderColor: item.enabled ? TEAL : "#d1d5db" }}>
                    {item.enabled && <span className="text-white text-xs font-bold">✓</span>}
                  </button>
                  <span className="text-xl">{DAY_ICONS[item.day]}</span>
                  <span className="font-semibold text-gray-800 text-sm">{item.day}</span>
                </div>

                {/* TIME INPUTS or OFF label */}
                {item.enabled ? (
                  <div className="flex items-center gap-3 flex-1 flex-wrap">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">From</label>
                      <input type="time" value={item.from}
                        onChange={e => updateTime(i, "from", e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none"
                        onFocus={e => e.target.style.borderColor = TEAL}
                        onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">To</label>
                      <input type="time" value={item.to}
                        onChange={e => updateTime(i, "to", e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none"
                        onFocus={e => e.target.style.borderColor = TEAL}
                        onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white ml-auto"
                      style={{ background: TEAL }}>
                      {calcHours(item.from, item.to)}h
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Day off — not available</span>
                )}
              </div>
            ))}
          </div>

          {/* SAVE BUTTON */}
          <button onClick={save} disabled={saving || activeDays === 0}
            className="mt-6 w-full py-3.5 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${TEAL_DARK}, ${TEAL})` }}>
            {saving ? "Saving..." : `💾 Save Availability — ${activeDays} day${activeDays !== 1 ? "s" : ""}, ${totalHours} hrs/week`}
          </button>
        </div>

        {/* WEEKLY VISUAL PREVIEW */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">Weekly Preview</h3>
          <div className="grid grid-cols-7 gap-2">
            {schedule.map(item => (
              <div key={item.day}
                className="text-center p-3 rounded-xl cursor-pointer transition-all"
                onClick={() => {
                  const i = schedule.findIndex(s => s.day === item.day);
                  toggleDay(i);
                }}
                style={{
                  background:   item.enabled ? TEAL_LIGHT : "#f9fafb",
                  border:       item.enabled ? `1px solid ${TEAL}40` : "1px solid #f1f5f9",
                }}>
                <p className="text-xs font-bold mb-1" style={{ color: item.enabled ? TEAL_DARK : "#9ca3af" }}>
                  {item.day.substring(0, 3)}
                </p>
                <p className="text-xl">{DAY_ICONS[item.day]}</p>
                <p className="text-xs mt-1 font-semibold" style={{ color: item.enabled ? TEAL : "#d1d5db" }}>
                  {item.enabled ? `${calcHours(item.from, item.to)}h` : "Off"}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">Click any day to toggle availability</p>
        </div>

      </div>
    </div>
  );
}