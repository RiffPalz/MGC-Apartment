import { useState, useEffect, useCallback } from "react";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import { FaSearch, FaPrint, FaFileContract, FaCheckCircle, FaTimesCircle, FaClock, FaPlus, FaEye, FaEdit, FaSync, FaDownload, FaFilePdf, FaTrashAlt } from "react-icons/fa";
import toast from "../../utils/toast";
import logo from "../../assets/images/logo.png";
import {
  fetchContractDashboard,
  createContract,
  editContract,
  terminateContract,
  completeContract,
  renewContract,
  generateContractPdf,
  getContractPdfProxyUrl,
  deleteContract,
} from "../../api/adminAPI/ContractAPI";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

const STATUS_CONFIG = {
  Active: { color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Completed: { color: "bg-blue-50 text-blue-700 border-blue-200" },
  Terminated: { color: "bg-red-50 text-red-700 border-red-200" },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

// Strip leading bullet characters from text for clean display
const stripBullets = (text) =>
  text ? text.replace(/^[•\-*]\s*/gm, "").trim() : "";

const EMPTY_CREATE = {
  unit_id: "",
  rent_amount: "",
  start_date: "",
  end_date: "",
  tenancy_rules: "2500/month for single person\n3000/month for 2 persons\n1 month deposit\n1 month advance\nOnly 2-wheeled vehicles are allowed\nNo pets allowed",
  termination_renewal_conditions: "Termination: Must be communicated at least 30 days in advance\nRenewal: Must be communicated at least 30 days in advance",
  contractFile: null,
};

const EMPTY_RENEW = { newStartDate: "", newEndDate: "" };

export default function AdminContract() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [allUnits, setAllUnits] = useState([]);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [renewModal, setRenewModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editForm, setEditForm] = useState({});
  const [renewForm, setRenewForm] = useState(EMPTY_RENEW);
  const [submitting, setSubmitting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(null);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [generateConfirmTarget, setGenerateConfirmTarget] = useState(null);

  // Cancel Interceptors
  const [cancelCreateOpen, setCancelCreateOpen] = useState(false);
  const [cancelEditOpen, setCancelEditOpen] = useState(false);
  const [cancelRenewOpen, setCancelRenewOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const dashRes = await fetchContractDashboard();
      if (dashRes.success) {
        setContracts(dashRes.contracts || []);
        setAllUnits(dashRes.units || []);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useSocketEvent("contract_updated", load);
  const handleCreate = (e) => {
    e.preventDefault();
    setCreateConfirmOpen(true);
  };

  const doCreate = async () => {
    setCreateConfirmOpen(false);
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("rent_amount", createForm.rent_amount);
      fd.append("start_date", createForm.start_date);
      fd.append("end_date", createForm.end_date);
      fd.append("status", "Active");
      fd.append("tenancy_rules", createForm.tenancy_rules);
      fd.append("termination_renewal_conditions", createForm.termination_renewal_conditions);
      const res = await createContract(createForm.unit_id, fd);
      toast.success("Contract created");

      // Auto-generate PDF immediately after creation
      if (res.contract?.ID) {
        setGeneratingPdf(res.contract.ID);
        try {
          await generateContractPdf(res.contract.ID);
          toast.success("Contract PDF generated");
        } catch {
          toast.error("Contract created but PDF generation failed. Use the generate button.");
        } finally {
          setGeneratingPdf(null);
        }
      }

      setCreateModal(false);
      setCreateForm(EMPTY_CREATE);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create contract");
    } finally {
      setSubmitting(false);
    }
  };

  // ── EDIT ──
  const openEdit = (c) => {
    setEditForm({
      start_date: c.start_date ?? "",
      end_date: c.end_date ?? "",
      rent_amount: c.rent_amount ?? "",
      tenancy_rules: c.tenancy_rules ?? "",
      termination_renewal_conditions: c.termination_renewal_conditions ?? "",
      contractFile: null,
    });
    setEditModal(c);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => {
        if (k === "contractFile" && v) fd.append("contractFile", v);
        else if (k !== "contractFile") fd.append(k, v);
      });
      await editContract(editModal.ID, fd);
      toast.success("Contract updated");
      setEditModal(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update contract");
    } finally {
      setSubmitting(false);
    }
  };

  // ── RENEW ──
  const handleRenew = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await renewContract(renewModal.ID, {
        newStartDate: renewForm.newStartDate,
        newEndDate: renewForm.newEndDate,
      });
      toast.success("Contract renewed and PDF regenerated");
      setRenewModal(null);
      setRenewForm(EMPTY_RENEW);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to renew contract");
    } finally {
      setSubmitting(false);
    }
  };

  // ── TERMINATE / COMPLETE ──
  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    try {
      setSubmitting(true);
      if (confirmModal.action === "terminate") {
        await terminateContract(confirmModal.contract.ID);
        toast.success("Contract terminated");
      } else {
        await completeContract(confirmModal.contract.ID);
        toast.success("Contract marked as completed");
      }
      setConfirmModal(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── DELETE ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteContract(deleteTarget.ID);
      toast.success("Contract deleted.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete contract.");
    } finally {
      setDeleting(false);
    }
  };

  // ── GENERATE PDF ──
  const handleGeneratePdf = (contract) => {
    setGenerateConfirmTarget(contract);
  };

  const doGeneratePdf = async () => {
    const contract = generateConfirmTarget;
    setGenerateConfirmTarget(null);
    try {
      setGeneratingPdf(contract.ID);
      const res = await generateContractPdf(contract.ID);
      toast.success("Contract PDF generated successfully");
      setContracts((prev) =>
        prev.map((c) =>
          c.ID === contract.ID ? { ...c, contract_file: res.contract_file, contract_file_download: res.contract_file } : c
        )
      );
      if (viewModal?.ID === contract.ID) {
        setViewModal((v) => ({ ...v, contract_file: res.contract_file, contract_file_download: res.contract_file }));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to generate PDF");
    } finally {
      setGeneratingPdf(null);
    }
  };

  const openViewModal = (c) => setViewModal(c);
  const closeViewModal = () => setViewModal(null);

  const filtered = contracts.filter((c) => {
    const q = search.toLowerCase();
    const tenantNames = (c.tenants ?? []).map((t) => t.fullName ?? "").join(" ").toLowerCase();
    const matchSearch = String(c.unit_number ?? "").toLowerCase().includes(q) || tenantNames.includes(q);
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    All: contracts.length,
    Active: contracts.filter((c) => c.status === "Active").length,
    Completed: contracts.filter((c) => c.status === "Completed").length,
    Terminated: contracts.filter((c) => c.status === "Terminated").length,
  };

  const occupiedUnits = allUnits.filter((u) => u.status === "Ready");

  return (
    <>
      {/* ── PRINT STYLES ── */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 15mm; }
          body { background: white !important; }
          body * { visibility: hidden; }
          #contract-print-area, #contract-print-area * { visibility: visible; }
          #contract-print-area { position: absolute; left: 0; top: 0; width: 100%; font-family: Arial, sans-serif; font-size: 11pt; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── HIDDEN PRINT AREA ── */}
      <div id="contract-print-area" className="hidden print:block">
        <div className="flex justify-between items-end border-b-[3px] border-slate-900 pb-5 mb-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="MGC Logo" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none mb-1">MGC BUILDING</h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#db6747]">Contract Management Report</p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500 flex flex-col gap-1.5">
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Date Generated:</span>{new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Filter:</span>{statusFilter}</p>
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {["Unit", "Tenants", "Rent/Month", "Start Date", "End Date", "Status"].map((h) => (
                <th key={h} className="pb-3 pt-2 px-3 border-b-2 border-slate-300 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((c, i) => (
              <tr key={c.ID} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                <td className="py-2.5 px-3 text-[11px] font-black text-slate-900">{c.unit_number}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-700">{(c.tenants ?? []).map((t) => t.fullName).join(", ") || "—"}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-700">₱{Number(c.rent_amount ?? 0).toLocaleString()}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{fmt(c.start_date)}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{fmt(c.end_date)}</td>
                <td className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[9px] uppercase tracking-widest text-slate-400 font-bold">
          <p>Total Records: <span className="text-slate-800 text-[11px] ml-1">{filtered.length}</span></p>
          <p>MGC Building — Apartment Monitoring System</p>
          <p className="text-right">CONFIDENTIAL</p>
        </div>
      </div>

      {/* ── SCREEN UI ── */}
      <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 sm:gap-5 no-print min-h-screen overflow-x-hidden">

        {/* 4K Containment Wrapper */}
        <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-4 sm:gap-5 flex-1">

          {/* STAT CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={<FaFileContract size={16} />} label="Total" value={counts.All} color="text-blue-500" bg="bg-blue-50" />
            <StatCard icon={<FaCheckCircle size={16} />} label="Active" value={counts.Active} color="text-emerald-500" bg="bg-emerald-50" />
            <StatCard icon={<FaClock size={16} />} label="Completed" value={counts.Completed} color="text-blue-500" bg="bg-blue-50" />
            <StatCard icon={<FaTimesCircle size={16} />} label="Terminated" value={counts.Terminated} color="text-red-500" bg="bg-red-50" />
          </div>

          {/* TOOLBAR */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md w-full">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search unit or tenant name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white shadow-sm"
                />
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full lg:w-auto">
                <div className="overflow-x-auto custom-scrollbar w-full sm:w-auto pb-1 sm:pb-0 -mb-1 sm:mb-0">
                  <div className="flex bg-slate-100 p-1 rounded-lg min-w-max">
                    {["All", "Active", "Completed", "Terminated"].map((f) => (
                      <button key={f} onClick={() => setStatusFilter(f)}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
                          ${statusFilter === f ? "bg-white text-[#db6747] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />

                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => window.print()}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                    <FaPrint size={12} /> <span className="uppercase tracking-widest">Print</span>
                  </button>
                  <button onClick={() => setCreateModal(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all shadow-sm active:scale-95">
                    <FaPlus size={11} /> <span className="uppercase tracking-widest">New Contract</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE / CARDS CONTAINER */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            {loading ? (
              <div className="flex flex-col gap-0 flex-1 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <div className="h-5 w-10 bg-slate-200 rounded" />
                        <div className="h-5 w-32 bg-slate-100 rounded" />
                        <div className="h-5 w-20 bg-slate-100 rounded-md" />
                      </div>
                      <div className="h-4 w-48 bg-slate-100 rounded" />
                      <div className="h-3 w-36 bg-slate-100 rounded" />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <div className="h-8 w-8 bg-slate-100 rounded-md" />
                      <div className="h-8 w-8 bg-slate-100 rounded-md" />
                      <div className="h-8 w-8 bg-slate-100 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 flex-1">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <FaFileContract className="text-slate-300" size={20} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest">No contracts found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto flex-1 custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-4 font-bold">Unit</th>
                        <th className="px-5 py-4 font-bold">Tenants</th>
                        <th className="px-5 py-4 font-bold">Rent / Month</th>
                        <th className="px-5 py-4 font-bold">Lease Period</th>
                        <th className="px-5 py-4 font-bold">Status</th>
                        <th className="px-5 py-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((c) => (
                        <tr key={c.ID} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-sm font-black text-[#db6747]">{c.unit_number}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-0.5">
                              {(c.tenants ?? []).length > 0
                                ? c.tenants.map((t) => (
                                  <p key={t.ID} className="text-sm font-bold text-slate-800">{t.fullName}</p>
                                ))
                                : <span className="text-xs text-slate-400">—</span>}
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-slate-800">₱{Number(c.rent_amount ?? 0).toLocaleString()}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <p className="text-xs text-slate-700 font-semibold">{fmt(c.start_date)} <span className="text-slate-300 font-normal mx-1">to</span></p>
                            <p className="text-xs text-slate-500 mt-0.5">{fmt(c.end_date)}</p>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openViewModal(c)} title="View"
                                className="p-2 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95">
                                <FaEye size={13} />
                              </button>
                              <button onClick={() => openEdit(c)} title="Edit"
                                className="p-2 rounded-md text-slate-400 hover:text-[#db6747] hover:bg-orange-50 transition-all active:scale-95">
                                <FaEdit size={13} />
                              </button>
                              {c.status === "Active" && (
                                <>
                                  <button onClick={() => { setRenewModal(c); setRenewForm(EMPTY_RENEW); }} title="Renew"
                                    className="p-2 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-95">
                                    <FaSync size={12} />
                                  </button>
                                  <button onClick={() => setConfirmModal({ action: "complete", contract: c })} title="Complete"
                                    className="p-2 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95">
                                    <FaCheckCircle size={13} />
                                  </button>
                                  <button onClick={() => setConfirmModal({ action: "terminate", contract: c })} title="Terminate"
                                    className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95">
                                    <FaTimesCircle size={13} />
                                  </button>
                                </>
                              )}
                              <button onClick={() => setDeleteTarget(c)} title="Delete"
                                className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95">
                                <FaTrashAlt size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="lg:hidden flex-1 overflow-y-auto divide-y divide-slate-100 bg-slate-50/30">
                  {filtered.map(c => (
                    <div key={c.ID} className="p-5 space-y-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-black text-[#db6747] bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Unit {c.unit_number}</span>
                            <StatusBadge status={c.status} />
                          </div>
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {(c.tenants ?? []).map(t => t.fullName).join(", ") || "No Tenants"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="min-w-0">
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Rent</p>
                          <p className="text-sm font-black text-slate-800 truncate">₱{Number(c.rent_amount ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Lease End</p>
                          <p className="text-xs text-slate-700 font-medium truncate">{fmt(c.end_date)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button onClick={() => openViewModal(c)} className="flex-1 min-w-[30%] flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold active:scale-[0.98] transition-transform">
                          <FaEye size={12} /> View
                        </button>
                        <button onClick={() => openEdit(c)} className="flex-1 min-w-[30%] flex items-center justify-center gap-1.5 py-2.5 bg-orange-50 text-[#db6747] border border-orange-100 rounded-lg text-[10px] font-bold active:scale-[0.98] transition-transform">
                          <FaEdit size={12} /> Edit
                        </button>
                        {c.status === "Active" && (
                          <>
                            <button onClick={() => { setRenewModal(c); setRenewForm(EMPTY_RENEW); }} className="flex-1 min-w-[30%] flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold active:scale-[0.98] transition-transform">
                              <FaSync size={11} /> Renew
                            </button>
                            <button onClick={() => setConfirmModal({ action: "complete", contract: c })} className="flex-1 min-w-[30%] flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold active:scale-[0.98] transition-transform">
                              <FaCheckCircle size={11} /> Complete
                            </button>
                            <button onClick={() => setConfirmModal({ action: "terminate", contract: c })} className="flex-1 min-w-[30%] flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold active:scale-[0.98] transition-transform">
                              <FaTimesCircle size={11} /> Terminate
                            </button>
                          </>
                        )}
                        <button onClick={() => setDeleteTarget(c)} className="flex-1 min-w-[30%] flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold active:scale-[0.98] transition-transform">
                          <FaTrashAlt size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── VIEW MODAL ── */}
      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Contract Details</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">ID: {viewModal.ID}</p>
              </div>
              <button onClick={closeViewModal} className="text-slate-400 hover:text-slate-800 transition-colors text-lg px-2 active:scale-90">✕</button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Unit</p>
                  <p className="text-sm font-black text-[#db6747]">{viewModal.unit_number}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Status</p>
                  <StatusBadge status={viewModal.status} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Rent / Month</p>
                  <p className="text-sm font-bold text-slate-800">₱{Number(viewModal.rent_amount ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Tenants</p>
                  {(viewModal.tenants ?? []).map((t) => (
                    <p key={t.ID} className="text-sm font-bold text-slate-800">{t.fullName}</p>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Start Date</p>
                  <p className="text-sm text-slate-700 font-medium">{fmt(viewModal.start_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">End Date</p>
                  <p className="text-sm text-slate-700 font-medium">{fmt(viewModal.end_date)}</p>
                </div>
              </div>

              {viewModal.tenancy_rules && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">Tenancy Rules</p>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 shadow-sm">
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{stripBullets(viewModal.tenancy_rules)}</p>
                  </div>
                </div>
              )}
              {viewModal.termination_renewal_conditions && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">Termination / Renewal Conditions</p>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 shadow-sm">
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{stripBullets(viewModal.termination_renewal_conditions)}</p>
                  </div>
                </div>
              )}
              {viewModal.contract_file && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">Contract File</p>
                  <button
                    onClick={async () => {
                      try {
                        const proxyUrl = getContractPdfProxyUrl(viewModal.ID);
                        const res = await fetch(proxyUrl, {
                          headers: { Authorization: `Bearer ${localStorage.getItem("tenantToken")}` },
                        });
                        if (!res.ok) throw new Error("Fetch failed");
                        const blob = await res.blob();
                        const blobUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
                        const a = document.createElement("a");
                        a.href = blobUrl;
                        a.download = `contract_unit_${viewModal.unit_number}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(blobUrl);
                      } catch {
                        window.open(viewModal.contract_file, "_blank");
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all shadow-sm active:scale-95"
                  >
                    <FaDownload size={12} /> Download PDF
                  </button>
                </div>
              )}
              {!viewModal.contract_file && (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center bg-slate-50">
                  <p className="text-xs text-slate-400 mb-3 font-medium">No contract PDF yet.</p>
                  <button
                    onClick={() => handleGeneratePdf(viewModal)}
                    disabled={generatingPdf === viewModal.ID}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border border-[#db6747]/20 bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all disabled:opacity-50 shadow-sm active:scale-95 w-full sm:w-auto"
                  >
                    {generatingPdf === viewModal.ID
                      ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating...</>
                      : <><FaFilePdf size={12} /> Generate PDF</>}
                  </button>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button onClick={closeViewModal}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest active:scale-95">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {createModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">New Contract</h2>
              <button onClick={() => setCancelCreateOpen(true)} className="text-slate-400 hover:text-slate-800 text-lg px-2 active:scale-90">✕</button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Unit (Tenant Registered)</label>
                  <select required value={createForm.unit_id}
                    onChange={(e) => {
                      const selectedUnit = occupiedUnits.find(u => String(u.ID) === e.target.value);
                      // Look up most recent past contract for this unit to suggest rent amount
                      const pastContract = contracts
                        .filter(c => c.unit_number === selectedUnit?.unit_number && c.status !== "Active")
                        .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0];
                      setCreateForm((f) => ({
                        ...f,
                        unit_id: e.target.value,
                        rent_amount: pastContract?.rent_amount ? String(pastContract.rent_amount) : "",
                      }));
                    }}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm">
                    <option value="">Select unit...</option>
                    {occupiedUnits.map((u) => (
                      <option key={u.ID} value={u.ID}>Unit {u.unit_number} ({u.numberOfTenants ?? u.max_capacity} {(u.numberOfTenants ?? u.max_capacity) === 1 ? "person" : "persons"})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                    Rent Amount (₱)
                    {createForm.rent_amount && <span className="ml-2 text-[9px] text-slate-400 normal-case tracking-normal font-normal">from previous contract</span>}
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    max="99999"
                    value={createForm.rent_amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d{0,5}(\.\d{0,2})?$/.test(val) || val === "") {
                        setCreateForm((f) => ({ ...f, rent_amount: val }));
                      }
                    }}

                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setCreateForm((f) => ({ ...f, rent_amount: val.toFixed(2) }));
                      }
                    }}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm"
                    placeholder="e.g. 2500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Start Date</label>
                  <input required type="date" value={createForm.start_date}
                    onChange={(e) => setCreateForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">End Date</label>
                  <input required type="date" value={createForm.end_date}
                    onChange={(e) => setCreateForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Tenancy Rules</label>
                <textarea rows={4} value={createForm.tenancy_rules}
                  onChange={(e) => setCreateForm((f) => ({ ...f, tenancy_rules: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Termination / Renewal Conditions</label>
                <textarea rows={3} value={createForm.termination_renewal_conditions}
                  onChange={(e) => setCreateForm((f) => ({ ...f, termination_renewal_conditions: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm resize-none" />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 sm:pt-6 border-t border-slate-100 mt-6 sm:mt-8">
                <button type="button" onClick={() => setCancelCreateOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#db6747] text-white text-sm font-bold hover:bg-[#c45a3a] transition-colors shadow-md disabled:opacity-60 active:scale-95 uppercase tracking-wider">
                  {submitting
                    ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{generatingPdf ? "Generating PDF..." : "Creating..."}</>
                    : <><FaFilePdf size={13} /> Create & Generate PDF</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Edit Contract</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">Unit {editModal.unit_number}</p>
              </div>
              <button onClick={() => setCancelEditOpen(true)} className="text-slate-400 hover:text-slate-800 text-lg px-2 active:scale-90">✕</button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Rent Amount (₱)</label>
                  <input type="number" min="1" step="0.01" max="99999" value={editForm.rent_amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow only up to 5 digits before decimal
                      if (/^\d{0,5}(\.\d{0,2})?$/.test(val) || val === "") {
                        setEditForm((f) => ({ ...f, rent_amount: val }));
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setEditForm((f) => ({ ...f, rent_amount: val.toFixed(2) }));
                      }
                    }}

                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm" />
                </div>
                <div className="hidden sm:block" />
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Start Date <span className="text-slate-300 normal-case tracking-normal font-normal">(read-only — use Renew to change)</span></label>
                  <input type="date" value={editForm.start_date} disabled
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed font-medium" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">End Date <span className="text-slate-300 normal-case tracking-normal font-normal">(read-only — use Renew to change)</span></label>
                  <input type="date" value={editForm.end_date} disabled
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed font-medium" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Tenancy Rules</label>
                <textarea rows={4} value={editForm.tenancy_rules}
                  onChange={(e) => setEditForm((f) => ({ ...f, tenancy_rules: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Termination / Renewal Conditions</label>
                <textarea rows={3} value={editForm.termination_renewal_conditions}
                  onChange={(e) => setEditForm((f) => ({ ...f, termination_renewal_conditions: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm resize-none" />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 sm:pt-6 border-t border-slate-100 mt-6 sm:mt-8">
                <button type="button" onClick={() => setCancelEditOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#db6747] text-white text-sm font-bold hover:bg-[#c45a3a] transition-colors shadow-md disabled:opacity-60 active:scale-95 uppercase tracking-wider">
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RENEW MODAL ── */}
      {renewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Renew Contract</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">Unit {renewModal.unit_number}</p>
              </div>
              <button onClick={() => setCancelRenewOpen(true)} className="text-slate-400 hover:text-slate-800 text-lg px-2 active:scale-90">✕</button>
            </div>
            <form onSubmit={handleRenew} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {/* Current dates for reference */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 text-xs text-slate-500 space-y-1 shadow-sm">
                <p><span className="font-bold text-slate-600">Current Start:</span> {fmt(renewModal.start_date)}</p>
                <p><span className="font-bold text-slate-600">Current End:</span> {fmt(renewModal.end_date)}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">New Start Date</label>
                <input required type="date" value={renewForm.newStartDate}
                  onChange={(e) => setRenewForm((f) => ({ ...f, newStartDate: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">New End Date</label>
                <input required type="date" value={renewForm.newEndDate}
                  onChange={(e) => setRenewForm((f) => ({ ...f, newEndDate: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm" />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-100">
                The contract PDF will be automatically regenerated with the new dates.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 sm:pt-6 border-t border-slate-100 mt-6 sm:mt-8">
                <button type="button" onClick={() => setCancelRenewOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#db6747] text-white text-sm font-bold hover:bg-[#c45a3a] transition-colors shadow-md disabled:opacity-60 active:scale-95 uppercase tracking-wider">
                  {submitting
                    ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Renewing...</>
                    : <><FaSync size={12} /> Renew & Regenerate PDF</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CANCEL INTERCEPTOR MODALS ── */}
      <GeneralConfirmationModal
        isOpen={cancelCreateOpen}
        onClose={() => setCancelCreateOpen(false)}
        onConfirm={() => {
          setCancelCreateOpen(false);
          setCreateModal(false);
          setCreateForm(EMPTY_CREATE);
        }}
        variant="warning"
        title="Discard New Contract?"
        message="Are you sure you want to cancel? Any information you have entered will be lost."
        confirmText="Yes, Discard"
        cancelText="Go Back"
      />

      <GeneralConfirmationModal
        isOpen={cancelEditOpen}
        onClose={() => setCancelEditOpen(false)}
        onConfirm={() => {
          setCancelEditOpen(false);
          setEditModal(null);
        }}
        variant="warning"
        title="Discard Changes?"
        message="Are you sure you want to cancel? Any unsaved changes will be lost."
        confirmText="Yes, Discard"
        cancelText="Go Back"
      />

      <GeneralConfirmationModal
        isOpen={cancelRenewOpen}
        onClose={() => setCancelRenewOpen(false)}
        onConfirm={() => {
          setCancelRenewOpen(false);
          setRenewModal(null);
          setRenewForm(EMPTY_RENEW);
        }}
        variant="warning"
        title="Cancel Renewal?"
        message="Are you sure you want to cancel this contract renewal process?"
        confirmText="Yes, Cancel"
        cancelText="Go Back"
      />

      {/* ── CONFIRM ACTION MODAL (Terminate / Complete) ── */}
      <GeneralConfirmationModal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        onConfirm={handleConfirmAction}
        variant={confirmModal?.action === "terminate" ? "reject" : "approve"}
        title={confirmModal?.action === "terminate" ? "Terminate Contract" : "Complete Contract"}
        message={confirmModal
          ? confirmModal.action === "terminate"
            ? <>Are you sure you want to <span className="font-bold text-red-600">terminate</span> the contract for Unit <span className="font-bold text-slate-900">{confirmModal.contract.unit_number}</span>? This cannot be undone.</>
            : <>Mark the contract for Unit <span className="font-bold text-slate-900">{confirmModal.contract.unit_number}</span> as <span className="font-bold text-blue-600">completed</span>?</>
          : null}
        confirmText={confirmModal?.action === "terminate" ? "Terminate" : "Complete"}
        loading={submitting}
      />

      {/* ── CREATE CONTRACT CONFIRM ── */}
      <GeneralConfirmationModal
        isOpen={createConfirmOpen}
        onClose={() => setCreateConfirmOpen(false)}
        onConfirm={doCreate}
        variant="save"
        title="Create Contract & Generate PDF"
        message="This will create the contract and automatically generate the official PDF. Are you sure all details are correct?"
        confirmText="Create & Generate"
        loading={submitting}
      />

      {/* ── GENERATE PDF CONFIRM ── */}
      <GeneralConfirmationModal
        isOpen={!!generateConfirmTarget}
        onClose={() => setGenerateConfirmTarget(null)}
        onConfirm={doGeneratePdf}
        variant="other"
        title="Generate Contract PDF"
        message={generateConfirmTarget
          ? <>Generate a new PDF for the contract of Unit <span className="font-bold text-slate-900">{generateConfirmTarget.unit_number}</span>? This will overwrite any existing contract file.</>
          : null}
        confirmText="Generate PDF"
        loading={!!generatingPdf}
      />

      {/* ── DELETE CONTRACT CONFIRM ── */}
      <GeneralConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="delete"
        title="Delete Contract"
        message={deleteTarget
          ? <>Permanently delete the contract for Unit <span className="font-bold text-slate-900">{deleteTarget.unit_number}</span>? This cannot be undone.</>
          : null}
        confirmText="Delete"
        loading={deleting}
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

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { color: "bg-slate-100 text-slate-500 border-slate-200" };
  return (
    <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-1 sm:px-2.5 rounded-md uppercase tracking-wider border shrink-0 ${cfg.color}`}>
      {status ?? "—"}
    </span>
  );
}