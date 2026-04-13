import { Link, useLocation } from "react-router-dom";
import logo from "../assets/images/logo.png";
import {
  FaBars, FaChevronLeft, FaCog,
  FaTools, FaMoneyCheckAlt, FaBullhorn, FaHistory, FaUsers,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";

const MENU = [
  { name: "Dashboard",    icon: <MdDashboard />,      path: "/caretaker/dashboard" },
  { name: "Tenants",      icon: <FaUsers />,           path: "/caretaker/tenants" },
  { name: "Maintenance",  icon: <FaTools />,           path: "/caretaker/maintenance" },
  { name: "Payment Overview", icon: <FaMoneyCheckAlt />, path: "/caretaker/payments" },
  { name: "Announcements",icon: <FaBullhorn />,        path: "/caretaker/announcements" },
  { name: "Activity Logs",icon: <FaHistory />,         path: "/caretaker/activity-logs" },
  { name: "Settings",     icon: <FaCog />,             path: "/caretaker/settings" },
];

export default function CaretakerSidebar({ open, setOpen }) {
  const location = useLocation();

  return (
    <aside className={`relative h-full bg-[#5c1f10] text-white shadow-2xl transition-all duration-500 ease-in-out flex flex-col font-NunitoSans z-50 overflow-hidden ${open ? "w-72" : "w-20"}`}>

      {/* Brand */}
      <div className={`flex items-center h-24 px-6 border-b border-white/10 shrink-0 ${open ? "justify-between" : "justify-center"}`}>
        {open && (
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={logo} alt="MGC Logo" className="w-10 h-10 object-contain drop-shadow-md shrink-0" />
            <div className="min-w-0">
              <h1 className="font-LemonMilkRegular text-sm tracking-[2px] leading-tight text-white whitespace-nowrap">MGC CARETAKER</h1>
              <span className="text-[9px] text-white/50 uppercase tracking-widest block whitespace-nowrap">Management Portal</span>
            </div>
          </div>
        )}
        <button onClick={() => setOpen(!open)}
          className="text-[#db6747] hover:text-white transition-transform hover:scale-110 p-2 rounded-full hover:bg-white/10">
          {open ? <FaChevronLeft size={18} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {MENU.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <Link key={item.path} to={item.path}
              className={`group flex items-center rounded-xl px-4 py-3.5 transition-all duration-300 relative overflow-hidden
                ${open ? "justify-start gap-4" : "justify-center"}
                ${isActive
                  ? "bg-gradient-to-r from-[#db6747] to-[#b04529] text-white shadow-lg shadow-[#db6747]/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30" />}
              <span className={`text-xl shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110 group-hover:text-[#db6747]"}`}>
                {item.icon}
              </span>
              <span className={`font-OswaldRegular text-sm uppercase tracking-widest whitespace-nowrap transition-all duration-300 origin-left
                ${open ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-4 w-0 overflow-hidden"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
