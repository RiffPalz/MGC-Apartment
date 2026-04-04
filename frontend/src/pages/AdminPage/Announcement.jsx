import { useState, useEffect, useCallback, useRef } from "react";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import { FaSearch, FaPrint, FaBullhorn, FaPlus, FaEdit, FaTrashAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";
import toast from "../../utils/toast";
import logo from "../../assets/images/logo.png";
import {
  fetchAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../api/adminAPI/AnnouncementAPI";

const CATEGORIES = ["General", "Electrical", "Water", "Renovation"];

const CATEGORY_CONFIG = {
  General: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
  Electrical: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", border: "border-amber-200" },
  Water: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-400", border: "border-sky-200" },
  Renovation: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400", border: "border-orange-200" },
};

const PAGE_SIZE = 10;

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";

const EMPTY_FORM = { announcementTitle: "", announcementMessage: "", category: "General" };

export default function AdminAnnouncement() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [page, setPage] = useState(1);

  // Form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  // Modals
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAllAnnouncements();
      if (res.success) setAnnouncements(res.announcements);
      else toast.error("Failed to load announcements");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useSocketEvent("announcements_updated", load);

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!form.announcementTitle.trim() || !form.announcementMessage.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setConfirmSubmit(true);
  };

  const executeSubmit = async () => {
    setConfirmSubmit(false);
    try {
      setSubmitting(true);
      if (editingId) {
        await updateAnnouncement(editingId, form);
        toast.success("Announcement updated");
      } else {
        await createAnnouncement(form);
        toast.success("Announcement sent");
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (a) => {
    setForm({
      announcementTitle: a.announcementTitle,
      announcementMessage: a.announcementMessage,
      category: a.category ?? "General",
    });
    setEditingId(a.ID);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAnnouncement(confirmDelete.ID);
      toast.success("Announcement deleted");
      setConfirmDelete(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    }
  };

  const handlePreCancel = () => {
    if (form.announcementTitle || form.announcementMessage) {
      setConfirmCancel(true);
    } else {
      cancelEdit();
    }
  };

  const cancelEdit = () => {
    setConfirmCancel(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const filtered = announcements.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      (a.announcementTitle ?? "").toLowerCase().includes(q) ||
      (a.announcementMessage ?? "").toLowerCase().includes(q);
    const matchCat = categoryFilter === "All" || a.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    All: announcements.length,
    ...Object.fromEntries(CATEGORIES.map((c) => [c, announcements.filter((a) => a.category === c).length])),
  };

  return (
    <>
      {/* ── PRINT STYLES ── */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body { background: white !important; }
          body * { visibility: hidden; }
          #announcement-print-area, #announcement-print-area * { visibility: visible; }
          #announcement-print-area { position: absolute; left: 0; top: 0; width: 100%; font-family: Arial, sans-serif; font-size: 11pt; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── HIDDEN PRINT AREA ── */}
      <div id="announcement-print-area" className="hidden print:block">
        <div className="flex justify-between items-end border-b-[3px] border-slate-900 pb-5 mb-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="MGC Logo" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none mb-1">MGC BUILDING</h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#db6747]">Announcements Report</p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500 flex flex-col gap-1.5">
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Date Generated:</span> {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Filter:</span> {categoryFilter}</p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {filtered.map((a, i) => (
            <div key={a.ID} className={`p-4 border border-slate-200 rounded-lg ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-slate-900 text-sm">{a.announcementTitle}</p>
                <p className="text-[10px] text-slate-500">{fmt(a.created_at)}</p>
              </div>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-2">{a.category ?? "General"}</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{a.announcementMessage}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[9px] uppercase tracking-widest text-slate-400 font-bold">
          <p>Total Records: <span className="text-slate-800 text-[11px] ml-1">{filtered.length}</span></p>
          <p>MGC Building — Enterprise Property Management System</p>
          <p className="text-right">CONFIDENTIAL</p>
        </div>
      </div>

      {/* ── SCREEN UI ── */}
      <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 sm:gap-5 no-print min-h-screen overflow-x-hidden">

        {/* 4K Containment Wrapper */}
        <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-4 sm:gap-5 flex-1">

          {/* STAT CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={<FaBullhorn size={18} />} label="Total" value={counts.All} color="text-blue-500" bg="bg-blue-50" />
            <StatCard icon={<FaBullhorn size={18} />} label="General" value={counts.General} color="text-slate-500" bg="bg-slate-100" />
            <StatCard icon={<FaBullhorn size={18} />} label="Electrical" value={counts.Electrical} color="text-amber-500" bg="bg-amber-50" />
            <StatCard icon={<FaBullhorn size={18} />} label="Water" value={counts.Water} color="text-sky-500" bg="bg-sky-50" />
          </div>

          {/* COMPOSE FORM */}
          <form onSubmit={handlePreSubmit} ref={formRef} className={`bg-white rounded-xl shadow-sm p-4 md:p-5 transition-all border ${editingId ? "border-[#db6747] ring-2 ring-[#db6747]/10" : "border-slate-200"}`}>
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              {editingId ? "Edit Announcement" : "Compose New Announcement"}
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  required
                  placeholder="Announcement title..."
                  value={form.announcementTitle}
                  onChange={(e) => setForm((f) => ({ ...f, announcementTitle: e.target.value }))}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white shadow-sm"
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white shadow-sm cursor-pointer"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea
                required
                placeholder="Write your announcement message here..."
                value={form.announcementMessage}
                onChange={(e) => setForm((f) => ({ ...f, announcementMessage: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white resize-none shadow-sm"
              />
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
                {(form.announcementTitle || form.announcementMessage || editingId) && (
                  <button
                    type="button"
                    onClick={handlePreCancel}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest active:scale-95"
                  >
                    {editingId ? "Cancel Edit" : "Discard"}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all shadow-sm disabled:opacity-60 uppercase tracking-widest active:scale-95"
                >
                  <FaPlus size={11} />
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Post Announcement"}
                </button>
              </div>
            </div>
          </form>

          {/* TOOLBAR */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative flex-1 max-w-md w-full">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search title or message..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white shadow-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
                <div className="overflow-x-auto custom-scrollbar w-full sm:w-auto pb-1 sm:pb-0 -mb-1 sm:mb-0">
                  <div className="flex bg-slate-100 p-1 rounded-lg min-w-max">
                    {["All", ...CATEGORIES].map((f) => (
                      <button
                        key={f}
                        onClick={() => { setCategoryFilter(f); setPage(1); }}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
                          ${categoryFilter === f ? "bg-white text-[#db6747] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />
                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                  <FaPrint size={12} /> <span className="uppercase tracking-widest">Print</span>
                </button>
              </div>
            </div>
          </div>

          {/* ANNOUNCEMENTS FEED */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400 flex-1">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-[#db6747] rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Loading Announcements...</p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 flex-1">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                  <FaBullhorn className="text-slate-300" size={20} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest">No announcements found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                {paginated.map((a) => (
                  <div key={a.ID} className="p-5 sm:p-6 hover:bg-slate-50/80 transition-colors group">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                      {/* Left: content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <CategoryBadge category={a.category} />
                          {a.announcementTitle && (
                            <span className="text-[10px] font-semibold text-slate-400">{fmt(a.created_at)} at {fmtTime(a.created_at)}</span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1.5 leading-tight">{a.announcementTitle}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                          {a.announcementMessage}
                        </p>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewModal(a)} className="flex-1 sm:flex-none text-[10px] font-bold text-blue-600 bg-blue-50 sm:bg-transparent px-3 py-2 sm:p-2 rounded-md hover:bg-blue-100 transition-all uppercase tracking-widest border border-blue-100 sm:border-transparent active:scale-95">
                          View
                        </button>
                        <button onClick={() => handleEdit(a)} className="flex-1 sm:flex-none text-[10px] font-bold text-[#db6747] bg-orange-50 sm:bg-transparent px-3 py-2 sm:p-2 rounded-md hover:bg-orange-100 transition-all uppercase tracking-widest border border-orange-100 sm:border-transparent active:scale-95 flex justify-center items-center gap-1.5">
                          <FaEdit size={12} className="sm:hidden" /> <span className="sm:hidden">Edit</span>
                          <FaEdit size={14} className="hidden sm:block" />
                        </button>
                        <button onClick={() => setConfirmDelete(a)} className="flex-1 sm:flex-none text-[10px] font-bold text-red-500 bg-red-50 sm:bg-transparent px-3 py-2 sm:p-2 rounded-md hover:bg-red-100 transition-all uppercase tracking-widest border border-red-100 sm:border-transparent active:scale-95 flex justify-center items-center gap-1.5">
                          <FaTrashAlt size={12} className="sm:hidden" /> <span className="sm:hidden">Delete</span>
                          <FaTrashAlt size={14} className="hidden sm:block" />
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}

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

      {/* ── VIEW MODAL ── */}
      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Announcement Details</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5 font-semibold">Posted {fmt(viewModal.created_at)} at {fmtTime(viewModal.created_at)}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-slate-800 transition-colors text-lg px-2 active:scale-90 bg-white rounded-md border border-slate-200 shadow-sm w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h3 className="text-xl font-black text-slate-900 flex-1 leading-tight">{viewModal.announcementTitle}</h3>
                <CategoryBadge category={viewModal.category} />
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 shadow-inner">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{viewModal.announcementMessage}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
              <button
                onClick={() => setViewModal(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-white shadow-sm transition-all uppercase tracking-widest active:scale-95"
              >
                Close
              </button>
              <button
                onClick={() => { handleEdit(viewModal); setViewModal(null); }}
                className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] shadow-sm transition-all uppercase tracking-widest active:scale-95"
              >
                <FaEdit size={11} /> Edit Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE/EDIT CONFIRM MODAL ── */}
      <GeneralConfirmationModal
        isOpen={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={executeSubmit}
        variant="save"
        title={editingId ? "Update Announcement" : "Post Announcement"}
        message={`Are you sure you want to ${editingId ? "save changes to" : "post"} this announcement to all tenants?`}
        confirmText={editingId ? "Save Changes" : "Post Announcement"}
        loading={submitting}
      />

      {/* ── CANCEL CONFIRM MODAL ── */}
      <GeneralConfirmationModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancelEdit}
        variant="warning"
        title="Discard Draft?"
        message="Are you sure you want to discard your draft? Any text you have typed will be lost."
        confirmText="Yes, Discard"
        cancelText="Go Back"
      />

      {/* ── DELETE CONFIRM MODAL ── */}
      <GeneralConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        variant="delete"
        title="Delete Announcement"
        message={confirmDelete ? <>Are you sure you want to permanently delete "<span className="font-bold text-slate-900">{confirmDelete.announcementTitle}</span>"?</> : null}
        confirmText="Confirm Delete"
      />
    </>
  );
}

/* ── Sub-components ── */

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3.5 sm:p-4 ${bg} ${color} rounded-xl shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-none truncate">{value}</p>
      </div>
    </div>
  );
}

function CategoryBadge({ category }) {
  const cc = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.General;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-md border shadow-sm uppercase tracking-wider shrink-0 ${cc.bg} ${cc.text} ${cc.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cc.dot}`} />
      {category ?? "General"}
    </span>
  );
}