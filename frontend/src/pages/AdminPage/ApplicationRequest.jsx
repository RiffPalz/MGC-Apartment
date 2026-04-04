import { useState, useEffect, useCallback } from "react";
import {
  FaSearch, FaTrashAlt, FaEye, FaFileAlt, FaPrint,
  FaUsers, FaCalendarDay, FaCalendarAlt,
  FaChevronLeft, FaChevronRight, FaIdCard, FaEnvelope, FaPhone, FaCommentAlt,
  FaCheckDouble
} from "react-icons/fa";
import toast from "../../utils/toast";
import logo from "../../assets/images/logo.png";
import {
  fetchApplicationRequests,
  fetchApplicationStats,
  deleteApplicationRequest,
} from "../../api/adminAPI/AppRequestAPI";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

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
  const [confirmMarkRead, setConfirmMarkRead] = useState(false);

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

  const handlePreMarkAllAsRead = () => setConfirmMarkRead(true);

  // UI-only handler for Mark All as Read (hook up backend call here later)
  const doMarkAllAsRead = () => {
    setConfirmMarkRead(false);
    toast.success("All applications marked as read.");
  };

  return (
    <>
      <style>{`@media print { @page{size:A4 landscape;margin:15mm} body{background:white!important} body *{visibility:hidden} #appreq-print-area,#appreq-print-area *{visibility:visible} #appreq-print-area{position:absolute;left:0;top:0;width:100%} *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important} .no-print{display:none!important} }`}</style>

      {/* -- PRINT AREA -- */}
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

      {/* -- SCREEN UI -- */}
      <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 sm:gap-5 no-print min-h-screen overflow-x-hidden">

        {/* 4K Containment Wrapper */}
        <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-4 sm:gap-5 flex-1">

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard icon={<FaUsers size={18} />} label="Total Applications" value={stats.totalApplications ?? 0} color="text-blue-500" bg="bg-blue-50" />
            <StatCard icon={<FaCalendarDay size={18} />} label="Today" value={stats.todayApplications ?? 0} color="text-[#db6747]" bg="bg-orange-50" />
            <StatCard icon={<FaCalendarAlt size={18} />} label="This Month" value={stats.monthApplications ?? 0} color="text-emerald-500" bg="bg-emerald-50" />
          </div>

          {/* -- TOOLBAR -- */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md w-full">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="text" placeholder="Search applicants by name, email, or phone..." value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white shadow-sm" />
              </div>

              <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap w-full md:w-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:inline whitespace-nowrap">{filtered.length} records</span>
                <div className="h-6 w-px bg-slate-200 mx-2 hidden lg:block" />

                <button onClick={handlePreMarkAllAsRead} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition-all shadow-sm active:scale-95 uppercase tracking-widest">
                  <FaCheckDouble size={14} /> Mark as Read
                </button>

                <button onClick={load} className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest active:scale-95">
                  Refresh
                </button>
                <button onClick={() => window.print()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 uppercase tracking-widest">
                  <FaPrint size={12} /> Print
                </button>
              </div>
            </div>
          </div>

          {/* -- DATA TABLE / CARDS -- */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-bold">Applicant</th>
                    <th className="px-5 py-4 font-bold">Contact Info</th>
                    <th className="px-5 py-4 font-bold">Valid ID</th>
                    <th className="px-5 py-4 font-bold">Message Preview</th>
                    <th className="px-5 py-4 font-bold">Date Submitted</th>
                    <th className="px-5 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6} className="py-24 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db6747] mx-auto mb-3" />
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Loading...</p>
                    </td></tr>
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={6} className="py-24 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                        <FaFileAlt className="text-slate-300" size={20} />
                      </div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No applications found</p>
                    </td></tr>
                  ) : paginated.map((a) => (
                    <tr key={a.ID} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#db6747] flex items-center justify-center font-black text-sm shrink-0 border border-orange-100">
                            {a.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{a.fullName}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{a.emailAddress}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><span className="text-sm font-medium text-slate-600">{a.contactNumber}</span></td>
                      <td className="px-5 py-4">
                        {a.validID ? (
                          <a href={a.validID} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded border border-blue-100 uppercase tracking-widest transition-colors">
                            <FaIdCard size={12} /> View ID
                          </a>
                        ) : <span className="text-xs text-slate-400 font-medium">—</span>}
                      </td>
                      <td className="px-5 py-4 max-w-[250px]">
                        {a.message ? <p className="text-xs text-slate-600 truncate font-medium" title={a.message}>{a.message}</p>
                          : <span className="text-xs text-slate-400 italic">No message</span>}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-700 font-semibold">{fmt(a.created_at)}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{fmtTime(a.created_at)}</p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button title="View Details" onClick={() => setViewModal(a)}
                            className="p-2 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all active:scale-95"><FaEye size={13} /></button>
                          <button title="Delete" onClick={() => setDeleteTarget(a)}
                            className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all active:scale-95"><FaTrashAlt size={13} /></button>
                        </div>
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
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                    <FaFileAlt className="text-slate-300" size={20} />
                  </div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No applications found</p>
                </div>
              ) : (
                paginated.map((a) => (
                  <div key={a.ID} className="p-5 space-y-4 hover:bg-white transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#db6747] to-[#e8845f] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                          {a.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-black text-slate-800 truncate leading-tight">{a.fullName}</p>
                          <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{a.emailAddress}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5 flex items-center gap-1"><FaPhone size={9} /> Phone</p>
                        <p className="text-sm font-semibold text-slate-700 truncate">{a.contactNumber}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5 flex items-center gap-1"><FaCalendarDay size={9} /> Submitted</p>
                        <p className="text-xs text-slate-700 font-medium truncate pt-0.5">{fmt(a.created_at)}</p>
                      </div>
                    </div>

                    {a.message && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 italic line-clamp-2">
                        "{a.message}"
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setViewModal(a)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold active:scale-[0.98] transition-transform">
                        <FaEye size={12} /> View Details
                      </button>
                      <button onClick={() => setDeleteTarget(a)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold active:scale-[0.98] transition-transform">
                        <FaTrashAlt size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {!loading && filtered.length > PAGE_SIZE && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50 gap-4 shrink-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                        className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${page === p ? "bg-[#db6747] text-white shadow-sm shadow-orange-200" : "text-slate-500 hover:bg-white hover:border hover:border-slate-200 border border-transparent"}`}>
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
      </div>

      {/* -- VIEW MODAL -- */}
      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div>
                <h2 className="text-slate-800 font-bold text-sm uppercase tracking-widest">Application Profile</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5 font-semibold">Ref #{viewModal.ID}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-slate-800 transition-colors text-lg px-2 active:scale-90 bg-white rounded-md border border-slate-200 shadow-sm w-8 h-8 flex items-center justify-center">✕</button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {/* Applicant Header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#db6747] to-[#e8845f] text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-md">
                  {viewModal.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 leading-tight">{viewModal.fullName}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5"><FaCalendarAlt size={10} className="text-slate-400" /> Applied {fmt(viewModal.created_at)} at {fmtTime(viewModal.created_at)}</p>
                </div>
              </div>

              {/* Contact Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 font-bold"><FaEnvelope size={10} /> Email Address</p>
                  <p className="text-sm font-semibold text-slate-800 break-words">{viewModal.emailAddress}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 font-bold"><FaPhone size={10} /> Phone Number</p>
                  <p className="text-sm font-semibold text-slate-800">{viewModal.contactNumber}</p>
                </div>
              </div>

              {/* Valid ID Section */}
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-bold"><FaIdCard size={11} /> Identification Document</p>
                {viewModal.validID ? (
                  <a href={viewModal.validID} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-bold hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm active:scale-95">
                    <FaIdCard size={16} /> Open Uploaded ID Document
                  </a>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold text-slate-500">No Identification Uploaded</p>
                  </div>
                )}
              </div>

              {/* Message Section */}
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-bold"><FaCommentAlt size={11} /> Message to Admin</p>
                <div className="bg-orange-50/50 rounded-xl border border-orange-100 p-4 shadow-inner relative">
                  <FaCommentAlt className="absolute top-4 right-4 text-orange-200/50" size={32} />
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap relative z-10">{viewModal.message || <span className="text-slate-400 italic">Applicant did not leave a message.</span>}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row gap-3 shrink-0">
              <button onClick={() => setViewModal(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white hover:border-slate-300 shadow-sm transition-all active:scale-95">Close Profile</button>
              <button onClick={() => { setDeleteTarget(viewModal); setViewModal(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold hover:bg-red-100 shadow-sm transition-all active:scale-95">
                <FaTrashAlt size={14} /> Delete Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- CONFIRMATION MODALS -- */}
      <GeneralConfirmationModal
        isOpen={confirmMarkRead}
        onClose={() => setConfirmMarkRead(false)}
        onConfirm={doMarkAllAsRead}
        variant="approve"
        title="Mark All as Read"
        message="Are you sure you want to mark all application requests as read? This will clear any unread notifications on your dashboard."
        confirmText="Yes, Mark as Read"
      />

      <GeneralConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="delete"
        title="Delete Application"
        message={deleteTarget ? <>Are you sure you want to permanently remove the application from <span className="font-bold text-slate-900">{deleteTarget.fullName}</span>?</> : null}
        confirmText="Confirm Delete"
        loading={deleting}
      />
    </>
  );
}

/* ── Sub-components ── */

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3.5 sm:p-4 ${bg} ${color} rounded-xl shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
      </div>
    </div>
  );
}