import { useState, useEffect } from "react";
import {
  FaEdit, FaSave, FaTimes, FaBuilding,
  FaMoneyBillWave, FaFileAlt, FaImage, FaCheck,
} from "react-icons/fa";
import toast from "../../utils/toast";
import { fetchConfig, updateConfig } from "../../api/adminAPI/ConfigAPI";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

// Local fallback images
import img1 from "../../assets/images/LP-img1.jpg";
import img2 from "../../assets/images/LP-img2.png";
import img3 from "../../assets/images/LP-img3.png";
import img4 from "../../assets/images/LP-img4.jpg";
import img5 from "../../assets/images/LP-img5.jpg";

const SLOT_KEYS = ["left1", "left2", "left3", "rightTop", "rightLarge"];
const SLOT_LABELS = {
  left1: "Left 1", left2: "Left 2", left3: "Left 3",
  rightTop: "Right Top", rightLarge: "Right Large",
};

// Default gallery mappings
const DEFAULT_GALLERY = {
  left1: { url: img1, caption: "Front View" },
  rightTop: { url: img2, caption: "Main Gate" },
  left2: { url: img3, caption: "Parking Space" },
  rightLarge: { url: img4, caption: "Inside the Building" },
  left3: { url: img5, caption: "Main Road" },
};

const inputCls =
  "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 transition-colors shadow-sm";
const textareaCls = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 transition-colors shadow-sm resize-none";

