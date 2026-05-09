import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import api from "../../api/api";

const VIOLET       = "#8b5cf6";
const VIOLET_DARK  = "#7c3aed";
const VIOLET_LIGHT = "#f5f3ff";
const NAVY         = "#0A2342";

export default function AdminVerifyTrainers() {
  const [requests,    setRequests]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [expandedId,  setExpandedId]  = useState(null);

  useEffect(() => { loadPendingTrainers(); }, []);

  const loadPendingTrainers = () => {
    api.get("/api/admin/pending-trainers")
      .then((res) => { setRequests(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const approveTrainer = (userId, name) => {
    Swal.fire({
      title: "Approve Trainer?",
      html: `<b>${name}</b> will be verified and can start accepting clients!`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "✅ Approve",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.put(`/api/admin/approve-trainer/${userId}`);
          Swal.fire({ title: "Approved! ✅", text: `${name} is now a verified trainer!`, icon: "success", timer: 2000, showConfirmButton: false });
          loadPendingTrainers();
        } catch {
          Swal.fire("Error", "Failed to approve trainer", "error");
        }
      }
    });
  };

  const rejectTrainer = (userId, name) => {
    Swal.fire({
      title: "Reject Trainer Application",
      html: `
        <p style="color:#6b7280; margin-bottom:12px; font-size:14px;">
          Please provide a reason for rejecting <b style="color:#111">${name}</b>.
          This will be sent to the trainer by email and shown on their dashboard.
        </p>
        <textarea id="rejectReason"
          style="width:100%; border:1px solid #d1d5db; border-radius:10px; padding:12px;
                 font-size:14px; color:#111; resize:none; outline:none; font-family:inherit;"
          rows="4"
          placeholder="e.g. Your certification document is not clear. Please upload a valid certification photo and resubmit.">
        </textarea>
        <div style="margin-top:8px; text-align:left;">
          <p style="font-size:12px; color:#9ca3af;">Common reasons:</p>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">
            ${["Certification not valid","Profile photo unclear","Incomplete profile","Bio too short","Invalid experience years"]
              .map(r => `<button type="button"
                onclick="document.getElementById('rejectReason').value='${r}'"
                style="font-size:11px; padding:4px 8px; border-radius:6px; border:1px solid #d1d5db;
                       background:#f9fafb; color:#374151; cursor:pointer;">${r}</button>`).join("")}
          </div>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "❌ Reject & Notify",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const reason = document.getElementById("rejectReason").value.trim();
        if (!reason) { Swal.showValidationMessage("Please provide a rejection reason"); return false; }
        if (reason.length < 10) { Swal.showValidationMessage("Reason must be at least 10 characters"); return false; }
        return reason;
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          await api.put(`/api/admin/reject-trainer/${userId}`, { reason: result.value });
          Swal.fire({ title: "Rejected & Notified", html: `<b>${name}</b> has been notified by email with your reason.`, icon: "info", timer: 2500, showConfirmButton: false });
          loadPendingTrainers();
        } catch {
          Swal.fire("Error", "Failed to reject trainer", "error");
        }
      }
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-5xl animate-bounce mb-4">⚙️</div>
        <p className="text-gray-400 animate-pulse">Loading applications...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "#faf5ff" }}>

      {/* HERO */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(124,58,237,0.80) 100%), url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1400&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "180px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">Admin Portal</p>
          <h1 className="text-4xl font-black tracking-tight">Verify Trainers 🏋️</h1>
          <p className="text-purple-100 mt-1 text-sm">
            {requests.length} pending application{requests.length !== 1 ? "s" : ""} waiting for review
          </p>

          {/* STATS ROW */}
          <div className="flex gap-4 mt-5 flex-wrap">
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/20">
              <p className="text-xs text-purple-200 mb-0.5">Pending</p>
              <p className="font-bold text-white text-lg">{requests.length}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/20">
              <p className="text-xs text-purple-200 mb-0.5">Status</p>
              <p className="font-bold text-white text-lg">{requests.length === 0 ? "✅ All Clear" : "⏳ Review Needed"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-14 text-center">
            <p className="text-6xl mb-4">✅</p>
            <p className="text-xl font-bold text-gray-700">All caught up!</p>
            <p className="text-gray-400 text-sm mt-2">No pending trainer applications right now.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map((trainer) => {
              const fields = [
                trainer.bio, trainer.specialization,
                trainer.certification, trainer.experienceYears,
                trainer.pricePerMonth, trainer.profileImage, trainer.phone,
              ];
              const filled = fields.filter(Boolean).length;
              const pct = Math.round((filled / fields.length) * 100);

              return (
                <div key={trainer.userId}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* TOP COLOR BAR */}
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${NAVY}, ${VIOLET})` }} />

                  {/* CARD HEADER */}
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-5">

                      {/* PHOTO */}
                      <div className="flex-shrink-0">
                        {trainer.profileImage ? (
                          <img src={trainer.profileImage} alt={trainer.name}
                            className="w-20 h-20 rounded-2xl object-cover border-2"
                            style={{ borderColor: VIOLET_LIGHT }} />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                            style={{ background: `linear-gradient(135deg, ${NAVY}, ${VIOLET})` }}>
                            {trainer.name?.charAt(0)}
                          </div>
                        )}
                        {!trainer.profileImage && (
                          <p className="text-xs text-center text-red-400 mt-1 font-medium">No photo</p>
                        )}
                      </div>

                      {/* INFO */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-lg font-bold text-gray-800">{trainer.name}</h3>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-semibold">
                            ⏳ Pending Review
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{trainer.email}</p>

                        {/* DETAILS GRID */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                          {[
                            { label: "Specialization", value: trainer.specialization },
                            { label: "Certification",  value: trainer.certification  },
                            { label: "Experience",     value: trainer.experienceYears ? `${trainer.experienceYears} yrs` : null },
                            { label: "Price / Month",  value: trainer.pricePerMonth  ? `LKR ${Number(trainer.pricePerMonth).toLocaleString()}` : null },
                          ].map((item) => (
                            <div key={item.label} className="p-3 rounded-xl" style={{ background: "#f9fafb" }}>
                              <p className="text-xs text-gray-400 uppercase tracking-wide">{item.label}</p>
                              <p className="text-sm font-semibold text-gray-700 mt-0.5">
                                {item.value || <span className="text-red-400 font-normal">Not set</span>}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* BIO */}
                        {trainer.bio ? (
                          <div className="mt-3 p-3 rounded-xl text-sm text-gray-600 italic"
                            style={{ background: VIOLET_LIGHT }}>
                            "{trainer.bio}"
                          </div>
                        ) : (
                          <div className="mt-3 p-3 rounded-xl text-sm text-red-400"
                            style={{ background: "#fef2f2" }}>
                            ⚠ No bio provided
                          </div>
                        )}

                        {/* COMPLETENESS BAR */}
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-xs text-gray-400">Profile completeness</p>
                            <p className="text-xs font-bold" style={{ color: pct >= 80 ? "#22c55e" : "#f59e0b" }}>
                              {pct}%
                            </p>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: pct >= 80 ? "#22c55e" : "#f59e0b" }} />
                          </div>
                        </div>

                        {/* EXPAND BUTTON */}
                        <button
                          onClick={() => setExpandedId(expandedId === trainer.userId ? null : trainer.userId)}
                          className="mt-3 text-sm font-medium hover:underline"
                          style={{ color: VIOLET }}>
                          {expandedId === trainer.userId ? "▲ Hide details" : "▼ View more details"}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED DETAILS */}
                    {expandedId === trainer.userId && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Phone</p>
                            <p className="text-sm font-medium text-gray-700">
                              {trainer.phone || <span className="text-gray-400">Not provided</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Applied on</p>
                            <p className="text-sm font-medium text-gray-700">
                              {trainer.createdAt ? new Date(trainer.createdAt).toLocaleDateString() : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end"
                    style={{ background: "#fafafa" }}>
                    <button
                      onClick={() => rejectTrainer(trainer.userId, trainer.name)}
                      className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
                      style={{ background: "#ef4444" }}>
                      ❌ Reject
                    </button>
                    <button
                      onClick={() => approveTrainer(trainer.userId, trainer.name)}
                      className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
                      style={{ background: "#10b981" }}>
                      ✅ Approve
                    </button>
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