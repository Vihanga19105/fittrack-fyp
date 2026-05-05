import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import api from "../../api/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const API = "http://localhost:8080/api";
const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT = "#E8F7FD";
const NAVY = "#0A2342";

const AVAILABILITY_DAYS = [
  "Mon","Tue","Wed","Thu","Fri","Sat","Sun"
];

const renderStars = (rating, size = 16) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <span key={i} style={{
          color: i <= full
            ? "#f59e0b"
            : i === full+1 && half
            ? "#f59e0b" : "#d1d5db",
          fontSize: `${size}px`
        }}>
          {i <= full ? "★"
            : i === full+1 && half ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
};

export default function TrainerPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trainer, setTrainer] = useState(null);
  const [reviews, setReviews] = useState({
    averageRating: 0, totalReviews: 0, reviews: []
  });
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isLoggedIn = !!token;
  const isClient = role === "CLIENT";

  useEffect(() => { loadProfile(); }, [id]);

  const loadProfile = async () => {
    try {
      // load all trainers and find by userId
      const res = await api.get("/api/profile/trainers");
      const found = res.data.find(
        t => String(t.userId) === String(id)
      );
      if (!found) {
        setLoading(false);
        return;
      }
      setTrainer(found);

      // load reviews
      try {
        const r = await axios.get(
          `${API}/reviews/trainer/${id}`
        );
        setReviews(r.data);
      } catch {}

      // load availability
      try {
        const a = await axios.get(
          `${API}/availability/${id}`
        );
        setAvailability(a.data || []);
      } catch {}

      // check if already subscribed
      if (isLoggedIn && isClient) {
        try {
          const subRes = await api.get(
            "/api/subscriptions/my"
          );
          const ids = subRes.data.map(s => s.trainerId);
          setIsSubscribed(ids.includes(Number(id)));
        } catch {}
      }
    } catch {}
    setLoading(false);
  };

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      Swal.fire({
        title: "Join FitTrack!",
        text: `Register to subscribe to ${trainer.name}!`,
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: BLUE,
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Register Now",
        cancelButtonText: "Login instead"
      }).then((r) => {
        if (r.isConfirmed) navigate("/register");
        else if (r.dismiss === Swal.DismissReason.cancel)
          navigate("/login");
      });
      return;
    }
    if (!isClient) {
      Swal.fire(
        "Not allowed",
        "Trainers cannot subscribe!", "warning"
      );
      return;
    }
    if (isSubscribed) {
      Swal.fire(
        "Already requested!",
        "You already sent a request to this trainer.",
        "info"
      );
      return;
    }
    setSubscribing(true);
    try {
      await api.post(
        `/api/subscriptions/request/${id}`
      );
      Swal.fire({
        title: "Request Sent! 🎉",
        text: `Your request has been sent to ${trainer.name}. You will be notified once accepted.`,
        icon: "success",
        confirmButtonColor: BLUE,
      });
      setIsSubscribed(true);
    } catch (err) {
      Swal.fire(
        "Error",
        String(err?.response?.data || "Failed"),
        "error"
      );
    }
    setSubscribing(false);
  };

  // star rating breakdown
  const getRatingBreakdown = () => {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.reviews?.forEach(r => {
      if (breakdown[r.rating] !== undefined)
        breakdown[r.rating]++;
    });
    return breakdown;
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center
                      justify-center"
        style={{ background: "#F0F4F8" }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4
                          mx-auto mb-3 animate-spin"
            style={{ borderColor: BLUE,
              borderTopColor: "transparent" }} />
          <p style={{ color: BLUE_DARK }}>
            Loading profile...
          </p>
        </div>
      </div>
      <Footer />
    </>
  );

  if (!trainer) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center
                      justify-center"
        style={{ background: "#F0F4F8" }}>
        <div className="text-center">
          <p className="text-6xl mb-4">😕</p>
          <p className="text-xl font-bold text-gray-700">
            Trainer not found
          </p>
          <button onClick={() => navigate("/trainers")}
            className="mt-4 px-6 py-3 rounded-xl
                       text-white font-semibold"
            style={{ background: BLUE }}>
            ← Back to Trainers
          </button>
        </div>
      </div>
      <Footer />
    </>
  );

  const breakdown = getRatingBreakdown();

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16"
        style={{ background: "#F0F4F8" }}>

        {/* HERO BANNER */}
        <div className="relative text-white px-6 py-12
                        overflow-hidden"
          style={{ background:
            `linear-gradient(135deg,
              ${NAVY} 0%, ${BLUE_DARK} 60%,
              ${BLUE} 100%)` }}>

          <div className="max-w-5xl mx-auto relative z-10">

            {/* BACK BUTTON */}
            <button onClick={() => navigate("/trainers")}
              className="mb-6 flex items-center gap-2
                         text-blue-200 hover:text-white
                         transition-colors text-sm">
              ← Back to Trainers
            </button>

            <div className="flex flex-col md:flex-row
                            items-start gap-8">

              {/* PHOTO */}
              <div className="flex-shrink-0">
                {trainer.profileImage ? (
                  <img src={trainer.profileImage}
                    alt={trainer.name}
                    className="w-32 h-32 rounded-2xl
                               object-cover border-4
                               border-white/30 shadow-xl" />
                ) : (
                  <div className="w-32 h-32 rounded-2xl
                                  text-white font-black
                                  text-5xl flex items-center
                                  justify-center border-4
                                  border-white/30"
                    style={{ background:
                      "rgba(255,255,255,0.15)" }}>
                    {trainer.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* INFO */}
              <div className="flex-1">
                <div className="flex items-center gap-3
                                flex-wrap mb-2">
                  <h1 className="text-3xl font-black">
                    {trainer.name}
                  </h1>
                  {trainer.isVerified && (
                    <span className="flex items-center gap-1
                                     px-3 py-1 rounded-full
                                     text-xs font-bold
                                     bg-green-500 text-white">
                      ✓ Verified
                    </span>
                  )}
                </div>

                {trainer.specialization && (
                  <p className="text-blue-100 text-lg mb-3">
                    🎯 {trainer.specialization}
                  </p>
                )}

                {/* QUICK STATS */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    {renderStars(
                      reviews.averageRating || 0, 18
                    )}
                    <span className="font-bold text-lg">
                      {reviews.averageRating?.toFixed(1)
                        || "0.0"}
                    </span>
                    <span className="text-blue-200 text-sm">
                      ({reviews.totalReviews} reviews)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: "⏱",
                      text: trainer.experienceYears
                        ? `${trainer.experienceYears} years experience`
                        : null },
                    { icon: "🏅",
                      text: trainer.certification },
                    { icon: "📞",
                      text: trainer.phone },
                  ].filter(i => i.text).map((item, i) => (
                    <span key={i}
                      className="flex items-center gap-1.5
                                 px-3 py-1.5 rounded-xl
                                 text-sm text-white"
                      style={{ background:
                        "rgba(255,255,255,0.15)" }}>
                      {item.icon} {item.text}
                    </span>
                  ))}
                </div>
              </div>

              {/* PRICE + SUBSCRIBE */}
              <div className="flex-shrink-0 text-center
                              bg-white/10 rounded-2xl p-6
                              border border-white/20
                              min-w-[180px]">
                <p className="text-blue-200 text-xs mb-1">
                  Monthly Fee
                </p>
                <p className="text-3xl font-black text-white
                               mb-1">
                  {trainer.pricePerMonth
                    ? `LKR ${Number(trainer.pricePerMonth)
                        .toLocaleString()}`
                    : "Contact"}
                </p>
                <p className="text-blue-200 text-xs mb-4">
                  per month
                </p>
                <button onClick={handleSubscribe}
                  disabled={subscribing || isSubscribed}
                  className="w-full py-3 rounded-xl
                             font-bold text-sm transition-all
                             disabled:opacity-70"
                  style={{
                    background: isSubscribed
                      ? "#10b981" : "white",
                    color: isSubscribed ? "white" : BLUE_DARK
                  }}>
                  {subscribing ? "Sending..."
                    : isSubscribed ? "✓ Request Sent"
                    : !isLoggedIn ? "Get Started"
                    : isClient ? "Subscribe Now"
                    : "View Only"}
                </button>
                {!isLoggedIn && (
                  <p className="text-xs text-blue-200 mt-2">
                    Login required to subscribe
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* BG DECORATIONS */}
          <div className="absolute right-0 top-0 w-64 h-64
                          bg-white/5 rounded-full
                          -translate-y-1/2 translate-x-1/2" />
          <div className="absolute left-1/2 bottom-0 w-48
                          h-48 bg-white/5 rounded-full
                          translate-y-1/2" />
        </div>

        {/* MAIN CONTENT */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3
                          gap-6">

            {/* LEFT — BIO + DETAILS */}
            <div className="lg:col-span-2 space-y-6">

              {/* ABOUT */}
              {trainer.bio && (
                <div className="bg-white rounded-2xl
                                shadow-sm p-6">
                  <h2 className="font-bold text-gray-800
                                  text-lg mb-3 flex
                                  items-center gap-2">
                    <span>👤</span> About {trainer.name}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {trainer.bio}
                  </p>
                </div>
              )}

              {/* SPECIALIZATIONS */}
              <div className="bg-white rounded-2xl
                              shadow-sm p-6">
                <h2 className="font-bold text-gray-800
                                text-lg mb-4 flex
                                items-center gap-2">
                  <span>🎯</span> Specializations &
                  Expertise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {trainer.specialization
                    ?.split(",")
                    .map((s, i) => (
                    <span key={i}
                      className="px-4 py-2 rounded-xl
                                 text-sm font-semibold
                                 text-white"
                      style={{ background: BLUE }}>
                      {s.trim()}
                    </span>
                  ))}
                </div>

                {/* DETAILS GRID */}
                <div className="grid grid-cols-2 gap-4 mt-5">
                  {[
                    { label: "Experience",
                      value: trainer.experienceYears
                        ? `${trainer.experienceYears} years`
                        : "—",
                      icon: "⏱" },
                    { label: "Certification",
                      value: trainer.certification || "—",
                      icon: "🏅" },
                    { label: "Monthly Fee",
                      value: trainer.pricePerMonth
                        ? `LKR ${Number(trainer.pricePerMonth)
                            .toLocaleString()}`
                        : "—",
                      icon: "💰" },
                    { label: "Status",
                      value: trainer.isVerified
                        ? "Verified ✓" : "Pending",
                      icon: "✅" },
                  ].map((item) => (
                    <div key={item.label}
                      className="p-4 rounded-xl"
                      style={{ background: "#f9fafb" }}>
                      <p className="text-xs text-gray-400
                                     mb-1">
                        {item.icon} {item.label}
                      </p>
                      <p className="font-semibold
                                     text-gray-800 text-sm">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* REVIEWS SECTION */}
              <div className="bg-white rounded-2xl
                              shadow-sm p-6">
                <h2 className="font-bold text-gray-800
                                text-lg mb-4 flex
                                items-center gap-2">
                  <span>⭐</span> Client Reviews
                </h2>

                {/* RATING SUMMARY */}
                <div className="flex gap-6 mb-6 p-5
                                rounded-xl"
                  style={{ background: BLUE_LIGHT }}>
                  <div className="text-center">
                    <p className="text-5xl font-black"
                      style={{ color: BLUE }}>
                      {reviews.averageRating?.toFixed(1)
                        || "0.0"}
                    </p>
                    <div className="flex justify-center
                                    mt-1">
                      {renderStars(
                        reviews.averageRating || 0, 16
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {reviews.totalReviews} reviews
                    </p>
                  </div>

                  {/* STAR BREAKDOWN */}
                  <div className="flex-1 space-y-1.5">
                    {[5,4,3,2,1].map((star) => {
                      const count = breakdown[star] || 0;
                      const pct = reviews.totalReviews > 0
                        ? (count / reviews.totalReviews)
                          * 100 : 0;
                      return (
                        <div key={star}
                          className="flex items-center
                                     gap-2">
                          <span className="text-xs
                                           text-gray-500
                                           w-4 text-right">
                            {star}
                          </span>
                          <span className="text-yellow-400
                                           text-xs">★</span>
                          <div className="flex-1 h-2
                                          bg-gray-200
                                          rounded-full
                                          overflow-hidden">
                            <div className="h-full
                                            rounded-full
                                            bg-yellow-400
                                            transition-all"
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs
                                           text-gray-400
                                           w-4">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* REVIEW CARDS */}
                {reviews.reviews?.length === 0 ? (
                  <div className="text-center py-10
                                  rounded-xl"
                    style={{ background: "#f9fafb" }}>
                    <p className="text-4xl mb-2">⭐</p>
                    <p className="text-gray-400 text-sm">
                      No reviews yet — be the first!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.reviews?.map((r, i) => (
                      <div key={i}
                        className="border border-gray-100
                                   rounded-xl p-4">
                        <div className="flex justify-between
                                        items-start">
                          <div className="flex items-center
                                          gap-3">
                            <div className="w-9 h-9
                                            rounded-full
                                            text-white
                                            font-bold text-sm
                                            flex items-center
                                            justify-center
                                            flex-shrink-0"
                              style={{ background: BLUE }}>
                              {r.clientName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold
                                             text-gray-800
                                             text-sm">
                                {r.clientName}
                              </p>
                              <div className="flex items-center
                                              gap-1 mt-0.5">
                                {renderStars(r.rating, 12)}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs
                                           text-gray-400">
                            {new Date(r.createdAt)
                              .toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })}
                          </span>
                        </div>
                        {r.review && (
                          <p className="text-sm text-gray-600
                                         mt-3 leading-relaxed
                                         pl-12">
                            "{r.review}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-5">

              {/* AVAILABILITY */}
              <div className="bg-white rounded-2xl
                              shadow-sm p-5">
                <h3 className="font-bold text-gray-800
                                mb-4 flex items-center
                                gap-2">
                  <span>📅</span> Availability
                </h3>
                {availability.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No availability set
                  </p>
                ) : (
                  <div className="space-y-2">
                    {AVAILABILITY_DAYS.map((d) => {
                      const dayData = availability.find(
                        a => a.day?.substring(0, 3) === d
                      );
                      const isAvail = !!dayData;
                      return (
                        <div key={d}
                          className="flex items-center
                                     justify-between p-2.5
                                     rounded-xl"
                          style={{ background: isAvail
                            ? BLUE_LIGHT : "#f9fafb" }}>
                          <span className="text-sm font-medium"
                            style={{ color: isAvail
                              ? BLUE_DARK : "#9ca3af" }}>
                            {d}
                          </span>
                          {isAvail ? (
                            <span className="text-xs
                                             font-semibold"
                              style={{ color: BLUE }}>
                              {dayData.startTime &&
                               dayData.endTime
                                ? `${dayData.startTime} – ${dayData.endTime}`
                                : "Available ✓"}
                            </span>
                          ) : (
                            <span className="text-xs
                                             text-gray-300">
                              Unavailable
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* QUICK STATS */}
              <div className="bg-white rounded-2xl
                              shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-4">
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Rating",
                      value: `${reviews.averageRating
                        ?.toFixed(1) || "0.0"} / 5.0`,
                      icon: "⭐",
                      color: "#f59e0b" },
                    { label: "Total Reviews",
                      value: reviews.totalReviews || 0,
                      icon: "💬",
                      color: BLUE },
                    { label: "Experience",
                      value: trainer.experienceYears
                        ? `${trainer.experienceYears} yrs`
                        : "—",
                      icon: "⏱",
                      color: "#10b981" },
                    { label: "Price / Month",
                      value: trainer.pricePerMonth
                        ? `LKR ${Number(trainer.pricePerMonth)
                            .toLocaleString()}`
                        : "—",
                      icon: "💰",
                      color: "#8b5cf6" },
                  ].map((s) => (
                    <div key={s.label}
                      className="flex items-center gap-3
                                 p-3 rounded-xl"
                      style={{ background: `${s.color}10` }}>
                      <div className="w-8 h-8 rounded-lg
                                      flex items-center
                                      justify-center text-lg"
                        style={{ background:
                          `${s.color}20` }}>
                        {s.icon}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">
                          {s.label}
                        </p>
                        <p className="font-bold text-sm"
                          style={{ color: s.color }}>
                          {s.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SUBSCRIBE CTA */}
              <div className="rounded-2xl p-5 text-white"
                style={{ background:
                  `linear-gradient(135deg,
                    ${NAVY}, ${BLUE_DARK})` }}>
                <p className="font-bold text-lg mb-1">
                  Ready to start?
                </p>
                <p className="text-blue-200 text-xs mb-4">
                  Subscribe to {trainer.name} and begin
                  your fitness journey today!
                </p>
                <button onClick={handleSubscribe}
                  disabled={subscribing || isSubscribed}
                  className="w-full py-3 rounded-xl
                             font-bold text-sm
                             transition-all bg-white
                             disabled:opacity-70"
                  style={{ color: BLUE_DARK }}>
                  {subscribing ? "Sending..."
                    : isSubscribed ? "✓ Request Sent"
                    : !isLoggedIn ? "Login to Subscribe"
                    : isClient ? "Subscribe Now"
                    : "View Only"}
                </button>
                {trainer.pricePerMonth && (
                  <p className="text-center text-xs
                                 text-blue-200 mt-2">
                    LKR {Number(trainer.pricePerMonth)
                      .toLocaleString()} / month
                  </p>
                )}
              </div>

              {/* BACK BUTTON */}
              <button onClick={() => navigate("/trainers")}
                className="w-full py-3 rounded-xl text-sm
                           font-semibold border-2
                           transition-all hover:opacity-80"
                style={{ borderColor: BLUE, color: BLUE,
                         background: "white" }}>
                ← Browse All Trainers
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}