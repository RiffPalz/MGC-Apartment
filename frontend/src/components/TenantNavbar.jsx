import { useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

export default function TenantNavbar({ toggleSidebar }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.fullName || user?.userName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="bg-white border-b border-[#F2DED4] h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">

      {/* LEFT: mobile sidebar toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
        className="lg:hidden p-2 rounded-xl text-[#5c1f10] hover:bg-[#FDF2ED] hover:text-[#D96648] transition-all active:scale-95"
        aria-label="Toggle sidebar"
      >
        <FaBars size={18} />
      </button>

      {/* CENTER: branding (mobile only) */}
      <span className="lg:hidden font-LemonMilkRegular text-xs tracking-[2px] text-[#5c1f10]">
        MGC PORTAL
      </span>

      {/* RIGHT: user chip — clickable → account settings */}
      <button
        onClick={() => navigate("/tenant/myAccount")}
        className="flex items-center gap-3 ml-auto group cursor-pointer"
      >
        <div className="text-right hidden sm:block">
          <p className="text-xs font-black text-[#330101] leading-none truncate max-w-[140px] group-hover:text-[#D96648] transition-colors">
            {user?.fullName || user?.userName || "Tenant"}
          </p>
          <p className="text-[10px] font-bold text-[#D96648] uppercase tracking-widest leading-none mt-0.5">
            {user?.unitNumber ? `Unit ${user.unitNumber}` : "Tenant"}
          </p>
        </div>
        <div className="h-9 w-9 rounded-xl bg-[#FDF2ED] border border-[#F2DED4] flex items-center justify-center text-[#D96648] font-black text-xs shadow-sm group-hover:bg-[#5c1f10] group-hover:text-white group-hover:border-[#5c1f10] transition-all">
          {initials}
        </div>
      </button>

    </header>
  );
}
