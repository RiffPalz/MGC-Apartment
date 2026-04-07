import { useState, useEffect } from "react";
import {
  FaReceipt, FaSearch, FaCloudUploadAlt, FaEye,
  FaTimes, FaWallet, FaMobileAlt, FaCheckCircle,
  FaCalendarAlt,
} from "react-icons/fa";
import { fetchMyPayments, uploadReceipt } from "../../api/tenantAPI/PaymentAPI";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

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
  const [submitConfirm, setSubmitConfirm] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async (silent = false) => {
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
    setSubmitConfirm(true);
  };

  const doSubmitReceipt = async () => {
    setSubmitConfirm(false);
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
    <div className="bg-[#FFF9F6] min-h-screen w-full px-3 sm:px-5 md:px-8 xl:px-12 py-5 md:py-8 text-[#330101]">
      <div className="w-full space-y-5 md:space-y-6">

        {/* SUMMARY TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <SummaryTile label="Total Bills" value={total} color="text-[#330101]" bg="bg-[#FDF2ED]" icon={<FaReceipt />} />
          <SummaryTile label="Paid" value={paid} color="text-emerald-600" bg="bg-emerald-50" icon={<FaCheckCircle />} />
          <SummaryTile label="Pending" value={pending} color="text-amber-600" bg="bg-amber-50" icon={<FaCalendarAlt />} />
          <SummaryTile label="Unpaid" value={unpaid} color="text-red-600" bg="bg-red-50" icon={<FaReceipt />} />
        </div>

        {/* TABLE CARD */}
        <div className="bg-white rounded-4xl border border-[#F2DED4] shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#F2DED4] flex items-center gap-3">
            <div className="p-2.5 bg-[#FDF2ED] text-[#D96648] rounded-xl shrink-0">
              <FaReceipt size={15} />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#330101]">Payment History</h2>
          </div>

          {/* Filters */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#F2DED4] flex flex-col gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#330101]/30" size={12} />
              <input
                type="text"
                placeholder="Search category..."
                className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#f7b094] outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <select
                className="flex-1 bg-[#FFF9F6] border border-[#F2DED4] rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#f7b094] outline-none cursor-pointer"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
              </select>
              <select
                className="flex-1 bg-[#FFF9F6] border border-[#F2DED4] rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#f7b094] outline-none cursor-pointer"
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

          {/* Table — desktop */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D96648]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-[#330101]/30 text-sm italic">No records found.</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#5c1f10] text-white/70 text-[10px] uppercase tracking-widest">
                      <th className="py-4 px-6 text-left font-bold">Category</th>
                      <th className="py-4 px-6 text-left font-bold">Billing Month</th>
                      <th className="py-4 px-6 text-left font-bold">Due Date</th>
                      <th className="py-4 px-6 text-left font-bold">Amount</th>
                      <th className="py-4 px-6 text-left font-bold">Payment Date</th>
                      <th className="py-4 px-6 text-left font-bold">Method</th>
                      <th className="py-4 px-6 text-left font-bold">Status</th>
                      <th className="py-4 px-6 text-left font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2DED4]">
                    {filtered.map((p) => {
                      const st = STATUS_STYLES[p.status] || STATUS_STYLES["Unpaid"];
                      return (
                        <tr key={p.ID || p.id} className="hover:bg-[#FFF9F6] transition-colors">
                          <td className="py-4 px-6 font-bold text-sm text-[#330101]">{p.category}</td>
                          <td className="py-4 px-6 text-sm text-[#330101]/70">{fmt(p.billing_month)}</td>
                          <td className="py-4 px-6 text-sm text-[#330101]/70">{fmt(p.due_date)}</td>
                          <td className="py-4 px-6 font-black text-sm text-[#330101]">{fmtAmount(p.amount)}</td>
                          <td className="py-4 px-6 text-sm text-[#330101]/70">{fmt(p.payment_date)}</td>
                          <td className="py-4 px-6 text-sm text-[#330101]/60">{p.paymentType || "—"}</td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest"
                              style={{ backgroundColor: st.bg, color: st.text }}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setDetailModal(p)}
                                className="p-2 rounded-xl bg-[#FDF2ED] text-[#D96648] hover:bg-[#D96648] hover:text-white transition-all">
                                <FaEye size={13} />
                              </button>
                              {canUpload(p) && (
                                <button onClick={() => openUpload(p)}
                                  className="p-2 rounded-xl bg-[#5c1f10] text-white hover:bg-[#7a2e1a] transition-all">
                                  <FaCloudUploadAlt size={13} />
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

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-[#F2DED4]">
                {filtered.map((p) => {
                  const st = STATUS_STYLES[p.status] || STATUS_STYLES["Unpaid"];
                  return (
                    <div key={p.ID || p.id} className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-sm text-[#330101]">{p.category}</p>
                          <p className="text-xs text-[#330101]/50 mt-0.5">{fmt(p.billing_month)}</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shrink-0"
                          style={{ backgroundColor: st.bg, color: st.text }}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {p.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-[#330101]/40 uppercase tracking-widest">Amount</p>
                          <p className="font-black text-base text-[#330101]">{fmtAmount(p.amount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-[#330101]/40 uppercase tracking-widest">Due</p>
                          <p className="text-sm font-bold text-[#330101]/70">{fmt(p.due_date)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setDetailModal(p)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FDF2ED] text-[#D96648] text-xs font-bold uppercase tracking-widest">
                          <FaEye size={12} /> Details
                        </button>
                        {canUpload(p) && (
                          <button onClick={() => openUpload(p)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#5c1f10] text-white text-xs font-bold uppercase tracking-widest">
                            <FaCloudUploadAlt size={12} /> Upload
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailModal && (
        <div className="fixed inset-0 bg-[#330101]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#5c1f10] h-1.5 w-full" />
            <div className="p-7">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-[#330101] text-base uppercase tracking-widest">Payment Details</h3>
                <button onClick={() => setDetailModal(null)} className="p-2 rounded-xl hover:bg-[#FDF2ED] text-[#330101]/40 hover:text-[#D96648] transition-all">
                  <FaTimes size={16} />
                </button>
              </div>
              <div className="space-y-3">
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
                  <div key={label} className="flex justify-between items-center py-2.5 border-b border-[#F2DED4] last:border-0">
                    <span className="text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest">{label}</span>
                    <span className="text-sm font-bold text-[#330101]">{val}</span>
                  </div>
                ))}
              </div>
              {detailModal.receipt_image && (
                <div className="mt-5">
                  <p className="text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest mb-2">Receipt</p>
                  <a href={detailModal.receipt_image} target="_blank" rel="noopener noreferrer">
                    <img src={detailModal.receipt_image} alt="Receipt" className="w-full rounded-2xl border border-[#F2DED4] object-cover max-h-48" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {uploadModal && (
        <div className="fixed inset-0 bg-[#330101]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#f7b094] h-1.5 w-full" />
            <div className="p-7">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-[#330101] text-base uppercase tracking-widest">Submit Receipt</h3>
                <button onClick={closeUpload} className="p-2 rounded-xl hover:bg-[#FDF2ED] text-[#330101]/40 hover:text-[#D96648] transition-all">
                  <FaTimes size={16} />
                </button>
              </div>

              <div className="bg-[#FFF9F6] border border-[#F2DED4] rounded-2xl p-4 mb-5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest">{uploadModal.payment.category}</p>
                  <p className="font-black text-[#330101]">{fmtAmount(uploadModal.payment.amount)}</p>
                </div>
                <span className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase"
                  style={{ backgroundColor: STATUS_STYLES[uploadModal.payment.status]?.bg, color: STATUS_STYLES[uploadModal.payment.status]?.text }}>
                  {uploadModal.payment.status}
                </span>
              </div>

              {!paymentMethod ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest mb-3">Select Payment Method</p>
                  {[
                    { method: "Cash", icon: <FaWallet size={18} />, label: "Cash Payment", sub: "Upload physical receipt" },
                    { method: "GCash", icon: <FaMobileAlt size={18} />, label: "GCash Transfer", sub: "Reference number required" },
                  ].map(({ method, icon, label, sub }) => (
                    <button key={method} onClick={() => setPaymentMethod(method)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-[#F2DED4] hover:border-[#D96648] transition-all group">
                      <div className="p-3 bg-[#FDF2ED] text-[#D96648] rounded-xl group-hover:bg-[#D96648] group-hover:text-white transition-all">{icon}</div>
                      <div className="text-left">
                        <p className="font-bold text-sm text-[#330101]">{label}</p>
                        <p className="text-xs text-[#330101]/40">{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest">
                      {paymentMethod === "Cash" ? "Cash Payment" : "GCash Transfer"}
                    </p>
                    <button onClick={() => setPaymentMethod("")} className="text-[10px] font-bold text-[#D96648] uppercase">Change</button>
                  </div>

                  {/* File upload */}
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#F2DED4] hover:border-[#D96648] rounded-2xl p-6 cursor-pointer transition-all">
                    <FaCloudUploadAlt className="text-[#D96648]" size={24} />
                    <span className="text-xs font-bold text-[#330101]/60">
                      {selectedFile ? selectedFile.name : "Click to upload receipt image"}
                    </span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
                  </label>

                  {paymentMethod === "GCash" && (
                    <div>
                      <label className="text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest mb-2 block">GCash Reference No.</label>
                      <input type="text" className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#f7b094] outline-none"
                        placeholder="13-digit reference number" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
                    </div>
                  )}

                  <button onClick={submitReceipt} disabled={isUploading}
                    className="w-full bg-[#5c1f10] hover:bg-[#7a2e1a] text-[#FFEDE1] font-bold py-4 rounded-2xl transition-all disabled:opacity-50 uppercase tracking-widest text-xs shadow-lg">
                    {isUploading ? "Uploading..." : "Submit Receipt"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM: Submit Receipt */}
      <GeneralConfirmationModal
        isOpen={submitConfirm}
        onClose={() => setSubmitConfirm(false)}
        onConfirm={doSubmitReceipt}
        variant="save"
        title="Submit Receipt?"
        message={`Confirm submitting your ${uploadModal?.payment?.category} receipt via ${paymentMethod}?`}
        confirmText="Submit"
        loading={isUploading}
      />
    </div>
  );
}

function SummaryTile({ label, value, color, bg, icon }) {
  return (
    <div className="bg-white px-4 py-3.5 sm:px-5 sm:py-4 rounded-3xl border border-[#F2DED4] shadow-sm flex items-center gap-3 sm:gap-4">
      <div className={`p-2.5 sm:p-3 ${bg} ${color} rounded-xl sm:rounded-2xl shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[8px] sm:text-[9px] font-bold text-[#330101]/40 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">{label}</p>
        <h3 className="text-lg sm:text-xl font-black text-[#330101]">{value}</h3>
      </div>
    </div>
  );
}