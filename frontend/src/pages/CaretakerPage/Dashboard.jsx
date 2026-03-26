import { useState, useEffect } from "react";
import {
    FaTools, FaMoneyCheckAlt, FaBullhorn, FaUsers,
    FaCheckCircle, FaClock, FaArrowRight, FaExclamationCircle,
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
    "Pending": { color: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
    "In Progress": { color: "bg-blue-50 text-blue-700", dot: "bg-blue-400" },
    "Done": { color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
    "Approved": { color: "bg-teal-50 text-teal-700", dot: "bg-teal-400" },
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
                    const occupied = units.filter((u) => u.status === "Occupied").length;
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
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#db6747]" />
        </div>
    );

    return (
        <div className="w-full bg-[#f8fafc] flex flex-col gap-5 font-sans text-slate-800">

            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-[#3a0f08] to-[#db6747] rounded-2xl px-6 py-5 flex items-center justify-between shadow-lg">
                <div>
                    <p className="text-white/70 text-xs uppercase tracking-widest font-bold">Welcome back</p>
                    <h1 className="text-white font-black text-xl sm:text-2xl mt-0.5">{displayName}</h1>
                    <p className="text-white/60 text-xs mt-1 uppercase tracking-widest">Caretaker · MGC Building</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                    <FaCheckCircle className="text-emerald-300" size={14} />
                    <span className="text-white text-xs font-bold uppercase tracking-widest">On Duty</span>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<FaUsers size={18} />} label="Total Tenants" value={tenantCount} color="text-blue-500" bg="bg-blue-50" onClick={() => { }} />
                <StatCard icon={<MdApartment size={20} />} label="Total Units" value={unitStats.total} color="text-purple-500" bg="bg-purple-50" />
                <StatCard icon={<FaTools size={18} />} label="Open Maintenance" value={pendingMaint + inProgressMaint} color="text-[#db6747]" bg="bg-orange-50" onClick={() => navigate("/caretaker/maintenance")} />
                <StatCard icon={<FaMoneyCheckAlt size={18} />} label="Pending Payments" value={pendingPay.length} color="text-emerald-500" bg="bg-emerald-50" onClick={() => navigate("/caretaker/payments")} badge={pendingPay.length > 0} />
            </div>

            {/* Middle row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Maintenance breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
                    <SectionHeader icon={<FaTools size={13} />} title="Maintenance" sub="Request breakdown" onView={() => navigate("/caretaker/maintenance")} />
                    <div className="space-y-4 mt-4 flex-1">
                        <MaintBar label="Pending" value={pendingMaint} total={maintenance.length} color="bg-amber-400" />
                        <MaintBar label="In Progress" value={inProgressMaint} total={maintenance.length} color="bg-blue-400" />
                        <MaintBar label="Done" value={doneMaint} total={maintenance.length} color="bg-emerald-400" />
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                        <p className="text-2xl font-black text-slate-800">{maintenance.length}</p>
                    </div>
                </div>

                {/* Unit occupancy */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
                    <SectionHeader icon={<MdApartment size={14} />} title="Unit Occupancy" sub="Current status" />
                    <div className="flex-1 flex flex-col justify-center gap-5 mt-4">
                        <OccupancyRow label="Occupied" value={unitStats.occupied} total={unitStats.total} color="bg-[#db6747]" textColor="text-[#db6747]" />
                        <OccupancyRow label="Vacant" value={unitStats.vacant} total={unitStats.total} color="bg-slate-300" textColor="text-slate-500" />
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Units</p>
                        <p className="text-2xl font-black text-slate-800">{unitStats.total}</p>
                    </div>
                </div>

                {/* Pending payments */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <SectionHeader icon={<FaMoneyCheckAlt size={13} />} title="Pending Payments" sub="Awaiting verification" />
                        <NavBtn onClick={() => navigate("/caretaker/payments")} />
                    </div>
                    <div className="divide-y divide-slate-100 flex-1">
                        {pendingPay.length === 0 ? (
                            <div className="py-10 flex flex-col items-center justify-center">
                                <FaCheckCircle className="text-emerald-300 mb-2" size={24} />
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">All caught up</p>
                            </div>
                        ) : pendingPay.slice(0, 5).map((p) => {
                            const tenant = p.contract?.tenants?.[0];
                            return (
                                <div key={p.ID} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center font-black text-sm shrink-0">
                                        {(tenant?.fullName || "?")[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-slate-800 truncate">{tenant?.fullName || "Unknown"}</p>
                                        <p className="text-[11px] text-slate-400">Unit {p.contract?.unit?.unit_number} · {fmt(p.created_at)}</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-50 text-amber-700 uppercase tracking-wider shrink-0">Pending</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Recent maintenance */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <SectionHeader icon={<FaTools size={13} />} title="Recent Requests" sub="Latest maintenance" />
                        <NavBtn onClick={() => navigate("/caretaker/maintenance")} />
                    </div>
                    <div className="divide-y divide-slate-100">
                        {maintenance.length === 0 ? (
                            <div className="py-10 text-center">
                                <FaExclamationCircle className="text-slate-200 mx-auto mb-2" size={24} />
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No requests</p>
                            </div>
                        ) : maintenance.slice(0, 5).map((m) => (
                            <div key={m.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-800 truncate">{m.title}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{m.tenant?.fullName} · {m.category}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shrink-0 ml-3 ${STATUS_CFG[m.status]?.color ?? "bg-slate-100 text-slate-500"}`}>
                                    {m.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Announcements */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <SectionHeader icon={<FaBullhorn size={13} />} title="Announcements" sub="Latest updates" />
                        <NavBtn onClick={() => navigate("/caretaker/announcements")} />
                    </div>
                    <div className="divide-y divide-slate-100">
                        {announcements.length === 0 ? (
                            <div className="py-10 text-center">
                                <FaBullhorn className="text-slate-200 mx-auto mb-2" size={24} />
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No announcements</p>
                            </div>
                        ) : announcements.slice(0, 5).map((a) => (
                            <div key={a.ID} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#db6747] flex items-center justify-center shrink-0 mt-0.5">
                                    <FaBullhorn size={12} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-800 truncate">{a.title}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{a.content}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-[#db6747] uppercase tracking-wider">{a.category}</span>
                                        <span className="text-[10px] text-slate-400">{fmt(a.created_at)}</span>
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
function StatCard({ icon, label, value, color, bg, onClick, badge }) {
    return (
        <div onClick={onClick}
            className={`bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm relative
        ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}>
            <div className={`p-3.5 ${bg} ${color} rounded-lg shrink-0 relative`}>
                {icon}
                {badge && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white -translate-y-1/2 translate-x-1/2" />}
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
                <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
            </div>
        </div>
    );
}

function SectionHeader({ icon, title, sub }) {
    return (
        <div className="flex items-center gap-2 text-[#db6747]">
            <div className="p-1.5 bg-orange-50 rounded-md">{icon}</div>
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">{title}</h3>
                <p className="text-[10px] text-slate-400 uppercase">{sub}</p>
            </div>
        </div>
    );
}

function NavBtn({ onClick }) {
    return (
        <button onClick={onClick} className="text-[10px] font-bold text-[#db6747] flex items-center gap-1 uppercase tracking-widest hover:opacity-70 transition-opacity">
            View <FaArrowRight size={8} />
        </button>
    );
}

function MaintBar({ label, value, total, color }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-sm text-slate-600">{label}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{value}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
                <span className="text-sm font-bold text-slate-700">{label}</span>
                <div className="flex items-center gap-2">
                    <span className={`text-lg font-black ${textColor}`}>{value}</span>
                    <span className="text-xs text-slate-400">({pct}%)</span>
                </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}
