import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, Legend,
} from "recharts";

const API = "http://localhost:8080/api";
const MEAL_TIMES = ["Breakfast", "Lunch", "Snack", "Dinner"];
const MEAL_ICONS = {
  Breakfast: "🌅", Lunch: "☀️",
  Snack: "🍎", Dinner: "🌙",
};
const MEAL_COLORS = {
  Breakfast: "#f59e0b", Lunch: "#10b981",
  Snack: "#8b5cf6", Dinner: "#3b82f6",
};
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DAY_FULL = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT = "#E8F7FD";
const NAVY = "#0A2342";

const getFoodEmoji = (foodName) => {
  const name = foodName?.toLowerCase() || "";
  if (name.includes("rice")) return "🍚";
  if (name.includes("chicken")) return "🍗";
  if (name.includes("fish")) return "🐟";
  if (name.includes("egg")) return "🥚";
  if (name.includes("bread")) return "🍞";
  if (name.includes("milk")) return "🥛";
  if (name.includes("banana")) return "🍌";
  if (name.includes("apple")) return "🍎";
  if (name.includes("vegetable") || name.includes("salad")) return "🥗";
  if (name.includes("dal") || name.includes("lentil")) return "🫘";
  if (name.includes("curry")) return "🍛";
  if (name.includes("roti") || name.includes("chapati")) return "🫓";
  if (name.includes("soup")) return "🍵";
  if (name.includes("fruit")) return "🍇";
  if (name.includes("yogurt") || name.includes("curd")) return "🥣";
  if (name.includes("nut") || name.includes("cashew")) return "🥜";
  if (name.includes("tea") || name.includes("coffee")) return "☕";
  if (name.includes("water")) return "💧";
  return "🍽️";
};

