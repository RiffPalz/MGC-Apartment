import { useState } from "react";
import {
  FaBuilding, FaEnvelope, FaMapMarkerAlt, FaTag,
  FaEdit, FaSave, FaTimes,
} from "react-icons/fa";
import toast from "../../utils/toast";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

const SYSINFO_KEY = "mgc_system_info";
const SYSINFO_DEFAULTS = {
  systemName: "MGC Building Management System",
  version: "1.0.0",
  contactEmail: "mgcbuilding762@gmail.com",
  address: "762 F. Gomez St., Barangay Ibaba, Santa Rosa, Laguna",
};

const loadSysInfo = () => {
  try {
    const stored = localStorage.getItem(SYSINFO_KEY);
    return stored ? { ...SYSINFO_DEFAULTS, ...JSON.parse(stored) } : { ...SYSINFO_DEFAULTS };
  } catch { return { ...SYSINFO_DEFAULTS }; }
};

const SYSINFO_FIELDS = [
  { key: "systemName", label: "System Name", icon: <FaBuilding size={15} />, color: "bg-blue-50 text-blue-500" },
  { key: "version", label: "Version", icon: <FaTag size={15} />, color: "bg-purple-50 text-purple-500" },
  { key: "contactEmail", label: "Contact Email", icon: <FaEnvelope size={15} />, color: "bg-amber-50 text-amber-500" },
  { key: "address", label: "Address", icon: <FaMapMarkerAlt size={15} />, color: "bg-teal-50 text-teal-500" },
];

export default function CaretakerSettings() {
  const [sysInfo, setSysInfo] = useState(loadSysInfo);
  const [sysEdit, setSysEdit] = useState(false);
  const [sysDraft, setSysDraft] = useState({ ...SYSINFO_DEFAULTS });

  // Confirmation Modal State
  const [confirmSave, setConfirmSave] = useState(false);

  const openEdit = () => { setSysDraft({ ...sysInfo }); setSysEdit(true); };
  const cancelEdit = () => { setSysEdit(false); setConfirmSave(false); };

  // Intercept the save action
  const handlePreSave = () => {
    if (!sysDraft.systemName.trim() || !sysDraft.contactEmail.trim() || !sysDraft.address.trim()) {
      toast.error("All fields are required.");
      return;
    }
    setConfirmSave(true);
  };

  // Execute the actual save
  const executeSave = () => {
    const updated = { ...sysDraft };
    setSysInfo(updated);
    localStorage.setItem(SYSINFO_KEY, JSON.stringify(updated));
    setSysEdit(false);
    setConfirmSave(false);
    toast.success("System info updated.");
  };

  return (
    <>
      <div className="w-full h-full font-sans flex flex-col gap-4 sm:gap-5 text-slate-800 min-h-screen">

        {/* 4K Containment Wrapper (Width and padding are inherited from CaretakerLayout) */}

        {/* System Info card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 sm:px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/50 gap-4 shrink-0">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">System Information</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Building & contact details</p>
            </div>

            {!sysEdit ? (
              <button onClick={openEdit}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all shadow-sm active:scale-95 w-full sm:w-auto">
                <FaEdit size={11} /> <span className="uppercase tracking-widest">Edit Details</span>
              </button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={cancelEdit}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95">
                  <FaTimes size={11} /> <span className="uppercase tracking-widest">Cancel</span>
                </button>
                <button onClick={handlePreSave}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm active:scale-95">
                  <FaSave size={11} /> <span className="uppercase tracking-widest">Save</span>
                </button>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="divide-y divide-slate-100 flex-1">
            {SYSINFO_FIELDS.map(({ key, label, icon, color }) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 px-5 sm:px-6 py-5 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3 sm:w-48 shrink-0">
                  <div className={`p-2.5 rounded-xl ${color} shadow-sm border border-slate-100`}>{icon}</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                </div>
                <div className="flex-1 min-w-0 w-full">
                  {sysEdit ? (
                    <input
                      type={key === "contactEmail" ? "email" : "text"}
                      value={sysDraft[key]}
                      onChange={(e) => setSysDraft((d) => ({ ...d, [key]: e.target.value }))}
                      className="w-full text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all shadow-sm"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 sm:px-2 break-words">{sysInfo[key]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── CONFIRMATION MODAL ── */}
      <GeneralConfirmationModal
        isOpen={confirmSave}
        onClose={() => setConfirmSave(false)}
        onConfirm={executeSave}
        variant="save"
        title="Update System Settings"
        message="Are you sure you want to save changes to the building's global system information?"
        confirmText="Save Settings"
      />
    </>
  );
}