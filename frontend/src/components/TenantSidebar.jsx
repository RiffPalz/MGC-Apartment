import { Link, useLocation } from "react-router-dom";
import logo from "../assets/images/logo.png";
import {
  FaBars,
  FaMoneyCheckAlt,
  FaHome,
  FaChevronLeft,
  FaHistory,
} from "react-icons/fa";
import { GrVmMaintenance } from "react-icons/gr";
import { TbContract } from "react-icons/tb";

export default function TenantSidebar({ open = true, setOpen }) {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard",     icon: <FaHome />,          path: "/tenant/dashboard"    },
    { name: "Maintenance",   icon: <GrVmMaintenance />, path: "/tenant/maintenance"  },
    { name: "My Contract",   icon: <TbContract />,      path: "/tenant/contract"     },
    { name: "Payments",      icon: <FaMoneyCheckAlt />, path: "/tenant/payment"      },
    { name: "Activity Logs", icon: <FaHistory />,       path: "/tenant/activityLogs" },
  ];

  return (
    <>
      <aside
        className={`
          relative h-full bg-[#5c1f10] text-white shadow-2xl
          transition-all duration-300 ease-in-out
          flex flex-col font-NunitoSans z-50 overflow-hidden
          ${open ? "w-[280px] max-w-[85vw]" : "w-20"}
        `}
      >
        {/* Brand header */}
        <div
          className={`flex items-center h-16 sm:h-20 px-4 sm:px-6 border-b border-white/10 shrink-0 ${
            open ? "justify-between" : "justify-center"
          }`}
        >
          {open && (
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={logo}
                alt="MGC Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-md shrink-0"
              />
              <div className="min-w-0">
                <h1 className="font-LemonMilkRegular text-xs sm:text-sm tracking-[2px] leading-tight text-white whitespace-nowrap">
                  MGC PORTAL
                </h1>
                <span className="text-[9px] text-white/50 uppercase tracking-widest block whitespace-nowrap">
                  Tenant Access
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
            className="text-[#db6747] hover:text-white transition-all hover:scale-110 p-2 rounded-full hover:bg-white/10 shrink-0"
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            {open ? <FaChevronLeft size={16} /> : <FaBars size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 sm:py-6 px-2 sm:px-3 space-y-1 sm:space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item, index) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={index}
                to={item.path}
                className={`
                  group flex items-center rounded-xl px-3 sm:px-4 py-3.5 sm:py-4
                  transition-all duration-200 relative overflow-hidden
                  ${open ? "justify-start gap-3 sm:gap-4" : "justify-center"}
                  ${
                    isActive
                      ? "bg-gradient-to-r from-[#db6747] to-[#b04529] text-white shadow-lg shadow-[#db6747]/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 rounded-r" />
                )}
                <span
                  className={`text-lg sm:text-xl shrink-0 transition-transform duration-200 ${
                    isActive ? "scale-110" : "group-hover:scale-110 group-hover:text-[#db6747]"
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`
                    font-OswaldRegular text-xs sm:text-sm uppercase tracking-widest whitespace-nowrap
                    transition-all duration-300 origin-left
                    ${open ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-4 w-0 overflow-hidden"}
                  `}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #db6747; border-radius: 10px; }
        `}</style>
      </aside>

    </>
  );
}
