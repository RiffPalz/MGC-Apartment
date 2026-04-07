import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBell,
  FaChevronDown,
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
  FaCheck,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import {
  fetchAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/adminAPI/NotificationAPI";
import GeneralConfirmationModal from "./GeneralConfirmationModal";
import { useSocket } from "../context/SocketContext";

// Page title mapping
const PAGE_TITLES = {
  "/admin": "Dashboard",
  "/admin/dashboard": "Dashboard",
  "/admin/tenants": "Tenants",
  "/admin/units": "Units",
  "/admin/payments": "Payment Overview",
  "/admin/maintenance": "Maintenance",
  "/admin/announcement": "Announcement",
  "/admin/contract": "Contract",
  "/admin/approvalpage": "Pending Approval",
  "/admin/applicationrequest": "Application Requests",
  "/admin/activity-logs": "Activity Logs",
  "/admin/settings": "Settings",
  "/admin/profile": "My Profile",
};

// Format time (e.g., 2m ago, 1h ago)
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

export default function AdminHeader({ open, setOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const socket = useSocket();

  const [showMenu, setShowMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const title = PAGE_TITLES[location.pathname] ?? "Admin Panel";
  const displayName = user?.fullName || user?.userName || "Administrator";
  const initial = displayName[0]?.toUpperCase() ?? "A";
  const unread = notifications.filter((n) => !n.is_read).length;

  // Fetch notifications
  const loadNotifications = useCallback(async () => {
    try {
      setNotifsLoading(true);
      const data = await fetchAdminNotifications();
      if (data.success) setNotifications(data.notifications || []);
    } catch {
    } finally {
      setNotifsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    };

    socket.on("new_notification", handleNewNotification);
    return () => socket.off("new_notification", handleNewNotification);
  }, [socket]);

  // Mark one notification as read
  const markRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.ID === id ? { ...n, is_read: true } : n)),
      );
    } catch {}
  };

  // Mark all as read
  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  // Logout handler
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Header */}
      <header className="h-16 bg-white/90 backdrop-blur-lg border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-sm">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen?.(!open)}>
            <FaBars />
          </button>

          <div>
            <h2>{title}</h2>
            <p>Welcome back, {displayName}</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div>
            <button onClick={() => setShowNotifs(!showNotifs)}>
              <FaBell />
              {unread > 0 && <span>{unread}</span>}
            </button>

            {showNotifs && (
              <div>
                <div>
                  <span>Notifications</span>
                  {unread > 0 && (
                    <button onClick={markAllRead}>All Read</button>
                  )}
                </div>

                {notifsLoading ? (
                  <p>Loading...</p>
                ) : notifications.length === 0 ? (
                  <p>No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.ID} onClick={() => markRead(n.ID)}>
                      <p>{n.title}</p>
                      <span>{fmtTime(n.created_at)}</span>
                      <p>{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div>
            <button onClick={() => setShowMenu(!showMenu)}>
              <span>{displayName}</span>
              <FaChevronDown />
            </button>

            {showMenu && (
              <div>
                <button onClick={() => navigate("/admin/profile")}>
                  <FaUserCircle /> Profile
                </button>
                <button onClick={() => navigate("/admin/settings")}>
                  <FaCog /> Settings
                </button>
                <button onClick={() => setShowLogoutConfirm(true)}>
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout modal */}
      <GeneralConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        variant="logout"
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
      />
    </>
  );
}
