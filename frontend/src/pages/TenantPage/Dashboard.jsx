import React, { useState, useEffect } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaHome,
  FaUsers,
  FaReceipt,
  FaBullhorn,
  FaCloudUploadAlt,
  FaWallet,
  FaMobileAlt,
  FaCalendarAlt,
} from "react-icons/fa";

import { fetchTenantProfile } from "../../api/tenantAPI/tenantAuth";
import { fetchAnnouncements, fetchSingleAnnouncement } from "../../api/tenantAPI/AnnouncementAPI";
import { fetchMyPayments, uploadReceipt } from "../../api/tenantAPI/PaymentAPI";
import { fetchUserContracts } from "../../api/tenantAPI/ContractAPI";

export default function DashboardCards() {
  const [profile, setProfile] = useState(null);
  const [announcements, setAnnouncements] = useState({});
  const [bills, setBills] = useState({ rent: null, utilities: null });
  const [countdown, setCountdown] = useState("");
  const [contractEndDate, setContractEndDate] = useState(null);

  // Modal & Upload states
  const [uploadModal, setUploadModal] = useState({
    isOpen: false,
    paymentId: null,
    billName: "",
  });
  const [paymentMethod, setPaymentMethod] = useState(""); // "Cash" or "GCash"
  const [selectedFile, setSelectedFile] = useState(null);
  const [refNumber, setRefNumber] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Announcement modal state
  const [announcementModal, setAnnouncementModal] = useState({
    isOpen: false,
    announcement: null,
    loading: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const profileRes = await fetchTenantProfile();
        setProfile(profileRes.user);
        const annRes = await fetchAnnouncements();
        if (annRes.success && annRes.announcements) {
          const grouped = annRes.announcements.reduce((acc, curr) => {
            const cat = curr.category || "General";
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push({
              id: curr.ID || curr.id,
              message: curr.title || curr.message || "Update available",
              date: new Date(
                curr.created_at || curr.createdAt,
              ).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            });
            return acc;
          }, {});
          setAnnouncements(grouped);
        }
        const payRes = await fetchMyPayments();
        if (payRes.success && payRes.payments) {
          const rent = payRes.payments.find(
            (p) => p.type === "Rent" || p.category === "Rent",
          );
          const util = payRes.payments.find(
            (p) => p.type === "Utilities" || p.category === "Utilities",
          );
          setBills({ rent: rent || null, utilities: util || null });
        }
        const contractRes = await fetchUserContracts();
        if (contractRes.success && contractRes.contracts.length > 0) {
          const activeContract = contractRes.contracts.find(c => c.status === "Active");
          if (activeContract) {
            setContractEndDate(activeContract.end_date);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      if (!contractEndDate) {
        setCountdown("No active contract");
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // normalize to start of day

      const end = new Date(contractEndDate);
      end.setHours(0, 0, 0, 0);

      const diffMs = end - today;
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        setCountdown("Expired");
      } else if (daysLeft === 0) {
        setCountdown("Ends today");
      } else if (daysLeft === 1) {
        setCountdown("1 day left");
      } else {
        setCountdown(`${daysLeft} days left`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [contractEndDate]);

  const categories = Object.keys(announcements);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const currentCategory =
    categories.length > 0 ? categories[categoryIndex] : "General";
  const currentMessages =
    categories.length > 0 ? announcements[currentCategory] : [];

  const handleCategorySwitch = (dir) => {
    setCategoryIndex((prev) =>
      dir === "next"
        ? (prev + 1) % categories.length
        : (prev - 1 + categories.length) % categories.length,
    );
  };

  const closeModal = () => {
    setUploadModal({ isOpen: false, paymentId: null, billName: "" });
    setSelectedFile(null);
    setRefNumber("");
    setPaymentMethod("");
  };

  const handleAnnouncementClick = async (id) => {
    setAnnouncementModal({ isOpen: true, announcement: null, loading: true });
    try {
      const res = await fetchSingleAnnouncement(id);
      if (res.success) {
        setAnnouncementModal({
          isOpen: true,
          announcement: res.announcement,
          loading: false,
        });
      } else {
        alert("Failed to load announcement details");
        setAnnouncementModal({ isOpen: false, announcement: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      alert("Error loading announcement");
      setAnnouncementModal({ isOpen: false, announcement: null, loading: false });
    }
  };

  const closeAnnouncementModal = () => {
    setAnnouncementModal({ isOpen: false, announcement: null, loading: false });
  };

  const submitReceipt = async () => {
    if (paymentMethod === "GCash" && !refNumber.trim())
      return alert("Please enter GCash Ref Number.");
    if (!selectedFile) return alert("Please upload a receipt photo.");

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("receipt", selectedFile);
      formData.append("paymentType", paymentMethod);
      if (paymentMethod === "GCash")
        formData.append("referenceNumber", refNumber.trim());

      await uploadReceipt(uploadModal.paymentId, formData);
      closeModal();
      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[#FFF9F6] w-full min-h-screen font-sans text-[#330101] px-4 sm:px-6 py-5 sm:py-8">
      <div className="max-w-[1600px] mx-auto space-y-5">
        {/* MAIN GRID */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5">
          {/* LEFT CONTENT (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* TOP STATS */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <StatCard icon={<FaHome />}    label="Unit"        value={profile?.unitNumber ?? "---"}  color="text-[#D96648]"  bg="bg-[#FDF2ED]" />
              <StatCard icon={<FaUsers />}   label="Residents"   value={profile?.numberOfTenants ?? "---"} color="text-[#330101]" bg="bg-[#F5E6E0]" />
              <StatCard icon={<FaReceipt />} label="Active Bills" value={Object.values(bills).filter((b) => b && b.status !== "Paid").length} color="text-amber-600" bg="bg-amber-50" />
            </div>

            {/* BILLS SECTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PaymentCard title="Monthly Rent" bill={bills.rent}
                onPay={() => setUploadModal({ isOpen: true, paymentId: bills.rent?.id || bills.rent?.ID, billName: "Rent" })} />
              <PaymentCard title="Utilities (Electricity & Water)" bill={bills.utilities}
                onPay={() => setUploadModal({ isOpen: true, paymentId: bills.utilities?.id || bills.utilities?.ID, billName: "Utilities" })} />
            </div>

            {/* CONTRACT COUNTDOWN */}
            <div className="bg-white px-5 sm:px-8 py-5 rounded-3xl shadow-sm border border-[#F2DED4] flex items-center">
              <div className="flex items-center gap-4 w-full">
                <div className="p-3.5 bg-[#FDF2ED] text-[#D96648] rounded-2xl shrink-0">
                  <FaCalendarAlt size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[#330101]/40 text-[10px] font-bold uppercase tracking-widest mb-1">Contract Ends In</p>
                  <h3 className={`text-base sm:text-xl font-black truncate ${
                    countdown === "Expired" ? "text-red-500" :
                    countdown === "Ends today" ? "text-amber-500" :
                    "text-[#330101]"
                  }`}>{countdown}</h3>
                  {contractEndDate && (
                    <p className="text-[10px] text-[#330101]/40 mt-0.5">
                      End date: {new Date(contractEndDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Announcements (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-[#7a2e1a] rounded-3xl p-5 sm:p-7 text-[#FFEDE1] shadow-2xl flex flex-col relative overflow-hidden" style={{ minHeight: "320px", height: "100%" }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="flex items-center gap-2 font-bold text-base">
                  <FaBullhorn className="text-[#f7b094]" /> Announcements
                </h2>
                <div className="flex gap-1">
                  <button onClick={() => handleCategorySwitch("prev")} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition">
                    <FaChevronLeft size={12} />
                  </button>
                  <button onClick={() => handleCategorySwitch("next")} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition">
                    <FaChevronRight size={12} />
                  </button>
                </div>
              </div>
              <p className="text-[10px] font-bold text-[#f7b094] uppercase tracking-[2px] mb-4">{currentCategory} Updates</p>
              <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {currentMessages.length > 0 ? (
                  currentMessages.map((item) => (
                    <div key={item.id} onClick={() => handleAnnouncementClick(item.id)}
                      className="bg-white/5 border border-white/10 p-4 rounded-2xl transition-all group cursor-pointer hover:bg-white/10">
                      <p className="text-sm leading-relaxed mb-2 group-hover:text-white">{item.message}</p>
                      <span className="text-[10px] text-white/30 font-bold uppercase">{item.date}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-white/20 text-sm">No updates found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CASH OR GCASH OPTION */}
      {uploadModal.isOpen && (
        <div className="fixed inset-0 bg-[#330101]/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#f7b094] h-2 w-full"></div>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#330101]">
                  Payment Method
                </h3>
                <button
                  onClick={closeModal}
                  className="text-[#330101]/40 hover:text-[#330101]"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {!paymentMethod ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setPaymentMethod("Cash")}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-[#F2DED4] hover:border-[#D96648] transition-all group"
                  >
                    <div className="p-3 bg-[#FDF2ED] text-[#D96648] rounded-xl group-hover:bg-[#D96648] group-hover:text-white">
                      <FaWallet size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[#330101]">Cash Payment</p>
                      <p className="text-xs text-slate-500">
                        Upload physical receipt
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("GCash")}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-[#F2DED4] hover:border-[#D96648] transition-all group"
                  >
                    <div className="p-3 bg-[#FDF2ED] text-[#D96648] rounded-xl group-hover:bg-[#D96648] group-hover:text-white">
                      <FaMobileAlt size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[#330101]">GCash Transfer</p>
                      <p className="text-xs text-slate-500">
                        Reference No. required
                      </p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-[#FFF9F6] border border-[#F2DED4] rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaReceipt className="text-[#D96648]" />
                      <span className="text-xs font-bold text-[#330101]/80 truncate max-w-[150px]">
                        {selectedFile ? selectedFile.name : "No file selected"}
                      </span>
                    </div>
                    <button onClick={() => setPaymentMethod("")} className="text-[10px] font-bold text-[#D96648] uppercase">
                      Change
                    </button>
                  </div>

                  {/* File upload */}
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#F2DED4] hover:border-[#D96648] rounded-2xl p-5 cursor-pointer transition-all">
                    <FaCloudUploadAlt className="text-[#D96648]" size={22} />
                    <span className="text-xs font-bold text-[#330101]/60">
                      {selectedFile ? selectedFile.name : "Click to upload receipt image"}
                    </span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
                  </label>

                  {paymentMethod === "GCash" && (
                    <div>
                      <label className="text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest mb-2 block">
                        GCash Reference No.
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#f7b094] outline-none transition font-bold"
                        placeholder="13-digit number"
                        value={refNumber}
                        onChange={(e) => setRefNumber(e.target.value)}
                      />
                    </div>
                  )}

                  <button
                    onClick={submitReceipt}
                    disabled={isUploading}
                    className="w-full bg-[#330101] hover:bg-[#4d0707] text-[#FFEDE1] font-bold py-5 rounded-2xl shadow-xl shadow-[#330101]/20 transition-all disabled:opacity-50"
                  >
                    {isUploading ? "Processing..." : "Submit Payment"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ANNOUNCEMENT DETAILS */}
      {announcementModal.isOpen && (
        <div className="fixed inset-0 bg-[#330101]/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="bg-[#f7b094] h-2 w-full"></div>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#330101]">
                  Announcement Details
                </h3>
                <button
                  onClick={closeAnnouncementModal}
                  className="text-[#330101]/40 hover:text-[#330101]"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {announcementModal.loading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D96648] mx-auto"></div>
                  <p className="text-[#330101]/60 mt-4">Loading announcement...</p>
                </div>
              ) : announcementModal.announcement ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-[#330101] mb-2">
                      {announcementModal.announcement.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-[#330101]/60">
                      <span className="bg-[#FFF9F6] px-3 py-1 rounded-full font-medium">
                        {announcementModal.announcement.category}
                      </span>
                      <span>
                        {new Date(announcementModal.announcement.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#FFF9F6] border border-[#F2DED4] rounded-2xl p-6">
                    <h5 className="font-bold text-[#330101] mb-3">Message</h5>
                    <p className="text-[#330101]/80 leading-relaxed whitespace-pre-wrap">
                      {announcementModal.announcement.message}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-[#330101]/60">
                  Announcement not found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components - MODIFIED FOR PADDING
function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white px-4 sm:px-6 py-4 sm:py-5 rounded-3xl shadow-sm border border-[#F2DED4] flex items-center gap-3 sm:gap-5 transition-all hover:-translate-y-1 hover:shadow-md">
      <div className={`p-2.5 sm:p-3.5 ${bg} ${color} rounded-2xl shrink-0`}>
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <div className="min-w-0">
        <p className="text-[#330101]/40 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-0.5 truncate">
          {label}
        </p>
        <h3 className="text-xl sm:text-2xl font-black text-[#330101] leading-none">{value}</h3>
      </div>
    </div>
  );
}

function PaymentCard({ title, bill, onPay }) {
  const getStatusStyles = (status) => {
    switch (status) {
      case "Paid":                  return { bg: "#DCFCE7", text: "#22C55E", label: "PAID" };
      case "Pending Verification":  return { bg: "#FEF3C7", text: "#F59E0B", label: "PENDING VERIFICATION" };
      case "Unpaid":                return { bg: "#FEE2E2", text: "#EF4444", label: "UNPAID" };
      case "Overdue":               return { bg: "#FEE2E2", text: "#DC2626", label: "OVERDUE" };
      default:                      return { bg: "#F3F4F6", text: "#6B7280", label: "NO INVOICE" };
    }
  };

  const style = getStatusStyles(bill?.status);
  const isPaid = bill?.status === "Paid" || bill?.status === "Pending Verification";

  return (
    <div className="bg-white p-7 rounded-4xl shadow-sm border border-[#F2DED4] flex flex-col justify-between h-full group hover:border-[#f7b094] hover:shadow-md transition-all">
      <div>
        <div className="flex justify-between items-start mb-5">
          <p className="text-[#330101]/40 text-[10px] font-bold uppercase tracking-widest">{title}</p>
          <span className="text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap"
            style={{ backgroundColor: style.bg, color: style.text }}>
            {style.label}
          </span>
        </div>
        <h2 className="text-4xl font-black text-[#330101] mt-2">
          <span className="text-lg font-medium text-[#330101]/30 mr-1">₱</span>
          {bill?.status === "Paid"
            ? "0.00"
            : bill?.amount
              ? parseFloat(bill.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })
              : "0.00"}
        </h2>
      </div>

      <div className="mt-7">
        {!isPaid ? (
          <button
            onClick={onPay}
            disabled={!bill}
            className="w-full flex items-center justify-center gap-3 bg-[#330101] hover:bg-[#D96648] text-[#FFEDE1] text-xs font-bold py-4 rounded-2xl cursor-pointer transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest"
          >
            <FaWallet size={16} /> Upload a Receipt
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 bg-[#F5E6E0] text-[#330101]/50 text-xs font-bold py-4 rounded-2xl border border-dashed border-[#330101]/10 uppercase">
            {bill?.status === "Paid" ? "Paid for this month" : "Verifying..."}
          </div>
        )}
      </div>
    </div>
  );
}
