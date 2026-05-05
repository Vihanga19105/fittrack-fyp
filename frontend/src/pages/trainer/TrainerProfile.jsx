import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import api from "../../api/api";

const TEAL       = "#14b8a6";
const TEAL_DARK  = "#0d9488";
const TEAL_LIGHT = "#f0fdfa";
const NAVY       = "#0A2342";

// Same specializations as public trainer filter
const SPECIALIZATION_OPTIONS = [
  "Weight Loss",
  "Muscle Gain",
  "Yoga",
  "Strength Training",
  "Cardio",
  "Flexibility",
  "Athletic Training",
  "General Fitness",
  "Nutrition",
];

export default function TrainerProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: "", email: "", bio: "",
    certification: "", experienceYears: "",
    specialization: "", pricePerMonth: "",
    phone: "", isVerified: false,
    profileImage: null,
  });

  const [original, setOriginal] = useState({});

  useEffect(() => {
    api.get("/api/profile/trainer")
      .then(res => {
        const data = {
          name:            res.data.name            || "",
          email:           res.data.email           || "",
          bio:             res.data.bio             || "",
          certification:   res.data.certification   || "",
          experienceYears: res.data.experienceYears || "",
          specialization:  res.data.specialization  || "",
          pricePerMonth:   res.data.pricePerMonth   || "",
          phone:           res.data.phone           || "",
          isVerified:      res.data.verified        || false,
          profileImage:    res.data.profileImage    || null,
        };
        setProfile(data);
        setOriginal(data);
        if (res.data.profileImage) setImagePreview(res.data.profileImage);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire("Error", "Image must be less than 2MB", "error"); return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setImagePreview(base64);
      setProfile(prev => ({ ...prev, profileImage: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!profile.name.trim() || profile.name.trim().length < 3)
      e.name = "Name must be at least 3 characters";
    if (!profile.bio.trim() || profile.bio.trim().length < 10)
      e.bio = "Bio must be at least 10 characters";
    if (!profile.certification.trim())
      e.certification = "Certification is required";
    if (!profile.experienceYears || isNaN(profile.experienceYears) || Number(profile.experienceYears) < 0 || Number(profile.experienceYears) > 50)
      e.experienceYears = "Enter valid years (0–50)";
    if (!profile.specialization.trim())
      e.specialization = "Specialization is required";
    if (!profile.pricePerMonth || isNaN(profile.pricePerMonth) || Number(profile.pricePerMonth) <= 0 || Number(profile.pricePerMonth) > 100000)
      e.pricePerMonth = "Enter valid price (1–100,000)";
    if (profile.phone && !/^0\d{9}$/.test(profile.phone))
      e.phone = "Must start with 0 and be 10 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Swal.fire("Fix Errors", "Please fix all errors before saving", "warning"); return;
    }
    try {
      await api.put("/api/profile/trainer", {
        name:            profile.name,
        bio:             profile.bio,
        certification:   profile.certification,
        experienceYears: Number(profile.experienceYears),
        specialization:  profile.specialization,
        pricePerMonth:   Number(profile.pricePerMonth),
        phone:           profile.phone,
        profileImage:    profile.profileImage,
      });
      setOriginal(profile);
      Swal.fire({ title: "Profile Updated! ✅", icon: "success", timer: 1500, showConfirmButton: false });
      setIsEditing(false);
      setErrors({});
    } catch { Swal.fire("Error", "Failed to update profile", "error"); }
  };

  const handleCancel = () => {
    setProfile(original);
    setImagePreview(original.profileImage || null);
    setErrors({});
    setIsEditing(false);
  };

  const fields = ["name", "bio", "certification", "experienceYears", "specialization", "pricePerMonth", "phone"];
  const filled = fields.filter(f => profile[f] !== "" && profile[f] !== null).length;
  const pct = Math.round((filled / fields.length) * 100);

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
    <div className="min-h-screen pb-10" style={{ background: "#f0fdf4" }}>

      {/* ── HERO — teal theme matching trainer dashboard ── */}
      <div
        className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(20,184,166,0.80) 100%), url('https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=1400&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "200px",
        }}>

        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-6 flex-wrap">

            {/* LEFT — avatar + info */}
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/30" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-white/20 text-white font-bold text-3xl flex items-center justify-center border-4 border-white/30">
                    {profile.name?.charAt(0)?.toUpperCase() || "T"}
                  </div>
                )}
                {isEditing && (
                  <button onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-110 transition-all">
                    <span style={{ color: TEAL }} className="text-sm">📷</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>

              <div>
                <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">My Profile</p>
                <h1 className="text-4xl font-black tracking-tight">{profile.name || "Your Name"}</h1>
                <p className="text-teal-100 mt-1 text-sm">{profile.email}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {profile.isVerified ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: "rgba(20,184,166,0.3)", color: "#99f6e4" }}>
                      ✓ Verified Trainer
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: "rgba(245,158,11,0.3)", color: "#fde68a" }}>
                      ⏳ Pending Verification
                    </span>
                  )}
                  {profile.specialization && (
                    <span className="text-teal-200 text-xs">• {profile.specialization}</span>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT — stat pills + edit button */}
            <div className="flex flex-col items-end gap-3">
              {/* Edit/Save buttons */}
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)}
                  className="px-6 py-3 rounded-xl bg-white/20 text-white text-base font-semibold hover:bg-white/30 transition-all border border-white/30">
                  ✏️ Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleSave}
                    className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-green-500 hover:bg-green-600">
                    💾 Save
                  </button>
                  <button onClick={handleCancel}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/20 hover:bg-white/30 border border-white/30 text-white">
                    Cancel
                  </button>
                </div>
              )}

              {/* Stat pills */}
              <div className="hidden md:flex gap-2">
                <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                  <p className="text-xs text-teal-200 mb-0.5">Experience</p>
                  <p className="font-bold text-white text-lg leading-none">
                    {profile.experienceYears || "--"} <span className="text-xs font-normal">yrs</span>
                  </p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                  <p className="text-xs text-teal-200 mb-0.5">Monthly Rate</p>
                  <p className="font-bold text-white text-sm leading-none">
                    {profile.pricePerMonth ? `LKR ${Number(profile.pricePerMonth).toLocaleString()}` : "--"}
                  </p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                  <p className="text-xs text-teal-200 mb-0.5">Complete</p>
                  <p className="font-bold text-white text-lg leading-none">{pct}<span className="text-xs font-normal">%</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── END HERO ── */}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* PROFILE FORM */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Profile Information</h2>

          {/* BIO — full width */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Bio</label>
            {isEditing ? (
              <>
                <textarea name="bio" value={profile.bio} onChange={handleChange} rows={3}
                  placeholder="Write a short bio about yourself..."
                  className={`w-full border rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none resize-none transition-all ${errors.bio ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
                  onFocus={e => e.target.style.borderColor = TEAL}
                  onBlur={e => e.target.style.borderColor = errors.bio ? "#f87171" : "#f3f4f6"} />
                {errors.bio && <p className="text-red-500 text-xs mt-1">⚠ {errors.bio}</p>}
              </>
            ) : (
              <p className="text-gray-600 text-sm leading-relaxed py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                {profile.bio || <span className="text-gray-400 italic">No bio added yet</span>}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* EMAIL */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email Address</label>
              <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">{profile.email}</p>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            {/* NAME */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Name</label>
              {isEditing ? (
                <>
                  <input type="text" name="name" value={profile.name} onChange={handleChange}
                    placeholder="Your full name"
                    className={`w-full border rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none transition-all ${errors.name ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
                    onFocus={e => e.target.style.borderColor = TEAL}
                    onBlur={e => e.target.style.borderColor = errors.name ? "#f87171" : "#f3f4f6"} />
                  {errors.name && <p className="text-red-500 text-xs mt-1">⚠ {errors.name}</p>}
                </>
              ) : (
                <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.name || <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>

            {/* PHONE */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Phone Number</label>
              {isEditing ? (
                <>
                  <input type="tel" name="phone" value={profile.phone} onChange={handleChange}
                    placeholder="07XXXXXXXX" maxLength={10}
                    className={`w-full border rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none transition-all ${errors.phone ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
                    onFocus={e => e.target.style.borderColor = TEAL}
                    onBlur={e => e.target.style.borderColor = errors.phone ? "#f87171" : "#f3f4f6"} />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">⚠ {errors.phone}</p>}
                </>
              ) : (
                <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.phone || <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>

            {/* SPECIALIZATION — dropdown matching public filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Specialization
                {isEditing && <span className="ml-1 text-xs font-normal normal-case text-gray-400">— shown on public trainer page</span>}
              </label>
              {isEditing ? (
                <>
                  <select name="specialization" value={profile.specialization} onChange={handleChange}
                    className={`w-full border rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none transition-all ${errors.specialization ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
                    onFocus={e => e.target.style.borderColor = TEAL}
                    onBlur={e => e.target.style.borderColor = errors.specialization ? "#f87171" : "#f3f4f6"}>
                    <option value="">Select specialization...</option>
                    {SPECIALIZATION_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.specialization && <p className="text-red-500 text-xs mt-1">⚠ {errors.specialization}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    💡 This matches the filters on the public Trainers page
                  </p>
                </>
              ) : (
                <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.specialization || <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>

            {/* CERTIFICATION */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Certification</label>
              {isEditing ? (
                <>
                  <input type="text" name="certification" value={profile.certification} onChange={handleChange}
                    placeholder="e.g. ACE CPT, NASM, CPT"
                    className={`w-full border rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none transition-all ${errors.certification ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
                    onFocus={e => e.target.style.borderColor = TEAL}
                    onBlur={e => e.target.style.borderColor = errors.certification ? "#f87171" : "#f3f4f6"} />
                  {errors.certification && <p className="text-red-500 text-xs mt-1">⚠ {errors.certification}</p>}
                </>
              ) : (
                <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.certification || <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>

            {/* EXPERIENCE */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Experience (Years)</label>
              {isEditing ? (
                <>
                  <input type="number" name="experienceYears" value={profile.experienceYears} onChange={handleChange}
                    placeholder="e.g. 5" min="0" max="50"
                    className={`w-full border rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none transition-all ${errors.experienceYears ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
                    onFocus={e => e.target.style.borderColor = TEAL}
                    onBlur={e => e.target.style.borderColor = errors.experienceYears ? "#f87171" : "#f3f4f6"} />
                  {errors.experienceYears && <p className="text-red-500 text-xs mt-1">⚠ {errors.experienceYears}</p>}
                </>
              ) : (
                <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.experienceYears ? `${profile.experienceYears} years` : <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>

            {/* PRICE */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price per Month (LKR)</label>
              {isEditing ? (
                <>
                  <div className="relative">
                    <input type="number" name="pricePerMonth" value={profile.pricePerMonth} onChange={handleChange}
                      placeholder="e.g. 5000" min="0" max="100000"
                      className={`w-full border rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none transition-all pr-16 ${errors.pricePerMonth ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
                      onFocus={e => e.target.style.borderColor = TEAL}
                      onBlur={e => e.target.style.borderColor = errors.pricePerMonth ? "#f87171" : "#f3f4f6"} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">LKR</span>
                  </div>
                  {errors.pricePerMonth && <p className="text-red-500 text-xs mt-1">⚠ {errors.pricePerMonth}</p>}
                </>
              ) : (
                <p className="text-gray-800 font-medium text-sm py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  {profile.pricePerMonth ? `LKR ${Number(profile.pricePerMonth).toLocaleString()}` : <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* PROFILE COMPLETENESS */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800">Profile Completeness</h3>
            <span className="font-bold text-lg" style={{ color: pct === 100 ? TEAL : "#f59e0b" }}>{pct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: pct === 100 ? TEAL : `linear-gradient(90deg, ${TEAL_DARK}, ${TEAL})` }} />
          </div>
          {pct < 100 ? (
            <p className="text-xs text-gray-400 mt-2">
              Complete your profile to attract more clients and get verified! 💪
            </p>
          ) : (
            <p className="text-xs mt-2 font-semibold" style={{ color: TEAL }}>
              ✅ Profile is 100% complete!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}