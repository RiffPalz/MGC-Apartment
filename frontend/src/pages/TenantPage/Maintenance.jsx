import { useState, useEffect } from "react";
import {
  FaWrench,
  FaHammer,
  FaHistory,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";

import { useSocket } from "../../context/SocketContext";
import {
  submitMaintenanceRequest,
  fetchMyMaintenanceHistory,
  followUpMaintenanceRequest,
} from "../../api/tenantAPI/maintenanceAPI";

// IMPORT YOUR NEW MODAL (Adjust the path if needed!)
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";
import ModalPortal from "../../components/ModalPortal";

const CATEGORIES = [
  "Electrical Maintenance",
  "Water Interruptions",
  "Floor Renovation",
  "Others",
];

function MaintenanceCards() {
  const socket = useSocket();

  const [selectedConcern, setSelectedConcern] = useState(CATEGORIES[0]);
  const [messageTitle, setMessageTitle] = useState("");
  const [message, setMessage] = useState("");
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  
  // Confirmation Modal States
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [followUpConfirmId, setFollowUpConfirmId] = useState(null);

  const [followedUp, setFollowedUp] = useState([]);
  const [followingUpId, setFollowingUpId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadMaintenanceHistory(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => loadMaintenanceHistory(true);
    socket.on("maintenance_updated", handleUpdate);
    return () => socket.off("maintenance_updated", handleUpdate);
  }, [socket]);

  const loadMaintenanceHistory = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await fetchMyMaintenanceHistory();
      setMaintenanceRequests(data.requests || []);
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Done":
        return { bg: "#DCFCE7", text: "#16A34A", label: "Done", icon: <FaCheckCircle /> };
      case "In Progress":
        return { bg: "#EEF2FF", text: "#4F46E5", label: "In Progress", icon: <FaClock /> };
      case "Approved":
        return { bg: "#D1FAE5", text: "#059669", label: "Approved", icon: <FaCheckCircle /> };
      default:
        return { bg: "#FEF3C7", text: "#D97706", label: "Pending", icon: <FaClock /> };
    }
  };

  const formatDate = (date) => {
    if (!date || date === "Ongoing") return "TBD";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const handlePreSubmit = () => {
    if (!messageTitle.trim()) {
      return alert("Please fill in the title.");
    }
    setSubmitConfirmOpen(true);
  };


  const executeSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitMaintenanceRequest({
        category: selectedConcern,
        title: messageTitle,
        description: message,
      });
      setMessageTitle("");
      setMessage("");
      setSelectedConcern(CATEGORIES[0]);
      loadMaintenanceHistory(true);
      
      setSubmitConfirmOpen(false); // Close confirmation
      setSuccessModalOpen(true);   // Open success receipt
    } catch {
      alert("Submission failed. Please try again.");
      setSubmitConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const executeFollowUp = async () => {
    if (!followUpConfirmId) return;
    setFollowingUpId(followUpConfirmId);
    
    try {
      await followUpMaintenanceRequest(followUpConfirmId);
      setFollowedUp([...followedUp, followUpConfirmId]);
      await loadMaintenanceHistory(true);
    } catch {
      setFollowedUp([...followedUp, followUpConfirmId]);
    } finally {
      setFollowingUpId(null);
      setFollowUpConfirmId(null); // Close confirmation
    }
  };

  return (
    <div className="bg-[#FFF9F6] min-h-screen w-full px-4 sm:px-6 md:px-10 2xl:px-14 py-6 md:py-10 2xl:py-14 text-[#330101]">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 2xl:gap-10">

          {/* FORM SECTION */}
          <div className="lg:col-span-5 2xl:col-span-4 order-1">
            <div className="bg-white p-5 sm:p-7 2xl:p-8 rounded-3xl sm:rounded-4xl shadow-sm border border-[#F2DED4] lg:sticky lg:top-6 2xl:top-10">
              <div className="flex items-center gap-3 mb-6 sm:mb-7 2xl:mb-8">
                <div className="p-2.5 2xl:p-3 bg-[#FDF2ED] text-[#D96648] rounded-xl shrink-0">
                  <FaWrench size={16} className="2xl:w-5 2xl:h-5" />
                </div>
                <h2 className="text-sm sm:text-base 2xl:text-lg font-black uppercase tracking-widest text-[#330101] truncate">
                  Report a Concern
                </h2>
              </div>

              <div className="space-y-4 sm:space-y-5 2xl:space-y-6">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[9px] sm:text-[10px] 2xl:text-xs font-bold uppercase tracking-widest text-[#330101]/50">
                    Category
                  </label>
                  <select
                    className="w-full appearance-none bg-[#FFF9F6] border border-[#F2DED4] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 2xl:py-5 text-xs sm:text-sm 2xl:text-base font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition cursor-pointer"
                    value={selectedConcern}
                    onChange={(e) => setSelectedConcern(e.target.value)}
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[9px] sm:text-[10px] 2xl:text-xs font-bold uppercase tracking-widest text-[#330101]/50">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 2xl:py-5 text-xs sm:text-sm 2xl:text-base font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition placeholder:opacity-30"
                    placeholder="e.g. Living room light flickering"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[9px] sm:text-[10px] 2xl:text-xs font-bold uppercase tracking-widest text-[#330101]/50">
                    Description
                  </label>
                  <textarea
                    className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 2xl:py-5 text-xs sm:text-sm 2xl:text-base font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition resize-none min-h-[120px] sm:min-h-[130px] 2xl:min-h-40 placeholder:opacity-30"
                    placeholder="Describe the issue so our team can prepare..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {/* Submit Trigger - Now opens confirmation modal */}
                <button
                  className="w-full bg-[#5c1f10] text-[#FFEDE1] font-bold py-3.5 sm:py-4 2xl:py-5 rounded-xl sm:rounded-2xl hover:bg-[#7a2e1a] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] sm:text-xs 2xl:text-sm mt-2"
                  onClick={handlePreSubmit}
                >
                  <FaHammer className="2xl:w-4 2xl:h-4" /> Submit Request
                </button>
              </div>
            </div>
          </div>

          {/* HISTORY SECTION */}
          <div className="lg:col-span-7 2xl:col-span-8 order-2">
            <div className="bg-[#7a2e1a] p-4 sm:p-6 md:p-8 2xl:p-10 rounded-3xl sm:rounded-4xl shadow-xl h-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-7 2xl:mb-9">
                <div className="flex items-center gap-3">
                  <FaHistory className="text-[#f7b094] shrink-0 2xl:w-5 2xl:h-5" size={18} />
                  <h2 className="text-sm sm:text-base 2xl:text-lg font-black text-[#FFEDE1] uppercase tracking-widest truncate">
                    Request History
                  </h2>
                </div>
                <span className="self-start sm:self-auto text-[9px] sm:text-[10px] 2xl:text-xs font-black text-[#f7b094] border border-[#f7b094]/30 bg-[#f7b094]/10 px-3 py-1.5 2xl:px-4 2xl:py-2 rounded-full uppercase tracking-widest whitespace-nowrap">
                  {maintenanceRequests.length} Total
                </span>
              </div>

              <div className="space-y-3 sm:space-y-4 2xl:space-y-5">
                {isLoading ? (
                  <div className="animate-pulse space-y-3 sm:space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-3">
                        <div className="flex justify-between">
                          <div className="h-5 w-20 bg-white/10 rounded-full" />
                          <div className="h-4 w-24 bg-white/10 rounded" />
                        </div>
                        <div className="h-5 w-48 bg-white/10 rounded" />
                        <div className="h-4 w-full bg-white/5 rounded" />
                        <div className="h-4 w-3/4 bg-white/5 rounded" />
                      </div>
                    ))}
                  </div>
                ) : maintenanceRequests.length === 0 ? (
                  <div className="text-center py-20 text-white/20 text-xs sm:text-sm italic">
                    No maintenance requests yet.
                  </div>
                ) : (
                  maintenanceRequests.map((item, index) => {
                    const style = getStatusStyle(item.status);
                    const isCompleted = item.status === "Done";
                    const isFollowedUp = followedUp.includes(item.id) || item.followedUp;

                    return (
                      <div
                        key={item.id || index}
                        className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 2xl:p-6 hover:bg-white/10 transition-all group flex flex-col gap-3 sm:gap-4"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div className="flex flex-wrap items-center gap-2 2xl:gap-3">
                            <span
                              className="text-[8px] sm:text-[9px] 2xl:text-[10px] font-black px-2.5 py-1 2xl:px-3 2xl:py-1.5 rounded-full uppercase flex items-center gap-1.5 shadow-sm"
                              style={{ backgroundColor: style.bg, color: style.text }}
                            >
                              {style.icon} {style.label}
                            </span>
                            <span className="text-[9px] sm:text-[10px] 2xl:text-xs text-white/50 font-bold uppercase tracking-widest">
                              {item.category}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] sm:text-[9px] 2xl:text-[10px] text-white/30 uppercase font-bold tracking-widest mb-0.5">
                              Requested
                            </p>
                            <p className="text-white/90 font-bold text-xs sm:text-sm 2xl:text-base">
                              {formatDate(item.requestedDate)}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-[#FFEDE1] font-bold text-sm sm:text-base 2xl:text-lg leading-snug mb-1 2xl:mb-2">
                            {item.title}
                          </h3>
                          <p className="text-white/40 text-[11px] sm:text-xs 2xl:text-sm line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex justify-start sm:justify-end mt-1 sm:mt-0">
                          {/* Follow Up Trigger - Now opens confirmation modal */}
                          <button
                            disabled={isCompleted || item.status === "In Progress" || isFollowedUp || item.followedUp || followingUpId === item.id}
                            className={`w-full sm:w-auto px-5 py-2.5 sm:py-2 2xl:px-6 2xl:py-2.5 rounded-xl text-[9px] sm:text-[10px] 2xl:text-xs font-black uppercase tracking-widest transition-all ${
                              isCompleted || item.status === "In Progress" || isFollowedUp || item.followedUp
                                ? "bg-white/5 text-white/30 cursor-not-allowed"
                                : "bg-[#f7b094] text-[#330101] hover:scale-105 active:scale-[0.98] shadow-md"
                            }`}
                            onClick={() => {
                              if (!item.id) return;
                              setFollowUpConfirmId(item.id);
                            }}
                          >
                            {isCompleted
                              ? "Completed"
                              : (isFollowedUp || item.followedUp)
                                ? "Notified ✓"
                                : followingUpId === item.id
                                  ? "Sending..."
                                  : "Follow Up"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONFIRMATION MODALS --- */}
      <GeneralConfirmationModal
        isOpen={submitConfirmOpen}
        onClose={() => setSubmitConfirmOpen(false)}
        onConfirm={executeSubmit}
        variant="save"
        title="Submit Request?"
        message={`Are you sure you want to report this issue for "${selectedConcern}"?`}
        confirmText="Yes, Submit"
        cancelText="Cancel"
        loading={isSubmitting}
      />

      <GeneralConfirmationModal
        isOpen={!!followUpConfirmId}
        onClose={() => setFollowUpConfirmId(null)}
        onConfirm={executeFollowUp}
        variant="warning"
        title="Follow Up on Request?"
        message="This will notify the building manager again about this issue. Do you want to proceed?"
        confirmText="Yes, Notify"
        cancelText="Cancel"
        loading={followingUpId === followUpConfirmId}
      />

      {/* --- ORIGINAL SUCCESS MODAL (RECEIPT) --- */}
      {successModalOpen && (
        <ModalPortal>
        <div className="fixed inset-0 bg-[#330101]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-10 shadow-2xl max-w-sm w-full text-center relative overflow-hidden animate-in zoom-in-95">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#D96648]" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 text-xl sm:text-2xl shadow-sm">
              <FaCheckCircle />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#330101] mb-2 uppercase tracking-tight">
              Request Submitted
            </h3>
            <p className="text-[#330101]/50 text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed px-2">
              We've notified the building manager. Expect a response or schedule update shortly.
            </p>
            <button
              className="w-full bg-[#5c1f10] text-[#FFEDE1] py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:bg-[#7a2e1a] transition-all uppercase tracking-widest text-[10px] sm:text-xs active:scale-[0.98]"
              onClick={() => setSuccessModalOpen(false)}
            >
              Got it
            </button>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}

export default MaintenanceCards;