import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE = "http://localhost:8080/api";

const TYPE_ICONS = {
  WORKOUT_ASSIGNED:      "💪",
  MEAL_ASSIGNED:         "🥗",
  NEW_MESSAGE:           "💬",
  SUBSCRIPTION_REQUEST:  "🙋",
  SUBSCRIPTION_ACCEPTED: "✅",
  SUBSCRIPTION_EXPIRING: "⏰",
  DEFAULT:               "🔔",
};

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
});

export default function NotificationBell() {
  const [unread,        setUnread       ] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open,          setOpen         ] = useState(false);
  const [loading,       setLoading      ] = useState(false);
  const dropdownRef = useRef(null);
  const navigate    = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current &&
          !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(
        `${BASE}/notifications/unread-count`,
        authHeader()
      );
      setUnread(res.data.count || 0);
    } catch {}
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE}/notifications`,
        authHeader()
      );
      setNotifications(res.data || []);
    } catch {}
    setLoading(false);
  };

  const handleOpen = async () => {
    const opening = !open;
    setOpen(opening);
    if (opening) {
      await fetchNotifications();
      if (unread > 0) {
        try {
          await axios.put(
            `${BASE}/notifications/mark-all-read`,
            {},
            authHeader()
          );
          setUnread(0);
        } catch {}
      }
    }
  };

  const handleClick = async (n) => {
    const read = n.isRead ?? n.read ?? false;
    if (!read) {
      try {
        await axios.put(
          `${BASE}/notifications/${n.id}/read`,
          {},
          authHeader()
        );
      } catch {}
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1)  return "just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24)  return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch { return ""; }
  };

  const isUnread = (n) => {
    const val = n.isRead ?? n.read;
    return val === false || val === 0;
  };

  return (
    <div className="relative" ref={dropdownRef}>

      {/* BELL BUTTON */}
      <button onClick={handleOpen}
        className="relative w-10 h-10 rounded-xl flex items-center
                   justify-center transition-all hover:bg-white/20">
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full
                           bg-red-500 text-white text-xs font-bold
                           flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute left-0 top-12 w-80 bg-white rounded-2xl
                shadow-2xl border border-gray-100 z-[9999] overflow-hidden">

          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3"
               style={{ background: "#0A2342" }}>
            <p className="text-white font-bold text-sm">Notifications</p>
            {notifications.filter(n => isUnread(n)).length > 0 && (
              <span className="text-xs text-blue-300">
                {notifications.filter(n => isUnread(n)).length} new
              </span>
            )}
          </div>

          {/* LIST */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} onClick={() => handleClick(n)}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer
                             hover:bg-gray-50 border-b border-gray-50
                             transition-colors"
                  style={{ background: isUnread(n) ? "#EFF6FF" : "white" }}>

                  <div className="w-9 h-9 rounded-xl flex items-center
                                  justify-center text-lg flex-shrink-0"
                    style={{
                      background: isUnread(n) ? "#DBEAFE" : "#f3f4f6"
                    }}>
                    {TYPE_ICONS[n.type] || TYPE_ICONS.DEFAULT}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800
                                  leading-tight">
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5
                                  leading-relaxed">
                      {n.message}
                    </p>
                    {n.createdAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    )}
                  </div>

                  {isUnread(n) && (
                    <div className="w-2 h-2 rounded-full bg-blue-500
                                    flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* FOOTER */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100
                            bg-gray-50 text-center">
              <button
                onClick={async () => {
                  try {
                    await axios.put(
                      `${BASE}/notifications/mark-all-read`,
                      {},
                      authHeader()
                    );
                    setUnread(0);
                    setNotifications(prev =>
                      prev.map(n => ({ ...n, isRead: true }))
                    );
                  } catch {}
                }}
                className="text-xs font-medium"
                style={{ color: "#29ABE2" }}>
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}