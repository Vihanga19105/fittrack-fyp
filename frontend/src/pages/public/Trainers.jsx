import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import api from "../../api/api";

const API = "http://localhost:8080/api";
const BLUE      = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT= "#E8F7FD";

const SPECIALIZATIONS = [
  "All","Weight Loss","Muscle Gain","Yoga",
  "Strength Training","Cardio","Flexibility",
  "Athletic Training","General Fitness","Nutrition",
];

const PRICE_RANGES = [
  { label: "Any price",          min: 0,     max: Infinity },
  { label: "Under Rs. 3,000",    min: 0,     max: 3000     },
  { label: "Rs. 3,000 – 6,000",  min: 3000,  max: 6000     },
  { label: "Rs. 6,000 – 10,000", min: 6000,  max: 10000    },
  { label: "Above Rs. 10,000",   min: 10000, max: Infinity  },
];

const SORT_OPTIONS = [
  { label: "Top rated",           value: "rating"     },
  { label: "Price: low to high",  value: "price_asc"  },
  { label: "Price: high to low",  value: "price_desc" },
  { label: "Most reviews",        value: "reviews"    },
  { label: "Experience",          value: "experience" },
];

const AVAILABILITY_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// Goal → Specialization mapping
const GOAL_TO_SPEC = {
  "Weight Loss":      ["Weight Loss", "Cardio", "General Fitness", "Nutrition"],
  "Muscle Gain":      ["Muscle Gain", "Strength Training", "Athletic Training"],
  "Maintain Fitness": ["General Fitness", "Cardio", "Yoga", "Flexibility"],
  "Athletic Training":["Athletic Training", "Strength Training", "Cardio"],
  "General Fitness":  ["General Fitness", "Cardio", "Flexibility", "Yoga"],
};

const renderStars = (rating, size = 14) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= full ? "#f59e0b" : i === full+1 && half ? "#f59e0b" : "#d1d5db", fontSize: `${size}px` }}>
          {i <= full ? "★" : i === full+1 && half ? "½" : "☆"}
        </span>
      ))}
    </div>
  );
};

