import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import api from "../../api/api";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePayment from "../../components/StripePayment";

const stripePromise = loadStripe(
  "pk_test_51TKMnYFnPTU4f7qewXSP5XSIABrpZ6Fibd0Ep16URPVQDYzpCjB24eBgDphkBqxOxYv8ArQnTW9Xxs8J4jLA72xb009LMtTcHx"
);

const API = "http://localhost:8080/api";
const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT = "#E8F7FD";
const NAVY = "#0A2342";

export default function ClientPayments() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingSubId, setPayingSubId] = useState(null);
  const [activeTab, setActiveTab] = useState("current");
  const token = localStorage.getItem("token");

  useEffect(() => { loadSubscriptions(); }, []);

  const loadSubscriptions = () => {
    api.get("/api/subscriptions/my")
      .then(res => { setSubscriptions(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const hasActiveSub = subscriptions.some(s => s.status === "ACTIVE");

  // Sort: ACTIVE first, then ACCEPTED, then PENDING
  const currentSubs = subscriptions
    .filter(s => ["PENDING", "ACCEPTED", "ACTIVE"].includes(s.status))
    .sort((a, b) => {
      const order = { ACTIVE: 0, ACCEPTED: 1, PENDING: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });

  const historySubs = subscriptions.filter(s =>
    ["EXPIRED", "CANCELLED", "REJECTED"].includes(s.status)
  );

  const paidSubs = subscriptions.filter(s => s.status === "ACTIVE" || s.status === "EXPIRED");
  const totalSpent = paidSubs.reduce((sum, s) => sum + (s.trainerPrice || 0), 0);

  // ── STAR RATING ──
  const getStarHtml = () => `
    <div style="text-align:center;margin-bottom:16px">
      <p style="font-size:14px;color:#6b7280;margin-bottom:8px">Tap a star to rate</p>
      <div id="star-container" style="display:flex;justify-content:center;gap:8px;font-size:36px;cursor:pointer">
        ${[1,2,3,4,5].map(i => `<span class="star" data-value="${i}" style="color:#d1d5db;transition:color 0.2s">★</span>`).join("")}
      </div>
      <p id="rating-label" style="font-size:13px;color:#9ca3af;margin-top:6px">No rating selected</p>
    </div>
    <textarea id="review-text" rows="4" placeholder="Write your review here... (optional)"
      style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:none;outline:none"></textarea>
  `;

  const ratingLabels = { 1: "Poor ⭐", 2: "Fair ⭐⭐", 3: "Good ⭐⭐⭐", 4: "Very Good ⭐⭐⭐⭐", 5: "Excellent ⭐⭐⭐⭐⭐" };

  const updateStars = (stars, value, label) => {
    stars.forEach(s => { s.style.color = parseInt(s.dataset.value) <= value ? "#f59e0b" : "#d1d5db"; });
    if (label) { label.textContent = value > 0 ? ratingLabels[value] : "No rating selected"; label.style.color = value > 0 ? "#f59e0b" : "#9ca3af"; }
  };

  const handleReview = async (sub) => {
    try {
      const checkRes = await axios.get(`${API}/reviews/check/${sub.trainerId}`, { headers: { Authorization: `Bearer ${token}` } });
      let selectedRating = checkRes.data.hasReviewed ? checkRes.data.rating : 0;
      const { value: confirmed } = await Swal.fire({
        title: `Rate ${sub.trainerName}`,
        html: getStarHtml(),
        showCancelButton: true,
        confirmButtonColor: BLUE,
        cancelButtonColor: "#6b7280",
        confirmButtonText: checkRes.data.hasReviewed ? "Update Review" : "Submit Review",
        didOpen: () => {
          const stars = document.querySelectorAll(".star");
          const label = document.getElementById("rating-label");
          const textarea = document.getElementById("review-text");
          if (checkRes.data.hasReviewed) { textarea.value = checkRes.data.review || ""; updateStars(stars, selectedRating, label); }
          stars.forEach(star => {
            star.addEventListener("mouseover", () => updateStars(stars, parseInt(star.dataset.value), label));
            star.addEventListener("mouseout",  () => updateStars(stars, selectedRating, label));
            star.addEventListener("click",     () => { selectedRating = parseInt(star.dataset.value); updateStars(stars, selectedRating, label); });
          });
        },
        preConfirm: () => {
          if (selectedRating === 0) { Swal.showValidationMessage("Please select a star rating!"); return false; }
          return { rating: selectedRating, review: document.getElementById("review-text").value.trim() };
        },
      });
      if (confirmed) {
        await axios.post(`${API}/reviews/submit`, { trainerId: sub.trainerId, rating: confirmed.rating, review: confirmed.review }, { headers: { Authorization: `Bearer ${token}` } });
        Swal.fire({ title: "Review Submitted! ⭐", text: "Thank you for your feedback!", icon: "success", timer: 2000, showConfirmButton: false });
      }
    } catch { Swal.fire("Error", "Failed to submit review", "error"); }
  };

  const handleRenew = (subId) => {
    Swal.fire({ title: "Renew Subscription?", text: "A new request will be sent to your trainer!", icon: "question", showCancelButton: true, confirmButtonColor: BLUE, cancelButtonColor: "#6b7280", confirmButtonText: "Yes, renew!" })
      .then(async result => {
        if (result.isConfirmed) {
          try {
            await api.post(`/api/subscriptions/${subId}/renew`);
            Swal.fire({ title: "Renewal Requested!", icon: "success", timer: 2000, showConfirmButton: false });
            loadSubscriptions();
          } catch (err) { Swal.fire("Error", String(err?.response?.data || "Failed"), "error"); }
        }
      });
  };

  const handleCancel = (subId) => {
    Swal.fire({ title: "Cancel Subscription?", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, cancel" })
      .then(async result => {
        if (result.isConfirmed) {
          try {
            await api.put(`/api/subscriptions/${subId}/cancel`);
            Swal.fire({ title: "Cancelled", icon: "info", timer: 1500, showConfirmButton: false });
            loadSubscriptions();
          } catch { Swal.fire("Error", "Failed to cancel", "error"); }
        }
      });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":    return { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" };
      case "PENDING":   return { bg: "#fefce8", text: "#a16207", border: "#fde68a" };
      case "ACCEPTED":  return { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" };
      case "EXPIRED":   return { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" };
      case "CANCELLED": return { bg: "#f9fafb", text: "#6b7280", border: "#e5e7eb" };
      case "REJECTED":  return { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" };
      default:          return { bg: "#f9fafb", text: "#6b7280", border: "#e5e7eb" };
    }
  };

  const handlePaymentSuccess = ({ amount, paymentRef, trainerName }) => {
    setPayingSubId(null);
    const now = new Date();
    Swal.fire({
      title: "Payment Successful! 🎉",
      html: `
        <div style="text-align:left;">
          <div style="text-align:center;margin-bottom:16px;">
            <div style="font-size:52px;">✅</div>
            <p style="color:#16a34a;font-weight:700;font-size:18px;margin:8px 0;">LKR ${amount} Paid</p>
          </div>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;">
            <p style="font-size:12px;color:#9ca3af;margin:0 0 10px;font-weight:600;text-transform:uppercase;">Payment Receipt</p>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:13px;color:#6b7280;">Trainer</span><span style="font-size:13px;font-weight:600;">${trainerName}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:13px;color:#6b7280;">Amount</span><span style="font-size:13px;font-weight:600;color:#16a34a;">LKR ${amount}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:13px;color:#6b7280;">Valid for</span><span style="font-size:13px;font-weight:600;">30 days</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:13px;color:#6b7280;">Date</span><span style="font-size:13px;font-weight:600;">${now.toLocaleDateString()}</span></div>
            <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:#6b7280;">Reference</span><span style="font-size:11px;font-weight:600;color:#6b7280;font-family:monospace;">${paymentRef.substring(0, 25)}...</span></div>
          </div>
          <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:12px;">Your subscription is now ACTIVE for 30 days!</p>
        </div>
      `,
      confirmButtonColor: BLUE,
      confirmButtonText: "Great!",
    });
    loadSubscriptions();
  };

  const handlePayClick = (sub) => {
    if (hasActiveSub) {
      Swal.fire({ title: "Already Have Active Subscription", html: `<p style="color:#6b7280;font-size:14px;">You already have an active subscription. You can only have <strong>one active subscription</strong> at a time.</p>`, icon: "warning", confirmButtonColor: BLUE, confirmButtonText: "OK, Got it" });
      return;
    }
    setPayingSubId(sub.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f0f9ff" }}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">💳</div>
          <p className="text-gray-400 animate-pulse">Loading payments...</p>
        </div>
      </div>
    );
  }

  const activeSub   = currentSubs.find(s => s.status === "ACTIVE");
  const otherSubs   = currentSubs.filter(s => s.status !== "ACTIVE");

  return (
    <div className="min-h-screen" style={{ background: "#f0f9ff" }}>

      {/* ── HERO ── */}
      <div
        className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.70) 50%, rgba(41,171,226,0.80) 100%), url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "200px",
        }}>

        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-6 flex-wrap">

            {/* LEFT */}
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Payments</p>
              <h1 className="text-4xl font-black tracking-tight">Subscription & Payments 💳</h1>
              <p className="text-blue-100 mt-1 text-sm">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <p className="text-blue-200 text-sm mt-1">Manage your trainer subscriptions</p>
            </div>

            {/* RIGHT — stat pills */}
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
  <p className="text-xs text-blue-200 mb-0.5">Monthly Fee</p>
  <p className="font-bold text-white text-sm leading-none">LKR {activeSub?.trainerPrice?.toLocaleString() || "—"}</p>
</div>
<div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
  <p className="text-xs text-blue-200 mb-0.5">Total Spent</p>
  <p className="font-bold text-white text-sm leading-none">LKR {totalSpent.toLocaleString()}</p>
</div>
<div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
  <p className="text-xs text-blue-200 mb-0.5">Status</p>
  <p className="font-bold text-white text-sm leading-none">{hasActiveSub ? "✅ Active" : "❌ None"}</p>
</div>
          </div>
        </div>
      </div>
      {/* ── END HERO ── */}

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ── ACTIVE SUBSCRIPTION — TOP PRIORITY ── */}
        {activeSub && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-2" style={{ borderColor: "#bbf7d0" }}>
            {/* green top bar */}
            <div className="px-6 py-3 flex items-center gap-2" style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
              <span className="text-white text-lg">✅</span>
              <p className="text-white font-bold text-sm">Active Subscription</p>
              <span className="ml-auto text-xs text-green-100">Until {activeSub.endDate}</span>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-full text-white font-black text-2xl flex items-center justify-center flex-shrink-0" style={{ background: BLUE }}>
                  {activeSub.trainerName?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800">{activeSub.trainerName}</h2>
                  <p className="text-xs text-gray-400">{activeSub.trainerEmail}</p>
                  {activeSub.trainerSpecialization && (
                    <p className="text-xs mt-0.5 font-medium" style={{ color: BLUE }}>{activeSub.trainerSpecialization}</p>
                  )}
                </div>
              </div>

              {/* details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Monthly Price", value: `LKR ${activeSub.trainerPrice?.toLocaleString() || "N/A"}`, color: BLUE_DARK },
                  { label: "Start Date",    value: activeSub.startDate || "N/A"                                              },
                  { label: "Expires On",    value: activeSub.endDate   || "N/A"                                              },
                  { label: "Duration",      value: "30 days"                                                                  },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-xl" style={{ background: "#f0fdf4" }}>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="font-bold text-sm mt-0.5" style={{ color: item.color || "#374151" }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 flex-wrap">
                <button onClick={() => handleReview(activeSub)}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all"
                  style={{ background: "#f59e0b" }}>
                  ⭐ Rate Your Trainer
                </button>
                <button onClick={() => handleCancel(activeSub.id)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 hover:opacity-80 transition-all"
                  style={{ borderColor: "#ef4444", color: "#ef4444", background: "white" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── OTHER CURRENT SUBS (ACCEPTED / PENDING) ── */}
        {otherSubs.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-700 text-sm px-1">
              {hasActiveSub ? "⏳ Other Requests" : "📋 Pending Requests"}
            </h3>
            {otherSubs.map(sub => {
              const sc = getStatusColor(sub.status);
              return (
                <div key={sub.id} className="bg-white rounded-2xl shadow-sm border-2 p-5"
                  style={{ borderColor: sc.border }}>

                  {/* HEADER */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full text-white font-bold text-lg flex items-center justify-center flex-shrink-0" style={{ background: BLUE }}>
                        {sub.trainerName?.charAt(0)}
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-800">{sub.trainerName}</h2>
                        <p className="text-xs text-gray-400">{sub.trainerEmail}</p>
                        {sub.trainerSpecialization && <p className="text-xs mt-0.5" style={{ color: BLUE }}>{sub.trainerSpecialization}</p>}
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: sc.bg, color: sc.text }}>
                      {sub.status}
                    </span>
                  </div>

                  {/* DETAILS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 rounded-xl" style={{ background: BLUE_LIGHT }}>
                    {[
                      { label: "Monthly Price", value: `LKR ${sub.trainerPrice?.toLocaleString() || "N/A"}`, color: BLUE_DARK },
                      { label: "Start Date",    value: sub.startDate || "N/A" },
                      { label: "Expires On",    value: sub.endDate   || "N/A" },
                      { label: "Duration",      value: "30 days"              },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className="font-bold mt-0.5 text-sm" style={{ color: item.color || "#374151" }}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* PENDING */}
                  {sub.status === "PENDING" && (
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#fefce8" }}>
                      <span className="text-amber-700 text-sm font-medium">⏳ Waiting for trainer approval...</span>
                      <button onClick={() => handleCancel(sub.id)} className="text-red-500 text-xs hover:underline font-semibold">Cancel Request</button>
                    </div>
                  )}

                  {/* ACCEPTED */}
                  {sub.status === "ACCEPTED" && (
                    <>
                      {hasActiveSub ? (
                        /* BLOCKED */
                        <div className="p-4 rounded-xl border" style={{ background: "#fefce8", borderColor: "#fde68a" }}>
                          <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0">⚠️</span>
                            <div>
                              <p className="font-bold text-sm text-gray-800">Payment Blocked</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                You already have an active subscription with another trainer. You can only pay for one trainer at a time. Cancel your active subscription first if you want to switch to <strong>{sub.trainerName}</strong>.
                              </p>
                              <button onClick={() => handleCancel(sub.id)} className="mt-2 text-xs text-red-500 hover:underline font-semibold">Cancel This Request</button>
                            </div>
                          </div>
                        </div>
                      ) : payingSubId === sub.id ? (
                        /* STRIPE FORM */
                        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                          <p className="text-sm font-semibold text-gray-700 mb-4">💳 Complete Your Payment</p>
                          <Elements stripe={stripePromise}>
                            <StripePayment sub={sub} onSuccess={handlePaymentSuccess} onCancel={() => setPayingSubId(null)} />
                          </Elements>
                        </div>
                      ) : (
                        /* PAY NOW */
                        <div>
                          <div className="flex items-center justify-between mb-3 p-3 rounded-xl" style={{ background: "#f0fdf4" }}>
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">✅</span>
                              <span className="text-sm font-medium text-gray-700">{sub.trainerName} accepted your request!</span>
                            </div>
                            <span className="text-xs text-gray-400">Complete payment to activate</span>
                          </div>
                          <button onClick={() => handlePayClick(sub)}
                            className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all"
                            style={{ background: "#10b981" }}>
                            💳 Pay Now — LKR {sub.trainerPrice?.toLocaleString() || "N/A"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {historySubs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">📋 Subscription History</h3>
              <p className="text-xs text-gray-400 mt-0.5">{historySubs.length} past subscriptions</p>
            </div>
            <div className="p-5 space-y-3">
              {historySubs.map(sub => {
                const sc = getStatusColor(sub.status);
                return (
                  <div key={sub.id} className="border rounded-2xl p-5 hover:shadow-sm transition-all" style={{ borderColor: sc.border }}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full text-white font-bold flex items-center justify-center flex-shrink-0" style={{ background: BLUE }}>
                          {sub.trainerName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{sub.trainerName}</p>
                          <p className="text-xs text-gray-400">{sub.trainerEmail}</p>
                          {sub.trainerSpecialization && <p className="text-xs mt-0.5" style={{ color: BLUE }}>{sub.trainerSpecialization}</p>}
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold flex-shrink-0" style={{ background: sc.bg, color: sc.text }}>{sub.status}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: "Amount Paid", value: sub.status === "EXPIRED" ? `LKR ${sub.trainerPrice?.toLocaleString() || "N/A"}` : "—", color: "#10b981" },
                        { label: "Start Date",  value: sub.startDate || "—" },
                        { label: "End Date",    value: sub.endDate   || "—" },
                        { label: "Duration",    value: "30 days"            },
                      ].map(item => (
                        <div key={item.label} className="p-3 rounded-xl" style={{ background: "#f9fafb" }}>
                          <p className="text-xs text-gray-400">{item.label}</p>
                          <p className="font-semibold text-sm mt-0.5" style={{ color: item.color || "#374151" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {sub.status === "REJECTED" && sub.rejectionReason && (
                      <div className="mb-4 p-3 rounded-xl" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                        <p className="text-xs font-semibold text-red-500 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-600">"{sub.rejectionReason}"</p>
                      </div>
                    )}

                    <div className="flex gap-3 flex-wrap">
                      {sub.status === "EXPIRED" && (
                        <>
                          <button onClick={() => handleRenew(sub.id)} className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ background: BLUE }}>🔄 Renew</button>
                          <button onClick={() => handleReview(sub)} className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ background: "#f59e0b" }}>⭐ Rate Trainer</button>
                        </>
                      )}
                      {sub.status === "REJECTED" && (
                        <button onClick={() => window.location.href = "/client/trainers"} className="px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: BLUE }}>Find Another Trainer</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {subscriptions.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-5xl mb-4">💳</p>
            <p className="font-bold text-gray-600 text-lg">No subscriptions yet</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Find a trainer to get started!</p>
            <button onClick={() => window.location.href = "/client/trainers"}
              className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: BLUE }}>
              Find a Trainer
            </button>
          </div>
        )}

        {/* STRIPE SECURITY NOTE */}
        <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-gray-500 text-center">
          🔒 Payments are secured by Stripe. No card details stored on FitTrack servers.
        </div>
      </div>
    </div>
  );
}