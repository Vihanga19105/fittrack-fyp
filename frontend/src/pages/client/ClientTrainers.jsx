import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../../api/api";

const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT = "#E8F7FD";

export default function ClientTrainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribedIds, setSubscribedIds] = useState([]);
  const [clientProfile, setClientProfile] = useState(null);

  useEffect(() => {
    // load trainers
    api.get("/api/profile/trainers")
      .then((res) => {
        setTrainers(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // load my subscriptions
    api.get("/api/subscriptions/my")
      .then((res) => {
        const ids = res.data.map((sub) => sub.trainerId);
        setSubscribedIds(ids);
      })
      .catch(() => {});

    // load client profile for validation
    api.get("/api/profile/client")
      .then((res) => setClientProfile(res.data))
      .catch(() => {});
  }, []);

  // ── CHECK PROFILE COMPLETENESS ──
  // photo is NOT required
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

  // ── SUBSCRIBE ──
  const handleSubscribe = async (trainerId, trainerName) => {

    // ── check profile first ──
    if (!isProfileComplete()) {
      const missing = getMissingFields();
      Swal.fire({
        title: "Complete Your Profile First",
        html: `
          <p style="color:#6b7280; font-size:14px;
                    margin-bottom:12px;">
            Please complete your profile before
            subscribing to a trainer. This helps
            your trainer understand your fitness needs.
          </p>
          <div style="text-align:left; background:#fef3c7;
                      border:1px solid #fde68a;
                      border-radius:8px; padding:12px;">
            <p style="font-size:13px; font-weight:600;
                      color:#92400e; margin-bottom:6px;">
              Missing information:
            </p>
            ${missing.map(f => `
              <p style="font-size:13px; color:#92400e;
                        margin:3px 0;">
                ⚠ ${f}
              </p>
            `).join("")}
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

    // ── profile complete — proceed ──
    try {
      await api.post(
        `/api/subscriptions/request/${trainerId}`
      );
      Swal.fire({
        title: "Request Sent! 🎉",
        text: `Your request has been sent to ${trainerName}!`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      setSubscribedIds((prev) => [...prev, trainerId]);
    } catch (err) {
      const msg = err?.response?.data ||
        "Failed to send request";
      Swal.fire("Error", String(msg), "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center
                      min-h-[400px]">
        <div className="w-10 h-10 rounded-full border-4
                        animate-spin"
          style={{ borderColor: BLUE,
                   borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="pb-10" style={{ background: "#f0f9ff" }}>

      {/* HERO */}
      <div className="relative text-white px-6 py-8
                      rounded-2xl mb-6 overflow-hidden"
        style={{ background: `linear-gradient(135deg,
          ${BLUE_DARK} 0%, ${BLUE} 100%)` }}>
        <div className="relative z-10">
          <p className="text-blue-100 text-sm uppercase
                        tracking-wide font-medium mb-1">
            Client
          </p>
          <h1 className="text-3xl font-bold">
            Browse Trainers
          </h1>
          <p className="text-blue-100 mt-1 text-sm">
            Find the perfect trainer for your
            fitness journey
          </p>
        </div>
        <div className="absolute right-8 top-4 w-32 h-32
                        bg-white/10 rounded-full" />
      </div>

      {/* PROFILE INCOMPLETE WARNING */}
      {!isProfileComplete() && (
        <div className="mb-5 p-4 rounded-2xl border-l-4
                        flex items-start gap-3"
          style={{ background: "#fef3c7",
                   borderColor: "#f59e0b" }}>
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
            onClick={() =>
              window.location.href = "/client/profile"}
            className="px-4 py-2 rounded-xl text-white
                       text-sm font-semibold flex-shrink-0"
            style={{ background: "#f59e0b" }}>
            Complete Profile →
          </button>
        </div>
      )}

      {/* EMPTY */}
      {trainers.length === 0 && (
        <div className="text-center py-20 bg-white
                        rounded-2xl">
          <p className="text-5xl mb-4">🏋️</p>
          <p className="text-lg font-semibold text-gray-500">
            No verified trainers yet
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Check back soon!
          </p>
        </div>
      )}

      {/* TRAINER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {trainers.map((t) => (
          <div key={t.userId}
            className="bg-white rounded-2xl shadow-sm
                       border border-gray-100 p-6
                       hover:shadow-md transition-shadow">

            {/* AVATAR */}
            <div className="flex justify-center mb-4">
              {t.profileImage ? (
                <img src={t.profileImage} alt={t.name}
                  className="w-20 h-20 rounded-full
                             object-cover border-2"
                  style={{ borderColor: BLUE_LIGHT }} />
              ) : (
                <div className="w-20 h-20 rounded-full
                                flex items-center
                                justify-center text-white
                                text-2xl font-bold"
                  style={{ background:
                    `linear-gradient(135deg,
                      ${BLUE_DARK}, ${BLUE})` }}>
                  {t.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <h2 className="text-lg font-bold text-gray-800
                            text-center">
              {t.name}
            </h2>

            <p className="text-center font-bold mt-1 text-sm"
              style={{ color: "#10b981" }}>
              LKR {t.pricePerMonth
                ? Number(t.pricePerMonth).toLocaleString()
                : "N/A"} / month
            </p>

            {/* DETAILS */}
            <div className="mt-3 space-y-1.5">
              {t.specialization && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">
                    🎯 Specialization:
                  </span>{" "}
                  {t.specialization}
                </p>
              )}
              {t.certification && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">
                    🏅 Certification:
                  </span>{" "}
                  {t.certification}
                </p>
              )}
              {t.experienceYears && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">
                    ⏱ Experience:
                  </span>{" "}
                  {t.experienceYears} years
                </p>
              )}
            </div>

            {t.bio && (
              <p className="text-sm text-gray-400 mt-3
                             italic text-center line-clamp-2">
                "{t.bio}"
              </p>
            )}

            {/* VERIFIED BADGE */}
            <div className="flex justify-center mt-3">
              <span className="bg-green-100 text-green-700
                               px-3 py-1 rounded-full
                               text-xs font-medium">
                ✓ Verified Trainer
              </span>
            </div>

            {/* SUBSCRIBE BUTTON */}
            {subscribedIds.includes(t.userId) ? (
              <button disabled
                className="mt-4 w-full py-2.5 rounded-xl
                           text-sm font-semibold
                           bg-gray-100 text-gray-400
                           cursor-not-allowed">
                ✓ Request Sent
              </button>
            ) : (
              <button
                onClick={() =>
                  handleSubscribe(t.userId, t.name)}
                className="mt-4 w-full py-2.5 rounded-xl
                           text-white text-sm font-semibold
                           hover:opacity-90 transition-opacity"
                style={{ background: BLUE }}>
                Subscribe
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}