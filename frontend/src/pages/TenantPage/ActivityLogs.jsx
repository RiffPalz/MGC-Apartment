import { useState, useEffect, useCallback } from "react";
import { fetchActivityLogs } from "../../api/tenantAPI/ActivityLogsAPI";
import { FaHistory, FaSearch, FaFilter, FaChevronDown } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";

const ACTION_TYPES = [
  "All",
  "ANNOUNCEMENT",
  "PAYMENT",
  "MAINTENANCE",
  "CONTRACT",
  "PROFILE_UPDATE"
];

const ACTION_COLORS = {
  ANNOUNCEMENT:   { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  PAYMENT:        { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500" },
  MAINTENANCE:    { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  CONTRACT:       { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  PROFILE_UPDATE: { bg: "bg-pink-50",   text: "text-pink-700",   dot: "bg-pink-500" }
};

const getActionStyle = (action = "") => {
  const key = action.toUpperCase();
  return ACTION_COLORS[key] || { bg: "bg-[#FDF2ED]", text: "text-[#5c1f10]", dot: "bg-[#D96648]" };
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (search.trim()) filters.search = search.trim();
      if (actionFilter !== "All") filters.action = actionFilter;
      filters.limit = 100;
      const data = await fetchActivityLogs(filters);
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter]);

  useEffect(() => {
    const timer = setTimeout(loadLogs, 300);
    return () => clearTimeout(timer);
  }, [loadLogs]);

  const filtered = logs; // already filtered server-side

  return (
    <div className="min-h-screen bg-[#FFF9F6] p-4 sm:p-6 font-NunitoSans">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <StatCard label="Total Logs" value={logs.length} color="text-[#330101]" />
        <StatCard
          label="Today"
          value={logs.filter((l) => {
            const d = new Date(l.created_at);
            const now = new Date();
            return d.toDateString() === now.toDateString();
          }).length}
          color="text-[#D96648]"
        />
        <StatCard
          label="This Week"
          value={logs.filter((l) => {
            const d = new Date(l.created_at);
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return d >= weekAgo;
          }).length}
          color="text-[#5c1f10]"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#F2DED4] shadow-sm p-4 mb-5">
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D96648]/60 text-sm" />
            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#F2DED4] bg-[#FFF9F6] text-[#330101] placeholder-[#330101]/30 focus:outline-none focus:ring-2 focus:ring-[#D96648]/30 focus:border-[#D96648]"
            />
          </div>
          <div className="flex gap-3">
          {/* Action filter */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-[#F2DED4] bg-[#FFF9F6] text-[#330101] hover:border-[#D96648] transition-colors w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <FaFilter className="text-[#D96648] text-xs" />
                {actionFilter === "All" ? "All Actions" : actionFilter}
              </span>
              <FaChevronDown className="text-xs text-[#330101]/40" />
            </button>
            {showFilterMenu && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-[#F2DED4] rounded-xl shadow-lg z-20 min-w-[160px] overflow-hidden">
                {ACTION_TYPES.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setActionFilter(a); setShowFilterMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      actionFilter === a
                        ? "bg-[#FDF2ED] text-[#D96648] font-bold"
                        : "text-[#330101] hover:bg-[#FFF9F6]"
                    }`}
                  >
                    {a === "All" ? "All Actions" : a}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={loadLogs}
            className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-[#5c1f10] text-white hover:bg-[#7a2e1a] transition-colors shrink-0"
          >
            <MdRefresh className={`text-base ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl border border-[#F2DED4] shadow-sm overflow-hidden">
        {/* Desktop table header */}
        <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 px-5 py-3 bg-[#FDF2ED] border-b border-[#F2DED4]">
          <span className="text-[10px] font-black text-[#330101]/50 uppercase tracking-widest">Action</span>
          <span className="text-[10px] font-black text-[#330101]/50 uppercase tracking-widest">Description</span>
          <span className="text-[10px] font-black text-[#330101]/50 uppercase tracking-widest">Date</span>
          <span className="text-[10px] font-black text-[#330101]/50 uppercase tracking-widest">Time</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-8 w-24 bg-slate-100 rounded-lg" />
                <div className="h-8 flex-1 bg-slate-50 rounded-lg" />
                <div className="h-8 w-24 bg-slate-50 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF2ED] flex items-center justify-center mb-3">
              <FaHistory className="text-[#D96648] text-2xl" />
            </div>
            <p className="text-sm font-bold text-[#330101]">No activity logs found</p>
            <p className="text-xs text-[#330101]/40 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F2DED4]">
            {filtered.map((log) => {
              const style = getActionStyle(log.action);
              return (
                <div key={log.ID} className="group hover:bg-[#FFF9F6] transition-colors">
                  {/* Desktop row */}
                  <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 px-5 py-4 items-center">
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${style.bg} ${style.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {log.action}
                      </span>
                    </div>
                    <p className="text-sm text-[#330101]/80 leading-snug">{log.description || "—"}</p>
                    <p className="text-xs text-[#330101]/60 font-medium">{formatDate(log.created_at)}</p>
                    <p className="text-xs text-[#330101]/40">{formatTime(log.created_at)}</p>
                  </div>

                  {/* Mobile card */}
                  <div className="sm:hidden px-4 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${style.bg} ${style.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {log.action}
                      </span>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-[#330101]/60">{formatDate(log.created_at)}</p>
                        <p className="text-[10px] text-[#330101]/40">{formatTime(log.created_at)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#330101]/70 leading-snug">{log.description || "—"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-[#F2DED4] bg-[#FFF9F6]">
            <p className="text-xs text-[#330101]/40">
              Showing {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#F2DED4] shadow-sm px-4 py-3 ${className}`}>
      <p className="text-[10px] font-black text-[#330101]/40 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}
