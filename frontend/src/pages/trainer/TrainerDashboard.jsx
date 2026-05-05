import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import api from "../../api/api";

const API = "http://localhost:8080/api";
const TEAL       = "#14b8a6";
const TEAL_DARK  = "#0d9488";
const TEAL_LIGHT = "#f0fdfa";
const NAVY       = "#0A2342";

export default function TrainerDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [profile, setProfile] = useState({
    name: localStorage.getItem("name") || "Trainer",
    specialization: "", pricePerMonth: "",
    isVerified: false, bio: "", certification: "",
    experienceYears: "", phone: "",
    profileImage: null, rejectionReason: null,
  });

  const [stats, setStats] = useState({ totalClients: 0, pendingRequests: 0 });
  const [pendingList, setPendingList] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState([]);
  const [expiringClients, setExpiringClients] = useState([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const res = await api.get("/api/profile/trainer");
      setProfile({
        name:            res.data.name            || localStorage.getItem("name") || "Trainer",
        specialization:  res.data.specialization  || "",
        pricePerMonth:   res.data.pricePerMonth    || "",
        isVerified:      res.data.verified         || false,
        bio:             res.data.bio              || "",
        certification:   res.data.certification    || "",
        experienceYears: res.data.experienceYears  || "",
        phone:           res.data.phone            || "",
        profileImage:    res.data.profileImage     || null,
        rejectionReason: res.data.rejectionReason  || null,
      });

      if (res.data.verified) {
        try {
          const pendRes = await api.get("/api/subscriptions/requests");
          setPendingList(pendRes.data);
          setStats(p => ({ ...p, pendingRequests: pendRes.data.length }));
        } catch {}

        try {
          const clientRes = await api.get("/api/subscriptions/clients");
          const clients = clientRes.data;
          setClientList(clients);
          setStats(p => ({ ...p, totalClients: clients.length }));

          const now = new Date();
          setRecentPayments(clients.filter(c => {
            if (!c.startDate) return false;
            return (now - new Date(c.startDate)) / (1000 * 60 * 60 * 24) <= 7;
          }));
          setExpiringClients(clients.filter(c => {
            if (!c.endDate) return false;
            const diff = (new Date(c.endDate) - now) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 5;
          }));
        } catch {}
      }
    } catch {}

    try {
      const chatRes = await axios.get(`${API}/chat/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(chatRes.data.unreadCount || 0);
    } catch {}

    setLoading(false);
  };

  const sendReminder = async (clientName, clientId) => {
    Swal.fire({
      title: `Send reminder to ${clientName}?`,
      html: `<p style="color:#6b7280;font-size:14px;">A renewal reminder will be sent to ${clientName} via chat.</p>`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: TEAL, cancelButtonColor: "#6b7280",
      confirmButtonText: "Send Reminder",
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          await axios.post(`${API}/chat/send`, {
            receiverId: clientId,
            message: "⚠️ Hi! Your subscription is expiring soon. Please renew to continue your fitness journey! 💪",
          }, { headers: { Authorization: `Bearer ${token}` } });
          Swal.fire({ title: "Reminder Sent!", text: `${clientName} has been notified.`, icon: "success", timer: 1500, showConfirmButton: false });
        } catch { Swal.fire("Error", "Failed to send reminder", "error"); }
      }
    });
  };

  const completenessFields = [
    { key: "bio",            label: "Bio"            },
    { key: "specialization", label: "Specialization" },
    { key: "certification",  label: "Certification"  },
    { key: "experienceYears",label: "Experience"     },
    { key: "pricePerMonth",  label: "Price"          },
    { key: "phone",          label: "Phone"          },
    { key: "profileImage",   label: "Profile photo"  },
  ];
  const filled = completenessFields.filter(f => profile[f.key] && String(profile[f.key]).trim() !== "").length;
  const completeness = Math.round((filled / completenessFields.length) * 100);
  const missing = completenessFields.filter(f => !profile[f.key] || String(profile[f.key]).trim() === "").map(f => f.label);

  const handleAccept = async (id) => {
    try {
      await api.put(`/api/subscriptions/${id}/accept`);
      Swal.fire({ title: "Accepted!", icon: "success", timer: 1500, showConfirmButton: false });
      loadAll();
    } catch { Swal.fire("Error", "Failed to accept", "error"); }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/api/subscriptions/${id}/reject`);
      Swal.fire({ title: "Rejected", icon: "info", timer: 1500, showConfirmButton: false });
      loadAll();
    } catch { Swal.fire("Error", "Failed to reject", "error"); }
  };

  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const monthlyEarnings = clientList.reduce((sum, c) => sum + (Number(c.trainerPrice) || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#f0fdf4" }}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">💪</div>
          <p className="text-gray-400 animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f0fdf4" }}>

      {/* ── HERO ── */}
      <div
        className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(20,184,166,0.80) 100%), url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1400&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "200px",
        }}>

        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-6 flex-wrap">

            {/* LEFT — greeting only */}
            <div>
              <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">
                Trainer Dashboard
              </p>
              <h1 className="text-4xl font-black tracking-tight">
                Welcome, {profile.name} 👋
              </h1>
              <p className="text-teal-100 mt-1 text-sm">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {profile.isVerified ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: "rgba(20,184,166,0.3)", color: "#99f6e4" }}>
                    ✓ Verified Trainer
                  </span>
                ) : profile.rejectionReason ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: "rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                    ❌ Application Rejected
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

            {/* RIGHT — monthly earnings pill only (not duplicating stat cards) */}
            {profile.isVerified && (
              <div className="hidden md:flex flex-col items-end gap-2">
                <div className="bg-white/15 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 text-center">
                  <p className="text-xs text-teal-200 mb-1">Monthly Earnings</p>
                  <p className="text-3xl font-black text-white">
                    LKR {monthlyEarnings.toLocaleString()}
                  </p>
                  <p className="text-xs text-teal-200 mt-1">{stats.totalClients} active client{stats.totalClients !== 1 ? "s" : ""}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ── END HERO ── */}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* ── STATE 1: REJECTED ── */}
        {!profile.isVerified && profile.rejectionReason && (
          <div className="bg-white rounded-2xl shadow-sm border-l-4 p-6" style={{ borderColor: "#ef4444" }}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">❌</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-600 mb-1">Application Rejected</h3>
                <p className="text-sm text-gray-500 mb-3">Your trainer application was reviewed and rejected. Please read the reason below, update your profile and resubmit.</p>
                <div className="p-4 rounded-xl mb-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Reason from admin</p>
                  <p className="text-sm text-red-700 font-medium">"{profile.rejectionReason}"</p>
                </div>
                <div className="p-4 rounded-xl mb-4" style={{ background: TEAL_LIGHT }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: TEAL_DARK }}>What to do next</p>
                  <ol className="text-sm space-y-1" style={{ color: TEAL_DARK }}>
                    <li>1. Go to your Profile page</li>
                    <li>2. Fix the issues mentioned above</li>
                    <li>3. Make sure all fields are filled</li>
                    <li>4. Add a clear profile photo</li>
                    <li>5. Save — admin will review again</li>
                  </ol>
                </div>
                <button onClick={() => navigate("/trainer/profile")}
                  className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: TEAL }}>
                  Update Profile & Resubmit →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STATE 2: PROFILE INCOMPLETE ── */}
        {!profile.isVerified && !profile.rejectionReason && completeness < 100 && (
          <div className="bg-white rounded-2xl shadow-sm border-l-4 p-5" style={{ borderColor: "#f59e0b" }}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">📋</span>
                  <h3 className="font-bold text-gray-800">Complete your profile to get approved</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">Admin will review your profile details before approving your account.</p>
                {missing.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {missing.map(m => (
                      <span key={m} className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ background: "#fef3c7", color: "#92400e" }}>
                        ⚠ {m}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${completeness}%`, background: completeness >= 80 ? TEAL : "#f59e0b" }} />
                  </div>
                  <span className="text-sm font-bold" style={{ color: completeness >= 80 ? TEAL : "#f59e0b" }}>
                    {completeness}%
                  </span>
                </div>
              </div>
              <button onClick={() => navigate("/trainer/profile")}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex-shrink-0"
                style={{ background: "#f59e0b" }}>
                Complete Profile →
              </button>
            </div>
          </div>
        )}

        {/* ── STATE 3: WAITING FOR APPROVAL ── */}
        {!profile.isVerified && !profile.rejectionReason && completeness === 100 && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4"
              style={{ background: TEAL_LIGHT }}>⏳</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Profile Submitted — Awaiting Admin Approval</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
              Your profile is 100% complete and submitted for review. You will be notified once approved!
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: TEAL_LIGHT }}>
              <span className="text-sm font-medium" style={{ color: TEAL_DARK }}>✓ Profile complete — pending admin review</span>
            </div>
          </div>
        )}

        {/* ── VERIFIED DASHBOARD ── */}
        {profile.isVerified && (
          <>
            {/* STAT CARDS — 4 cards, no duplicate from hero */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active Clients",   value: stats.totalClients,    icon: "👥", color: TEAL      },
                { label: "Pending Requests", value: stats.pendingRequests, icon: "📩", color: stats.pendingRequests > 0 ? "#f59e0b" : TEAL },
                { label: "Unread Messages",  value: unreadCount,           icon: "💬", color: unreadCount > 0 ? "#ef4444" : TEAL },
                { label: "Price / Month",    value: profile.pricePerMonth  ? `LKR ${Number(profile.pricePerMonth).toLocaleString()}` : "Not set", icon: "💰", color: "#8b5cf6" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${color}20` }}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="font-bold text-gray-800 text-xl">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* PAYMENT RECEIVED BANNER */}
            {recentPayments.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border-l-4 p-5" style={{ borderColor: TEAL }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="font-bold text-gray-800">New payment{recentPayments.length > 1 ? "s" : ""} received!</p>
                      <div className="mt-2 space-y-1">
                        {recentPayments.map(c => (
                          <p key={c.id} className="text-sm text-gray-500">
                            ✅ <strong>{c.clientName}</strong> paid{" "}
                            <span className="font-semibold" style={{ color: TEAL }}>
                              LKR {c.trainerPrice ? Number(c.trainerPrice).toLocaleString() : ""}
                            </span>
                            {" "}— active until {c.endDate}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => navigate("/trainer/notifications")}
                    className="px-4 py-2 rounded-xl text-white text-xs font-semibold flex-shrink-0"
                    style={{ background: TEAL }}>
                    View All →
                  </button>
                </div>
              </div>
            )}

            {/* EXPIRING SOON BANNER */}
            {expiringClients.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border-l-4 p-5" style={{ borderColor: "#f59e0b" }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 mb-1">Subscriptions expiring soon</p>
                    <p className="text-sm text-gray-500 mb-3">Send a reminder to these clients to renew:</p>
                    <div className="space-y-2">
                      {expiringClients.map(c => {
                        const days = getDaysUntilExpiry(c.endDate);
                        return (
                          <div key={c.id} className="flex items-center justify-between p-3 rounded-xl"
                            style={{ background: "#fef3c7" }}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-sm"
                                style={{ background: "#f59e0b" }}>
                                {c.clientName?.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{c.clientName}</p>
                                <p className="text-xs text-orange-600 font-medium">
                                  {days === 0 ? "Expires today!" : `Expires in ${days} day${days !== 1 ? "s" : ""}`}
                                </p>
                              </div>
                            </div>
                            <button onClick={() => sendReminder(c.clientName, c.clientId)}
                              className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
                              style={{ background: "#f59e0b" }}>
                              Send Reminder
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* LEFT 2 COLS */}
              <div className="lg:col-span-2 space-y-6">

                {/* PENDING REQUESTS */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 text-lg">
                      Pending Requests
                      {stats.pendingRequests > 0 && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white"
                          style={{ background: "#f59e0b" }}>
                          {stats.pendingRequests}
                        </span>
                      )}
                    </h3>
                    <button onClick={() => navigate("/trainer/client-requests")}
                      className="text-xs px-3 py-1.5 rounded-lg text-white"
                      style={{ background: TEAL }}>
                      View All
                    </button>
                  </div>
                  {pendingList.length === 0 ? (
                    <div className="text-center py-8 rounded-xl" style={{ background: TEAL_LIGHT }}>
                      <p className="text-3xl mb-2">📭</p>
                      <p className="text-sm font-medium" style={{ color: TEAL_DARK }}>No pending requests</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingList.slice(0, 3).map(sub => (
                        <div key={sub.id} className="flex justify-between items-center px-4 py-3 rounded-xl"
                          style={{ background: "#fef9f0", border: "1px solid #fde68a" }}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full text-white font-bold flex items-center justify-center"
                              style={{ background: "#f59e0b" }}>
                              {sub.clientName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{sub.clientName}</p>
                              <p className="text-xs text-gray-400">{sub.startDate}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleAccept(sub.id)}
                              className="px-3 py-1.5 rounded-lg text-xs text-white font-semibold"
                              style={{ background: TEAL }}>
                              Accept
                            </button>
                            <button onClick={() => handleReject(sub.id)}
                              className="px-3 py-1.5 rounded-lg text-xs text-white font-semibold"
                              style={{ background: "#ef4444" }}>
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ACTIVE CLIENTS */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 text-lg">Active Clients</h3>
                    <button onClick={() => navigate("/trainer/my-clients")}
                      className="text-xs px-3 py-1.5 rounded-lg text-white"
                      style={{ background: TEAL }}>
                      View All
                    </button>
                  </div>
                  {clientList.length === 0 ? (
                    <div className="text-center py-8 rounded-xl" style={{ background: TEAL_LIGHT }}>
                      <p className="text-3xl mb-2">👥</p>
                      <p className="text-sm font-medium" style={{ color: TEAL_DARK }}>No active clients yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {clientList.slice(0, 4).map(sub => {
                        const days = getDaysUntilExpiry(sub.endDate);
                        const isExpiring = days !== null && days <= 5;
                        return (
                          <div key={sub.id}
                            className="flex items-center gap-3 p-4 rounded-xl border transition hover:shadow-sm cursor-pointer"
                            style={{ borderColor: isExpiring ? "#fde68a" : "#e5e7eb", background: isExpiring ? "#fefce8" : "white" }}
                            onClick={() => navigate(`/trainer/client/${sub.clientId}`)}>
                            <div className="w-10 h-10 rounded-full text-white font-bold flex items-center justify-center flex-shrink-0"
                              style={{ background: TEAL }}>
                              {sub.clientName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm truncate">{sub.clientName}</p>
                              {isExpiring ? (
                                <p className="text-xs text-orange-500 font-medium">⚠ Expires in {days} day{days !== 1 ? "s" : ""}</p>
                              ) : (
                                <p className="text-xs text-gray-400 truncate">Until {sub.endDate}</p>
                              )}
                            </div>
                            <span className="text-gray-400 text-lg">→</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COL */}
              <div className="space-y-4">

                {/* MESSAGES */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-500">Messages</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs text-white font-bold"
                        style={{ background: "#ef4444" }}>
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <button onClick={() => navigate("/trainer/chat")}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
                    style={{ background: TEAL }}>
                    💬 Open Messages
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                  </button>
                </div>

                {/* QUICK ACTIONS */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    {[
                      { label: "👤 Edit Profile",     path: "/trainer/profile"         },
                      { label: "📋 All Requests",      path: "/trainer/client-requests" },
                      { label: "👥 All Clients",        path: "/trainer/my-clients"      },
                      { label: "📈 Progress Monitor",  path: "/trainer/client-progress" },
                      { label: "💰 Income Report",     path: "/trainer/income"          },
                      { label: "📅 Availability",      path: "/trainer/availability"    },
                    ].map(({ label, path }) => (
                      <button key={label} onClick={() => navigate(path)}
                        className="w-full py-2.5 rounded-xl text-sm font-medium text-left px-4 transition hover:opacity-90"
                        style={{ background: TEAL_LIGHT, color: TEAL_DARK }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PROFILE COMPLETENESS */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-500">Profile</h3>
                    <span className="text-sm font-bold"
                      style={{ color: completeness === 100 ? TEAL : "#f59e0b" }}>
                      {completeness}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-2">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${completeness}%`, background: completeness === 100 ? TEAL : "#f59e0b" }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{profile.specialization || "No specialization"}</span>
                    <span>{profile.pricePerMonth ? `LKR ${Number(profile.pricePerMonth).toLocaleString()}` : "No price"}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}