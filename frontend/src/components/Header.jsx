import { useLocation, useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./Notification";

const PAGE_TITLES = {
  "/tenant/dashboard":   { title: "Dashboard",    subtitle: "Overview of your unit" },
  "/tenant/maintenance": { title: "Maintenance",   subtitle: "Submit and track repair requests" },
  "/tenant/contract":    { title: "My Contract",   subtitle: "View your lease agreement" },
  "/tenant/payment":     { title: "Payments",      subtitle: "Manage your bills and receipts" },
  "/tenant/myAccount":   { title: "Account Settings", subtitle: "Manage your account settings" },
  "/tenant/activityLogs":{ title: "Activity Logs",    subtitle: "Track your recent account activity" },
  "/admin/dashboard":    { title: "Dashboard",     subtitle: "Admin overview" },
  "/caretaker/dashboard":{ title: "Dashboard",     subtitle: "Caretaker overview" },
};

const UserHeader = ({ onMenuClick }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-[#F2DED4] px-5 py-3.5">
        <div className="flex items-center justify-between animate-pulse">
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-32" />
            <div className="h-3 bg-slate-50 rounded w-24" />
          </div>
          <div className="h-9 w-9 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  // Match current path — check exact then prefix
  const matched = PAGE_TITLES[location.pathname]
    || Object.entries(PAGE_TITLES).find(([key]) => location.pathname.startsWith(key))?.[1];

  const pageTitle  = matched?.title    || "Dashboard";
  const pageSub    = matched?.subtitle || "";

  const initials = (user.fullName || user.userName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-[#F2DED4] px-5 sm:px-6 py-3">
      <div className="relative flex items-center justify-between gap-4">

        {/* HAMBURGER — mobile only */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-[#5c1f10] hover:bg-[#FDF2ED] hover:text-[#D96648] transition-all active:scale-95 shrink-0"
            aria-label="Open menu"
          >
            <FaBars size={18} />
          </button>
        )}

        {/* CENTER: page title — absolutely centered */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <h2 className="text-sm sm:text-base font-black text-[#330101] tracking-tight leading-tight whitespace-nowrap">
            {pageTitle}
          </h2>
          {pageSub && (
            <p className="text-[10px] font-medium text-[#330101]/40 tracking-wide hidden sm:block">
              {pageSub}
            </p>
          )}
        </div>

        {/* RIGHT: notifications + avatar */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-auto">
          <NotificationBell userRole={user.role} />

          <div className="h-7 w-px bg-[#F2DED4] hidden sm:block" />

          <div
            className="flex items-center gap-2.5 group cursor-pointer"
            onClick={() => user.role === "tenant" && navigate("/tenant/myAccount")}
          >
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-[#330101]/40 uppercase tracking-widest leading-none mb-0.5">
                {user.role === "admin" ? "Admin" : user.role === "caretaker" ? "Caretaker" : "Tenant"}
              </p>
              <p className="text-xs font-bold text-[#330101] leading-none truncate max-w-[120px]">
                {user.fullName || user.userName}
              </p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-[#FDF2ED] border border-[#F2DED4] flex items-center justify-center text-[#D96648] font-black text-xs shadow-sm group-hover:bg-[#5c1f10] group-hover:text-white group-hover:border-[#5c1f10] transition-all">
              {initials}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserHeader;
