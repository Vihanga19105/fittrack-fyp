import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import api from "../../api/api";

const VIOLET       = "#8b5cf6";
const VIOLET_DARK  = "#7c3aed";
const VIOLET_LIGHT = "#f5f3ff";

export default function AdminManageUsers() {
  const [search,    setSearch]    = useState("");
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = () => {
    api.get("/api/admin/users")
      .then(res => { setUsers(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const tabs = ["ALL", "CLIENT", "TRAINER", "ADMIN"];

  const counts = {
    ALL:     users.length,
    CLIENT:  users.filter(u => u.role === "CLIENT").length,
    TRAINER: users.filter(u => u.role === "TRAINER").length,
    ADMIN:   users.filter(u => u.role === "ADMIN").length,
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchTab    = activeTab === "ALL" || u.role === activeTab;
    return matchSearch && matchTab;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#faf5ff" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 animate-spin mx-auto mb-3"
          style={{ borderColor: VIOLET, borderTopColor: "transparent" }} />
        <p className="text-gray-400 animate-pulse">Loading users...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "#faf5ff" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(124,58,237,0.80) 100%), url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "200px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
            <h1 className="text-4xl font-black tracking-tight">Manage Users 👥</h1>
            <p className="text-purple-100 mt-1 text-sm">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-purple-200 text-sm mt-1">{users.length} total users on the platform</p>
          </div>
          {/* Stat pills */}
          <div className="hidden md:flex gap-2">
            {[
              { label: "Total",    value: counts.ALL     },
              { label: "Clients",  value: counts.CLIENT  },
              { label: "Trainers", value: counts.TRAINER },
              { label: "Admins",   value: counts.ADMIN   },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                <p className="text-xs text-purple-200 mb-0.5">{label}</p>
                <p className="font-black text-white text-xl leading-none">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* SEARCH + TABS */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
              <input type="text" placeholder="Search by name or email..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 text-sm focus:outline-none transition-all"
                onFocus={e => e.target.style.borderColor = VIOLET}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: activeTab === tab ? VIOLET : VIOLET_LIGHT,
                    color:      activeTab === tab ? "white" : VIOLET_DARK,
                  }}>
                  {tab} ({counts[tab]})
                </button>
              ))}
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: VIOLET_LIGHT }}>
                  {["#", "User", "Email", "Role", "Status"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide"
                      style={{ color: VIOLET_DARK }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user, i) => (
                  <tr key={user.userId} className="hover:bg-gray-50 transition"
                    style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td className="px-5 py-4 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center flex-shrink-0"
                          style={{ background: VIOLET }}>
                          {user.name?.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{user.email}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: user.role === "TRAINER" ? "#dbeafe" : user.role === "ADMIN" ? VIOLET_LIGHT : "#dcfce7",
                          color:      user.role === "TRAINER" ? "#1d4ed8" : user.role === "ADMIN" ? VIOLET_DARK  : "#166534",
                        }}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: user.approved ? "#dcfce7" : "#fef3c7",
                          color:      user.approved ? "#166634" : "#92400e",
                        }}>
                        {user.approved ? "✓ Active" : "⏳ Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">Showing {filtered.length} of {users.length} users</p>
          </div>
        </div>
      </div>
    </div>
  );
}