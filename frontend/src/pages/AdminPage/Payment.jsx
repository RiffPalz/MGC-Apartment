import { useState, useEffect, useCallback } from "react";
import {
  FaSearch, FaPrint, FaEye, FaEdit, FaTrashAlt,
  FaPlus, FaMoneyBillWave, FaExclamationCircle, FaCheckCircle, FaClock,
  FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import { toast } from "react-toastify";
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
};

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
  const cfg = STATUS_CFG[status] ?? { color: "bg-slate-100 text-slate-500 border-slate-200" };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${cfg.color}`}>
      {status ?? "—"}
    </span>
  );
}

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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createPayment(form);
      toast.success("Payment bill created.");
      setCreateModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await updatePayment(editModal.id, editForm);
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

  const handleVerify = async (id) => {
    try {
      await verifyPayment(id);
      toast.success("Payment verified.");
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
      <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 no-print min-h-screen">

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<FaMoneyBillWave size={16} />} label="Total Collected" value={`₱${Number(dashboard.totalCollected ?? 0).toLocaleString()}`} color="text-emerald-500" bg="bg-emerald-50" />
          <StatCard icon={<FaClock size={16} />} label="Pending Verification" value={dashboard.pendingVerification ?? 0} color="text-blue-500" bg="bg-blue-50" />
          <StatCard icon={<FaExclamationCircle size={16} />} label="Overdue" value={dashboard.overduePayments ?? 0} color="text-amber-500" bg="bg-amber-50" />
          <StatCard icon={<FaCheckCircle size={16} />} label="Unpaid Bills" value={dashboard.unpaidBills ?? 0} color="text-red-500" bg="bg-red-50" />
        </div>

        {/* TOOLBAR */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Search unit, tenant, or category..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white" />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="overflow-x-auto">
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
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                <FaPrint size={12} /> <span className="uppercase tracking-widest">Print</span>
              </button>
              <button onClick={() => setCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all shadow-sm">
                <FaPlus size={11} /> <span className="uppercase tracking-widest">New Bill</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-4 font-bold">Unit</th>
                  <th className="px-4 py-4 font-bold">Full Name</th>
                  <th className="px-4 py-4 font-bold">Phone</th>
                  <th className="px-4 py-4 font-bold">Billing Month</th>
                  <th className="px-4 py-4 font-bold">Due Date</th>
                  <th className="px-4 py-4 font-bold">Payment Date</th>
                  <th className="px-4 py-4 font-bold">Amount</th>
                  <th className="px-4 py-4 font-bold">Category</th>
                  <th className="px-4 py-4 font-bold">Type</th>
                  <th className="px-4 py-4 font-bold">Ref No.</th>
                  <th className="px-4 py-4 font-bold">Receipt</th>
                  <th className="px-4 py-4 font-bold">Status</th>
                  <th className="px-4 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={13} className="py-24 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db6747] mx-auto mb-3" />
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Loading Payments...</p>
                  </td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={13} className="py-24 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaMoneyBillWave className="text-slate-300" size={20} />
                    </div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No payment records found</p>
                  </td></tr>
                ) : paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-black text-[#db6747]">{r.unitNumber}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm font-bold text-slate-800">{r.fullName}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{r.contactNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-700">{fmtMonth(r.billingMonth)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">{fmt(r.dueDate)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">{fmt(r.paymentDate)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-bold text-slate-800">₱{Number(r.amount ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">{r.category}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">{r.paymentType ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">{r.referenceNumber ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.receiptImage
                        ? <a href={r.receiptImage} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest">View</a>
                        : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="View" onClick={() => setViewModal(r)}
                          className="p-2 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                          <FaEye size={13} />
                        </button>
                        <button title="Edit" onClick={() => openEdit(r)}
                          className="p-2 rounded-md text-slate-400 hover:text-[#db6747] hover:bg-orange-50 transition-all">
                          <FaEdit size={13} />
                        </button>
                        {r.status === "Pending Verification" && (
                          <button title="Verify Payment" onClick={() => handleVerify(r.id)}
                            className="p-2 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                            <FaCheckCircle size={13} />
                          </button>
                        )}
                        <button title="Delete" onClick={() => setDeleteTarget(r)}
                          className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                          <FaTrashAlt size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
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
                  .map((p, idx) => p === "..." ? (
                    <span key={`e-${idx}`} className="px-2 text-slate-400 text-xs">…</span>
                  ) : (
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

      {/* CREATE MODAL */}
      {createModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">New Payment Bill</h2>
              <button onClick={() => { setCreateModal(false); setForm(EMPTY_FORM); }} className="text-slate-400 hover:text-slate-800 text-lg px-2">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50">
                  <option value="">Select contract...</option>
                  {contracts.map(c => (
                    <option key={c.ID} value={c.ID}>
                      Unit {c.unit_number} — {(c.tenants ?? []).map(t => t.fullName).join(", ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Category</label>
                  <select required value={form.category}
                    onChange={e => {
                      const cat = e.target.value;
                      const selected = contracts.find(c => String(c.ID) === String(form.contract_id));
                      setForm(f => ({
                        ...f,
                        category: cat,
                        amount: cat === "Rent" ? (selected?.rent_amount ?? "") : "",
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50">
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                    Amount (₱) {form.category === "Rent" && <span className="text-[9px] text-slate-400 normal-case tracking-normal ml-1">auto-filled</span>}
                  </label>
                  <input required type="number" min="1"
                    value={form.amount}
                    readOnly={form.category === "Rent"}
                    onChange={e => {
                      if (form.category === "Utilities" && e.target.value.length <= 5)
                        setForm(f => ({ ...f, amount: e.target.value }));
                    }}
                    className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50
                      ${form.category === "Rent" ? "opacity-70 cursor-not-allowed bg-slate-100" : ""}`}
                    placeholder={form.category === "Rent" ? "From contract" : "Max 5 digits"} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Billing Month</label>
                  <input required type="date" value={form.billing_month}
                    onChange={e => setForm(f => ({ ...f, billing_month: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Due Date</label>
                  <input required type="date" value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setCreateModal(false); setForm(EMPTY_FORM); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#db6747] text-white text-sm font-bold hover:bg-[#c45a3a] transition-colors shadow-sm disabled:opacity-60">
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
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Payment Details</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">ID: {viewModal.id}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-slate-800 text-lg px-2">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-800">{val}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <StatusBadge status={viewModal.status} />
              </div>
              {viewModal.receiptImage && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Receipt</p>
                  <a href={viewModal.receiptImage} target="_blank" rel="noreferrer">
                    <img src={viewModal.receiptImage} alt="Receipt" className="max-h-48 rounded-lg border border-slate-200 object-contain" />
                  </a>
                </div>
              )}
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => setViewModal(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Edit Payment</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">Unit {editModal.unitNumber}</p>
              </div>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-800 text-lg px-2">✕</button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Category</label>
                  <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50">
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Amount (₱)</label>
                  <input type="number" min="1" value={editForm.amount}
                    onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Billing Month</label>
                  <input type="date" value={editForm.billing_month}
                    onChange={e => setEditForm(f => ({ ...f, billing_month: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Due Date</label>
                  <input type="date" value={editForm.due_date}
                    onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                    Status
                    {!editForm.receiptImage && (
                      <span className="ml-2 text-[9px] text-slate-400 normal-case tracking-normal font-normal">— locked until receipt is uploaded</span>
                    )}
                  </label>
                  <select
                    value={editForm.status}
                    disabled={!editForm.receiptImage}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 transition-opacity
                      ${!editForm.receiptImage ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value={editForm.status} disabled>{editForm.status}</option>
                    {editForm.receiptImage && <option value="Paid">Paid</option>}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Payment Type</label>
                  <select value={editForm.paymentType} onChange={e => setEditForm(f => ({ ...f, paymentType: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50">
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
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50"
                    placeholder="GCash reference number" />
                </div>
              )}
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
