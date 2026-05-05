import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import api from "../../api/api";

const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT = "#E8F7FD";

export default function AdminVerifyTrainers() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { loadPendingTrainers(); }, []);

  const loadPendingTrainers = () => {
    api.get("/api/admin/pending-trainers")
      .then((res) => {
        setRequests(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const approveTrainer = (userId, name) => {
    Swal.fire({
      title: "Approve Trainer?",
      html: `<b>${name}</b> will be verified and can
             start accepting clients!`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "✅ Approve",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.put(
            `/api/admin/approve-trainer/${userId}`
          );
          Swal.fire({
            title: "Approved! ✅",
            text: `${name} is now a verified trainer!`,
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
          loadPendingTrainers();
        } catch {
          Swal.fire("Error",
            "Failed to approve trainer", "error");
        }
      }
    });
  };

  const rejectTrainer = (userId, name) => {
    Swal.fire({
      title: "Reject Trainer Application",
      html: `
        <p style="color:#6b7280; margin-bottom:12px;
                  font-size:14px;">
          Please provide a reason for rejecting
          <b style="color:#111">${name}</b>.
          This will be sent to the trainer by email
          and shown on their dashboard.
        </p>
        <textarea id="rejectReason"
          style="width:100%; border:1px solid #d1d5db;
                 border-radius:10px; padding:12px;
                 font-size:14px; color:#111;
                 resize:none; outline:none;
                 font-family:inherit;"
          rows="4"
          placeholder="e.g. Your certification document is not clear. Please upload a valid certification photo and resubmit.">
        </textarea>
        <div style="margin-top:8px; text-align:left;">
          <p style="font-size:12px; color:#9ca3af;">
            Common reasons:
          </p>
          <div style="display:flex; flex-wrap:wrap;
                      gap:6px; margin-top:4px;">
            ${[
              "Certification not valid",
              "Profile photo unclear",
              "Incomplete profile",
              "Bio too short",
              "Invalid experience years",
            ].map(r => `
              <button type="button"
                onclick="document.getElementById('rejectReason').value='${r}'"
                style="font-size:11px; padding:4px 8px;
                       border-radius:6px; border:1px solid #d1d5db;
                       background:#f9fafb; color:#374151;
                       cursor:pointer;">
                ${r}
              </button>
            `).join("")}
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
        const reason = document
          .getElementById("rejectReason").value.trim();
        if (!reason) {
          Swal.showValidationMessage(
            "Please provide a rejection reason"
          );
          return false;
        }
        if (reason.length < 10) {
          Swal.showValidationMessage(
            "Reason must be at least 10 characters"
          );
          return false;
        }
        return reason;
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          await api.put(
            `/api/admin/reject-trainer/${userId}`,
            { reason: result.value }
          );
          Swal.fire({
            title: "Rejected & Notified",
            html: `<b>${name}</b> has been notified
                   by email with your reason.`,
            icon: "info",
            timer: 2500,
            showConfirmButton: false,
          });
          loadPendingTrainers();
        } catch {
          Swal.fire("Error",
            "Failed to reject trainer", "error");
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center
                      min-h-[400px]">
        <div className="w-10 h-10 rounded-full border-4
                        animate-spin"
          style={{ borderColor: BLUE,
                   borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10"
      style={{ background: "#f0f9ff" }}>

      {/* HERO */}
      <div className="relative text-white px-6 py-8
                      rounded-2xl mb-6 overflow-hidden"
        style={{ background: `linear-gradient(135deg,
          ${BLUE_DARK} 0%, ${BLUE} 100%)` }}>
        <div className="relative z-10">
          <p className="text-blue-100 text-sm uppercase
                        tracking-wide font-medium mb-1">
            Admin
          </p>
          <h1 className="text-3xl font-bold">
            Verify Trainers
          </h1>
          <p className="text-blue-100 mt-1 text-sm">
            {requests.length} pending application
            {requests.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="absolute right-8 top-4 w-32 h-32
                        bg-white/10 rounded-full" />
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm
                        p-14 text-center">
          <p className="text-6xl mb-4">✅</p>
          <p className="text-xl font-bold text-gray-700">
            All caught up!
          </p>
          <p className="text-gray-400 text-sm mt-2">
            No pending trainer applications right now.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((trainer) => {

            // ── profile completeness ──
            const fields = [
              trainer.bio, trainer.specialization,
              trainer.certification,
              trainer.experienceYears,
              trainer.pricePerMonth,
              trainer.profileImage, trainer.phone,
            ];
            const filled = fields.filter(Boolean).length;
            const pct = Math.round(
              (filled / fields.length) * 100
            );

            return (
              <div key={trainer.userId}
                className="bg-white rounded-2xl shadow-sm
                           border border-gray-100
                           overflow-hidden">

                {/* CARD HEADER */}
                <div className="p-6">
                  <div className="flex flex-col md:flex-row
                                  md:items-start gap-5">

                    {/* PHOTO */}
                    <div className="flex-shrink-0">
                      {trainer.profileImage ? (
                        <img
                          src={trainer.profileImage}
                          alt={trainer.name}
                          className="w-20 h-20 rounded-2xl
                                     object-cover border-2"
                          style={{ borderColor: BLUE_LIGHT }}
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl
                                        flex items-center
                                        justify-center
                                        text-white text-2xl
                                        font-bold"
                          style={{ background:
                            `linear-gradient(135deg,
                              ${BLUE_DARK}, ${BLUE})` }}>
                          {trainer.name?.charAt(0)}
                        </div>
                      )}
                      {/* no photo warning */}
                      {!trainer.profileImage && (
                        <p className="text-xs text-center
                                       text-red-400 mt-1
                                       font-medium">
                          No photo
                        </p>
                      )}
                    </div>

                    {/* INFO */}
                    <div className="flex-1">
                      <div className="flex items-center
                                      gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-bold
                                        text-gray-800">
                          {trainer.name}
                        </h3>
                        <span className="px-2 py-0.5
                                         rounded-full text-xs
                                         bg-yellow-100
                                         text-yellow-700
                                         font-semibold">
                          ⏳ Pending Review
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {trainer.email}
                      </p>

                      {/* DETAILS GRID */}
                      <div className="grid grid-cols-2
                                      sm:grid-cols-4 gap-3
                                      mt-4">
                        {[
                          { label: "Specialization",
                            value: trainer.specialization },
                          { label: "Certification",
                            value: trainer.certification },
                          { label: "Experience",
                            value: trainer.experienceYears
                              ? `${trainer.experienceYears} yrs`
                              : null },
                          { label: "Price / Month",
                            value: trainer.pricePerMonth
                              ? `LKR ${Number(
                                  trainer.pricePerMonth
                                ).toLocaleString()}`
                              : null },
                        ].map((item) => (
                          <div key={item.label}
                            className="p-3 rounded-xl"
                            style={{ background: "#f9fafb" }}>
                            <p className="text-xs text-gray-400
                                           uppercase
                                           tracking-wide">
                              {item.label}
                            </p>
                            <p className="text-sm font-semibold
                                           text-gray-700 mt-0.5">
                              {item.value || (
                                <span className="text-red-400
                                                 font-normal">
                                  Not set
                                </span>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* BIO */}
                      {trainer.bio ? (
                        <div className="mt-3 p-3 rounded-xl
                                        text-sm text-gray-600
                                        italic"
                          style={{ background: BLUE_LIGHT }}>
                          "{trainer.bio}"
                        </div>
                      ) : (
                        <div className="mt-3 p-3 rounded-xl
                                        text-sm text-red-400"
                          style={{ background: "#fef2f2" }}>
                          ⚠ No bio provided
                        </div>
                      )}

                      {/* COMPLETENESS BAR */}
                      <div className="mt-4">
                        <div className="flex justify-between
                                        items-center mb-1">
                          <p className="text-xs text-gray-400">
                            Profile completeness
                          </p>
                          <p className="text-xs font-bold"
                            style={{
                              color: pct >= 80
                                ? "#22c55e" : "#f59e0b"
                            }}>
                            {pct}%
                          </p>
                        </div>
                        <div className="h-2 rounded-full
                                        bg-gray-100
                                        overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 80
                                ? "#22c55e" : "#f59e0b"
                            }} />
                        </div>
                      </div>

                      {/* EXPAND BUTTON */}
                      <button
                        onClick={() => setExpandedId(
                          expandedId === trainer.userId
                            ? null : trainer.userId
                        )}
                        className="mt-3 text-sm font-medium"
                        style={{ color: BLUE }}>
                        {expandedId === trainer.userId
                          ? "▲ Hide details"
                          : "▼ View more details"}
                      </button>
                    </div>
                  </div>

                  {/* EXPANDED DETAILS */}
                  {expandedId === trainer.userId && (
                    <div className="mt-4 pt-4 border-t
                                    border-gray-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400
                                         uppercase tracking-wide
                                         mb-1">
                            Phone
                          </p>
                          <p className="text-sm font-medium
                                         text-gray-700">
                            {trainer.phone || (
                              <span className="text-gray-400">
                                Not provided
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400
                                         uppercase tracking-wide
                                         mb-1">
                            Applied on
                          </p>
                          <p className="text-sm font-medium
                                         text-gray-700">
                            {trainer.createdAt
                              ? new Date(trainer.createdAt)
                                  .toLocaleDateString()
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="px-6 py-4 border-t
                                border-gray-100 flex gap-3
                                justify-end"
                  style={{ background: "#fafafa" }}>
                  <button
                    onClick={() => rejectTrainer(
                      trainer.userId, trainer.name
                    )}
                    className="px-6 py-2.5 rounded-xl
                               text-white font-semibold
                               text-sm hover:opacity-90
                               active:scale-95 transition-all"
                    style={{ background: "#ef4444" }}>
                    ❌ Reject
                  </button>
                  <button
                    onClick={() => approveTrainer(
                      trainer.userId, trainer.name
                    )}
                    className="px-6 py-2.5 rounded-xl
                               text-white font-semibold
                               text-sm hover:opacity-90
                               active:scale-95 transition-all"
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
  );
}