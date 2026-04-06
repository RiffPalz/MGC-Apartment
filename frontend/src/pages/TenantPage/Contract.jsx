import { useState, useEffect } from "react";
import {
  FaFileDownload,
  FaEye,
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardList,
  FaShieldAlt,
  FaHome,
  FaMoneyBillWave,
  FaTimes,
  FaExclamationTriangle,
  FaHourglassHalf,
} from "react-icons/fa";
import { fetchUserContracts, getContractPdfProxyUrl } from "../../api/tenantAPI/ContractAPI";
import { fetchTenantProfile } from "../../api/tenantAPI/tenantAuth";
import ModalPortal from "../../components/ModalPortal";

export default function ContractCards() {
  const [contract, setContract] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfModal, setPdfModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [contractRes, profileRes] = await Promise.all([
          fetchUserContracts(),
          fetchTenantProfile(),
        ]);
        if (contractRes.success && contractRes.contracts.length > 0) {
          const active = contractRes.contracts.find((c) => c.status === "Active")
            || contractRes.contracts[0];
          setContract(active);
        }
        if (profileRes.user) setProfile(profileRes.user);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openPdfModal = async () => {
    if (!contract?.contract_file) return;
    setPdfModal(true);
    setPdfLoading(true);
    try {
      const proxyUrl = getContractPdfProxyUrl(contract.ID);
      const response = await fetch(proxyUrl, {
        headers: { Authorization: `Bearer ${localStorage.getItem("tenantToken")}` },
      });
      if (!response.ok) throw new Error("Failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      setPdfBlobUrl(url);
    } catch {
      setPdfModal(false);
    } finally {
      setPdfLoading(false);
    }
  };

  const closePdfModal = () => {
    setPdfModal(false);
    if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const proxyUrl = getContractPdfProxyUrl(contract.ID);
      const response = await fetch(proxyUrl, {
        headers: { Authorization: `Bearer ${localStorage.getItem("tenantToken")}` },
      });
      if (!response.ok) throw new Error("Failed to fetch PDF");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `MGC_Contract_Unit${profile?.unitNumber ?? ""}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(contract.contract_file, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
      : "---";

  const parseLines = (text) =>
    text ? text.split(/\n|;/).map((s) => s.trim()).filter(Boolean) : [];

  const statusStyle = (s) => {
    switch (s) {
      case "Active": return { bg: "#DCFCE7", text: "#16A34A", icon: <FaCheckCircle /> };
      case "Completed": return { bg: "#EEF2FF", text: "#4F46E5", icon: <FaCheckCircle /> };
      case "Terminated": return { bg: "#FEE2E2", text: "#DC2626", icon: <FaExclamationTriangle /> };
      default: return { bg: "#FEF3C7", text: "#D97706", icon: <FaHourglassHalf /> };
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FFF9F6] min-h-screen w-full px-4 sm:px-6 md:px-10 py-6 md:py-10 animate-pulse">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="h-8 bg-[#F2DED4] rounded w-48" />
          <div className="bg-white rounded-2xl border border-[#F2DED4] p-6 space-y-4 shadow-sm">
            <div className="h-5 bg-slate-200 rounded w-32" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#F2DED4] p-6 space-y-4 shadow-sm">
            <div className="h-5 bg-slate-200 rounded w-40" />
            <div className="h-32 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="bg-[#FFF9F6] min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#FDF2ED] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaClipboardList className="text-[#D96648]" size={24} />
          </div>
          <h3 className="font-black text-[#330101] text-lg mb-2">No Contract Found</h3>
          <p className="text-[#330101]/40 text-sm">You don't have an active contract yet.</p>
        </div>
      </div>
    );
  }

  const st = statusStyle(contract.status);
  const rules = parseLines(contract.tenancy_rules);
  const conditions = parseLines(contract.termination_renewal_conditions);

  return (
    <div className="bg-[#FFF9F6] min-h-screen w-full px-4 sm:px-6 md:px-10 2xl:px-14 py-6 md:py-10 2xl:py-14 text-[#330101]">
      <div className="max-w-[1600px] mx-auto space-y-6 lg:space-y-8">

        {/* STAT TILES - Responsive grid for all sizes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 2xl:gap-6">
          <StatTile icon={<FaCalendarAlt />} label="Start Date" value={fmt(contract.start_date)} color="text-indigo-500" bg="bg-indigo-50" />
          <StatTile icon={<FaCalendarAlt />} label="End Date" value={fmt(contract.end_date)} color="text-[#D96648]" bg="bg-[#FDF2ED]" />
          <StatTile icon={<FaMoneyBillWave />} label="Monthly Rent"
            value={`₱${parseFloat(contract.rent_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            color="text-emerald-600" bg="bg-emerald-50"
          />
          <div className="bg-[#5c1f10] p-4 sm:p-5 2xl:p-6 rounded-3xl shadow-sm flex items-center gap-3 sm:gap-4 transition-all hover:scale-[1.02]">
            <div className="p-2.5 sm:p-3 bg-white/10 rounded-2xl shrink-0" style={{ color: st.text }}>
              {st.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] 2xl:text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Status</p>
              <p className="text-sm sm:text-base 2xl:text-lg font-black text-white uppercase tracking-tight truncate">{contract.status}</p>
            </div>
          </div>
        </div>

        {/* UNIT INFO STRIP */}
        {profile?.unitNumber && (
          <div className="bg-white border border-[#F2DED4] rounded-2xl px-6 py-4 2xl:py-5 flex items-center gap-4 shadow-sm">
            <div className="p-2.5 2xl:p-3 bg-[#FDF2ED] text-[#D96648] rounded-xl shrink-0">
              <FaHome size={16} className="2xl:w-5 2xl:h-5" />
            </div>
            <div>
              <p className="text-[10px] 2xl:text-xs font-bold text-[#330101]/40 uppercase tracking-widest">Assigned Unit</p>
              <p className="font-black text-[#330101] 2xl:text-lg">Unit {profile.unitNumber}</p>
            </div>
          </div>
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 2xl:gap-10">

          {/* LEFT: ACTIONS - Sticky on large screens */}
          <div className="lg:col-span-4 2xl:col-span-3 flex flex-col gap-4">
            <div className="lg:sticky lg:top-6 space-y-4">
              <button
                onClick={openPdfModal}
                disabled={!contract.contract_file}
                className="w-full flex items-center justify-center gap-3 py-4 sm:py-5 rounded-2xl font-bold text-xs 2xl:text-sm uppercase tracking-widest bg-[#5c1f10] text-[#FFEDE1] hover:bg-[#7a2e1a] active:scale-[0.98] transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FaEye size={16} /> View Full Agreement
              </button>

              <button
                onClick={handleDownload}
                disabled={!contract.contract_file || downloading}
                className={`w-full flex items-center justify-center gap-3 py-4 sm:py-5 rounded-2xl font-bold text-xs 2xl:text-sm uppercase tracking-widest border border-[#F2DED4] bg-white text-[#330101] hover:bg-[#FFF9F6] active:scale-[0.98] transition-all ${!contract.contract_file ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <FaFileDownload size={16} /> {downloading ? "Downloading..." : "Download Digital Copy"}
              </button>

              <div className="bg-white border border-[#F2DED4] rounded-4xl p-6 2xl:p-8 flex flex-col items-center justify-center text-center gap-3 shadow-sm">
                <div className="p-4 2xl:p-5 bg-[#FDF2ED] rounded-2xl">
                  <FaShieldAlt className="text-[#D96648] 2xl:w-8 2xl:h-8" size={22} />
                </div>
                <h4 className="font-black text-sm 2xl:text-base text-[#330101]">Secure Agreement</h4>
                <p className="text-[11px] 2xl:text-xs text-[#330101]/40 leading-relaxed max-w-[200px] 2xl:max-w-none">
                  This contract is legally binding and stored securely in the MGC Portal.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: TERMS */}
          <div className="lg:col-span-8 2xl:col-span-9">
            <div className="bg-white rounded-4xl border border-[#F2DED4] shadow-sm overflow-hidden flex flex-col h-full">
              <div className="px-7 py-5 2xl:py-7 border-b border-[#F2DED4] flex items-center gap-3 shrink-0">
                <div className="p-2.5 2xl:p-3 bg-[#FDF2ED] text-[#D96648] rounded-xl">
                  <FaClipboardList size={16} className="2xl:w-5 2xl:h-5" />
                </div>
                <h2 className="text-sm 2xl:text-base font-black uppercase tracking-widest text-[#330101]">
                  Terms & Conditions
                </h2>
              </div>

              <div className="p-6 sm:p-8 2xl:p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar lg:max-h-[650px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 2xl:gap-12">
                  <RulesSection title="Tenancy Rules" items={rules} />
                  <RulesSection title="Renewal & Termination" items={conditions} />
                </div>
                <div className="pt-6 2xl:pt-8 border-t border-dashed border-[#F2DED4]">
                  <p className="text-[10px] 2xl:text-xs font-bold text-[#330101]/20 uppercase tracking-widest text-center">
                    End of Document — MGC Building Management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF VIEWER MODAL */}
      {pdfModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-[#323639] z-[9999] flex flex-col animate-in fade-in duration-300">
            
            {/* Header: Locked to top */}
            <div className="bg-[#5c1f10] px-4 sm:px-6 py-3 2xl:py-4 flex items-center justify-between shrink-0 shadow-xl z-10 border-b border-black/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg hidden sm:block">
                  <FaShieldAlt className="text-[#f7b094]" size={14} />
                </div>
                <span className="text-white font-black text-xs sm:text-sm uppercase tracking-[0.2em]">
                  Lease Agreement
                </span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={handleDownload} 
                  disabled={downloading}
                  className="flex items-center gap-2 bg-[#D96648] hover:bg-[#b5553b] text-white text-[10px] sm:text-xs font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition-all uppercase tracking-widest disabled:opacity-60 shadow-lg active:scale-95"
                >
                  <FaFileDownload size={12} /> 
                  <span className="hidden xs:inline">{downloading ? "..." : "Download PDF"}</span>
                </button>
                <button 
                  onClick={closePdfModal} 
                  className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
                  aria-label="Close modal"
                >
                  <FaTimes size={18} />
                </button>
              </div>
            </div>

            {/* PDF Container: EDGE-TO-EDGE */}
            <div className="flex-1 w-full relative bg-[#323639]">
              {pdfLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/40">
                  <div className="w-12 h-12 border-3 border-white/10 border-t-[#D96648] rounded-full animate-spin" />
                  <p className="text-[10px] uppercase tracking-[0.3em] font-black">Loading Document...</p>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  title="Lease Agreement Preview"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-white/50 text-center px-6">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10 max-w-md">
                    <FaExclamationTriangle className="text-[#D96648] w-12 h-12 mb-4 mx-auto" />
                    <p className="text-sm font-bold text-white mb-2">Preview Unavailable</p>
                    <p className="text-xs leading-relaxed">Direct browser preview failed. Your agreement is still secure and ready for download.</p>
                  </div>
                  <button 
                    onClick={handleDownload}
                    className="bg-white text-[#330101] hover:bg-[#FFEDE1] px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
                  >
                    Download & Open Locally
                  </button>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

function StatTile({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white px-4 sm:px-5 py-4 2xl:p-6 rounded-3xl border border-[#F2DED4] shadow-sm flex items-center gap-3 sm:gap-4 transition-all hover:scale-[1.02]">
      <div className={`p-2.5 sm:p-3 2xl:p-4 ${bg} ${color} rounded-2xl shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] 2xl:text-xs font-bold text-[#330101]/40 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-xs sm:text-sm 2xl:text-base font-black text-[#330101] truncate">{value}</h3>
      </div>
    </div>
  );
}

function RulesSection({ title, items }) {
  return (
    <div className="space-y-4 2xl:space-y-6">
      <h3 className="text-xs 2xl:text-sm font-black text-[#D96648] uppercase tracking-widest flex items-center gap-2">
        <span className="w-1.5 h-1.5 2xl:w-2 2xl:h-2 rounded-full bg-[#D96648] shrink-0" /> {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs 2xl:text-sm text-[#330101]/30 italic text-center py-4">No items listed.</p>
      ) : (
        <ul className="space-y-3 2xl:space-y-4">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3 items-start group">
              <span className="mt-2 w-1 h-1 rounded-full bg-[#F2DED4] shrink-0 group-hover:bg-[#D96648] transition-colors" />
              <span className="text-xs 2xl:text-sm text-[#330101]/70 leading-relaxed group-hover:text-[#330101] transition-colors">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}