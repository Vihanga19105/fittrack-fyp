import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import axios from "axios";
import Swal from "sweetalert2";

const API = "http://localhost:8080/api";
const TEAL       = "#14b8a6";
const TEAL_DARK  = "#0d9488";
const TEAL_LIGHT = "#f0fdfa";

export default function TrainerClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const trainerId = localStorage.getItem("userId");

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mealPlans, setMealPlans] = useState([]);
  const [workoutPlans, setWorkoutPlans] = useState([]);

  useEffect(() => {
    api.get(`/api/profile/client/${id}`)
      .then(res => { setClient(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!trainerId) return;
    axios.get(`${API}/meal-plans/client/${id}/trainer/${trainerId}`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setMealPlans(res.data))
      .catch(() => setMealPlans([]));
  }, [id, trainerId]);

  useEffect(() => {
    axios.get(`${API}/workout/client/${id}`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setWorkoutPlans(res.data))
      .catch(() => setWorkoutPlans([]));
  }, [id]);

  const activateMealPlan = async (planId) => {
    try {
      await axios.put(`${API}/meal-plans/${planId}/activate`, {},
        { headers: { Authorization: `Bearer ${token}` } });
      const res = await axios.get(`${API}/meal-plans/client/${id}/trainer/${trainerId}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setMealPlans(res.data);
      Swal.fire({ title: "Meal Plan Activated!", icon: "success", timer: 1200, showConfirmButton: false });
    } catch { Swal.fire("Error", "Failed to activate plan", "error"); }
  };

  const activateWorkoutPlan = async (planId) => {
    try {
      await axios.put(`${API}/workout/${planId}/activate`, {},
        { headers: { Authorization: `Bearer ${token}` } });
      const res = await axios.get(`${API}/workout/client/${id}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setWorkoutPlans(res.data);
      Swal.fire({ title: "Workout Plan Activated!", icon: "success", timer: 1200, showConfirmButton: false });
    } catch { Swal.fire("Error", "Failed to activate plan", "error"); }
  };

  const getBmi = () => {
    if (!client?.heightCm || !client?.weightKg) return null;
    const h = client.heightCm / 100;
    return (client.weightKg / (h * h)).toFixed(1);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#f0fdf4" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 animate-spin mx-auto mb-3"
          style={{ borderColor: TEAL, borderTopColor: "transparent" }} />
        <p className="text-gray-400 animate-pulse">Loading client details...</p>
      </div>
    </div>
  );

  if (!client) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center"><p className="text-3xl mb-4">❌</p><p className="text-gray-500">Client not found!</p></div>
    </div>
  );

  const bmi = getBmi();

  return (
    <div className="min-h-screen pb-10" style={{ background: "#f0fdf4" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(20,184,166,0.80) 100%), url('https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "200px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div>
            <button onClick={() => navigate("/trainer/my-clients")}
              className="flex items-center gap-1 text-teal-200 text-xs font-medium mb-3 hover:text-white transition-colors">
              ← Back to My Clients
            </button>
            <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Client Details</p>
            <h1 className="text-4xl font-black tracking-tight">{client.name} 👤</h1>
            <p className="text-teal-100 mt-1 text-sm">{client.email}</p>
          </div>
          {/* Stat pills */}
          <div className="hidden md:flex gap-2">
            {[
              { label: "Weight",  value: client.weightKg   ? `${client.weightKg} kg`   : "—" },
              { label: "Height",  value: client.heightCm   ? `${client.heightCm} cm`   : "—" },
              { label: "BMI",     value: bmi               ? bmi                        : "—" },
              { label: "Goal",    value: client.goalType   || "—"                              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                <p className="text-xs text-teal-200 mb-0.5">{label}</p>
                <p className="font-bold text-white text-sm leading-none">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* CLIENT INFO */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Client Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Full Name",   value: client.name              },
              { label: "Email",       value: client.email             },
              { label: "Phone",       value: client.phone   || "—"    },
              { label: "Gender",      value: client.gender  || "—"    },
              { label: "Age",         value: client.age     ? `${client.age} yrs` : "—" },
              { label: "Height",      value: client.heightCm? `${client.heightCm} cm`   : "—" },
              { label: "Weight",      value: client.weightKg? `${client.weightKg} kg`   : "—" },
              { label: "Goal",        value: client.goalType|| "—"    },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl" style={{ background: TEAL_LIGHT }}>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="font-semibold text-gray-800 text-sm mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MEAL PLANS */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Meal Plans</h3>
              <p className="text-xs text-gray-400 mt-0.5">{mealPlans.length} plan{mealPlans.length !== 1 ? "s" : ""} assigned</p>
            </div>
            <button onClick={() => navigate(`/trainer/client/${id}/assign-diet`)}
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
              style={{ background: TEAL }}>
              + New Meal Plan
            </button>
          </div>
          {mealPlans.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">🥗</p>
              <p className="text-sm text-gray-400">No meal plans assigned yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: TEAL_LIGHT }}>
                    {["Plan Name", "Calories", "Protein", "Carbs", "Fats", "Items", "Created", "Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide"
                        style={{ color: TEAL_DARK }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {mealPlans.map(plan => (
                    <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-800 text-sm">{plan.planName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{plan.targetCalories} kcal</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{plan.targetProtein}g</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{plan.targetCarbs}g</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{plan.targetFats}g</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{plan.items?.length || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {plan.isActive ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: "#dcfce7", color: "#166534" }}>✓ Active</span>
                        ) : (
                          <button onClick={() => activateMealPlan(plan.id)}
                            className="px-3 py-1 rounded-full text-xs font-bold border-2 transition-all hover:opacity-90"
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
          )}
        </div>

        {/* WORKOUT PLANS */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Workout Plans</h3>
              <p className="text-xs text-gray-400 mt-0.5">{workoutPlans.length} plan{workoutPlans.length !== 1 ? "s" : ""} assigned</p>
            </div>
            <button onClick={() => navigate(`/trainer/client/${id}/assign-workout`)}
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
              style={{ background: TEAL }}>
              + New Workout Plan
            </button>
          </div>
          {workoutPlans.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">💪</p>
              <p className="text-sm text-gray-400">No workout plans assigned yet</p>
            </div>
          ) : (
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
                  {workoutPlans.map(plan => (
                    <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-800 text-sm">{plan.title || "Workout Plan"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{plan.description || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{plan.exercises?.length || 0} exercises</td>
                      <td className="px-4 py-3">
                        {plan.isActive ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: "#dcfce7", color: "#166534" }}>✓ Active</span>
                        ) : (
                          <button onClick={() => activateWorkoutPlan(plan.id)}
                            className="px-3 py-1 rounded-full text-xs font-bold border-2 transition-all hover:opacity-90"
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
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate("/trainer/my-clients")}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all"
            style={{ borderColor: TEAL, color: TEAL }}>
            ← Back to My Clients
          </button>
          <button onClick={() => navigate("/trainer/client-progress")}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
            style={{ background: TEAL }}>
            📈 View Progress
          </button>
          <button onClick={() => navigate("/trainer/chat")}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
            style={{ background: "#8b5cf6" }}>
            💬 Message Client
          </button>
        </div>
      </div>
    </div>
  );
}