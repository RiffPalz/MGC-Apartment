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
  FaFileInvoice,
  FaExternalLinkAlt,
} from "react-icons/fa";

import { fetchTenantProfile } from "../../api/tenantAPI/tenantAuth";
import { fetchAnnouncements, fetchSingleAnnouncement } from "../../api/tenantAPI/AnnouncementAPI";
import { fetchMyPayments, uploadReceipt } from "../../api/tenantAPI/PaymentAPI";
import { fetchUserContracts } from "../../api/tenantAPI/ContractAPI";
import ModalPortal from "../../components/ModalPortal";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

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
  const [submitConfirm, setSubmitConfirm] = useState(false);

  // Announcement modal state
  const [announcementModal, setAnnouncementModal] = useState({
    isOpen: false,
    announcement: null,
    loading: false,
  });

  // Utility bill viewer modal
  const [utilityBillUrl, setUtilityBillUrl] = useState(null);

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
          const terminatedContract = contractRes.contracts.find(c => c.status === "Terminated");
          if (activeContract) {
            setContractEndDate({ date: activeContract.end_date, terminated: false });
          } else if (terminatedContract) {
            setContractEndDate({ date: terminatedContract.termination_date, terminated: true });
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

      // Terminated contract — show 3-day access message
      if (contractEndDate.terminated) {
        setCountdown("You can access this account only for 3 days");
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // normalize to start of day

      const end = new Date(contractEndDate.date);
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
    setSubmitConfirm(true);
  };

  const doSubmitReceipt = async () => {
    setSubmitConfirm(false);
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
    <div className="bg-[#FFF9F6] w-full min-h-screen font-sans text-[#330101] px-3 sm:px-5 md:px-6 py-4 sm:py-6 md:py-8">
      <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-5">
        {/* MAIN GRID */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-5">
          {/* LEFT CONTENT (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            {/* TOP STATS */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              <StatCard icon={<FaHome />}    label="Unit"        value={profile?.unitNumber ?? "---"}  color="text-[#D96648]"  bg="bg-[#FDF2ED]" />
              <StatCard icon={<FaUsers />}   label="Residents"   value={contractEndDate?.terminated ? "---" : (profile?.numberOfTenants ?? "---")} color="text-[#330101]" bg="bg-[#F5E6E0]" />
              <StatCard icon={<FaReceipt />} label="Active Bills" value={contractEndDate?.terminated ? "---" : Object.values(bills).filter((b) => b && b.status !== "Paid").length} color="text-amber-600" bg="bg-amber-50" />
            </div>

            {/* BILLS SECTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PaymentCard title="Monthly Rent" bill={bills.rent}
                onPay={() => setUploadModal({ isOpen: true, paymentId: bills.rent?.id || bills.rent?.ID, billName: "Rent" })} />
              <PaymentCard title="Utilities (Power & Water)" bill={bills.utilities}
                onPay={() => setUploadModal({ isOpen: true, paymentId: bills.utilities?.id || bills.utilities?.ID, billName: "Utilities" })}
                utilityBillFile={bills.utilities?.utility_bill_file}
                onViewBill={() => setUtilityBillUrl(bills.utilities?.utility_bill_file)} />
            </div>

            {/* CONTRACT COUNTDOWN */}
            <div className="bg-white px-4 sm:px-6 md:px-8 py-4 sm:py-5 rounded-2xl sm:rounded-3xl shadow-sm border border-[#F2DED4] flex items-center">
              <div className="flex items-center gap-3 sm:gap-4 w-full">
                <div className="p-3 sm:p-3.5 bg-[#FDF2ED] text-[#D96648] rounded-xl sm:rounded-2xl shrink-0">
                  <FaCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[#330101]/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5 sm:mb-1">
                    {contractEndDate?.terminated ? "Account Access Expires In" : "Contract Ends In"}
                  </p>
                  {contractEndDate?.terminated ? (
                    <h3 className="text-2xl sm:text-3xl font-black text-red-600">3 Days</h3>
                  ) : (
                    <h3 className={`text-sm sm:text-xl font-black truncate ${
                      countdown === "Expired" ? "text-red-500" :
                      countdown === "Ends today" ? "text-amber-500" :
                      "text-[#330101]"
                    }`}>{countdown}</h3>
                  )}
                  {contractEndDate?.date && !contractEndDate?.terminated && (
                    <p className="text-[9px] sm:text-[10px] text-[#330101]/40 mt-0.5">
                      End date: {new Date(contractEndDate.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Announcements (4 cols) */}
          <div className="lg:col-span-4 min-h-[300px] lg:h-auto lg:min-h-[320px]">
            <div className="bg-[#7a2e1a] rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-7 text-[#FFEDE1] shadow-xl flex flex-col relative overflow-hidden h-full" style={{ minHeight: "300px" }}>
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h2 className="flex items-center gap-2 font-bold text-sm sm:text-base">
                  <FaBullhorn className="text-[#f7b094]" /> Announcements
                </h2>
                <div className="flex gap-1">
                  <button onClick={() => handleCategorySwitch("prev")} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition bg-white/5">
                    <FaChevronLeft size={10} />
                  </button>
                  <button onClick={() => handleCategorySwitch("next")} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition bg-white/5">
                    <FaChevronRight size={10} />
                  </button>
                </div>
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold text-[#f7b094] uppercase tracking-[2px] mb-3 sm:mb-4 truncate">
                {currentCategory} Updates
              </p>
              <div className="space-y-2.5 sm:space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {currentMessages.length > 0 ? (
                  currentMessages.map((item) => (
                    <div key={item.id} onClick={() => handleAnnouncementClick(item.id)}
                      className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all group cursor-pointer hover:bg-white/10 active:scale-[0.98]">
                      <p className="text-xs sm:text-sm leading-relaxed mb-1.5 sm:mb-2 group-hover:text-white line-clamp-2">{item.message}</p>
                      <span className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase">{item.date}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 sm:py-12 text-white/20 text-xs sm:text-sm">No updates found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: UTILITY BILL VIEWER */}
      {utilityBillUrl && (
        <ModalPortal>
          <div className="fixed inset-0 bg-[#330101]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6"
            onClick={() => setUtilityBillUrl(null)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="bg-[#f7b094] h-1.5 sm:h-2 w-full shrink-0" />
              <div className="flex justify-between items-center px-5 sm:px-7 py-4 border-b border-[#F2DED4] shrink-0">
                <div className="flex items-center gap-2.5">
                  <FaFileInvoice className="text-[#D96648]" size={16} />
                  <h3 className="text-sm sm:text-base font-bold text-[#330101]">Utility Bill</h3>
                </div>
                <div className="flex items-center gap-2">
                  <a href={utilityBillUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-bold text-[#D96648] uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-[#FDF2ED] transition-colors">
                    <FaExternalLinkAlt size={10} /> Open
                  </a>
                  <button onClick={() => setUtilityBillUrl(null)}
                    className="text-[#330101]/40 hover:text-[#330101] p-1 rounded-full hover:bg-slate-100 transition-colors">
                    <FaTimes size={16} />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-4 sm:p-6 flex items-center justify-center bg-slate-50">
                {/\/image\/upload\//i.test(utilityBillUrl) || /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(utilityBillUrl) ? (
                  <img src={utilityBillUrl} alt="Utility Bill"
                    className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md" />
                ) : /\.pdf(\?|$)/i.test(utilityBillUrl) ? (
                  <iframe src={utilityBillUrl} title="Utility Bill"
                    className="w-full h-[65vh] rounded-xl border border-slate-200" />
                ) : (
                  <div className="flex flex-col items-center gap-4 py-10 text-center">
                    <div className="p-5 bg-[#FDF2ED] rounded-2xl">
                      <FaFileInvoice className="text-[#D96648] w-10 h-10" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#330101] mb-1">Utility Bill File</p>
                      <p className="text-xs text-[#330101]/50 mb-4">This file cannot be previewed directly.<br/>Click below to open it.</p>
                    </div>
                    <a href={utilityBillUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-[#330101] hover:bg-[#D96648] text-[#FFEDE1] text-xs font-bold rounded-xl transition-all uppercase tracking-widest shadow-md">
                      <FaExternalLinkAlt size={11} /> Open File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: CASH OR GCASH OPTION */}
      {uploadModal.isOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-[#330101]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-[#f7b094] h-1.5 sm:h-2 w-full"></div>
              <div className="p-5 sm:p-8">
                <div className="flex justify-between items-center mb-5 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-[#330101]">
                    Payment Method
                  </h3>
                  <button onClick={closeModal} className="text-[#330101]/40 hover:text-[#330101] p-1">
                    <FaTimes size={18} />
                  </button>
                </div>

                {!paymentMethod ? (
                  <div className="space-y-3 sm:space-y-4">
                    <button onClick={() => setPaymentMethod("Cash")}
                      className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border-2 border-[#F2DED4] hover:border-[#D96648] transition-all group">
                      <div className="p-2.5 sm:p-3 bg-[#FDF2ED] text-[#D96648] rounded-xl group-hover:bg-[#D96648] group-hover:text-white transition-colors">
                        <FaWallet className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm sm:text-base text-[#330101]">Cash Payment</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">Upload physical receipt</p>
                      </div>
                    </button>
                    <button onClick={() => setPaymentMethod("GCash")}
                      className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border-2 border-[#F2DED4] hover:border-[#D96648] transition-all group">
                      <div className="p-2.5 sm:p-3 bg-[#FDF2ED] text-[#D96648] rounded-xl group-hover:bg-[#D96648] group-hover:text-white transition-colors">
                        <FaMobileAlt className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm sm:text-base text-[#330101]">GCash Transfer</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">Reference No. required</p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-5 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-[#FFF9F6] border border-[#F2DED4] rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <FaReceipt className="text-[#D96648] shrink-0" />
                        <span className="text-[10px] sm:text-xs font-bold text-[#330101]/80 truncate max-w-[120px] sm:max-w-[150px]">
                          {selectedFile ? selectedFile.name : "No file selected"}
                        </span>
                      </div>
                      <button onClick={() => setPaymentMethod("")} className="text-[9px] sm:text-[10px] font-bold text-[#D96648] uppercase px-2 py-1 hover:bg-[#F2DED4]/50 rounded-md transition-colors">
                        Change
                      </button>
                    </div>

                    {/* File upload */}
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#F2DED4] hover:border-[#D96648] bg-slate-50/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 cursor-pointer transition-all">
                      <FaCloudUploadAlt className="text-[#D96648]" size={22} />
                      <span className="text-[10px] sm:text-xs font-bold text-[#330101]/60 text-center">
                        {selectedFile ? selectedFile.name : "Tap to upload receipt image"}
                      </span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
                    </label>

                    {paymentMethod === "GCash" && (
                      <div>
                        <label className="text-[9px] sm:text-[10px] font-bold text-[#330101]/50 uppercase tracking-widest mb-1.5 block">
                          GCash Reference No.
                        </label>
                        <input type="text"
                          className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-xl px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm focus:ring-2 focus:ring-[#f7b094] outline-none transition font-bold"
                          placeholder="Enter 13-digit number"
                          value={refNumber}
                          onChange={(e) => setRefNumber(e.target.value)}
                        />
                      </div>
                    )}

                    <button onClick={submitReceipt} disabled={isUploading}
                      className="w-full bg-[#330101] hover:bg-[#4d0707] text-[#FFEDE1] text-xs sm:text-sm font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg shadow-[#330101]/20 transition-all disabled:opacity-50 uppercase tracking-widest">
                      {isUploading ? "Processing..." : "Submit Payment"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: ANNOUNCEMENT DETAILS */}
      {announcementModal.isOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-[#330101]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col">
              <div className="bg-[#f7b094] h-1.5 sm:h-2 w-full shrink-0"></div>
              
              <div className="flex justify-between items-center px-5 sm:px-8 py-4 sm:py-6 border-b border-[#F2DED4] shrink-0">
                <h3 className="text-base sm:text-xl font-bold text-[#330101]">Announcement</h3>
                <button onClick={closeAnnouncementModal} className="text-[#330101]/40 hover:text-[#330101] p-1 bg-slate-50 rounded-full">
                  <FaTimes size={16} />
                </button>
              </div>

              <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar">
                {announcementModal.loading ? (
                  <div className="text-center py-8 sm:py-10">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-[#D96648] mx-auto"></div>
                    <p className="text-[10px] sm:text-xs text-[#330101]/60 mt-3 sm:mt-4 uppercase tracking-widest font-bold">Loading update...</p>
                  </div>
                ) : announcementModal.announcement ? (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-[#330101] mb-2 sm:mb-3 leading-snug">
                        {announcementModal.announcement.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-[#330101]/60">
                        <span className="bg-[#FFF9F6] border border-[#F2DED4] px-2 sm:px-3 py-1 rounded-md font-bold uppercase tracking-wider text-[#D96648]">
                          {announcementModal.announcement.category}
                        </span>
                        <span className="font-medium">
                          {new Date(announcementModal.announcement.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#FFF9F6] border border-[#F2DED4] rounded-xl sm:rounded-2xl p-4 sm:p-6">
                      <p className="text-xs sm:text-sm text-[#330101]/80 leading-relaxed whitespace-pre-wrap">
                        {announcementModal.announcement.message}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-10 text-xs sm:text-sm text-[#330101]/60">
                    Announcement not found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* CONFIRM: Submit Payment */}
      <GeneralConfirmationModal
        isOpen={submitConfirm}
        onClose={() => setSubmitConfirm(false)}
        onConfirm={doSubmitReceipt}
        variant="save"
        title="Submit Payment?"
        message={`Confirm submitting your ${uploadModal.billName} receipt via ${paymentMethod}?`}
        confirmText="Submit"
        loading={isUploading}
      />
    </div>
  );
}

// Sub-components - Heavily optimized for mobile scaling
function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white px-2.5 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 rounded-2xl sm:rounded-3xl shadow-sm border border-[#F2DED4] flex flex-col items-start gap-2 sm:gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className={`p-2 sm:p-2.5 md:p-3.5 ${bg} ${color} rounded-xl sm:rounded-2xl shrink-0`}>
        {React.cloneElement(icon, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" })}
      </div>
      <div className="min-w-0 w-full">
        <p className="text-[#330101]/40 text-[7px] sm:text-[8px] md:text-[9px] font-bold uppercase tracking-widest mb-0.5 truncate">
          {label}
        </p>
        <h3 className="text-sm sm:text-lg md:text-2xl font-black text-[#330101] leading-none truncate">{value}</h3>
      </div>
    </div>
  );
}

function PaymentCard({ title, bill, onPay, utilityBillFile, onViewBill }) {
  const getStatusStyles = (status) => {
    switch (status) {
      case "Paid":                  return { bg: "#DCFCE7", text: "#22C55E", label: "PAID" };
      case "Pending Verification":  return { bg: "#FEF3C7", text: "#F59E0B", label: "VERIFYING" }; // Shortened for mobile
      case "Unpaid":                return { bg: "#FEE2E2", text: "#EF4444", label: "UNPAID" };
      case "Overdue":               return { bg: "#FEE2E2", text: "#DC2626", label: "OVERDUE" };
      default:                      return { bg: "#F3F4F6", text: "#6B7280", label: "NO INVOICE" };
    }
  };

  const style = getStatusStyles(bill?.status);
  const isPaid = bill?.status === "Paid" || bill?.status === "Pending Verification";

  return (
    <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-[2rem] shadow-sm border border-[#F2DED4] flex flex-col justify-between h-full group hover:border-[#f7b094] transition-all">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3 sm:mb-5">
          <p className="text-[#330101]/50 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-tight">{title}</p>
          <span className="text-[8px] sm:text-[9px] font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md uppercase tracking-widest whitespace-nowrap"
            style={{ backgroundColor: style.bg, color: style.text }}>
            {style.label}
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-[#330101] tracking-tight">
          <span className="text-base sm:text-lg font-medium text-[#330101]/30 mr-1 sm:mr-1.5">₱</span>
          {bill?.status === "Paid"
            ? "0.00"
            : bill?.amount
              ? parseFloat(bill.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })
              : "0.00"}
        </h2>
      </div>

      <div className="mt-5 sm:mt-7">
        {!isPaid ? (
          <button
            onClick={onPay}
            disabled={!bill}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-[#330101] hover:bg-[#D96648] text-[#FFEDE1] text-[10px] sm:text-xs font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl cursor-pointer transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest active:scale-[0.98]"
          >
            <FaWallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Upload Receipt
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 bg-[#F5E6E0] text-[#330101]/50 text-[10px] sm:text-xs font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border border-dashed border-[#330101]/10 uppercase tracking-widest">
            {bill?.status === "Paid" ? "Paid for this month" : "Verifying..."}
          </div>
        )}

        {/* View Utility Bill button — only on utilities card, only when a file exists and bill is not paid */}
        {onViewBill && utilityBillFile && bill?.status !== "Paid" && (
          <button
            onClick={onViewBill}
            className="mt-2.5 w-full flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-[#F2DED4] text-[#D96648] hover:bg-[#FDF2ED] transition-all uppercase tracking-widest active:scale-[0.98]"
          >
            <FaFileInvoice className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            View Utility Bill
          </button>
        )}
      </div>
    </div>
  );
}