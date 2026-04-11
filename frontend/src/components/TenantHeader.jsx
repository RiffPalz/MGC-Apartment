import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaRegBell,
  FaBell,
  FaChevronDown,
  FaSignOutAlt,
  FaUserCircle,
  FaCheck,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  fetchUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/tenantAPI/NotificationAPI";
import { fetchTenantProfile } from "../api/tenantAPI/tenantAuth";
import GeneralConfirmationModal from "./GeneralConfirmationModal";

const PAGE_TITLES = {
  "/tenant/dashboard": "Dashboard",
  "/tenant/maintenance": "Maintenance",
  "/tenant/payments": "Payments",
  "/tenant/contracts": "My Contract",
  "/tenant/announcements": "Announcements",
  "/tenant/myAccount": "My Account",
};

const fmtTime = (d) => {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function TenantHeader({ setOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const socket = useSocket();

  const [showMenu, setShowMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const lastFetchRef = useRef(0);
  const notifRef = useRef(null);
  const menuRef = useRef(null);
  const MIN_NOTIFICATION_REFRESH_MS = 10000;

  // Sync fresh profile data into AuthContext on mount so header always shows latest info
  useEffect(() => {
    fetchTenantProfile()
      .then((res) => { if (res?.user) updateUser(res.user); })
      .catch(() => {});
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const title = PAGE_TITLES[location.pathname] ?? "Tenant Portal";
  const displayName = user?.fullName || user?.userName || "Tenant";

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const unread = notifications.filter((n) => !n.is_read).length;

  const userId = user?.id || user?.ID;

  const loadNotifications = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < MIN_NOTIFICATION_REFRESH_MS) return;

    try {
      setNotifsLoading(true);
      const data = await fetchUserNotifications();
      const notificationsPayload =
        data?.notifications ??
        (Array.isArray(data) ? data : []);
      setNotifications(notificationsPayload);
      lastFetchRef.current = Date.now();
    } catch {
      /* silent */
    } finally {
      setNotifsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadNotifications();
  }, [userId, loadNotifications]);

  useEffect(() => {
    if (!userId) return;
    loadNotifications();
  }, [location.pathname, userId, loadNotifications]);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    };
    socket.on("new_notification", handleNewNotification);
    return () => socket.off("new_notification", handleNewNotification);
  }, [socket]);

  const markRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.ID === id ? { ...n, is_read: true } : n)),
      );
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-[#F2DED4] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shrink-0 shadow-sm">
        {/* LEFT SECTION (Original Tenant Style - Screenshot 2) */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setOpen?.((prev) => !prev)}
            className="p-2.5 text-[#5c1f10] hover:bg-[#FDF2ED] rounded-xl lg:hidden shrink-0 transition-all active:scale-95"
          >
            <FaBars size={18} />
          </button>
          <div className="min-w-0">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-widest leading-none truncate font-OswaldRegular">
              {title}
            </h2>
            <p className="text-[10px] font-bold text-[#D96648] mt-1 hidden sm:block uppercase tracking-widest opacity-70">
              Welcome back, {user?.unitNumber ? `UNIT ${user.unitNumber}` : "Tenant"}
            </p>
          </div>
        </div>

        {/* RIGHT SECTION (Original Tenant Style - Screenshot 2) */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          {/* NOTIFICATIONS DROPDOWN (Now Uses Admin Style from Screenshot 1) */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifs((p) => !p);
                setShowMenu(false);
                if (!showNotifs) loadNotifications();
              }}
              className={`relative p-2.5 rounded-xl transition-all active:scale-95 ${
                showNotifs
                  ? "bg-orange-50 text-[#db6747]"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <FaBell
                size={18}
                className={unread > 0 || showNotifs ? "text-[#db6747]" : ""}
              />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none border-2 border-white animate-pulse">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="fixed top-[72px] left-4 right-4 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-3 sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden sm:origin-top-right animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                {/* Header (Admin Style - Screenshot 1) */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                      <FaBell className="text-[#db6747] text-sm" />
                    </div>
                    <span className="text-sm font-black text-slate-800">
                      Notifications
                    </span>
                  </div>
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all uppercase tracking-widest"
                    >
                      <FaCheck size={10} className="text-blue-500" /> All Read
                    </button>
                  )}
                </div>

                {/* List (Admin Style - Screenshot 1) */}
                <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                  {notifsLoading ? (
                    <div className="py-10 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db6747] mx-auto" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                      <FaCheck className="text-emerald-400 text-xl mb-3" />
                      <p className="text-sm font-bold text-slate-800">
                        All caught up!
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        No new notifications.
                      </p>
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div
                        key={n.ID}
                        onClick={() => !n.is_read && markRead(n.ID)}
                        className={`flex gap-3 px-5 py-4 cursor-pointer transition-colors ${n.is_read ? "bg-white" : "bg-blue-50/30 hover:bg-blue-50/50"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? "bg-slate-200" : "bg-[#db6747]"}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <p
                              className={`text-[13px] font-bold truncate ${n.is_read ? "text-slate-600" : "text-slate-900"}`}
                            >
                              {n.title}
                            </p>
                            <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                              {fmtTime(n.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-[#F2DED4] hidden sm:block" />

          {/* User Profile Chip (Original Tenant Style - Screenshot 2) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                setShowMenu((p) => !p);
                setShowNotifs(false);
              }}
              className="flex items-center gap-3 group text-left transition-all"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-[#330101] leading-none truncate max-w-[140px] group-hover:text-[#D96648] transition-colors">
                  {displayName}
                </p>
                <p className="text-[10px] font-bold text-[#D96648] uppercase tracking-widest leading-none mt-1 opacity-80">
                  {user?.unitNumber ? `UNIT ${user.unitNumber}` : "TENANT"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-[#FDF2ED] border border-[#F2DED4] flex items-center justify-center text-[#D96648] font-black text-xs shadow-sm group-hover:bg-[#5c1f10] group-hover:text-white transition-all shrink-0">
                {initials}
              </div>
              <FaChevronDown
                size={10}
                className={`text-slate-300 transition-transform hidden sm:block ${showMenu ? "rotate-180" : ""}`}
              />
            </button>

            {showMenu && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-[#F2DED4] py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/tenant/myAccount");
                    }}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-bold text-slate-600 hover:bg-[#FDF2ED] hover:text-[#D96648] transition-colors"
                  >
                    <FaUserCircle size={14} /> My Account
                  </button>
                  <div className="h-px bg-[#F2DED4] my-1" />
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <FaSignOutAlt size={14} /> Log Out
                  </button>
                </div>
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
