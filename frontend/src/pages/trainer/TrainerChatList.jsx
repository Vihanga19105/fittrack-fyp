import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:8080/api";
const TEAL       = "#14b8a6";
const TEAL_DARK  = "#0d9488";
const TEAL_LIGHT = "#f0fdfa";

export default function TrainerChatList() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchChats = async () => {
    try {
      const res = await axios.get(`${API}/chat/my-chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(res.data);
      setLoading(false);
    } catch { setLoading(false); }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const diff = new Date() - new Date(timeStr);
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)  return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24)return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: "#f0fdf4" }}>

      {/* ── HERO ── */}
      <div className="relative text-white px-8 py-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.65) 50%, rgba(20,184,166,0.80) 100%), url('https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", minHeight: "180px",
        }}>
        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Messages</p>
            <h1 className="text-4xl font-black tracking-tight">Client Chats 💬</h1>
            <p className="text-teal-100 mt-1 text-sm">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-teal-200 text-sm mt-1">
              {chats.filter(c => c.unreadCount > 0).length > 0
                ? `${chats.filter(c => c.unreadCount > 0).length} unread conversation${chats.filter(c => c.unreadCount > 0).length !== 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
          <div className="hidden md:block bg-white/15 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 text-center">
            <p className="text-xs text-teal-200 mb-1">Total Chats</p>
            <p className="text-4xl font-black text-white">{chats.length}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 rounded-full border-4 animate-spin mx-auto mb-3"
                style={{ borderColor: TEAL, borderTopColor: "transparent" }} />
              <p className="text-gray-400 animate-pulse">Loading chats...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-14 px-6">
              <p className="text-5xl mb-4">💬</p>
              <p className="text-lg font-bold text-gray-700">No chats yet</p>
              <p className="text-sm text-gray-400 mt-2">Chats appear when clients subscribe to you</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {chats.map(chat => (
                <div key={chat.userId}
                  onClick={() => navigate(`/trainer/chat/${chat.userId}`)}
                  className="flex justify-between items-center px-5 py-4 cursor-pointer transition-all hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full text-white font-bold text-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${TEAL_DARK}, ${TEAL})` }}>
                        {chat.userName?.charAt(0).toUpperCase()}
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                          style={{ background: "#ef4444" }}>
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800"
                        style={{ color: chat.unreadCount > 0 ? "#111827" : "#374151" }}>
                        {chat.userName}
                      </h3>
                      <p className="text-sm text-gray-500 truncate max-w-xs"
                        style={{ fontWeight: chat.unreadCount > 0 ? "600" : "400" }}>
                        {chat.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <p className="text-xs text-gray-400">{formatTime(chat.lastMessageTime)}</p>
                    <span className="text-gray-300 text-lg">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}