import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import heroImage from "../../assets/goal-hero.jpeg";

const BLUE      = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT= "#E8F7FD";
const NAVY      = "#0A2342";
const ML_API    = "http://localhost:5000";

const GOAL_TYPES = [
  { value: "Weight Loss",     icon: "🔥", color: "#ef4444", bg: "#fef2f2", desc: "Burn fat, get lean"    },
  { value: "Muscle Gain",     icon: "💪", color: "#8b5cf6", bg: "#f5f3ff", desc: "Build strength & mass" },
  { value: "General Fitness", icon: "⚡", color: "#10b981", bg: "#f0fdf4", desc: "Stay fit & healthy"    },
];

const ACTIVITY_LEVELS = [
  { value: "Sedentary",   icon: "🪑", label: "Sedentary",   desc: "Desk job, no exercise",    color: "#94a3b8" },
  { value: "Moderate",    icon: "🚶", label: "Moderate",    desc: "Light exercise 1-3x/week", color: "#3b82f6" },
  { value: "Active",      icon: "🏃", label: "Active",      desc: "Exercise 4-5x/week",       color: "#10b981" },
  { value: "Very Active", icon: "🔥", label: "Very Active", desc: "Daily intense training",   color: "#f59e0b" },
];

const ProgressRing = ({ weeks, maxWeeks = 52 }) => {
  const pct    = Math.min(weeks / maxWeeks, 1);
  const r      = 54;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <svg width="140" height="140" className="mx-auto">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={BLUE} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 70 70)" />
      <text x="70" y="65" textAnchor="middle" fontSize="22" fontWeight="bold" fill={BLUE_DARK}>{weeks}</text>
      <text x="70" y="82" textAnchor="middle" fontSize="11" fill="#9ca3af">weeks</text>
    </svg>
  );
};

