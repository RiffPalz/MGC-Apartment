import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaRegBell, FaBell, FaChevronDown, FaSignOutAlt, FaUserCircle, FaCheck } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { fetchCaretakerNotifications, markNotificationRead, markAllNotificationsRead } from "../api/caretakerAPI/NotificationAPI";
import { clearAuth } from "../api/authStorage";

const PAGE_TITLES = {
  "/caretaker/dashboard":     "Dashboard",
  "/caretaker/maintenance":   "Maintenance",
  "/caretaker/payments":      "Payment Overview",
  "/caretaker/announcements": "Announcements",
  "/caretaker/activity-logs": "Activity Logs",
  "/caretaker/settings":      "Settings",
  "/caretaker/profile":       "My Profile",
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

  const [showMenu, setShowMenu]           = useState(false);
  const [showNotifs, setShowNotifs]       = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);

  const title       = PAGE_TITLES[location.pathname] ?? "Caretaker Panel";
  const displayName = user?.fullName || user?.username || "Caretaker";
  const initial     = displayName[0]?.toUpperCase() ?? "C";
  const unread      = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = useCallback(async () => {
    try {
      setNotifsLoading(true);
      const data = await fetchCaretakerNotifications();
      if (data.success) setNotifications(data.notifications || []);
    } catch { /* silent */ }
    finally { setNotifsLoading(false); }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

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
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={() => setOpen?.(!open)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden shrink-0">
          <FaBars size={18} />
        </button>
        <div className="min-w-0">
          <h2 className="text-base font-black text-[#1a1a2e] uppercase tracking-widest leading-none truncate font-OswaldRegular">{title}</h2>
          <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">Welcome back, {displayName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notifications */}
        <div className="relative">
          <button onClick={() => { setShowNotifs((p) => !p); setShowMenu(false); if (!showNotifs) loadNotifications(); }}
            className="relative p-2 text-gray-400 hover:text-[#db6747] hover:bg-orange-50 rounded-full transition-colors">
            {unread > 0 ? <FaBell size={18} className="text-[#db6747]" /> : <FaRegBell size={18} />}
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Notifications</p>
                    {unread > 0 && <p className="text-[10px] text-slate-400 mt-0.5">{unread} unread</p>}
                  </div>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] font-bold text-[#db6747] hover:text-[#c45a3a] uppercase tracking-widest">
                      <FaCheck size={9} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {notifsLoading ? (
                    <div className="py-10 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#db6747] mx-auto" /></div>
                  ) : notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <FaRegBell className="text-slate-200 mx-auto mb-2" size={28} />
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No notifications</p>
                    </div>
                  ) : notifications.slice(0, 20).map((n) => (
                    <div key={n.ID} onClick={() => !n.is_read && markRead(n.ID)}
                      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors ${n.is_read ? "bg-white hover:bg-slate-50" : "bg-orange-50/60 hover:bg-orange-50"}`}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? "bg-slate-200" : "bg-[#db6747]"}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${n.is_read ? "text-slate-600" : "text-slate-900"}`}>{n.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{fmtTime(n.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-7 w-px bg-gray-200 hidden sm:block" />

        {/* Profile dropdown */}
        <div className="relative">
          <button onClick={() => { setShowMenu((p) => !p); setShowNotifs(false); }} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#3a0f08] to-[#db6747] flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
              {initial}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-gray-700 leading-none">{displayName}</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">Caretaker</p>
            </div>
            <FaChevronDown size={11} className={`text-gray-400 transition-transform hidden sm:block ${showMenu ? "rotate-180" : ""}`} />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20">
                <button onClick={() => { setShowMenu(false); navigate("/caretaker/profile"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#db6747] transition-colors">
                  <FaUserCircle size={13} /> My Profile
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                  <FaSignOutAlt size={13} /> Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
