import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Shield,
  BarChart2, User, LogOut, Bell,
  DollarSign, FileBarChart, Settings,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../api/api";
import NotificationBell from "./NotificationBell";

const NAVY   = "#0A2342";
const VIOLET = "#8b5cf6";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchPending = async () => {
    try {
      const res = await api.get("/api/admin/pending-trainers");
      setPendingCount(res.data?.length || 0);
    } catch {}
  };

  const logout = () => {
    Swal.fire({
      title: "Logout?", icon: "warning",
      showCancelButton: true,
      confirmButtonColor: VIOLET, cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Logout",
    }).then(result => {
      if (result.isConfirmed) {
        localStorage.clear(); sessionStorage.clear(); navigate("/");
      }
    });
  };

  const menuItems = [
    { to: "/admin/dashboard",          icon: <LayoutDashboard size={18} />, text: "Dashboard",          badge: 0            },
    { to: "/admin/users",              icon: <Users size={18} />,           text: "Manage Users",        badge: 0            },
    { to: "/admin/trainers",           icon: <Shield size={18} />,          text: "Manage Trainers",     badge: pendingCount },
    { to: "/admin/platform-analytics", icon: <BarChart2 size={18} />,       text: "Analytics",           badge: 0            },
    { to: "/admin/payments",           icon: <DollarSign size={18} />,      text: "Payments",            badge: 0            },
    { to: "/admin/reports",            icon: <FileBarChart size={18} />,    text: "Reports",             badge: 0            },
    { to: "/admin/settings",           icon: <Settings size={18} />,        text: "Settings",            badge: 0            },
    { to: "/admin/profile",            icon: <User size={18} />,            text: "Profile",             badge: 0            },
  ];

  return (
    <aside className="w-64 h-screen text-white flex flex-col shadow-xl flex-shrink-0"
      style={{ background: NAVY }}>

      {/* LOGO + NOTIFICATION BELL */}
      <div className="px-6 py-6 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
            style={{ background: VIOLET }}>
            F
          </div>
          <div>
            <p className="text-lg font-black tracking-wide">FitTrack</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Admin Portal</p>
          </div>
        </div>
        <NotificationBell />
      </div>

      {/* MENU */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menuItems.map(({ to, icon, text, badge }) => (
          <NavLink key={to} to={to}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-all text-sm font-medium"
            style={({ isActive }) => ({
              background: isActive ? VIOLET : "transparent",
              color: isActive ? "white" : "rgba(255,255,255,0.65)",
            })}>
            <div className="flex items-center gap-3">
              {icon}
              <span>{text}</span>
            </div>
            {badge > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: "#ef4444" }}>
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* LOGOUT */}
      <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <button onClick={logout}
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