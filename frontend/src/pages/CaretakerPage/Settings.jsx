import { useState } from "react";
import {
  FaBuilding, FaEnvelope, FaMapMarkerAlt, FaTag,
  FaEdit, FaSave, FaTimes,
} from "react-icons/fa";
import toast from "../../utils/toast";

const SYSINFO_KEY = "mgc_system_info";
const SYSINFO_DEFAULTS = {
  systemName:   "MGC Building Management System",
  version:      "1.0.0",
  contactEmail: "mgcbuilding762@gmail.com",
  address:      "762 F. Gomez St., Barangay Ibaba, Santa Rosa, Laguna",
};

const loadSysInfo = () => {
  try {
    const stored = localStorage.getItem(SYSINFO_KEY);
    return stored ? { ...SYSINFO_DEFAULTS, ...JSON.parse(stored) } : { ...SYSINFO_DEFAULTS };
  } catch { return { ...SYSINFO_DEFAULTS }; }
};

const SYSINFO_FIELDS = [
  { key: "systemName",   label: "System Name",   icon: <FaBuilding size={15}/>,     color: "bg-blue-50 text-blue-500" },
  { key: "version",      label: "Version",        icon: <FaTag size={15}/>,          color: "bg-purple-50 text-purple-500" },
  { key: "contactEmail", label: "Contact Email",  icon: <FaEnvelope size={15}/>,     color: "bg-amber-50 text-amber-500" },
  { key: "address",      label: "Address",        icon: <FaMapMarkerAlt size={15}/>, color: "bg-teal-50 text-teal-500" },
];

export default function CaretakerSettings() {
  const [sysInfo, setSysInfo] = useState(loadSysInfo);
  const [sysEdit, setSysEdit] = useState(false);
  const [sysDraft, setSysDraft] = useState({ ...SYSINFO_DEFAULTS });

  const openEdit  = () => { setSysDraft({ ...sysInfo }); setSysEdit(true); };
  const cancelEdit = () => setSysEdit(false);

  const saveInfo = () => {
    if (!sysDraft.systemName.trim() || !sysDraft.contactEmail.trim() || !sysDraft.address.trim()) {
      toast.error("All fields are required.");
      return;
    }
    const updated = { ...sysDraft };
    setSysInfo(updated);
    localStorage.setItem(SYSINFO_KEY, JSON.stringify(updated));
    setSysEdit(false);
    toast.success("System info updated.");
  };

  return (
    <div className="w-full bg-[#f8fafc] p-4 md:p-6 font-sans flex flex-col gap-4 min-h-screen text-slate-800">

      {/* System Info card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">System Information</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Building & contact details</p>
          </div>
          {!sysEdit ? (
            <button onClick={openEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all shadow-sm">
              <FaEdit size={11}/> <span className="uppercase tracking-widest">Edit</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={cancelEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                <FaTimes size={11}/> <span className="uppercase tracking-widest">Cancel</span>
              </button>
              <button onClick={saveInfo}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm">
                <FaSave size={11}/> <span className="uppercase tracking-widest">Save</span>
              </button>
            </div>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {SYSINFO_FIELDS.map(({ key, label, icon, color }) => (
            <div key={key} className="flex items-center gap-5 px-6 py-5 hover:bg-slate-50/60 transition-colors">
              <div className={`p-3 rounded-xl shrink-0 ${color}`}>{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                {sysEdit ? (
                  <input
                    type={key === "contactEmail" ? "email" : "text"}
                    value={sysDraft[key]}
                    onChange={(e) => setSysDraft((d) => ({ ...d, [key]: e.target.value }))}
                    className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800">{sysInfo[key]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