export default function PublicTrainers() {
  const navigate = useNavigate();
  const [trainers,       setTrainers]       = useState([]);
  const [reviews,        setReviews]        = useState({});
  const [availability,   setAvailability]   = useState({});
  const [loading,        setLoading]        = useState(true);
  const [subscribedIds,  setSubscribedIds]  = useState([]);
  const [hasActiveSub,   setHasActiveSub]   = useState(false);
  const [activeTrainerId,setActiveTrainerId]= useState(null);
  const [selectedTrainer,setSelectedTrainer]= useState(null);

  // client profile for recommendations
  const [clientProfile,  setClientProfile]  = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [search,         setSearch]         = useState("");
  const [specFilter,     setSpecFilter]     = useState("All");
  const [priceFilter,    setPriceFilter]    = useState(0);
  const [sortBy,         setSortBy]         = useState("rating");
  const [availDayFilter, setAvailDayFilter] = useState("");
  const [minExpFilter,   setMinExpFilter]   = useState(0);
  const [showFilters,    setShowFilters]    = useState(true);

  const token    = localStorage.getItem("token");
  const role     = localStorage.getItem("role");
  const isLoggedIn = !!token;
  const isClient   = role === "CLIENT";

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await api.get("/api/profile/trainers");
      setTrainers(res.data);
      const reviewData = {};
      const availData  = {};
      await Promise.all(res.data.map(async t => {
        try {
          const r = await axios.get(`${API}/reviews/trainer/${t.userId}`);
          reviewData[t.userId] = r.data;
        } catch { reviewData[t.userId] = { averageRating: 0, totalReviews: 0, reviews: [] }; }
        try {
          const a = await axios.get(`${API}/availability/${t.userId}`);
          availData[t.userId] = a.data || [];
        } catch { availData[t.userId] = []; }
      }));
      setReviews(reviewData);
      setAvailability(availData);
    } catch {}
    setLoading(false);

    if (isLoggedIn && isClient) {
      try {
        const res = await api.get("/api/subscriptions/my");
        const subs = res.data || [];
        setSubscribedIds(subs.map(s => s.trainerId));
        const activeSub = subs.find(s => s.status === "ACTIVE");
        setHasActiveSub(!!activeSub);
        setActiveTrainerId(activeSub?.trainerId || null);
      } catch {}

      // Load client profile for recommendations
      setProfileLoading(true);
      try {
        const profileRes = await api.get("/api/profile/client");
        const p = profileRes.data;
        // Profile is considered "complete" if goalType + at least name + age or weight set
        const isComplete = p.goalType && p.name && (p.age || p.weightKg);
        setClientProfile(isComplete ? p : null);
      } catch {}
      setProfileLoading(false);
    }
  };

  // ── RECOMMENDED TRAINERS ──
  const recommendedTrainers = useMemo(() => {
    if (!isLoggedIn || !isClient || !clientProfile) return [];
    const goalType    = clientProfile.goalType;
    const matchSpecs  = GOAL_TO_SPEC[goalType] || [];
    if (!matchSpecs.length) return [];

    return trainers
      .filter(t => matchSpecs.some(spec =>
        t.specialization?.toLowerCase().includes(spec.toLowerCase())
      ))
      .sort((a, b) =>
        (reviews[b.userId]?.averageRating || 0) - (reviews[a.userId]?.averageRating || 0)
      )
      .slice(0, 4); // show top 4 recommended
  }, [trainers, clientProfile, reviews, isLoggedIn, isClient]);

  const filteredTrainers = useMemo(() => {
    const priceRange = PRICE_RANGES[priceFilter];
    let list = trainers.filter(t => {
      const q = search.toLowerCase();
      if (q && !t.name?.toLowerCase().includes(q) && !t.specialization?.toLowerCase().includes(q)) return false;
      if (specFilter !== "All" && !t.specialization?.toLowerCase().includes(specFilter.toLowerCase())) return false;
      const price = Number(t.pricePerMonth) || 0;
      if (price < priceRange.min || price > priceRange.max) return false;
      if (minExpFilter > 0 && (Number(t.experienceYears) || 0) < minExpFilter) return false;
      if (availDayFilter) {
        const days = (availability[t.userId] || []).map(a => a.day?.substring(0, 3));
        if (!days.includes(availDayFilter)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "rating")     return (reviews[b.userId]?.averageRating || 0) - (reviews[a.userId]?.averageRating || 0);
      if (sortBy === "price_asc")  return (a.pricePerMonth || 0) - (b.pricePerMonth || 0);
      if (sortBy === "price_desc") return (b.pricePerMonth || 0) - (a.pricePerMonth || 0);
      if (sortBy === "reviews")    return (reviews[b.userId]?.totalReviews || 0) - (reviews[a.userId]?.totalReviews || 0);
      if (sortBy === "experience") return (b.experienceYears || 0) - (a.experienceYears || 0);
      return 0;
    });
    return list;
  }, [trainers, search, specFilter, priceFilter, sortBy, availDayFilter, minExpFilter, reviews, availability]);

  const activeFilterCount = [search !== "", specFilter !== "All", priceFilter !== 0, availDayFilter !== "", minExpFilter > 0].filter(Boolean).length;

  const clearFilters = () => {
    setSearch(""); setSpecFilter("All"); setPriceFilter(0);
    setAvailDayFilter(""); setMinExpFilter(0); setSortBy("rating");
  };

  const handleSubscribeClick = async (e, trainer) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      Swal.fire({ title: "Join FitTrack!", text: `Register to subscribe to ${trainer.name}!`, icon: "info", showCancelButton: true, confirmButtonColor: BLUE, cancelButtonColor: "#6b7280", confirmButtonText: "Register Now", cancelButtonText: "Login instead" })
        .then(r => { if (r.isConfirmed) navigate("/register"); else if (r.dismiss === Swal.DismissReason.cancel) navigate("/login"); });
      return;
    }
    if (!isClient) { Swal.fire("Not allowed", "Only clients can subscribe!", "warning"); return; }
    if (hasActiveSub) { Swal.fire("Active Subscription", "You already have an active subscription.", "info"); return; }
    if (subscribedIds.includes(trainer.userId)) { Swal.fire("Already requested!", "You already have a pending/active request with this trainer!", "info"); return; }
    try {
      await api.post(`/api/subscriptions/request/${trainer.userId}`);
      Swal.fire({ title: "Request Sent! 🎉", text: `Request sent to ${trainer.name}!`, icon: "success", timer: 2000, showConfirmButton: false });
      setSubscribedIds(prev => [...prev, trainer.userId]);
    } catch (err) { Swal.fire("Error", String(err?.response?.data || "Failed"), "error"); }
  };

  const getTrainerButton = (t) => {
    const isTheirActiveTrainer = isLoggedIn && isClient && t.userId === activeTrainerId;
    const hasPendingRequest    = isLoggedIn && isClient && subscribedIds.includes(t.userId) && !isTheirActiveTrainer;
    const isBlocked            = isLoggedIn && isClient && hasActiveSub && t.userId !== activeTrainerId;

    if (isTheirActiveTrainer)
      return <button disabled onClick={e => e.stopPropagation()} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#10b981" }}>✓ Your Active Trainer</button>;
    if (hasPendingRequest)
      return <button disabled onClick={e => e.stopPropagation()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white opacity-70" style={{ background: BLUE }}>✓ Request Sent</button>;
    if (isBlocked)
      return <button disabled onClick={e => e.stopPropagation()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400" style={{ background: "#f3f4f6" }}>🔒 Unavailable</button>;
    if (isLoggedIn && !isClient)
      return <button disabled className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400" style={{ background: "#f3f4f6" }}>View Only</button>;
    return (
      <button onClick={e => handleSubscribeClick(e, t)}
        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all" style={{ background: BLUE }}>
        Subscribe
      </button>
    );
  };

  // Reusable trainer card
  const TrainerCard = ({ t, highlighted = false }) => {
    const rev   = reviews[t.userId]     || { averageRating: 0, totalReviews: 0, reviews: [] };
    const avail = availability[t.userId] || [];
    const isActiveTrainer = isLoggedIn && isClient && t.userId === activeTrainerId;

    return (
      <div onClick={() => navigate(`/trainers/${t.userId}`)}
        className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
        style={{ borderColor: highlighted ? BLUE : isActiveTrainer ? "#10b981" : "#f1f5f9", borderWidth: highlighted || isActiveTrainer ? "2px" : "1px" }}>

        {isActiveTrainer && (
          <div className="px-4 py-2 text-xs font-bold text-white text-center" style={{ background: "#10b981" }}>⭐ Your Current Trainer</div>
        )}
        {highlighted && !isActiveTrainer && (
          <div className="px-4 py-2 text-xs font-bold text-white text-center" style={{ background: `linear-gradient(90deg, ${BLUE_DARK}, ${BLUE})` }}>🎯 Recommended for You</div>
        )}

        <div className="p-5 pb-0">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              {t.profileImage ? (
                <img src={t.profileImage} alt={t.name} className="w-16 h-16 rounded-full object-cover border-2"
                  style={{ borderColor: isActiveTrainer ? "#10b981" : highlighted ? BLUE : BLUE_LIGHT }} />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})` }}>
                  {t.name?.charAt(0).toUpperCase()}
                </div>
              )}
              {t.isVerified && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 text-base leading-tight truncate">{t.name}</h3>
              {t.specialization && <p className="text-xs mt-0.5 truncate" style={{ color: BLUE }}>🎯 {t.specialization}</p>}
              {t.certification  && <p className="text-xs text-gray-400 mt-0.5 truncate">🏅 {t.certification}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400">per month</p>
              <p className="font-bold text-base text-green-600">{t.pricePerMonth ? `LKR ${Number(t.pricePerMonth).toLocaleString()}` : "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            {renderStars(rev.averageRating)}
            <span className="text-sm font-semibold text-gray-700">{rev.averageRating?.toFixed(1) || "0.0"}</span>
            <button onClick={e => { e.stopPropagation(); setSelectedTrainer(t); }}
              className="text-xs underline" style={{ color: BLUE }}>
              ({rev.totalReviews} review{rev.totalReviews !== 1 ? "s" : ""})
            </button>
          </div>

          {t.experienceYears && (
            <p className="text-xs text-gray-400 mt-1">⏱ {t.experienceYears} year{t.experienceYears > 1 ? "s" : ""} experience</p>
          )}

          {avail.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-1">Available</p>
              <div className="flex gap-1 flex-wrap">
                {AVAILABILITY_DAYS.map(d => {
                  const active = avail.some(a => a.day?.substring(0, 3) === d);
                  return (
                    <span key={d} className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={active ? { background: BLUE_LIGHT, color: BLUE_DARK } : { background: "#f3f4f6", color: "#d1d5db" }}>
                      {d}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {t.bio && <p className="mt-3 text-xs text-gray-500 line-clamp-2">{t.bio}</p>}
        </div>

        <div className="p-5 pt-4 flex gap-2">
          <button onClick={e => { e.stopPropagation(); navigate(`/trainers/${t.userId}`); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
            style={{ borderColor: BLUE, color: BLUE, background: "white" }}>
            View Profile
          </button>
          {getTrainerButton(t)}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f0f9ff" }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 mx-auto mb-3 animate-spin" style={{ borderColor: BLUE, borderTopColor: "transparent" }} />
        <p style={{ color: BLUE_DARK }}>Loading trainers...</p>
      </div>
    </div>
  );

  return (
    <div className="text-gray-800">

      {/* ── HERO ── */}
      <div className="relative text-white px-6 pt-32 pb-16"
        style={{ background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE} 100%)` }}>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl font-bold mb-4">Browse Trainers</h1>
          <p className="text-blue-100 text-xl max-w-2xl mx-auto leading-relaxed">
            {filteredTrainers.length} certified trainer{filteredTrainers.length !== 1 ? "s" : ""} available. Find your perfect fitness match today.
          </p>
          {isLoggedIn && isClient && hasActiveSub && (
            <div className="mt-4 inline-block px-5 py-2 rounded-full text-sm font-semibold"
              style={{ background: "rgba(16,185,129,0.25)", border: "1px solid rgba(16,185,129,0.5)", color: "#a7f3d0" }}>
              ✅ You have an active subscription — manage it in Payments
            </div>
          )}
        </div>
        <div className="absolute right-10 top-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute left-10 bottom-4 w-24 h-24 bg-white/10 rounded-full" />
      </div>

      <div className="min-h-screen pb-10" style={{ background: "#f0f9ff" }}>
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* ── RECOMMENDED FOR YOU ── */}
          {isLoggedIn && isClient && !profileLoading && (
            <>
              {clientProfile && recommendedTrainers.length > 0 && (
                <div className="mb-10">
                  {/* Section header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">🎯</span>
                        <h2 className="text-xl font-black text-gray-800">Recommended for You</h2>
                      </div>
                      <p className="text-sm text-gray-500">
                        Based on your goal: <span className="font-semibold" style={{ color: BLUE }}>{clientProfile.goalType}</span>
                        {clientProfile.name && <span className="text-gray-400"> — matched for {clientProfile.name}</span>}
                      </p>
                    </div>
                    <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
                      style={{ background: BLUE_LIGHT, color: BLUE_DARK }}>
                      {recommendedTrainers.length} match{recommendedTrainers.length !== 1 ? "es" : ""}
                    </span>
                  </div>

                  {/* Recommended cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {recommendedTrainers.map(t => (
                      <TrainerCard key={t.userId} t={t} highlighted={true} />
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4 mt-8 mb-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-sm font-semibold text-gray-400 flex-shrink-0">All Trainers</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                </div>
              )}

              {/* Client logged in but profile incomplete */}
              {!clientProfile && !hasActiveSub && (
                <div className="mb-6 rounded-2xl p-5 border-2 flex items-center justify-between gap-4 flex-wrap"
                  style={{ background: BLUE_LIGHT, borderColor: `${BLUE}40` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💡</span>
                    <div>
                      <p className="font-bold text-gray-800">Get Personalised Trainer Recommendations!</p>
                      <p className="text-sm text-gray-600 mt-0.5">Complete your profile with your fitness goal to see trainers matched just for you.</p>
                    </div>
                  </div>
                  <button onClick={() => navigate("/client/profile")}
                    className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all flex-shrink-0"
                    style={{ background: BLUE }}>
                    Complete Profile →
                  </button>
                </div>
              )}
            </>
          )}

          {/* SEARCH + SORT BAR */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input type="text" placeholder="Search by name or specialization..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => setShowFilters(v => !v)}
              className="relative px-5 py-3 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
              style={{ background: showFilters ? BLUE_DARK : BLUE }}>
              ⚙️ Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{activeFilterCount}</span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="px-4 py-3 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50">Clear all</button>
            )}
          </div>

          {/* FILTER PANEL */}
          {showFilters && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Specialization</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SPECIALIZATIONS.map(s => (
                      <button key={s} onClick={() => setSpecFilter(s)}
                        className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                        style={specFilter === s ? { background: BLUE, color: "#fff", borderColor: BLUE } : { background: "#f9fafb", color: "#374151", borderColor: "#e5e7eb" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price range</p>
                  <div className="flex flex-col gap-1.5">
                    {PRICE_RANGES.map((p, i) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="price" checked={priceFilter === i} onChange={() => setPriceFilter(i)} className="accent-blue-400" />
                        <span className="text-sm text-gray-600">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Available on</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setAvailDayFilter("")}
                      className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                      style={availDayFilter === "" ? { background: BLUE, color: "#fff", borderColor: BLUE } : { background: "#f9fafb", color: "#374151", borderColor: "#e5e7eb" }}>
                      Any day
                    </button>
                    {AVAILABILITY_DAYS.map(d => (
                      <button key={d} onClick={() => setAvailDayFilter(availDayFilter === d ? "" : d)}
                        className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                        style={availDayFilter === d ? { background: BLUE, color: "#fff", borderColor: BLUE } : { background: "#f9fafb", color: "#374151", borderColor: "#e5e7eb" }}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Min. experience: {minExpFilter === 0 ? "Any" : `${minExpFilter}+ yrs`}</p>
                  <input type="range" min={0} max={10} step={1} value={minExpFilter} onChange={e => setMinExpFilter(Number(e.target.value))} className="w-full accent-blue-400" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Any</span><span>10+ yrs</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ALL TRAINER CARDS */}
          {filteredTrainers.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl">
              <p className="text-5xl mb-3">🔍</p>
              <p className="text-lg font-semibold text-gray-700">No trainers match your filters</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">Try adjusting or clearing your filters</p>
              <button onClick={clearFilters} className="px-6 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: BLUE }}>Clear all filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTrainers.map(t => <TrainerCard key={t.userId} t={t} />)}
            </div>
          )}
        </div>
      </div>

      {/* REVIEWS MODAL */}
      {selectedTrainer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTrainer(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Reviews for {selectedTrainer.name}</h3>
              <button onClick={() => setSelectedTrainer(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="text-center py-4 mb-4 rounded-xl" style={{ background: BLUE_LIGHT }}>
              <p className="text-4xl font-bold" style={{ color: BLUE }}>{reviews[selectedTrainer.userId]?.averageRating?.toFixed(1) || "0.0"}</p>
              <div className="flex justify-center mt-1">{renderStars(reviews[selectedTrainer.userId]?.averageRating || 0, 18)}</div>
              <p className="text-xs text-gray-500 mt-1">{reviews[selectedTrainer.userId]?.totalReviews || 0} reviews</p>
            </div>
            <div className="space-y-3">
              {reviews[selectedTrainer.userId]?.reviews?.length === 0 && <p className="text-center text-gray-400 py-4">No reviews yet</p>}
              {reviews[selectedTrainer.userId]?.reviews?.map((r, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-1">
                    <div><p className="font-semibold text-gray-800 text-sm">{r.clientName}</p><div className="flex items-center gap-1 mt-0.5">{renderStars(r.rating, 12)}</div></div>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.review && <p className="text-sm text-gray-600 mt-2">{r.review}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}