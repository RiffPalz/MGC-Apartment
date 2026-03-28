import { useState, useEffect, useCallback } from "react";
import {
  FaSearch, FaTrashAlt, FaEye, FaFileAlt, FaPrint,
  FaUsers, FaCalendarDay, FaCalendarAlt,
  FaChevronLeft, FaChevronRight, FaIdCard, FaEnvelope, FaPhone, FaCommentAlt,
  FaCheckDouble // <-- Added for the "Mark All as Read" button
} from "react-icons/fa";
import { toast } from "react-toastify";
import logo from "../../assets/images/logo.png";
import {
  fetchApplicationRequests,
  fetchApplicationStats,
  deleteApplicationRequest,
} from "../../api/adminAPI/AppRequestAPI";

const PAGE_SIZE = 10;
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "---";
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";

export default function AdminApplicationRequest() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ totalApplications: 0, todayApplications: 0, monthApplications: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewModal, setViewModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [appRes, statsRes] = await Promise.all([fetchApplicationRequests(), fetchApplicationStats()]);
      if (appRes.success) setApplications(appRes.applications || []);
      if (statsRes.success) setStats(statsRes.stats || {});
    } catch { toast.error("Failed to load application requests."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    return a.fullName?.toLowerCase().includes(q) || a.emailAddress?.toLowerCase().includes(q) || a.contactNumber?.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteApplicationRequest(deleteTarget.ID);
      toast.success("Application removed.");
      setDeleteTarget(null);
      load();
    } catch (e) { toast.error(e?.response?.data?.message || "Delete failed."); }
    finally { setDeleting(false); }
  };

  // UI-only handler for Mark All as Read
  const handleMarkAllAsRead = () => {
    // Add your future backend call here
    toast.success("All applications marked as read.");
  };

  return (
    <>
      <style>{`@media print { @page{size:A4 landscape;margin:15mm} body{background:white!important} body *{visibility:hidden} #appreq-print-area,#appreq-print-area *{visibility:visible} #appreq-print-area{position:absolute;left:0;top:0;width:100%} *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important} .no-print{display:none!important} }`}</style>

      {/* ── PRINT AREA ── */}
      <div id="appreq-print-area" className="hidden print:block">
        <div className="flex justify-between items-end border-b-[3px] border-slate-900 pb-5 mb-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="MGC Logo" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none mb-1">MGC BUILDING</h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#db6747]">Application Requests Report</p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500">
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Date Generated:</span>{new Date().toLocaleDateString("en-US")}</p>
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead><tr>{["#", "Full Name", "Email", "Contact", "Message", "Date Submitted"].map(h => <th key={h} className="pb-3 pt-2 px-3 border-b-2 border-slate-300 text-[10px] font-bold uppercase tracking-widest text-slate-500">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((a, i) => (
              <tr key={a.ID} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                <td className="py-2.5 px-3 text-[11px] text-slate-500">{i + 1}</td>
                <td className="py-2.5 px-3 text-[11px] font-bold text-slate-800">{a.fullName}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{a.emailAddress}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{a.contactNumber}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-[200px] truncate">{a.message || "---"}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{fmt(a.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between text-[9px] uppercase tracking-widest text-slate-400 font-bold">
          <p>Total Records: <span className="text-slate-800 text-[11px] ml-1">{filtered.length}</span></p>
          <p>MGC Building</p><p>CONFIDENTIAL</p>
        </div>
      </div>

      {/* ── SCREEN UI ── */}
      <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 no-print min-h-screen">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<FaUsers size={18} />} label="Total Applications" value={stats.totalApplications ?? 0} color="text-blue-500" bg="bg-blue-50" />
          <StatCard icon={<FaCalendarDay size={18} />} label="Today" value={stats.todayApplications ?? 0} color="text-[#db6747]" bg="bg-orange-50" />
          <StatCard icon={<FaCalendarAlt size={18} />} label="This Month" value={stats.monthApplications ?? 0} color="text-emerald-500" bg="bg-emerald-50" />
        </div>

        {/* ── TOOLBAR ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Search by name, email, or contact..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white" />
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:inline">{filtered.length} records</span>
              <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block" />

              {/* Added Mark All as Read Button */}
              <button onClick={handleMarkAllAsRead} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm">
                <FaCheckDouble size={14} /> <span className="uppercase tracking-widest hidden sm:inline">Mark as Read</span>
              </button>

              <button onClick={load} className="px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest">Refresh</button>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                <FaPrint size={12} /> <span className="uppercase tracking-widest hidden sm:inline">Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── DATA TABLE ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4 font-bold">#</th>
                  <th className="px-5 py-4 font-bold">Applicant</th>
                  <th className="px-5 py-4 font-bold">Contact</th>
                  <th className="px-5 py-4 font-bold">Valid ID</th>
                  <th className="px-5 py-4 font-bold">Message</th>
                  <th className="px-5 py-4 font-bold">Date Submitted</th>
                  <th className="px-5 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="py-24 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db6747] mx-auto mb-3" />
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Loading...</p>
                  </td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={7} className="py-24 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaFileAlt className="text-slate-300" size={20} />
                    </div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No applications found</p>
                  </td></tr>
                ) : paginated.map((a, idx) => (
                  <tr key={a.ID} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap"><span className="text-xs font-bold text-slate-400">{(page - 1) * PAGE_SIZE + idx + 1}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-slate-800">{a.fullName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{a.emailAddress}</p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap"><span className="text-sm text-slate-600">{a.contactNumber}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {a.validID ? (
                        <a href={a.validID} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest">
                          <FaIdCard size={12} /> View ID
                        </a>
                      ) : <span className="text-xs text-slate-400">---</span>}
                    </td>
                    <td className="px-5 py-4 max-w-[200px]">
                      {a.message ? <p className="text-xs text-slate-600 truncate" title={a.message}>{a.message}</p>
                        : <span className="text-xs text-slate-400">---</span>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-xs text-slate-700 font-semibold">{fmt(a.created_at)}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{fmtTime(a.created_at)}</p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="View Details" onClick={() => setViewModal(a)}
                          className="p-2 rounded-md text-slate-400 hover:text-[#db6747] hover:bg-orange-50 transition-all"><FaEye size={14} /></button>
                        <button title="Delete" onClick={() => setDeleteTarget(a)}
                          className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><FaTrashAlt size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50 gap-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Showing <span className="text-slate-700">{(page - 1) * PAGE_SIZE + 1}</span> to{" "}
                <span className="text-slate-700">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                <span className="text-slate-700">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all">
                  <FaChevronLeft size={12} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
                  .map((p, idx) => p === "..." ? <span key={`e-${idx}`} className="px-2 text-slate-400 text-xs">...</span> : (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${page === p ? "bg-[#db6747] text-white shadow-sm" : "text-slate-500 hover:bg-white hover:border hover:border-slate-200 border border-transparent"}`}>
                      {p}
                    </button>
                  ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all">
                  <FaChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Application Details</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">Ref #{viewModal.ID}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-slate-800 text-lg px-2">x</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-4 pb-5 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                  <FaUsers className="text-[#db6747]" size={18} />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">{viewModal.fullName}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                    Submitted {fmt(viewModal.created_at)} at {fmtTime(viewModal.created_at)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailRow icon={<FaEnvelope size={12} />} label="Email Address" value={viewModal.emailAddress} />
                <DetailRow icon={<FaPhone size={12} />} label="Contact Number" value={viewModal.contactNumber} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FaIdCard size={11} /> Valid ID</p>
                {viewModal.validID ? (
                  <a href={viewModal.validID} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors uppercase tracking-widest">
                    <FaIdCard size={13} /> Open Valid ID
                  </a>
                ) : <span className="text-xs text-slate-400">No ID uploaded</span>}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FaCommentAlt size={11} /> Message</p>
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
                  <p className="text-sm text-slate-700 leading-relaxed">{viewModal.message || <span className="text-slate-400 italic">No message provided.</span>}</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setViewModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Close</button>
              <button onClick={() => { setDeleteTarget(viewModal); setViewModal(null); }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors">
                <FaTrashAlt size={12} /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <FaTrashAlt className="text-red-500" size={18} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Remove Application</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Remove the application from <span className="font-bold text-slate-900">{deleteTarget.fullName}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60 flex justify-center items-center">
                {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3.5 ${bg} ${color} rounded-lg shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">{icon} {label}</p>
      <p className="text-sm font-semibold text-slate-800">{value || "---"}</p>
    </div>
  );
}