import { useState, useEffect, useCallback } from "react";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import {
  FaSearch, FaChevronLeft, FaChevronRight, FaSyncAlt,
  FaHistory, FaClock, FaFilter, FaChevronDown,
  FaWrench, FaMoneyCheckAlt, FaUserCog, FaBullhorn, FaSignInAlt,
} from "react-icons/fa";
import toast from "../../utils/toast";
import { fetchCaretakerActivityLogs } from "../../api/caretakerAPI/ActivityLogAPI";

const PAGE_SIZE = 15;

const ACTION_TYPES = [
  "All",
  "MAINTENANCE",
  "ANNOUNCEMENT",
  "PAYMENT",
  "PROFILE",
  "LOGIN",
];

const ACTION_STYLES = {
  MAINTENANCE:  { badge: "bg-orange-50 text-orange-700 border-orange-200",   dot: "bg-orange-500" },
  ANNOUNCEMENT: { badge: "bg-blue-50 text-blue-700 border-blue-200",         dot: "bg-blue-500" },
  PAYMENT:      { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  PROFILE:      { badge: "bg-pink-50 text-pink-700 border-pink-200",         dot: "bg-pink-500" },
  LOGIN:        { badge: "bg-teal-50 text-teal-700 border-teal-200",         dot: "bg-teal-500" },
  DELETE:       { badge: "bg-red-50 text-red-700 border-red-200",            dot: "bg-red-500" },
  DEFAULT:      { badge: "bg-slate-50 text-slate-600 border-slate-200",      dot: "bg-slate-400" },
};

const getActionStyle = (action = "") => {
  const a = action.toUpperCase();
  if (a.includes("MAINTENANCE")) return ACTION_STYLES.MAINTENANCE;
  if (a.includes("ANNOUNCEMENT")) return ACTION_STYLES.ANNOUNCEMENT;
  if (a.includes("PAYMENT") || a.includes("VERIFY")) return ACTION_STYLES.PAYMENT;
  if (a.includes("PROFILE")) return ACTION_STYLES.PROFILE;
  if (a === "LOGIN") return ACTION_STYLES.LOGIN;
  if (a.includes("DELETE") || a.includes("REMOVE")) return ACTION_STYLES.DELETE;
  return ACTION_STYLES.DEFAULT;
};

const humanize = (description = "") => {
  const d = description.trim();
  if (!d || d === "---") return "Activity recorded.";
  if (/^You /i.test(d)) return d;
  if (/^Created maintenance:\s*(.+)/i.test(d)) return `You created a maintenance request: "${d.replace(/^Created maintenance:\s*/i, "")}".`;
  if (/^Updated maintenance \d+ to (.+)/i.test(d)) { const m = d.match(/to (.+)/i); return `You updated a maintenance request to ${m[1]}.`; }
  if (/^Deleted maintenance \d+:\s*(.+)/i.test(d)) { const m = d.match(/:\s*(.+)/i); return `You deleted the maintenance request: "${m[1]}".`; }
  if (/^Created announcement:\s*(.+)/i.test(d)) return `You posted a new announcement: "${d.replace(/^Created announcement:\s*/i, "")}".`;
  if (/^Updated announcement ID \d+/i.test(d)) return "You updated an announcement.";
  if (/^Deleted announcement ID \d+/i.test(d)) return "You deleted an announcement.";
  if (/^Verified payment \d+/i.test(d)) return "You verified a tenant payment receipt.";
  if (/^Caretaker updated:\s*(.+)/i.test(d)) return `You updated your profile: ${d.replace(/^Caretaker updated:\s*/i, "")}.`;
  return d;
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";

export default function CaretakerActivityLogs() {
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCaretakerActivityLogs({});
      if (data.success) {
        setAllLogs(data.logs || []);
        setLastRefresh(new Date());
      }
    } catch {
      toast.error("Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useSocketEvent(["maintenance_updated", "payment_updated", "announcements_updated"], load);

  const filtered = allLogs.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.description?.toLowerCase().includes(q) || l.action?.toLowerCase().includes(q);
    const matchFilter = actionFilter === "All" || l.action?.toUpperCase().includes(actionFilter.toUpperCase());
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-[#f8fafc] px-3 sm:px-5 md:px-8 xl:px-12 py-5 md:py-8 font-sans">

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Logs" value={allLogs.length}                                                                                                                                                    color="text-slate-800" />
        <StatCard label="Today"      value={allLogs.filter((l) => new Date(l.created_at).toDateString() === now.toDateString()).length}                                                                        color="text-[#db6747]" />
        <StatCard label="This Week"  value={allLogs.filter((l) => new Date(l.created_at) >= weekAgo).length}                                                                                                  color="text-blue-600" className="col-span-2 lg:col-span-1" />
        <StatCard label="This Month" value={allLogs.filter((l) => { const d = new Date(l.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length}             color="text-emerald-600" className="hidden lg:block" />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 mb-5">
        <div className="flex items-center gap-3">

          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input type="text" placeholder="Search action or description..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747]" />
          </div>

          <div className="relative shrink-0">
            {showFilterMenu && <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />}
            <button onClick={() => setShowFilterMenu((p) => !p)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 hover:border-[#db6747] transition-colors whitespace-nowrap">
              <FaFilter className="text-[#db6747] text-xs shrink-0" />
              <span className="font-bold">{actionFilter === "All" ? "All Actions" : actionFilter}</span>
              <FaChevronDown className={`text-xs text-slate-400 transition-transform ${showFilterMenu ? "rotate-180" : ""}`} />
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 w-52 overflow-hidden">
                {ACTION_TYPES.map((a) => {
                  const style = a !== "All" ? getActionStyle(a) : null;
                  return (
                    <button key={a} onClick={() => { setActionFilter(a); setShowFilterMenu(false); setPage(1); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2.5 ${
                        actionFilter === a ? "bg-orange-50 font-bold text-[#db6747]" : "hover:bg-slate-50 text-slate-600"
                      }`}>
                      {style ? (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold border ${style.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {a}
                        </span>
                      ) : (
                        <span className="font-bold">All Actions</span>
                      )}
                      {actionFilter === a && <span className="ml-auto text-[#db6747] text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button onClick={() => { setPage(1); load(); }}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-orange-50 hover:border-[#db6747] transition-colors shrink-0 uppercase tracking-widest">
            <FaSyncAlt className={`text-[#db6747] ${loading ? "animate-spin" : ""}`} size={13} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {lastRefresh && (
            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 whitespace-nowrap">
              <FaClock size={9} />
              {lastRefresh.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop header */}
        <div className="hidden sm:grid grid-cols-[40px_1fr_2fr_120px_100px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-8 w-6 bg-slate-100 rounded" />
                <div className="h-8 w-32 bg-slate-100 rounded-lg" />
                <div className="h-8 flex-1 bg-slate-50 rounded-lg" />
                <div className="h-8 w-24 bg-slate-50 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
              <FaHistory className="text-slate-300 text-2xl" />
            </div>
            <p className="text-sm font-bold text-slate-500">No activity logs found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginated.map((log, idx) => {
              const style = getActionStyle(log.action);
              return (
                <div key={log.ID} className="hover:bg-slate-50/60 transition-colors">
                  {/* Desktop row */}
                  <div className="hidden sm:grid grid-cols-[40px_1fr_2fr_120px_100px] gap-4 px-5 py-3.5 items-center">
                    <span className="text-xs text-slate-300 font-bold tabular-nums">{(page - 1) * PAGE_SIZE + idx + 1}</span>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${style.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {log.action}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-snug">{humanize(log.description)}</p>
                    <p className="text-xs text-slate-500 font-medium">{fmtDate(log.created_at)}</p>
                    <p className="text-xs text-slate-400">{fmtTime(log.created_at)}</p>
                  </div>
                  {/* Mobile card */}
                  <div className="sm:hidden px-4 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${style.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {log.action}
                      </span>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-slate-500">{fmtDate(log.created_at)}</p>
                        <p className="text-[10px] text-slate-400">{fmtTime(log.created_at)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-snug">{humanize(log.description)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              {filtered.length <= PAGE_SIZE
                ? `Showing ${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`
                : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </p>
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all">
                  <FaChevronLeft size={11} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i - 1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
                  .map((p, i) => p === "..."
                    ? <span key={`e-${i}`} className="px-1.5 text-slate-300 text-xs">…</span>
                    : <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === p ? "bg-[#db6747] text-white shadow-sm" : "text-slate-500 hover:bg-white hover:border hover:border-slate-200 border border-transparent"}`}>
                        {p}
                      </button>
                  )}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all">
                  <FaChevronRight size={11} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 ${className}`}>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}
