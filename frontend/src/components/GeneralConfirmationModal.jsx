import { useEffect } from "react";
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
    confirmBg: "bg-red-500 hover:bg-red-600",
    defaultTitle: "Confirm Delete",
    defaultConfirm: "Delete",
  },
  approve: {
    icon: <FaCheckCircle size={20} />,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    confirmBg: "bg-emerald-500 hover:bg-emerald-600",
    defaultTitle: "Confirm Approval",
    defaultConfirm: "Approve",
  },
  reject: {
    icon: <FaTimesCircle size={20} />,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    confirmBg: "bg-red-500 hover:bg-red-600",
    defaultTitle: "Confirm Rejection",
    defaultConfirm: "Reject",
  },
  archive: {
    icon: <FaArchive size={20} />,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    confirmBg: "bg-amber-500 hover:bg-amber-600",
    defaultTitle: "Confirm Archive",
    defaultConfirm: "Archive",
  },
  logout: {
    icon: <FaSignOutAlt size={20} />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    confirmBg: "bg-slate-700 hover:bg-slate-800",
    defaultTitle: "Log Out",
    defaultConfirm: "Log Out",
  },
  save: {
    icon: <FaSave size={20} />,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    confirmBg: "bg-blue-500 hover:bg-blue-600",
    defaultTitle: "Save Changes",
    defaultConfirm: "Save",
  },
  warning: {
    icon: <FaExclamationTriangle size={20} />,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    confirmBg: "bg-amber-500 hover:bg-amber-600",
    defaultTitle: "Are you sure?",
    defaultConfirm: "Confirm",
  },
  other: {
    icon: <FaQuestionCircle size={20} />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    confirmBg: "bg-slate-600 hover:bg-slate-700",
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

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 border border-slate-100">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-full ${cfg.iconBg} flex items-center justify-center mb-5`}>
            <span className={cfg.iconColor}>{cfg.icon}</span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-black text-slate-900 mb-2">
            {title || cfg.defaultTitle}
          </h3>

          {/* Message */}
          {message && (
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">{message}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors shadow-sm disabled:opacity-60 flex justify-center items-center ${cfg.confirmBg}`}
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : (confirmText || cfg.defaultConfirm)}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
