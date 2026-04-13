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
    iconBg: "bg-orange-50",
    iconColor: "text-[#db6747]",
    confirmBg: "bg-[#db6747] hover:bg-[#c45a3a] focus:ring-[#db6747]",
    defaultTitle: "Confirm Archive",
    defaultConfirm: "Archive",
  },
  logout: {
    icon: <FaSignOutAlt size={20} />,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    confirmBg: "bg-red-500 hover:bg-red-600 focus:ring-red-500",
    defaultTitle: "Log Out",
    defaultConfirm: "Log Out",
  },
  save: {
    icon: <FaSave size={20} />,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    confirmBg: "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500",
    defaultTitle: "Save Changes",
    defaultConfirm: "Save",
  },
  warning: {
    icon: <FaExclamationTriangle size={20} />,
    iconBg: "bg-orange-50",
    iconColor: "text-[#db6747]",
    confirmBg: "bg-[#db6747] hover:bg-[#c45a3a] focus:ring-[#db6747]",
    defaultTitle: "Are you sure?",
    defaultConfirm: "Confirm",
  },
  other: {
    icon: <FaQuestionCircle size={20} />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    confirmBg: "bg-[#db6747] hover:bg-[#c45a3a] focus:ring-[#db6747]",
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

  useEffect(() => {
    if (!isOpen) return;
    if (cancelButtonRef.current) cancelButtonRef.current.focus();

    const handler = (e) => { if (e.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && !loading) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-8 animate-in zoom-in-95 duration-200 border border-slate-100">
          <div className={`w-16 h-16 rounded-2xl ${cfg.iconBg} flex items-center justify-center mb-6 mx-auto sm:mx-0 shadow-sm border border-slate-50`}>
            <span className={cfg.iconColor}>{cfg.icon}</span>
          </div>

          <h3 id="modal-title" className="text-xl sm:text-2xl font-black text-slate-900 mb-2 text-center sm:text-left tracking-tight">
            {title || cfg.defaultTitle}
          </h3>

          {message && (
            <p id="modal-message" className="text-sm font-medium text-slate-500 mb-8 leading-relaxed text-center sm:text-left">
              {message}
            </p>
          )}

          {/* Responsive buttons: vertical on mobile, horizontal on desktop */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-2">
            <button
              ref={cancelButtonRef}
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 active:scale-[0.96] transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-3 px-4 rounded-xl text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.96] transition-all shadow-lg shadow-black/5 disabled:opacity-80 flex justify-center items-center ${cfg.confirmBg}`}
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