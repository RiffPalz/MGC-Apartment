import { useState, useEffect, useCallback } from "react";
import {
  FaSearch, FaPrint, FaEye,
  FaMoneyBillWave, FaExclamationCircle, FaCheckCircle, FaClock,
  FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import toast from "../../utils/toast";
import logo from "../../assets/images/logo.png";
import {
  fetchAllPayments,
  fetchPendingPayments,
  verifyPayment,
} from "../../api/caretakerAPI/PaymentAPI";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

const PAGE_SIZE = 10;

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }) : "—";

const fmtMonth = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—";

const STATUS_CFG = {
  Paid:                   { color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Unpaid:                 { color: "bg-red-50 text-red-700 border-red-200" },
  Overdue:                { color: "bg-amber-50 text-amber-700 border-amber-200" },
  "Pending Verification": { color: "bg-blue-50 text-blue-700 border-blue-200" },
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

export default function CaretakerPaymentOverview() {
  const [payments, setPayments]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage]               = useState(1);
  const [viewModal, setViewModal]     = useState(null);
  const [verifying, setVerifying]     = useState(null);
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

  const rows = payments.map((p) => {
    const contract = p.contract ?? {};
    const unit     = contract.unit ?? {};
    const tenant   = contract.tenants?.[0] ?? {};
    return {
      id:              p.ID,
      unitNumber:      unit.unit_number ?? "—",
      fullName:        tenant.fullName ?? "—",
      contactNumber:   tenant.contactNumber ?? "—",
      billingMonth:    p.billing_month,
      dueDate:         p.due_date,
      paymentDate:     p.payment_date,
      amount:          p.amount,
      category:        p.category,
      paymentType:     p.paymentType,
      referenceNumber: p.referenceNumber,
      receiptImage:    p.receipt_image,
      status:          p.status,
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
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalCollected   = rows.filter((r) => r.status === "Paid").reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const pendingCount     = rows.filter((r) => r.status === "Pending Verification").length;
  const overdueCount     = rows.filter((r) => r.status === "Overdue").length;
  const unpaidCount      = rows.filter((r) => r.status === "Unpaid").length;

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
          #payment-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* HIDDEN PRINT AREA */}
      <div id="payment-print-area" className="hidden print:block">
        <div className="flex justify-between items-end border-b-[3px] border-slate-900 pb-5 mb-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="MGC Logo" className="w-14 h-14 object-contain"/>
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
            <tr>{["Unit","Full Name","Billing Month","Due Date","Payment Date","Amount","Category","Type","Status"].map((h) => (
              <th key={h} className="pb-3 pt-2 px-3 border-b-2 border-slate-300 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
            ))}</tr>
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
          <StatCard icon={<FaMoneyBillWave size={16}/>}    label="Total Collected"      value={`₱${totalCollected.toLocaleString()}`} color="text-emerald-500" bg="bg-emerald-50"/>
          <StatCard icon={<FaClock size={16}/>}             label="Pending Verification" value={pendingCount}  color="text-blue-500"    bg="bg-blue-50"/>
          <StatCard icon={<FaExclamationCircle size={16}/>} label="Overdue"              value={overdueCount}  color="text-amber-500"   bg="bg-amber-50"/>
          <StatCard icon={<FaCheckCircle size={16}/>}       label="Unpaid Bills"         value={unpaidCount}   color="text-red-500"     bg="bg-red-50"/>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
              <input type="text" placeholder="Search unit, tenant, or category..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white"/>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="overflow-x-auto">
              <div className="flex bg-slate-100 p-1 rounded-lg min-w-max">
                {["All","Unpaid","Pending Verification","Paid","Overdue"].map((f) => (
                  <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
                      ${statusFilter === f ? "bg-white text-[#db6747] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                    {f === "Pending Verification" ? "Pending" : f}
                  </button>
                ))}
              </div>
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"/>
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                <FaPrint size={12}/> <span className="uppercase tracking-widest">Print</span>
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db6747] mx-auto mb-3"/>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Loading Payments...</p>
                  </td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={13} className="py-24 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaMoneyBillWave className="text-slate-300" size={20}/>
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
                                ${canChange ? "cursor-pointer hover:opacity-80" : "cursor-default opacity-80"}
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
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="View" onClick={() => setViewModal(r)}
                          className="p-2 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                          <FaEye size={13}/>
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
                Showing <span className="text-slate-700">{(page-1)*PAGE_SIZE+1}</span> to <span className="text-slate-700">{Math.min(page*PAGE_SIZE,filtered.length)}</span> of <span className="text-slate-700">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1,p-1))} disabled={page===1}
                  className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all">
                  <FaChevronLeft size={12}/>
                </button>
                {Array.from({length:totalPages},(_,i)=>i+1)
                  .filter((p)=>p===1||p===totalPages||Math.abs(p-page)<=1)
                  .reduce((acc,p,idx,arr)=>{if(idx>0&&p-arr[idx-1]>1)acc.push("...");acc.push(p);return acc;},[])
                  .map((p,idx)=>p==="..."
                    ?<span key={`e-${idx}`} className="px-2 text-slate-400 text-xs">…</span>
                    :<button key={p} onClick={()=>setPage(p)}
                      className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${page===p?"bg-[#db6747] text-white shadow-sm":"text-slate-500 hover:bg-white hover:border hover:border-slate-200 border border-transparent"}`}>
                      {p}
                    </button>
                  )}
                <button onClick={() => setPage((p) => Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all">
                  <FaChevronRight size={12}/>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODAL */}      {viewModal && (
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
                  ["Unit",          viewModal.unitNumber],
                  ["Tenant",        viewModal.fullName],
                  ["Phone",         viewModal.contactNumber],
                  ["Category",      viewModal.category],
                  ["Billing Month", fmtMonth(viewModal.billingMonth)],
                  ["Due Date",      fmt(viewModal.dueDate)],
                  ["Payment Date",  fmt(viewModal.paymentDate)],
                  ["Amount",        `₱${Number(viewModal.amount ?? 0).toLocaleString()}`],
                  ["Payment Type",  viewModal.paymentType ?? "—"],
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
                <StatusBadge status={viewModal.status}/>
              </div>
              {viewModal.receiptImage && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Receipt</p>
                  <a href={viewModal.receiptImage} target="_blank" rel="noreferrer">
                    <img src={viewModal.receiptImage} alt="Receipt" className="w-full max-h-48 object-contain rounded-lg border border-slate-200"/>
                  </a>
                </div>
              )}
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
