import { useState, useEffect, useCallback, useRef } from "react";
import { useDebounceCallback } from "../hooks/useDebounceCallback";
import { useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaRegBell, FaBell, FaChevronDown, FaSignOutAlt, FaUserCircle, FaCheck, FaCheckDouble } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import { fetchCaretakerNotifications, markNotificationRead, markAllNotificationsRead } from "../api/caretakerAPI/NotificationAPI";
import { clearAuth } from "../api/authStorage";
import GeneralConfirmationModal from "./GeneralConfirmationModal";
import { useSocket } from "../context/SocketContext";

const PAGE_TITLES = {
  "/caretaker/dashboard": "Dashboard",
  "/caretaker/tenants": "Tenants",
  "/caretaker/maintenance": "Maintenance",
  "/caretaker/payments": "Payment Overview",
  "/caretaker/announcements": "Announcements",
  "/caretaker/activity-logs": "Activity Logs",
  "/caretaker/settings": "Settings",
  "/caretaker/profile": "My Profile",
};

const fmtTime = (d) => {
  if (!d) return "";
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const TYPE_STYLES = {
  payment:      { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500" },
  maintenance:  { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  contract:     { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  announcement: { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500" },
  default:      { bg: "bg-orange-50", text: "text-[#db6747]",  dot: "bg-[#db6747]" },
};
const getTypeStyle = (type = "") => TYPE_STYLES[type?.toLowerCase()] || TYPE_STYLES.default;

export default function CaretakerHeader({ open, setOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [showMenu, setShowMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const title = PAGE_TITLES[location.pathname] ?? "Caretaker Panel";
  const displayName = user?.fullName || user?.username || "Caretaker";
  const initial = displayName[0]?.toUpperCase() ?? "C";
  const unread = notifications.filter((n) => !n.is_read).length;

  // Initial load
  const loadNotifications = useCallback(async () => {
    try {
      setNotifsLoading(true);
      const data = await fetchCaretakerNotifications();
      if (data.success) setNotifications(data.notifications || []);
    } catch { /* silent */ }
    finally { setNotifsLoading(false); }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Refresh when navigating to a different page — same as tenant
  useEffect(() => { loadNotifications(); }, [location.pathname, loadNotifications]);

  // Real-time listener — debounced so rapid events don't flood requests
  const debouncedLoad = useDebounceCallback(loadNotifications, 1500);
  useEffect(() => {
    if (!socket) return;
    socket.on("new_notification", debouncedLoad);
    return () => socket.off("new_notification", debouncedLoad);
  }, [socket, debouncedLoad]);

  // Actions
  const markRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((p) => p.map((n) => n.ID === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((p) => p.map((n) => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  };

  const handleLogout = () => { clearAuth(); navigate("/login", { replace: true }); };

  return (
    <>
      <header className="h-16 bg-white/90 backdrop-blur-lg border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shrink-0 shadow-sm">

        {/* Left Section */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setOpen?.(!open)} className="p-2.5 text-slate-500 hover:text-[#db6747] hover:bg-orange-50 rounded-xl lg:hidden shrink-0 transition-colors active:scale-95">
            <FaBars size={18} />
          </button>
          <div className="min-w-0">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-widest leading-none truncate font-OswaldRegular">
              {title}
            </h2>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => { setShowNotifs((p) => !p); setShowMenu(false); }}
              className={`relative p-2.5 rounded-xl transition-all active:scale-95 ${showNotifs ? "bg-orange-50 text-[#db6747]" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}>
              <FaBell size={18} className={unread > 0 || showNotifs ? "text-[#db6747]" : ""} />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none border-2 border-white shadow-sm animate-pulse">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {showNotifs && <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setShowNotifs(false)} />}

            {showNotifs && (
              <div className="fixed top-[72px] left-4 right-4 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-3 sm:w-[380px] bg-white rounded-2xl shadow-2xl sm:shadow-xl border border-slate-200 z-50 overflow-hidden sm:origin-top-right animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                      <FaBell className="text-[#db6747] text-sm" />
                    </div>
                    <span className="text-sm font-black text-slate-800">Notifications</span>
                    {unread > 0 && (
                      <span className="bg-[#db6747]/10 text-[#db6747] text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                        {unread} New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {unread > 0 && (
                      <button onClick={markAllRead} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all uppercase tracking-widest">
                        <FaCheckDouble size={12} className="text-[#db6747]" /> All Read
                      </button>
                    )}
                    <button onClick={() => setShowNotifs(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                      <MdClose size={18} />
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto custom-scrollbar">
                  {notifsLoading ? (
                    <div className="p-5 space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse flex gap-4">
                          <div className="w-2 h-2 rounded-full bg-slate-200 mt-2 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                            <div className="h-2.5 bg-slate-100 rounded w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                      <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
                        <FaCheck className="text-[#db6747] text-xl" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">You're all caught up!</p>
                      <p className="text-xs text-slate-500 mt-1">No new notifications to display.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.slice(0, 20).map((n) => {
                        const style = getTypeStyle(n.type);
                        return (
                          <div key={n.ID}
                            className={`flex gap-3 px-5 py-4 transition-all hover:bg-slate-50 ${!n.is_read ? "bg-orange-50/20" : "bg-white"}`}>
                            <div className="mt-1.5 shrink-0 flex items-center justify-center w-2 h-2">
                              <span className={`block w-2 h-2 rounded-full ${n.is_read ? "bg-slate-200" : style.dot}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <p className={`text-[13px] font-bold leading-tight truncate ${n.is_read ? "text-slate-500" : "text-slate-900"}`}>
                                  {n.title}
                                </p>
                                <span className="text-[10px] font-semibold text-slate-400 shrink-0 mt-0.5">
                                  {fmtTime(n.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{n.message}</p>
                              <div className="flex items-center justify-between mt-3">
                                {n.type && (
                                  <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${style.bg} ${style.text} border-slate-100`}>
                                    {n.type}
                                  </span>
                                )}
                                {!n.is_read && (
                                  <button onClick={(e) => { e.stopPropagation(); markRead(n.ID); }}
                                    title="Mark as read"
                                    className="shrink-0 p-1.5 rounded-lg text-[#db6747]/60 hover:text-[#db6747] hover:bg-orange-50 transition-colors">
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

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                      {unread > 0 ? `${unread} unread messages` : "All notifications read"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          {/* Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => { setShowMenu((p) => !p); setShowNotifs(false); }} className="flex items-center gap-3 group text-left transition-all">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-[#db6747] uppercase tracking-widest leading-none mb-1">Caretaker</p>
                <p className="text-sm font-bold text-slate-800 leading-none truncate max-w-[140px] group-hover:text-[#db6747] transition-colors">{displayName}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#db6747] font-black text-sm shadow-sm group-hover:bg-[#db6747] group-hover:text-white transition-all shrink-0">
                {initial}
              </div>
              <FaChevronDown size={10} className={`text-slate-400 transition-transform hidden sm:block ${showMenu ? "rotate-180" : ""}`} />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                  <button onClick={() => { setShowMenu(false); navigate("/caretaker/profile"); }}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-bold text-slate-600 hover:bg-slate-50 hover:text-[#db6747] transition-colors">
                    <FaUserCircle size={14} /> My Profile
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button onClick={() => { setShowMenu(false); setShowLogoutConfirm(true); }}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-50 transition-colors">
                    <FaSignOutAlt size={14} /> Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <GeneralConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        variant="logout"
        title="Log Out"
        message="Are you sure you want to log out of your session?"
        confirmText="Log Out"
      />
    </>
  );
}