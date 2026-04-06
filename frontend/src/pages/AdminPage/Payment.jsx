import { useState, useEffect, useCallback } from "react";
import { useSocketEvent } from "../../hooks/useSocketEvent";import {
  FaSearch, FaPrint, FaEye, FaEdit, FaTrashAlt,
  FaPlus, FaMoneyBillWave, FaExclamationCircle, FaCheckCircle, FaClock,
  FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import toast from "../../utils/toast";
import logo from "../../assets/images/logo.png";
import {
  fetchPaymentDashboard,
  fetchAllPayments,
  createPayment,
  updatePayment,
  deletePayment,
  verifyPayment,
  fetchContractsActive,
} from "../../api/adminAPI/PaymentAPI";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

const PAGE_SIZE = 10;

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }) : "—";

const fmtMonth = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—";

// Normalize any date value to YYYY-MM-DD for <input type="date">
const toDateInput = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date)) return "";
  return date.toISOString().split("T")[0];
};

const STATUS_CFG = {
  Paid: { color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Unpaid: { color: "bg-red-50 text-red-700 border-red-200" },
  Overdue: { color: "bg-amber-50 text-amber-700 border-amber-200" },
  "Pending Verification": { color: "bg-blue-50 text-blue-700 border-blue-200" },
};

const EMPTY_FORM = {
  contract_id: "", category: "Rent", billing_month: "", due_date: "", amount: "",
  utilityBillFile: null,
};

export default function AdminPayment() {
  const [payments, setPayments] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [duplicateError, setDuplicateError] = useState("");
  const [statusConfirm, setStatusConfirm] = useState(null); // { id, row }
  const [editCancelConfirm, setEditCancelConfirm] = useState(false);
  const [editSaveConfirm, setEditSaveConfirm] = useState(false);

  // Utilities amount display state (formatted string)
  const [utilityAmountDisplay, setUtilityAmountDisplay] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [payRes, dashRes, contractRes] = await Promise.all([
        fetchAllPayments(),
        fetchPaymentDashboard(),
        fetchContractsActive(),
      ]);
      if (payRes.success) setPayments(payRes.payments || []);
      if (dashRes.success) setDashboard(dashRes.dashboard || {});
      if (contractRes.success) setContracts(contractRes.contracts?.filter(c => c.status === "Active") || []);
    } catch {
      toast.error("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useSocketEvent("payment_updated", load);

  // Flatten payment data for display
  const rows = payments.map((p) => {
    const contract = p.contract ?? {};
    const unit = contract.unit ?? {};
    const tenant = contract.tenants?.[0] ?? {};
    return {
      id: p.ID,
      contract_id: p.contract_id,
      unitNumber: unit.unit_number ?? "—",
      fullName: tenant.fullName ?? "—",
      contactNumber: tenant.contactNumber ?? "—",
      billingMonth: p.billing_month,
      dueDate: p.due_date,
      paymentDate: p.payment_date,
      amount: p.amount,
      category: p.category,
      paymentType: p.paymentType,
      referenceNumber: p.referenceNumber,
      receiptImage: p.receipt_image,
      utilityBillFile: p.utility_bill_file,
      status: p.status,
    };
  });

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      String(r.unitNumber).includes(q) ||
      r.fullName.toLowerCase().includes(q) ||
      (r.category ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreate = (e) => {
    e.preventDefault();
    setCreateConfirmOpen(true);
  };

  const doCreate = async () => {
    setCreateConfirmOpen(false);
    try {
      setSubmitting(true);
      const payload = { ...form };
      if (form.category === "Utilities") {
        payload.amount = parseFloat(utilityAmountDisplay.replace(/,/g, "")) || 0;
      }
      await createPayment(payload, form.utilityBillFile);
      toast.success("Payment bill created.");
      setDuplicateError("");
      setCreateModal(false);
      setForm(EMPTY_FORM);
      setUtilityAmountDisplay("");
      load();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to create payment.";
      // Surface duplicate bill error inline inside the modal
      if (msg.toLowerCase().includes("already exists")) {
        setDuplicateError(
          `This tenant already has a ${form.category} bill for this month. Please choose a different month or category.`
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    setEditSaveConfirm(true);
  };

  const doEdit = async () => {
    setEditSaveConfirm(false);
    try {
      setSubmitting(true);
      await updatePayment(editModal.id, editForm, editForm.newUtilityBillFile || null);
      toast.success("Payment updated.");
      setEditModal(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deletePayment(deleteTarget.id);
      toast.success("Payment deleted.");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const handleVerify = (row) => {
    setStatusConfirm(row);
  };

  const doVerify = async () => {
    const row = statusConfirm;
    setStatusConfirm(null);
    try {
      await verifyPayment(row.id);
      toast.success("Payment verified as Paid.");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Verification failed.");
    }
  };

  const openEdit = (row) => {
    setEditForm({
      category: row.category,
      billing_month: toDateInput(row.billingMonth),
      due_date: toDateInput(row.dueDate),
      amount: row.amount,
      status: row.status,
      paymentType: row.paymentType ?? "",
      referenceNumber: row.referenceNumber ?? "",
      receiptImage: row.receiptImage ?? null,
      existingUtilityBillFile: row.utilityBillFile ?? null,
      newUtilityBillFile: null,
    });
    setEditModal(row);
  };

  return (
    <>
      {/* PRINT STYLES */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 15mm; }
          body { background: white !important; }
          body * { visibility: hidden; }
          #payment-print-area, #payment-print-area * { visibility: visible; }
          #payment-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* HIDDEN PRINT AREA */}
      <div id="payment-print-area" className="hidden print:block">
        <div className="flex justify-between items-end border-b-[3px] border-slate-900 pb-5 mb-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="MGC Logo" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none mb-1">MGC BUILDING</h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#db6747]">Payment Overview Report</p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500">
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Date Generated:</span>{new Date().toLocaleDateString("en-US")}</p>
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Filter:</span>{statusFilter}</p>
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {["Unit", "Full Name", "Billing Month", "Due Date", "Payment Date", "Amount", "Category", "Type", "Status"].map(h => (
                <th key={h} className="pb-3 pt-2 px-3 border-b-2 border-slate-300 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                <td className="py-2.5 px-3 text-[11px] font-black text-slate-900">{r.unitNumber}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-700">{r.fullName}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{fmtMonth(r.billingMonth)}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{fmt(r.dueDate)}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{fmt(r.paymentDate)}</td>
                <td className="py-2.5 px-3 text-[11px] font-bold text-slate-800">₱{Number(r.amount ?? 0).toLocaleString()}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{r.category}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{r.paymentType ?? "—"}</td>
                <td className="py-2.5 px-3 text-[11px] font-bold uppercase">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between text-[9px] uppercase tracking-widest text-slate-400 font-bold">
          <p>Total Records: <span className="text-slate-800 text-[11px] ml-1">{filtered.length}</span></p>
          <p>MGC Building — Enterprise Property Management System</p>
          <p>CONFIDENTIAL</p>
        </div>
      </div>

      {/* SCREEN UI */}
      <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 sm:gap-5 no-print min-h-screen overflow-x-hidden">

        {/* 4K Containment Wrapper */}
        <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-4 sm:gap-5 flex-1">

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={<FaMoneyBillWave size={18} />} label="Total Collected" value={`₱${Number(dashboard.totalCollected ?? 0).toLocaleString()}`} color="text-emerald-500" bg="bg-emerald-50" />
            <StatCard icon={<FaClock size={18} />} label="Pending Verification" value={dashboard.pendingVerification ?? 0} color="text-blue-500" bg="bg-blue-50" />
            <StatCard icon={<FaExclamationCircle size={18} />} label="Overdue" value={dashboard.overduePayments ?? 0} color="text-amber-500" bg="bg-amber-50" />
            <StatCard icon={<FaCheckCircle size={18} />} label="Unpaid Bills" value={dashboard.unpaidBills ?? 0} color="text-red-500" bg="bg-red-50" />
          </div>

          {/* TOOLBAR */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">

              {/* Search */}
              <div className="relative flex-1 max-w-md w-full">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="text" placeholder="Search unit, tenant, or category..."
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white shadow-sm" />
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full lg:w-auto">
                <div className="overflow-x-auto custom-scrollbar w-full sm:w-auto pb-1 sm:pb-0 -mb-1 sm:mb-0">
                  <div className="flex bg-slate-100 p-1 rounded-lg min-w-max">
                    {["All", "Unpaid", "Pending Verification", "Paid", "Overdue"].map((f) => (
                      <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
                          ${statusFilter === f ? "bg-white text-[#db6747] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                        {f === "Pending Verification" ? "Pending" : f}
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
                    <FaPlus size={11} /> <span className="uppercase tracking-widest">New Bill</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-bold">Unit</th>
                    <th className="px-5 py-4 font-bold">Full Name</th>
                    <th className="px-5 py-4 font-bold">Billing Month</th>
                    <th className="px-5 py-4 font-bold">Due Date</th>
                    <th className="px-5 py-4 font-bold">Amount</th>
                    <th className="px-5 py-4 font-bold">Category</th>
                    <th className="px-5 py-4 font-bold">Status</th>
                    <th className="px-5 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-5 py-4"><div className="h-5 w-10 bg-slate-100 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-32 bg-slate-200 rounded mb-1" /><div className="h-3 w-20 bg-slate-100 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-5 w-20 bg-slate-200 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-6 w-24 bg-slate-100 rounded-md" /></td>
                        <td className="px-5 py-4 text-right"><div className="h-6 w-16 bg-slate-100 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={8} className="py-24 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <FaMoneyBillWave className="text-slate-300" size={20} />
                      </div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No payment records found</p>
                    </td></tr>
                  ) : paginated.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-4">
                        <span className="text-sm font-black text-[#db6747]">{r.unitNumber}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-slate-800">{r.fullName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{r.contactNumber}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-700">{fmtMonth(r.billingMonth)}</td>
                      <td className="px-5 py-4 text-xs text-slate-600">{fmt(r.dueDate)}</td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-black text-slate-800">₱{Number(r.amount ?? 0).toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">{r.category}</td>
                      <td className="px-5 py-4">
                        {(() => {
                          const sc = STATUS_CFG[r.status] ?? { color: "bg-slate-100 text-slate-500 border-slate-200" };
                          const canChange = r.status === "Pending Verification";
                          return (
                            <div className="relative inline-flex items-center">
                              <select
                                value={r.status}
                                disabled={!canChange}
                                onChange={() => handleVerify(r)}
                                className={`appearance-none pl-3 pr-6 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-all outline-none ${sc.color}
                                  ${canChange ? "cursor-pointer hover:opacity-80 shadow-sm" : "cursor-default opacity-80"}`}
                              >
                                <option value={r.status}>{r.status}</option>
                                {canChange && <option value="Paid">Paid</option>}
                              </select>
                              {canChange && <span className={`absolute right-2 pointer-events-none text-[8px] ${sc.color.split(" ")[1]}`}>▾</span>}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button title="View" onClick={() => setViewModal(r)}
                            className="p-2 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95">
                            <FaEye size={13} />
                          </button>
                          <button title="Edit" onClick={() => openEdit(r)}
                            className={`p-2 rounded-md text-slate-400 hover:text-[#db6747] hover:bg-orange-50 transition-all active:scale-95 ${r.status === "Paid" ? "hidden" : ""}`}>
                            <FaEdit size={13} />
                          </button>
                          <button title="Delete" onClick={() => setDeleteTarget(r)}
                            className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95">
                            <FaTrashAlt size={13} />
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
              {loading ? (
                <div className="divide-y divide-slate-100 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-5 space-y-3">
                      <div className="flex gap-2">
                        <div className="h-5 w-16 bg-slate-200 rounded" />
                        <div className="h-5 w-20 bg-slate-100 rounded" />
                      </div>
                      <div className="h-5 w-40 bg-slate-200 rounded" />
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                        <div className="h-8 bg-slate-100 rounded" />
                        <div className="h-8 bg-slate-100 rounded" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
                        <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
                        <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : paginated.length === 0 ? (
                <div className="py-24 text-center px-4">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No payment records found</p>
                </div>
              ) : (
                paginated.map((r) => {
                  const sc = STATUS_CFG[r.status] ?? { color: "bg-slate-100 text-slate-500 border-slate-200" };
                  const canChange = r.status === "Pending Verification";
                  return (
                    <div key={r.id} className="p-5 space-y-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-black text-[#db6747] bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Unit {r.unitNumber}</span>
                            <div className="relative inline-flex items-center">
                              <select
                                value={r.status}
                                disabled={!canChange}
                                onChange={() => handleVerify(r)}
                                className={`appearance-none pl-2.5 pr-5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border transition-all outline-none ${sc.color}
                                  ${canChange ? "cursor-pointer hover:opacity-80 shadow-sm" : "cursor-default opacity-80"}`}
                              >
                                <option value={r.status}>{r.status}</option>
                                {canChange && <option value="Paid">Paid</option>}
                              </select>
                              {canChange && <span className={`absolute right-1.5 pointer-events-none text-[8px] ${sc.color.split(" ")[1]}`}>▾</span>}
                            </div>
                          </div>
                          <p className="text-base font-bold text-slate-800 truncate">{r.fullName}</p>
                          <p className="text-[11px] text-slate-500 truncate">{r.category} Bill</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-100">
                        <div className="min-w-0">
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Amount</p>
                          <p className="text-sm font-black text-slate-800 truncate">₱{Number(r.amount ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Due Date</p>
                          <p className="text-xs text-slate-700 font-medium truncate">{fmt(r.dueDate)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setViewModal(r)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold active:scale-[0.98] transition-transform">
                          <FaEye size={12} /> View
                        </button>
                        {r.status !== "Paid" && (
                          <button onClick={() => openEdit(r)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-50 text-[#db6747] border border-orange-100 rounded-lg text-xs font-bold active:scale-[0.98] transition-transform">
                            <FaEdit size={12} /> Edit
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget(r)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold active:scale-[0.98] transition-transform">
                          <FaTrashAlt size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* PAGINATION */}
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
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {createModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">New Payment Bill</h2>
              <button onClick={() => setCancelConfirmOpen(true)} className="text-slate-400 hover:text-slate-800 text-lg px-2 active:scale-90">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Contract (Active)</label>
                <select required value={form.contract_id}
                  onChange={e => {
                    const selected = contracts.find(c => String(c.ID) === e.target.value);
                    setForm(f => ({
                      ...f,
                      contract_id: e.target.value,
                      amount: f.category === "Rent" ? (selected?.rent_amount ?? "") : f.amount,
                    }));
                  }}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm">
                  <option value="">Select contract...</option>
                  {contracts.map(c => (
                    <option key={c.ID} value={c.ID}>
                      Unit {c.unit_number} — {(c.tenants ?? []).map(t => t.fullName).join(", ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Category</label>
                  <select required value={form.category}
                    onChange={e => {
                      const cat = e.target.value;
                      const selected = contracts.find(c => String(c.ID) === String(form.contract_id));
                      setUtilityAmountDisplay("");
                      setDuplicateError("");
                      setForm(f => ({
                        ...f,
                        category: cat,
                        amount: cat === "Rent" ? (selected?.rent_amount ?? "") : "",
                      }));
                    }}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm">
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                    Amount (₱) {form.category === "Rent" && <span className="text-[9px] text-slate-400 normal-case tracking-normal ml-1">auto-filled</span>}
                  </label>
                  {form.category === "Utilities" ? (
                    <input required type="text" inputMode="decimal"
                      value={utilityAmountDisplay}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^0-9.]/g, "");
                        const parts = raw.split(".");
                        if (parts[0].length > 6) return;
                        const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                        const display = parts.length > 1 ? `${intPart}.${parts[1].slice(0, 2)}` : intPart;
                        setUtilityAmountDisplay(display);
                        setForm(f => ({ ...f, amount: parseFloat(raw) || "" }));
                      }}
                      onBlur={() => {
                        const num = parseFloat(utilityAmountDisplay.replace(/,/g, ""));
                        if (!isNaN(num)) {
                          const formatted = num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          setUtilityAmountDisplay(formatted);
                          setForm(f => ({ ...f, amount: num }));
                        }
                      }}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm"
                      placeholder="e.g. 1,500.00" />
                  ) : (
                    <input required type="text"
                      value={`₱${Number(form.amount || 0).toLocaleString()}`}
                      readOnly
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed font-semibold"
                      placeholder="From contract" />
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Billing Month</label>
                  <input required type="date" value={form.billing_month}
                    onChange={e => { setDuplicateError(""); setForm(f => ({ ...f, billing_month: e.target.value })); }}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Due Date</label>
                  <input required type="date" value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm" />
                </div>
              </div>
              {form.category === "Utilities" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                    Utility Bill File <span className="text-slate-300 normal-case tracking-normal font-normal">(PDF, JPG, PNG — optional)</span>
                  </label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setForm(f => ({ ...f, utilityBillFile: e.target.files[0] || null }))}
                    className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-colors" />
                  {form.utilityBillFile && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1.5 px-1">{form.utilityBillFile.name}</p>
                  )}
                </div>
              )}
              {duplicateError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-semibold leading-snug mt-2">
                  <span className="mt-0.5 shrink-0 text-red-500">⚠</span>
                  <span>{duplicateError}</span>
                </div>
              )}
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 sm:pt-6 border-t border-slate-100 mt-6 sm:mt-8">
                <button type="button" onClick={() => setCancelConfirmOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#db6747] text-white text-sm font-bold hover:bg-[#c45a3a] transition-colors shadow-md disabled:opacity-60 active:scale-95 uppercase tracking-wider">
                  {submitting ? "Creating..." : "Create Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Payment Details</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">ID: {viewModal.id}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-slate-800 text-lg px-2 active:scale-90">✕</button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ["Unit", viewModal.unitNumber],
                  ["Tenant", viewModal.fullName],
                  ["Phone", viewModal.contactNumber],
                  ["Category", viewModal.category],
                  ["Billing Month", fmtMonth(viewModal.billingMonth)],
                  ["Due Date", fmt(viewModal.dueDate)],
                  ["Payment Date", fmt(viewModal.paymentDate)],
                  ["Amount", `₱${Number(viewModal.amount ?? 0).toLocaleString()}`],
                  ["Payment Type", viewModal.paymentType ?? "—"],
                  ["Reference No.", viewModal.referenceNumber ?? "—"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">{label}</p>
                    <p className="text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg truncate">{val}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">Status</p>
                <StatusBadge status={viewModal.status} />
              </div>
              {viewModal.receiptImage && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">Receipt</p>
                  <a href={viewModal.receiptImage} target="_blank" rel="noreferrer" className="block w-max">
                    <img src={viewModal.receiptImage} alt="Receipt" className="max-h-48 rounded-xl border border-slate-200 object-contain shadow-sm hover:shadow-md transition-shadow" />
                  </a>
                </div>
              )}
              {viewModal.utilityBillFile && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">Utility Bill File</p>
                  <a href={viewModal.utilityBillFile} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all shadow-sm">
                    View Utility Bill
                  </a>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 shrink-0">
              <button onClick={() => setViewModal(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest active:scale-95">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Edit Payment</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">Unit {editModal.unitNumber}</p>
              </div>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-800 text-lg px-2 active:scale-90">✕</button>            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Category</label>
                  <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm">
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Amount (₱)</label>
                  <input type="number" min="1" value={editForm.amount}
                    onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Billing Month</label>
                  <input type="date" value={editForm.billing_month}
                    onChange={e => setEditForm(f => ({ ...f, billing_month: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Due Date</label>
                  <input type="date" value={editForm.due_date}
                    onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                    Status
                    {!editForm.receiptImage && (
                      <span className="ml-1.5 text-[9px] text-slate-400 normal-case tracking-normal font-normal">— locked until receipt is uploaded</span>
                    )}
                  </label>
                  <select
                    value={editForm.status}
                    disabled={!editForm.receiptImage}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    className={`w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-all shadow-sm
                      ${!editForm.receiptImage ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value={editForm.status} disabled>{editForm.status}</option>
                    {editForm.receiptImage && <option value="Paid">Paid</option>}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Payment Type</label>
                  <select value={editForm.paymentType} onChange={e => setEditForm(f => ({ ...f, paymentType: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm">
                    <option value="">— None —</option>
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                  </select>
                </div>
              </div>
              {editForm.paymentType === "GCash" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Reference Number</label>
                  <input type="text" value={editForm.referenceNumber}
                    onChange={e => setEditForm(f => ({ ...f, referenceNumber: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-colors shadow-sm"
                    placeholder="GCash reference number" />
                </div>
              )}

              {/* UTILITY BILL FILE UPDATE */}
              {editForm.category === "Utilities" && (
                <div className="pt-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                    Utility Bill File
                    <span className="text-slate-300 normal-case tracking-normal font-normal ml-1">(PDF, JPG, PNG — optional)</span>
                  </label>
                  {editForm.existingUtilityBillFile && !editForm.newUtilityBillFile && (
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 mb-3 shadow-sm">
                      <span className="text-xs text-slate-500 font-semibold truncate">Current file uploaded</span>
                      <a href={editForm.existingUtilityBillFile} target="_blank" rel="noreferrer"
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest ml-2 shrink-0 bg-blue-50 px-2 py-1 rounded">
                        View
                      </a>
                    </div>
                  )}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setEditForm(f => ({ ...f, newUtilityBillFile: e.target.files[0] || null }))}
                    className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-colors" />
                  {editForm.newUtilityBillFile && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1.5 px-1">{editForm.newUtilityBillFile.name}</p>
                  )}
                </div>
              )}
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 sm:pt-6 border-t border-slate-100 mt-6 sm:mt-8">
                <button type="button" onClick={() => setEditCancelConfirm(true)}
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

      {/* STATUS VERIFY CONFIRM MODAL */}
      <GeneralConfirmationModal
        isOpen={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        onConfirm={doVerify}
        variant="approve"
        title="Verify Payment"
        message={statusConfirm
          ? <>Mark the <span className="font-bold text-slate-900">{statusConfirm.category}</span> payment of <span className="font-bold text-slate-900">₱{Number(statusConfirm.amount ?? 0).toLocaleString()}</span> for Unit <span className="font-bold text-slate-900">{statusConfirm.unitNumber}</span> as <span className="font-bold text-emerald-700">Paid</span>?</>
          : null}
        confirmText="Yes, Mark as Paid"
        cancelText="Cancel"
      />

      {/* EDIT CANCEL CONFIRM MODAL */}
      <GeneralConfirmationModal
        isOpen={editCancelConfirm}
        onClose={() => setEditCancelConfirm(false)}
        onConfirm={() => { setEditCancelConfirm(false); setEditModal(null); }}
        variant="warning"
        title="Discard Changes?"
        message="Are you sure you want to cancel? Any unsaved changes will be lost."
        confirmText="Yes, Discard"
        cancelText="Go Back"
      />

      {/* EDIT SAVE CONFIRM MODAL */}
      <GeneralConfirmationModal
        isOpen={editSaveConfirm}
        onClose={() => setEditSaveConfirm(false)}
        onConfirm={doEdit}
        variant="save"
        title="Save Changes"
        message="Are you sure you want to save the changes to this payment?"
        confirmText="Save Changes"
        cancelText="Cancel"
        loading={submitting}
      />

      {/* CANCEL CONFIRM MODAL */}
      <GeneralConfirmationModal
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={() => {
          setCancelConfirmOpen(false);
          setCreateModal(false);
          setForm(EMPTY_FORM);
          setUtilityAmountDisplay("");
          setDuplicateError("");
        }}
        variant="warning"
        title="Discard Changes?"
        message="Are you sure you want to cancel? All entered information will be lost."
        confirmText="Yes, Discard"
        cancelText="Go Back"
      />

      {/* CREATE CONFIRM MODAL */}
      <GeneralConfirmationModal
        isOpen={createConfirmOpen}
        onClose={() => setCreateConfirmOpen(false)}
        onConfirm={doCreate}
        variant="save"
        title="Create Payment Bill"
        message={form.contract_id
          ? <>Create a <span className="font-bold text-slate-900">{form.category}</span> bill of <span className="font-bold text-slate-900">₱{form.category === "Utilities" ? utilityAmountDisplay || "0" : Number(form.amount || 0).toLocaleString()}</span> for the selected contract?</>
          : "Confirm bill creation?"}
        confirmText="Create Bill"
        loading={submitting}
      />

      {/* DELETE MODAL */}
      <GeneralConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="delete"
        title="Delete Payment"
        message={deleteTarget ? <>Delete the <span className="font-bold text-slate-900">{deleteTarget.category}</span> bill for Unit <span className="font-bold text-slate-900">{deleteTarget.unitNumber}</span>? This cannot be undone.</> : null}
        confirmText="Confirm Delete"
        loading={deleting}
      />
    </>
  );
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 flex items-center gap-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
      <div className={`p-3 ${bg} ${color} rounded-xl shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-black text-slate-800 leading-none">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { color: "bg-slate-100 text-slate-500 border-slate-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.color}`}>
      {status ?? "—"}
    </span>
  );
}
