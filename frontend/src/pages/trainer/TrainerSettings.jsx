import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import api from "../../api/api";

const TEAL       = "#14b8a6";
const TEAL_DARK  = "#0d9488";
const TEAL_LIGHT = "#f0fdfa";

const SECTIONS = [
  { id: "account",       label: "Account",       icon: "👤" },
  { id: "notifications", label: "Notifications",  icon: "🔔" },
  { id: "privacy",       label: "Privacy",        icon: "🛡️" },
  { id: "danger",        label: "Danger Zone",    icon: "⚠️" },
];

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      className="relative inline-flex items-center w-11 h-6 rounded-full transition-colors focus:outline-none flex-shrink-0"
      style={{ background: checked ? TEAL : "#d1d5db" }}>
      <span className="inline-block w-4 h-4 bg-white rounded-full shadow transition-transform"
        style={{ transform: checked ? "translateX(24px)" : "translateX(4px)" }} />
    </button>
  );
}

export default function TrainerSettings() {
  const [activeSection, setActiveSection] = useState("account");
  const [saving,        setSaving]        = useState(false);
  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState("");
  const [isVerified,    setIsVerified]    = useState(false);
  const [loadingAccount,setLoadingAccount]= useState(true);

  const [notifs, setNotifs] = useState({
    emailNewClients:    true,
    emailPayments:      true,
    emailMessages:      true,
    emailExpiring:      true,
    pushNewMessage:     true,
    pushClientUpdate:   true,
    pushPaymentReceived:true,
  });

  const [privacy, setPrivacy] = useState({
    showProfilePublicly: true,
    showPricePublicly:   true,
    showReviews:         true,
  });

  useEffect(() => {
    api.get("/api/profile/trainer")
      .then(res => {
        setName(res.data.name   || "");
        setEmail(res.data.email || "");
        setIsVerified(res.data.verified || false);
        setLoadingAccount(false);
      })
      .catch(() => {
        setName(localStorage.getItem("name") || "");
        setLoadingAccount(false);
      });

    const savedNotifs  = localStorage.getItem("fittrack_trainer_notif_prefs");
    if (savedNotifs)  setNotifs(JSON.parse(savedNotifs));
    const savedPrivacy = localStorage.getItem("fittrack_trainer_privacy_prefs");
    if (savedPrivacy) setPrivacy(JSON.parse(savedPrivacy));
  }, []);

  const saveAccount = async () => {
    if (!name.trim()) { Swal.fire("Validation", "Name cannot be empty", "warning"); return; }
    setSaving(true);
    try {
      await api.put("/api/profile/trainer", { name: name.trim() });
      localStorage.setItem("name", name.trim());
      Swal.fire({ title: "Saved!", text: "Account details updated.", icon: "success", timer: 1500, showConfirmButton: false });
    } catch (err) { Swal.fire("Error", err?.response?.data || "Failed to update", "error"); }
    setSaving(false);
  };

  const saveNotifications = async () => {
    setSaving(true);
    localStorage.setItem("fittrack_trainer_notif_prefs", JSON.stringify(notifs));
    await new Promise(r => setTimeout(r, 400));
    Swal.fire({ title: "Saved!", text: "Notification preferences updated.", icon: "success", timer: 1500, showConfirmButton: false });
    setSaving(false);
  };

  const savePrivacy = async () => {
    setSaving(true);
    localStorage.setItem("fittrack_trainer_privacy_prefs", JSON.stringify(privacy));
    await new Promise(r => setTimeout(r, 400));
    Swal.fire({ title: "Saved!", text: "Privacy settings updated.", icon: "success", timer: 1500, showConfirmButton: false });
    setSaving(false);
  };

  const logout = () => {
    Swal.fire({
      title: "Log out?", icon: "question", showCancelButton: true,
      confirmButtonColor: TEAL, cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, log out",
    }).then(r => {
      if (r.isConfirmed) { localStorage.clear(); sessionStorage.clear(); window.location.href = "/login"; }
    });
  };

  const deleteAccount = () => {
    Swal.fire({
      title: "Delete your account?",
      html: "This will permanently delete your account, client data, workout plans, and all history.<br><br><b>This cannot be undone.</b>",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete everything",
    }).then(async r => {
      if (r.isConfirmed) {
        Swal.fire("Contact Support", "Please contact support@fittrack.lk to delete your trainer account.", "info");
      }
    });
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: "#f0fdf4" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.70) 50%, rgba(20,184,166,0.80) 100%), url('https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "200px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Account</p>
              <h1 className="text-4xl font-black tracking-tight">Settings ⚙️</h1>
              <p className="text-teal-100 mt-1 text-sm">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <p className="text-teal-200 text-sm mt-1">Manage your account preferences and privacy</p>
            </div>
            {/* Pills */}
            <div className="hidden md:flex gap-2">
              <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                <p className="text-xs text-teal-200 mb-0.5">Account</p>
                <p className="font-bold text-white text-sm leading-none">{name || "Trainer"}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                <p className="text-xs text-teal-200 mb-0.5">Role</p>
                <p className="font-bold text-white text-sm leading-none">🏋️ Trainer</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center border border-white/20">
                <p className="text-xs text-teal-200 mb-0.5">Status</p>
                <p className="font-bold text-white text-sm leading-none">
                  {isVerified ? "✅ Verified" : "⏳ Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-5">

          {/* SIDEBAR NAV */}
          <nav className="flex sm:flex-col gap-1 sm:w-52 flex-shrink-0 bg-white rounded-2xl p-3 shadow-sm h-fit">
            <p className="hidden sm:block text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-2">Menu</p>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-left transition-all"
                style={activeSection === s.id
                  ? { background: TEAL, color: "#fff" }
                  : { color: "#4b5563", background: "transparent" }}
                onMouseEnter={e => { if (activeSection !== s.id) e.currentTarget.style.background = TEAL_LIGHT; }}
                onMouseLeave={e => { if (activeSection !== s.id) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: "18px" }}>{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
            <div className="border-t border-gray-100 my-2 hidden sm:block" />
            <button onClick={logout}
              className="hidden sm:flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-left text-red-500 transition-all"
              onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontSize: "18px" }}>🚪</span>
              <span>Log out</span>
            </button>
          </nav>

          {/* MAIN PANEL */}
          <div className="flex-1">

            {/* ── ACCOUNT ── */}
            {activeSection === "account" && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: TEAL_LIGHT }}>👤</div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Account Details</h2>
                    <p className="text-xs text-gray-400">Update your display name</p>
                  </div>
                </div>

                {loadingAccount ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: TEAL, borderTopColor: "transparent" }} />
                    Loading...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Name</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none transition-all"
                        placeholder="Your full name"
                        onFocus={e => e.target.style.borderColor = TEAL}
                        onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email Address</label>
                      <input type="email" value={email} disabled
                        className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-gray-400 text-sm cursor-not-allowed" />
                      <p className="text-xs text-gray-400 mt-1">Email cannot be changed after registration</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Role</label>
                      <div className="border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                        <span>🏋️</span> Trainer
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Verification Status</label>
                      <div className="border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm flex items-center gap-2"
                        style={{ color: isVerified ? TEAL : "#f59e0b" }}>
                        {isVerified ? "✅ Verified Trainer" : "⏳ Pending Admin Approval"}
                      </div>
                    </div>
                    <button onClick={saveAccount} disabled={saving}
                      className="px-6 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-all"
                      style={{ background: `linear-gradient(135deg, ${TEAL_DARK}, ${TEAL})` }}>
                      {saving ? "Saving..." : "💾 Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeSection === "notifications" && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: TEAL_LIGHT }}>🔔</div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Notifications</h2>
                    <p className="text-xs text-gray-400">Choose what you want to be notified about</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* EMAIL */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-gray-100" />
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2">Email Notifications</p>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>
                    <div className="space-y-1">
                      {[
                        { key: "emailNewClients", label: "New client requests",    desc: "When a client sends a subscription request"            },
                        { key: "emailPayments",   label: "Payment received",       desc: "When a client completes payment for subscription"      },
                        { key: "emailMessages",   label: "New chat messages",      desc: "Email digest of unread messages from clients"          },
                        { key: "emailExpiring",   label: "Expiring subscriptions", desc: "Reminder when a client's subscription is about to end" },
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl hover:bg-gray-50 transition-all">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{item.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                          </div>
                          <Toggle checked={notifs[item.key]} onChange={v => setNotifs(n => ({ ...n, [item.key]: v }))} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* IN-APP */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-gray-100" />
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2">In-App Notifications</p>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>
                    <div className="space-y-1">
                      {[
                        { key: "pushNewMessage",       label: "New messages",       desc: "Badge counter on chat sidebar for unread messages" },
                        { key: "pushClientUpdate",     label: "Client activity",    desc: "When a client logs weight, BMI or completes workout" },
                        { key: "pushPaymentReceived",  label: "Payment alerts",     desc: "Real-time alert when payment is received"           },
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl hover:bg-gray-50 transition-all">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{item.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                          </div>
                          <Toggle checked={notifs[item.key]} onChange={v => setNotifs(n => ({ ...n, [item.key]: v }))} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={saveNotifications} disabled={saving}
                    className="px-6 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-all"
                    style={{ background: `linear-gradient(135deg, ${TEAL_DARK}, ${TEAL})` }}>
                    {saving ? "Saving..." : "💾 Save Preferences"}
                  </button>
                </div>
              </div>
            )}

            {/* ── PRIVACY ── */}
            {activeSection === "privacy" && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: TEAL_LIGHT }}>🛡️</div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Privacy</h2>
                    <p className="text-xs text-gray-400">Control your public visibility on FitTrack</p>
                  </div>
                </div>

                <div className="space-y-1 mb-6">
                  {[
                    { key: "showProfilePublicly", label: "Show profile publicly",  desc: "Allow new clients to discover your profile on the Trainers page" },
                    { key: "showPricePublicly",   label: "Show price publicly",    desc: "Display your monthly subscription price on your public profile"  },
                    { key: "showReviews",          label: "Show client reviews",   desc: "Allow reviews from clients to appear on your public profile"      },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl hover:bg-gray-50 transition-all">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                      <Toggle checked={privacy[item.key]} onChange={v => setPrivacy(p => ({ ...p, [item.key]: v }))} />
                    </div>
                  ))}
                </div>

                <button onClick={savePrivacy} disabled={saving}
                  className="px-6 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-all"
                  style={{ background: `linear-gradient(135deg, ${TEAL_DARK}, ${TEAL})` }}>
                  {saving ? "Saving..." : "💾 Save Privacy Settings"}
                </button>
              </div>
            )}

            {/* ── DANGER ZONE ── */}
            {activeSection === "danger" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-1 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "#fef2f2" }}>⚠️</div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Danger Zone</h2>
                    <p className="text-xs text-gray-400">Irreversible actions — proceed with caution</p>
                  </div>
                </div>

                {/* LOG OUT */}
                <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between gap-4 border-2 border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "#f9fafb" }}>🚪</div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">Log Out of FitTrack</p>
                      <p className="text-xs text-gray-400 mt-0.5">You will need to log in again to access your account</p>
                    </div>
                  </div>
                  <button onClick={logout}
                    className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 flex-shrink-0 transition-all">
                    Log Out
                  </button>
                </div>

                {/* DELETE ACCOUNT */}
                <div className="bg-white rounded-2xl shadow-sm p-5 border-2" style={{ borderColor: "#fecaca" }}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "#fef2f2" }}>🗑️</div>
                    <div>
                      <p className="text-sm font-bold text-red-600">Delete Account</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                        Once you delete your account, all your data including client plans,
                        income history, availability and chat messages will be permanently removed.
                        This cannot be undone.
                      </p>
                    </div>
                  </div>
                  <button onClick={deleteAccount}
                    className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                    style={{ background: "#ef4444" }}>
                    🗑️ Delete My Account
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}