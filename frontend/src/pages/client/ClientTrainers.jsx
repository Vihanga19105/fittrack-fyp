import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../../api/api";

const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT = "#E8F7FD";
const NAVY = "#0A2342";

export default function ClientTrainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribedIds, setSubscribedIds] = useState([]);
  const [clientProfile, setClientProfile] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/api/profile/trainers")
      .then((res) => {
        setTrainers(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    api.get("/api/subscriptions/my")
      .then((res) => {
        const ids = res.data.map((sub) => sub.trainerId);
        setSubscribedIds(ids);
      })
      .catch(() => {});

    api.get("/api/profile/client")
      .then((res) => setClientProfile(res.data))
      .catch(() => {});
  }, []);

  const isProfileComplete = () => {
    if (!clientProfile) return false;
    return (
      clientProfile.name &&
      clientProfile.age &&
      clientProfile.gender &&
      clientProfile.heightCm &&
      clientProfile.weightKg &&
      clientProfile.goalType
    );
  };

  const getMissingFields = () => {
    if (!clientProfile) return [];
    const missing = [];
    if (!clientProfile.age) missing.push("Age");
    if (!clientProfile.gender) missing.push("Gender");
    if (!clientProfile.heightCm) missing.push("Height");
    if (!clientProfile.weightKg) missing.push("Weight");
    if (!clientProfile.goalType) missing.push("Fitness goal");
    return missing;
  };

  const handleSubscribe = async (trainerId, trainerName) => {
    if (!isProfileComplete()) {
      const missing = getMissingFields();
      Swal.fire({
        title: "Complete Your Profile First",
        html: `
          <p style="color:#6b7280; font-size:14px; margin-bottom:12px;">
            Please complete your profile before subscribing to a trainer.
          </p>
          <div style="text-align:left; background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:12px;">
            <p style="font-size:13px; font-weight:600; color:#92400e; margin-bottom:6px;">Missing information:</p>
            ${missing.map(f => `<p style="font-size:13px; color:#92400e; margin:3px 0;">⚠ ${f}</p>`).join("")}
          </div>
        `,
        icon: "warning",
        confirmButtonColor: BLUE,
        confirmButtonText: "Complete Profile",
        showCancelButton: true,
        cancelButtonText: "Not now",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/client/profile";
        }
      });
      return;
    }

    try {
      await api.post(`/api/subscriptions/request/${trainerId}`);
      Swal.fire({
        title: "Request Sent! 🎉",
        text: `Your request has been sent to ${trainerName}!`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      setSubscribedIds((prev) => [...prev, trainerId]);
    } catch (err) {
      const msg = err?.response?.data || "Failed to send request";
      Swal.fire("Error", String(msg), "error");
    }
  };

  const filteredTrainers = trainers.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🏋️</div>
          <p className="text-gray-400 animate-pulse">Loading trainers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f0f9ff" }}>

      {/* HERO */}
      <div
        className="relative text-white px-8 py-6 overflow-hidden"
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
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
                Browse
              </p>
              <h1 className="text-4xl font-black tracking-tight">
                Find Your Trainer 💪
              </h1>
              <p className="text-blue-100 mt-1 text-sm">
                Choose the perfect trainer for your fitness journey
              </p>
            </div>

            {/* SEARCH BOX */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search by name or specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2.5 rounded-xl text-gray-800 text-sm outline-none w-64"
                style={{ background: "rgba(255,255,255,0.95)" }}
              />
            </div>
          </div>

          {/* STATS ROW */}
          <div className="flex gap-4 mt-6 flex-wrap">
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/20">
              <p className="text-xs text-blue-200 mb-0.5">Total Trainers</p>
              <p className="font-bold text-white text-lg">{trainers.length}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/20">
              <p className="text-xs text-blue-200 mb-0.5">Verified</p>
              <p className="font-bold text-white text-lg">✓ All</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/20">
              <p className="text-xs text-blue-200 mb-0.5">My Subscriptions</p>
              <p className="font-bold text-white text-lg">{subscribedIds.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* PROFILE INCOMPLETE WARNING */}
        {!isProfileComplete() && (
          <div className="mb-5 p-4 rounded-2xl border-l-4 flex items-start gap-3"
            style={{ background: "#fef3c7", borderColor: "#f59e0b" }}>
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-yellow-800">
                Complete your profile to subscribe
              </p>
              <p className="text-sm text-yellow-700 mt-0.5">
                Missing:{" "}
                <span className="font-medium">
                  {getMissingFields().join(", ")}
                </span>
              </p>
            </div>
            <button
              onClick={() => window.location.href = "/client/profile"}
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold flex-shrink-0"
              style={{ background: "#f59e0b" }}>
              Complete Profile →
            </button>
          </div>
        )}

        {/* EMPTY */}
        {filteredTrainers.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl">
            <p className="text-5xl mb-4">🏋️</p>
            <p className="text-lg font-semibold text-gray-500">
              {search ? "No trainers found matching your search" : "No verified trainers yet"}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {search ? "Try a different search term" : "Check back soon!"}
            </p>
          </div>
        )}

        {/* TRAINER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrainers.map((t) => (
            <div key={t.userId}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">

              {/* CARD TOP COLOR BAR */}
              <div className="h-2" style={{ background: `linear-gradient(90deg, ${NAVY}, ${BLUE})` }} />

              <div className="p-6">
                {/* AVATAR */}
                <div className="flex justify-center mb-4">
                  {t.profileImage ? (
                    <img src={t.profileImage} alt={t.name}
                      className="w-20 h-20 rounded-full object-cover border-4"
                      style={{ borderColor: BLUE_LIGHT }} />
                  ) : (
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                      style={{ background: `linear-gradient(135deg, ${NAVY}, ${BLUE})` }}>
                      {t.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <h2 className="text-lg font-bold text-gray-800 text-center">
                  {t.name}
                </h2>

                <p className="text-center font-bold mt-1 text-sm" style={{ color: "#10b981" }}>
                  LKR {t.pricePerMonth
                    ? Number(t.pricePerMonth).toLocaleString()
                    : "N/A"} / month
                </p>

                {/* VERIFIED BADGE */}
                <div className="flex justify-center mt-2">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                    ✓ Verified Trainer
                  </span>
                </div>

                {/* DETAILS */}
                <div className="mt-4 space-y-2 bg-gray-50 rounded-xl p-3">
                  {t.specialization && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">🎯</span>{" "}{t.specialization}
                    </p>
                  )}
                  {t.certification && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">🏅</span>{" "}{t.certification}
                    </p>
                  )}
                  {t.experienceYears && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">⏱</span>{" "}{t.experienceYears} years experience
                    </p>
                  )}
                </div>

                {t.bio && (
                  <p className="text-sm text-gray-400 mt-3 italic text-center line-clamp-2">
                    "{t.bio}"
                  </p>
                )}

                {/* SUBSCRIBE BUTTON */}
                {subscribedIds.includes(t.userId) ? (
                  <button disabled
                    className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed">
                    ✓ Request Sent
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(t.userId, t.name)}
                    className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    style={{ background: `linear-gradient(135deg, ${NAVY}, ${BLUE})` }}>
                    Subscribe Now →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}