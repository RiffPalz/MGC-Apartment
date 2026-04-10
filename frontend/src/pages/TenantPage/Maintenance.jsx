import { useState, useEffect } from "react";
import {
  FaWrench,
  FaHammer,
  FaHistory,
  FaCheckCircle,
  FaClock,
  FaChevronDown,
} from "react-icons/fa";

import { useSocket } from "../../context/SocketContext";
import {
  submitMaintenanceRequest,
  fetchMyMaintenanceHistory,
  followUpMaintenanceRequest,
  editMaintenanceRequest,
} from "../../api/tenantAPI/maintenanceAPI";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

const CATEGORIES = [
  "Electrical Maintenance",
  "Water Interruptions",
  "Floor Renovation",
  "Other",
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
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, payload: null });
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 4;
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [editError, setEditError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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
      setHistoryPage(1);
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
        return { bg: "#ECFDF5", text: "#059669", label: "Approved", icon: <FaCheckCircle /> };
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
    if (!messageTitle.trim()) return alert("Title is required.");
    setConfirmModal({ isOpen: true, type: "submit", payload: null });
  };

  const doSubmit = async () => {
    setConfirmModal({ isOpen: false, type: null, payload: null });
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

  const handleFollowUp = (item) => {
    setConfirmModal({ isOpen: true, type: "followup", payload: item });
  };

  const handleEditOpen = (item) => {
    setEditingId(item.id);
    setEditDraft({ category: item.category, title: item.title, description: item.description ?? "" });
    setEditError(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditDraft({});
    setEditError(null);
  };

  const handleEditSave = () => {
    if (!editDraft.title || editDraft.title.trim() === "") {
      setEditError("Title is required.");
      return;
    }
    setConfirmModal({ isOpen: true, type: "edit", payload: null });
  };

  const doEditSave = async () => {
    setConfirmModal({ isOpen: false, type: null, payload: null });
    setIsSaving(true);
    setEditError(null);
    try {
      await editMaintenanceRequest(editingId, editDraft);
      setEditingId(null);
      loadMaintenanceHistory(true);
    } catch (error) {
      setEditError(error.response?.data?.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const doFollowUp = async (item) => {
    setConfirmModal({ isOpen: false, type: null, payload: null });
    if (!item.id) return;
    setFollowingUpId(item.id);
    try {
      await followUpMaintenanceRequest(item.id);
      setFollowedUp((prev) => [...prev, item.id]);
      await loadMaintenanceHistory(true);
    } catch {
      setFollowedUp((prev) => [...prev, item.id]);
    } finally {
      setFollowingUpId(null);
    }
  };

  return (
    <div className="bg-[#FFF9F6] w-full min-h-screen px-3 sm:px-5 md:px-8 xl:px-12 py-5 md:py-8 text-[#330101]">
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">

          {/* FORM SECTION */}
          <div className="lg:col-span-5 order-1">
            <div className="bg-white p-5 sm:p-6 md:p-7 rounded-4xl shadow-sm border border-[#F2DED4]">
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
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-[#FFF9F6] border border-[#F2DED4] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition cursor-pointer pr-12"
                      value={selectedConcern}
                      onChange={(e) => setSelectedConcern(e.target.value)}
                    >
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#D96648]" size={13} />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#330101]/40">
                    Title <span className="text-[#D96648]">*</span>
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
                    Description <span className="normal-case tracking-normal font-normal text-[#330101]/30">(optional)</span>
                  </label>
                  <textarea
                    className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition resize-none min-h-[130px] placeholder:opacity-30"
                    placeholder="Describe the issue so our team can prepare..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <button
                  className="w-full bg-[#5c1f10] text-[#FFEDE1] font-bold py-4 rounded-2xl hover:bg-[#7a2e1a] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50 mt-auto"
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
            <div className="bg-[#7a2e1a] p-4 sm:p-6 md:p-8 rounded-4xl shadow-xl">
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
                  <>
                  {maintenanceRequests
                    .slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE)
                    .map((item, index) => {
                    const style = getStatusStyle(item.status);
                    const isCompleted = item.status === "Done";
                    const isFollowedUp = followedUp.includes(item.id) || item.followedUp;

                    return (
                      <div
                        key={item.id || index}
                        className="bg-white/8 border border-white/10 rounded-2xl p-4 sm:p-5 hover:bg-white/12 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
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
                          <div className="flex sm:flex-col flex-row items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest mb-0.5">
                                Requested
                              </p>
                              <p className="text-white/80 font-bold text-sm">
                                {formatDate(item.requestedDate)}
                              </p>
                            </div>
                            {item.status === "Pending" && (
                              <button
                                className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-[#f7b094] text-[#330101] hover:scale-105 active:scale-95 shadow-md"
                                onClick={() => handleEditOpen(item)}
                              >
                                Edit
                              </button>
                            )}
                            <button
                              disabled={isCompleted || isFollowedUp || item.followedUp || followingUpId === item.id}
                              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                isCompleted || isFollowedUp || item.followedUp
                                  ? "bg-white/5 text-white/20 cursor-not-allowed"
                                  : "bg-[#f7b094] text-[#330101] hover:scale-105 active:scale-95 shadow-md"
                              }`}
                              onClick={() => handleFollowUp(item)}
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
                        {editingId === item.id && (
                          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                            {/* Category */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-widest text-white/40">Category</label>
                              <div className="relative">
                                <select
                                  className="w-full appearance-none bg-[#5c2a1a] border border-white/20 rounded-xl px-4 py-3 text-sm font-bold text-[#FFEDE1] focus:ring-2 focus:ring-[#f7b094] outline-none transition cursor-pointer pr-10"
                                  value={editDraft.category}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))}
                                >
                                  {CATEGORIES.map((c) => <option key={c} value={c} className="bg-white text-[#330101]">{c}</option>)}
                                </select>
                                <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#f7b094]" size={11} />
                              </div>
                            </div>
                            {/* Title */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-widest text-white/40">Title <span className="text-[#f7b094]">*</span></label>
                              <input
                                type="text"
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm font-bold text-[#FFEDE1] focus:ring-2 focus:ring-[#f7b094] outline-none transition placeholder:opacity-30"
                                value={editDraft.title}
                                onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                                placeholder="Request title"
                              />
                            </div>
                            {/* Description */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-widest text-white/40">Description <span className="normal-case tracking-normal font-normal text-white/20">(optional)</span></label>
                              <textarea
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm font-bold text-[#FFEDE1] focus:ring-2 focus:ring-[#f7b094] outline-none transition resize-none min-h-[80px] placeholder:opacity-30"
                                value={editDraft.description}
                                onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                                placeholder="Describe the issue..."
                              />
                            </div>
                            {/* Error */}
                            {editError && (
                              <p className="text-[#f7b094] text-xs font-bold">{editError}</p>
                            )}
                            {/* Actions */}
                            <div className="flex gap-2 justify-end">
                              <button
                                className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/60 hover:bg-white/20 transition-all"
                                onClick={handleEditCancel}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#f7b094] text-[#330101] hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                onClick={handleEditSave}
                                disabled={isSaving}
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {maintenanceRequests.length > HISTORY_PAGE_SIZE && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                        {(historyPage - 1) * HISTORY_PAGE_SIZE + 1}–{Math.min(historyPage * HISTORY_PAGE_SIZE, maintenanceRequests.length)} of {maintenanceRequests.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                          disabled={historyPage === 1}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-white/15 hover:text-white disabled:opacity-30 transition-all text-xs font-bold"
                        >
                          ‹
                        </button>
                        {Array.from({ length: Math.ceil(maintenanceRequests.length / HISTORY_PAGE_SIZE) }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            onClick={() => setHistoryPage(p)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                              historyPage === p
                                ? "bg-[#f7b094] text-[#330101]"
                                : "bg-white/5 text-white/50 hover:bg-white/15 hover:text-white"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          onClick={() => setHistoryPage((p) => Math.min(Math.ceil(maintenanceRequests.length / HISTORY_PAGE_SIZE), p + 1))}
                          disabled={historyPage === Math.ceil(maintenanceRequests.length / HISTORY_PAGE_SIZE)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-white/15 hover:text-white disabled:opacity-30 transition-all text-xs font-bold"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  )}
                  </>
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

      {/* CONFIRM: Submit Request */}
      <GeneralConfirmationModal
        isOpen={confirmModal.isOpen && confirmModal.type === "submit"}
        onClose={() => setConfirmModal({ isOpen: false, type: null, payload: null })}
        onConfirm={doSubmit}
        variant="warning"
        title="Submit Request?"
        message="Are you sure you want to submit this maintenance request?"
        confirmText="Submit"
        loading={isSubmitting}
      />

      {/* CONFIRM: Follow Up */}
      <GeneralConfirmationModal
        isOpen={confirmModal.isOpen && confirmModal.type === "followup"}
        onClose={() => setConfirmModal({ isOpen: false, type: null, payload: null })}
        onConfirm={() => doFollowUp(confirmModal.payload)}
        variant="warning"
        title="Send Follow-Up?"
        message="This will notify the building manager to follow up on your request."
        confirmText="Send"
      />

      {/* CONFIRM: Edit Request */}
      <GeneralConfirmationModal
        isOpen={confirmModal.isOpen && confirmModal.type === "edit"}
        onClose={() => setConfirmModal({ isOpen: false, type: null, payload: null })}
        onConfirm={doEditSave}
        variant="warning"
        title="Save Changes?"
        message="Are you sure you want to update this maintenance request?"
        confirmText="Save"
        loading={isSaving}
      />
    </div>
  );
}

export default MaintenanceCards;