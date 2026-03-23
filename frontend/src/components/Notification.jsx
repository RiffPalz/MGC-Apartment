import { useState, useEffect, useRef, useCallback } from "react";
import { FaBell, FaCheck, FaCheckDouble } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { fetchUserNotifications, markNotificationRead, markAllNotificationsRead } from "../api/tenantAPI/NotificationAPI";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const TYPE_STYLES = {
  payment:     { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500" },
  maintenance: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  contract:    { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  announcement:{ bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  default:     { bg: "bg-[#FDF2ED]", text: "text-[#5c1f10]",  dot: "bg-[#D96648]" },
};

const getTypeStyle = (type = "") => TYPE_STYLES[type?.toLowerCase()] || TYPE_STYLES.default;

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export default function Notification({ userRole }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const socket = useSocket();
  const { loading: authLoading } = useAuth();

  const loadNotifications = useCallback(async () => {
    if (userRole !== "tenant" || authLoading) return;
    setLoading(true);
    try {
      const data = await fetchUserNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userRole, authLoading]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time: listen for new notifications
  useEffect(() => {
    if (!socket) return;
    const handler = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };
    socket.on("new_notification", handler);
    return () => socket.off("new_notification", handler);
  }, [socket]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.ID === id || n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-[#330101]/50 hover:text-[#D96648] hover:bg-[#FDF2ED] transition-all active:scale-95"
        aria-label="Notifications"
      >
        <FaBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#D96648] text-white text-[9px] font-black px-1 rounded-full border-2 border-white flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#F2DED4] z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F2DED4] bg-[#FDF2ED]">
            <div className="flex items-center gap-2">
              <FaBell className="text-[#D96648] text-sm" />
              <span className="text-sm font-black text-[#330101]">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-[#D96648] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  title="Mark all as read"
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#5c1f10] hover:bg-[#F2DED4] rounded-lg transition-colors"
                >
                  <FaCheckDouble size={10} />
                  <span>All read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[#330101]/40 hover:text-[#330101] hover:bg-[#F2DED4] transition-colors"
              >
                <MdClose size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-100 mt-1.5 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-slate-100 rounded w-3/4" />
                      <div className="h-2.5 bg-slate-50 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FDF2ED] flex items-center justify-center mb-3">
                  <FaBell className="text-[#D96648]/40 text-xl" />
                </div>
                <p className="text-sm font-bold text-[#330101]/60">All caught up</p>
                <p className="text-xs text-[#330101]/30 mt-0.5">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F2DED4]">
                {notifications.map((n) => {
                  const id = n.ID || n.id;
                  const style = getTypeStyle(n.type);
                  return (
                    <div
                      key={id}
                      className={`flex gap-3 px-4 py-3.5 transition-colors ${
                        !n.is_read ? "bg-[#FFF9F6]" : "bg-white hover:bg-[#FFF9F6]/50"
                      }`}
                    >
                      {/* Dot */}
                      <div className="mt-1.5 shrink-0">
                        <span className={`block w-2 h-2 rounded-full ${n.is_read ? "bg-slate-200" : style.dot}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-black leading-tight ${n.is_read ? "text-[#330101]/60" : "text-[#330101]"}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-[#330101]/30 shrink-0 mt-0.5">
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-[#330101]/50 mt-0.5 leading-snug line-clamp-2">
                          {n.message}
                        </p>
                        {n.type && (
                          <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${style.bg} ${style.text}`}>
                            {n.type}
                          </span>
                        )}
                      </div>

                      {/* Mark read button */}
                      {!n.is_read && (
                        <button
                          onClick={(e) => handleMarkRead(id, e)}
                          title="Mark as read"
                          className="shrink-0 mt-1 p-1 rounded-lg text-[#D96648]/60 hover:text-[#D96648] hover:bg-[#FDF2ED] transition-colors"
                        >
                          <FaCheck size={10} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-[#F2DED4] bg-[#FFF9F6]">
              <p className="text-[10px] text-[#330101]/30 text-center">
                {unreadCount > 0 ? `${unreadCount} unread` : "All notifications read"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
