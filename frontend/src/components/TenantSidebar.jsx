import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo.png";
import {
  FaBars,
  FaMoneyCheckAlt,
  FaSignOutAlt,
  FaHome,
  FaChevronLeft,
  FaHistory,
} from "react-icons/fa";
import { GrVmMaintenance } from "react-icons/gr";
import { TbContract } from "react-icons/tb";
import { logout } from "../api/authService";

export default function TenantSidebar({ open = true, setOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard",    icon: <FaHome />,         path: "/tenant/dashboard" },
    { name: "Maintenance",  icon: <GrVmMaintenance />, path: "/tenant/maintenance" },
    { name: "My Contract",  icon: <TbContract />,      path: "/tenant/contract" },
    { name: "Payments",     icon: <FaMoneyCheckAlt />, path: "/tenant/payment" },
    { name: "Activity Logs",icon: <FaHistory />,       path: "/tenant/activityLogs" },
  ];

  const handleLogout = () => {
    logout(); 
    navigate("/login", { replace: true }); 
  };

  return (
    <aside
      className={`relative h-full bg-[#5c1f10] text-white shadow-2xl transition-all duration-500 ease-in-out flex flex-col font-NunitoSans z-50 overflow-hidden
      ${open ? "w-72 max-w-[85vw]" : "w-20"} `}
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
                MGC PORTAL
              </h1>
              <span className="text-[9px] text-white/50 uppercase tracking-widest block whitespace-nowrap">
                Tenant Access
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
          {/* UX Improvement: Show Chevron when open (to collapse), Bars when closed (to expand) */}
          {open ? <FaChevronLeft size={18} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* 2. NAVIGATION MENU */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item, index) => {
          const isActive = location.pathname.includes(item.path); // Improved matching

          return (
            <Link
              key={index}
              to={item.path}
              className={`
                group flex items-center rounded-xl px-4 py-4 transition-all duration-300 relative overflow-hidden
                ${open ? "justify-start gap-4" : "justify-center"}
                ${
                  isActive
                    ? "bg-linear-to-r from-[#db6747] to-[#b04529] text-white shadow-lg shadow-[#db6747]/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }
              `}
            >
              {/* Active Indicator Line (Left) */}
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

              {/* Text Label - Hidden when collapsed */}
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

      {/* 3. FOOTER / LOGOUT */}
      <div className="p-4 border-t border-white/10 bg-[#4a1809] shrink-0">
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center rounded-xl px-4 py-4 transition-all duration-300 group
            ${
              open
                ? "justify-start gap-4 bg-red-500/10 hover:bg-red-600 hover:text-white text-red-300"
                : "justify-center hover:bg-red-600/20 text-red-400"
            }
          `}
        >
          <FaSignOutAlt
            className={`text-xl shrink-0 transition-transform ${
              open ? "" : "group-hover:scale-110"
            }`}
          />

          <span
            className={`font-OswaldRegular text-sm uppercase tracking-widest whitespace-nowrap transition-all duration-300 origin-left
            ${open ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}`}
          >
            Log Out
          </span>
        </button>
      </div>

      {/* Custom Scrollbar CSS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #db6747; border-radius: 10px; }
      `}</style>
    </aside>
  );
}
