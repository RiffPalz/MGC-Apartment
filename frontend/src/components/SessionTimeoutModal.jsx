/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { FaHourglassHalf } from "react-icons/fa";
import ModalPortal from "./ModalPortal";

const WARNING_SECONDS = 60;

export default function SessionTimeoutModal({ isOpen, onContinue, onLogout }) {
  const [seconds, setSeconds] = useState(WARNING_SECONDS);

  // Reset and start countdown whenever modal opens
  useEffect(() => {
    if (!isOpen) {
      setSeconds(WARNING_SECONDS);
      return;
    }

    setSeconds(WARNING_SECONDS);
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const pct = (seconds / WARNING_SECONDS) * 100;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const isUrgent = seconds <= 15;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-modal-title"
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-8 border border-slate-100 animate-in zoom-in-95 duration-200">

          {/* Icon + Countdown Ring */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-20 h-20 flex items-center justify-center mb-4">
              {/* SVG ring */}
              <svg className="absolute inset-0 -rotate-90" width="80" height="80" viewBox="0 0 80 80">
                {/* Track */}
                <circle
                  cx="40" cy="40" r={radius}
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="6"
                />
                {/* Progress */}
                <circle
                  cx="40" cy="40" r={radius}
                  fill="none"
                  stroke={isUrgent ? "#ef4444" : "#db6747"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
                />
              </svg>
              {/* Icon center */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isUrgent ? "bg-red-50" : "bg-orange-50"}`}>
                <FaHourglassHalf size={20} className={isUrgent ? "text-red-500" : "text-[#db6747]"} />
              </div>
            </div>

            {/* Countdown number */}
            <span className={`text-4xl font-black tabular-nums ${isUrgent ? "text-red-500" : "text-[#db6747]"}`}>
              {seconds}s
            </span>
          </div>

          {/* Title */}
          <h3
            id="session-modal-title"
            className="text-xl sm:text-2xl font-black text-slate-900 mb-2 text-center tracking-tight"
          >
            Session Expiring
          </h3>

          {/* Message */}
          <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed text-center">
            You've been inactive for a while. Your session will end automatically in{" "}
            <span className={`font-bold ${isUrgent ? "text-red-500" : "text-[#db6747]"}`}>
              {seconds} second{seconds !== 1 ? "s" : ""}
            </span>
            . Do you want to continue?
          </p>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              onClick={onLogout}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 active:scale-[0.96] transition-all"
            >
              End Session
            </button>
            <button
              onClick={onContinue}
              className="flex-1 py-3 px-4 rounded-xl bg-[#db6747] hover:bg-[#c45a3a] text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[#db6747] focus:ring-offset-2 active:scale-[0.96] transition-all shadow-lg shadow-orange-500/20"
            >
              Continue Session
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
