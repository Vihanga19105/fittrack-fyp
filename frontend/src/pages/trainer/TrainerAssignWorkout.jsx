import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../api/api";
import axios from "axios";

const API = "http://localhost:8080/api";
const TEAL       = "#14b8a6";
const TEAL_DARK  = "#0d9488";
const TEAL_LIGHT = "#f0fdfa";

const DAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

export default function TrainerAssignWorkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [existingPlans, setExistingPlans] = useState([]);

  const [plan, setPlan] = useState({ title: "", description: "" });
  const [exercisesByDay, setExercisesByDay] = useState(() => {
    const init = {};
    DAYS.forEach(({ value }) => { init[value] = []; });
    return init;
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get(`/api/profile/client/${id}`)
      .then(res => { setClient(res.data); setLoading(false); })
      .catch(() => setLoading(false));

    axios.get(`${API}/workout/client/${id}`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setExistingPlans(res.data || []))
      .catch(() => setExistingPlans([]));
  }, [id]);

  const activateWorkoutPlan = async (planId) => {
    try {
      await axios.put(`${API}/workout/${planId}/activate`, {},
        { headers: { Authorization: `Bearer ${token}` } });
      const res = await axios.get(`${API}/workout/client/${id}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setExistingPlans(res.data || []);
      Swal.fire({ title: "Activated!", icon: "success", timer: 1200, showConfirmButton: false });
    } catch { Swal.fire("Error", "Failed to activate", "error"); }
  };

  const addExercise = () => {
    setExercisesByDay(prev => ({
      ...prev,
      [selectedDay]: [...prev[selectedDay],
        { exerciseName: "", sets: "", reps: "", notes: "", mediaUrl: "" }],
    }));
  };

  const removeExercise = (day, index) => {
    setExercisesByDay(prev => ({
      ...prev, [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const handleChange = (day, index, field, value) => {
    setExercisesByDay(prev => {
      const updated = [...prev[day]];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [day]: updated };
    });
    const errKey = `ex_${day}_${index}_${field}`;
    if (errors[errKey]) setErrors(prev => ({ ...prev, [errKey]: "" }));
  };

  const totalExercises = Object.values(exercisesByDay).flat().length;
  const getDayCount = (day) => exercisesByDay[day].length;

  const validate = () => {
    const newErrors = {};
    if (!plan.title.trim()) newErrors.title = "Plan title is required";
    Object.entries(exercisesByDay).forEach(([day, exs]) => {
      exs.forEach((ex, index) => {
        if (!ex.exerciseName.trim()) newErrors[`ex_${day}_${index}_exerciseName`] = "Required";
        if (!ex.sets || isNaN(ex.sets) || Number(ex.sets) <= 0) newErrors[`ex_${day}_${index}_sets`] = "Required";
        if (!ex.reps || isNaN(ex.reps) || Number(ex.reps) <= 0) newErrors[`ex_${day}_${index}_reps`] = "Required";
      });
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { Swal.fire({ title: "Fix errors!", icon: "warning", timer: 1500, showConfirmButton: false }); return; }
    if (totalExercises === 0) { Swal.fire({ title: "No exercises!", icon: "warning", timer: 1500, showConfirmButton: false }); return; }
    setSaving(true);
    const allExercises = Object.entries(exercisesByDay).flatMap(([day, exs]) =>
      exs.map(ex => ({
        dayOfWeek: parseInt(day),
        exerciseName: ex.exerciseName,
        sets: Number(ex.sets), reps: Number(ex.reps),
        notes: ex.notes, mediaUrl: ex.mediaUrl || null,
      }))
    );
    try {
      await api.post(`/api/workout/assign/${id}`, {
        title: plan.title, description: plan.description, exercises: allExercises,
      });
      Swal.fire({ title: "Workout Plan Assigned! 💪", icon: "success", timer: 2000, showConfirmButton: false });
      navigate(`/trainer/client/${id}`);
    } catch { Swal.fire("Error", "Failed to assign plan.", "error"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#f0fdf4" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 animate-spin mx-auto mb-3"
          style={{ borderColor: TEAL, borderTopColor: "transparent" }} />
        <p className="text-gray-400 animate-pulse">Loading...</p>
      </div>
    </div>
  );

  const currentDayExercises = exercisesByDay[selectedDay];

  return (
    <div className="min-h-screen pb-10" style={{ background: "#f0fdf4" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(20,184,166,0.80) 100%), url('https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "180px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <button onClick={() => navigate(`/trainer/client/${id}`)}
            className="flex items-center gap-1 text-teal-200 text-xs font-medium mb-3 hover:text-white transition-colors">
            ← Back to Client
          </button>
          <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Assign Workout</p>
          <h1 className="text-4xl font-black tracking-tight">Weekly Training Plan 💪</h1>
          <p className="text-teal-100 mt-1 text-sm">
            Creating plan for <span className="font-bold text-white">{client?.name}</span>
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* EXISTING PLANS TABLE */}
        {existingPlans.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Existing Workout Plans</h3>
              <p className="text-xs text-gray-400 mt-0.5">Set a plan as active for the client to see</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: TEAL_LIGHT }}>
                    {["Plan Title", "Description", "Exercises", "Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide"
                        style={{ color: TEAL_DARK }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {existingPlans.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-800 text-sm">{p.title || "Workout Plan"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">{p.description || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.exercises?.length || 0} exercises</td>
                      <td className="px-4 py-3">
                        {p.isActive ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: "#dcfce7", color: "#166534" }}>✓ Active</span>
                        ) : (
                          <button onClick={() => activateWorkoutPlan(p.id)}
                            className="px-3 py-1 rounded-full text-xs font-bold border-2 hover:opacity-90 transition-all"
                            style={{ borderColor: TEAL, color: TEAL }}>
                            Set Active
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PLAN DETAILS */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">New Plan Details</h3>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Plan Title *</label>
            <input type="text" placeholder='e.g. "Week 1 - Strength Training"' value={plan.title}
              onChange={e => { setPlan({ ...plan, title: e.target.value }); if (errors.title) setErrors({ ...errors, title: "" }); }}
              className={`w-full border rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none transition-all ${errors.title ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
              onFocus={e => e.target.style.borderColor = TEAL}
              onBlur={e => e.target.style.borderColor = errors.title ? "#f87171" : "#f3f4f6"} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description (optional)</label>
            <textarea placeholder="Describe the workout goals..." value={plan.description}
              onChange={e => setPlan({ ...plan, description: e.target.value })}
              rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-gray-50 focus:outline-none text-sm resize-none"
              onFocus={e => e.target.style.borderColor = TEAL}
              onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
          </div>
        </div>

        {/* DAY TABS */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Select Day to Add Exercises</h3>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(({ label, value }) => {
              const count = getDayCount(value);
              const isSelected = value === selectedDay;
              return (
                <button key={value} onClick={() => setSelectedDay(value)}
                  className="flex flex-col items-center px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                  style={{
                    background: isSelected ? TEAL : "#f9fafb",
                    color: isSelected ? "#fff" : "#6b7280",
                    borderColor: isSelected ? TEAL : "#e5e7eb",
                    transform: isSelected ? "scale(1.05)" : "scale(1)",
                  }}>
                  <span>{label}</span>
                  {count > 0 && (
                    <span className="text-xs mt-0.5"
                      style={{ color: isSelected ? "rgba(255,255,255,0.8)" : TEAL }}>
                      {count} ex
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* EXERCISES */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {DAYS.find(d => d.value === selectedDay)?.label} Exercises
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{currentDayExercises.length} exercises added</p>
            </div>
            <button onClick={addExercise}
              className="text-white px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{ background: TEAL }}>
              + Add Exercise
            </button>
          </div>

          {currentDayExercises.length === 0 ? (
            <div className="text-center py-10 rounded-xl" style={{ background: TEAL_LIGHT }}>
              <p className="text-4xl mb-2">💪</p>
              <p className="text-sm font-medium" style={{ color: TEAL_DARK }}>No exercises yet for this day</p>
              <p className="text-xs text-gray-400 mt-1">Click "+ Add Exercise" to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentDayExercises.map((ex, index) => (
                <div key={index} className="border rounded-2xl p-5" style={{ borderColor: "#e5e7eb", background: "#fafafa" }}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center"
                        style={{ background: TEAL }}>
                        {index + 1}
                      </div>
                      <span className="font-semibold text-gray-700 text-sm">Exercise {index + 1}</span>
                    </div>
                    <button onClick={() => removeExercise(selectedDay, index)}
                      className="text-red-400 hover:text-red-600 text-sm font-medium transition">
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Exercise Name *</label>
                      <input type="text" placeholder="e.g. Bench Press, Squats..." value={ex.exerciseName}
                        onChange={e => handleChange(selectedDay, index, "exerciseName", e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 text-gray-800 bg-white focus:outline-none text-sm ${errors[`ex_${selectedDay}_${index}_exerciseName`] ? "border-red-400" : "border-gray-200"}`}
                        onFocus={e => e.target.style.borderColor = TEAL}
                        onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
                      {errors[`ex_${selectedDay}_${index}_exerciseName`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`ex_${selectedDay}_${index}_exerciseName`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Sets *</label>
                      <input type="number" placeholder="e.g. 3" min="1" value={ex.sets}
                        onChange={e => handleChange(selectedDay, index, "sets", e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 text-gray-800 bg-white focus:outline-none text-sm ${errors[`ex_${selectedDay}_${index}_sets`] ? "border-red-400" : "border-gray-200"}`}
                        onFocus={e => e.target.style.borderColor = TEAL}
                        onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
                      {errors[`ex_${selectedDay}_${index}_sets`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`ex_${selectedDay}_${index}_sets`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Reps *</label>
                      <input type="number" placeholder="e.g. 12" min="1" value={ex.reps}
                        onChange={e => handleChange(selectedDay, index, "reps", e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 text-gray-800 bg-white focus:outline-none text-sm ${errors[`ex_${selectedDay}_${index}_reps`] ? "border-red-400" : "border-gray-200"}`}
                        onFocus={e => e.target.style.borderColor = TEAL}
                        onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
                      {errors[`ex_${selectedDay}_${index}_reps`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`ex_${selectedDay}_${index}_reps`]}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Notes (optional)</label>
                      <input type="text" placeholder="e.g. Rest 60s between sets" value={ex.notes}
                        onChange={e => handleChange(selectedDay, index, "notes", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-800 bg-white focus:outline-none text-sm"
                        onFocus={e => e.target.style.borderColor = TEAL}
                        onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-gray-600 mb-1 block">YouTube Video URL (optional)</label>
                      <input type="text" placeholder="https://youtube.com/watch?v=..." value={ex.mediaUrl}
                        onChange={e => handleChange(selectedDay, index, "mediaUrl", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-800 bg-white focus:outline-none text-sm"
                        onFocus={e => e.target.style.borderColor = TEAL}
                        onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
                      <p className="text-xs text-gray-400 mt-1">Paste a YouTube link so client can watch the exercise demo</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WEEKLY SUMMARY */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Weekly Summary</h3>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map(({ label, value }) => {
              const count = getDayCount(value);
              const isSelected = value === selectedDay;
              return (
                <div key={value} onClick={() => setSelectedDay(value)}
                  className="text-center p-3 rounded-xl cursor-pointer border transition-all"
                  style={{ background: isSelected ? TEAL_LIGHT : "#f9fafb", borderColor: isSelected ? TEAL : "#e5e7eb" }}>
                  <p className="text-xs font-semibold" style={{ color: isSelected ? TEAL_DARK : "#6b7280" }}>{label}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: count > 0 ? TEAL : "#d1d5db" }}>{count > 0 ? count : "—"}</p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>{count > 0 ? "ex" : "rest"}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SAVE + CANCEL */}
        <div className="flex gap-4">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-4 rounded-xl font-semibold text-lg text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: TEAL }}>
            {saving ? "Saving..." : `💪 Save Weekly Plan`}
            {totalExercises > 0 && !saving && (
              <span className="ml-2 text-sm font-normal opacity-80">({totalExercises} exercises)</span>
            )}
          </button>
          <button onClick={() => navigate(`/trainer/client/${id}`)}
            className="px-8 py-4 rounded-xl font-semibold text-gray-700 transition-all border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}