import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import api from "../../api/api";

const API = "http://localhost:8080/api";
const TEAL       = "#14b8a6";
const TEAL_DARK  = "#0d9488";
const TEAL_LIGHT = "#f0fdfa";
const MEAL_TIMES = ["Breakfast", "Lunch", "Snack", "Dinner"];
const DAYS = [
  { label: "Mon", value: 1 }, { label: "Tue", value: 2 },
  { label: "Wed", value: 3 }, { label: "Thu", value: 4 },
  { label: "Fri", value: 5 }, { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

export default function TrainerAssignMeal() {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const trainerId = localStorage.getItem("userId");

  const [client, setClient] = useState(null);
  const [existingPlans, setExistingPlans] = useState([]);

  const [planName, setPlanName] = useState("");
  const [targetCalories, setTargetCalories] = useState("");
  const [targetProtein, setTargetProtein] = useState("");
  const [targetCarbs, setTargetCarbs] = useState("");
  const [targetFats, setTargetFats] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMealTime, setSelectedMealTime] = useState("Breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [customFoodName, setCustomFoodName] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFats, setCustomFats] = useState("");
  const [customUnit, setCustomUnit] = useState("100g");

  const [mealItems, setMealItems] = useState(() => {
    const init = {};
    DAYS.forEach(({ value }) => {
      init[value] = { Breakfast: [], Lunch: [], Snack: [], Dinner: [] };
    });
    return init;
  });

  useEffect(() => {
    api.get(`/api/profile/client/${id}`)
      .then(res => setClient(res.data))
      .catch(() => {});

    if (trainerId) {
      axios.get(`${API}/meal-plans/client/${id}/trainer/${trainerId}`,
        { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setExistingPlans(res.data || []))
        .catch(() => setExistingPlans([]));
    }
  }, [id, trainerId]);

  const activateMealPlan = async (planId) => {
    try {
      await axios.put(`${API}/meal-plans/${planId}/activate`, {},
        { headers: { Authorization: `Bearer ${token}` } });
      const res = await axios.get(`${API}/meal-plans/client/${id}/trainer/${trainerId}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setExistingPlans(res.data || []);
      Swal.fire({ title: "Plan Activated!", icon: "success", timer: 1200, showConfirmButton: false });
    } catch { Swal.fire("Error", "Failed to activate plan", "error"); }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const res = await axios.get(`${API}/meal-plans/foods/search?q=${query}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setSearchResults(res.data);
    } catch { setSearchResults([]); }
  };

  const addFoodFromSearch = (food) => {
    const item = {
      dayOfWeek: selectedDay, mealTime: selectedMealTime,
      foodName: food.name, calories: food.calories,
      quantity: 1, unit: food.unit,
      protein: food.protein, carbs: food.carbs, fats: food.fats,
    };
    setMealItems(prev => ({
      ...prev,
      [selectedDay]: { ...prev[selectedDay], [selectedMealTime]: [...prev[selectedDay][selectedMealTime], item] },
    }));
    setSearchQuery(""); setSearchResults([]);
  };

  const addCustomFood = () => {
    if (!customFoodName || !customCalories) {
      Swal.fire({ icon: "error", title: "Missing fields", text: "Food name and calories are required" }); return;
    }
    const item = {
      dayOfWeek: selectedDay, mealTime: selectedMealTime,
      foodName: customFoodName, calories: parseInt(customCalories),
      quantity: 1, unit: customUnit,
      protein: parseFloat(customProtein) || 0,
      carbs: parseFloat(customCarbs) || 0,
      fats: parseFloat(customFats) || 0,
    };
    setMealItems(prev => ({
      ...prev,
      [selectedDay]: { ...prev[selectedDay], [selectedMealTime]: [...prev[selectedDay][selectedMealTime], item] },
    }));
    setCustomFoodName(""); setCustomCalories(""); setCustomProtein("");
    setCustomCarbs(""); setCustomFats(""); setCustomUnit("100g");
  };

  const removeItem = (day, mealTime, index) => {
    setMealItems(prev => ({
      ...prev,
      [day]: { ...prev[day], [mealTime]: prev[day][mealTime].filter((_, i) => i !== index) },
    }));
  };

  const totalItems = Object.values(mealItems).flatMap(d => Object.values(d)).flat().length;
  const getDayCalories = (day) => Object.values(mealItems[day]).flat().reduce((sum, item) => sum + item.calories, 0);

  const handleSave = async () => {
    if (!planName || !targetCalories) {
      Swal.fire({ icon: "error", title: "Missing fields", text: "Please enter plan name and target calories" }); return;
    }
    if (totalItems === 0) {
      Swal.fire({ icon: "error", title: "No foods added", text: "Please add at least one food item" }); return;
    }
    const allItems = Object.values(mealItems).flatMap(d => Object.values(d)).flat();
    try {
      await axios.post(`${API}/meal-plans/create`, {
        trainerId: parseInt(trainerId), clientId: parseInt(id),
        planName, targetCalories: parseInt(targetCalories),
        targetProtein: parseFloat(targetProtein) || 0,
        targetCarbs: parseFloat(targetCarbs) || 0,
        targetFats: parseFloat(targetFats) || 0,
        notes, items: allItems,
      }, { headers: { Authorization: `Bearer ${token}` } });

      Swal.fire({ icon: "success", title: "Weekly Meal Plan Saved! 🎉", confirmButtonColor: TEAL })
        .then(() => navigate(`/trainer/client/${id}`));
    } catch { Swal.fire({ icon: "error", title: "Failed to save", text: "Something went wrong. Please try again." }); }
  };

  const currentDayItems = mealItems[selectedDay];
  const currentDayCalories = getDayCalories(selectedDay);

  return (
    <div className="min-h-screen pb-10" style={{ background: "#f0fdf4" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(20,184,166,0.80) 100%), url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "180px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <button onClick={() => navigate(`/trainer/client/${id}`)}
            className="flex items-center gap-1 text-teal-200 text-xs font-medium mb-3 hover:text-white transition-colors">
            ← Back to Client
          </button>
          <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Assign Meal Plan</p>
          <h1 className="text-4xl font-black tracking-tight">Weekly Meal Plan 🥗</h1>
          <p className="text-teal-100 mt-1 text-sm">
            Creating nutrition plan for <span className="font-bold text-white">{client?.name || "client"}</span>
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* EXISTING PLANS TABLE */}
        {existingPlans.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Existing Meal Plans</h3>
              <p className="text-xs text-gray-400 mt-0.5">Set a plan as active for the client to see</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: TEAL_LIGHT }}>
                    {["Plan Name", "Calories", "Protein", "Carbs", "Fats", "Items", "Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide"
                        style={{ color: TEAL_DARK }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {existingPlans.map(plan => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-800 text-sm">{plan.planName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{plan.targetCalories} kcal</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{plan.targetProtein}g</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{plan.targetCarbs}g</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{plan.targetFats}g</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{plan.items?.length || 0}</td>
                      <td className="px-4 py-3">
                        {plan.isActive ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: "#dcfce7", color: "#166534" }}>✓ Active</span>
                        ) : (
                          <button onClick={() => activateMealPlan(plan.id)}
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
            <label className="text-sm text-gray-600 mb-1 block font-medium">Plan Name *</label>
            <input type="text" value={planName} onChange={e => setPlanName(e.target.value)}
              placeholder='e.g. "Week 1 - Cutting Plan"'
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm bg-gray-50 focus:outline-none"
              onFocus={e => e.target.style.borderColor = TEAL}
              onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Calories (kcal)", val: targetCalories, set: setTargetCalories },
              { label: "Protein (g)",     val: targetProtein,  set: setTargetProtein  },
              { label: "Carbs (g)",       val: targetCarbs,    set: setTargetCarbs    },
              { label: "Fats (g)",        val: targetFats,     set: setTargetFats     },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-sm text-gray-600 mb-1 block font-medium">{label}</label>
                <input type="number" value={val} onChange={e => set(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm bg-gray-50 focus:outline-none"
                  onFocus={e => e.target.style.borderColor = TEAL}
                  onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
              </div>
            ))}
          </div>
        </div>

        {/* DAY TABS */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Select Day</h3>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(({ label, value }) => {
              const dayTotal = getDayCalories(value);
              return (
                <button key={value} onClick={() => setSelectedDay(value)}
                  className="flex flex-col items-center px-4 py-2 rounded-xl text-sm font-medium transition border"
                  style={{
                    background: selectedDay === value ? TEAL : "#f9fafb",
                    color: selectedDay === value ? "#fff" : "#6b7280",
                    borderColor: selectedDay === value ? TEAL : "#e5e7eb",
                  }}>
                  <span>{label}</span>
                  {dayTotal > 0 && (
                    <span className="text-xs mt-0.5"
                      style={{ color: selectedDay === value ? "rgba(255,255,255,0.8)" : TEAL }}>
                      {dayTotal} kcal
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ADD FOOD */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            Add Foods — <span style={{ color: TEAL }}>{DAYS.find(d => d.value === selectedDay)?.label}</span>
          </h3>
          <p className="text-xs text-gray-400 mb-4">{currentDayCalories} kcal planned for this day</p>

          {/* Meal time tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {MEAL_TIMES.map(mt => (
              <button key={mt} onClick={() => setSelectedMealTime(mt)}
                className="px-4 py-2 rounded-full text-sm font-medium transition"
                style={{
                  background: selectedMealTime === mt ? TEAL : "#f3f4f6",
                  color: selectedMealTime === mt ? "white" : "#6b7280",
                }}>
                {mt} ({currentDayItems[mt].length})
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <label className="text-sm text-gray-600 mb-1 block font-medium">Search Sri Lankan Foods</label>
            <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)}
              placeholder="Type food name e.g. rice, dhal, kottu..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm bg-gray-50 focus:outline-none"
              onFocus={e => e.target.style.borderColor = TEAL}
              onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto">
                {searchResults.map(food => (
                  <div key={food.id} onClick={() => addFoodFromSearch(food)}
                    className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{food.name}</p>
                      <p className="text-xs text-gray-400">{food.category} · {food.unit}</p>
                    </div>
                    <span className="font-semibold text-sm" style={{ color: TEAL }}>{food.calories} kcal</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm">or add custom food</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Custom food */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { ph: "Food name",   val: customFoodName,  set: setCustomFoodName,  type: "text"   },
              { ph: "Calories",    val: customCalories,  set: setCustomCalories,  type: "number" },
              { ph: "Unit (100g)", val: customUnit,      set: setCustomUnit,      type: "text"   },
              { ph: "Protein (g)", val: customProtein,   set: setCustomProtein,   type: "number" },
              { ph: "Carbs (g)",   val: customCarbs,     set: setCustomCarbs,     type: "number" },
              { ph: "Fats (g)",    val: customFats,      set: setCustomFats,      type: "number" },
            ].map(({ ph, val, set, type }) => (
              <input key={ph} type={type} placeholder={ph} value={val}
                onChange={e => set(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm bg-gray-50 focus:outline-none"
                onFocus={e => e.target.style.borderColor = TEAL}
                onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
            ))}
          </div>
          <button onClick={addCustomFood}
            className="mt-3 px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
            style={{ background: TEAL_DARK }}>
            + Add to {DAYS.find(d => d.value === selectedDay)?.label} {selectedMealTime}
          </button>
        </div>

        {/* DAY PREVIEW */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              {DAYS.find(d => d.value === selectedDay)?.label} Preview
            </h3>
            <span className="font-bold text-lg" style={{ color: TEAL }}>{currentDayCalories} kcal</span>
          </div>
          {MEAL_TIMES.map(mt => (
            <div key={mt} className="mb-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{mt}</h4>
              {currentDayItems[mt].length === 0 ? (
                <p className="text-gray-300 text-sm italic px-2">No foods added yet</p>
              ) : (
                currentDayItems[mt].map((item, i) => (
                  <div key={i} className="flex justify-between items-center rounded-xl px-4 py-2.5 mb-1"
                    style={{ background: TEAL_LIGHT }}>
                    <div>
                      <span className="text-gray-800 font-medium text-sm">{item.foodName}</span>
                      <span className="text-gray-400 text-xs ml-2">{item.unit}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm" style={{ color: TEAL }}>{item.calories} kcal</span>
                      <button onClick={() => removeItem(selectedDay, mt, i)}
                        className="text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        {/* WEEKLY SUMMARY */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Weekly Summary</h3>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map(({ label, value }) => {
              const kcal = getDayCalories(value);
              const items = Object.values(mealItems[value]).flat().length;
              return (
                <div key={value} onClick={() => setSelectedDay(value)}
                  className="text-center p-2 rounded-xl cursor-pointer border transition"
                  style={{ background: selectedDay === value ? TEAL_LIGHT : "#f9fafb", borderColor: selectedDay === value ? TEAL : "#f1f5f9" }}>
                  <p className="text-xs font-semibold" style={{ color: selectedDay === value ? TEAL_DARK : "#6b7280" }}>{label}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: kcal > 0 ? TEAL : "#d1d5db" }}>{kcal > 0 ? kcal : "—"}</p>
                  <p className="text-xs text-gray-400">{items > 0 ? `${items} foods` : "empty"}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* NOTES */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <label className="text-sm text-gray-600 mb-1 block font-medium">Additional Notes (optional)</label>
          <textarea rows="3" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Any special instructions for the client..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm bg-gray-50 focus:outline-none resize-none"
            onFocus={e => e.target.style.borderColor = TEAL}
            onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
        </div>

        {/* SAVE + CANCEL */}
        <div className="flex gap-4">
          <button onClick={handleSave}
            className="flex-1 py-4 rounded-xl font-semibold text-lg text-white hover:opacity-90 active:scale-95 transition-all"
            style={{ background: TEAL }}>
            🥗 Save Weekly Meal Plan
            {totalItems > 0 && <span className="ml-2 text-sm font-normal opacity-80">({totalItems} food items)</span>}
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