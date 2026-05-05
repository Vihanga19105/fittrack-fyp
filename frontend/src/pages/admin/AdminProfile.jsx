import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../api/api";

const VIOLET       = "#8b5cf6";
const VIOLET_DARK  = "#7c3aed";
const VIOLET_LIGHT = "#f5f3ff";
const NAVY         = "#0A2342";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [admin,   setAdmin]   = useState({ name: "", email: "" });
  const [stats,   setStats]   = useState({ totalClients: 0, totalTrainers: 0, pendingVerifications: 0, totalSubscriptions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const meRes = await api.get("/api/profile/me");
      setAdmin({ name: meRes.data.name || "", email: meRes.data.email || "" });
    } catch {
      setAdmin({ name: localStorage.getItem("name") || "Admin", email: "" });
    }
    try {
      const [usersRes, pendingRes, subsRes] = await Promise.all([
        api.get("/api/admin/users"),
        api.get("/api/admin/pending-trainers"),          // ✅ correct endpoint — excludes rejected
        api.get("/api/admin/subscriptions").catch(() => ({ data: [] })),
      ]);
      const allUsers = usersRes.data;
      setStats({
        totalClients:         allUsers.filter(u => u.role === "CLIENT").length,
        totalTrainers:        allUsers.filter(u => u.role === "TRAINER").length,
        pendingVerifications: pendingRes.data.length,    // ✅ only truly pending, not rejected
        totalSubscriptions:   subsRes.data.filter(s => s.status === "ACTIVE").length,
      });
    } catch {}
    setLoading(false);
  };

  const logout = () => {
    Swal.fire({
      title: "Logout?", icon: "warning", showCancelButton: true,
      confirmButtonColor: VIOLET, cancelButtonColor: "#9ca3af",
      confirmButtonText: "Yes, Logout",
    }).then(result => {
      if (result.isConfirmed) { localStorage.clear(); sessionStorage.clear(); navigate("/"); }
    });
  };

  const initials = admin.name
    ? admin.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#faf5ff" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 animate-spin mx-auto mb-3"
          style={{ borderColor: VIOLET, borderTopColor: "transparent" }} />
        <p className="text-gray-400 animate-pulse">Loading profile...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "#faf5ff" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(124,58,237,0.80) 100%), url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "200px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${NAVY}, ${VIOLET_DARK})` }}>
              {initials}
            </div>
            <div>
              <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">Admin Portal</p>
              <h1 className="text-4xl font-black tracking-tight">{admin.name || "Admin"}</h1>
              <p className="text-purple-100 mt-1 text-sm">{admin.email || "—"}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
                  ⚙️ Super Administrator
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "rgba(20,184,166,0.3)", color: "#99f6e4" }}>
                  ✓ Verified
                </span>
              </div>
            </div>
          </div>
          <button onClick={logout}
            className="hidden md:block px-5 py-2.5 rounded-xl border-2 border-red-300/50 text-red-200 text-sm font-semibold hover:bg-red-500/20 transition-all">
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Clients",     value: stats.totalClients,         icon: "👥", color: VIOLET    },
            { label: "Total Trainers",    value: stats.totalTrainers,        icon: "💪", color: "#10b981" },
            { label: "Pending Approvals", value: stats.pendingVerifications, icon: "⏳", color: "#f59e0b" },
            { label: "Active Subs",       value: stats.totalSubscriptions,   icon: "💳", color: "#3b82f6" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${color}20` }}>
                {icon}
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ACCOUNT DETAILS */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 text-lg mb-5">Account Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Full Name",      value: admin.name  || "—"             },
              { label: "Email Address",  value: admin.email || "—"             },
              { label: "Role",           value: "Super Administrator"          },
              { label: "Account Status", value: "● Active", color: "#10b981"   },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <div className="px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm font-medium"
                  style={{ color: color || "#374151" }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            To update your name or email, contact the system owner directly.
          </p>
        </div>

        {/* QUICK ACTIONS */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 text-lg mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "👥 Manage Users",    path: "/admin/users"              },
              { label: "💪 Manage Trainers", path: "/admin/trainers"           },
              { label: "📊 Analytics",       path: "/admin/platform-analytics" },
              { label: "💳 Payments",        path: "/admin/payments"           },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => navigate(path)}
                className="py-3 px-4 rounded-xl text-sm font-semibold text-left hover:opacity-90 transition-all"
                style={{ background: VIOLET_LIGHT, color: VIOLET_DARK }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* LOGOUT */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border-2 border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-700">Log Out of FitTrack</p>
              <p className="text-xs text-gray-400 mt-0.5">You will need to log in again to access the admin portal</p>
            </div>
            <button onClick={logout}
              className="px-5 py-2.5 rounded-xl border-2 border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-all flex-shrink-0">
              🚪 Logout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}