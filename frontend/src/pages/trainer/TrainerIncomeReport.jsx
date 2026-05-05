import { useState, useEffect } from "react";
import api from "../../api/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";

const TEAL       = "#14b8a6";
const TEAL_DARK  = "#0d9488";
const TEAL_LIGHT = "#f0fdfa";

export default function TrainerIncomeReport() {
  const [allSubs,    setAllSubs]    = useState([]);
  const [activeSubs, setActiveSubs] = useState([]);
  const [profile,    setProfile]    = useState({ pricePerMonth: 0 });
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("overview");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [clientRes, profileRes, allSubsRes] = await Promise.all([
        api.get("/api/subscriptions/clients"),
        api.get("/api/profile/trainer"),
        api.get("/api/subscriptions/all-my-clients"),
      ]);
      setActiveSubs(clientRes.data);
      setProfile(profileRes.data);
      setAllSubs(allSubsRes.data || []);
    } catch {
      try {
        const [clientRes, profileRes] = await Promise.all([
          api.get("/api/subscriptions/clients"),
          api.get("/api/profile/trainer"),
        ]);
        setActiveSubs(clientRes.data);
        setAllSubs(clientRes.data);
        setProfile(profileRes.data);
      } catch {}
    }
    setLoading(false);
  };

  const price        = Number(profile.pricePerMonth) || 0;
  const totalClients = activeSubs.length;
  const totalIncome  = totalClients * price;
  const totalEarned  = allSubs.filter(s => s.status === "ACTIVE" || s.status === "EXPIRED").length * price;
  const thisMonth    = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // ── MONTHLY CHART DATA (last 6 months) ──
  const monthlyData = (() => {
    const months = {};
    allSubs.forEach(c => {
      if (!c.startDate) return;
      const key = new Date(c.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!months[key]) months[key] = { month: key, clients: 0, income: 0 };
      months[key].clients += 1;
      months[key].income  += price;
    });
    return Object.values(months).slice(-6);
  })();

  const getDaysLeft = (endDate) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#f0fdf4" }}>
      <div className="text-center">
        <div className="text-4xl animate-bounce mb-3">💰</div>
        <p className="text-gray-400 animate-pulse">Loading income data...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "#f0fdf4" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(20,184,166,0.80) 100%), url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "200px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Financial Overview</p>
            <h1 className="text-4xl font-black tracking-tight">Income Report 💰</h1>
            <p className="text-teal-100 mt-1 text-sm">{thisMonth}</p>
            <p className="text-teal-200 text-sm mt-1">{totalClients} active client{totalClients !== 1 ? "s" : ""}</p>
          </div>
          {/* Earnings pills */}
          <div className="hidden md:flex gap-2">
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
              <p className="text-xs text-teal-200 mb-0.5">This Month</p>
              <p className="font-black text-white text-lg leading-none">LKR {totalIncome.toLocaleString()}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
              <p className="text-xs text-teal-200 mb-0.5">All Time</p>
              <p className="font-black text-white text-lg leading-none">LKR {totalEarned.toLocaleString()}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
              <p className="text-xs text-teal-200 mb-0.5">Per Client</p>
              <p className="font-black text-white text-lg leading-none">LKR {price.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Clients",  value: totalClients,                                  icon: "👥", color: TEAL        },
            { label: "This Month",      value: `LKR ${totalIncome.toLocaleString()}`,          icon: "💰", color: "#10b981"   },
            { label: "Total Earned",    value: `LKR ${totalEarned.toLocaleString()}`,          icon: "🏦", color: "#8b5cf6"   },
            { label: "Rate / Client",   value: price ? `LKR ${price.toLocaleString()}` : "—", icon: "🏷️", color: "#f59e0b"  },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${color}20` }}>
                {icon}
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-800 leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { id: "overview", label: "📊 Overview"        },
              { id: "clients",  label: "👥 Active Clients"  },
              { id: "history",  label: "📋 Payment History" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-3 text-sm font-semibold transition-all"
                style={{
                  borderBottom: activeTab === tab.id ? `2px solid ${TEAL}` : "2px solid transparent",
                  color:        activeTab === tab.id ? TEAL : "#9ca3af",
                  background:   activeTab === tab.id ? TEAL_LIGHT : "white",
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" && (
              <>
                {monthlyData.length > 0 ? (
                  <div className="space-y-8">

                    {/* INCOME AREA CHART */}
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">Monthly Income (LKR)</h3>
                      <p className="text-xs text-gray-400 mb-4">Income trend over the last 6 months</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={monthlyData}>
                          <defs>
                            <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={TEAL} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={TEAL} stopOpacity={0}   />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                            formatter={v => [`LKR ${v.toLocaleString()}`, "Income"]} />
                          <Area type="monotone" dataKey="income" stroke={TEAL} strokeWidth={2.5} fill="url(#incGrad)"
                            dot={{ fill: TEAL, r: 4 }} activeDot={{ r: 6 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* CLIENT GROWTH BAR CHART */}
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">Client Growth</h3>
                      <p className="text-xs text-gray-400 mb-4">Number of subscriptions per month</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }}
                            formatter={v => [`${v} clients`, "Clients"]} />
                          <Bar dataKey="clients" fill={TEAL} radius={[6,6,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* SUMMARY CARDS */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Best Month",   value: monthlyData.length > 0 ? `LKR ${Math.max(...monthlyData.map(m => m.income)).toLocaleString()}` : "—", color: TEAL        },
                        { label: "Avg / Month",  value: monthlyData.length > 0 ? `LKR ${Math.round(monthlyData.reduce((s, m) => s + m.income, 0) / monthlyData.length).toLocaleString()}` : "—", color: "#8b5cf6" },
                        { label: "Total Months", value: `${monthlyData.length} month${monthlyData.length !== 1 ? "s" : ""}`, color: "#f59e0b" },
                      ].map(s => (
                        <div key={s.label} className="text-center p-4 rounded-xl" style={{ background: `${s.color}10` }}>
                          <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                          <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-5xl mb-4">💰</p>
                    <p className="text-gray-500 font-semibold text-lg">No income data yet</p>
                    <p className="text-gray-400 text-sm mt-2">Income chart appears when you have active clients</p>
                  </div>
                )}
              </>
            )}

            {/* ── ACTIVE CLIENTS TAB ── */}
            {activeTab === "clients" && (
              <>
                {activeSubs.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-5xl mb-4">👥</p>
                    <p className="text-gray-500 font-semibold text-lg">No active clients yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: TEAL_LIGHT }}>
                          {["Client", "Email", "Since", "Expires", "Days Left", "Monthly Fee"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide"
                              style={{ color: TEAL_DARK }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {activeSubs.map((c, i) => {
                          const days = getDaysLeft(c.endDate);
                          const isExpiring = days !== null && days <= 5;
                          return (
                            <tr key={c.id} className="hover:bg-gray-50 transition"
                              style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center"
                                    style={{ background: TEAL }}>
                                    {c.clientName?.charAt(0)}
                                  </div>
                                  <span className="font-semibold text-gray-800">{c.clientName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-gray-500">{c.clientEmail}</td>
                              <td className="px-4 py-4 text-gray-500">{c.startDate || "—"}</td>
                              <td className="px-4 py-4 text-gray-500">{c.endDate || "—"}</td>
                              <td className="px-4 py-4">
                                {days !== null ? (
                                  <span className="font-bold text-sm"
                                    style={{ color: isExpiring ? "#f59e0b" : TEAL }}>
                                    {isExpiring ? `⚠ ${days}d` : `${days}d`}
                                  </span>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-4 font-bold" style={{ color: "#10b981" }}>
                                LKR {price.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: TEAL_LIGHT }}>
                          <td colSpan={5} className="px-4 py-3 font-bold text-gray-700">
                            Total Monthly Income
                          </td>
                          <td className="px-4 py-3 font-black text-xl" style={{ color: TEAL }}>
                            LKR {totalIncome.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── PAYMENT HISTORY TAB ── */}
            {activeTab === "history" && (
              <>
                {allSubs.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-5xl mb-4">📋</p>
                    <p className="text-gray-500 font-semibold text-lg">No payment history yet</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ background: TEAL_LIGHT }}>
                            {["Client", "Start Date", "End Date", "Amount", "Status"].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide"
                                style={{ color: TEAL_DARK }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {allSubs.map((sub, i) => (
                            <tr key={sub.id} className="hover:bg-gray-50 transition"
                              style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center"
                                    style={{ background: TEAL }}>
                                    {sub.clientName?.charAt(0)}
                                  </div>
                                  <span className="font-semibold text-gray-800">{sub.clientName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-gray-500">{sub.startDate || "—"}</td>
                              <td className="px-4 py-4 text-gray-500">{sub.endDate   || "Ongoing"}</td>
                              <td className="px-4 py-4 font-bold"
                                style={{ color: (sub.status === "ACTIVE" || sub.status === "EXPIRED") ? "#10b981" : "#9ca3af" }}>
                                {(sub.status === "ACTIVE" || sub.status === "EXPIRED")
                                  ? `+LKR ${price.toLocaleString()}` : "—"}
                              </td>
                              <td className="px-4 py-4">
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                                  style={{
                                    background: sub.status === "ACTIVE"  ? "#dcfce7" : sub.status === "EXPIRED" ? "#fef3c7" : sub.status === "PENDING" ? "#fef9c3" : "#f3f4f6",
                                    color:      sub.status === "ACTIVE"  ? "#166534" : sub.status === "EXPIRED" ? "#92400e" : sub.status === "PENDING" ? "#713f12" : "#6b7280",
                                  }}>
                                  {sub.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: TEAL_LIGHT }}>
                            <td colSpan={3} className="px-4 py-3 font-bold text-gray-700">Total Earned (All Time)</td>
                            <td colSpan={2} className="px-4 py-3 font-black text-xl" style={{ color: TEAL }}>
                              LKR {totalEarned.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}