import { useState, useEffect, useCallback } from "react";
import { useSocketEvent } from "../../hooks/useSocketEvent";import {
  FaSearch, FaPrint, FaEye,
  FaMoneyBillWave, FaExclamationCircle, FaCheckCircle, FaClock,
  FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import toast from "../../utils/toast";
import logo from "../../assets/images/logo.png";
import {
  fetchAllPayments,
  verifyPayment,
} from "../../api/caretakerAPI/PaymentAPI";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

const PAGE_SIZE = 10;

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }) : "—";

const fmtMonth = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—";

const STATUS_CFG = {
  Paid: { color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Unpaid: { color: "bg-red-50 text-red-700 border-red-200" },
  Overdue: { color: "bg-amber-50 text-amber-700 border-amber-200" },
  "Pending Verification": { color: "bg-blue-50 text-blue-700 border-blue-200" },
};

export default function CaretakerPaymentOverview() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [viewModal, setViewModal] = useState(null);
  const [verifying, setVerifying] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAllPayments();
      if (res.success) setPayments(res.payments || []);
    } catch {
      toast.error("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useSocketEvent("payment_updated", load);

  const rows = payments.map((p) => {
    const contract = p.contract ?? {};
    const unit = contract.unit ?? {};
    const tenant = contract.tenants?.[0] ?? {};
    return {
      id: p.ID,
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
      arNumber: p.arNumber,
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

  const totalCollected = rows.filter((r) => r.status === "Paid").reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const pendingCount = rows.filter((r) => r.status === "Pending Verification").length;
  const overdueCount = rows.filter((r) => r.status === "Overdue").length;
  const unpaidCount = rows.filter((r) => r.status === "Unpaid").length;

  const handleVerify = (row) => {
    setStatusConfirm(row);
  };

  const doVerify = async () => {
    const row = statusConfirm;
    setStatusConfirm(null);
    try {
      setVerifying(row.id);
      await verifyPayment(row.id);
      toast.success("Payment verified as Paid.");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Verification failed.");
    } finally {
      setVerifying(null);
    }
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
          #payment-print-area { position: absolute; left: 0; top: 0; width: 100%; font-family: 'Inter', sans-serif; }
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
          <div className="text-right text-[10px] text-slate-500 flex flex-col gap-1.5">
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Date Generated:</span>{new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Filter:</span>{statusFilter}</p>
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {["Unit", "Full Name", "Billing Month", "Due Date", "Payment Date", "Amount", "Category", "Type", "Status"].map((h) => (
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
        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[9px] uppercase tracking-widest text-slate-400 font-bold">
          <p>Total Records: <span className="text-slate-800 text-[11px] ml-1">{filtered.length}</span></p>
          <p>MGC Building — Apartment Monitoring System</p>
          <p className="text-right">CONFIDENTIAL</p>
        </div>
      </div>

      {/* SCREEN UI */}
      <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 sm:gap-5 no-print min-h-screen overflow-x-hidden">

        {/* 4K Containment Wrapper */}
        <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-4 sm:gap-5 flex-1">

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={<FaMoneyBillWave size={18} />} label="Total Collected" value={`₱${totalCollected.toLocaleString()}`} color="text-emerald-500" bg="bg-emerald-50" />
            <StatCard icon={<FaClock size={18} />} label="Pending Verification" value={pendingCount} color="text-blue-500" bg="bg-blue-50" />
            <StatCard icon={<FaExclamationCircle size={18} />} label="Overdue" value={overdueCount} color="text-amber-500" bg="bg-amber-50" />
            <StatCard icon={<FaCheckCircle size={18} />} label="Unpaid Bills" value={unpaidCount} color="text-red-500" bg="bg-red-50" />
          </div>

          {/* TOOLBAR */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md w-full">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search unit, tenant, or category..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white shadow-sm"
                />
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full lg:w-auto">
                <div className="overflow-x-auto custom-scrollbar w-full sm:w-auto pb-1 sm:pb-0 -mb-1 sm:mb-0">
                  <div className="flex bg-slate-100 p-1 rounded-lg min-w-max">
                    {["All", "Unpaid", "Pending Verification", "Paid", "Overdue"].map((f) => (
                      <button
                        key={f}
                        onClick={() => { setStatusFilter(f); setPage(1); }}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
                          ${statusFilter === f ? "bg-white text-[#db6747] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        {f === "Pending Verification" ? "Pending" : f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />

                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active:scale-95"
                >
                  <FaPrint size={12} /> <span className="uppercase tracking-widest">Print</span>
                </button>
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
                    <th className="px-5 py-4 font-bold">Tenant Details</th>
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
                        <td className="px-5 py-4 text-right"><div className="h-6 w-8 bg-slate-100 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-24 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                          <FaMoneyBillWave className="text-slate-300" size={20} />
                        </div>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No payment records found</p>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((r) => (
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
                                  disabled={!canChange || verifying === r.id}
                                  onChange={() => handleVerify(r)}
                                  className={`appearance-none pl-3 pr-6 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-all outline-none ${sc.color}
                                    ${canChange ? "cursor-pointer hover:opacity-80 shadow-sm" : "cursor-default opacity-80"}
                                    disabled:opacity-50`}
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
                            <button
                              title="View"
                              onClick={() => setViewModal(r)}
                              className="p-2 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95"
                            >
                              <FaEye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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
                      <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-100">
                        <div className="h-8 bg-slate-100 rounded" />
                        <div className="h-8 bg-slate-100 rounded" />
                      </div>
                      <div className="flex gap-2">
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
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-black text-[#db6747] bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Unit {r.unitNumber}</span>
                            <div className="relative inline-flex items-center">
                              <select
                                value={r.status}
                                disabled={!canChange || verifying === r.id}
                                onChange={() => handleVerify(r)}
                                className={`appearance-none pl-2.5 pr-5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border transition-all outline-none ${sc.color}
                                  ${canChange ? "cursor-pointer hover:opacity-80 shadow-sm" : "cursor-default opacity-80"}
                                  disabled:opacity-50`}
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

                      <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
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
                        <button
                          onClick={() => setViewModal(r)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold active:scale-[0.98] transition-transform"
                        >
                          <FaEye size={12} /> View Details
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
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all active:scale-95"
                  >
                    <FaChevronLeft size={12} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
                    .map((p, idx) => p === "..." ? (
                      <span key={`e-${idx}`} className="px-2 text-slate-400 text-xs">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${page === p ? "bg-[#db6747] text-white shadow-sm shadow-orange-200" : "text-slate-500 hover:bg-white hover:border hover:border-slate-200 border border-transparent"}`}
                      >
                        {p}
                      </button>
                    ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all active:scale-95"
                  >
                    <FaChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div>
                <h2 className="text-slate-800 font-bold text-sm uppercase tracking-widest">Payment Details</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5 font-semibold">ID: {viewModal.id}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-slate-800 transition-colors text-lg px-2 active:scale-90 bg-white rounded-md border border-slate-200 shadow-sm w-8 h-8 flex items-center justify-center">✕</button>
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
                  ["Reference No.", viewModal.paymentType === "GCash" ? (viewModal.referenceNumber ?? "—") : "—"],
                  ["AR No.", viewModal.paymentType === "Cash" ? (viewModal.arNumber ?? "—") : "—"],
                ].map(([label, val]) => (
                  <div key={label} className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">{label}</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{val}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">Status</p>
                <StatusBadge status={viewModal.status} />
              </div>

              {viewModal.receiptImage && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">Uploaded Receipt</p>
                  <a href={viewModal.receiptImage} target="_blank" rel="noreferrer" className="block w-max">
                    <img src={viewModal.receiptImage} alt="Receipt" className="max-h-48 rounded-xl border border-slate-200 object-contain shadow-sm hover:shadow-md transition-shadow" />
                  </a>
                </div>
              )}
              {viewModal.utilityBillFile && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">Utility Bill File</p>
                  <a href={viewModal.utilityBillFile} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all shadow-sm active:scale-95"
                  >
                    View Utility Bill
                  </a>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex shrink-0">
              <button onClick={() => setViewModal(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white shadow-sm transition-all active:scale-95">
                Close
              </button>
            </div>
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
        <p className="text-2xl font-black text-slate-800 leading-none truncate">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { color: "bg-slate-100 text-slate-500 border-slate-200" };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md uppercase tracking-wider border shrink-0 ${cfg.color}`}>
      {status ?? "—"}
    </span>
  );
}