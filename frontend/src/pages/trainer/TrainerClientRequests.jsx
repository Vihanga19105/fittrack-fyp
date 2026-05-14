import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import api from "../../api/api";

const TEAL       = "#14b8a6";
const TEAL_DARK  = "#0d9488";
const TEAL_LIGHT = "#f0fdfa";

export default function TrainerClientRequests() {
  const [requests, setRequests] = useState([]);
  const [clientDetails, setClientDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // ✅ Moved above useEffect
  const loadRequests = async () => {
    try {
      const res = await api.get("/api/subscriptions/requests");
      setRequests(res.data);
      const details = {};
      await Promise.all(
        res.data.map(async req => {
          try {
            const profileRes = await api.get(`/api/profile/client/${req.clientId}`);
            details[req.clientId] = profileRes.data;
          } catch { details[req.clientId] = null; }
        })
      );
      setClientDetails(details);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, []);

  const handleAccept = async (id, clientName) => {
    Swal.fire({
      title: "Accept Request?",
      html: `<b>${clientName}</b> will become your client.<br>They will need to complete payment to activate.`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: TEAL, cancelButtonColor: "#6b7280",
      confirmButtonText: "✅ Accept",
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          await api.put(`/api/subscriptions/${id}/accept`);
          Swal.fire({ title: "Accepted!", text: `${clientName} has been notified!`, icon: "success", timer: 1500, showConfirmButton: false });
          loadRequests();
        } catch { Swal.fire("Error", "Failed to accept", "error"); }
      }
    });
  };

  const handleReject = async (id, clientName) => {
    Swal.fire({
      title: "Reject Request?",
      html: `
        <p style="color:#6b7280;margin-bottom:12px;font-size:14px;">
          Please provide a reason for rejecting <b style="color:#111">${clientName}</b>.
        </p>
        <textarea id="rejectReason"
          style="width:100%;border:1px solid #d1d5db;border-radius:10px;padding:12px;font-size:14px;color:#111;resize:none;outline:none;font-family:inherit;"
          rows="3" placeholder="e.g. I am fully booked at the moment."></textarea>
        <div style="margin-top:8px;text-align:left;">
          <p style="font-size:12px;color:#9ca3af;">Quick reasons:</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">
            ${["Fully booked","Goal mismatch","Incomplete profile","Outside my specialty"].map(r =>
              `<button type="button" onclick="document.getElementById('rejectReason').value='${r}'"
                style="font-size:11px;padding:4px 8px;border-radius:6px;border:1px solid #d1d5db;background:#f9fafb;color:#374151;cursor:pointer;">${r}</button>`
            ).join("")}
          </div>
        </div>
      `,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280",
      confirmButtonText: "❌ Reject",
      preConfirm: () => {
        const reason = document.getElementById("rejectReason").value.trim();
        if (!reason) { Swal.showValidationMessage("Please provide a rejection reason"); return false; }
        return reason;
      },
    }).then(async result => {
      if (result.isConfirmed && result.value) {
        try {
          await api.put(`/api/subscriptions/${id}/reject`, { reason: result.value });
          Swal.fire({ title: "Rejected", text: `${clientName} has been notified.`, icon: "info", timer: 1500, showConfirmButton: false });
          loadRequests();
        } catch { Swal.fire("Error", "Failed to reject", "error"); }
      }
    });
  };

  const getBmi = (height, weight) => {
    if (!height || !weight) return null;
    const h = height / 100;
    return (weight / (h * h)).toFixed(1);
  };

  const getBmiInfo = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: "Underweight", color: "#3b82f6" };
    if (bmi < 25)   return { label: "Normal",       color: "#22c55e" };
    if (bmi < 30)   return { label: "Overweight",   color: "#f97316" };
    return { label: "Obese", color: "#ef4444" };
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#f0fdf4" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 animate-spin mx-auto mb-3" style={{ borderColor: TEAL, borderTopColor: "transparent" }} />
        <p className="text-gray-400 animate-pulse">Loading requests...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "#f0fdf4" }}>
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(20,184,166,0.80) 100%), url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "200px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Trainer</p>
            <h1 className="text-4xl font-black tracking-tight">Client Requests 📩</h1>
            <p className="text-teal-100 mt-1 text-sm">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
            <p className="text-teal-200 text-sm mt-1">{requests.length} pending request{requests.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="hidden md:block bg-white/15 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 text-center">
            <p className="text-xs text-teal-200 mb-1">Pending</p>
            <p className="text-4xl font-black text-white">{requests.length}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-14 text-center">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-xl font-bold text-gray-700">No pending requests!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map(req => {
              const client = clientDetails[req.clientId];
              const bmi = getBmi(client?.heightCm, client?.weightKg);
              const bmiInfo = getBmiInfo(Number(bmi));
              const isExpanded = expandedId === req.id;

              return (
                <div key={req.id} className="bg-white rounded-2xl shadow-sm border-2 overflow-hidden" style={{ borderColor: "#f1f5f9" }}>
                  <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${TEAL_DARK}, ${TEAL})` }} />
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-5">
                      {/* ✅ Client photo */}
                      <div className="flex-shrink-0">
                        {client?.profileImage ? (
                          <img src={client.profileImage} alt={req.clientName}
                            className="w-20 h-20 rounded-2xl object-cover border-2" style={{ borderColor: TEAL_LIGHT }} />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                            style={{ background: `linear-gradient(135deg, ${TEAL_DARK}, ${TEAL})` }}>
                            {req.clientName?.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-lg font-bold text-gray-800">{req.clientName}</h3>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-semibold">⏳ Pending</span>
                        </div>
                        <p className="text-sm text-gray-500">{req.clientEmail}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Requested on: {req.startDate}</p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                          {[
                            { label: "Goal",   value: client?.goalType },
                            { label: "Gender", value: client?.gender   },
                            { label: "Age",    value: client?.age ? `${client.age} yrs` : null },
                            { label: "BMI",    value: bmi || null, color: bmiInfo?.color },
                          ].map(item => (
                            <div key={item.label} className="p-3 rounded-xl" style={{ background: TEAL_LIGHT }}>
                              <p className="text-xs text-gray-400 uppercase tracking-wide">{item.label}</p>
                              <p className="text-sm font-semibold mt-0.5" style={{ color: item.color || "#374151" }}>
                                {item.value || <span className="text-gray-300 font-normal">Not set</span>}
                              </p>
                            </div>
                          ))}
                        </div>

                        <button onClick={() => setExpandedId(isExpanded ? null : req.id)}
                          className="mt-3 text-sm font-medium hover:underline" style={{ color: TEAL }}>
                          {isExpanded ? "▲ Hide details" : "▼ View full details"}
                        </button>
                      </div>
                    </div>

                    {isExpanded && client && (
                      <div className="mt-5 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {[
                            { label: "Height",       value: client.heightCm  ? `${client.heightCm} cm`  : "Not set" },
                            { label: "Weight",       value: client.weightKg  ? `${client.weightKg} kg`  : "Not set" },
                            { label: "Phone",        value: client.phone     || "Not provided"                       },
                            { label: "Email",        value: client.email                                              },
                            { label: "Fitness Goal", value: client.goalType  || "Not set"                            },
                            { label: "BMI Status",   value: bmi ? `${bmi} — ${bmiInfo?.label}` : "Not available", color: bmiInfo?.color },
                          ].map(item => (
                            <div key={item.label}>
                              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
                              <p className="text-sm font-semibold truncate" style={{ color: item.color || "#374151" }}>{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end" style={{ background: "#fafafa" }}>
                    <button onClick={() => handleReject(req.id, req.clientName)}
                      className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
                      style={{ background: "#ef4444" }}>❌ Reject</button>
                    <button onClick={() => handleAccept(req.id, req.clientName)}
                      className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
                      style={{ background: TEAL }}>✅ Accept</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}