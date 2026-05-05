import { useState } from "react";
import Swal from "sweetalert2";
import api from "../../api/api";

const VIOLET       = "#8b5cf6";
const VIOLET_DARK  = "#7c3aed";
const VIOLET_LIGHT = "#f5f3ff";

export default function AdminReportsExport() {
  const [loading, setLoading] = useState({});

  const downloadCSV = (filename, rows, headers) => {
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${r[h] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportUsers = async () => {
    setLoading(l => ({ ...l, users: true }));
    try {
      const res = await api.get("/api/admin/users");
      downloadCSV("fittrack_users.csv", res.data,
        ["userId", "name", "email", "role", "approved", "createdAt"]);
      Swal.fire({ title: "Exported! ✅", text: "Users report downloaded", icon: "success", timer: 1500, showConfirmButton: false });
    } catch { Swal.fire("Error", "Failed to export users", "error"); }
    setLoading(l => ({ ...l, users: false }));
  };

  const exportTrainers = async () => {
    setLoading(l => ({ ...l, trainers: true }));
    try {
      const res = await api.get("/api/admin/trainers");
      downloadCSV("fittrack_trainers.csv", res.data,
        ["userId", "name", "email", "specialization", "certification", "experienceYears", "pricePerMonth", "isVerified", "createdAt"]);
      Swal.fire({ title: "Exported! ✅", text: "Trainers report downloaded", icon: "success", timer: 1500, showConfirmButton: false });
    } catch { Swal.fire("Error", "Failed to export trainers", "error"); }
    setLoading(l => ({ ...l, trainers: false }));
  };

  const exportPayments = async () => {
    setLoading(l => ({ ...l, payments: true }));
    try {
      const res = await api.get("/api/admin/subscriptions");
      downloadCSV("fittrack_payments.csv", res.data,
        ["id", "clientName", "clientEmail", "trainerName", "trainerPrice", "status", "startDate", "endDate", "createdAt"]);
      Swal.fire({ title: "Exported! ✅", text: "Payments report downloaded", icon: "success", timer: 1500, showConfirmButton: false });
    } catch { Swal.fire("Error", "Failed to export payments", "error"); }
    setLoading(l => ({ ...l, payments: false }));
  };

  const exportPending = async () => {
    setLoading(l => ({ ...l, pending: true }));
    try {
      const res = await api.get("/api/admin/pending-trainers");
      downloadCSV("fittrack_pending_trainers.csv", res.data,
        ["userId", "name", "email", "specialization", "certification", "experienceYears", "pricePerMonth", "createdAt"]);
      Swal.fire({ title: "Exported! ✅", text: "Pending trainers report downloaded", icon: "success", timer: 1500, showConfirmButton: false });
    } catch { Swal.fire("Error", "Failed to export", "error"); }
    setLoading(l => ({ ...l, pending: false }));
  };

  const reports = [
    { key: "users",    icon: "👥", title: "Users Report",            desc: "All registered users — name, email, role, status", color: VIOLET,    action: exportUsers    },
    { key: "trainers", icon: "💪", title: "Trainers Report",         desc: "All trainers — specialization, price, verified status", color: "#10b981", action: exportTrainers },
    { key: "payments", icon: "💳", title: "Payments Report",         desc: "All subscriptions — client, trainer, amount, dates", color: "#f59e0b", action: exportPayments },
    { key: "pending",  icon: "⏳", title: "Pending Trainers Report", desc: "Trainers awaiting verification", color: "#ef4444", action: exportPending  },
  ];

  return (
    <div className="min-h-screen pb-10" style={{ background: "#faf5ff" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(124,58,237,0.80) 100%), url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "180px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-4xl font-black tracking-tight">Reports & Export 📥</h1>
          <p className="text-purple-100 mt-1 text-sm">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <p className="text-purple-200 text-sm mt-1">Generate and download platform reports as CSV</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {reports.map(({ key, icon, title, desc, color, action }) => (
          <div key={key} className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between gap-4 border-2 border-gray-100 hover:border-purple-100 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${color}15` }}>
                {icon}
              </div>
              <div>
                <p className="font-bold text-gray-800">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </div>
            <button onClick={action} disabled={loading[key]}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex-shrink-0 flex items-center gap-2"
              style={{ background: VIOLET }}>
              {loading[key] ? (
                <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Exporting...</>
              ) : (
                <><span>⬇️</span> Export CSV</>
              )}
            </button>
          </div>
        ))}

        {/* INFO NOTE */}
        <div className="p-4 rounded-xl text-sm" style={{ background: VIOLET_LIGHT, color: VIOLET_DARK }}>
          💡 Reports are exported as <strong>.csv</strong> files — open with Excel, Google Sheets, or any spreadsheet app.
        </div>
      </div>
    </div>
  );
}