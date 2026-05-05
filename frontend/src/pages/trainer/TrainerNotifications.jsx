import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../api/api";

const TEAL       = "#14b8a6";
const TEAL_DARK  = "#0d9488";
const TEAL_LIGHT = "#f0fdfa";

export default function TrainerNotifications() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeFilter,  setActiveFilter]  = useState("all");

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    const notifs = [];

    try {
      // ── PENDING REQUESTS ──
      const pendRes = await api.get("/api/subscriptions/requests");
      pendRes.data.forEach(sub => {
        notifs.push({
          id:      `req-${sub.id}`,
          type:    "request",
          icon:    "👤",
          title:   "New Client Request",
          message: `${sub.clientName} wants to subscribe to your training plan`,
          time:    sub.startDate,
          color:   "#f59e0b",
          action:  () => navigate("/trainer/client-requests"),
        });
      });
    } catch {}

    try {
      // ── UNREAD MESSAGES ──
      const chatRes = await axios.get(
        "http://localhost:8080/api/chat/unread-count",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (chatRes.data.unreadCount > 0) {
        notifs.push({
          id:      "chat-unread",
          type:    "message",
          icon:    "💬",
          title:   "Unread Messages",
          message: `You have ${chatRes.data.unreadCount} unread message${chatRes.data.unreadCount !== 1 ? "s" : ""} from your clients`,
          time:    "Now",
          color:   TEAL,
          action:  () => navigate("/trainer/chat"),
        });
      }
    } catch {}

    try {
      // ── ACTIVE CLIENTS / PAYMENTS ──
      const clientRes = await api.get("/api/subscriptions/clients");
      const now = new Date();

      clientRes.data.forEach(c => {
        // Payment received (joined in last 7 days)
        if (c.startDate) {
          const diffDays = (now - new Date(c.startDate)) / (1000 * 60 * 60 * 24);
          if (diffDays <= 7) {
            notifs.push({
              id:      `payment-${c.id}`,
              type:    "payment",
              icon:    "💰",
              title:   "Payment Received",
              message: `${c.clientName} completed payment — active until ${c.endDate || "30 days"}`,
              time:    c.startDate,
              color:   "#10b981",
              badge:   c.trainerPrice ? `LKR ${Number(c.trainerPrice).toLocaleString()}` : null,
              action:  () => navigate(`/trainer/client/${c.clientId}`),
            });
          }
        }

        // Expiring soon (within 5 days)
        if (c.endDate) {
          const daysLeft = Math.ceil((new Date(c.endDate) - now) / (1000 * 60 * 60 * 24));
          if (daysLeft >= 0 && daysLeft <= 5) {
            notifs.push({
              id:      `expiring-${c.id}`,
              type:    "expiring",
              icon:    "⚠️",
              title:   "Subscription Expiring Soon",
              message: `${c.clientName}'s subscription expires ${daysLeft === 0 ? "today" : `in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}`,
              time:    c.endDate,
              color:   "#f97316",
              action:  () => navigate(`/trainer/client/${c.clientId}`),
            });
          }
        }
      });

      // Active clients summary
      if (clientRes.data.length > 0) {
        notifs.push({
          id:      "active-summary",
          type:    "client",
          icon:    "✅",
          title:   "Active Clients",
          message: `You currently have ${clientRes.data.length} active client${clientRes.data.length !== 1 ? "s" : ""} with paid subscriptions`,
          time:    "Now",
          color:   "#8b5cf6",
          action:  () => navigate("/trainer/my-clients"),
        });
      }
    } catch {}

    // Sort by priority
    const order = { payment: 0, expiring: 1, request: 2, message: 3, client: 4 };
    notifs.sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));

    setNotifications(notifs);
    setLoading(false);
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === "Now") return "Now";
    try {
      return new Date(timeStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return timeStr; }
  };

  const TYPE_LABELS = {
    payment:  "💰 Payment",
    expiring: "⚠️ Expiring",
    request:  "👤 Request",
    message:  "💬 Message",
    client:   "✅ Client",
  };

  const filtered = activeFilter === "all"
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  const typeCounts = ["payment","expiring","request","message","client"].reduce((acc, t) => {
    acc[t] = notifications.filter(n => n.type === t).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen pb-10" style={{ background: "#f0fdf4" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(20,184,166,0.80) 100%), url('https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "200px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Alerts</p>
            <h1 className="text-4xl font-black tracking-tight">Notifications 🔔</h1>
            <p className="text-teal-100 mt-1 text-sm">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-teal-200 text-sm mt-1">
              {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </p>
          </div>
          {/* Stat pills */}
          <div className="hidden md:flex gap-2 flex-wrap">
            {[
              { label: "Requests",  value: typeCounts.request,  color: "#f59e0b" },
              { label: "Payments",  value: typeCounts.payment,  color: "#10b981" },
              { label: "Messages",  value: typeCounts.message,  color: TEAL      },
              { label: "Expiring",  value: typeCounts.expiring, color: "#f97316" },
            ].map(({ label, value, color }) => value > 0 && (
              <div key={label} className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                <p className="text-xs text-teal-200 mb-0.5">{label}</p>
                <p className="font-black text-white text-lg leading-none" style={{ color }}>{value}</p>
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
              style={{
                background:  activeFilter === "all" ? TEAL : "white",
                color:       activeFilter === "all" ? "white" : "#374151",
                borderColor: activeFilter === "all" ? TEAL : "#e5e7eb",
              }}>
              All ({notifications.length})
            </button>
            {Object.entries(TYPE_LABELS).map(([type, label]) => {
              const count = typeCounts[type];
              if (!count) return null;
              return (
                <button key={type} onClick={() => setActiveFilter(type)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={{
                    background:  activeFilter === type ? TEAL : "white",
                    color:       activeFilter === type ? "white" : "#374151",
                    borderColor: activeFilter === type ? TEAL : "#e5e7eb",
                  }}>
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
              style={{ borderColor: TEAL, borderTopColor: "transparent" }} />
            <p className="text-gray-400 animate-pulse">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-14 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4"
              style={{ background: TEAL_LIGHT }}>🔔</div>
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

                {/* ICON */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${n.color}20` }}>
                  {n.icon}
                </div>

                {/* CONTENT */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{n.title}</p>
                  <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">{n.message}</p>
                  {n.badge && (
                    <span className="inline-block mt-1.5 text-xs font-bold px-2.5 py-1 rounded-full text-white"
                      style={{ background: "#10b981" }}>
                      {n.badge} received
                    </span>
                  )}
                </div>

                {/* TIME + TYPE */}
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