import { useEffect, useState } from "react";
import api from "../../api/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts";

const VIOLET       = "#8b5cf6";
const VIOLET_DARK  = "#7c3aed";
const VIOLET_LIGHT = "#f5f3ff";

export default function AdminPlatformAnalytics() {
  const [users,    setUsers]    = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersRes, trainersRes] = await Promise.all([
        api.get("/api/admin/users"),
        api.get("/api/admin/trainers"),
      ]);
      setUsers(usersRes.data);
      setTrainers(trainersRes.data);
    } catch {}
    setLoading(false);
  };

  const totalUsers        = users.length;
  const totalClients      = users.filter(u => u.role === "CLIENT").length;
  const totalTrainers     = users.filter(u => u.role === "TRAINER").length;
  const verifiedTrainers  = trainers.filter(t => t.isVerified).length;
  const pendingTrainers   = trainers.filter(t => !t.isVerified).length;
  const activeClients     = users.filter(u => u.role === "CLIENT" && u.approved).length;

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const monthlyData = (() => {
    const months = {};
    users.forEach(u => {
      if (!u.createdAt) return;
      const key = monthNames[new Date(u.createdAt).getMonth()];
      if (!months[key]) months[key] = { month: key, clients: 0, trainers: 0, total: 0 };
      if (u.role === "CLIENT")  months[key].clients++;
      if (u.role === "TRAINER") months[key].trainers++;
      months[key].total++;
    });
    return Object.values(months);
  })();

  const growthData = (() => {
    let count = 0;
    const monthMap = {};
    [...users].filter(u => u.createdAt)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .forEach(u => {
        const key = monthNames[new Date(u.createdAt).getMonth()];
        count++;
        monthMap[key] = count;
      });
    return Object.entries(monthMap).map(([month, total]) => ({ month, total }));
  })();

  const pieData = [
    { name: "Clients",          value: totalClients,     color: VIOLET    },
    { name: "Verified Trainers",value: verifiedTrainers, color: "#10b981" },
    { name: "Pending Trainers", value: pendingTrainers,  color: "#f59e0b" },
  ].filter(d => d.value > 0);

  const specializationData = (() => {
    const specs = {};
    trainers.forEach(t => { if (!t.specialization) return; specs[t.specialization] = (specs[t.specialization] || 0) + 1; });
    return Object.entries(specs).map(([name, value]) => ({ name, value })).slice(0, 6);
  })();

  const priceRangeData = (() => {
    const ranges = { "< 3K": 0, "3K-5K": 0, "5K-8K": 0, "8K-10K": 0, "> 10K": 0 };
    trainers.forEach(t => {
      const p = Number(t.pricePerMonth) || 0;
      if (p < 3000) ranges["< 3K"]++;
      else if (p < 5000) ranges["3K-5K"]++;
      else if (p < 8000) ranges["5K-8K"]++;
      else if (p < 10000) ranges["8K-10K"]++;
      else ranges["> 10K"]++;
    });
    return Object.entries(ranges).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  })();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#faf5ff" }}>
      <div className="text-center">
        <div className="text-5xl animate-bounce mb-4">📊</div>
        <p className="text-gray-400 animate-pulse">Loading analytics...</p>
      </div>
    </div>
  );

  const Empty = () => (
    <div className="flex items-center justify-center h-48 rounded-xl" style={{ background: VIOLET_LIGHT }}>
      <p className="text-sm text-gray-400">No data yet</p>
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
            <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
            <h1 className="text-4xl font-black tracking-tight">Platform Analytics 📊</h1>
            <p className="text-purple-100 mt-1 text-sm">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-purple-200 text-sm mt-1">Real-time insights about FitTrack</p>
          </div>
          <div className="hidden md:flex gap-2 flex-wrap">
            {[
              { label: "Total Users",   value: totalUsers       },
              { label: "Clients",       value: totalClients     },
              { label: "Verified",      value: verifiedTrainers },
              { label: "Pending",       value: pendingTrainers  },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                <p className="text-xs text-purple-200 mb-0.5">{label}</p>
                <p className="font-black text-white text-xl leading-none">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-1">Monthly Registrations</h3>
            <p className="text-xs text-gray-400 mb-4">New clients and trainers per month</p>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                  <Legend />
                  <Bar dataKey="clients"  fill={VIOLET}  radius={[4,4,0,0]} name="Clients"  />
                  <Bar dataKey="trainers" fill="#10b981" radius={[4,4,0,0]} name="Trainers" />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-1">User Growth</h3>
            <p className="text-xs text-gray-400 mb-4">Cumulative registrations over time</p>
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={VIOLET} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={VIOLET} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                  <Area type="monotone" dataKey="total" stroke={VIOLET} strokeWidth={3} fill="url(#vGrad)" name="Total Users" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-1">User Distribution</h3>
            <p className="text-xs text-gray-400 mb-4">Breakdown by user type</p>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-1">Trainer Specializations</h3>
            <p className="text-xs text-gray-400 mb-4">Distribution of expertise areas</p>
            {specializationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={specializationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} width={90} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                  <Bar dataKey="value" fill={VIOLET} radius={[0,4,4,0]} name="Trainers" />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </div>
        </div>

        {/* ROW 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-1">Trainer Price Ranges</h3>
            <p className="text-xs text-gray-400 mb-4">Monthly subscription price distribution</p>
            {priceRangeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={priceRangeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} formatter={v => [`${v} trainers`, "Count"]} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4,4,0,0]} name="Trainers" />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </div>

          {/* ✅ Verified Trainers with photos */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-1">Verified Trainers</h3>
            <p className="text-xs text-gray-400 mb-4">Active trainers on the platform</p>
            {trainers.filter(t => t.isVerified).length === 0 ? <Empty /> : (
              <div className="overflow-y-auto max-h-[220px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr style={{ background: VIOLET_LIGHT }}>
                      {["Trainer", "Specialization", "Price/mo"].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-xs font-bold uppercase tracking-wide"
                          style={{ color: VIOLET_DARK }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {trainers.filter(t => t.isVerified).map(t => (
                      <tr key={t.userId} className="hover:bg-gray-50">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {/* ✅ Trainer photo in verified trainers table */}
                            {t.profileImage ? (
                              <img src={t.profileImage} alt={t.name}
                                className="w-7 h-7 rounded-full object-cover flex-shrink-0 border"
                                style={{ borderColor: VIOLET }} />
                            ) : (
                              <div className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center flex-shrink-0"
                                style={{ background: VIOLET }}>
                                {t.name?.charAt(0)}
                              </div>
                            )}
                            <span className="font-semibold text-gray-800 text-xs">{t.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-500 text-xs">{t.specialization || "—"}</td>
                        <td className="px-3 py-3 font-bold text-xs" style={{ color: "#10b981" }}>
                          {t.pricePerMonth ? `LKR ${Number(t.pricePerMonth).toLocaleString()}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PLATFORM HEALTH */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-5">Platform Health Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Trainer Verification Rate", value: totalTrainers > 0 ? Math.round((verifiedTrainers / totalTrainers) * 100) : 0, color: "#10b981", desc: `${verifiedTrainers} of ${totalTrainers} trainers verified` },
              { label: "Client Activation Rate",    value: totalClients  > 0 ? Math.round((activeClients    / totalClients)  * 100) : 0, color: VIOLET,    desc: `${activeClients} of ${totalClients} clients active`   },
              { label: "Platform Utilization",      value: totalUsers    > 0 ? Math.min(100, Math.round((verifiedTrainers + activeClients) / totalUsers * 100)) : 0, color: "#f59e0b", desc: "Active users vs total registered" },
            ].map(({ label, value, color, desc }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700">{label}</p>
                  <span className="font-bold text-lg" style={{ color }}>{value}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}