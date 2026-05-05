import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Search } from "lucide-react";
import api from "../../api/api";

const VIOLET       = "#8b5cf6";
const VIOLET_DARK  = "#7c3aed";
const VIOLET_LIGHT = "#f5f3ff";

export default function AdminManageTrainers() {
  const [trainers,        setTrainers]        = useState([]);
  const [pendingTrainers, setPendingTrainers]  = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState("");
  const [activeTab,       setActiveTab]       = useState("ALL");
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [expandedId,      setExpandedId]      = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [trainersRes, pendingRes] = await Promise.all([
        api.get("/api/admin/trainers").catch(async () => {
          const res = await api.get("/api/admin/users");
          return { data: res.data.filter(u => u.role === "TRAINER") };
        }),
        api.get("/api/admin/pending-trainers"),
      ]);
      setTrainers(trainersRes.data);
      setPendingTrainers(pendingRes.data);
    } catch {}
    setLoading(false);
  };

  const approveTrainer = (userId, name) => {
    Swal.fire({
      title: "Approve Trainer?",
      html: `<b>${name}</b> will be verified and can start accepting clients!`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#10b981", cancelButtonColor: "#6b7280",
      confirmButtonText: "✅ Approve",
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          await api.put(`/api/admin/approve-trainer/${userId}`);
          Swal.fire({ title: "Approved! ✅", text: `${name} is now a verified trainer!`, icon: "success", timer: 2000, showConfirmButton: false });
          setSelectedTrainer(null);
          loadData();
        } catch { Swal.fire("Error", "Failed to approve trainer", "error"); }
      }
    });
  };

  const rejectTrainer = (userId, name) => {
    Swal.fire({
      title: "Reject Trainer Application",
      html: `
        <p style="color:#6b7280;margin-bottom:12px;font-size:14px;">
          Please provide a reason for rejecting <b style="color:#111">${name}</b>.
          This will be shown on their dashboard.
        </p>
        <textarea id="rejectReason"
          style="width:100%;border:1px solid #d1d5db;border-radius:10px;padding:12px;font-size:14px;color:#111;resize:none;outline:none;font-family:inherit;"
          rows="4" placeholder="e.g. Your certification document is not clear. Please upload a valid certification photo and resubmit."></textarea>
        <div style="margin-top:8px;text-align:left;">
          <p style="font-size:12px;color:#9ca3af;">Common reasons:</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">
            ${["Certification not valid","Profile photo unclear","Incomplete profile","Bio too short","Invalid experience years"]
              .map(r => `<button type="button" onclick="document.getElementById('rejectReason').value='${r}'"
                style="font-size:11px;padding:4px 8px;border-radius:6px;border:1px solid #d1d5db;background:#f9fafb;color:#374151;cursor:pointer;">${r}</button>`).join("")}
          </div>
        </div>
      `,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280",
      confirmButtonText: "❌ Reject & Notify",
      preConfirm: () => {
        const reason = document.getElementById("rejectReason").value.trim();
        if (!reason) { Swal.showValidationMessage("Please provide a rejection reason"); return false; }
        if (reason.length < 10) { Swal.showValidationMessage("Reason must be at least 10 characters"); return false; }
        return reason;
      },
    }).then(async result => {
      if (result.isConfirmed && result.value) {
        try {
          await api.put(`/api/admin/reject-trainer/${userId}`, { reason: result.value });
          Swal.fire({ title: "Rejected & Notified", html: `<b>${name}</b> has been notified with your reason.`, icon: "info", timer: 2500, showConfirmButton: false });
          setSelectedTrainer(null);
          loadData();
        } catch { Swal.fire("Error", "Failed to reject trainer", "error"); }
      }
    });
  };

  const revokeTrainer = (userId, name) => {
    Swal.fire({
      title: "Revoke Trainer?",
      html: `<b>${name}</b> will lose verified status!`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Revoke",
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          await api.put(`/api/admin/reject-trainer/${userId}`);
          Swal.fire({ title: "Revoked!", icon: "success", timer: 1500, showConfirmButton: false });
          setSelectedTrainer(null);
          loadData();
        } catch { Swal.fire("Error", "Failed to revoke trainer", "error"); }
      }
    });
  };

  const counts = {
    ALL:      trainers.length,
    VERIFIED: trainers.filter(t => t.approved || t.isVerified).length,
    PENDING:  pendingTrainers.length,
  };

  const filteredTrainers = trainers.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q) || t.specialization?.toLowerCase().includes(q);
    const matchTab =
      activeTab === "ALL" ||
      (activeTab === "VERIFIED" && (t.approved || t.isVerified)) ||
      (activeTab === "PENDING"  && !t.approved && !t.isVerified);
    return matchSearch && matchTab;
  });

  const filteredPending = pendingTrainers.filter(t => {
    const q = search.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q);
  });

  const getProfilePct = (t) => {
    const fields = [t.bio, t.specialization, t.certification, t.experienceYears, t.pricePerMonth, t.profileImage, t.phone];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#faf5ff" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 animate-spin mx-auto mb-3"
          style={{ borderColor: VIOLET, borderTopColor: "transparent" }} />
        <p className="text-gray-400 animate-pulse">Loading trainers...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "#faf5ff" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(124,58,237,0.80) 100%), url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "200px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
            <h1 className="text-4xl font-black tracking-tight">Manage Trainers 💪</h1>
            <p className="text-purple-100 mt-1 text-sm">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-purple-200 text-sm mt-1">{trainers.length} trainers on the platform</p>
          </div>
          <div className="hidden md:flex gap-2">
            {[
              { label: "Total",    value: counts.ALL      },
              { label: "Verified", value: counts.VERIFIED },
              { label: "Pending",  value: counts.PENDING  },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                <p className="text-xs text-purple-200 mb-0.5">{label}</p>
                <p className="font-black text-white text-xl leading-none">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* TABS */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { id: "ALL",      label: "All Trainers"       },
              { id: "VERIFIED", label: "✅ Verified"        },
              { id: "PENDING",  label: "⏳ Pending Approval" },
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedTrainer(null); setSearch(""); }}
                className="flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                style={{
                  borderBottom: activeTab === tab.id ? `2px solid ${VIOLET}` : "2px solid transparent",
                  color:        activeTab === tab.id ? VIOLET : "#9ca3af",
                  background:   activeTab === tab.id ? VIOLET_LIGHT : "white",
                }}>
                {tab.label}
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: activeTab === tab.id ? VIOLET : "#f3f4f6",
                    color:      activeTab === tab.id ? "white" : "#6b7280",
                  }}>
                  {tab.id === "PENDING" ? counts.PENDING : tab.id === "VERIFIED" ? counts.VERIFIED : counts.ALL}
                </span>
              </button>
            ))}
          </div>

          {/* SEARCH */}
          <div className="p-4 border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
              <input type="text" placeholder={activeTab === "PENDING" ? "Search pending trainers..." : "Search by name, email, specialization..."}
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 text-sm focus:outline-none transition-all"
                onFocus={e => e.target.style.borderColor = VIOLET}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>
          </div>

          {/* ── ALL / VERIFIED TAB — list + detail panel ── */}
          {activeTab !== "PENDING" && (
            <div className="flex">
              {/* LIST */}
              <div className="flex-1 divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {filteredTrainers.length === 0 ? (
                  <div className="text-center py-14">
                    <p className="text-3xl mb-2">🔍</p>
                    <p className="text-sm text-gray-400">No trainers found</p>
                  </div>
                ) : filteredTrainers.map(trainer => {
                  const isVerified = trainer.approved || trainer.isVerified;
                  const isSelected = selectedTrainer?.userId === trainer.userId;
                  return (
                    <div key={trainer.userId} onClick={() => setSelectedTrainer(isSelected ? null : trainer)}
                      className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-all"
                      style={{ background: isSelected ? VIOLET_LIGHT : "transparent" }}>
                      <div className="w-10 h-10 rounded-full text-white font-bold text-sm flex items-center justify-center flex-shrink-0"
                        style={{ background: isVerified ? VIOLET : "#e5e7eb", color: isVerified ? "white" : "#9ca3af" }}>
                        {trainer.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800 text-sm">{trainer.name}</p>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{
                              background: isVerified ? "#dcfce7" : "#fef3c7",
                              color:      isVerified ? "#166534" : "#92400e",
                            }}>
                            {isVerified ? "✓ Verified" : "⏳ Pending"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{trainer.email}</p>
                        {trainer.specialization && (
                          <p className="text-xs mt-0.5" style={{ color: VIOLET }}>🎯 {trainer.specialization}</p>
                        )}
                      </div>
                      {trainer.pricePerMonth && (
                        <p className="text-sm font-bold flex-shrink-0" style={{ color: "#10b981" }}>
                          LKR {Number(trainer.pricePerMonth).toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DETAIL PANEL */}
              <div className="w-72 border-l border-gray-100 flex-shrink-0">
                {selectedTrainer ? (
                  <div className="p-5">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 rounded-2xl text-white font-bold text-2xl flex items-center justify-center mx-auto mb-2"
                        style={{ background: `linear-gradient(135deg, ${VIOLET_DARK}, ${VIOLET})` }}>
                        {selectedTrainer.name?.charAt(0)}
                      </div>
                      <h3 className="font-bold text-gray-800">{selectedTrainer.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{selectedTrainer.email}</p>
                      <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: (selectedTrainer.approved || selectedTrainer.isVerified) ? "#dcfce7" : "#fef3c7",
                          color:      (selectedTrainer.approved || selectedTrainer.isVerified) ? "#166534" : "#92400e",
                        }}>
                        {(selectedTrainer.approved || selectedTrainer.isVerified) ? "✓ Verified" : "⏳ Pending"}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {[
                        { label: "Specialization", value: selectedTrainer.specialization, icon: "🎯" },
                        { label: "Certification",  value: selectedTrainer.certification,  icon: "🏅" },
                        { label: "Experience",     value: selectedTrainer.experienceYears ? `${selectedTrainer.experienceYears} yrs` : null, icon: "📅" },
                        { label: "Price",          value: selectedTrainer.pricePerMonth   ? `LKR ${Number(selectedTrainer.pricePerMonth).toLocaleString()}` : null, icon: "💰" },
                      ].map(({ label, value, icon }) => (
                        <div key={label} className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: "#f9fafb" }}>
                          <span className="flex-shrink-0">{icon}</span>
                          <div>
                            <p className="text-xs text-gray-400">{label}</p>
                            <p className="text-xs font-semibold text-gray-700">{value || <span className="text-gray-300">Not set</span>}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {(selectedTrainer.approved || selectedTrainer.isVerified) ? (
                        <button onClick={() => revokeTrainer(selectedTrainer.userId, selectedTrainer.name)}
                          className="w-full py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all"
                          style={{ background: "#ef4444" }}>
                          ❌ Revoke Verification
                        </button>
                      ) : (
                        <button onClick={() => approveTrainer(selectedTrainer.userId, selectedTrainer.name)}
                          className="w-full py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all"
                          style={{ background: "#10b981" }}>
                          ✅ Approve Trainer
                        </button>
                      )}
                      <button onClick={() => setSelectedTrainer(null)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full py-20 px-5 text-center">
                    <div>
                      <p className="text-4xl mb-3">👆</p>
                      <p className="font-semibold text-gray-500 text-sm">Click a trainer to view details</p>
                      <p className="text-xs text-gray-400 mt-2">Approve or revoke verification here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PENDING TAB — full verification cards ── */}
          {activeTab === "PENDING" && (
            <div className="p-5">
              {filteredPending.length === 0 ? (
                <div className="text-center py-14">
                  <p className="text-5xl mb-4">✅</p>
                  <p className="text-xl font-bold text-gray-700">All caught up!</p>
                  <p className="text-gray-400 text-sm mt-2">No pending trainer applications right now.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredPending.map(trainer => {
                    const pct = getProfilePct(trainer);
                    return (
                      <div key={trainer.userId} className="border-2 border-gray-100 rounded-2xl overflow-hidden">
                        {/* top bar */}
                        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${VIOLET_DARK}, ${VIOLET})` }} />

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
                                  style={{ background: `linear-gradient(135deg, ${VIOLET_DARK}, ${VIOLET})` }}>
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
                                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-semibold">⏳ Pending Review</span>
                              </div>
                              <p className="text-sm text-gray-500">{trainer.email}</p>

                              {/* Details grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                {[
                                  { label: "Specialization", value: trainer.specialization },
                                  { label: "Certification",  value: trainer.certification  },
                                  { label: "Experience",     value: trainer.experienceYears ? `${trainer.experienceYears} yrs` : null },
                                  { label: "Price / Month",  value: trainer.pricePerMonth   ? `LKR ${Number(trainer.pricePerMonth).toLocaleString()}` : null },
                                ].map(item => (
                                  <div key={item.label} className="p-3 rounded-xl" style={{ background: VIOLET_LIGHT }}>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">{item.label}</p>
                                    <p className="text-sm font-semibold text-gray-700 mt-0.5">
                                      {item.value || <span className="text-red-400 font-normal">Not set</span>}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* Bio */}
                              {trainer.bio ? (
                                <div className="mt-3 p-3 rounded-xl text-sm text-gray-600 italic" style={{ background: VIOLET_LIGHT }}>
                                  "{trainer.bio}"
                                </div>
                              ) : (
                                <div className="mt-3 p-3 rounded-xl text-sm text-red-400" style={{ background: "#fef2f2" }}>
                                  ⚠ No bio provided
                                </div>
                              )}

                              {/* Profile completeness */}
                              <div className="mt-4">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-xs text-gray-400">Profile completeness</p>
                                  <p className="text-xs font-bold" style={{ color: pct >= 80 ? "#22c55e" : "#f59e0b" }}>{pct}%</p>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                  <div className="h-full rounded-full transition-all"
                                    style={{ width: `${pct}%`, background: pct >= 80 ? "#22c55e" : "#f59e0b" }} />
                                </div>
                              </div>

                              {/* Expand */}
                              <button onClick={() => setExpandedId(expandedId === trainer.userId ? null : trainer.userId)}
                                className="mt-3 text-sm font-medium hover:underline" style={{ color: VIOLET }}>
                                {expandedId === trainer.userId ? "▲ Hide details" : "▼ View more details"}
                              </button>
                            </div>
                          </div>

                          {/* Expanded */}
                          {expandedId === trainer.userId && (
                            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Phone</p>
                                <p className="text-sm font-medium text-gray-700">{trainer.phone || <span className="text-gray-400">Not provided</span>}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Applied on</p>
                                <p className="text-sm font-medium text-gray-700">
                                  {trainer.createdAt ? new Date(trainer.createdAt).toLocaleDateString() : "—"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end" style={{ background: "#fafafa" }}>
                          <button onClick={() => rejectTrainer(trainer.userId, trainer.name)}
                            className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
                            style={{ background: "#ef4444" }}>
                            ❌ Reject
                          </button>
                          <button onClick={() => approveTrainer(trainer.userId, trainer.name)}
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
          )}
        </div>
      </div>
    </div>
  );
}