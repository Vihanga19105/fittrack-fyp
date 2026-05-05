import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  LayoutDashboard, User, Dumbbell, Apple,
  Activity, CreditCard, Settings,
  LogOut, MessageCircle, Scale,
} from "lucide-react";
import Swal from "sweetalert2";
import NotificationBell from "./NotificationBell";

const API = "http://localhost:8080/api";
const NAVY = "#0A2342";
const BLUE = "#29ABE2";

export default function ClientSidebar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnread = async () => {
    try {
      const res = await axios.get(
        `${API}/chat/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: BLUE,
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, logout",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        sessionStorage.clear();
        navigate("/login");
      }
    });
  };

  return (
    <aside className="w-64 h-screen text-white flex flex-col shadow-xl flex-shrink-0"
      style={{ background: NAVY }}>

      {/* LOGO + NOTIFICATION BELL */}
      <div className="px-6 py-6 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
            style={{ background: BLUE }}>
            F
          </div>
          <div>
            <p className="text-lg font-black tracking-wide">FitTrack</p>
            <p className="text-xs"
              style={{ color: "rgba(255,255,255,0.45)" }}>
              Client Portal
            </p>
          </div>
        </div>
        {/* NOTIFICATION BELL */}
        <NotificationBell />
      </div>

      {/* MENU */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <Item to="/client/dashboard"
          icon={<LayoutDashboard size={18}/>}
          text="Dashboard"/>
        <Item to="/client/profile"
          icon={<User size={18}/>}
          text="Profile"/>
        
        <Item to="/client/workout-plan"
          icon={<Dumbbell size={18}/>}
          text="Workout Plan"/>
        <Item to="/client/nutrition"
          icon={<Apple size={18}/>}
          text="Nutrition Plan"/>
        <Item to="/client/bmi"
          icon={<Scale size={18}/>}
          text="BMI Calculator"/>
        <Item to="/client/progress"
          icon={<Activity size={18}/>}
          text="Progress"/>

        {/* CHAT WITH UNREAD BADGE */}
        <NavLink to="/client/chat"
          className={({ isActive }) =>
            `flex items-center justify-between px-4 py-2.5
             rounded-xl cursor-pointer transition-all text-sm font-medium`
          }
          style={({ isActive }) => ({
            background: isActive ? BLUE : "transparent",
            color: isActive ? "white" : "rgba(255,255,255,0.65)",
          })}>
          {({ isActive }) => (
            <>
              <div className="flex items-center gap-3">
                <MessageCircle size={18}/>
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

        <Item to="/client/payments"
          icon={<CreditCard size={18}/>}
          text="Payments"/>
        <Item to="/client/settings"
          icon={<Settings size={18}/>}
          text="Settings"/>
      </nav>

      {/* LOGOUT */}
      <div className="px-3 pb-4 border-t pt-3"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full transition-all text-sm font-medium"
          style={{ color: "rgba(255,255,255,0.55)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.15)";
            e.currentTarget.style.color = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.55)";
          }}>
          <LogOut size={18}/>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function Item({ to, icon, text }) {
  return (
    <NavLink to={to}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all text-sm font-medium"
      style={({ isActive }) => ({
        background: isActive ? BLUE : "transparent",
        color: isActive ? "white" : "rgba(255,255,255,0.65)",
      })}>
      {icon}
      <span>{text}</span>
    </NavLink>
  );
}