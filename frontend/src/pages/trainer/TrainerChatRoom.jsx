import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const API    = "http://localhost:8080/api";
const WS_URL = "http://localhost:8080/ws";
const TEAL       = "#14b8a6";
const TEAL_DARK  = "#0d9488";
const TEAL_LIGHT = "#f0fdfa";

export default function TrainerChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const myId  = localStorage.getItem("userId");

  const [messages, setMessages]     = useState([]);
  const [clientName, setClientName] = useState(`Client #${id}`);
  const [message, setMessage]       = useState("");
  const [connected, setConnected]   = useState(false);
  const [sending, setSending]       = useState(false);

  const stompClient = useRef(null);
  const chatEndRef  = useRef(null);

  useEffect(() => {
    fetchHistory();
    connectWebSocket();
    return () => disconnectWebSocket();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/chat/conversation/${id}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data);
      if (res.data.length > 0) {
        const other = res.data.find(m => String(m.sender.id) !== String(myId));
        if (other) setClientName(other.sender.name);
      }
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
          if (String(newMsg.senderId) === String(id) || String(newMsg.receiverId) === String(id)) {
            setMessages(prev => {
              const exists = prev.find(m => m.id === newMsg.id);
              if (exists) return prev;
              return [...prev, {
                id: newMsg.id,
                sender:   { id: newMsg.senderId,   name: newMsg.senderName },
                receiver: { id: newMsg.receiverId },
                message:  newMsg.message,
                sentAt:   newMsg.sentAt,
                isRead:   newMsg.isRead,
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
    if (!message.trim()) return;
    setSending(true);
    if (connected && stompClient.current) {
      stompClient.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({
          senderId:   parseInt(myId),
          receiverId: parseInt(id),
          message:    message.trim(),
        }),
      });
      setMessage("");
      setSending(false);
    } else {
      try {
        await axios.post(`${API}/chat/send`,
          { receiverId: parseInt(id), message: message.trim() },
          { headers: { Authorization: `Bearer ${token}` } });
        setMessage("");
        fetchHistory();
      } catch { alert("Failed to send message"); }
      finally { setSending(false); }
    }
  };

  const formatTime = (t) => t ? new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
  const formatDate = (t) => t ? new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.sentAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="min-h-screen flex flex-col pb-4" style={{ background: "#f0fdf4" }}>

      {/* ── HEADER ── */}
      <div className="relative text-white px-8 py-6 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10,35,66,0.95) 0%, rgba(10,35,66,0.80) 50%, rgba(20,184,166,0.85) 100%), url('https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1400&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center",
        }}>
        <div className="absolute right-10 -top-4 w-40 h-40 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/trainer/chat")}
            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold text-lg transition-all flex-shrink-0">
            ←
          </button>
          <div className="w-12 h-12 rounded-full text-white font-bold text-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${TEAL_DARK}, ${TEAL})` }}>
            {clientName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black tracking-tight">{clientName}</h1>
            <p className="text-xs font-medium mt-0.5"
              style={{ color: connected ? "#99f6e4" : "rgba(255,255,255,0.5)" }}>
              {connected ? "● Connected" : "○ Connecting..."}
            </p>
          </div>
        </div>
      </div>

      {/* ── CHAT BOX ── */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 flex flex-col"
        style={{ height: "calc(100vh - 200px)" }}>
        <div className="bg-white rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-5" style={{ background: "#f8fafc" }}>
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 px-3 py-1 bg-white rounded-full border border-gray-100">{date}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                {msgs.map((msg, i) => {
                  const isMe = String(msg.sender.id) === String(myId);
                  return (
                    <div key={msg.id || i} className={`flex mb-3 ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center mr-2 flex-shrink-0 self-end"
                          style={{ background: TEAL }}>
                          {msg.sender.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="max-w-[65%]">
                        <div className="px-4 py-2.5 rounded-2xl text-sm"
                          style={{
                            background: isMe ? TEAL : "#ffffff",
                            color: isMe ? "white" : "#1f2937",
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            border: isMe ? "none" : "1px solid #e5e7eb",
                          }}>
                          {msg.message}
                        </div>
                        <p className={`text-xs text-gray-400 mt-1 ${isMe ? "text-right" : "text-left"}`}>
                          {formatTime(msg.sentAt)}
                          {isMe && <span className="ml-1">{msg.isRead ? " ✓✓" : " ✓"}</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: TEAL_LIGHT }}>💬</div>
                <p className="text-gray-500 font-semibold">Start the conversation!</p>
                <p className="text-gray-400 text-sm">Say hello to {clientName}</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT */}
          <div className="p-4 border-t border-gray-100 flex gap-3 items-center bg-white">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={`Message ${clientName}...`}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none text-sm bg-gray-50 transition-all"
              onFocus={e => e.target.style.borderColor = TEAL}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            <button onClick={sendMessage} disabled={sending || !message.trim()}
              className="w-12 h-12 rounded-xl text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 flex-shrink-0"
              style={{ background: TEAL }}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}