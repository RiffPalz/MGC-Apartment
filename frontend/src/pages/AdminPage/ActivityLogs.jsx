import { useState, useEffect, useCallback } from "react";
import {
    FaSearch, FaChevronLeft, FaChevronRight, FaFilter,
    FaUserShield, FaUsers, FaTools, FaSyncAlt,
} from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import toast from "../../utils/toast";
import { fetchAllActivityLogs } from "../../api/adminAPI/ActivityLogsAPI";

const PAGE_SIZE = 15;

const fmt = (d) =>
    d ? new Date(d).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    }) : "---";

const ROLE_CFG = {
    admin: { color: "bg-red-50 text-red-600 border-red-200", icon: <FaUserShield size={10} /> },
    caretaker: { color: "bg-teal-50 text-teal-600 border-teal-200", icon: <MdAdminPanelSettings size={10} /> },
    tenant: { color: "bg-blue-50 text-blue-600 border-blue-200", icon: <FaUsers size={10} /> },
};

const ACTION_COLOR = {
    CREATE: "bg-emerald-50 text-emerald-700",
    UPDATE: "bg-blue-50 text-blue-700",
    DELETE: "bg-red-50 text-red-700",
    LOGIN: "bg-purple-50 text-purple-700",
    APPROVE: "bg-amber-50 text-amber-700",
    DEFAULT: "bg-slate-100 text-slate-600",
};

const getActionColor = (action = "") => {
    const a = action.toUpperCase();
    if (a.includes("CREATE")) return ACTION_COLOR.CREATE;
    if (a.includes("UPDATE") || a.includes("EDIT")) return ACTION_COLOR.UPDATE;
    if (a.includes("DELETE") || a.includes("REMOVE") || a.includes("TERMINATE")) return ACTION_COLOR.DELETE;
    if (a.includes("LOGIN") || a.includes("VERIFY")) return ACTION_COLOR.LOGIN;
    if (a.includes("APPROVE") || a.includes("DECLINE")) return ACTION_COLOR.APPROVE;
    return ACTION_COLOR.DEFAULT;
};

export default function AdminActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [lastRefresh, setLastRefresh] = useState(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchAllActivityLogs({
                role: roleFilter,
                search,
                limit: 500,
            });
            if (data.success) {
                setLogs(data.logs || []);
                setLastRefresh(new Date());
            }
        } catch {
            toast.error("Failed to load activity logs.");
        } finally {
            setLoading(false);
        }
    }, [roleFilter, search]);

    useEffect(() => { load(); }, [load]);

    // client-side search on top of server results
    const filtered = logs.filter((l) => {
        const q = search.toLowerCase();
        return (
            l.description?.toLowerCase().includes(q) ||
            l.action?.toLowerCase().includes(q) ||
            String(l.user_id).includes(q)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const adminCount = logs.filter((l) => l.role === "admin").length;
    const caretakerCount = logs.filter((l) => l.role === "caretaker").length;
    const tenantCount = logs.filter((l) => l.role === "tenant").length;

    return (
        <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 min-h-screen">

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={<FaUserShield size={18} />} label="Admin Actions" value={adminCount} color="text-red-500" bg="bg-red-50" />
                <StatCard icon={<MdAdminPanelSettings size={20} />} label="Caretaker Actions" value={caretakerCount} color="text-teal-500" bg="bg-teal-50" />
                <StatCard icon={<FaUsers size={18} />} label="Tenant Actions" value={tenantCount} color="text-blue-500" bg="bg-blue-50" />
            </div>

            {/* TOOLBAR */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                        <input
                            type="text"
                            placeholder="Search action or description..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <FaFilter size={11} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Role</span>
                        </div>
                        <div className="overflow-x-auto">
                        <div className="flex bg-slate-100 p-1 rounded-lg min-w-max">
                            {["All", "Admin", "Caretaker", "Tenant"].map((f) => (
                                <button key={f} onClick={() => { setRoleFilter(f); setPage(1); }}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
                    ${roleFilter === f ? "bg-white text-[#db6747] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                        </div>
                        <button onClick={() => { setPage(1); load(); }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                            <FaSyncAlt size={11} className={loading ? "animate-spin" : ""} />
                            <span className="uppercase tracking-widest hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>
                {lastRefresh && (
                    <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">
                        Last updated: {fmt(lastRefresh)}
                    </p>
                )}
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                                <th className="px-5 py-4 font-bold">Timestamp</th>
                                <th className="px-5 py-4 font-bold">Role</th>
                                <th className="px-5 py-4 font-bold">Action</th>
                                <th className="px-5 py-4 font-bold">Description</th>
                                <th className="px-5 py-4 font-bold">Ref. Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="py-24 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db6747] mx-auto mb-3" />
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Loading logs...</p>
                                </td></tr>
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={5} className="py-24 text-center">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FaTools className="text-slate-300" size={20} />
                                    </div>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No activity logs found</p>
                                </td></tr>
                            ) : paginated.map((log) => (
                                <tr key={log.ID} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500">{fmt(log.created_at)}</td>
                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${ROLE_CFG[log.role]?.color}`}>
                                            {ROLE_CFG[log.role]?.icon} {log.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-slate-700 max-w-xs">
                                        <p className="truncate">{log.description || "---"}</p>
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400 uppercase tracking-wider">
                                        {log.reference_type || "---"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {!loading && filtered.length > PAGE_SIZE && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50 gap-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Showing <span className="text-slate-700">{(page - 1) * PAGE_SIZE + 1}</span> – <span className="text-slate-700">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="text-slate-700">{filtered.length}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all">
                                <FaChevronLeft size={12} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .reduce((acc, p, idx, arr) => {
                                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, idx) =>
                                    p === "..." ? (
                                        <span key={`e-${idx}`} className="px-2 text-slate-400 text-xs">…</span>
                                    ) : (
                                        <button key={p} onClick={() => setPage(p)}
                                            className={`w-7 h-7 rounded-md text-xs font-bold transition-all
                        ${page === p ? "bg-[#db6747] text-white shadow-sm" : "text-slate-500 hover:bg-white hover:border hover:border-slate-200 border border-transparent"}`}>
                                            {p}
                                        </button>
                                    )
                                )}
                            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all">
                                <FaChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color, bg }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
            <div className={`p-3.5 ${bg} ${color} rounded-lg shrink-0`}>{icon}</div>
            <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
                <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
            </div>
        </div>
    );
}
