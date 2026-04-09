import { useState, useEffect } from "react";
import {
  FaBuilding, FaEnvelope, FaMapMarkerAlt, FaTag,
} from "react-icons/fa";
import { fetchSystemInfo } from "../../api/adminAPI/SystemInfoAPI";

const SYSINFO_FIELDS = [
  { key: "systemName", label: "System Name", icon: <FaBuilding size={15} />, color: "bg-blue-50 text-blue-500" },
  { key: "version", label: "Version", icon: <FaTag size={15} />, color: "bg-purple-50 text-purple-500" },
  { key: "contactEmail", label: "Contact Email", icon: <FaEnvelope size={15} />, color: "bg-amber-50 text-amber-500" },
  { key: "address", label: "Address", icon: <FaMapMarkerAlt size={15} />, color: "bg-teal-50 text-teal-500" },
];

export default function CaretakerSettings() {
  const [sysInfo, setSysInfo] = useState(null);

  useEffect(() => {
    fetchSystemInfo()
      .then((res) => { if (res.success) setSysInfo(res.systemInfo); })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full h-full font-sans flex flex-col gap-4 sm:gap-5 text-slate-800 min-h-screen">

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 sm:px-6 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">System Information</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Building & contact details</p>
        </div>

        <div className="divide-y divide-slate-100 flex-1">
          {!sysInfo ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading...</div>
          ) : SYSINFO_FIELDS.map(({ key, label, icon, color }) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 px-5 sm:px-6 py-5 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center gap-3 sm:w-48 shrink-0">
                <div className={`p-2.5 rounded-xl ${color} shadow-sm border border-slate-100`}>{icon}</div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="text-sm font-semibold text-slate-800 sm:px-2 break-words">{sysInfo[key]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
