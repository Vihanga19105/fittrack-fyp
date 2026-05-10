import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../api/api";

const API = "http://localhost:8080/api";
const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const NAVY = "#0A2342";
const BLUE_LIGHT = "#E8F7FD";

export default function LandingPage() {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isLoggedIn = !!token;

  const getDashboard = () => {
    if (role === "CLIENT") return "/client/dashboard";
    if (role === "TRAINER") return "/trainer/dashboard";
    if (role === "ADMIN") return "/admin/dashboard";
    return "/register";
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const trainerRes = await api.get("/api/profile/trainers");
      setTrainers(trainerRes.data.slice(0, 3));

      const allReviews = [];

      await Promise.all(
        trainerRes.data.slice(0, 3).map(async (t) => {
          try {
            const r = await axios.get(`${API}/reviews/trainer/${t.userId}`);
            r.data.reviews?.slice(0, 2).forEach((rev) =>
              allReviews.push({ ...rev, trainerName: t.name })
            );
          } catch {}
        })
      );

      setReviews(allReviews.slice(0, 3));
    } catch {}

    setLoading(false);
  };

  const renderStars = (rating) =>
    [1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        style={{
          color: i <= rating ? "#f59e0b" : "#d1d5db",
          fontSize: "16px",
        }}
      >
        ★
      </span>
    ));

  const features = [
    {
      icon: "📊",
      title: "Progress Tracking",
      desc: "Log weight daily, visualize your journey with charts and get AI-powered goal predictions.",
    },
    {
      icon: "🏋️",
      title: "Weekly Workout Plans",
      desc: "Personalized day-by-day workout plans with YouTube video guides from your certified trainer.",
    },
    {
      icon: "🥗",
      title: "Sri Lankan Nutrition",
      desc: "Meal plans built with 57+ local foods. Track calories, protein, carbs and fats daily.",
    },
    {
      icon: "💬",
      title: "Real-Time Chat",
      desc: "Chat instantly with your trainer via WebSocket-powered messaging. No refresh needed.",
    },
    {
      icon: "⚖️",
      title: "BMI Calculator",
      desc: "Calculate and track your BMI over time with full history and category tracking.",
    },
    {
      icon: "💳",
      title: "Easy Payments",
      desc: "Subscribe to trainers with secure Stripe payment and 30-day subscription management.",
    },
    {
      icon: "⭐",
      title: "Trainer Reviews",
      desc: "Read real reviews from verified clients and choose the best trainer for your goals.",
    },
    {
      icon: "🤖",
      title: "AI Goal Prediction",
      desc: "Machine learning predicts when you'll reach your goal weight based on your progress data.",
    },
  ];

  return (
    <div className="text-white">
      {/* ── HERO — HTML5 video, no YouTube, no play button ── */}
      <section
        className="relative w-full overflow-hidden flex items-end"
        style={{ height: "100vh", minHeight: "600px", paddingTop: "64px" }}
      >
        {/* HTML5 video background — clean, no controls */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "110%",
              height: "110%",
              transform: "translate(-50%, -50%)",
              objectFit: "cover",
            }}
          >
            <source src="/fitness.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Bottom gradient for text readability only */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 40%, transparent 70%)",
          }}
        />

        {/* Content — sits at bottom over gradient */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-8 md:px-16 pb-16">
          <div
            className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
            style={{
              background: `${BLUE}40`,
              border: `1px solid ${BLUE}70`,
              color: "white",
            }}
          >
            🇱🇰 Sri Lanka's #1 Fitness Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight text-white drop-shadow-lg">
            Achieve Your <span style={{ color: BLUE }}>Fitness Goals</span>
            <br /> with FitTrack
          </h1>

          <p className="mt-4 text-gray-200 max-w-xl text-lg leading-relaxed drop-shadow">
            Connect with certified Sri Lankan fitness trainers, get personalized
            workout and meal plans, track your progress, and reach your goals
            faster than ever.
          </p>

          <div className="mt-8 flex gap-4 flex-wrap">
            <button
              onClick={() => navigate(isLoggedIn ? getDashboard() : "/register")}
              className="px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 shadow-lg"
              style={{ background: BLUE }}
            >
              {isLoggedIn ? "Go to Dashboard →" : "Get Started Free →"}
            </button>

            <button
              onClick={() => navigate("/trainers")}
              className="px-8 py-4 rounded-xl font-bold text-white text-lg transition-all border-2 hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,0.6)" }}
            >
              Browse Trainers
            </button>
          </div>

          {/* Mini stats */}
          <div className="mt-10 flex gap-10 flex-wrap">
            {[
              { value: "57+", label: "Sri Lankan Foods" },
              { value: "Real-Time", label: "WebSocket Chat" },
              { value: "AI", label: "Goal Prediction" },
              { value: "30-Day", label: "Subscriptions" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p
                  className="text-3xl font-black drop-shadow"
                  style={{ color: BLUE }}
                >
                  {value}
                </p>
                <p className="text-gray-300 text-sm mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50 z-10">
          <p className="text-xs text-white uppercase tracking-widest">Scroll</p>
          <div className="w-px h-8 bg-white/60" />
        </div>
      </section>
      {/* ── END HERO ── */}

      {/* ── FEATURES ── */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-gray-900">
              Everything You Need to <span style={{ color: BLUE }}>Succeed</span>
            </h2>
            <p className="text-gray-500 mt-3 text-lg">
              A complete fitness management platform built for Sri Lanka
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {features.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {icon}
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-2">
                  {title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-6 py-20" style={{ background: "#f0f9ff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-gray-900">
              How FitTrack Works
            </h2>
            <p className="text-gray-500 mt-3 text-lg">
              Get started in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: "📝",
                title: "Register",
                desc: "Create your free account in minutes",
              },
              {
                step: "02",
                icon: "🔍",
                title: "Find Trainer",
                desc: "Browse verified trainers and read real reviews",
              },
              {
                step: "03",
                icon: "💪",
                title: "Get Your Plan",
                desc: "Receive personalized workout & meal plans",
              },
              {
                step: "04",
                icon: "📈",
                title: "Track Progress",
                desc: "Log daily and watch your transformation unfold",
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="text-center relative">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
                  style={{ background: `${BLUE}15` }}
                >
                  {icon}
                </div>

                <div
                  className="absolute top-0 right-4 w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center"
                  style={{ background: BLUE }}
                >
                  {step}
                </div>

                <h3 className="font-bold text-gray-800 text-lg mb-2">
                  {title}
                </h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REAL TRAINERS ── */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-gray-900">
              Meet Our <span style={{ color: BLUE }}>Expert Trainers</span>
            </h2>
            <p className="text-gray-500 mt-3 text-lg">
              Certified professionals ready to guide you
            </p>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-400 animate-pulse">Loading trainers...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {(trainers.length > 0
                ? trainers
                : [
                    {
                      name: "Kasun Perera",
                      specialization: "Weight Loss",
                      experienceYears: 5,
                      pricePerMonth: 3500,
                      userId: 1,
                    },
                    {
                      name: "Nimali Silva",
                      specialization: "Muscle Gain",
                      experienceYears: 7,
                      pricePerMonth: 4000,
                      userId: 2,
                    },
                    {
                      name: "Ruwan Fernando",
                      specialization: "Yoga & Flexibility",
                      experienceYears: 4,
                      pricePerMonth: 3000,
                      userId: 3,
                    },
                  ]
              ).map((t) => (
                <div
                  key={t.userId}
                  className="rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div
                    className="p-6 text-center"
                    style={{
                      background: `linear-gradient(135deg, ${BLUE_DARK}15, ${BLUE}15)`,
                    }}
                  >
                    {/* FIXED: use real trainer profile image from t.profileImage */}
                    {t.profileImage ? (
                      <img
                        src={t.profileImage}
                        alt={t.name}
                        className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2"
                        style={{ borderColor: BLUE_LIGHT }}
                      />
                    ) : (
                      <div
                        className="w-20 h-20 rounded-full mx-auto mb-3 text-white font-black text-3xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${BLUE_DARK}, ${BLUE})`,
                        }}
                      >
                        {t.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}

                    <h3 className="text-lg font-black text-gray-800">
                      {t.name}
                    </h3>

                    <p
                      className="text-sm mt-1 font-bold"
                      style={{ color: BLUE }}
                    >
                      LKR {t.pricePerMonth?.toLocaleString()}/month
                    </p>

                    <span className="inline-block mt-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      ✓ Verified
                    </span>
                  </div>

                  <div className="p-5 space-y-2 bg-white">
                    {t.specialization && (
                      <p className="text-sm text-gray-600">
                        🎯 {t.specialization}
                      </p>
                    )}

                    {t.experienceYears && (
                      <p className="text-sm text-gray-600">
                        📅 {t.experienceYears} years experience
                      </p>
                    )}

                    {t.bio && (
                      <p className="text-xs text-gray-400 italic line-clamp-2">
                        "{t.bio}"
                      </p>
                    )}

                    <button
                      onClick={() =>
                        navigate(isLoggedIn ? getDashboard() : "/register")
                      }
                      className="w-full py-2.5 rounded-xl text-white font-bold text-sm mt-2 hover:opacity-90 transition-all"
                      style={{ background: BLUE }}
                    >
                      {isLoggedIn ? "Go to Dashboard" : "Get Started"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <button
              onClick={() => navigate("/trainers")}
              className="px-8 py-3 rounded-xl font-semibold border-2 transition-all"
              style={{ borderColor: BLUE, color: BLUE }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = BLUE;
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = BLUE;
              }}
            >
              View All Trainers →
            </button>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section
        className="px-6 py-20"
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE_DARK} 100%)`,
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black">
              Client <span style={{ color: BLUE }}>Success Stories</span>
            </h2>

            <p className="text-blue-200 mt-3 text-lg">
              {reviews.length > 0
                ? "Real reviews from real FitTrack clients"
                : "Real results from real people"}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {(reviews.length > 0
              ? reviews
              : [
                  {
                    clientName: "Amal K.",
                    rating: 5,
                    review:
                      "FitTrack helped me stay consistent. Lost 12kg in 4 months!",
                    trainerName: "Kasun Perera",
                  },
                  {
                    clientName: "Shashika D.",
                    rating: 5,
                    review:
                      "My trainer customized workouts perfectly. Gained muscle and confidence!",
                    trainerName: "Nimali Silva",
                  },
                  {
                    clientName: "Nuwan P.",
                    rating: 4,
                    review:
                      "Easy to follow plans and great progress tracking. Highly recommended!",
                    trainerName: "Ruwan Fernando",
                  },
                ]).map((r, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 border border-white/20"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="flex items-center gap-1 mb-3">
                  {renderStars(r.rating)}
                  <span className="text-yellow-400 text-sm font-bold ml-1">
                    {r.rating}.0
                  </span>
                </div>

                {r.review && (
                  <p className="text-blue-100 text-sm leading-relaxed mb-4">
                    "{r.review}"
                  </p>
                )}

                <div className="border-t border-white/20 pt-3">
                  <p className="text-white font-bold text-sm">
                    — {r.clientName}
                  </p>
                  <p className="text-blue-300 text-xs mt-1">
                    Review for {r.trainerName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="px-6 py-20 text-white text-center"
        style={{
          background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE} 100%)`,
        }}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-black mb-4">
            {isLoggedIn
              ? "Continue Your Journey!"
              : "Ready to Transform Your Body?"}
          </h2>

          <p className="text-blue-100 text-lg mb-8">
            {isLoggedIn
              ? "Head to your dashboard to check today's meals and workouts."
              : "Join FitTrack today and start your fitness journey with Sri Lanka's best trainers."}
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate(isLoggedIn ? getDashboard() : "/register")}
              className="px-10 py-4 rounded-xl font-black text-lg bg-white transition-all hover:scale-105 active:scale-95 shadow-lg"
              style={{ color: BLUE }}
            >
              {isLoggedIn ? "Go to Dashboard" : "Create Free Account"}
            </button>

            {!isLoggedIn && (
              <button
                onClick={() => navigate("/trainers")}
                className="px-10 py-4 rounded-xl font-black text-lg border-2 border-white/50 hover:bg-white/10 transition-all"
              >
                Browse Trainers
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}