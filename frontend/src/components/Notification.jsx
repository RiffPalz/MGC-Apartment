import { useState, useEffect, useRef, useCallback } from "react";
import { FaBell, FaCheck, FaCheckDouble } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { useLocation } from "react-router-dom";
import { fetchUserNotifications, markNotificationRead, markAllNotificationsRead } from "../api/tenantAPI/NotificationAPI";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const TYPE_STYLES = {
  payment: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  maintenance: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  contract: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  announcement: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  default: { bg: "bg-[#FDF2ED]", text: "text-[#5c1f10]", dot: "bg-[#D96648]" },
};

const getTypeStyle = (type = "") => TYPE_STYLES[type?.toLowerCase()] || TYPE_STYLES.default;

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
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
  const location = useLocation();
  const lastFetchRef = useRef(0);
  const MIN_NOTIFICATION_REFRESH_MS = 10000;

  const loadNotifications = useCallback(async () => {
    if (userRole !== "tenant" || authLoading) return;
    const now = Date.now();
    if (now - lastFetchRef.current < MIN_NOTIFICATION_REFRESH_MS) return;

    setLoading(true);
    try {
      const data = await fetchUserNotifications();
      setNotifications(data.notifications || []);
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userRole, authLoading]);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Refresh notifications when user navigates to a different page
  useEffect(() => {
    loadNotifications();
  }, [location.pathname, loadNotifications]);

  // WebSocket listeners
  useEffect(() => {
    if (!socket) return;
    const handler = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };
    socket.on("new_notification", handler);
    return () => socket.off("new_notification", handler);
  }, [socket]);

  // Handle outside clicks
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

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all active:scale-95 ${isOpen ? "bg-[#FDF2ED] text-[#D96648]" : "text-[#330101]/50 hover:bg-[#FDF2ED] hover:text-[#D96648]"
          }`}
        aria-label="Notifications"
      >
        <FaBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-4 h-4 bg-[#D96648] text-white text-[9px] font-black px-1 rounded-full border-2 border-white flex items-center justify-center leading-none shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── MOBILE BACKDROP ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── RESPONSIVE DROPDOWN PANEL ── */}
      {isOpen && (
        <div className="fixed top-[76px] left-4 right-4 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-3 sm:w-[380px] bg-white rounded-2xl shadow-2xl sm:shadow-xl border border-[#F2DED4] z-50 overflow-hidden sm:origin-top-right animate-in fade-in zoom-in-95 duration-200 flex flex-col">

          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2DED4] bg-[#FFF9F6] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FDF2ED] flex items-center justify-center">
                <FaBell className="text-[#D96648] text-sm" />
              </div>
              <span className="text-sm font-black text-[#330101]">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-[#D96648]/10 text-[#D96648] text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  title="Mark all as read"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-[#330101]/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-[#F2DED4] rounded-lg transition-all uppercase tracking-widest"
                >
                  <FaCheckDouble size={12} className="text-[#D96648]" /> All Read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#330101]/40 hover:text-[#330101] hover:bg-[#F2DED4] transition-colors"
              >
                <MdClose size={18} />
              </button>
            </div>
          </div>

          {/* Added max-h-[60vh] to handle small mobile screens properly without overflowing the bottom */}
          <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-5 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#F2DED4] mt-2 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-[#F2DED4] rounded w-2/3" />
                      <div className="h-2.5 bg-[#F2DED4]/50 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-[#FDF2ED] flex items-center justify-center mb-4">
                  <FaCheck className="text-[#D96648] text-xl" />
                </div>
                <p className="text-sm font-bold text-[#330101]">You're all caught up!</p>
                <p className="text-xs text-[#330101]/50 mt-1">No new notifications to display.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F2DED4]/50">
                {notifications.map((n) => {
                  const id = n.ID || n.id;
                  const style = getTypeStyle(n.type);

                  return (
                    <div
                      key={id}
                      className={`flex gap-3 px-5 py-4 transition-all hover:bg-[#FFF9F6] ${!n.is_read ? "bg-[#FDF2ED]/30" : "bg-white"
                        }`}
                    >
                      <div className="mt-1.5 shrink-0 flex items-center justify-center w-2 h-2">
                        <span className={`block w-2 h-2 rounded-full ${n.is_read ? "bg-[#F2DED4]" : style.dot}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className={`text-[13px] font-bold leading-tight truncate ${n.is_read ? "text-[#330101]/60" : "text-[#330101]"}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] font-semibold text-[#330101]/40 shrink-0 mt-0.5">
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-[#330101]/60 mt-1.5 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          {n.type && (
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${style.bg} ${style.text} border-[#F2DED4]/50`}>
                              {n.type}
                            </span>
                          )}

                          {!n.is_read && (
                            <button
                              onClick={(e) => handleMarkRead(id, e)}
                              title="Mark as read"
                              className="shrink-0 p-1.5 rounded-lg text-[#D96648]/60 hover:text-[#D96648] hover:bg-[#FDF2ED] transition-colors"
                            >
                              <FaCheck size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-[#F2DED4] bg-[#FFF9F6] shrink-0">
              <p className="text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest text-center">
                {unreadCount > 0 ? `${unreadCount} unread messages` : "All notifications read"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}