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
  const [modalOpen, setModalOpen] = useState(false);
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

  const handleSubmit = async () => {
    if (!messageTitle.trim() || !message.trim()) return alert("Fill in all fields.");
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
      setModalOpen(true);
    } catch {
      alert("Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FFF9F6] min-h-screen w-full px-4 sm:px-6 md:px-10 py-6 md:py-10 text-[#330101]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* FORM SECTION */}
          <div className="lg:col-span-5 order-1">
            <div className="bg-white p-6 sm:p-7 rounded-4xl shadow-sm border border-[#F2DED4] lg:sticky lg:top-6">
              <div className="flex items-center gap-3 mb-7">
                <div className="p-2.5 bg-[#FDF2ED] text-[#D96648] rounded-xl">
                  <FaWrench size={16} />
                </div>
                <h2 className="text-base font-black uppercase tracking-widest text-[#330101]">
                  Report a Concern
                </h2>
              </div>

              <div className="space-y-5">
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#330101]/40">
                    Category
                  </label>
                  <select
                    className="w-full appearance-none bg-[#FFF9F6] border border-[#F2DED4] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition cursor-pointer"
                    value={selectedConcern}
                    onChange={(e) => setSelectedConcern(e.target.value)}
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#330101]/40">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition placeholder:opacity-30"
                    placeholder="e.g. Living room light flickering"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#330101]/40">
                    Description
                  </label>
                  <textarea
                    className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition resize-none min-h-[130px] placeholder:opacity-30"
                    placeholder="Describe the issue so our team can prepare..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <button
                  className="w-full bg-[#5c1f10] text-[#FFEDE1] font-bold py-4 rounded-2xl hover:bg-[#7a2e1a] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  <FaHammer /> {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>

          {/* HISTORY SECTION */}
          <div className="lg:col-span-7 order-2">
            <div className="bg-[#7a2e1a] p-5 sm:p-6 md:p-8 rounded-4xl shadow-xl">
              <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-3">
                  <FaHistory className="text-[#f7b094]" size={18} />
                  <h2 className="text-base font-black text-[#FFEDE1] uppercase tracking-widest">
                    Request History
                  </h2>
                </div>
                <span className="text-[10px] font-black text-[#f7b094] border border-[#f7b094]/30 bg-[#f7b094]/10 px-3 py-1.5 rounded-full uppercase tracking-widest">
                  {maintenanceRequests.length} Total
                </span>
              </div>

              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f7b094]" />
                  </div>
                ) : maintenanceRequests.length === 0 ? (
                  <div className="text-center py-24 text-white/20 text-sm italic">
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
                        className="bg-white/8 border border-white/10 rounded-2xl p-5 hover:bg-white/12 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="space-y-2 flex-1 min-w-0">
                            {/* Status + Category row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1"
                                style={{ backgroundColor: style.bg, color: style.text }}
                              >
                                {style.icon} {style.label}
                              </span>
                              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                {item.category}
                              </span>
                            </div>

                            <h3 className="text-[#FFEDE1] font-bold text-base leading-snug">
                              {item.title}
                            </h3>
                            <p className="text-white/40 text-xs line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          {/* Right side */}
                          <div className="flex flex-col items-end gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest mb-0.5">
                                Requested
                              </p>
                              <p className="text-white/80 font-bold text-sm">
                                {formatDate(item.requestedDate)}
                              </p>
                            </div>
                            <button
                              disabled={isCompleted || item.status === "In Progress" || isFollowedUp || item.followedUp || followingUpId === item.id}
                              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                isCompleted || item.status === "In Progress" || isFollowedUp || item.followedUp
                                  ? "bg-white/5 text-white/20 cursor-not-allowed"
                                  : "bg-[#f7b094] text-[#330101] hover:scale-105 active:scale-95 shadow-md"
                              }`}
                              onClick={async () => {
                                if (!item.id) return;
                                setFollowingUpId(item.id);
                                try {
                                  await followUpMaintenanceRequest(item.id);
                                  setFollowedUp([...followedUp, item.id]);
                                  await loadMaintenanceHistory(true);
                                } catch {
                                  // silently fail — already followed up
                                  setFollowedUp([...followedUp, item.id]);
                                } finally {
                                  setFollowingUpId(null);
                                }
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
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#330101]/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-4xl p-10 shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#D96648]" />
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl shadow-sm">
              <FaCheckCircle />
            </div>
            <h3 className="text-xl font-black text-[#330101] mb-2 uppercase tracking-tight">
              Request Submitted
            </h3>
            <p className="text-[#330101]/50 text-sm mb-8 leading-relaxed">
              We've notified the building manager. Expect a response or schedule update shortly.
            </p>
            <button
              className="w-full bg-[#5c1f10] text-[#FFEDE1] py-4 rounded-2xl font-bold hover:bg-[#7a2e1a] transition-all uppercase tracking-widest text-xs"
              onClick={() => setModalOpen(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaintenanceCards;
