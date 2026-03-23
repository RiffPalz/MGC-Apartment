import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaBars, FaRegBell, FaChevronDown, FaCog, FaSignOutAlt, FaUserCircle,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const PAGE_TITLES = {
  "/admin":             "Dashboard",
  "/admin/dashboard":   "Dashboard",
  "/admin/tenants":     "Tenants",
  "/admin/units":       "Units",
  "/admin/payments":    "Payments",
  "/admin/maintenance": "Maintenance",
  "/admin/announcements": "Announcements",
  "/admin/contracts":   "Contracts",
  "/admin/approvalpage": "Pending Approvals",
  "/admin/activitylogs": "Activity Logs",
  "/admin/settings":    "Settings",
};

export default function AdminHeader({ open, setOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const title = PAGE_TITLES[location.pathname] ?? "Admin Panel";
  const displayName = user?.fullName || user?.userName || "Administrator";
  const initial = displayName[0]?.toUpperCase() ?? "A";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shrink-0">
      {/* LEFT: hamburger + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setOpen?.(!open)}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden shrink-0"
        >
          <FaBars size={18} />
        </button>
        <div className="min-w-0">
          <h2 className="text-base font-black text-[#1a1a2e] uppercase tracking-widest leading-none truncate font-OswaldRegular">
            {title}
          </h2>
          <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">
            Welcome back, {displayName}
          </p>
        </div>
      </div>

      {/* RIGHT: bell + profile */}
      <div className="flex items-center gap-3 shrink-0">
        <button className="relative p-2 text-gray-400 hover:text-[#db6747] hover:bg-orange-50 rounded-full transition-colors">
          <FaRegBell size={18} />
        </button>

        <div className="h-7 w-px bg-gray-200 hidden sm:block" />

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((p) => !p)}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#3a0f08] to-[#db6747] flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
              {initial}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-gray-700 leading-none">{displayName}</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">
                {user?.role ?? "Admin"}
              </p>
            </div>
            <FaChevronDown
              size={11}
              className={`text-gray-400 transition-transform hidden sm:block ${showMenu ? "rotate-180" : ""}`}
            />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20">
                <button
                  onClick={() => { setShowMenu(false); navigate("/admin/settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#db6747] transition-colors"
                >
                  <FaCog size={13} /> Settings
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
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
