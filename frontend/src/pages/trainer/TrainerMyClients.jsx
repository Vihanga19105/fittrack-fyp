import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const TEAL       = "#14b8a6";
const TEAL_DARK  = "#0d9488";
const TEAL_LIGHT = "#f0fdfa";

export default function TrainerMyClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/api/subscriptions/clients")
      .then(res => { setClients(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getDaysLeft = (endDate) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const filtered = clients.filter(c =>
    c.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    c.clientEmail?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#f0fdf4" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 animate-spin mx-auto mb-3"
          style={{ borderColor: TEAL, borderTopColor: "transparent" }} />
        <p className="text-gray-400 animate-pulse">Loading clients...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "#f0fdf4" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(20,184,166,0.80) 100%), url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "200px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Trainer</p>
            <h1 className="text-4xl font-black tracking-tight">My Clients 👥</h1>
            <p className="text-teal-100 mt-1 text-sm">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-teal-200 text-sm mt-1">{clients.length} active client{clients.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="hidden md:block bg-white/15 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 text-center">
            <p className="text-xs text-teal-200 mb-1">Active Clients</p>
            <p className="text-4xl font-black text-white">{clients.length}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {clients.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-14 text-center">
            <p className="text-6xl mb-4">👥</p>
            <p className="text-xl font-bold text-gray-700">No active clients yet!</p>
            <p className="text-gray-400 text-sm mt-2">Accept client requests to see them here</p>
            <button onClick={() => navigate("/trainer/client-requests")}
              className="mt-4 px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
              style={{ background: TEAL }}>
              View Requests →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

            {/* SEARCH */}
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input type="text" placeholder="Search by name or email..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none"
                  onFocus={e => e.target.style.borderColor = TEAL}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: TEAL_LIGHT }}>
                    {["Client", "Email", "Status", "Start Date", "Expires", "Days Left", "Action"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide"
                        style={{ color: TEAL_DARK }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((client, i) => {
                    const days = getDaysLeft(client.endDate);
                    const isExpiring = days !== null && days <= 5;
                    const isExpired = days !== null && days < 0;
                    return (
                      <tr key={client.id}
                        className="hover:bg-gray-50 transition-colors"
                        style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full text-white font-bold text-sm flex items-center justify-center flex-shrink-0"
                              style={{ background: TEAL }}>
                              {client.clientName?.charAt(0)}
                            </div>
                            <span className="font-semibold text-gray-800 text-sm">{client.clientName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">{client.clientEmail}</td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{ background: isExpired ? "#fee2e2" : isExpiring ? "#fef3c7" : "#dcfce7",
                              color: isExpired ? "#ef4444" : isExpiring ? "#92400e" : "#166534" }}>
                            {isExpired ? "Expired" : isExpiring ? "⚠ Expiring" : "✓ Active"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">{client.startDate || "—"}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">{client.endDate || "—"}</td>
                        <td className="px-5 py-4">
                          {days !== null ? (
                            <span className="text-sm font-bold"
                              style={{ color: isExpired ? "#ef4444" : isExpiring ? "#f59e0b" : TEAL }}>
                              {isExpired ? "Expired" : `${days}d`}
                            </span>
                          ) : <span className="text-gray-300 text-sm">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <button onClick={() => navigate(`/trainer/client/${client.clientId}`)}
                            className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-all"
                            style={{ background: TEAL }}>
                            View Client →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}