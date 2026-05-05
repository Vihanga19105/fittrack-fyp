import { useState } from "react";
import Swal from "sweetalert2";

const VIOLET       = "#8b5cf6";
const VIOLET_DARK  = "#7c3aed";
const VIOLET_LIGHT = "#f5f3ff";

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      className="relative inline-flex items-center w-11 h-6 rounded-full transition-colors focus:outline-none flex-shrink-0"
      style={{ background: checked ? VIOLET : "#d1d5db" }}>
      <span className="inline-block w-4 h-4 bg-white rounded-full shadow transition-transform"
        style={{ transform: checked ? "translateX(24px)" : "translateX(4px)" }} />
    </button>
  );
}

export default function AdminSystemSettings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("fittrack_admin_settings");
    return saved ? JSON.parse(saved) : {
      allowRegister:   true,
      emailVerify:     true,
      maintenance:     false,
      autoApprove:     false,
      reviewsEnabled:  true,
      chatEnabled:     true,
    };
  });

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const save = () => {
    localStorage.setItem("fittrack_admin_settings", JSON.stringify(settings));
    Swal.fire({ title: "Settings Saved! ✅", text: "Platform settings updated successfully", icon: "success", timer: 1500, showConfirmButton: false });
  };

  const SettingRow = ({ keyName, label, desc, danger }) => (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-50 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: danger ? "#ef4444" : "#1f2937" }}>{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <Toggle checked={settings[keyName]} onChange={() => toggle(keyName)} />
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "#faf5ff" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(124,58,237,0.80) 100%), url('https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "180px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-4xl font-black tracking-tight">System Settings ⚙️</h1>
          <p className="text-purple-100 mt-1 text-sm">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <p className="text-purple-200 text-sm mt-1">Configure FitTrack platform behaviour</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* REGISTRATION */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-800 text-lg mb-1 flex items-center gap-2">
            <span>👥</span> Registration & Access
          </h2>
          <p className="text-xs text-gray-400 mb-4">Control who can join and how</p>
          <SettingRow keyName="allowRegister" label="Allow New Registrations"     desc="New clients and trainers can register on the platform"     />
          <SettingRow keyName="emailVerify"   label="Require Email Verification"  desc="Users must verify their email before accessing the platform" />
          <SettingRow keyName="autoApprove"   label="Auto-Approve Trainers"       desc="Automatically approve trainers without admin review (not recommended)" danger />
        </div>

        {/* FEATURES */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-800 text-lg mb-1 flex items-center gap-2">
            <span>⚡</span> Platform Features
          </h2>
          <p className="text-xs text-gray-400 mb-4">Enable or disable platform features</p>
          <SettingRow keyName="reviewsEnabled" label="Enable Trainer Reviews" desc="Allow clients to rate and review their trainers" />
          <SettingRow keyName="chatEnabled"    label="Enable Real-Time Chat"  desc="Allow clients and trainers to chat via WebSocket messaging" />
        </div>

        {/* MAINTENANCE */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border-2" style={{ borderColor: settings.maintenance ? "#fecaca" : "#f1f5f9" }}>
          <h2 className="font-bold text-gray-800 text-lg mb-1 flex items-center gap-2">
            <span>🔧</span> Maintenance Mode
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            {settings.maintenance
              ? "⚠️ Maintenance mode is ON — the platform is currently unavailable to users"
              : "Platform is running normally"}
          </p>
          <SettingRow keyName="maintenance" label="Enable Maintenance Mode" desc="Temporarily disable the platform for all users (admins can still login)" danger />
        </div>

        {/* SAVE */}
        <button onClick={save}
          className="w-full py-4 rounded-xl text-white font-bold text-base hover:opacity-90 active:scale-95 transition-all"
          style={{ background: `linear-gradient(135deg, ${VIOLET_DARK}, ${VIOLET})` }}>
          💾 Save Settings
        </button>

        <p className="text-xs text-gray-400 text-center">
          Settings are saved locally. For production, connect these to a backend configuration API.
        </p>
      </div>
    </div>
  );
}