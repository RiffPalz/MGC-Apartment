import { useState, useEffect, useCallback } from "react";
import { FaSearch, FaPrint, FaFileContract, FaCheckCircle, FaTimesCircle, FaClock, FaPlus, FaEye, FaEdit, FaSync, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import logo from "../../assets/images/logo.png";
import {
  fetchContractDashboard,
  createContract,
  editContract,
  terminateContract,
  completeContract,
  renewContract,
} from "../../api/adminAPI/ContractAPI";

const STATUS_CONFIG = {
  Active: { color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Completed: { color: "bg-blue-50 text-blue-700 border-blue-200" },
  Terminated: { color: "bg-red-50 text-red-700 border-red-200" },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }) : "—";

// Strip leading bullet characters from text for clean display
const stripBullets = (text) =>
  text ? text.replace(/^[•\-\*]\s*/gm, "").trim() : "";

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

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { color: "bg-slate-100 text-slate-500 border-slate-200" };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${cfg.color}`}>
      {status ?? "—"}
    </span>
  );
}

const EMPTY_CREATE = {
  unit_id: "",
  rent_amount: "",
  start_date: "",
  end_date: "",
  tenancy_rules: "2500/month for single person\n3000/month for 2 persons\n1 month deposit\n1 month advance\nOnly 2-wheeled vehicles are allowed\nNo pets allowed",
  termination_renewal_conditions: "Termination: Must be communicated at least 30 days in advance\nRenewal: Must be communicated at least 30 days in advance",
  contractFile: null,
};

const EMPTY_RENEW = { newStartDate: "", newEndDate: "", contractFile: null };

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

  // Forms
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editForm, setEditForm] = useState({});
  const [renewForm, setRenewForm] = useState(EMPTY_RENEW);
  const [submitting, setSubmitting] = useState(false);

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

  // ── CREATE ──
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("rent_amount", createForm.rent_amount);
      fd.append("start_date", createForm.start_date);
      fd.append("end_date", createForm.end_date);
      fd.append("status", "Active");
      fd.append("tenancy_rules", createForm.tenancy_rules);
      fd.append("termination_renewal_conditions", createForm.termination_renewal_conditions);
      if (createForm.contractFile) fd.append("contractFile", createForm.contractFile);
      await createContract(createForm.unit_id, fd);
      toast.success("Contract created successfully");
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
      const fd = new FormData();
      fd.append("newStartDate", renewForm.newStartDate);
      fd.append("newEndDate", renewForm.newEndDate);
      if (renewForm.contractFile) fd.append("contractFile", renewForm.contractFile);
      await renewContract(renewModal.ID, fd);
      toast.success("Contract renewed");
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

  const filtered = contracts.filter((c) => {
    const q = search.toLowerCase();
    const tenantNames = (c.tenants ?? []).map((t) => t.fullName ?? "").join(" ").toLowerCase();
    const matchSearch =
      String(c.unit_number ?? "").toLowerCase().includes(q) ||
      tenantNames.includes(q);
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
          <p>MGC Building — Enterprise Property Management System</p>
          <p className="text-right">CONFIDENTIAL</p>
        </div>
      </div>

      {/* ── SCREEN UI ── */}
      <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 no-print min-h-screen">

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<FaFileContract size={16} />} label="Total" value={counts.All} color="text-blue-500" bg="bg-blue-50" />
          <StatCard icon={<FaCheckCircle size={16} />} label="Active" value={counts.Active} color="text-emerald-500" bg="bg-emerald-50" />
          <StatCard icon={<FaClock size={16} />} label="Completed" value={counts.Completed} color="text-blue-400" bg="bg-blue-50" />
          <StatCard icon={<FaTimesCircle size={16} />} label="Terminated" value={counts.Terminated} color="text-red-500" bg="bg-red-50" />
        </div>

        {/* TOOLBAR */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search unit or tenant name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); }}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="overflow-x-auto">
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
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                <FaPrint size={12} /> <span className="uppercase tracking-widest">Print</span>
              </button>
              <button onClick={() => setCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all shadow-sm">
                <FaPlus size={11} /> <span className="uppercase tracking-widest">New Contract</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-[#db6747] rounded-full animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Loading Contracts...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <p className="text-[11px] font-bold uppercase tracking-widest">No contracts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
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
                          <button onClick={() => setViewModal(c)} title="View"
                            className="p-2 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            <FaEye size={13} />
                          </button>
                          <button onClick={() => openEdit(c)} title="Edit"
                            className="p-2 rounded-md text-slate-400 hover:text-[#db6747] hover:bg-orange-50 transition-all">
                            <FaEdit size={13} />
                          </button>
                          {(c.status === "Completed" || c.status === "Terminated") && (
                            <button onClick={() => { setRenewModal(c); setRenewForm(EMPTY_RENEW); }} title="Renew"
                              className="p-2 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                              <FaSync size={12} />
                            </button>
                          )}
                          {c.status === "Active" && (
                            <>
                              <button onClick={() => setConfirmModal({ action: "complete", contract: c })} title="Complete"
                                className="p-2 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                <FaCheckCircle size={13} />
                              </button>
                              <button onClick={() => setConfirmModal({ action: "terminate", contract: c })} title="Terminate"
                                className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                <FaTimesCircle size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── VIEW MODAL ── */}
      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Contract Details</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">ID: {viewModal.ID}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-slate-800 transition-colors text-lg px-2">✕</button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Unit</p>
                  <p className="text-sm font-black text-[#db6747]">{viewModal.unit_number}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <StatusBadge status={viewModal.status} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Rent / Month</p>
                  <p className="text-sm font-bold text-slate-800">₱{Number(viewModal.rent_amount ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Tenants</p>
                  {(viewModal.tenants ?? []).map((t) => (
                    <p key={t.ID} className="text-sm font-bold text-slate-800">{t.fullName}</p>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Start Date</p>
                  <p className="text-sm text-slate-700">{fmt(viewModal.start_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">End Date</p>
                  <p className="text-sm text-slate-700">{fmt(viewModal.end_date)}</p>
                </div>
              </div>
              {viewModal.tenancy_rules && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Tenancy Rules</p>
                  <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{stripBullets(viewModal.tenancy_rules)}</p>
                  </div>
                </div>
              )}
              {viewModal.termination_renewal_conditions && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Termination / Renewal Conditions</p>
                  <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{stripBullets(viewModal.termination_renewal_conditions)}</p>
                  </div>
                </div>
              )}
              {viewModal.contract_file && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Contract File</p>
                  <div className="rounded-lg border border-slate-200 overflow-hidden mb-2">
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewModal.contract_file)}&embedded=true`}
                      className="w-full h-64 bg-slate-50"
                      title="Contract PDF Preview"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const url = viewModal.contract_file_download || viewModal.contract_file;
                        const res = await fetch(url);
                        const blob = await res.blob();
                        const blobUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
                        const a = document.createElement("a");
                        a.href = blobUrl;
                        a.download = `contract_unit_${viewModal.unit_number}.pdf`;
                        a.click();
                        URL.revokeObjectURL(blobUrl);
                      } catch {
                        window.open(viewModal.contract_file_download || viewModal.contract_file, "_blank");
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                  >
                    <FaDownload size={12} /> Download PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {createModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">New Contract</h2>
              <button onClick={() => { setCreateModal(false); setCreateForm(EMPTY_CREATE); }} className="text-slate-400 hover:text-slate-800 text-lg px-2">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50">
                    <option value="">Select unit...</option>
                    {occupiedUnits.map((u) => (
                      <option key={u.ID} value={u.ID}>Unit {u.unit_number} (max {u.max_capacity})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                    Rent Amount (₱)
                    {createForm.rent_amount && <span className="ml-2 text-[9px] text-slate-400 normal-case tracking-normal font-normal">from previous contract</span>}
                  </label>
                  <input required type="number" min="1" max="99999" value={createForm.rent_amount}
                    onChange={(e) => { if (e.target.value.length <= 5) setCreateForm((f) => ({ ...f, rent_amount: e.target.value })); }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50"
                    placeholder="e.g. 2500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Start Date</label>
                  <input required type="date" value={createForm.start_date}
                    onChange={(e) => setCreateForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">End Date</label>
                  <input required type="date" value={createForm.end_date}
                    onChange={(e) => setCreateForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                </div>
              </div>


              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Tenancy Rules</label>
                <textarea rows={4} value={createForm.tenancy_rules}
                  onChange={(e) => setCreateForm((f) => ({ ...f, tenancy_rules: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Termination / Renewal Conditions</label>
                <textarea rows={3} value={createForm.termination_renewal_conditions}
                  onChange={(e) => setCreateForm((f) => ({ ...f, termination_renewal_conditions: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Contract File (PDF, optional)</label>
                <input type="file" accept=".pdf" onChange={(e) => setCreateForm((f) => ({ ...f, contractFile: e.target.files[0] }))}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setCreateModal(false); setCreateForm(EMPTY_CREATE); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#db6747] text-white text-sm font-bold hover:bg-[#c45a3a] transition-colors shadow-sm disabled:opacity-60">
                  {submitting ? "Creating..." : "Create Contract"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Edit Contract</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">Unit {editModal.unit_number}</p>
              </div>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-800 text-lg px-2">✕</button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Rent Amount (₱)</label>
                  <input type="number" min="1" value={editForm.rent_amount}
                    onChange={(e) => setEditForm((f) => ({ ...f, rent_amount: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                </div>
                <div />
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Start Date</label>
                  <input type="date" value={editForm.start_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">End Date</label>
                  <input type="date" value={editForm.end_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Tenancy Rules</label>
                <textarea rows={4} value={editForm.tenancy_rules}
                  onChange={(e) => setEditForm((f) => ({ ...f, tenancy_rules: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Termination / Renewal Conditions</label>
                <textarea rows={3} value={editForm.termination_renewal_conditions}
                  onChange={(e) => setEditForm((f) => ({ ...f, termination_renewal_conditions: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Replace Contract File (PDF, optional)</label>
                <input type="file" accept=".pdf" onChange={(e) => setEditForm((f) => ({ ...f, contractFile: e.target.files[0] }))}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setEditModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#db6747] text-white text-sm font-bold hover:bg-[#c45a3a] transition-colors shadow-sm disabled:opacity-60">
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Renew Contract</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">Unit {renewModal.unit_number}</p>
              </div>
              <button onClick={() => setRenewModal(null)} className="text-slate-400 hover:text-slate-800 text-lg px-2">✕</button>
            </div>
            <form onSubmit={handleRenew} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">New Start Date</label>
                <input required type="date" value={renewForm.newStartDate}
                  onChange={(e) => setRenewForm((f) => ({ ...f, newStartDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">New End Date</label>
                <input required type="date" value={renewForm.newEndDate}
                  onChange={(e) => setRenewForm((f) => ({ ...f, newEndDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">New Contract File (PDF, optional)</label>
                <input type="file" accept=".pdf" onChange={(e) => setRenewForm((f) => ({ ...f, contractFile: e.target.files[0] }))}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setRenewModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-60">
                  {submitting ? "Renewing..." : "Renew Contract"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRM ACTION MODAL ── */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-2">
              {confirmModal.action === "terminate" ? "Terminate Contract" : "Complete Contract"}
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {confirmModal.action === "terminate"
                ? <>Are you sure you want to <span className="font-bold text-red-600">terminate</span> the contract for Unit <span className="font-bold text-slate-900">{confirmModal.contract.unit_number}</span>? This cannot be undone.</>
                : <>Mark the contract for Unit <span className="font-bold text-slate-900">{confirmModal.contract.unit_number}</span> as <span className="font-bold text-blue-600">completed</span>?</>}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleConfirmAction} disabled={submitting}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors shadow-sm disabled:opacity-60
                  ${confirmModal.action === "terminate" ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}`}>
                {submitting ? "Processing..." : confirmModal.action === "terminate" ? "Terminate" : "Complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
