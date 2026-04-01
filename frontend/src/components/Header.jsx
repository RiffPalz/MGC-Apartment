import { useLocation, useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./Notification";

const PAGE_TITLES = {
  "/tenant/dashboard": { title: "Dashboard", subtitle: "Overview of your unit" },
  "/tenant/maintenance": { title: "Maintenance", subtitle: "Submit and track repair requests" },
  "/tenant/contract": { title: "My Contract", subtitle: "View your lease agreement" },
  "/tenant/payment": { title: "Payments", subtitle: "Manage your bills and receipts" },
  "/tenant/myAccount": { title: "Account Settings", subtitle: "Manage your account settings" },
  "/tenant/activityLogs": { title: "Activity Logs", subtitle: "Track your recent account activity" },
  "/admin/dashboard": { title: "Dashboard", subtitle: "Admin overview" },
  "/caretaker/dashboard": { title: "Dashboard", subtitle: "Caretaker overview" },
};

const UserHeader = ({ onMenuClick }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Smooth loading skeleton to prevent UI jumping
  if (!user) {
    return (
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-[#F2DED4] px-5 sm:px-8 py-3.5 shadow-sm">
        <div className="flex items-center justify-between animate-pulse">
          <div className="space-y-2.5">
            <div className="h-4 bg-[#F2DED4]/50 rounded w-32" />
            <div className="h-2.5 bg-[#F2DED4]/30 rounded w-24" />
          </div>
          <div className="h-10 w-10 bg-[#F2DED4]/50 rounded-xl" />
        </div>
      </div>
    );
  }

  const matched = PAGE_TITLES[location.pathname]
    || Object.entries(PAGE_TITLES).find(([key]) => location.pathname.startsWith(key))?.[1];

  const pageTitle = matched?.title || "Dashboard";
  const pageSub = matched?.subtitle || "System Overview";

  const initials = (user.fullName || user.userName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-30 border-b border-[#F2DED4] px-5 sm:px-8 py-3.5 shadow-sm">
      <div className="relative flex items-center justify-between gap-4">

        {/* HAMBURGER — mobile only */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 rounded-xl text-[#5c1f10] hover:bg-[#FDF2ED] hover:text-[#D96648] transition-all active:scale-95 shrink-0"
            aria-label="Open menu"
          >
            <FaBars size={18} />
          </button>
        )}

        {/* CENTER: page title (Hidden on very small screens to save space) */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none hidden sm:block">
          <h2 className="text-base font-black text-[#330101] tracking-tight leading-tight whitespace-nowrap">
            {pageTitle}
          </h2>
          {pageSub && (
            <p className="text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest mt-0.5">
              {pageSub}
            </p>
          )}
        </div>

        {/* Mobile Page Title */}
        <div className="sm:hidden flex-1 min-w-0">
          <h2 className="text-sm font-black text-[#330101] tracking-tight truncate">
            {pageTitle}
          </h2>
        </div>

        {/* RIGHT: notifications + avatar */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0 ml-auto">

          <NotificationBell userRole={user.role} />

          <div className="h-8 w-px bg-[#F2DED4] hidden sm:block" />

          <button
            className="flex items-center gap-3 group text-left transition-all"
            onClick={() => user.role === "tenant" && navigate("/tenant/myAccount")}
          >
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold text-[#D96648] uppercase tracking-widest leading-none mb-1">
                {user.role === "admin" ? "Administrator" : user.role === "caretaker" ? "Caretaker" : "Tenant"}
              </p>
              <p className="text-sm font-bold text-[#330101] leading-none truncate max-w-[140px] group-hover:text-[#D96648] transition-colors">
                {user.fullName || user.userName}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#FDF2ED] border border-[#F2DED4] flex items-center justify-center text-[#D96648] font-black text-sm shadow-sm group-hover:bg-[#5c1f10] group-hover:text-white group-hover:border-[#5c1f10] transition-all">
              {initials}
            </div>
          </button>
        </div>

      </div>
    </header>
  );
};

export default UserHeader;