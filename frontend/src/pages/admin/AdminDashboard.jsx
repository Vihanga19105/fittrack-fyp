import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, Legend,
} from "recharts";
import api from "../../api/api";

const VIOLET       = "#8b5cf6";
const VIOLET_DARK  = "#7c3aed";
const VIOLET_LIGHT = "#f5f3ff";
const NAVY         = "#0A2342";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const name = localStorage.getItem("name") || "Admin";

  const [stats, setStats] = useState({
    totalUsers: 0, totalTrainers: 0,
    totalClients: 0, pendingTrainers: 0,
    activeTrainers: 0,
  });
  const [pendingTrainers, setPendingTrainers] = useState([]);
  const [allUsers,        setAllUsers]        = useState([]);
  const [loading,         setLoading]         = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [usersRes, pendingRes] = await Promise.all([
        api.get("/api/admin/users"),
        api.get("/api/admin/pending-trainers"),
      ]);
      const users          = usersRes.data;
      const trainers       = users.filter(u => u.role === "TRAINER");
      const clients        = users.filter(u => u.role === "CLIENT");
      const activeTrainers = trainers.filter(u => u.approved);
      setAllUsers(users);
      setPendingTrainers(pendingRes.data);
      setStats({
        totalUsers:      users.length,
        totalTrainers:   trainers.length,
        totalClients:    clients.length,
        pendingTrainers: pendingRes.data.length,
        activeTrainers:  activeTrainers.length,
      });
    } catch {}
    setLoading(false);
  };

  const pieData = [
    { name: "Clients",  value: stats.totalClients,  color: VIOLET    },
    { name: "Trainers", value: stats.totalTrainers,  color: "#10b981" },
  ];

  const monthlyData = (() => {
    const months = {};
    allUsers.forEach(u => {
      if (!u.createdAt) return;
      const key = new Date(u.createdAt).toLocaleDateString("en-US", { month: "short" });
      if (!months[key]) months[key] = { month: key, clients: 0, trainers: 0 };
      if (u.role === "CLIENT")  months[key].clients++;
      if (u.role === "TRAINER") months[key].trainers++;
    });
    return Object.values(months).slice(-6);
  })();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#faf5ff" }}>
      <div className="text-center">
        <div className="text-5xl animate-bounce mb-4">⚙️</div>
        <p className="text-gray-400 animate-pulse">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "#faf5ff" }}>

      {/* HERO */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(124,58,237,0.80) 100%), url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "200px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">Admin Portal</p>
            <h1 className="text-4xl font-black tracking-tight">Welcome, {name} 👋</h1>
            <p className="text-purple-100 mt-1 text-sm">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-purple-200 text-sm mt-1">{stats.totalUsers} total users on the platform</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Users",       value: stats.totalUsers,      icon: "👥", color: VIOLET,    path: "/admin/users"           },
            { label: "Total Trainers",    value: stats.totalTrainers,   icon: "💪", color: "#10b981", path: "/admin/trainers"         },
            { label: "Total Clients",     value: stats.totalClients,    icon: "🏃", color: "#3b82f6", path: "/admin/users"            },
            { label: "Pending Approvals", value: stats.pendingTrainers, icon: "⏳", color: stats.pendingTrainers > 0 ? "#f59e0b" : "#10b981", path: "/admin/verify-trainers" },
          ].map(({ label, value, icon, color, path }) => (
            <div key={label} onClick={() => navigate(path)}
              className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${color}20` }}>
                {icon}
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-1">User Distribution</h3>
            <p className="text-xs text-gray-400 mb-4">Clients vs Trainers</p>
            {stats.totalUsers > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 rounded-xl" style={{ background: VIOLET_LIGHT }}>
                <p className="text-sm text-gray-400">No users yet</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-1">Monthly Registrations</h3>
            <p className="text-xs text-gray-400 mb-4">New clients and trainers per month</p>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="clients"  fill={VIOLET}  radius={[4,4,0,0]} name="Clients"  />
                  <Bar dataKey="trainers" fill="#10b981" radius={[4,4,0,0]} name="Trainers" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 rounded-xl" style={{ background: VIOLET_LIGHT }}>
                <p className="text-sm text-gray-400">No registration data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* PENDING TRAINERS */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                Pending Trainer Approvals
                {stats.pendingTrainers > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs text-white font-bold" style={{ background: "#f59e0b" }}>
                    {stats.pendingTrainers}
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Review and approve trainer applications</p>
            </div>
            <button onClick={() => navigate("/admin/verify-trainers")}
              className="text-xs px-4 py-2 rounded-xl text-white font-semibold"
              style={{ background: VIOLET }}>
              View All →
            </button>
          </div>

          {pendingTrainers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">✅</p>
              <p className="font-semibold text-sm text-gray-500">All caught up! No pending approvals.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingTrainers.slice(0, 3).map(trainer => (
                <div key={trainer.userId} className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    {/* ✅ Trainer photo in pending list */}
                    {trainer.profileImage ? (
                      <img src={trainer.profileImage} alt={trainer.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2"
                        style={{ borderColor: "#f59e0b" }} />
                    ) : (
                      <div className="w-10 h-10 rounded-full text-white font-bold flex items-center justify-center flex-shrink-0"
                        style={{ background: "#f59e0b" }}>
                        {trainer.name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{trainer.name}</p>
                      <p className="text-xs text-gray-400">{trainer.email}</p>
                      {trainer.specialization && (
                        <p className="text-xs text-gray-400">🎯 {trainer.specialization}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => navigate("/admin/verify-trainers")}
                    className="px-4 py-2 rounded-xl text-xs text-white font-semibold hover:opacity-90 transition-all"
                    style={{ background: VIOLET }}>
                    Review →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT USERS TABLE */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Recent Users</h3>
              <p className="text-xs text-gray-400 mt-1">Latest registered users on the platform</p>
            </div>
            <button onClick={() => navigate("/admin/users")}
              className="text-xs px-4 py-2 rounded-xl text-white font-semibold"
              style={{ background: VIOLET }}>
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: VIOLET_LIGHT }}>
                  {["User", "Email", "Role", "Status"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide"
                      style={{ color: VIOLET_DARK }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allUsers.slice(0, 5).map((user, i) => (
                  <tr key={user.userId} className="hover:bg-gray-50 transition"
                    style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {/* ✅ User photo in recent users table */}
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={user.name}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2"
                            style={{ borderColor: VIOLET }} />
                        ) : (
                          <div className="w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center flex-shrink-0"
                            style={{ background: VIOLET }}>
                            {user.name?.charAt(0)}
                          </div>
                        )}
                        <span className="font-semibold text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{user.email}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: user.role === "TRAINER" ? "#dbeafe" : user.role === "ADMIN" ? VIOLET_LIGHT : "#dcfce7",
                          color:      user.role === "TRAINER" ? "#1d4ed8" : user.role === "ADMIN" ? VIOLET_DARK  : "#166534",
                        }}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: user.approved ? "#dcfce7" : "#fef3c7",
                          color:      user.approved ? "#166534" : "#92400e",
                        }}>
                        {user.approved ? "Active" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}