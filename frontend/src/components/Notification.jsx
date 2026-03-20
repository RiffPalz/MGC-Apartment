import React, { useState, useEffect } from "react";
import { FaBell } from "react-icons/fa";

export default function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch logic here (Logic stays encapsulated)
  useEffect(() => {
    // fetchNotifications().then(setNotifications);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-[#D96648] transition-colors relative"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-[#D96648] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white shadow-xl rounded-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-4 border-b border-slate-50 font-bold text-sm text-[#330101]">
            Notifications
          </div>
          <div className="max-h-64 overflow-y-auto">
            {/* Map notifications here */}
            <p className="p-4 text-xs text-slate-500 text-center">
              No new notifications
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
