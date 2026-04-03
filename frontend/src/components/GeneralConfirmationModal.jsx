import { useEffect, useRef } from "react";
import {
  FaTrashAlt, FaCheckCircle, FaTimesCircle,
  FaArchive, FaSignOutAlt, FaSave, FaExclamationTriangle, FaQuestionCircle,
} from "react-icons/fa";
import ModalPortal from "./ModalPortal";

const VARIANT_CONFIG = {
  delete: {
    icon: <FaTrashAlt size={20} />,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    confirmBg: "bg-red-500 hover:bg-red-600 focus:ring-red-500",
    defaultTitle: "Confirm Delete",
    defaultConfirm: "Delete",
  },
  approve: {
    icon: <FaCheckCircle size={20} />,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    confirmBg: "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500",
    defaultTitle: "Confirm Approval",
    defaultConfirm: "Approve",
  },
  reject: {
    icon: <FaTimesCircle size={20} />,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    confirmBg: "bg-red-500 hover:bg-red-600 focus:ring-red-500",
    defaultTitle: "Confirm Rejection",
    defaultConfirm: "Reject",
  },
  archive: {
    icon: <FaArchive size={20} />,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    confirmBg: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500",
    defaultTitle: "Confirm Archive",
    defaultConfirm: "Archive",
  },
  logout: {
    icon: <FaSignOutAlt size={20} />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    confirmBg: "bg-slate-700 hover:bg-slate-800 focus:ring-slate-700",
    defaultTitle: "Log Out",
    defaultConfirm: "Log Out",
  },
  save: {
    icon: <FaSave size={20} />,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    confirmBg: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500",
    defaultTitle: "Save Changes",
    defaultConfirm: "Save",
  },
  warning: {
    icon: <FaExclamationTriangle size={20} />,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    confirmBg: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500",
    defaultTitle: "Are you sure?",
    defaultConfirm: "Confirm",
  },
  other: {
    icon: <FaQuestionCircle size={20} />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    confirmBg: "bg-slate-600 hover:bg-slate-700 focus:ring-slate-600",
    defaultTitle: "Confirm Action",
    defaultConfirm: "Confirm",
  },
};

export default function GeneralConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = "Cancel",
  variant = "warning",
  loading = false,
}) {
  const cfg = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.warning;
  const cancelButtonRef = useRef(null);

  // Handle Escape key & Auto-focus
  useEffect(() => {
    if (!isOpen) return;
    
    // Auto-focus cancel button for safety so users don't accidentally press Enter
    if (cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }

    const handler = (e) => { 
      if (e.key === "Escape" && !loading) onClose(); 
    };
    
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
        onClick={(e) => { 
          // Prevent closing if clicking background during a loading state
          if (e.target === e.currentTarget && !loading) onClose(); 
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 sm:p-7 animate-in zoom-in-95 duration-200 border border-slate-100">
          
          {/* Icon */}
          <div className={`w-14 h-14 rounded-full ${cfg.iconBg} flex items-center justify-center mb-5 mx-auto sm:mx-0 shadow-sm`}>
            <span className={cfg.iconColor}>{cfg.icon}</span>
          </div>

          {/* Title */}
          <h3 id="modal-title" className="text-lg sm:text-xl font-black text-slate-900 mb-2 text-center sm:text-left">
            {title || cfg.defaultTitle}
          </h3>

          {/* Message */}
          {message && (
            <p id="modal-message" className="text-sm text-slate-500 mb-6 leading-relaxed text-center sm:text-left">
              {message}
            </p>
          )}

          {/* Actions (Stacks vertically on mobile, side-by-side on desktop) */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-2">
            <button
              ref={cancelButtonRef}
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-1 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 px-4 rounded-xl text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-[0.98] transition-all shadow-sm disabled:opacity-80 disabled:cursor-not-allowed flex justify-center items-center ${cfg.confirmBg}`}
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : (confirmText || cfg.defaultConfirm)}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}