import { useState, useEffect } from "react";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import {
  FaReceipt, FaSearch, FaCloudUploadAlt, FaEye,
  FaTimes, FaWallet, FaMobileAlt, FaCheckCircle,
  FaCalendarAlt,
} from "react-icons/fa";
import { fetchMyPayments, uploadReceipt } from "../../api/tenantAPI/PaymentAPI";
import ModalPortal from "../../components/ModalPortal";

const STATUS_STYLES = {
  "Paid": { bg: "#DCFCE7", text: "#16A34A", dot: "bg-emerald-400" },
  "Pending Verification": { bg: "#FEF3C7", text: "#D97706", dot: "bg-amber-400" },
  "Unpaid": { bg: "#FEE2E2", text: "#DC2626", dot: "bg-red-400" },
  "Overdue": { bg: "#FEE2E2", text: "#B91C1C", dot: "bg-red-600" },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const fmtAmount = (a) =>
  `₱${parseFloat(a || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function PaymenthisCards() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");

  // Detail modal
  const [detailModal, setDetailModal] = useState(null);

  // Upload modal
  const [uploadModal, setUploadModal] = useState(null); // { payment }
  const [paymentMethod, setPaymentMethod] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { load(); }, []);
  useSocketEvent("payment_updated", () => load(true));
    try {
      if (!silent) setLoading(true);
      const res = await fetchMyPayments();
      if (res.success) setPayments(res.payments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Summary counts
  const total = payments.length;
  const paid = payments.filter((p) => p.status === "Paid").length;
  const pending = payments.filter((p) => p.status === "Pending Verification").length;
  const unpaid = payments.filter((p) => p.status === "Unpaid" || p.status === "Overdue").length;

  const filtered = payments.filter((p) => {
    const matchSearch = p.category?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    const matchCategory = filterCategory === "All" || p.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const canUpload = (p) => p.status === "Unpaid" || p.status === "Overdue";

  const openUpload = (payment) => {
    setUploadModal({ payment });
    setPaymentMethod("");
    setRefNumber("");
    setSelectedFile(null);
  };

  const closeUpload = () => {
    setUploadModal(null);
    setPaymentMethod("");
    setRefNumber("");
    setSelectedFile(null);
  };

  const submitReceipt = async () => {
    if (!selectedFile) return alert("Please select a receipt image.");
    if (paymentMethod === "GCash" && !refNumber.trim()) return alert("Enter GCash reference number.");
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("receipt", selectedFile);
      form.append("paymentType", paymentMethod);
      if (paymentMethod === "GCash") form.append("referenceNumber", refNumber.trim());
      await uploadReceipt(uploadModal.payment.ID || uploadModal.payment.id, form);
      closeUpload();
      load(true);
    } catch (e) {
      alert(e?.response?.data?.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[#FFF9F6] min-h-screen w-full px-4 sm:px-6 md:px-10 2xl:px-14 py-6 md:py-10 2xl:py-14 text-[#330101]">
      <div className="max-w-[1600px] mx-auto space-y-6 lg:space-y-8 2xl:space-y-10">

        {/* SUMMARY TILES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 2xl:gap-6">
          <SummaryTile label="Total Bills" value={total} color="text-[#330101]" bg="bg-[#FDF2ED]" icon={<FaReceipt className="2xl:w-5 2xl:h-5" />} />
          <SummaryTile label="Paid" value={paid} color="text-emerald-600" bg="bg-emerald-50" icon={<FaCheckCircle className="2xl:w-5 2xl:h-5" />} />
          <SummaryTile label="Pending" value={pending} color="text-amber-600" bg="bg-amber-50" icon={<FaCalendarAlt className="2xl:w-5 2xl:h-5" />} />
          <SummaryTile label="Unpaid" value={unpaid} color="text-red-600" bg="bg-red-50" icon={<FaReceipt className="2xl:w-5 2xl:h-5" />} />
        </div>

        {/* TABLE CARD */}
        <div className="bg-white rounded-3xl sm:rounded-4xl border border-[#F2DED4] shadow-sm overflow-hidden flex flex-col">

          {/* Card header */}
          <div className="px-5 sm:px-6 2xl:px-8 py-4 2xl:py-5 border-b border-[#F2DED4] flex items-center gap-3 shrink-0">
            <div className="p-2.5 2xl:p-3 bg-[#FDF2ED] text-[#D96648] rounded-xl shrink-0">
              <FaReceipt size={15} className="2xl:w-5 2xl:h-5" />
            </div>
            <h2 className="text-sm 2xl:text-base font-black uppercase tracking-widest text-[#330101]">Payment History</h2>
          </div>

          {/* Filters - Fluid Layout */}
          <div className="px-4 sm:px-6 2xl:px-8 py-4 border-b border-[#F2DED4] flex flex-col md:flex-row gap-3 2xl:gap-5 md:items-center justify-between bg-slate-50/50">
            <div className="relative w-full md:w-72 2xl:w-96">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#330101]/30" size={12} />
              <input
                type="text"
                placeholder="Search category..."
                className="w-full bg-white border border-[#F2DED4] rounded-xl pl-9 pr-4 py-2.5 2xl:py-3 text-xs sm:text-sm 2xl:text-base focus:ring-2 focus:ring-[#f7b094] outline-none transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <select
                className="w-full sm:w-auto bg-white border border-[#F2DED4] rounded-xl px-4 py-2.5 2xl:py-3 text-xs sm:text-sm 2xl:text-base font-bold focus:ring-2 focus:ring-[#f7b094] outline-none cursor-pointer transition-all shadow-sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
              </select>
              <select
                className="w-full sm:w-auto bg-white border border-[#F2DED4] rounded-xl px-4 py-2.5 2xl:py-3 text-xs sm:text-sm 2xl:text-base font-bold focus:ring-2 focus:ring-[#f7b094] outline-none cursor-pointer transition-all shadow-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending Verification">Pending</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Table Area */}
          {loading ? (
            <div className="flex items-center justify-center py-20 2xl:py-32">
              <div className="animate-spin rounded-full h-10 w-10 2xl:w-12 2xl:h-12 border-b-2 border-[#D96648]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 2xl:py-32 text-[#330101]/30 text-sm 2xl:text-base italic">No records found.</div>
          ) : (
            <div className="flex-1">
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                <table className="w-full whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#5c1f10] text-white/70 text-[10px] 2xl:text-xs uppercase tracking-widest">
                      <th className="py-4 2xl:py-5 px-6 2xl:px-8 text-left font-bold">Category</th>
                      <th className="py-4 2xl:py-5 px-6 2xl:px-8 text-left font-bold">Billing Month</th>
                      <th className="py-4 2xl:py-5 px-6 2xl:px-8 text-left font-bold">Due Date</th>
                      <th className="py-4 2xl:py-5 px-6 2xl:px-8 text-left font-bold">Amount</th>
                      <th className="py-4 2xl:py-5 px-6 2xl:px-8 text-left font-bold">Payment Date</th>
                      <th className="py-4 2xl:py-5 px-6 2xl:px-8 text-left font-bold">Method</th>
                      <th className="py-4 2xl:py-5 px-6 2xl:px-8 text-left font-bold">Status</th>
                      <th className="py-4 2xl:py-5 px-6 2xl:px-8 text-center font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2DED4]">
                    {filtered.map((p) => {
                      const st = STATUS_STYLES[p.status] || STATUS_STYLES["Unpaid"];
                      return (
                        <tr key={p.ID || p.id} className="hover:bg-[#FFF9F6] transition-colors group">
                          <td className="py-4 2xl:py-5 px-6 2xl:px-8 font-bold text-sm 2xl:text-base text-[#330101]">{p.category}</td>
                          <td className="py-4 2xl:py-5 px-6 2xl:px-8 text-sm 2xl:text-base text-[#330101]/70">{fmt(p.billing_month)}</td>
                          <td className="py-4 2xl:py-5 px-6 2xl:px-8 text-sm 2xl:text-base text-[#330101]/70">{fmt(p.due_date)}</td>
                          <td className="py-4 2xl:py-5 px-6 2xl:px-8 font-black text-sm 2xl:text-base text-[#330101]">{fmtAmount(p.amount)}</td>
                          <td className="py-4 2xl:py-5 px-6 2xl:px-8 text-sm 2xl:text-base text-[#330101]/70">{fmt(p.payment_date)}</td>
                          <td className="py-4 2xl:py-5 px-6 2xl:px-8 text-sm 2xl:text-base text-[#330101]/60">{p.paymentType || "—"}</td>
                          <td className="py-4 2xl:py-5 px-6 2xl:px-8">
                            <span className="inline-flex items-center gap-1.5 text-[9px] 2xl:text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm"
                              style={{ backgroundColor: st.bg, color: st.text }}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4 2xl:py-5 px-6 2xl:px-8">
                            <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setDetailModal(p)}
                                className="p-2 2xl:p-2.5 rounded-xl bg-[#FDF2ED] text-[#D96648] hover:bg-[#D96648] hover:text-white transition-all active:scale-95"
                                title="View Details">
                                <FaEye size={14} className="2xl:w-4 2xl:h-4" />
                              </button>
                              {canUpload(p) && (
                                <button onClick={() => openUpload(p)}
                                  className="p-2 2xl:p-2.5 rounded-xl bg-[#5c1f10] text-white hover:bg-[#7a2e1a] transition-all active:scale-95 shadow-sm"
                                  title="Upload Receipt">
                                  <FaCloudUploadAlt size={14} className="2xl:w-4 2xl:h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Tablet cards */}
              <div className="lg:hidden divide-y divide-[#F2DED4]">
                {filtered.map((p) => {
                  const st = STATUS_STYLES[p.status] || STATUS_STYLES["Unpaid"];
                  return (
                    <div key={p.ID || p.id} className="p-5 sm:p-6 space-y-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-black text-sm sm:text-base text-[#330101] truncate">{p.category}</p>
                          <p className="text-[11px] sm:text-xs text-[#330101]/50 mt-0.5 font-medium">{fmt(p.billing_month)}</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-widest shrink-0 shadow-sm"
                          style={{ backgroundColor: st.bg, color: st.text }}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {p.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-[#FFF9F6] p-3 rounded-xl border border-[#F2DED4]">
                        <div>
                          <p className="text-[9px] sm:text-[10px] text-[#330101]/40 uppercase tracking-widest font-bold">Amount</p>
                          <p className="font-black text-sm sm:text-base text-[#330101]">{fmtAmount(p.amount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] sm:text-[10px] text-[#330101]/40 uppercase tracking-widest font-bold">Due Date</p>
                          <p className="text-xs sm:text-sm font-bold text-[#330101]/70">{fmt(p.due_date)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 pt-1">
                        <button onClick={() => setDetailModal(p)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FDF2ED] text-[#D96648] text-[10px] sm:text-xs font-bold uppercase tracking-widest active:scale-[0.98] transition-transform">
                          <FaEye size={12} /> Details
                        </button>
                        {canUpload(p) && (
                          <button onClick={() => openUpload(p)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#5c1f10] text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest active:scale-[0.98] transition-transform shadow-md">
                            <FaCloudUploadAlt size={12} /> Upload
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-[#330101]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl sm:rounded-[2rem] shadow-2xl w-full max-w-md sm:max-w-lg overflow-hidden animate-in zoom-in-95">
              <div className="bg-[#5c1f10] h-2 w-full" />
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-[#330101] text-base sm:text-lg uppercase tracking-widest">Payment Details</h3>
                  <button onClick={() => setDetailModal(null)} className="p-2 rounded-xl hover:bg-[#FDF2ED] text-[#330101]/40 hover:text-[#D96648] transition-all active:scale-95">
                    <FaTimes size={18} />
                  </button>
                </div>
                <div className="space-y-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-5">
                  {[
                    ["Category", detailModal.category],
                    ["Billing Month", fmt(detailModal.billing_month)],
                    ["Due Date", fmt(detailModal.due_date)],
                    ["Amount", fmtAmount(detailModal.amount)],
                    ["Status", detailModal.status],
                    ["Payment Date", fmt(detailModal.payment_date)],
                    ["Method", detailModal.paymentType || "—"],
                    ["Reference #", detailModal.referenceNumber || "—"],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center py-2.5 border-b border-slate-200 last:border-0">
                      <span className="text-[10px] sm:text-xs font-bold text-[#330101]/50 uppercase tracking-widest">{label}</span>
                      <span className="text-xs sm:text-sm font-bold text-[#330101] text-right ml-4">{val}</span>
                    </div>
                  ))}
                </div>
                {detailModal.receipt_image && (
                  <div className="mt-6">
                    <p className="text-[10px] sm:text-xs font-bold text-[#330101]/50 uppercase tracking-widest mb-2.5">Attached Receipt</p>
                    <a href={detailModal.receipt_image} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-2xl border-2 border-[#F2DED4]">
                      <img src={detailModal.receipt_image} alt="Receipt" className="w-full object-cover max-h-56 sm:max-h-64 transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl">Click to Enlarge</span>
                      </div>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* UPLOAD MODAL */}
      {uploadModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-[#330101]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl sm:rounded-[2rem] shadow-2xl w-full max-w-md sm:max-w-lg overflow-hidden animate-in zoom-in-95">
              <div className="bg-[#f7b094] h-2 w-full" />
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-[#330101] text-base sm:text-lg uppercase tracking-widest">Submit Receipt</h3>
                  <button onClick={closeUpload} className="p-2 rounded-xl hover:bg-[#FDF2ED] text-[#330101]/40 hover:text-[#D96648] transition-all active:scale-95">
                    <FaTimes size={18} />
                  </button>
                </div>

                <div className="bg-[#FFF9F6] border border-[#F2DED4] rounded-2xl p-4 sm:p-5 mb-6 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-[#330101]/50 uppercase tracking-widest">{uploadModal.payment.category}</p>
                    <p className="font-black text-[#330101] text-lg sm:text-xl">{fmtAmount(uploadModal.payment.amount)}</p>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-black px-3 py-1.5 rounded-full uppercase shadow-sm"
                    style={{ backgroundColor: STATUS_STYLES[uploadModal.payment.status]?.bg, color: STATUS_STYLES[uploadModal.payment.status]?.text }}>
                    {uploadModal.payment.status}
                  </span>
                </div>

                {!paymentMethod ? (
                  <div className="space-y-3 sm:space-y-4">
                    <p className="text-[10px] sm:text-xs font-bold text-[#330101]/50 uppercase tracking-widest mb-1">Select Payment Method</p>
                    {[
                      { method: "Cash", icon: <FaWallet size={18} className="sm:w-5 sm:h-5" />, label: "Cash Payment", sub: "Upload physical receipt" },
                      { method: "GCash", icon: <FaMobileAlt size={18} className="sm:w-5 sm:h-5" />, label: "GCash Transfer", sub: "Reference number required" },
                    ].map(({ method, icon, label, sub }) => (
                      <button key={method} onClick={() => setPaymentMethod(method)}
                        className="w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 border-[#F2DED4] hover:border-[#D96648] hover:bg-[#FFF9F6] transition-all group active:scale-[0.98]">
                        <div className="p-3 bg-[#FDF2ED] text-[#D96648] rounded-xl group-hover:bg-[#D96648] group-hover:text-white transition-all">{icon}</div>
                        <div className="text-left">
                          <p className="font-bold text-sm sm:text-base text-[#330101]">{label}</p>
                          <p className="text-[11px] sm:text-xs text-[#330101]/50">{sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-5 animate-in slide-in-from-right-4">
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <p className="text-[10px] sm:text-xs font-bold text-[#330101]/60 uppercase tracking-widest flex items-center gap-2">
                        {paymentMethod === "Cash" ? <FaWallet className="text-[#D96648]" /> : <FaMobileAlt className="text-[#D96648]" />}
                        {paymentMethod === "Cash" ? "Cash Payment Selected" : "GCash Transfer Selected"}
                      </p>
                      <button onClick={() => setPaymentMethod("")} className="text-[9px] sm:text-[10px] font-bold text-[#D96648] uppercase bg-[#FDF2ED] px-2 py-1 rounded hover:bg-[#f7b094] hover:text-white transition-colors">Change</button>
                    </div>

                    {/* File upload */}
                    <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#F2DED4] hover:border-[#D96648] bg-slate-50 hover:bg-white rounded-2xl p-6 sm:p-8 cursor-pointer transition-all">
                      <div className="p-4 bg-[#FDF2ED] rounded-full text-[#D96648]"><FaCloudUploadAlt size={24} /></div>
                      <span className="text-xs sm:text-sm font-bold text-[#330101]/60 text-center px-4">
                        {selectedFile ? selectedFile.name : "Tap here to upload receipt image"}
                      </span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
                    </label>

                    {paymentMethod === "GCash" && (
                      <div>
                        <label className="text-[10px] sm:text-xs font-bold text-[#330101]/50 uppercase tracking-widest mb-2 block">GCash Reference No.</label>
                        <input type="text" className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-xl px-4 py-3.5 sm:py-4 text-sm font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition-all placeholder:text-black/20"
                          placeholder="13-digit reference number" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
                      </div>
                    )}

                    <button onClick={submitReceipt} disabled={isUploading}
                      className="w-full bg-[#5c1f10] hover:bg-[#7a2e1a] text-[#FFEDE1] font-bold py-4 sm:py-4.5 rounded-xl sm:rounded-2xl transition-all disabled:opacity-50 uppercase tracking-widest text-[10px] sm:text-xs shadow-lg active:scale-[0.98] mt-2">
                      {isUploading ? "Uploading Securely..." : "Submit Receipt"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

function SummaryTile({ label, value, color, bg, icon }) {
  return (
    <div className="bg-white px-4 sm:px-5 2xl:px-6 py-4 2xl:py-6 rounded-3xl sm:rounded-4xl border border-[#F2DED4] shadow-sm flex items-center gap-3 sm:gap-4 transition-all hover:scale-[1.02]">
      <div className={`p-2.5 sm:p-3 2xl:p-4 ${bg} ${color} rounded-2xl shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] 2xl:text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest mb-1 truncate">{label}</p>
        <h3 className="text-lg sm:text-xl 2xl:text-2xl font-black text-[#330101] truncate">{value}</h3>
      </div>
    </div>
  );
}