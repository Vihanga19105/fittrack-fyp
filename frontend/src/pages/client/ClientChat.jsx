import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const API = "http://localhost:8080/api";
const WS_URL = "http://localhost:8080/ws";
const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const NAVY = "#0A2342";

export default function ClientChat() {
  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  const [messages, setMessages] = useState([]);
  const [trainerInfo, setTrainerInfo] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noTrainer, setNoTrainer] = useState(false);
  const [connected, setConnected] = useState(false);

  const stompClient = useRef(null);
  const chatEndRef = useRef(null);
  const trainerIdRef = useRef(null);

  useEffect(() => {
    loadTrainer();
    return () => disconnectWebSocket();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadTrainer = async () => {
    try {
      const res = await axios.get(`${API}/chat/my-chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.length === 0) { setNoTrainer(true); setLoading(false); return; }
      const trainer = res.data[0];
      setTrainerInfo(trainer);
      trainerIdRef.current = trainer.userId;
      await fetchHistory(trainer.userId);
      connectWebSocket();
      setLoading(false);
    } catch {
      setNoTrainer(true);
      setLoading(false);
    }
  };

  const fetchHistory = async (trainerId) => {
    try {
      const res = await axios.get(`${API}/chat/conversation/${trainerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch {}
  };

  const connectWebSocket = () => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/user/${myId}/queue/messages`, (frame) => {
          const newMsg = JSON.parse(frame.body);
          const tid = trainerIdRef.current;
          if (String(newMsg.senderId) === String(tid) || String(newMsg.receiverId) === String(tid)) {
            setMessages(prev => {
              const exists = prev.find(m => m.id === newMsg.id);
              if (exists) return prev;
              return [...prev, {
                id: newMsg.id,
                sender: { id: newMsg.senderId, name: newMsg.senderName },
                receiver: { id: newMsg.receiverId },
                message: newMsg.message,
                sentAt: newMsg.sentAt,
                isRead: newMsg.isRead,
              }];
            });
          }
        });
      },
      onDisconnect: () => setConnected(false),
    });
    client.activate();
    stompClient.current = client;
  };

  const disconnectWebSocket = () => {
    if (stompClient.current) stompClient.current.deactivate();
  };

  const sendMessage = async () => {
    if (!message.trim() || !trainerInfo) return;
    setSending(true);
    if (connected && stompClient.current) {
      stompClient.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({
          senderId: parseInt(myId),
          receiverId: trainerInfo.userId,
          message: message.trim(),
        }),
      });
      setMessage("");
      setSending(false);
    } else {
      try {
        await axios.post(`${API}/chat/send`, {
          receiverId: trainerInfo.userId,
          message: message.trim(),
        }, { headers: { Authorization: `Bearer ${token}` } });
        setMessage("");
        fetchHistory(trainerInfo.userId);
      } catch { alert("Failed to send message"); }
      finally { setSending(false); }
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return new Date(timeStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timeStr) => {
    if (!timeStr) return "";
    const d = new Date(timeStr);
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.sentAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#f0f9ff" }}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">💬</div>
          <p className="text-gray-400 animate-pulse">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  if (noTrainer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: "#f0f9ff" }}>
        <div className="text-8xl">💬</div>
        <h2 className="text-2xl font-bold text-gray-600">No Active Trainer</h2>
        <p className="text-gray-400 text-sm text-center max-w-sm">You need an active subscription to chat with your trainer!</p>
        <button onClick={() => window.location.href = "/trainers"}
          className="px-6 py-3 rounded-xl text-white font-semibold"
          style={{ background: BLUE }}>
          Find a Trainer
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f0f9ff" }}>

      {/* ── HERO ── */}
      <div
        className="relative text-white px-8 py-14 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.92) 0%, rgba(10,35,66,0.70) 50%, rgba(41,171,226,0.80) 100%), url('https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1400&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>

        <div className="absolute right-10 -top-6 w-56 h-56 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-40 top-16 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-6 flex-wrap">

            {/* LEFT — trainer info with photo */}
            <div className="flex items-center gap-4">
              {/* ✅ FIXED: shows trainer photo in hero */}
              {trainerInfo?.profileImage ? (
                <img
                  src={trainerInfo.profileImage}
                  alt={trainerInfo.userName}
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-4 border-white/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 text-white font-black text-2xl flex items-center justify-center border-4 border-white/30 flex-shrink-0">
                  {trainerInfo?.userName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-0.5">Your Trainer</p>
                <h1 className="text-3xl font-black tracking-tight">{trainerInfo?.userName}</h1>
                <p className="text-sm mt-1">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* RIGHT — connection status */}
            <div className="bg-white/15 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 text-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: connected ? "#86efac" : "#fca5a5" }} />
                <p className="font-semibold text-sm text-white">
                  {connected ? "Connected" : "Connecting..."}
                </p>
              </div>
              <p className="text-xs text-blue-200 mt-1">Real-time chat</p>
            </div>
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="max-w-4xl mx-auto px-4 py-5">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col"
          style={{ height: "calc(100vh - 300px)", minHeight: "450px" }}>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-5 space-y-1" style={{ background: "#f8fafc" }}>

            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 px-3 py-1 bg-white rounded-full border border-gray-100 font-medium">
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {msgs.map((msg, i) => {
                  const isMe = String(msg.sender.id) === String(myId);
                  return (
                    <div key={msg.id || i}
                      className={`flex mb-3 ${isMe ? "justify-end" : "justify-start"}`}>

                      {/* ✅ FIXED: trainer avatar in messages shows photo */}
                      {!isMe && (
                        trainerInfo?.profileImage ? (
                          <img
                            src={trainerInfo.profileImage}
                            alt={msg.sender.name}
                            className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0 self-end border"
                            style={{ borderColor: BLUE }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center mr-2 flex-shrink-0 self-end"
                            style={{ background: BLUE }}>
                            {msg.sender.name?.charAt(0).toUpperCase()}
                          </div>
                        )
                      )}

                      <div className="max-w-[65%]">
                        <div className={`px-4 py-2.5 text-sm leading-relaxed ${isMe ? "rounded-2xl rounded-br-sm text-white" : "rounded-2xl rounded-bl-sm text-gray-800"}`}
                          style={{
                            background: isMe ? `linear-gradient(135deg, ${BLUE_DARK}, ${BLUE})` : "#ffffff",
                            border: isMe ? "none" : "1px solid #e5e7eb",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                          }}>
                          {msg.message}
                        </div>
                        <p className={`text-xs text-gray-400 mt-1 ${isMe ? "text-right" : "text-left"}`}>
                          {formatTime(msg.sentAt)}
                          {isMe && (
                            <span className="ml-1" style={{ color: msg.isRead ? BLUE : "#9ca3af" }}>
                              {msg.isRead ? " ✓✓" : " ✓"}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                  style={{ background: "#E8F7FD" }}>👋</div>
                <p className="font-semibold text-gray-600">Say hello to {trainerInfo?.userName}!</p>
                <p className="text-xs text-gray-400">Start your fitness conversation</p>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* INPUT BAR */}
          <div className="px-4 py-3 border-t border-gray-100 flex gap-3 items-center bg-white">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={`Message ${trainerInfo?.userName}...`}
              className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none text-sm bg-gray-50 transition-all"
              onFocus={e => e.target.style.borderColor = BLUE}
              onBlur={e => e.target.style.borderColor = "#f3f4f6"} />
            <button
              onClick={sendMessage}
              disabled={sending || !message.trim()}
              className="w-11 h-11 rounded-xl text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 flex-shrink-0 hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${BLUE_DARK}, ${BLUE})` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}