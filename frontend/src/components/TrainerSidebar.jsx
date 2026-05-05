import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  LayoutDashboard, User, Users, TrendingUp,
  MessageCircle, DollarSign, Calendar,
  Settings, LogOut, Lock, Bell,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../api/api";
import NotificationBell from "./NotificationBell";

const API  = "http://localhost:8080/api";
const NAVY = "#0A2342";
const TEAL = "#14b8a6";

export default function TrainerSidebar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [isVerified,   setIsVerified]   = useState(false);
  const [notifCount,   setNotifCount]   = useState(0);

  useEffect(() => {
    api.get("/api/profile/trainer")
      .then(res => setIsVerified(res.data.verified || false))
      .catch(() => {});
    fetchUnread();
    fetchNotifCount();
    const interval = setInterval(() => {
      fetchUnread();
      fetchNotifCount();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnread = async () => {
    try {
      const res = await axios.get(`${API}/chat/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } });
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  };

  const fetchNotifCount = async () => {
    try {
      const [pendRes, clientRes] = await Promise.all([
        api.get("/api/subscriptions/requests").catch(() => ({ data: [] })),
        api.get("/api/subscriptions/clients").catch(() => ({ data: [] })),
      ]);
      const now = new Date();
      // pending requests + expiring subs (within 5 days) + recent payments (last 7 days)
      const expiringCount = clientRes.data.filter(c => {
        if (!c.endDate) return false;
        const days = Math.ceil((new Date(c.endDate) - now) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 5;
      }).length;
      const recentPayments = clientRes.data.filter(c => {
        if (!c.startDate) return false;
        return (now - new Date(c.startDate)) / (1000 * 60 * 60 * 24) <= 7;
      }).length;
      setNotifCount(pendRes.data.length + expiringCount + recentPayments);
    } catch {}
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?", icon: "question",
      showCancelButton: true,
      confirmButtonColor: TEAL, cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, logout",
    }).then(result => {
      if (result.isConfirmed) {
        localStorage.clear(); sessionStorage.clear(); navigate("/login");
      }
    });
  };

  const handleLockedClick = () => {
    Swal.fire({
      title: "Account Pending Approval",
      text: "Complete your profile and wait for admin approval to access this feature.",
      icon: "info", confirmButtonColor: TEAL, confirmButtonText: "Go to Profile",
    }).then(r => { if (r.isConfirmed) navigate("/trainer/profile"); });
  };

  return (
    <aside className="w-64 h-screen text-white flex flex-col shadow-xl flex-shrink-0"
      style={{ background: NAVY }}>

      {/* LOGO + NOTIFICATION BELL */}
      <div className="px-6 py-6 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
            style={{ background: TEAL }}>F</div>
          <div>
            <p className="text-lg font-black tracking-wide">FitTrack</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Trainer Portal</p>
          </div>
        </div>
        {isVerified && <NotificationBell />}
      </div>

      {/* VERIFICATION BADGE */}
      {!isVerified && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl text-xs font-medium"
          style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>
          ⏳ Pending admin approval
        </div>
      )}

      {/* MENU */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        <Item to="/trainer/dashboard" icon={<LayoutDashboard size={18} />} text="Dashboard" color={TEAL} />
        <Item to="/trainer/profile"   icon={<User size={18} />}            text="Profile"   color={TEAL} />

        {isVerified ? (
          <>
            <Item to="/trainer/client-requests" icon={<Users size={18} />}      text="Client Requests"  color={TEAL} />
            <Item to="/trainer/my-clients"       icon={<Users size={18} />}      text="My Clients"       color={TEAL} />
            <Item to="/trainer/client-progress"  icon={<TrendingUp size={18} />} text="Progress Monitor" color={TEAL} />

            {/* CHAT WITH UNREAD BADGE */}
            <NavLink to="/trainer/chat"
              className="flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-all text-sm font-medium"
              style={({ isActive }) => ({
                background: isActive ? TEAL : "transparent",
                color: isActive ? "white" : "rgba(255,255,255,0.65)",
              })}>
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <MessageCircle size={18} />
                    <span>Chat</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: "#ef4444" }}>
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>

            {/* NOTIFICATIONS WITH BADGE */}
            <NavLink to="/trainer/notifications"
              className="flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-all text-sm font-medium"
              style={({ isActive }) => ({
                background: isActive ? TEAL : "transparent",
                color: isActive ? "white" : "rgba(255,255,255,0.65)",
              })}>
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Bell size={18} />
                    <span>Notifications</span>
                  </div>
                  {notifCount > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: "#ef4444" }}>
                      {notifCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>

            <Item to="/trainer/income"       icon={<DollarSign size={18} />} text="Income Report" color={TEAL} />
            <Item to="/trainer/availability" icon={<Calendar size={18} />}   text="Availability"  color={TEAL} />
            <Item to="/trainer/settings"     icon={<Settings size={18} />}   text="Settings"      color={TEAL} />
          </>
        ) : (
          <>
            {[
              { icon: <Users size={18} />,         text: "Client Requests"  },
              { icon: <Users size={18} />,         text: "My Clients"       },
              { icon: <TrendingUp size={18} />,    text: "Progress Monitor" },
              { icon: <MessageCircle size={18} />, text: "Chat"             },
              { icon: <Bell size={18} />,          text: "Notifications"    },
              { icon: <DollarSign size={18} />,    text: "Income Report"    },
              { icon: <Calendar size={18} />,      text: "Availability"     },
              { icon: <Settings size={18} />,      text: "Settings"         },
            ].map(({ icon, text }) => (
              <button key={text} onClick={handleLockedClick}
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ color: "rgba(255,255,255,0.25)" }}>
                <div className="flex items-center gap-3">{icon}<span>{text}</span></div>
                <Lock size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
              </button>
            ))}
          </>
        )}
      </nav>

      {/* LOGOUT */}
      <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full transition-all text-sm font-medium"
          style={{ color: "rgba(255,255,255,0.55)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#fca5a5"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function Item({ to, icon, text, color }) {
  return (
    <NavLink to={to}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all text-sm font-medium"
      style={({ isActive }) => ({
        background: isActive ? color : "transparent",
        color: isActive ? "white" : "rgba(255,255,255,0.65)",
      })}>
      {icon}
      <span>{text}</span>
    </NavLink>
  );
}