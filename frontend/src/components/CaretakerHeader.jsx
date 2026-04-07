import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaRegBell, FaBell, FaChevronDown, FaSignOutAlt, FaUserCircle, FaCheck } from "react-icons/fa";
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

  // Real-time listener
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    };
    socket.on("new_notification", handleNewNotification);
    return () => socket.off("new_notification", handleNewNotification);
  }, [socket]);

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
          <div className="relative">
            <button onClick={() => { setShowNotifs((p) => !p); setShowMenu(false); if (!showNotifs) loadNotifications(); }}
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
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                      <FaBell className="text-[#db6747] text-sm" />
                    </div>
                    <span className="text-sm font-black text-slate-800">Notifications</span>
                  </div>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all uppercase tracking-widest">
                      <FaCheck size={10} className="text-blue-500" /> All Read
                    </button>
                  )}
                </div>

                <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                  {notifsLoading ? (
                    <div className="py-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db6747] mx-auto" /></div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                        <FaCheck className="text-emerald-400 text-xl" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">All caught up!</p>
                      <p className="text-xs text-slate-500 mt-1">No new notifications.</p>
                    </div>
                  ) : notifications.slice(0, 20).map((n) => (
                    <div key={n.ID} onClick={() => !n.is_read && markRead(n.ID)}
                      className={`flex gap-3 px-5 py-4 cursor-pointer transition-colors ${n.is_read ? "bg-white hover:bg-slate-50" : "bg-blue-50/30 hover:bg-blue-50/50"}`}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? "bg-slate-200" : "bg-[#db6747]"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className={`text-[13px] font-bold truncate ${n.is_read ? "text-slate-600" : "text-slate-900"}`}>{n.title}</p>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">{fmtTime(n.created_at)}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          {/* Profile Dropdown */}
          <div className="relative">
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