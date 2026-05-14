import { useState, useEffect } from "react";
import api from "../../api/api";

const VIOLET       = "#8b5cf6";
const VIOLET_DARK  = "#7c3aed";
const VIOLET_LIGHT = "#f5f3ff";

export default function AdminPaymentMonitoring() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("ALL");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await api.get("/api/admin/subscriptions");
      setSubscriptions(res.data);
    } catch {}
    setLoading(false);
  };

  const statusCounts = {
    ALL:      subscriptions.length,
    ACTIVE:   subscriptions.filter(s => s.status === "ACTIVE").length,
    PENDING:  subscriptions.filter(s => s.status === "PENDING").length,
    EXPIRED:  subscriptions.filter(s => s.status === "EXPIRED").length,
    REJECTED: subscriptions.filter(s => s.status === "REJECTED").length,
  };

  const totalRevenue = subscriptions
    .filter(s => s.status === "ACTIVE" || s.status === "EXPIRED")
    .reduce((sum, s) => sum + (Number(s.trainerPrice) || 0), 0);

  const activeRevenue = subscriptions
    .filter(s => s.status === "ACTIVE")
    .reduce((sum, s) => sum + (Number(s.trainerPrice) || 0), 0);

  const filtered = subscriptions.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = s.clientName?.toLowerCase().includes(q) ||
      s.trainerName?.toLowerCase().includes(q) ||
      s.clientEmail?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusStyle = (status) => {
    switch (status) {
      case "ACTIVE":   return { background: "#dcfce7", color: "#166534" };
      case "EXPIRED":  return { background: "#fef3c7", color: "#92400e" };
      case "PENDING":  return { background: "#fef9c3", color: "#713f12" };
      case "REJECTED": return { background: "#fee2e2", color: "#991b1b" };
      default:         return { background: "#f3f4f6", color: "#6b7280" };
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#faf5ff" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 animate-spin mx-auto mb-3"
          style={{ borderColor: VIOLET, borderTopColor: "transparent" }} />
        <p className="text-gray-400 animate-pulse">Loading payments...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "#faf5ff" }}>

      {/* HERO */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(124,58,237,0.80) 100%), url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "200px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
            <h1 className="text-4xl font-black tracking-tight">Payment Monitoring 💳</h1>
            <p className="text-purple-100 mt-1 text-sm">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-purple-200 text-sm mt-1">{subscriptions.length} total subscriptions</p>
          </div>
          <div className="hidden md:flex gap-2 flex-wrap">
            {[
              { label: "Total Revenue",  value: `LKR ${totalRevenue.toLocaleString()}`  },
              { label: "Active Revenue", value: `LKR ${activeRevenue.toLocaleString()}` },
              { label: "Active Subs",    value: statusCounts.ACTIVE                      },
              { label: "Pending",        value: statusCounts.PENDING                     },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                <p className="text-xs text-purple-200 mb-0.5">{label}</p>
                <p className="font-black text-white text-sm leading-none">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* SEARCH + FILTER */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input type="text" placeholder="Search by client or trainer name..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 text-sm focus:outline-none transition-all"
                onFocus={e => e.target.style.borderColor = VIOLET}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["ALL", "ACTIVE", "PENDING", "EXPIRED", "REJECTED"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: statusFilter === s ? VIOLET : VIOLET_LIGHT,
                    color:      statusFilter === s ? "white" : VIOLET_DARK,
                  }}>
                  {s} ({statusCounts[s]})
                </button>
              ))}
            </div>
          </div>

          {/* TABLE */}
          {filtered.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-4xl mb-3">💳</p>
              <p className="text-gray-500 font-semibold">No subscriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: VIOLET_LIGHT }}>
                    {["#", "Client", "Trainer", "Amount", "Start Date", "End Date", "Status"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide"
                        style={{ color: VIOLET_DARK }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((s, i) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition"
                      style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td className="px-5 py-4 text-gray-400 text-xs">{i + 1}</td>

                      {/* ✅ Client photo in payments table */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {s.clientProfileImage ? (
                            <img src={s.clientProfileImage} alt={s.clientName}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2"
                              style={{ borderColor: VIOLET }} />
                          ) : (
                            <div className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center flex-shrink-0"
                              style={{ background: VIOLET }}>
                              {s.clientName?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{s.clientName}</p>
                            <p className="text-xs text-gray-400">{s.clientEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* ✅ Trainer photo in payments table */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {s.trainerProfileImage ? (
                            <img src={s.trainerProfileImage} alt={s.trainerName}
                              className="w-7 h-7 rounded-full object-cover flex-shrink-0 border"
                              style={{ borderColor: "#10b981" }} />
                          ) : (
                            <div className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center flex-shrink-0"
                              style={{ background: "#10b981" }}>
                              {s.trainerName?.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-gray-700 text-sm">{s.trainerName || "—"}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-bold text-sm"
                        style={{ color: (s.status === "ACTIVE" || s.status === "EXPIRED") ? "#10b981" : "#9ca3af" }}>
                        {s.trainerPrice ? `LKR ${Number(s.trainerPrice).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{s.startDate || "—"}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{s.endDate   || "—"}</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={statusStyle(s.status)}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: VIOLET_LIGHT }}>
                    <td colSpan={3} className="px-5 py-3 font-bold text-gray-700">Total Revenue (Active + Expired)</td>
                    <td colSpan={4} className="px-5 py-3 font-black text-lg" style={{ color: VIOLET }}>
                      LKR {totalRevenue.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}