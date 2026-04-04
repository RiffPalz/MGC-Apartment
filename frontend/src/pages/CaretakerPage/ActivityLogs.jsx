import { useState, useEffect, useCallback } from "react";
import { useSocketEvent } from "../../hooks/useSocketEvent";import {
  FaSearch, FaChevronLeft, FaChevronRight, FaTools, FaSyncAlt,
  FaWrench, FaMoneyCheckAlt, FaUserCog, FaClock, FaHistory
} from "react-icons/fa";
import toast from "../../utils/toast";
import { fetchCaretakerActivityLogs } from "../../api/caretakerAPI/ActivityLogAPI";

const PAGE_SIZE = 15;

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "---";

const ACTION_COLOR = {
  CREATE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
  VERIFY: "bg-purple-50 text-purple-700 border-purple-200",
  DEFAULT: "bg-slate-50 text-slate-600 border-slate-200",
};

const getActionColor = (action = "") => {
  const a = action.toUpperCase();
  if (a.includes("CREATE")) return ACTION_COLOR.CREATE;
  if (a.includes("UPDATE") || a.includes("EDIT")) return ACTION_COLOR.UPDATE;
  if (a.includes("DELETE") || a.includes("REMOVE")) return ACTION_COLOR.DELETE;
  if (a.includes("VERIFY") || a.includes("LOGIN")) return ACTION_COLOR.VERIFY;
  return ACTION_COLOR.DEFAULT;
};

export default function CaretakerActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCaretakerActivityLogs({ search });
      if (data.success) {
        setLogs(data.logs || []);
        setLastRefresh(new Date());
      }
    } catch {
      toast.error("Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);
  useSocketEvent(["maintenance_updated", "payment_updated", "announcements_updated"], load);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.description?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.reference_type?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const maintCount = logs.filter((l) => l.reference_type === "maintenance").length;
  const payCount = logs.filter((l) => l.reference_type === "payment").length;
  const profileCount = logs.filter((l) => l.reference_type === "user").length;

  return (
    <div className="w-full h-full font-sans flex flex-col gap-4 sm:gap-5 text-slate-800 min-h-screen overflow-x-hidden">

      {/* 4K Containment Wrapper */}
      <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-4 sm:gap-5 flex-1">

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard icon={<FaWrench size={18} />} label="Maintenance Actions" value={maintCount} color="text-[#db6747]" bg="bg-orange-50" />
          <StatCard icon={<FaMoneyCheckAlt size={18} />} label="Payment Actions" value={payCount} color="text-emerald-500" bg="bg-emerald-50" />
          <StatCard icon={<FaUserCog size={18} />} label="Profile Actions" value={profileCount} color="text-teal-500" bg="bg-teal-50" />
        </div>

        {/* TOOLBAR */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input type="text" placeholder="Search action or description..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-all shadow-sm" />
            </div>
            <div className="flex gap-2 items-center w-full sm:w-auto">
              <button onClick={() => { setPage(1); load(); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm uppercase tracking-widest active:scale-95">
                <FaSyncAlt size={11} className={loading ? "animate-spin" : ""} />
                <span className="uppercase tracking-widest">Refresh</span>
              </button>
              {lastRefresh && (
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  <FaClock size={10} /> {fmt(lastRefresh)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4 font-bold">#</th>
                  <th className="px-5 py-4 font-bold">Timestamp</th>
                  <th className="px-5 py-4 font-bold">Action</th>
                  <th className="px-5 py-4 font-bold w-full">Description</th>
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
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                      <FaHistory className="text-slate-300" size={20} />
                    </div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No activity logs found</p>
                  </td></tr>
                ) : paginated.map((log, idx) => (
                  <tr key={log.ID} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400 font-bold">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-600">{fmt(log.created_at)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center text-[9px] font-bold px-2.5 py-1.5 rounded-md uppercase tracking-wider border shadow-sm ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
                      <p className="line-clamp-2 max-w-sm xl:max-w-2xl whitespace-normal leading-relaxed" title={log.description}>{log.description || "---"}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {log.reference_type || "---"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden flex-1 overflow-y-auto divide-y divide-slate-100 bg-slate-50/30">
            {loading ? (
              <div className="py-24 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db6747] mx-auto mb-4" />
              </div>
            ) : paginated.length === 0 ? (
              <div className="py-24 text-center px-4">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No activity logs found</p>
              </div>
            ) : (
              paginated.map((log, idx) => (
                <div key={log.ID} className="p-5 space-y-4 hover:bg-white transition-colors border-l-4 border-transparent hover:border-l-[#db6747]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border shadow-sm ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">#{(page - 1) * PAGE_SIZE + idx + 1}</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {log.description || "---"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-1 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Timestamp</span>
                      <span className="text-xs text-slate-600 font-semibold">{fmt(log.created_at)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Reference</span>
                      <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">{log.reference_type || "---"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PAGINATION */}
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50 gap-4 shrink-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Showing <span className="text-slate-700">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="text-slate-700">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="text-slate-700">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all active:scale-95">
                  <FaChevronLeft size={12} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
                  .map((p, idx) => p === "..."
                    ? <span key={`e-${idx}`} className="px-2 text-slate-400 text-xs">…</span>
                    : <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${page === p ? "bg-[#db6747] text-white shadow-sm shadow-orange-200" : "text-slate-500 hover:bg-white hover:border hover:border-slate-200 border border-transparent"}`}>
                      {p}
                    </button>
                  )}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all active:scale-95">
                  <FaChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3.5 sm:p-4 ${bg} ${color} rounded-xl shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-none truncate">{value}</p>
      </div>
    </div>
  );
}