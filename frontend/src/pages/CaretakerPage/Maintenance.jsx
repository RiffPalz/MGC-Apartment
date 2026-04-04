import { useState, useEffect, useCallback } from "react";
import { FaSearch, FaPrint, FaTools, FaClock, FaSpinner, FaCheckCircle, FaPlus, FaEye, FaTrashAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import toast from "../../utils/toast";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import logo from "../../assets/images/logo.png";
import {
  fetchAllMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
} from "../../api/caretakerAPI/MaintenanceApi";
import { fetchTenantsOverview } from "../../api/caretakerAPI/TenantsOverviewAPI";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

const PAGE_SIZE = 10;

const STATUS_CONFIG = {
  Pending: { color: "bg-amber-50 text-amber-700 border-amber-200" },
  Approved: { color: "bg-blue-50 text-blue-700 border-blue-200" },
  "In Progress": { color: "bg-purple-50 text-purple-700 border-purple-200" },
  Done: { color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const CATEGORY_CONFIG = {
  "Electrical Maintenance": { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-400", border: "border-amber-200" },
  "Water Interruptions": { bg: "bg-sky-100", text: "text-sky-800", dot: "bg-sky-400", border: "border-sky-200" },
  "Floor Renovation": { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-400", border: "border-orange-200" },
  "Other": { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
  "Others": { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

const EMPTY_FORM = { userId: "", category: "Electrical Maintenance", title: "", description: "" };

export default function CaretakerMaintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [viewModal, setViewModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null); // { req, newStatus }

  const [createModal, setCreateModal] = useState(false);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [tenants, setTenants] = useState([]);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [maintRes, tenantRes] = await Promise.allSettled([
        fetchAllMaintenance(),
        fetchTenantsOverview(),
      ]);
      if (maintRes.status === "fulfilled" && maintRes.value.success)
        setRequests(maintRes.value.data || []);
      if (tenantRes.status === "fulfilled" && tenantRes.value.success)
        setTenants(tenantRes.value.tenants || []);
    } catch {
      toast.error("Failed to load maintenance data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useSocketEvent("maintenance_updated", load);

  const handleStatusChange = (req, newStatus) => {
    setStatusConfirm({ req, newStatus });
  };

  const doStatusChange = async () => {
    const { req, newStatus } = statusConfirm;
    setStatusConfirm(null);
    try {
      setUpdatingId(req.id);
      await updateMaintenance(req.id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMaintenance(confirmDelete.id);
      toast.success("Request deleted");
      setConfirmDelete(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    }
  };

  const handlePreCreate = (e) => {
    e.preventDefault();
    if (!createForm.userId || !createForm.title) return toast.warn("Please fill in required fields.");
    setCreateConfirmOpen(true);
  };

  const doCreate = async () => {
    setCreateConfirmOpen(false);
    try {
      setSubmitting(true);
      await createMaintenance({
        userId: Number(createForm.userId),
        category: createForm.category,
        title: createForm.title,
        description: createForm.description,
        status: "In Progress",
      });
      toast.success("Maintenance request created.");
      setCreateModal(false);
      setCreateForm(EMPTY_FORM);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create request.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = requests
    .filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        String(r.tenant?.unitNumber ?? "").includes(q) ||
        (r.tenant?.fullName ?? "").toLowerCase().includes(q) ||
        (r.title ?? "").toLowerCase().includes(q) ||
        (r.category ?? "").toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "All" ? true :
          statusFilter === "Follow-Up" ? (r.followedUp && r.status !== "In Progress" && r.status !== "Done") :
            r.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const aPin = a.followedUp && a.status !== "In Progress" && a.status !== "Done" ? 1 : 0;
      const bPin = b.followedUp && b.status !== "In Progress" && b.status !== "Done" ? 1 : 0;
      return bPin - aPin;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    All: requests.length,
    Pending: requests.filter((r) => r.status === "Pending").length,
    Approved: requests.filter((r) => r.status === "Approved").length,
    "In Progress": requests.filter((r) => r.status === "In Progress").length,
    Done: requests.filter((r) => r.status === "Done").length,
    "Follow-Up": requests.filter((r) => r.followedUp && r.status !== "In Progress" && r.status !== "Done").length,
  };

  return (
    <>
      {/* ── PRINT STYLES ── */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 15mm; }
          body { background: white !important; }
          body * { visibility: hidden; }
          #maint-print, #maint-print * { visibility: visible; }
          #maint-print { position: absolute; left: 0; top: 0; width: 100%; font-family: Arial, sans-serif; font-size: 11pt; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── HIDDEN PRINT AREA ── */}
      <div id="maint-print" className="hidden print:block">
        <div className="flex justify-between items-end border-b-[3px] border-slate-900 pb-5 mb-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="MGC Logo" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none mb-1">MGC BUILDING</h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#db6747]">Maintenance & Service Report</p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500 flex flex-col gap-1.5">
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Date Generated:</span>{new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Filter:</span>{statusFilter} Requests</p>
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {["Unit", "Tenant", "Request Title", "Category", "Requested", "Start Date", "End Date"].map((h) => (
                <th key={h} className="pb-3 pt-2 px-3 border-b-2 border-slate-300 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                <td className="py-2.5 px-3 text-[11px] font-black text-slate-900">{r.tenant?.unitNumber ?? "—"}</td>
                <td className="py-2.5 px-3 text-[11px] font-bold text-slate-800">{r.tenant?.fullName ?? "—"}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-700">{r.title}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{r.category}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{fmt(r.requestedDate)}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{fmt(r.startDate)}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{fmt(r.endDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
            <StatCard icon={<FaTools size={16} />} label="Total Requests" value={counts.All} color="text-blue-500" bg="bg-blue-50" />
            <StatCard icon={<FaClock size={16} />} label="Pending" value={counts.Pending} color="text-amber-500" bg="bg-amber-50" />
            <StatCard icon={<FaSpinner size={16} />} label="In Progress" value={counts["In Progress"]} color="text-purple-500" bg="bg-purple-50" />
            <StatCard icon={<FaCheckCircle size={16} />} label="Done" value={counts.Done} color="text-emerald-500" bg="bg-emerald-50" />
          </div>

          {/* TOOLBAR */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md w-full">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="text" placeholder="Search unit, tenant, title, or category..."
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white shadow-sm" />
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full lg:w-auto">
                <div className="overflow-x-auto custom-scrollbar w-full sm:w-auto pb-1 sm:pb-0 -mb-1 sm:mb-0">
                  <div className="flex bg-slate-100 p-1 rounded-lg min-w-max">
                    {["All", "Pending", "Approved", "In Progress", "Done", "Follow-Up"].map((f) => (
                      <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                        className={`relative px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
                          ${statusFilter === f ? "bg-white text-[#db6747] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                        {f}
                        {f === "Follow-Up" && counts["Follow-Up"] > 0 && (
                          <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black shadow-sm">
                            {counts["Follow-Up"]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />

                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={load}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm uppercase tracking-widest active:scale-95">
                    Refresh
                  </button>
                  <button onClick={() => window.print()}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active:scale-95">
                    <FaPrint size={12} /> <span className="uppercase tracking-widest">Print</span>
                  </button>
                  <button onClick={() => setCreateModal(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all shadow-sm active:scale-95">
                    <FaPlus size={11} /> <span className="uppercase tracking-widest">New Request</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400 flex-1">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-[#db6747] rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Loading Records...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 flex-1">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <FaTools className="text-slate-300" size={18} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest">No maintenance records found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto flex-1 custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-4 font-bold">Unit</th>
                        <th className="px-5 py-4 font-bold">Tenant</th>
                        <th className="px-5 py-4 font-bold">Request Title</th>
                        <th className="px-5 py-4 font-bold">Category</th>
                        <th className="px-5 py-4 font-bold">Requested</th>
                        <th className="px-5 py-4 font-bold">Timeline</th>
                        <th className="px-5 py-4 font-bold">Status</th>
                        <th className="px-5 py-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginated.map((req) => {
                        const sc = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.Pending;
                        return (
                          <tr key={req.id} className={`hover:bg-slate-50/80 transition-colors group
                              ${req.followedUp && req.status !== "In Progress" && req.status !== "Done" ? "bg-red-50/30 border-l-2 border-l-red-400" : ""}`}>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="text-sm font-black text-[#db6747]">{req.tenant?.unitNumber ?? "—"}</span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <p className="text-sm font-bold text-slate-800">{req.tenant?.fullName ?? "—"}</p>
                            </td>
                            <td className="px-5 py-4 max-w-[200px]">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-slate-800 truncate" title={req.title}>{req.title}</p>
                                {req.followedUp && req.status !== "In Progress" && req.status !== "Done" && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 uppercase tracking-widest shrink-0">
                                    Follow Up
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <CategoryBadge category={req.category} />
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="text-xs text-slate-500">{fmt(req.requestedDate)}</span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              {(req.status === "In Progress" || req.status === "Done") ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[11px] text-slate-600"><span className="text-slate-400 w-8 inline-block">Start</span>{fmt(req.startDate)}</span>
                                  <span className="text-[11px] text-slate-600"><span className="text-slate-400 w-8 inline-block">End</span>{fmt(req.endDate)}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="relative inline-flex items-center">
                                <select value={req.status} disabled={updatingId === req.id}
                                  onChange={(e) => handleStatusChange(req, e.target.value)}
                                  className={`appearance-none cursor-pointer pl-3 pr-6 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-all outline-none disabled:opacity-60 hover:opacity-80 shadow-sm ${sc.color}`}>
                                  <option value="Pending" disabled={["In Progress", "Done"].includes(req.status)}>Pending</option>
                                  <option value="Approved" disabled={["In Progress", "Done"].includes(req.status)}>Approved</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Done">Done</option>
                                </select>
                                <span className={`absolute right-2 pointer-events-none text-[8px] ${sc.color.split(" ")[1]}`}>▾</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button title="View" onClick={() => setViewModal(req)}
                                  className="p-2 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95">
                                  <FaEye size={13} />
                                </button>
                                <button title="Delete" onClick={() => setConfirmDelete(req)}
                                  className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95">
                                  <FaTrashAlt size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="lg:hidden flex-1 overflow-y-auto divide-y divide-slate-100 bg-slate-50/30">
                  {paginated.map((req) => {
                    const sc = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.Pending;
                    return (
                      <div key={req.id} className={`p-5 space-y-4 transition-colors ${req.followedUp && req.status !== "In Progress" && req.status !== "Done" ? "bg-red-50/30 border-l-2 border-l-red-400 hover:bg-red-50/50" : "hover:bg-slate-50"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs font-black text-[#db6747] bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                Unit {req.tenant?.unitNumber ?? "—"}
                              </span>
                              <CategoryBadge category={req.category} />
                              {req.followedUp && req.status !== "In Progress" && req.status !== "Done" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 uppercase tracking-widest shrink-0">
                                  Follow Up
                                </span>
                              )}
                            </div>
                            <p className="text-base font-bold text-slate-800 truncate">{req.title}</p>
                            <p className="text-[11px] text-slate-500 truncate">{req.tenant?.fullName ?? "—"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <div className="min-w-0 flex flex-col justify-center">
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-1">Status</p>
                            <div className="relative inline-flex items-center w-full">
                              <select
                                value={req.status}
                                disabled={updatingId === req.id}
                                onChange={(e) => handleStatusChange(req, e.target.value)}
                                className={`w-full appearance-none cursor-pointer pl-2.5 pr-6 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest border transition-all outline-none disabled:opacity-60 hover:opacity-80 shadow-sm truncate ${sc.color}`}
                              >
                                <option value="Pending" disabled={["In Progress", "Done"].includes(req.status)}>Pending</option>
                                <option value="Approved" disabled={["In Progress", "Done"].includes(req.status)}>Approved</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                              </select>
                              <span className={`absolute right-2 pointer-events-none text-[8px] ${sc.color.split(" ")[1]}`}>▾</span>
                            </div>
                          </div>
                          <div className="min-w-0 flex flex-col justify-center">
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-1">Requested</p>
                            <p className="text-xs text-slate-700 font-medium truncate">{fmt(req.requestedDate)}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button onClick={() => setViewModal(req)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold active:scale-[0.98] transition-transform">
                            <FaEye size={12} /> View
                          </button>
                          <button onClick={() => setConfirmDelete(req)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold active:scale-[0.98] transition-transform">
                            <FaTrashAlt size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINATION FOOTER */}
                {filtered.length > PAGE_SIZE && (
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
                        .map((p, idx) => p === "..." ? (
                          <span key={`e-${idx}`} className="px-2 text-slate-400 text-xs">…</span>
                        ) : (
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── VIEW MODAL ── */}
      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Ticket Details</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">Ref: {viewModal.id}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-slate-800 transition-colors text-lg px-2 active:scale-90">✕</button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Requested By</p>
                  <p className="text-base font-bold text-slate-900">{viewModal.tenant?.fullName}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Unit {viewModal.tenant?.unitNumber}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Current Status</p>
                  <span className={`inline-block text-[10px] font-bold px-3 py-1.5 rounded-md border uppercase tracking-widest shadow-sm ${STATUS_CONFIG[viewModal.status]?.color || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                    {viewModal.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Issue</p>
                  <p className="text-sm font-semibold text-slate-800">{viewModal.title}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Category</p>
                  <CategoryBadge category={viewModal.category} />
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">Description</p>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 shadow-sm">
                  <p className="text-sm text-slate-700 leading-relaxed">{viewModal.description || "No description provided."}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-5 border-t border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Requested</p>
                  <p className="text-xs font-semibold text-slate-800">{fmt(viewModal.requestedDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Start Date</p>
                  <p className="text-xs font-semibold text-slate-800">{fmt(viewModal.startDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">End Date</p>
                  <p className="text-xs font-semibold text-slate-800">{fmt(viewModal.endDate)}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button onClick={() => setViewModal(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest active:scale-95">
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {createModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">New Maintenance Request</h2>
              <button onClick={() => setCancelConfirmOpen(true)} className="text-slate-400 hover:text-slate-800 text-lg px-2 active:scale-90">✕</button>
            </div>
            <form onSubmit={handlePreCreate} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Tenant</label>
                <select required value={createForm.userId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, userId: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm">
                  <option value="">Select tenant...</option>
                  {tenants.map((t) => (
                    <option key={t.ID} value={t.ID}>
                      Unit {t.unitNumber ?? t.contracts?.[0]?.unit?.unit_number ?? "—"} — {t.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Category</label>
                <select required value={createForm.category}
                  onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm">
                  <option value="Electrical Maintenance">Electrical Maintenance</option>
                  <option value="Water Interruptions">Water Interruptions</option>
                  <option value="Floor Renovation">Floor Renovation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Title</label>
                <input required type="text" value={createForm.title}
                  onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Brief issue title"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Description</label>
                <textarea rows={4} value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the issue in detail..."
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm resize-none" />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 sm:pt-6 border-t border-slate-100 mt-6 sm:mt-8">
                <button type="button" onClick={() => setCancelConfirmOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95 uppercase tracking-widest">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#db6747] text-white text-sm font-bold hover:bg-[#c45a3a] transition-colors shadow-md disabled:opacity-60 active:scale-95 uppercase tracking-wider">
                  {submitting ? "Creating..." : "Create Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CANCEL CONFIRM MODAL ── */}
      <GeneralConfirmationModal
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={() => {
          setCancelConfirmOpen(false);
          setCreateModal(false);
          setCreateForm(EMPTY_FORM);
        }}
        variant="warning"
        title="Discard Request?"
        message="Are you sure you want to cancel? Any entered details will be lost."
        confirmText="Yes, Discard"
        cancelText="Go Back"
      />

      {/* ── CREATE CONFIRM MODAL ── */}
      <GeneralConfirmationModal
        isOpen={createConfirmOpen}
        onClose={() => setCreateConfirmOpen(false)}
        onConfirm={doCreate}
        variant="save"
        title="Create Maintenance Request"
        message={`Are you sure you want to create a new "${createForm.category}" request for this tenant?`}
        confirmText="Create Request"
        loading={submitting}
      />

      {/* STATUS CONFIRM MODAL */}
      <GeneralConfirmationModal
        isOpen={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        onConfirm={doStatusChange}
        variant="warning"
        title="Update Status"
        message={statusConfirm
          ? <>Change status of <span className="font-bold text-slate-900">"{statusConfirm.req.title}"</span> to <span className="font-bold text-slate-900">{statusConfirm.newStatus}</span>?</>
          : null}
        confirmText="Yes, Update"
        cancelText="Cancel"
      />

      {/* DELETE CONFIRM MODAL */}
      <GeneralConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        variant="delete"
        title="Delete Request"
        message={confirmDelete ? <>Are you sure you want to remove "<span className="font-bold text-slate-900">{confirmDelete.title}</span>"? This action cannot be undone.</> : null}
        confirmText="Delete"
      />
    </>
  );
}

/* ── Sub-components ── */

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 sm:p-3.5 ${bg} ${color} rounded-lg shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-black text-slate-800 leading-none truncate">{value}</p>
      </div>
    </div>
  );
}

function CategoryBadge({ category }) {
  const cc = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG["Other"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[9px] sm:text-[11px] font-semibold px-2 py-1 sm:px-2.5 rounded-md border shadow-sm ${cc.bg} ${cc.text} ${cc.border} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cc.dot}`} />
      {category}
    </span>
  );
}