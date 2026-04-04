import React from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaTimes, FaClock } from "react-icons/fa";

export default function PendingVerificationModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleBackToLogin = () => {
    if (onClose) onClose(); // Close modal if used as a popup
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">

      {/* Modal Container */}
      <div
        className="relative bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        data-aos="zoom-in"
      >
        {/* Signature Top Accent Bar */}
        <div className="h-1.5 w-full bg-[#db6747] shrink-0" />

        {/* Header Section */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <h2 className="text-slate-800 font-bold text-xs sm:text-sm uppercase tracking-widest">
              Registration Received
            </h2>
            <p className="text-slate-400 text-[9px] sm:text-[10px] uppercase tracking-widest mt-0.5 font-bold">
              MGC Building
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 transition-colors p-2 active:scale-90"
            aria-label="Close"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className="p-8 sm:p-10 text-center overflow-y-auto custom-scrollbar flex-1">
          {/* Visual Icon Area */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 shadow-sm relative z-10">
              <FaEnvelope className="text-[#db6747] text-3xl" />
            </div>
            {/* Pulsing decoration behind icon */}
            <div className="absolute w-20 h-20 bg-[#db6747]/10 rounded-full animate-ping opacity-20" />
          </div>

          {/* Text Content */}
          <h2 className="text-2xl sm:text-3xl font-OswaldRegular text-slate-900 uppercase tracking-wider mb-3">
            Status: Pending
          </h2>

          <p className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-[2px] font-semibold mb-8 leading-relaxed">
            Please allow 2-3 business days for account approval. <br />
            You will be notified via email once verified.
          </p>

          {/* Status Indicator Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-8 shadow-inner">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-[2px] mb-2">
              Processing Stage
            </label>
            <div className="flex items-center justify-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest">
              <FaClock className="text-amber-500" size={14} />
              Awaiting Administrative Review
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleBackToLogin}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-xl font-bold text-xs tracking-[3px] uppercase transition-all duration-300 shadow-lg active:scale-95"
          >
            Proceed to Login
          </button>

          <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Need assistance? <a href="mailto:mgcbuilding762@gmail.com" className="text-[#db6747] hover:underline ml-1">Contact Office</a>
          </p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}