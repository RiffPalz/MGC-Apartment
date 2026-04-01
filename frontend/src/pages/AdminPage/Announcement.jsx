import { useState, useEffect, useCallback, useRef } from "react";
import { FaSearch, FaPrint, FaBullhorn, FaPlus, FaEdit, FaTrashAlt } from "react-icons/fa";
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
  Electrical: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-400", border: "border-amber-200" },
  Water: { bg: "bg-sky-100", text: "text-sky-800", dot: "bg-sky-400", border: "border-sky-200" },
  Renovation: { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-400", border: "border-orange-200" },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

function CategoryBadge({ category }) {
  const cc = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.General;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border ${cc.bg} ${cc.text} ${cc.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cc.dot}`} />
      {category ?? "General"}
    </span>
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

const EMPTY_FORM = { announcementTitle: "", announcementMessage: "", category: "General" };

export default function AdminAnnouncement() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  // Modals
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewModal, setViewModal] = useState(null);

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

  const handleSubmit = async () => {
    if (!form.announcementTitle.trim() || !form.announcementMessage.trim()) {
      toast.error("Title and message are required");
      return;
    }
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

  const cancelEdit = () => {
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
      <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 no-print min-h-screen">

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<FaBullhorn size={16} />} label="Total" value={counts.All} color="text-blue-500" bg="bg-blue-50" />
          <StatCard icon={<FaBullhorn size={16} />} label="General" value={counts.General} color="text-slate-500" bg="bg-slate-100" />
          <StatCard icon={<FaBullhorn size={16} />} label="Electrical" value={counts.Electrical} color="text-amber-500" bg="bg-amber-50" />
          <StatCard icon={<FaBullhorn size={16} />} label="Water" value={counts.Water} color="text-sky-500" bg="bg-sky-50" />
        </div>

        {/* COMPOSE FORM */}
        <div ref={formRef} className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${editingId ? "border-[#db6747] ring-2 ring-[#db6747]/20" : "border-slate-200"}`}>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            {editingId ? "Edit Announcement" : "New Announcement"}
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Announcement title..."
                value={form.announcementTitle}
                onChange={(e) => setForm((f) => ({ ...f, announcementTitle: e.target.value }))}
                className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white"
              />
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <textarea
              placeholder="Write your announcement message..."
              value={form.announcementMessage}
              onChange={(e) => setForm((f) => ({ ...f, announcementMessage: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white resize-none"
            />
            <div className="flex gap-3 justify-end">
              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all shadow-sm disabled:opacity-60 uppercase tracking-widest"
              >
                <FaPlus size={11} />
                {submitting ? "Saving..." : editingId ? "Save Changes" : "Send Announcement"}
              </button>
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search title or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="overflow-x-auto">
              <div className="flex bg-slate-100 p-1 rounded-lg min-w-max">
                {["All", ...CATEGORIES].map((f) => (
                  <button
                    key={f}
                    onClick={() => setCategoryFilter(f)}
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
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
              >
                <FaPrint size={12} /> <span className="uppercase tracking-widest">Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* ANNOUNCEMENTS LIST */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-[#db6747] rounded-full animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Loading Announcements...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <p className="text-[11px] font-bold uppercase tracking-widest">No announcements found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <div key={a.ID} className="p-5 hover:bg-slate-50/80 transition-colors group">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="text-sm font-bold text-slate-900">{a.announcementTitle}</h3>
                        <CategoryBadge category={a.category} />
                        {a.announcementTitle && (
                          <span className="text-[10px] text-slate-400">{fmt(a.created_at)}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 whitespace-pre-wrap">
                        {a.announcementMessage}
                      </p>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setViewModal(a)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(a)}
                        className="p-2 rounded-md text-slate-400 hover:text-[#db6747] hover:bg-orange-50 transition-all"
                        title="Edit"
                      >
                        <FaEdit size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(a)}
                        className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Delete"
                      >
                        <FaTrashAlt size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── VIEW MODAL ── */}
      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Announcement Details</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">{fmt(viewModal.created_at)}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-slate-800 transition-colors text-lg px-2">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-slate-900 flex-1">{viewModal.announcementTitle}</h3>
                <CategoryBadge category={viewModal.category} />
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{viewModal.announcementMessage}</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { handleEdit(viewModal); setViewModal(null); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                  <FaEdit size={11} /> Edit
                </button>
                <button
                  onClick={() => setViewModal(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 transition-all uppercase tracking-widest"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      <GeneralConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        variant="delete"
        title="Delete Announcement"
        message={confirmDelete ? <>Are you sure you want to delete "<span className="font-bold text-slate-900">{confirmDelete.announcementTitle}</span>"? This action cannot be undone.</> : null}
        confirmText="Confirm Removal"
      />
    </>
  );
}
