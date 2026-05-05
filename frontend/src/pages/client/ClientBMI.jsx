import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8080/api";
const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const NAVY = "#0A2342";

export default function ClientBMI() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState(null);
  const [category, setCategory] = useState("");
  const [history, setHistory] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/bmi/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data);
    } catch { setHistory([]); }
  };

  const calculateBMI = async () => {
    if (!height || !weight) return;
    const h = height / 100;
    const bmiValue = parseFloat((weight / (h * h)).toFixed(1));
    setBmi(bmiValue);
    let cat = "";
    if (bmiValue < 18.5)    cat = "Underweight";
    else if (bmiValue < 25) cat = "Normal Weight";
    else if (bmiValue < 30) cat = "Overweight";
    else                    cat = "Obese";
    setCategory(cat);
    try {
      await axios.post(`${API}/bmi/save`, {
        heightCm: parseFloat(height),
        weightKg: parseFloat(weight),
        bmiValue, category: cat,
      }, { headers: { Authorization: `Bearer ${token}` } });
      fetchHistory();
    } catch { console.error("Failed to save BMI"); }
  };

  const getCategoryInfo = (cat) => {
    if (cat === "Underweight")   return { color: "#3b82f6", bg: "#eff6ff", light: "#dbeafe" };
    if (cat === "Normal Weight") return { color: "#22c55e", bg: "#f0fdf4", light: "#dcfce7" };
    if (cat === "Overweight")    return { color: "#f59e0b", bg: "#fefce8", light: "#fef3c7" };
    return { color: "#ef4444", bg: "#fef2f2", light: "#fee2e2" };
  };

  const getBmiPercent = (bmiVal) =>
    Math.min(Math.max(((bmiVal - 10) / 30) * 100, 0), 100);

  const latestBmi = history.length > 0 ? history[0] : null;
  const info = bmi ? getCategoryInfo(category) : null;

  return (
    <div className="min-h-screen" style={{ background: "#f0f9ff" }}>

      {/* ── HERO ── */}
      <div
        className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.70) 50%, rgba(41,171,226,0.80) 100%), url('https://media.istockphoto.com/id/2181456286/photo/bmi-concept-with-wooden-blocks-and-measuring-tape-on-wooden-surface.jpg?s=2048x2048&w=is&k=20&c=XBhvru6W5H_dm7zqP0SKMu9JuzJ1KE5Fz449asA-WWQ=')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "200px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Health Tools</p>
              <h1 className="text-4xl font-black tracking-tight">BMI Calculator ⚖️</h1>
              <p className="text-blue-100 mt-1 text-sm">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <p className="text-blue-200 text-sm mt-2 max-w-md">
                Track your Body Mass Index over time and monitor your health progress.
              </p>
            </div>
            {latestBmi && (
              <div className="hidden md:block">
                <div className="bg-white/15 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 text-center">
                  <p className="text-xs text-blue-200 mb-1">Latest BMI</p>
                  <p className="text-4xl font-black text-white">{latestBmi.bmiValue}</p>
                  <p className="text-xs text-blue-200 mt-1">{latestBmi.category}</p>
                  <p className="text-xs text-blue-300 mt-0.5">
                    {new Date(latestBmi.loggedAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ── END HERO ── */}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6">

          {/* ── LEFT COLUMN — Calculator + What is BMI + Healthy Tips ── */}
          <div className="space-y-4">

            {/* CALCULATOR */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-5">Calculate Your BMI</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Height (cm)</label>
                  <input type="number" value={height} onChange={e => setHeight(e.target.value)}
                    placeholder="e.g. 170"
                    className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none transition-all"
                    onFocus={e => e.target.style.borderColor = BLUE}
                    onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Weight (kg)</label>
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                    placeholder="e.g. 65"
                    className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none transition-all"
                    onFocus={e => e.target.style.borderColor = BLUE}
                    onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
                </div>
                <button onClick={calculateBMI}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${BLUE_DARK}, ${BLUE})` }}>
                  ⚖️ Calculate BMI
                </button>
              </div>

              {/* RESULT */}
              {bmi && info && (
                <div className="mt-5 rounded-2xl p-5 border-2 transition-all"
                  style={{ background: info.bg, borderColor: info.color + "40" }}>
                  <div className="text-center mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Your BMI</p>
                    <p className="text-6xl font-black" style={{ color: info.color }}>{bmi}</p>
                    <p className="text-lg font-bold mt-1" style={{ color: info.color }}>{category}</p>
                    <p className="text-xs text-gray-400 mt-1">Saved to your history ✓</p>
                  </div>
                  <div className="mt-3">
                    <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                      <div className="rounded-sm" style={{ width: "20%", background: "#3b82f6" }} />
                      <div className="rounded-sm" style={{ width: "25%", background: "#22c55e" }} />
                      <div className="rounded-sm" style={{ width: "25%", background: "#f59e0b" }} />
                      <div className="rounded-sm" style={{ width: "30%", background: "#ef4444" }} />
                    </div>
                    <div className="relative mt-1" style={{ marginLeft: `${Math.min(getBmiPercent(bmi), 96)}%` }}>
                      <div className="w-3 h-3 rounded-full border-2 border-white shadow-md absolute -top-4 -translate-x-1/2"
                        style={{ background: info.color }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-xl" style={{ background: info.light }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: info.color }}>
                      {category === "Normal Weight" ? "✅ Keep it up!" : "💡 Tip"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {category === "Underweight"   && "Consider increasing calorie intake with nutritious foods and consult your trainer."}
                      {category === "Normal Weight" && "Great BMI! Maintain your balanced diet and regular exercise routine."}
                      {category === "Overweight"    && "Focus on a calorie deficit with healthy foods and regular cardio workouts."}
                      {category === "Obese"         && "Please consult your trainer and a healthcare professional for a personalized plan."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* WHAT IS BMI */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-3">💡 What is BMI?</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Body Mass Index (BMI) is a measure of body fat based on height and weight.
                It is calculated by dividing weight (kg) by height (m²).
              </p>
              <div className="mt-3 p-3 rounded-xl" style={{ background: "#fefce8", border: "1px solid #fde68a" }}>
                <p className="text-xs text-amber-700">
                  ⚠️ BMI is a screening tool. It may not be accurate for athletes, elderly, or pregnant women.
                </p>
              </div>
            </div>

            {/* HEALTHY TIPS */}
            <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${NAVY}, ${BLUE_DARK})` }}>
              <p className="text-white font-bold mb-3">💪 Healthy Tips</p>
              <div className="space-y-2">
                {[
                  "Exercise at least 30 mins daily",
                  "Drink 8 glasses of water a day",
                  "Eat plenty of fruits & vegetables",
                  "Get 7–8 hours of sleep nightly",
                ].map(tip => (
                  <div key={tip} className="flex items-center gap-2">
                    <span className="text-green-400 text-xs flex-shrink-0">✓</span>
                    <p className="text-blue-100 text-xs">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN — BMI Categories only ── */}
          <div className="space-y-4">

            {/* BMI CATEGORIES — original colored bar style */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-4">BMI Categories</h2>
              <div className="space-y-2">
                <div className="p-3 rounded-xl text-white text-sm font-semibold" style={{ background: "#3b82f6" }}>
                  Underweight: &lt; 18.5
                </div>
                <div className="p-3 rounded-xl text-white text-sm font-semibold" style={{ background: "#22c55e" }}>
                  Normal: 18.5 – 24.9
                </div>
                <div className="p-3 rounded-xl text-white text-sm font-semibold" style={{ background: "#f59e0b" }}>
                  Overweight: 25 – 29.9
                </div>
                <div className="p-3 rounded-xl text-white text-sm font-semibold" style={{ background: "#ef4444" }}>
                  Obese: ≥ 30
                </div>
              </div>
            </div>

            {/* BMI SCALE */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-4">BMI Scale</h2>
              <div className="space-y-3">
                {[
                  { label: "Underweight", range: "< 18.5",    color: "#3b82f6", width: "20%" },
                  { label: "Normal",      range: "18.5–24.9", color: "#22c55e", width: "35%" },
                  { label: "Overweight",  range: "25–29.9",   color: "#f59e0b", width: "25%" },
                  { label: "Obese",       range: "≥ 30",      color: "#ef4444", width: "20%" },
                ].map(({ label, range, color, width }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-24 text-xs font-semibold text-right flex-shrink-0" style={{ color }}>{label}</div>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width, background: color }} />
                    </div>
                    <div className="w-16 text-xs text-gray-500 flex-shrink-0">{range}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK REFERENCE */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-4">📏 Quick Reference</h2>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Formula",   value: "Weight (kg) ÷ Height² (m)" },
                  { label: "Ideal BMI", value: "18.5 – 24.9"               },
                  { label: "Unit",      value: "kg/m²"                      },
                  { label: "Best for",  value: "Adults 18–65 years"         },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-500 text-xs">{label}</span>
                    <span className="font-semibold text-gray-800 text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BMI HISTORY */}
        {history.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">BMI History</h2>
                <p className="text-xs text-gray-400 mt-0.5">{history.length} records tracked</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Latest</p>
                <p className="text-xl font-black"
                  style={{ color: getCategoryInfo(history[0]?.category || "Normal Weight").color }}>
                  {history[0]?.bmiValue}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold rounded-l-xl">Date</th>
                    <th className="text-center px-4 py-3 text-xs text-gray-500 font-semibold">Height</th>
                    <th className="text-center px-4 py-3 text-xs text-gray-500 font-semibold">Weight</th>
                    <th className="text-center px-4 py-3 text-xs text-gray-500 font-semibold">BMI</th>
                    <th className="text-center px-4 py-3 text-xs text-gray-500 font-semibold rounded-r-xl">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map((log, i) => {
                    const ci = getCategoryInfo(log.category);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {i === 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full text-white mr-2"
                              style={{ background: BLUE }}>Latest</span>
                          )}
                          {new Date(log.loggedAt).toLocaleDateString("en-US", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{log.heightCm} cm</td>
                        <td className="px-4 py-3 text-center text-gray-600">{log.weightKg} kg</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-black text-lg" style={{ color: ci.color }}>{log.bmiValue}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ background: ci.light || ci.bg, color: ci.color }}>
                            {log.category}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}