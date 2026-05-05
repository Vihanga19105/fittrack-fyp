import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const VIOLET       = "#8b5cf6";
const VIOLET_DARK  = "#7c3aed";
const VIOLET_LIGHT = "#f5f3ff";

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeFilter,  setActiveFilter]  = useState("all");

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    const notifs = [];

    try {
      // Pending trainer verifications
      const pendingRes = await api.get("/api/admin/pending-trainers");
      pendingRes.data.forEach(trainer => {
        notifs.push({
          id:      `pending-${trainer.userId}`,
          type:    "verification",
          icon:    "⏳",
          title:   "Trainer Verification Pending",
          message: `${trainer.name} has submitted their profile and is awaiting your approval`,
          time:    trainer.createdAt,
          color:   "#f59e0b",
          action:  () => navigate("/admin/trainers"),
        });
      });
    } catch {}

    try {
      // Recent registrations (last 7 days)
      const usersRes = await api.get("/api/admin/users");
      const now = new Date();
      usersRes.data.forEach(user => {
        if (!user.createdAt) return;
        const diffDays = (now - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
        if (diffDays <= 7) {
          notifs.push({
            id:      `user-${user.userId}`,
            type:    "registration",
            icon:    user.role === "TRAINER" ? "💪" : "👤",
            title:   `New ${user.role === "TRAINER" ? "Trainer" : "Client"} Registered`,
            message: `${user.name} (${user.email}) joined FitTrack`,
            time:    user.createdAt,
            color:   user.role === "TRAINER" ? "#10b981" : VIOLET,
            action:  () => navigate("/admin/users"),
          });
        }
      });
    } catch {}

    try {
      // Recent active subscriptions (last 7 days)
      const subsRes = await api.get("/api/admin/subscriptions");
      const now = new Date();
      subsRes.data.forEach(sub => {
        if (!sub.startDate) return;
        const diffDays = (now - new Date(sub.startDate)) / (1000 * 60 * 60 * 24);
        if (diffDays <= 7 && sub.status === "ACTIVE") {
          notifs.push({
            id:      `sub-${sub.id}`,
            type:    "payment",
            icon:    "💳",
            title:   "New Subscription Activated",
            message: `${sub.clientName} subscribed to ${sub.trainerName}${sub.trainerPrice ? ` — LKR ${Number(sub.trainerPrice).toLocaleString()}` : ""}`,
            time:    sub.startDate,
            color:   "#3b82f6",
            badge:   sub.trainerPrice ? `LKR ${Number(sub.trainerPrice).toLocaleString()}` : null,
            action:  () => navigate("/admin/payments"),
          });
        }
      });
    } catch {}

    // Sort by type priority then time
    const order = { verification: 0, payment: 1, registration: 2 };
    notifs.sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));

    setNotifications(notifs);
    setLoading(false);
  };

  const formatTime = (t) => {
    if (!t || t === "Now") return "Now";
    try {
      const diff = new Date() - new Date(t);
      const hours = Math.floor(diff / 3600000);
      const days  = Math.floor(diff / 86400000);
      if (hours < 1)  return "Just now";
      if (hours < 24) return `${hours}h ago`;
      return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch { return t; }
  };

  const TYPE_LABELS = {
    verification: "⏳ Verification",
    registration: "👤 Registration",
    payment:      "💳 Payment",
  };

  const typeCounts = Object.keys(TYPE_LABELS).reduce((acc, t) => {
    acc[t] = notifications.filter(n => n.type === t).length;
    return acc;
  }, {});

  const filtered = activeFilter === "all"
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  return (
    <div className="min-h-screen pb-10" style={{ background: "#faf5ff" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(124,58,237,0.80) 100%), url('https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "200px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
            <h1 className="text-4xl font-black tracking-tight">Notifications 🔔</h1>
            <p className="text-purple-100 mt-1 text-sm">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-purple-200 text-sm mt-1">{notifications.length} notification{notifications.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="hidden md:flex gap-2">
            {[
              { label: "Verifications", value: typeCounts.verification, color: "#f59e0b" },
              { label: "Registrations", value: typeCounts.registration, color: VIOLET    },
              { label: "Payments",      value: typeCounts.payment,      color: "#3b82f6" },
            ].map(({ label, value, color }) => value > 0 && (
              <div key={label} className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                <p className="text-xs text-purple-200 mb-0.5">{label}</p>
                <p className="font-black text-white text-xl leading-none" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* FILTER TABS */}
        {notifications.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setActiveFilter("all")}
              className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={{ background: activeFilter === "all" ? VIOLET : "white", color: activeFilter === "all" ? "white" : "#374151", borderColor: activeFilter === "all" ? VIOLET : "#e5e7eb" }}>
              All ({notifications.length})
            </button>
            {Object.entries(TYPE_LABELS).map(([type, label]) => {
              const count = typeCounts[type];
              if (!count) return null;
              return (
                <button key={type} onClick={() => setActiveFilter(type)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={{ background: activeFilter === type ? VIOLET : "white", color: activeFilter === type ? "white" : "#374151", borderColor: activeFilter === type ? VIOLET : "#e5e7eb" }}>
                  {label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* CONTENT */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-8 h-8 rounded-full border-4 animate-spin mx-auto mb-3"
              style={{ borderColor: VIOLET, borderTopColor: "transparent" }} />
            <p className="text-gray-400 animate-pulse">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-14 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4" style={{ background: VIOLET_LIGHT }}>🔔</div>
            <p className="text-gray-700 font-bold text-lg">All caught up!</p>
            <p className="text-gray-400 text-sm mt-2">No new notifications right now</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <p className="text-gray-400 text-sm">No {activeFilter} notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(n => (
              <div key={n.id} onClick={n.action}
                className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 border-2"
                style={{ borderColor: "#f1f5f9" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${n.color}40`}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#f1f5f9"}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${n.color}15` }}>
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{n.title}</p>
                  <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">{n.message}</p>
                  {n.badge && (
                    <span className="inline-block mt-1.5 text-xs font-bold px-2.5 py-1 rounded-full text-white"
                      style={{ background: "#10b981" }}>
                      {n.badge}
                    </span>
                  )}
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className="text-xs text-gray-400">{formatTime(n.time)}</p>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold text-white"
                    style={{ background: n.color }}>
                    {TYPE_LABELS[n.type]?.split(" ").slice(1).join(" ") || n.type}
                  </span>
                  <span className="text-gray-300 text-sm">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}