export default function GoalPredictor() {
  const navigate  = useNavigate();
  const isClient  = localStorage.getItem("role") === "CLIENT";
  const [autoFilled, setAutoFilled] = useState(false);

  const [form, setForm] = useState({
    age: "", gender: "Male", heightCm: "",
    currentWeight: "", goalWeight: "",
    goalType: "Weight Loss", activityLevel: "Moderate",
  });

  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!isClient) return;
    api.get("/api/profile/client").then(res => {
      const d = res.data;
      const mappedGoal =
        d.goalType === "Weight Loss"     ? "Weight Loss"
        : d.goalType === "Muscle Gain"  ? "Muscle Gain"
        : d.goalType === "General Fitness" ? "General Fitness"
        : "Weight Loss";
      setForm(prev => ({
        ...prev,
        age:           d.age        || prev.age,
        gender:        d.gender === "Female" ? "Female" : "Male",
        heightCm:      d.heightCm   || prev.heightCm,
        currentWeight: d.weightKg   || prev.currentWeight,
        goalWeight:    d.goalWeight  || prev.goalWeight,
        goalType:      mappedGoal,
      }));
      setAutoFilled(true);
    }).catch(() => {});
  }, []);

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const validate = () => {
    if (!form.age || !form.heightCm || !form.currentWeight || !form.goalWeight) return "Please fill in all fields";
    if (form.age < 15 || form.age > 70)                          return "Age must be between 15 and 70";
    if (form.heightCm < 140 || form.heightCm > 220)              return "Height must be between 140 and 220 cm";
    if (form.currentWeight < 35 || form.currentWeight > 200)     return "Current weight must be between 35 and 200 kg";
    if (form.goalWeight < 35 || form.goalWeight > 200)           return "Goal weight must be between 35 and 200 kg";
    if (form.goalType === "Weight Loss" && Number(form.goalWeight) >= Number(form.currentWeight)) return "For Weight Loss, goal weight must be LESS than current weight";
    if (form.goalType === "Muscle Gain" && Number(form.goalWeight) <= Number(form.currentWeight)) return "For Muscle Gain, goal weight must be MORE than current weight";
    const diff = Math.abs(form.currentWeight - form.goalWeight);
    if (diff > 60) return "Max weight difference is 60 kg";
    if (diff < 1)  return "Minimum weight difference is 1 kg";
    return null;
  };

  const handlePredict = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`${ML_API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age:           Number(form.age),
          gender:        form.gender,
          heightCm:      Number(form.heightCm),
          currentWeight: Number(form.currentWeight),
          goalWeight:    Number(form.goalWeight),
          goalType:      form.goalType,
          activityLevel: form.activityLevel,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else {
        setResult(data);
        setTimeout(() => document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch {
      setError("Cannot connect to prediction service. Make sure Flask is running on port 5000.");
    }
    setLoading(false);
  };

  const getBmiColor = (cat) => ({ Underweight: "#3b82f6", Normal: "#22c55e", Overweight: "#f97316", Obese: "#ef4444" }[cat] || BLUE);
  const selectedGoal = GOAL_TYPES.find(g => g.value === form.goalType);

  return (
    <div className="min-h-screen" style={{ background: "#F0F4F8" }}>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden" style={{ minHeight: "560px", backgroundColor: NAVY, paddingTop: "64px" }}>

        {/* Background image — positioned to show full body including head */}
        <div className="absolute inset-0" style={{
          backgroundImage:    `url(${heroImage})`,
          backgroundSize:     "auto 100%",
          backgroundPosition: "right top",
          backgroundRepeat:   "no-repeat",
        }} />

        {/* Smooth gradient overlay — left solid to right transparent */}
        <div className="absolute inset-0" style={{
          background: `linear-gradient(
            to right,
            rgba(10,35,66,1.00)  0%,
            rgba(10,35,66,0.98) 15%,
            rgba(10,35,66,0.92) 30%,
            rgba(10,35,66,0.78) 45%,
            rgba(10,35,66,0.50) 60%,
            rgba(10,35,66,0.18) 75%,
            rgba(10,35,66,0.00) 100%
          )`,
        }} />

        {/* Decorative circles */}
        <div className="absolute w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: BLUE, top: "-80px", left: "-80px" }} />

        {/* Content — left aligned, takes up ~55% width */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20">
          <div className="max-w-2xl">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
              style={{ background: "rgba(41,171,226,0.25)", border: "1px solid rgba(41,171,226,0.4)" }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white">🆓 Free Tool — No Login Required</span>
            </div>

            <h1 className="text-5xl font-black mb-4 leading-tight text-white">
              AI Fitness
              <span style={{ color: BLUE }}> Goal</span>
              <br />Predictor
            </h1>

            <p className="text-blue-100 text-lg mb-8 leading-relaxed max-w-lg">
              Our Machine Learning model analyzes your body metrics and predicts exactly how many weeks it will take to reach your fitness goal.
            </p>

            <div className="flex gap-10 flex-wrap">
              {[
                { value: "5,000+", label: "Data Points" },
                { value: "97%",    label: "Accuracy"    },
                { value: "3",      label: "Goal Types"  },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-3xl font-black" style={{ color: BLUE }}>{s.value}</p>
                  <p className="text-sm text-blue-200 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg viewBox="0 0 1200 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12">
            <path d="M0,60 C300,0 900,60 1200,20 L1200,60 Z" fill="#F0F4F8" />
          </svg>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* AUTO FILL NOTICE */}
        {autoFilled && isClient && (
          <div className="mb-6 p-4 rounded-2xl flex items-center gap-3" style={{ background: BLUE_LIGHT, border: `1px solid ${BLUE}` }}>
            <span className="text-xl flex-shrink-0">✨</span>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: BLUE_DARK }}>Profile auto-filled!</p>
              <p className="text-xs mt-0.5" style={{ color: BLUE_DARK }}>Your details have been loaded from your profile. You can adjust them before predicting.</p>
            </div>
            <button onClick={() => navigate("/client/profile")}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white flex-shrink-0" style={{ background: BLUE }}>
              Edit Profile →
            </button>
          </div>
        )}

        {/* HOW IT WORKS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { step: "1", icon: "📝", title: "Enter Details",  desc: "Fill in your age, weight, height and fitness goal",           color: BLUE      },
            { step: "2", icon: "🤖", title: "AI Analyzes",    desc: "Our ML model processes your data using fitness science",       color: "#8b5cf6" },
            { step: "3", icon: "🎯", title: "Get Prediction", desc: "Receive your personalized week-by-week timeline",             color: "#10b981" },
          ].map(s => (
            <div key={s.step} className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${s.color}20` }}>{s.icon}</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: s.color }}>Step {s.step}</p>
                <p className="font-bold text-gray-800 text-sm">{s.title}</p>
                <p className="text-xs text-gray-400 mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* FORM */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100" style={{ background: `linear-gradient(135deg, ${NAVY}08, ${BLUE}10)` }}>
                <h2 className="text-xl font-bold text-gray-800">Your Body Details</h2>
                <p className="text-sm text-gray-400 mt-1">All fields required for accurate prediction</p>
              </div>

              <div className="p-6 space-y-5">

                {/* AGE + GENDER */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Age (years)</label>
                    <input type="number" name="age" value={form.age} onChange={handleChange} placeholder="25" min="15" max="70"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 text-sm text-gray-800 font-medium focus:outline-none transition-all"
                      onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Gender</label>
                    <div className="flex gap-2">
                      {["Male","Female"].map(g => (
                        <button key={g} type="button" onClick={() => setForm({ ...form, gender: g })}
                          className="flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                          style={{ borderColor: form.gender === g ? BLUE : "#f3f4f6", background: form.gender === g ? BLUE_LIGHT : "white", color: form.gender === g ? BLUE_DARK : "#6b7280" }}>
                          {g === "Male" ? "👨 Male" : "👩 Female"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* HEIGHT */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Height (cm)</label>
                  <input type="number" name="heightCm" value={form.heightCm} onChange={handleChange} placeholder="170" min="140" max="220"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 text-sm text-gray-800 font-medium focus:outline-none transition-all"
                    onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
                </div>

                {/* CURRENT + GOAL WEIGHT */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "currentWeight", label: "Current Weight", placeholder: "80" },
                    { name: "goalWeight",    label: "Goal Weight",    placeholder: "70" },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{f.label}</label>
                      <div className="relative">
                        <input type="number" name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.placeholder} min="35" max="200"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 text-sm text-gray-800 font-medium focus:outline-none transition-all pr-12"
                          onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">kg</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* GOAL TYPE */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Fitness Goal</label>
                  <div className="grid grid-cols-3 gap-3">
                    {GOAL_TYPES.map(g => (
                      <button key={g.value} type="button" onClick={() => setForm({ ...form, goalType: g.value })}
                        className="p-3 rounded-xl border-2 text-center transition-all"
                        style={{ borderColor: form.goalType === g.value ? g.color : "#f3f4f6", background: form.goalType === g.value ? g.bg : "white" }}>
                        <p className="text-2xl mb-1">{g.icon}</p>
                        <p className="text-xs font-bold" style={{ color: form.goalType === g.value ? g.color : "#374151" }}>{g.value}</p>
                        <p className="text-xs mt-0.5 text-gray-400">{g.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ACTIVITY LEVEL */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Activity Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACTIVITY_LEVELS.map(a => (
                      <button key={a.value} type="button" onClick={() => setForm({ ...form, activityLevel: a.value })}
                        className="p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3"
                        style={{ borderColor: form.activityLevel === a.value ? a.color : "#f3f4f6", background: form.activityLevel === a.value ? `${a.color}15` : "white" }}>
                        <span className="text-xl">{a.icon}</span>
                        <div>
                          <p className="text-xs font-bold" style={{ color: form.activityLevel === a.value ? a.color : "#374151" }}>{a.label}</p>
                          <p className="text-xs text-gray-400">{a.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ERROR */}
                {error && (
                  <div className="p-4 rounded-xl text-sm text-red-600 flex items-start gap-2" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                    <span>⚠️</span><span>{error}</span>
                  </div>
                )}

                {/* PREDICT BUTTON */}
                <button onClick={handlePredict} disabled={loading}
                  className="w-full py-4 rounded-xl text-white font-black text-base disabled:opacity-60 transition-all hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${BLUE_DARK}, ${BLUE})` }}>
                  {loading ? "🔄 AI is calculating..." : `🎯 Predict My ${form.goalType} Timeline`}
                </button>

                {!isClient && (
                  <div className="text-center pt-2">
                    <p className="text-xs text-gray-400">
                      Already a member?{" "}
                      <button onClick={() => navigate("/login")} className="font-semibold hover:underline" style={{ color: BLUE }}>
                        Login to auto-fill your details
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-2 space-y-4">

            {/* SELECTED GOAL */}
            <div className="bg-white rounded-2xl shadow-sm p-5 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -mr-8 -mt-8" style={{ background: selectedGoal?.color }} />
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Selected Goal</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedGoal?.icon}</span>
                <div>
                  <p className="font-black text-gray-800">{selectedGoal?.value}</p>
                  <p className="text-xs text-gray-400">{selectedGoal?.desc}</p>
                </div>
              </div>
            </div>

            {/* LIVE BMI */}
            {form.heightCm && form.currentWeight && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Your Current BMI</p>
                {(() => {
                  const h    = form.heightCm / 100;
                  const bmi  = (form.currentWeight / (h * h)).toFixed(1);
                  const cat  = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
                  const color= getBmiColor(cat);
                  return (
                    <div className="text-center">
                      <p className="text-5xl font-black" style={{ color }}>{bmi}</p>
                      <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: color }}>{cat}</span>
                      <div className="mt-3 h-2 rounded-full overflow-hidden flex gap-0.5">
                        {[{ w:"25%",c:"#3b82f6"},{w:"25%",c:"#22c55e"},{w:"25%",c:"#f97316"},{w:"25%",c:"#ef4444"}].map((b,i)=>(
                          <div key={i} className="h-full rounded-sm" style={{ width:b.w,background:b.c }} />
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* WEIGHT DIFF */}
            {form.currentWeight && form.goalWeight && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Weight Difference</p>
                <div className="text-center">
                  <p className="text-4xl font-black" style={{ color: form.goalType === "Weight Loss" ? "#ef4444" : "#8b5cf6" }}>
                    {Math.abs(form.currentWeight - form.goalWeight).toFixed(1)} kg
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{form.goalType === "Weight Loss" ? "to lose" : "to gain"}</p>
                </div>
              </div>
            )}

            {/* ML INFO */}
            <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${NAVY}, ${BLUE_DARK})` }}>
              <p className="text-white font-bold mb-3">🤖 Powered by ML</p>
              <div className="space-y-2">
                {[
                  "Trained on 5,000+ real data points",
                  "Uses proven fitness science",
                  "Considers age, BMI & activity level",
                  "97% prediction accuracy",
                ].map(t => (
                  <div key={t} className="flex items-center gap-2">
                    <span className="text-green-400 text-xs">✓</span>
                    <p className="text-blue-100 text-xs">{t}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK LINKS */}
            {isClient && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Quick Links</p>
                <div className="space-y-2">
                  {[
                    { label: "📊 View Progress", path: "/client/progress"     },
                    { label: "👤 Edit Profile",  path: "/client/profile"      },
                    { label: "🏋️ Workout Plan", path: "/client/workout-plan" },
                  ].map(({ label, path }) => (
                    <button key={label} onClick={() => navigate(path)}
                      className="w-full py-2.5 rounded-xl text-sm font-medium text-left px-4 transition hover:opacity-90"
                      style={{ background: BLUE_LIGHT, color: BLUE_DARK }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RESULTS */}
        {result && (
          <div id="result-section" className="mt-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-sm font-medium">🎉 Your Prediction Results</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* MAIN RESULT */}
            <div className="relative rounded-2xl overflow-hidden mb-6 shadow-sm"
              style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE_DARK} 100%)` }}>
              <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-10" style={{ background: BLUE, transform: "translate(30%, -30%)" }} />
              <div className="relative z-10 p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                  <div className="text-center">
                    <ProgressRing weeks={result.weeksToGoal} />
                    <p className="text-blue-100 text-sm mt-2">to reach your goal</p>
                  </div>
                  <div className="text-white text-center md:text-left">
                    <p className="text-blue-100 text-sm mb-2">Estimated completion date</p>
                    <p className="text-2xl font-black mb-4">📅 {result.estimatedDate}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2"><span className="text-green-400">✓</span><span className="text-sm text-blue-100">{result.weeklyChange > 0 ? "+" : ""}{result.weeklyChange} kg/week</span></div>
                      <div className="flex items-center gap-2"><span className="text-green-400">✓</span><span className="text-sm text-blue-100">BMI: {result.currentBmi} — {result.bmiCategory}</span></div>
                      <div className="flex items-center gap-2"><span className="text-green-400">✓</span><span className="text-sm text-blue-100">Goal: {result.goalType}</span></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-wide">Prediction Range</p>
                    {[
                      { label: "Best Case",  value: result.confidence.bestCase,  color: "#22c55e" },
                      { label: "Realistic",  value: result.confidence.realistic,  color: BLUE      },
                      { label: "Worst Case", value: result.confidence.worstCase,  color: "#f97316" },
                    ].map(c => (
                      <div key={c.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
                        <span className="text-xs text-blue-100">{c.label}</span>
                        <span className="font-bold text-sm" style={{ color: c.color }}>{c.value} wks</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* MILESTONES + TIPS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span>🏁</span> Journey Milestones</h3>
                <div className="space-y-3">
                  {result.milestones.map((m, i) => {
                    const colors = ["#3b82f6","#8b5cf6","#f59e0b","#10b981"];
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: colors[i] }}>{i+1}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-gray-700">Week {m.week} — {m.weight} kg</span>
                            <span className="text-xs" style={{ color: colors[i] }}>{m.label}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(i+1)*25}%`, background: colors[i] }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{m.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span>💡</span> Tips for {result.goalType}</h3>
                <div className="space-y-3">
                  {result.tips.map((tip, i) => {
                    const icons  = ["🏃","🥗","💧","😴"];
                    const colors = ["#ef4444","#10b981","#3b82f6","#8b5cf6"];
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: `${colors[i]}10` }}>
                        <span className="text-xl flex-shrink-0">{icons[i]}</span>
                        <p className="text-sm text-gray-700">{tip}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl overflow-hidden shadow-sm relative" style={{ background: `linear-gradient(135deg, #0A2342 0%, ${BLUE} 100%)` }}>
              <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10" style={{ background: "white", transform: "translate(30%, -30%)" }} />
              <div className="relative z-10 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-white">
                  <p className="text-2xl font-black mb-2">🏋️ Want to reach your goal faster?</p>
                  <p className="text-blue-100 text-sm max-w-lg">
                    {isClient ? "Get your trainer to create a personalized plan designed to help you reach your goal by " : "Join FitTrack and get a certified trainer to help you reach your goal by "}
                    <strong className="text-white">{result.estimatedDate}</strong>!
                  </p>
                </div>
                <div className="flex gap-3 flex-shrink-0 flex-wrap">
                  {isClient ? (
                    <>
                      <button onClick={() => navigate("/client/trainers")} className="px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all" style={{ background: BLUE }}>Find a Trainer →</button>
                      <button onClick={() => navigate("/client/progress")} className="px-6 py-3 rounded-xl font-bold text-sm border-2 border-white/30 text-white hover:bg-white/10 transition-all">View Progress</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => navigate("/register")} className="px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all" style={{ background: BLUE }}>Join Free →</button>
                      <button onClick={() => navigate("/trainers")} className="px-6 py-3 rounded-xl font-bold text-sm border-2 border-white/30 text-white hover:bg-white/10 transition-all">Browse Trainers</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}