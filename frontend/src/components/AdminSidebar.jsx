import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo.png";
import {
  FaBars,
  FaMoneyCheckAlt,
  FaCog,
  FaHouseUser,
  FaDoorClosed,
  FaSignOutAlt,
  FaChevronLeft,
  FaHistory,
} from "react-icons/fa";
import { MdDashboard, MdSwitchAccount } from "react-icons/md";
import { GrVmMaintenance, GrAnnounce } from "react-icons/gr";
import { VscGitStashApply } from "react-icons/vsc";
import { TbContract } from "react-icons/tb";

// API
import { logout } from "../api/authService";

export default function AdminSidebar({ open = true, setOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", icon: <MdDashboard />, path: "/admin/dashboard" },
    { name: "Tenants", icon: <FaHouseUser />, path: "/admin/tenants" },
    { name: "Units", icon: <FaDoorClosed />, path: "/admin/units" },
    {
      name: "Maintenance",
      icon: <GrVmMaintenance />,
      path: "/admin/maintenance",
    },
    { name: "Announcement", icon: <GrAnnounce />, path: "/admin/announcement" },
    { name: "Contract", icon: <TbContract />, path: "/admin/contract" },
    {
      name: "Payment Overview",
      icon: <FaMoneyCheckAlt />,
      path: "/admin/payments",
    },
    {
      name: "Account Approval",
      icon: <MdSwitchAccount />,
      path: "/admin/approvalpage",
    },
    {
      name: "Application Requests",
      icon: <VscGitStashApply />,
      path: "/admin/applicationrequest",
    },
    { name: "Activity Logs", icon: <FaHistory />, path: "/admin/activity-logs" },
  ];

  const handleLogout = () => {
    logout(); // 🔐 clears token + role
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={`relative h-screen bg-[#5c1f10] text-white shadow-2xl transition-all duration-500 ease-in-out flex flex-col font-NunitoSans z-50 overflow-hidden
      ${open ? "w-72" : "w-20"} `}
    >
      {/* 1. BRAND HEADER */}
      <div
        className={`flex items-center h-24 px-6 border-b border-white/10 shrink-0 ${
          open ? "justify-between" : "justify-center"
        }`}
      >
        {open && (
          <div className="flex items-center gap-3 animate-fade-in overflow-hidden">
            <img
              src={logo}
              alt="MGC Logo"
              className="w-10 h-10 object-contain drop-shadow-md shrink-0"
            />
            <div className="min-w-0">
              <h1 className="font-LemonMilkRegular text-sm tracking-[2px] leading-tight text-white whitespace-nowrap">
                MGC ADMIN
              </h1>
              <span className="text-[9px] text-white/50 uppercase tracking-widest block whitespace-nowrap">
                Management Portal
              </span>
            </div>
          </div>
        )}

        {/* TOGGLE BUTTON */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          className="text-[#db6747] hover:text-white transition-transform hover:scale-110 p-2 rounded-full hover:bg-white/10"
        >
          {open ? <FaChevronLeft size={18} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* 2. NAVIGATION MENU */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item, index) => {
          // Exact match for dashboard, includes match for others
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.includes(item.path);

          return (
            <Link
              key={index}
              to={item.path}
              className={`
                group flex items-center rounded-xl px-4 py-3.5 transition-all duration-300 relative overflow-hidden
                ${open ? "justify-start gap-4" : "justify-center"}
                ${
                  isActive
                    ? "bg-linear-to-r from-[#db6747] to-[#b04529] text-white shadow-lg shadow-[#db6747]/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }
              `}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30" />
              )}

              <span
                className={`text-xl shrink-0 transition-transform duration-300 ${
                  isActive
                    ? "scale-110"
                    : "group-hover:scale-110 group-hover:text-[#db6747]"
                }`}
              >
                {item.icon}
              </span>

              {/* Text Label */}
              <span
                className={`font-OswaldRegular text-sm uppercase tracking-widest whitespace-nowrap transition-all duration-300 origin-left
                ${open ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-4 w-0 overflow-hidden"}`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Custom Scrollbar CSS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #db6747; border-radius: 10px; }
      `}</style>
    </aside>
  );
}
