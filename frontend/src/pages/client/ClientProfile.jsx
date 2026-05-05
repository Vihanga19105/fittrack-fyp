import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import api from "../../api/api";

const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT = "#E8F7FD";
const NAVY = "#0A2342";

const GOAL_OPTIONS = [
  "Weight Loss", "Muscle Gain",
  "Maintain Fitness", "Athletic Training",
  "General Fitness"
];
const GENDER_OPTIONS = ["Male", "Female", "Other"];

export default function ClientProfile() {
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: "", email: "", age: "", gender: "Male",
    phone: "", heightCm: "", weightKg: "",
    goalType: "Weight Loss", profileImage: null,
    goalWeight: "",
  });

  const [original, setOriginal] = useState({});

  useEffect(() => {
    api.get("/api/profile/client")
      .then((res) => {
        const data = {
          name: res.data.name || "",
          email: res.data.email || "",
          age: res.data.age || "",
          gender: res.data.gender || "Male",
          phone: res.data.phone || "",
          heightCm: res.data.heightCm || "",
          weightKg: res.data.weightKg || "",
          goalType: res.data.goalType || "Weight Loss",
          profileImage: res.data.profileImage || null,
          goalWeight: res.data.goalWeight || "",
        };
        setProfile(data);
        setOriginal(data);
        if (res.data.profileImage) setImagePreview(res.data.profileImage);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── IMAGE UPLOAD ──
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire("Error", "Image must be less than 2MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setImagePreview(base64);
      setProfile((prev) => ({ ...prev, profileImage: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e) => {
    if (/^\d*$/.test(e.target.value))
      setProfile({ ...profile, phone: e.target.value });
  };

  const cancelEdit = () => {
    setProfile(original);
    setImagePreview(original.profileImage || null);
    setEdit(false);
  };

  const saveProfile = async () => {
    if (!profile.name.trim()) {
      Swal.fire("Validation", "Full name is required", "warning"); return;
    }
    if (profile.phone && profile.phone.length !== 10) {
      Swal.fire("Validation", "Phone number must be 10 digits", "warning"); return;
    }
    if (profile.age && (profile.age < 10 || profile.age > 100)) {
      Swal.fire("Validation", "Age must be between 10 and 100", "warning"); return;
    }
    if (profile.heightCm && (profile.heightCm < 50 || profile.heightCm > 250)) {
      Swal.fire("Validation", "Enter a valid height (50–250 cm)", "warning"); return;
    }
    if (profile.weightKg && (profile.weightKg < 20 || profile.weightKg > 300)) {
      Swal.fire("Validation", "Enter a valid weight (20–300 kg)", "warning"); return;
    }
    if (profile.goalWeight && (profile.goalWeight < 20 || profile.goalWeight > 300)) {
      Swal.fire("Validation", "Enter a valid goal weight (20–300 kg)", "warning"); return;
    }
    if (profile.goalWeight && profile.weightKg) {
      const curr = Number(profile.weightKg);
      const goal = Number(profile.goalWeight);
      if (profile.goalType === "Weight Loss" && goal >= curr) {
        Swal.fire("Validation", "For Weight Loss, goal weight must be less than current weight", "warning"); return;
      }
      if (profile.goalType === "Muscle Gain" && goal <= curr) {
        Swal.fire("Validation", "For Muscle Gain, goal weight must be more than current weight", "warning"); return;
      }
    }

    setSaving(true);
    try {
      await api.put("/api/profile/client", {
        name: profile.name,
        email: profile.email,
        age: profile.age ? Number(profile.age) : null,
        gender: profile.gender,
        phone: profile.phone,
        heightCm: profile.heightCm ? Number(profile.heightCm) : null,
        weightKg: profile.weightKg ? Number(profile.weightKg) : null,
        goalType: profile.goalType,
        profileImage: profile.profileImage,
        goalWeight: profile.goalWeight ? Number(profile.goalWeight) : null,
      });
      localStorage.setItem("name", profile.name);
      setOriginal(profile);
      setEdit(false);
      Swal.fire({ title: "Profile Updated!", icon: "success", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire("Error", "Failed to update profile.", "error");
    }
    setSaving(false);
  };

  const getBmi = () => {
    if (!profile.heightCm || !profile.weightKg) return null;
    const h = Number(profile.heightCm) / 100;
    return (Number(profile.weightKg) / (h * h)).toFixed(1);
  };
  const getBmiInfo = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: "Underweight", color: "#3b82f6" };
    if (bmi < 25)   return { label: "Normal", color: "#22c55e" };
    if (bmi < 30)   return { label: "Overweight", color: "#f97316" };
    return { label: "Obese", color: "#ef4444" };
  };
  const bmi = getBmi();
  const bmiInfo = getBmiInfo(Number(bmi));

  const getGoalProgress = () => {
    if (!profile.goalWeight || !profile.weightKg) return null;
    const curr = Number(profile.weightKg);
    const goal = Number(profile.goalWeight);
    const diff = Math.abs(curr - goal).toFixed(1);
    return { diff, isClose: diff <= 2 };
  };
  const goalProgress = getGoalProgress();

  // ── COMPLETENESS ──
  const completenessFields = [
    { key: "name", label: "Full name" },
    { key: "age", label: "Age" },
    { key: "gender", label: "Gender" },
    { key: "phone", label: "Phone" },
    { key: "heightCm", label: "Height" },
    { key: "weightKg", label: "Weight" },
    { key: "goalWeight", label: "Goal weight" },
    { key: "goalType", label: "Fitness goal" },
    { key: "profileImage", label: "Profile photo" },
  ];
  const filled = completenessFields.filter(
    (f) => profile[f.key] && String(profile[f.key]).trim() !== ""
  ).length;
  const completeness = Math.round((filled / completenessFields.length) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-5xl animate-bounce mb-4">👤</div>
          <p className="text-gray-400 animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: "#f0f9ff" }}>

      {/* ── HERO — matches dashboard ── */}
      <div
        className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.70) 50%, rgba(41,171,226,0.80) 100%), url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1400&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "200px",
        }}>

        {/* decorative circles */}
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-6 flex-wrap">

            {/* LEFT — avatar + info */}
            <div className="flex items-center gap-5">
              {/* AVATAR */}
              <div className="relative flex-shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/30" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-white/20 text-white font-bold text-3xl flex items-center justify-center border-4 border-white/30">
                    {profile.name?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                )}
                {edit && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-110 transition-all">
                    <span style={{ color: BLUE }} className="text-sm">📷</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>

              {/* NAME + tags */}
              <div>
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">My Profile</p>
                <h1 className="text-4xl font-black tracking-tight">{profile.name || "Your Name"}</h1>
                <p className="text-blue-100 mt-1 text-sm">{profile.email}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    💪 {profile.goalType}
                  </span>
                  {profile.gender && (
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {profile.gender}
                    </span>
                  )}
                  {bmi && (
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      BMI {bmi} · {bmiInfo?.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

           
           
          </div>

          {/* EDIT BUTTONS — inside hero, bottom right */}
          <div className="absolute top-6 right-8">
            {!edit ? (
              <button onClick={() => setEdit(true)}
                className="px-6 py-3 rounded-xl bg-white/20 text-white text-base font-semibold hover:bg-white/30 transition-all border border-white/30">
                ✏️ Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveProfile} disabled={saving}
                  className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-green-500 hover:bg-green-600 disabled:opacity-60">
                  {saving ? "Saving..." : "💾 Save"}
                </button>
                <button onClick={cancelEdit}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/20 hover:bg-white/30 border border-white/30 text-white">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ── END HERO ── */}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* GOAL PROGRESS BANNER — only if set */}
        {goalProgress && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4"
            style={{ borderColor: goalProgress.isClose ? "#10b981" : BLUE }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{goalProgress.isClose ? "🎯" : "📊"}</span>
              <div>
                <p className="font-bold text-gray-800">
                  {goalProgress.isClose ? "Almost at your goal weight!" : "Goal Weight Progress"}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {goalProgress.isClose
                    ? `Only ${goalProgress.diff} kg away from your goal of ${profile.goalWeight} kg! 💪`
                    : `${goalProgress.diff} kg to reach your goal of ${profile.goalWeight} kg`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE FORM */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Personal Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* NAME */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Name</label>
              {edit ? (
                <input name="name" type="text" value={profile.name} onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-blue-300" />
              ) : (
                <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.name || <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email Address</label>
              <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                {profile.email}
              </p>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            {/* AGE */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Age</label>
              {edit ? (
                <input name="age" type="number" min="10" max="100" value={profile.age} onChange={handleChange}
                  placeholder="Your age"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-blue-300" />
              ) : (
                <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.age ? `${profile.age} years` : <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>

            {/* GENDER */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Gender</label>
              {edit ? (
                <select name="gender" value={profile.gender} onChange={handleChange}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-blue-300">
                  {GENDER_OPTIONS.map((g) => <option key={g}>{g}</option>)}
                </select>
              ) : (
                <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.gender || <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>

            {/* PHONE */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Phone Number</label>
              {edit ? (
                <input type="tel" value={profile.phone} onChange={handlePhoneChange} maxLength={10}
                  placeholder="07XXXXXXXX"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-blue-300" />
              ) : (
                <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.phone || <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>

            {/* GOAL TYPE */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fitness Goal</label>
              {edit ? (
                <select name="goalType" value={profile.goalType} onChange={handleChange}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-blue-300">
                  {GOAL_OPTIONS.map((g) => <option key={g}>{g}</option>)}
                </select>
              ) : (
                <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.goalType || <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>

            {/* HEIGHT */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Height (cm)</label>
              {edit ? (
                <input name="heightCm" type="number" value={profile.heightCm} onChange={handleChange}
                  placeholder="e.g. 170"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-blue-300" />
              ) : (
                <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.heightCm ? `${profile.heightCm} cm` : <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>

            {/* CURRENT WEIGHT */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Weight (kg)</label>
              {edit ? (
                <input name="weightKg" type="number" value={profile.weightKg} onChange={handleChange}
                  placeholder="e.g. 65"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-blue-300" />
              ) : (
                <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.weightKg ? `${profile.weightKg} kg` : <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>

            {/* GOAL WEIGHT */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Goal Weight (kg)
                <span className="ml-1 text-xs font-normal normal-case text-gray-400">— for progress tracking</span>
              </label>
              {edit ? (
                <div className="relative">
                  <input name="goalWeight" type="number" value={profile.goalWeight} onChange={handleChange}
                    placeholder="e.g. 60"
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-blue-300 pr-10" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">kg</span>
                </div>
              ) : (
                <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.goalWeight
                    ? <span>{profile.goalWeight} kg {profile.weightKg && <span className="ml-2 text-xs font-normal" style={{ color: BLUE }}>({Math.abs(Number(profile.weightKg) - Number(profile.goalWeight)).toFixed(1)} kg to go)</span>}</span>
                    : <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
              {edit && profile.goalType && (
                <p className="text-xs text-gray-400 mt-1">
                  {profile.goalType === "Weight Loss" ? "⬇️ Should be less than current weight"
                    : profile.goalType === "Muscle Gain" ? "⬆️ Should be more than current weight"
                    : "ℹ️ Set your target weight"}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* BMI + COMPLETENESS — side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* BMI */}
          {bmi && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Current BMI</p>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl font-bold" style={{ color: bmiInfo?.color }}>{bmi}</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: bmiInfo?.color }}>{bmiInfo?.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Based on height & weight</p>
                </div>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {[
                  { color: "#3b82f6", w: "20%" },
                  { color: "#22c55e", w: "25%" },
                  { color: "#f97316", w: "25%" },
                  { color: "#ef4444", w: "30%" },
                ].map((b, i) => (
                  <div key={i} className="h-full rounded-sm" style={{ width: b.w, background: b.color }} />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>
              </div>
            </div>
          )}

          {/* COMPLETENESS */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">Profile Completeness</h3>
              <span className="font-bold text-lg" style={{ color: completeness >= 80 ? "#22c55e" : completeness >= 50 ? BLUE : "#f97316" }}>
                {completeness}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${completeness}%`, background: `linear-gradient(90deg, ${BLUE_DARK}, ${BLUE})` }} />
            </div>
            {completeness < 100 ? (
              <div className="space-y-1">
                <p className="text-xs text-gray-400 font-medium">Missing fields:</p>
                <div className="flex flex-wrap gap-1.5">
                  {completenessFields
                    .filter((f) => !profile[f.key] || String(profile[f.key]).trim() === "")
                    .map((f) => (
                      <span key={f.key} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: BLUE_LIGHT, color: BLUE_DARK }}>
                        {f.label}
                      </span>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-xs font-semibold" style={{ color: "#10b981" }}>✅ Profile is 100% complete!</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}