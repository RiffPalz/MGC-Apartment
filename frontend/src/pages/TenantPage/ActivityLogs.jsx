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
  ANNOUNCEMENT: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  PAYMENT: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  MAINTENANCE: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  CONTRACT: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  PROFILE_UPDATE: { bg: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-500" }
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
    <div className="min-h-screen bg-[#FFF9F6] w-full px-4 sm:px-6 md:px-10 2xl:px-14 py-6 md:py-10 2xl:py-14 font-NunitoSans">
      <div className="max-w-[1600px] mx-auto space-y-5 sm:space-y-6 2xl:space-y-8">

        {/* STATS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 2xl:gap-6">
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

        {/* FILTERS SECTION */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#F2DED4] shadow-sm p-4 sm:p-5 2xl:p-6">
          <div className="flex flex-col md:flex-row gap-3 2xl:gap-5 justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80 2xl:w-96">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D96648]/60 text-sm" />
              <input
                type="text"
                placeholder="Search activity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 2xl:py-3 text-xs sm:text-sm 2xl:text-base rounded-xl border border-[#F2DED4] bg-[#FFF9F6] text-[#330101] placeholder-[#330101]/40 focus:outline-none focus:ring-2 focus:ring-[#f7b094] transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Action filter */}
              <div className="relative flex-1 sm:min-w-[180px] 2xl:min-w-[200px]">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center justify-between gap-2 px-4 py-2.5 2xl:py-3 text-xs sm:text-sm 2xl:text-base rounded-xl border border-[#F2DED4] bg-[#FFF9F6] text-[#330101] hover:border-[#f7b094] transition-all w-full shadow-sm"
                >
                  <span className="flex items-center gap-2 font-bold">
                    <FaFilter className="text-[#D96648]" />
                    {actionFilter === "All" ? "All Actions" : actionFilter}
                  </span>
                  <FaChevronDown className="text-xs text-[#330101]/40" />
                </button>
                {showFilterMenu && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#F2DED4] rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {ACTION_TYPES.map((a) => (
                      <button
                        key={a}
                        onClick={() => { setActionFilter(a); setShowFilterMenu(false); }}
                        className={`w-full text-left px-4 py-3 text-xs sm:text-sm transition-colors ${actionFilter === a
                            ? "bg-[#FDF2ED] text-[#D96648] font-black"
                            : "text-[#330101] hover:bg-[#FFF9F6] font-bold"
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
                className="flex items-center justify-center gap-2 px-5 py-2.5 2xl:py-3 text-xs sm:text-sm 2xl:text-base rounded-xl bg-[#5c1f10] text-[#FFEDE1] font-bold hover:bg-[#7a2e1a] transition-all shrink-0 active:scale-[0.98] shadow-md"
              >
                <MdRefresh className={`text-base 2xl:text-lg ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* LOG LIST CARD */}
        <div className="bg-white rounded-3xl sm:rounded-4xl border border-[#F2DED4] shadow-sm overflow-hidden flex flex-col">
          {/* Desktop table header */}
          <div className="hidden lg:grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 px-6 2xl:px-8 py-4 2xl:py-5 bg-[#FDF2ED] border-b border-[#F2DED4] shrink-0">
            <span className="text-[10px] 2xl:text-xs font-black text-[#330101]/60 uppercase tracking-widest">Action</span>
            <span className="text-[10px] 2xl:text-xs font-black text-[#330101]/60 uppercase tracking-widest">Description</span>
            <span className="text-[10px] 2xl:text-xs font-black text-[#330101]/60 uppercase tracking-widest">Date</span>
            <span className="text-[10px] 2xl:text-xs font-black text-[#330101]/60 uppercase tracking-widest">Time</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[400px]">
            {loading ? (
              <div className="p-6 sm:p-8 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse flex flex-col sm:flex-row gap-4">
                    <div className="h-10 w-32 bg-slate-100 rounded-xl" />
                    <div className="h-10 flex-1 bg-slate-50 rounded-xl" />
                    <div className="hidden sm:block h-10 w-24 bg-slate-50 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 2xl:py-32 text-center px-4">
                <div className="w-16 h-16 2xl:w-20 2xl:h-20 rounded-2xl bg-[#FDF2ED] flex items-center justify-center mb-4 shadow-sm">
                  <FaHistory className="text-[#D96648] text-3xl 2xl:text-4xl" />
                </div>
                <p className="text-base 2xl:text-lg font-black text-[#330101]">No activity logs found</p>
                <p className="text-xs 2xl:text-sm text-[#330101]/50 mt-1.5">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F2DED4]">
                {filtered.map((log) => {
                  const style = getActionStyle(log.action);
                  return (
                    <div key={log.ID} className="group hover:bg-[#FFF9F6] transition-colors">
                      {/* Desktop row */}
                      <div className="hidden lg:grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 px-6 2xl:px-8 py-5 2xl:py-6 items-center">
                        <div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs 2xl:text-sm font-bold shadow-sm ${style.bg} ${style.text}`}>
                            <span className={`w-1.5 h-1.5 2xl:w-2 2xl:h-2 rounded-full ${style.dot}`} />
                            {log.action}
                          </span>
                        </div>
                        <p className="text-sm 2xl:text-base text-[#330101]/80 leading-snug truncate pr-4" title={log.description}>{log.description || "—"}</p>
                        <p className="text-xs 2xl:text-sm text-[#330101]/70 font-bold">{formatDate(log.created_at)}</p>
                        <p className="text-xs 2xl:text-sm text-[#330101]/50 font-bold">{formatTime(log.created_at)}</p>
                      </div>

                      {/* Mobile / Tablet card */}
                      <div className="lg:hidden px-5 py-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold shadow-sm ${style.bg} ${style.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {log.action}
                          </span>
                          <div className="text-right shrink-0 bg-white border border-[#F2DED4] px-3 py-1.5 rounded-lg shadow-sm">
                            <p className="text-[10px] sm:text-xs font-bold text-[#330101]/80">{formatDate(log.created_at)}</p>
                            <p className="text-[9px] sm:text-[10px] font-bold text-[#330101]/40">{formatTime(log.created_at)}</p>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-[#330101]/80 leading-relaxed bg-white border border-[#F2DED4]/50 p-3 rounded-xl shadow-sm">
                          {log.description || "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="px-6 2xl:px-8 py-4 2xl:py-5 border-t border-[#F2DED4] bg-slate-50/50 shrink-0">
              <p className="text-xs 2xl:text-sm font-bold text-[#330101]/40 uppercase tracking-widest">
                Showing <span className="text-[#D96648]">{filtered.length}</span> {filtered.length === 1 ? "entry" : "entries"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, className = "" }) {
  return (
    <div className={`bg-white rounded-3xl border border-[#F2DED4] shadow-sm px-5 sm:px-6 2xl:px-8 py-5 2xl:py-7 transition-all hover:scale-[1.02] hover:shadow-md ${className}`}>
      <p className="text-[9px] sm:text-[10px] 2xl:text-xs font-black text-[#330101]/40 uppercase tracking-widest mb-1.5 2xl:mb-2">{label}</p>
      <p className={`text-2xl sm:text-3xl 2xl:text-4xl font-black truncate ${color}`}>{value}</p>
    </div>
  );
}