// Reusable UI Components
function SectionCard({ icon, title, subtitle, editButton, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/50 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#db6747]/10 text-[#db6747]">{icon}</div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{title}</h2>
            {subtitle && <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="w-full sm:w-auto mt-3 sm:mt-0">
          {editButton}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FieldRow({ label, value, multiline }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-slate-50 last:border-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest sm:w-44 shrink-0 pt-0.5">{label}</p>
      <p className={`text-sm font-semibold text-slate-800 flex-1 ${multiline ? "whitespace-pre-line" : ""}`}>
        {value || <span className="text-slate-300 italic font-normal">—</span>}
      </p>
    </div>
  );
}

export default function AdminSystemConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editingSections, setEditingSections] = useState({});
  const [savingSections, setSavingSections] = useState({});
  const [saveConfirm, setSaveConfirm] = useState(null); // section name pending confirm

  const isEditing = (section) => !!editingSections[section];
  const isSaving = (section) => !!savingSections[section];

  // Form drafts
  const [identityDraft, setIdentityDraft] = useState({ mgc_name: "", address: "" });
  const [rateDraft, setRateDraft] = useState({ monthly_rate: "" });
  const [depositDraft, setDepositDraft] = useState({ deposit_terms: "" });
  const [gallerySlots, setGallerySlots] = useState([]);

  // Safely assign fallback images
  const buildGallerySlots = (images = []) => {
    return SLOT_KEYS.map((slot) => {
      const img = images.find((i) => i.slot === slot) || {};
      const isValidWebUrl = img.url && img.url.startsWith("http");

      return {
        displayUrl: isValidWebUrl ? img.url : DEFAULT_GALLERY[slot].url,
        dbUrl: isValidWebUrl ? img.url : "", // Prevents saving local paths to DB
        caption: img.caption || DEFAULT_GALLERY[slot].caption,
        slot,
        file: null,
        preview: null,
      };
    });
  };

  const applyConfig = (cfg) => {
    setConfig(cfg);
    setIdentityDraft({ mgc_name: cfg.mgc_name || "", address: cfg.address || "" });
    setRateDraft({ monthly_rate: cfg.monthly_rate ?? "" });
    setDepositDraft({ deposit_terms: cfg.deposit_terms || "" });
    setGallerySlots(buildGallerySlots(cfg.gallery_images));
  };

  // Initialization
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchConfig();
        applyConfig(data.config || {});
      } catch {
        toast.error("Failed to load system configuration.");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Edit toggles
  const openEdit = (section) => {
    if (config) {
      if (section === "identity") setIdentityDraft({ mgc_name: config.mgc_name || "", address: config.address || "" });
      if (section === "rate") setRateDraft({ monthly_rate: config.monthly_rate ?? "" });
      if (section === "deposit") setDepositDraft({ deposit_terms: config.deposit_terms || "" });
      if (section === "gallery") setGallerySlots(buildGallerySlots(config.gallery_images));
    }
    setEditingSections((prev) => ({ ...prev, [section]: true }));
  };

  const cancelEdit = (section) => {
    setEditingSections((prev) => ({ ...prev, [section]: false }));
  };

  // Save handler
  const save = async (section) => {
    try {
      setSavingSections((prev) => ({ ...prev, [section]: true }));
      const fd = new FormData();

      if (section === "identity") {
        if (identityDraft.mgc_name.trim()) fd.append("mgc_name", identityDraft.mgc_name.trim());
        if (identityDraft.address.trim()) fd.append("address", identityDraft.address.trim());
      }

      if (section === "rate") {
        if (String(rateDraft.monthly_rate).trim()) fd.append("monthly_rate", rateDraft.monthly_rate);
      }

      if (section === "deposit") {
        if (depositDraft.deposit_terms.trim()) fd.append("deposit_terms", depositDraft.deposit_terms.trim());
      }

      if (section === "gallery") {
        fd.append("gallery_images", JSON.stringify(
          gallerySlots.map((s) => ({ url: s.dbUrl, caption: s.caption, slot: s.slot }))
        ));
        gallerySlots.forEach((s, i) => { if (s.file) fd.append(`gallery_${i}`, s.file); });
      }

      const data = await updateConfig(fd);
      applyConfig(data.config || {});
      setEditingSections((prev) => ({ ...prev, [section]: false }));
      toast.success("Configuration updated successfully.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save configuration.");
    } finally {
      setSavingSections((prev) => ({ ...prev, [section]: false }));
    }
  };

  // FIXED: Converted from a React Component to a standard Helper Function
  const renderEditBtn = (section) => {
    if (isEditing(section)) {
      return (
        <div className="flex w-full sm:w-auto gap-2">
          <button onClick={() => cancelEdit(section)}
            className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95">
            <FaTimes size={10} /> Cancel
          </button>
          <button onClick={() => setSaveConfirm(section)} disabled={isSaving(section)}
            className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm active:scale-95 disabled:opacity-60">
            <FaSave size={10} /> {isSaving(section) ? "Saving..." : "Save"}
          </button>
        </div>
      );
    }

    return (
      <button onClick={() => openEdit(section)}
        className="w-full sm:w-auto flex justify-center items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all shadow-sm active:scale-95">
        <FaEdit size={10} /> Edit
      </button>
    );
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#f8fafc] p-4 md:p-6 animate-pulse">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-4 bg-slate-100 rounded w-48" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
              <div className="h-5 bg-slate-200 rounded w-40" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-10 bg-slate-100 rounded-lg" />
                <div className="h-10 bg-slate-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans min-h-screen">
      <div className="max-w-[1600px] w-full mx-auto">
        <div className="max-w-[1200px] w-full mx-auto flex flex-col gap-6">

          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-widest">System Configuration</h1>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-1">Manage landing page content and building details</p>
          </div>

          <SectionCard icon={<FaBuilding size={15} />} title="Building Identity" subtitle="Name and address shown on the landing page" editButton={renderEditBtn("identity")}>
            {isEditing("identity") ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">MGC Name</label>
                  <input type="text" value={identityDraft.mgc_name} onChange={(e) => setIdentityDraft((d) => ({ ...d, mgc_name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Address</label>
                  <input type="text" value={identityDraft.address} onChange={(e) => setIdentityDraft((d) => ({ ...d, address: e.target.value }))} className={inputCls} />
                </div>
              </div>
            ) : (
              <>
                <FieldRow label="MGC Name" value={config?.mgc_name} />
                <FieldRow label="Address" value={config?.address} />
              </>
            )}
          </SectionCard>

          <SectionCard icon={<FaMoneyBillWave size={15} />} title="Monthly Rate" subtitle="Rent rate displayed on the landing page" editButton={renderEditBtn("rate")}>
            {isEditing("rate") ? (
              <div className="max-w-xs">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Monthly Rate (₱)</label>
                <input type="number" value={rateDraft.monthly_rate} onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 4); setRateDraft({ monthly_rate: val }); }} min="0" max="9999" step="1" className={inputCls} />
              </div>
            ) : (
              <FieldRow label="Monthly Rate" value={config?.monthly_rate ? `₱${parseInt(config.monthly_rate)}` : null} />
            )}
          </SectionCard>

          <SectionCard icon={<FaFileAlt size={15} />} title="Deposit Terms" subtitle="Bullet items in the Security & Terms section" editButton={renderEditBtn("deposit")}>
            {isEditing("deposit") ? (
              <div className="max-w-lg">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Terms <span className="normal-case text-slate-400">(one per line, or comma-separated)</span></label>
                <textarea rows={5} value={depositDraft.deposit_terms} onChange={(e) => setDepositDraft({ deposit_terms: e.target.value })} className={textareaCls} />
              </div>
            ) : (
              <ul className="space-y-2">
                {(config?.deposit_terms || "").split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm font-semibold text-slate-800"><FaCheck className="text-[#db6747] mt-0.5 shrink-0" size={11} /> {t}</li>
                ))}
                {!config?.deposit_terms && <span className="text-slate-300 italic text-sm">—</span>}
              </ul>
            )}
          </SectionCard>

          <SectionCard icon={<FaImage size={15} />} title="Gallery Images" subtitle="5 image slots displayed in the landing page gallery" editButton={renderEditBtn("gallery")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {gallerySlots.map((slot, i) => (
                <div key={slot.slot} className="flex flex-col gap-2">

                  <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                    {slot.preview || slot.displayUrl ? (
                      <img src={slot.preview || slot.displayUrl} alt={slot.caption || slot.slot} className="w-full h-full object-cover" />
                    ) : (
                      <FaImage className="text-slate-300" size={22} />
                    )}
                  </div>

                  {isEditing("gallery") ? (
                    <input type="file" accept="image/jpeg,image/png,image/webp"
                      className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-600 hover:file:bg-slate-300 cursor-pointer w-full"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("Image must be 5 MB or smaller.");
                          e.target.value = "";
                          return;
                        }
                        const preview = URL.createObjectURL(file);
                        setGallerySlots((prev) => prev.map((s, idx) => idx === i ? { ...s, file, preview } : s));
                      }} />
                  ) : (
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{SLOT_LABELS[slot.slot]}</p>
                      {slot.caption && <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">{slot.caption}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

        </div>
      </div>

      <GeneralConfirmationModal
        isOpen={!!saveConfirm}
        onClose={() => setSaveConfirm(null)}
        onConfirm={() => { const s = saveConfirm; setSaveConfirm(null); save(s); }}
        variant="save"
        title="Save Changes?"
        message="Are you sure you want to update this configuration? Changes will be reflected on the landing page."
        confirmText="Save"
        loading={saveConfirm ? isSaving(saveConfirm) : false}
      />
    </div>
  );
}