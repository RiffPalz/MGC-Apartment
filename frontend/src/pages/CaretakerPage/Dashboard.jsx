import { useState, useEffect } from "react";
import {
    FaTools, FaMoneyCheckAlt, FaBullhorn, FaUsers,
    FaCheckCircle, FaArrowRight, FaExclamationCircle,
} from "react-icons/fa";
import { MdApartment } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchAllMaintenance } from "../../api/caretakerAPI/MaintenanceApi";
import { fetchPendingPayments } from "../../api/caretakerAPI/PaymentAPI";
import { fetchAnnouncements } from "../../api/caretakerAPI/AnnouncementAPI";
import { fetchTenantsOverview, fetchUnits } from "../../api/caretakerAPI/TenantsOverviewAPI";

const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "---";

const STATUS_CFG = {
    "Pending": { color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
    "In Progress": { color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-400" },
    "Done": { color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
    "Approved": { color: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-400" },
};

export default function CaretakerDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [maintenance, setMaintenance] = useState([]);
    const [pendingPay, setPendingPay] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [tenantCount, setTenantCount] = useState(0);
    const [unitStats, setUnitStats] = useState({ total: 0, occupied: 0, vacant: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [maintRes, payRes, annRes, tenantsRes, unitsRes] = await Promise.allSettled([
                    fetchAllMaintenance(),
                    fetchPendingPayments(),
                    fetchAnnouncements(),
                    fetchTenantsOverview(),
                    fetchUnits(),
                ]);

                if (maintRes.status === "fulfilled" && maintRes.value.success)
                    setMaintenance(maintRes.value.data || []);

                if (payRes.status === "fulfilled" && payRes.value.success)
                    setPendingPay(payRes.value.payments || []);

                if (annRes.status === "fulfilled" && annRes.value.success)
                    setAnnouncements(annRes.value.announcements || []);

                if (tenantsRes.status === "fulfilled" && tenantsRes.value.success)
                    setTenantCount(tenantsRes.value.count ?? 0);

                if (unitsRes.status === "fulfilled" && unitsRes.value.success) {
                    const units = unitsRes.value.units || [];
                    const occupied = units.filter((u) => u.isOccupied).length;
                    setUnitStats({ total: units.length, occupied, vacant: units.length - occupied });
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const pendingMaint = maintenance.filter((m) => m.status === "Pending").length;
    const inProgressMaint = maintenance.filter((m) => m.status === "In Progress").length;
    const doneMaint = maintenance.filter((m) => m.status === "Done").length;
    const displayName = user?.fullName || user?.username || "Caretaker";

    if (loading) return (
        <div className="w-full flex flex-col gap-4 sm:gap-5 font-sans animate-pulse">
            {/* Welcome Banner Skeleton */}
            <div className="h-24 bg-slate-200 rounded-2xl w-full" />
            {/* Stat Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-slate-100 rounded w-2/3" />
                            <div className="h-6 bg-slate-200 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
            {/* Content Rows Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 h-56 shadow-sm" />
                <div className="bg-white rounded-2xl border border-slate-100 p-5 h-56 shadow-sm space-y-3">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl" />)}
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-4 sm:gap-5 font-sans text-slate-800">

            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-[#3a0f08] to-[#db6747] rounded-2xl px-6 sm:px-8 py-5 flex items-center justify-between shadow-sm relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="relative z-10">
                    <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold">Welcome back</p>
                    <h1 className="text-white font-black text-2xl sm:text-3xl mt-0.5">{displayName}</h1>
                    <p className="text-white/80 text-[10px] mt-1.5 uppercase tracking-widest font-semibold">Caretaker · MGC Building</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md px-4 py-2 rounded-xl relative z-10 shadow-sm">
                    <FaCheckCircle className="text-emerald-400" size={14} />
                    <span className="text-white text-[11px] font-bold uppercase tracking-widest">On Duty</span>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <StatCard icon={<FaUsers size={16} />} label="Total Tenants" value={tenantCount} color="text-blue-500" bg="bg-blue-50" />
                <StatCard icon={<MdApartment size={18} />} label="Total Units" value={unitStats.total} color="text-purple-500" bg="bg-purple-50" />
                <StatCard icon={<FaTools size={16} />} label="Open Maintenance" value={pendingMaint + inProgressMaint} color="text-[#db6747]" bg="bg-orange-50" onClick={() => navigate("/caretaker/maintenance")} hoverable />
                <StatCard icon={<FaMoneyCheckAlt size={16} />} label="Pending Payments" value={pendingPay.length} color="text-emerald-500" bg="bg-emerald-50" onClick={() => navigate("/caretaker/payments")} badge={pendingPay.length > 0} hoverable />
            </div>

            {/* Middle Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Maintenance Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow">
                    <SectionHeader icon={<FaTools size={14} />} title="Maintenance" sub="Request breakdown" onView={() => navigate("/caretaker/maintenance")} />
                    <div className="space-y-4 mt-5 flex-1">
                        <MaintBar label="Pending" value={pendingMaint} total={maintenance.length} color="bg-amber-400" />
                        <MaintBar label="In Progress" value={inProgressMaint} total={maintenance.length} color="bg-blue-400" />
                        <MaintBar label="Done" value={doneMaint} total={maintenance.length} color="bg-emerald-400" />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                        <p className="text-xl font-black text-slate-800">{maintenance.length}</p>
                    </div>
                </div>

                {/* Unit Occupancy */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow">
                    <SectionHeader icon={<MdApartment size={15} />} title="Unit Occupancy" sub="Current status" />
                    <div className="flex-1 flex flex-col justify-center gap-5 mt-5">
                        <OccupancyRow label="Occupied" value={unitStats.occupied} total={unitStats.total} color="bg-[#db6747]" textColor="text-[#db6747]" />
                        <OccupancyRow label="Vacant" value={unitStats.vacant} total={unitStats.total} color="bg-slate-300" textColor="text-slate-500" />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Units</p>
                        <p className="text-xl font-black text-slate-800">{unitStats.total}</p>
                    </div>
                </div>

                {/* Pending Payments */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <SectionHeader icon={<FaMoneyCheckAlt size={14} />} title="Pending Payments" sub="Awaiting verification" />
                        <NavBtn onClick={() => navigate("/caretaker/payments")} />
                    </div>
                    <div className="divide-y divide-slate-100 flex-1">
                        {pendingPay.length === 0 ? (
                            <div className="py-10 flex flex-col items-center justify-center h-full">
                                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-2 border border-emerald-100">
                                    <FaCheckCircle className="text-emerald-400" size={16} />
                                </div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">All caught up</p>
                            </div>
                        ) : pendingPay.slice(0, 4).map((p) => {
                            const tenant = p.contract?.tenants?.[0];
                            return (
                                <div key={p.ID} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-100 shadow-sm">
                                        {(tenant?.fullName || "?")[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-slate-800 truncate leading-tight">{tenant?.fullName || "Unknown"}</p>
                                        <p className="text-[9px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Unit {p.contract?.unit?.unit_number} · {fmt(p.created_at)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Recent Maintenance */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <SectionHeader icon={<FaTools size={14} />} title="Recent Requests" sub="Latest maintenance" />
                        <NavBtn onClick={() => navigate("/caretaker/maintenance")} />
                    </div>
                    <div className="divide-y divide-slate-100 flex-1">
                        {maintenance.length === 0 ? (
                            <div className="py-10 flex flex-col items-center justify-center h-full">
                                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2 border border-slate-100">
                                    <FaExclamationCircle className="text-slate-300" size={16} />
                                </div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">No requests</p>
                            </div>
                        ) : maintenance.slice(0, 4).map((m) => (
                            <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-800 truncate leading-tight">{m.title}</p>
                                    <p className="text-[9px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wider truncate">{m.tenant?.fullName} · {m.category}</p>
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shrink-0 border ${STATUS_CFG[m.status]?.color ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                    {m.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Announcements */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <SectionHeader icon={<FaBullhorn size={14} />} title="Announcements" sub="Latest updates" />
                        <NavBtn onClick={() => navigate("/caretaker/announcements")} />
                    </div>
                    <div className="divide-y divide-slate-100 flex-1">
                        {announcements.length === 0 ? (
                            <div className="py-10 flex flex-col items-center justify-center h-full">
                                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2 border border-slate-100">
                                    <FaBullhorn className="text-slate-300" size={16} />
                                </div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">No announcements</p>
                            </div>
                        ) : announcements.slice(0, 4).map((a) => (
                            <div key={a.ID} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#db6747] flex items-center justify-center shrink-0 border border-orange-100 shadow-sm mt-0.5">
                                    <FaBullhorn size={12} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-800 truncate leading-tight">{a.announcementTitle}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{a.announcementMessage}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-200 uppercase tracking-wider">{a.category || "General"}</span>
                                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">{fmt(a.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}

/* ── Sub-components ── */
function StatCard({ icon, label, value, color, bg, onClick, badge, hoverable }) {
    return (
        <div onClick={onClick}
            className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-4 shadow-sm relative overflow-hidden
        ${hoverable ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all" : ""}`}>
            <div className={`p-3 sm:p-3.5 ${bg} ${color} rounded-xl shrink-0 relative shadow-inner border border-slate-100`}>
                {icon}
                {badge && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white -translate-y-1/3 translate-x-1/3" />}
            </div>
            <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
                <p className="text-xl sm:text-2xl font-black text-slate-800 leading-none">{value}</p>
            </div>
        </div>
    );
}

function SectionHeader({ icon, title, sub }) {
    return (
        <div className="flex items-center gap-2.5 text-[#db6747]">
            <div className="p-2 bg-orange-50 rounded-lg border border-orange-100 shadow-sm">{icon}</div>
            <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 leading-tight">{title}</h3>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">{sub}</p>
            </div>
        </div>
    );
}

function NavBtn({ onClick }) {
    return (
        <button onClick={onClick} className="text-[9px] font-bold text-[#db6747] bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-md border border-orange-100 flex items-center gap-1 uppercase tracking-widest transition-colors active:scale-95">
            View All <FaArrowRight size={8} />
        </button>
    );
}

function MaintBar({ label, value, total, color }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${color} shadow-sm`} />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{label}</span>
                </div>
                <span className="text-sm font-black text-slate-800">{value}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function OccupancyRow({ label, value, total, color, textColor }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{label}</span>
                <div className="flex items-baseline gap-1.5">
                    <span className={`text-lg font-black ${textColor} leading-none`}>{value}</span>
                    <span className="text-[9px] font-bold text-slate-400">({pct}%)</span>
                </div>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}