export default function ClientNutritionPlan() {
  const clientId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [noPlan, setNoPlan] = useState(false);
  const [planName, setPlanName] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [targetCalories, setTargetCalories] = useState(0);
  const [targetProtein, setTargetProtein] = useState(0);
  const [targetCarbs, setTargetCarbs] = useState(0);
  const [targetFats, setTargetFats] = useState(0);
  const [notes, setNotes] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [activeTab, setActiveTab] = useState("meals");
  const [completedMeals, setCompletedMeals] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const todayJs = new Date().getDay();
  const todayNum = todayJs === 0 ? 7 : todayJs;
  const [selectedDay, setSelectedDay] = useState(todayNum);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await axios.get(
          `${API}/meal-plans/my-plan/${clientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.message) { setNoPlan(true); setLoading(false); return; }
        const plan = res.data;
        setPlanName(plan.planName);
        setTrainerName(plan.trainerName || "");
        setTargetCalories(plan.targetCalories);
        setTargetProtein(plan.targetProtein || 0);
        setTargetCarbs(plan.targetCarbs || 0);
        setTargetFats(plan.targetFats || 0);
        setNotes(plan.notes || "");
        setAllItems(plan.items || []);
        setLoading(false);
      } catch {
        setNoPlan(true);
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  const getDayItems = (day) => allItems.filter(item => item.dayOfWeek === day);
  const getMealItems = (day, mealTime) => getDayItems(day).filter(item => item.mealTime === mealTime);
  const getMealCalories = (day, mealTime) => getMealItems(day, mealTime).reduce((sum, item) => sum + item.calories, 0);

  const dayTotalCalories = getDayItems(selectedDay).reduce((sum, item) => sum + item.calories, 0);
  const consumedCalories = MEAL_TIMES.filter(mt => completedMeals[`${selectedDay}-${mt}`])
    .reduce((sum, mt) => sum + getMealCalories(selectedDay, mt), 0);
  const remainingCalories = Math.max(dayTotalCalories - consumedCalories, 0);
  const calProgress = dayTotalCalories > 0 ? Math.min(consumedCalories / dayTotalCalories, 1) : 0;
  const completedMealsCount = MEAL_TIMES.filter(mt => completedMeals[`${selectedDay}-${mt}`]).length;

  const weeklyChartData = DAYS.map((day, i) => {
    const dayNum = i + 1;
    const kcal = getDayItems(dayNum).reduce((sum, item) => sum + item.calories, 0);
    return { day, kcal, isToday: dayNum === todayNum };
  });

  const macroPieData = [
    { name: "Protein", value: targetProtein, color: "#f59e0b" },
    { name: "Carbs",   value: targetCarbs,   color: "#10b981" },
    { name: "Fats",    value: targetFats,    color: "#ef4444" },
  ].filter(d => d.value > 0);

  const markMealDone = (mealTime) => {
    const key = `${selectedDay}-${mealTime}`;
    setCompletedMeals(prev => ({ ...prev, [key]: true }));
    Swal.fire({
      title: "Meal Logged! 🍽️",
      html: `<p style="color:#374151;"><strong>${mealTime}</strong> completed!<br/><span style="color:#29ABE2;font-size:20px;font-weight:bold;">+${getMealCalories(selectedDay, mealTime)} kcal</span> logged</p>`,
      icon: "success", timer: 1500, showConfirmButton: false, background: "#f0fdf4",
    });
  };

  const filteredItems = searchQuery
    ? allItems.filter(item => item.foodName?.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#f0f9ff" }}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🥗</div>
          <p className="text-gray-400 animate-pulse">Loading meal plan...</p>
        </div>
      </div>
    );
  }

  if (noPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: "#f0f9ff" }}>
        <div className="text-8xl">🥗</div>
        <h2 className="text-2xl font-bold text-gray-600">No Meal Plan Yet</h2>
        <p className="text-gray-400 text-sm text-center max-w-sm">Your trainer hasn't assigned a meal plan yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f0f9ff" }}>

      {/* ── HERO — matches dashboard style ── */}
      <div
        className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.70) 50%, rgba(41,171,226,0.80) 100%), url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1400&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "200px",
        }}>

        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-6 flex-wrap">

            {/* LEFT */}
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
                My Nutrition Plan
              </p>
              <h1 className="text-4xl font-black tracking-tight">
                {planName || "My Meal Plan"} 🥗
              </h1>
              <p className="text-blue-100 mt-1 text-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long", month: "long", day: "numeric"
                })}
                {trainerName && (
                  <> · Assigned by <span className="text-white font-bold">{trainerName}</span></>
                )}
              </p>

              {/* macro pills */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { label: "🔥 Calories", value: `${targetCalories} kcal` },
                  { label: "💪 Protein",  value: `${targetProtein}g`      },
                  { label: "⚡ Carbs",    value: `${targetCarbs}g`         },
                  { label: "🫙 Fats",     value: `${targetFats}g`          },
                ].map(({ label, value }) => (
                  <div key={label}
                    className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                    <p className="text-xs text-blue-200">{label}</p>
                    <p className="font-bold text-white text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — today summary */}
            <div className="hidden md:flex flex-col gap-2 items-end">
              <div className="bg-white/15 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 text-center">
                <p className="text-xs text-blue-200 mb-1">Today's Progress</p>
                <p className="text-3xl font-black text-white">{Math.round(calProgress * 100)}%</p>
                <p className="text-xs text-blue-200 mt-1">{consumedCalories} / {dayTotalCalories} kcal</p>
                <div className="h-1.5 bg-white/20 rounded-full mt-2 w-32">
                  <div className="h-full rounded-full bg-white transition-all" style={{ width: `${calProgress * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── END HERO ── */}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* TABS */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { id: "meals",  label: "🍽️ Meals"   },
              { id: "macros", label: "📊 Macros"  },
              { id: "weekly", label: "📅 Weekly"  },
              { id: "search", label: "🔍 Foods"   },
            ].map(tab => (
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

            {/* ══ MEALS TAB ══ */}
            {activeTab === "meals" && (
              <div className="space-y-5">

                {/* DAY SELECTOR — full day names */}
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS.map((day, i) => {
                    const dayNum  = i + 1;
                    const isToday = dayNum === todayNum;
                    const isSel   = dayNum === selectedDay;
                    const kcal    = getDayItems(dayNum).reduce((s, it) => s + it.calories, 0);
                    return (
                      <button key={dayNum} onClick={() => setSelectedDay(dayNum)}
                        className="flex flex-col items-center py-2.5 rounded-xl transition-all duration-200"
                        style={{
                          background: isSel ? BLUE : isToday ? BLUE_LIGHT : "#f9fafb",
                          color:      isSel ? "#fff" : isToday ? BLUE_DARK : "#6b7280",
                          border:     isToday && !isSel ? `2px solid ${BLUE}40` : "2px solid transparent",
                          transform:  isSel ? "scale(1.05)" : "scale(1)",
                        }}>
                        <span className="text-xs font-bold">{day}</span>
                        <span className="text-sm font-black mt-0.5">{dayNum}</span>
                        <span className="text-xs mt-0.5"
                          style={{ color: isSel ? "rgba(255,255,255,0.8)" : kcal > 0 ? BLUE : "#d1d5db" }}>
                          {kcal > 0 ? `${kcal}` : "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* SELECTED DAY HEADER */}
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {DAY_FULL[selectedDay - 1]}'s Meals
                      {selectedDay === todayNum && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full text-white align-middle"
                          style={{ background: BLUE }}>Today</span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {MEAL_TIMES.filter(mt => getMealItems(selectedDay, mt).length > 0).length} meals planned · {dayTotalCalories} kcal total
                    </p>
                  </div>
                  {/* mini progress */}
                  <div className="text-right">
                    <p className="text-xs font-bold" style={{ color: BLUE }}>{completedMealsCount}/4 done</p>
                    <div className="h-1.5 w-20 bg-gray-100 rounded-full mt-1">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(completedMealsCount / 4) * 100}%`, background: BLUE }} />
                    </div>
                  </div>
                </div>

                {/* MEAL CARDS */}
                <div className="space-y-4">
                  {MEAL_TIMES.map(mealTime => {
                    const items    = getMealItems(selectedDay, mealTime);
                    const mealCals = getMealCalories(selectedDay, mealTime);
                    const key      = `${selectedDay}-${mealTime}`;
                    const isDone   = completedMeals[key];
                    const color    = MEAL_COLORS[mealTime];

                    return (
                      <div key={mealTime}
                        className="rounded-2xl overflow-hidden border-2 transition-all"
                        style={{
                          borderColor: isDone ? color : "#f1f5f9",
                          background:  isDone ? `${color}08` : "white",
                        }}>

                        {/* MEAL HEADER */}
                        <div className="flex items-center justify-between px-5 py-4"
                          style={{ background: isDone ? `${color}15` : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                              style={{ background: `${color}20` }}>
                              {MEAL_ICONS[mealTime]}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">{mealTime}</p>
                              <p className="text-xs text-gray-400">
                                {items.length > 0 ? `${items.length} food${items.length > 1 ? "s" : ""}` : "No foods assigned"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-lg" style={{ color }}>{mealCals} <span className="text-xs font-normal text-gray-400">kcal</span></p>
                            {isDone && <p className="text-xs font-semibold" style={{ color }}>✓ Logged</p>}
                          </div>
                        </div>

                        {/* FOOD TABLE */}
                        {items.length > 0 ? (
                          <div className="px-5 py-4">
                            <table className="w-full text-sm mb-4">
                              <thead>
                                <tr className="text-xs text-gray-400 border-b border-gray-100">
                                  <th className="text-left pb-2 font-semibold">Food</th>
                                  <th className="text-center pb-2 font-semibold">Amount</th>
                                  <th className="text-right pb-2 font-semibold">Calories</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {items.map((item, i) => (
                                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-2.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">{getFoodEmoji(item.foodName)}</span>
                                        <span className="font-medium text-gray-800">{item.foodName}</span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 text-center">
                                      <span className="text-xs px-2 py-1 rounded-lg text-gray-600"
                                        style={{ background: `${color}15` }}>
                                        {item.unit}
                                      </span>
                                    </td>
                                    <td className="py-2.5 text-right">
                                      <span className="font-bold" style={{ color }}>{item.calories}</span>
                                      <span className="text-xs text-gray-400 ml-1">kcal</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t border-gray-100">
                                  <td className="pt-2 text-xs text-gray-400 font-semibold" colSpan={2}>Total</td>
                                  <td className="pt-2 text-right font-black" style={{ color }}>{mealCals} kcal</td>
                                </tr>
                              </tfoot>
                            </table>

                            {!isDone ? (
                              <button onClick={() => markMealDone(mealTime)}
                                className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95 hover:opacity-90"
                                style={{ background: color }}>
                                ✓ Mark as Completed
                              </button>
                            ) : (
                              <div className="w-full py-2.5 rounded-xl text-sm text-center font-semibold"
                                style={{ background: `${color}15`, color }}>
                                ✅ Completed — {mealCals} kcal logged
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="px-5 py-6 text-center">
                            <p className="text-gray-300 text-sm italic">No foods assigned for this meal</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* TRAINER NOTES */}
                {notes && (
                  <div className="rounded-2xl p-4 border" style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">📝</span>
                      <p className="font-bold text-amber-800 text-sm">Trainer Notes</p>
                    </div>
                    <p className="text-amber-700 text-sm">{notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* ══ MACROS TAB ══ */}
            {activeTab === "macros" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-800 mb-4">Daily Macro Targets</h3>
                  <div className="space-y-4">
                    {[
                      { label: "🔥 Calories",      value: targetCalories, unit: "kcal", color: BLUE,      desc: "Total daily energy"      },
                      { label: "💪 Protein",        value: targetProtein,  unit: "g",    color: "#f59e0b", desc: "Muscle building & repair" },
                      { label: "⚡ Carbohydrates",  value: targetCarbs,    unit: "g",    color: "#10b981", desc: "Energy source"            },
                      { label: "🫙 Fats",           value: targetFats,     unit: "g",    color: "#ef4444", desc: "Hormone production"       },
                    ].map(({ label, value, unit, color, desc }) => (
                      <div key={label} className="p-4 rounded-xl" style={{ background: "#f9fafb" }}>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{label}</p>
                            <p className="text-xs text-gray-400">{desc}</p>
                          </div>
                          <p className="text-xl font-black" style={{ color }}>
                            {value}<span className="text-xs text-gray-400 font-normal ml-1">{unit}</span>
                          </p>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: "100%", background: `linear-gradient(90deg, ${color}80, ${color})` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {macroPieData.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-800 mb-4">Macro Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={macroPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                          {macroPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v}g`, n]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {[
                        { label: "Protein", pct: targetProtein > 0 ? Math.round((targetProtein * 4 / targetCalories) * 100) : 0, color: "#f59e0b", tip: "4 kcal/g" },
                        { label: "Carbs",   pct: targetCarbs > 0   ? Math.round((targetCarbs * 4   / targetCalories) * 100) : 0, color: "#10b981", tip: "4 kcal/g" },
                        { label: "Fats",    pct: targetFats > 0    ? Math.round((targetFats * 9    / targetCalories) * 100) : 0, color: "#ef4444", tip: "9 kcal/g" },
                      ].map(m => (
                        <div key={m.label} className="text-center p-3 rounded-xl" style={{ background: `${m.color}15` }}>
                          <p className="text-xl font-black" style={{ color: m.color }}>{m.pct}%</p>
                          <p className="text-xs font-bold text-gray-700">{m.label}</p>
                          <p className="text-xs text-gray-400">{m.tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${NAVY}, ${BLUE_DARK})` }}>
                  <p className="text-white font-bold mb-3">💡 Nutrition Tips</p>
                  <div className="space-y-2">
                    {["Drink at least 2L of water daily","Eat protein with every meal","Don't skip breakfast","Eat slowly and mindfully"].map(tip => (
                      <div key={tip} className="flex items-center gap-2">
                        <span className="text-green-400 text-xs">✓</span>
                        <p className="text-blue-100 text-xs">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ WEEKLY TAB ══ */}
            {activeTab === "weekly" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Weekly Calorie Plan</h3>
                  <p className="text-xs text-gray-400 mb-4">Planned calories per day</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} formatter={v => [`${v} kcal`, "Calories"]} />
                      <Bar dataKey="kcal" radius={[6,6,0,0]} fill={BLUE} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* WEEKLY TABLE */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">Weekly Meal Summary</h3>
                  <div className="rounded-2xl overflow-hidden border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: NAVY }}>
                          <th className="text-left px-4 py-3 text-xs text-blue-200 font-semibold">Day</th>
                          <th className="text-center px-3 py-3 text-xs text-blue-200 font-semibold">🌅 Breakfast</th>
                          <th className="text-center px-3 py-3 text-xs text-blue-200 font-semibold">☀️ Lunch</th>
                          <th className="text-center px-3 py-3 text-xs text-blue-200 font-semibold">🍎 Snack</th>
                          <th className="text-center px-3 py-3 text-xs text-blue-200 font-semibold">🌙 Dinner</th>
                          <th className="text-right px-4 py-3 text-xs text-blue-200 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {DAYS.map((day, i) => {
                          const dayNum  = i + 1;
                          const isToday = dayNum === todayNum;
                          const total   = getDayItems(dayNum).reduce((s, it) => s + it.calories, 0);
                          return (
                            <tr key={dayNum}
                              onClick={() => { setSelectedDay(dayNum); setActiveTab("meals"); }}
                              className="cursor-pointer hover:bg-blue-50 transition-colors"
                              style={{ background: isToday ? BLUE_LIGHT : "white" }}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                                    style={{ background: isToday ? BLUE : "#e5e7eb", color: isToday ? "white" : "#374151" }}>
                                    {dayNum}
                                  </div>
                                  <span className="font-semibold text-gray-800">{day}</span>
                                  {isToday && <span className="text-xs px-1.5 py-0.5 rounded-full text-white" style={{ background: BLUE }}>Today</span>}
                                </div>
                              </td>
                              {MEAL_TIMES.map(mt => {
                                const kcal = getMealCalories(dayNum, mt);
                                const color = MEAL_COLORS[mt];
                                return (
                                  <td key={mt} className="px-3 py-3 text-center">
                                    {kcal > 0
                                      ? <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: `${color}15`, color }}>{kcal}</span>
                                      : <span className="text-xs text-gray-300">—</span>}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 text-right">
                                <span className="font-black text-sm" style={{ color: total > 0 ? BLUE : "#d1d5db" }}>
                                  {total > 0 ? `${total} kcal` : "—"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">Click any row to view that day's meals</p>
                </div>
              </div>
            )}

            {/* ══ FOODS TAB ══ */}
            {activeTab === "search" && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800">All Foods in Your Plan</h3>
                <input
                  type="text"
                  placeholder="🔍 Search foods..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 text-sm text-gray-800 focus:outline-none"
                  onFocus={e => e.target.style.borderColor = BLUE}
                  onBlur={e => e.target.style.borderColor = "#f3f4f6"} />

                {searchQuery ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">{filteredItems.length} results</p>
                    {filteredItems.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm">No foods found matching "{searchQuery}"</p>
                    ) : (
                      filteredItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#f9fafb" }}>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getFoodEmoji(item.foodName)}</span>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{item.foodName}</p>
                              <p className="text-xs text-gray-400">{DAYS[item.dayOfWeek - 1]} · {item.mealTime} · {item.unit}</p>
                            </div>
                          </div>
                          <p className="font-bold text-sm" style={{ color: BLUE }}>{item.calories} kcal</p>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {MEAL_TIMES.map(mealTime => {
                      const mealFoods   = allItems.filter(item => item.mealTime === mealTime);
                      const uniqueFoods = [...new Map(mealFoods.map(item => [item.foodName, item])).values()];
                      if (uniqueFoods.length === 0) return null;
                      const color = MEAL_COLORS[mealTime];
                      return (
                        <div key={mealTime}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{MEAL_ICONS[mealTime]}</span>
                            <p className="font-bold text-gray-700 text-sm">{mealTime}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: color }}>{uniqueFoods.length} foods</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {uniqueFoods.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 p-3 rounded-xl"
                                style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                                <span className="text-xl">{getFoodEmoji(item.foodName)}</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-gray-800 truncate">{item.foodName}</p>
                                  <p className="text-xs" style={{ color }}>{item.calories} kcal</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}