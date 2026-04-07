import { useState, useEffect, useCallback } from "react";
import { fetchActivityLogs } from "../../api/tenantAPI/ActivityLogsAPI";
import { FaHistory, FaSearch, FaFilter, FaChevronDown } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";

const ACTION_TYPES = [
  "All",
  "PAYMENT",
  "MAINTENANCE",
  "LOGIN",
  "UPDATE PROFILE"
];

const ACTION_COLORS = {
  PAYMENT: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  MAINTENANCE: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  LOGIN: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "UPDATE PROFILE": { bg: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-500" }
};

const getActionStyle = (action = "") => {
  const upper = action.toUpperCase();
  // exact match first
  if (ACTION_COLORS[upper]) return ACTION_COLORS[upper];
  // partial match (e.g. "CREATE MAINTENANCE" → MAINTENANCE)
  const match = Object.keys(ACTION_COLORS).find((k) => upper.includes(k));
  return match ? ACTION_COLORS[match] : { bg: "bg-[#FDF2ED]", text: "text-[#5c1f10]", dot: "bg-[#D96648]" };
};

// Transforms raw/legacy descriptions into human-friendly sentences
const humanizeDescription = (_, description = "") => {
  const d = description.trim();

  // Already well-formed "You ..." sentences — return as-is
  if (/^You (submitted|uploaded|sent|updated|logged|created)/i.test(d)) return d;

  // Legacy: "You created maintenance request: <title>"
  const createdMaint = d.match(/you created maintenance request:\s*(.+)/i);
  if (createdMaint) return `You submitted a maintenance request: "${createdMaint[1].trim()}".`;

  // Legacy: "Tenant followed up on maintenance request: <title>"
  const followUp = d.match(/tenant followed up on maintenance request:\s*(.+)/i);
  if (followUp) return `You sent a follow-up on your maintenance request: "${followUp[1].trim()}".`;

  // Legacy: "You uploaded receipt for payment ID <id>"
  const receiptId = d.match(/you uploaded receipt for payment id\s*\d+/i);
  if (receiptId) return "You uploaded a receipt for your bill.";

  // Fallback — capitalize first letter and ensure "You" perspective
  if (d.toLowerCase().startsWith("tenant ")) {
    return "You " + d.slice(7);
  }

  return d || "Activity recorded.";
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
  const [allLogs, setAllLogs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchActivityLogs({ limit: 100 });
      setAllLogs(data.logs || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
      setAllLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Client-side filtering
  useEffect(() => {
    let result = allLogs;
    if (search.trim()) {
      result = result.filter((l) =>
        l.description?.toLowerCase().includes(search.toLowerCase()) ||
        l.action?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (actionFilter !== "All") {
      result = result.filter((l) => l.action?.toUpperCase().includes(actionFilter.toUpperCase()));
    }
    setLogs(result);
  }, [allLogs, search, actionFilter]);

  const filtered = logs;

  return (
    <div className="min-h-screen bg-[#FFF9F6] px-3 sm:px-5 md:px-8 xl:px-12 py-5 md:py-8 font-NunitoSans">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <StatCard label="Total Logs" value={allLogs.length} color="text-[#330101]" />
        <StatCard
          label="Today"
          value={allLogs.filter((l) => {
            const d = new Date(l.created_at);
            const now = new Date();
            return d.toDateString() === now.toDateString();
          }).length}
          color="text-[#D96648]"
        />
        <StatCard
          label="This Week"
          value={allLogs.filter((l) => {
            const d = new Date(l.created_at);
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return d >= weekAgo;
          }).length}
          color="text-[#5c1f10]"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Toolbar — single row */}
      <div className="bg-white rounded-2xl border border-[#F2DED4] shadow-sm px-4 py-3 mb-5">
        <div className="flex items-center gap-3">

          {/* Search */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D96648]/60 text-sm" />
            <input
              type="text"
              placeholder="Search action or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#F2DED4] bg-[#FFF9F6] text-[#330101] placeholder-[#330101]/30 focus:outline-none focus:ring-2 focus:ring-[#D96648]/30 focus:border-[#D96648]"
            />
          </div>

          {/* Action filter */}
          <div className="relative shrink-0">
            {showFilterMenu && (
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
            )}
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-[#F2DED4] bg-[#FFF9F6] text-[#330101] hover:border-[#D96648] transition-colors whitespace-nowrap"
            >
              <FaFilter className="text-[#D96648] text-xs shrink-0" />
              {actionFilter === "All" ? (
                <span className="font-bold">All Actions</span>
              ) : (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold ${getActionStyle(actionFilter).bg} ${getActionStyle(actionFilter).text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getActionStyle(actionFilter).dot}`} />
                  {actionFilter}
                </span>
              )}
              <FaChevronDown className={`text-xs text-[#330101]/40 transition-transform ${showFilterMenu ? "rotate-180" : ""}`} />
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#F2DED4] rounded-xl shadow-lg z-20 min-w-[180px] overflow-hidden">
                {ACTION_TYPES.map((a) => {
                  const style = a !== "All" ? getActionStyle(a) : null;
                  return (
                    <button
                      key={a}
                      onClick={() => { setActionFilter(a); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2.5 ${
                        actionFilter === a ? "bg-[#FDF2ED] font-bold" : "hover:bg-[#FFF9F6]"
                      }`}
                    >
                      {style ? (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold ${style.bg} ${style.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {a}
                        </span>
                      ) : (
                        <span className="text-[#330101] font-bold">All Actions</span>
                      )}
                      {actionFilter === a && <span className="ml-auto text-[#D96648] text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={loadLogs}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-[#F2DED4] bg-[#FFF9F6] text-[#330101] hover:bg-[#FDF2ED] hover:border-[#D96648] transition-colors shrink-0 uppercase tracking-widest"
          >
            <MdRefresh className={`text-base text-[#D96648] ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Last refresh timestamp */}
          {lastRefresh && (
            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-bold text-[#330101]/30 uppercase tracking-widest shrink-0 whitespace-nowrap">
              <MdRefresh size={10} />
              {lastRefresh.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          )}

        </div>
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl border border-[#F2DED4] shadow-sm overflow-hidden">
        {/* Desktop table header */}
        <div className="hidden sm:grid grid-cols-[40px_1fr_2fr_120px_100px] gap-4 px-5 py-3 bg-[#FDF2ED] border-b border-[#F2DED4]">
          <span className="text-[10px] font-black text-[#330101]/50 uppercase tracking-widest">#</span>
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
            {filtered.map((log, idx) => {
              const style = getActionStyle(log.action);
              return (
                <div key={log.ID} className="group hover:bg-[#FFF9F6] transition-colors">
                  {/* Desktop row */}
                  <div className="hidden sm:grid grid-cols-[40px_1fr_2fr_120px_100px] gap-4 px-5 py-3.5 items-center">
                    <span className="text-xs text-[#330101]/30 font-bold tabular-nums">{idx + 1}</span>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${style.bg} ${style.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {log.action}
                      </span>
                    </div>
                    <p className="text-sm text-[#330101]/80 leading-snug">{humanizeDescription(log.action, log.description || "")}</p>
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
                    <p className="text-sm text-[#330101]/70 leading-snug">{humanizeDescription(log.action, log.description || "")}</p>
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