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
import { fetchUserContracts } from "../../api/tenantAPI/ContractAPI";
import { fetchTenantProfile } from "../../api/tenantAPI/tenantAuth";

export default function ContractCards() {
  const [contract, setContract] = useState(null);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [pdfModal, setPdfModal] = useState(false);

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
      case "Active":     return { bg: "#DCFCE7", text: "#16A34A", icon: <FaCheckCircle /> };
      case "Completed":  return { bg: "#EEF2FF", text: "#4F46E5", icon: <FaCheckCircle /> };
      case "Terminated": return { bg: "#FEE2E2", text: "#DC2626", icon: <FaExclamationTriangle /> };
      default:           return { bg: "#FEF3C7", text: "#D97706", icon: <FaHourglassHalf /> };
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FFF9F6] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D96648]" />
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
    <div className="bg-[#FFF9F6] min-h-screen w-full px-4 sm:px-6 md:px-10 py-6 md:py-10 text-[#330101]">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* STAT TILES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatTile icon={<FaCalendarAlt />} label="Start Date"  value={fmt(contract.start_date)}  color="text-indigo-500" bg="bg-indigo-50" />
          <StatTile icon={<FaCalendarAlt />} label="End Date"    value={fmt(contract.end_date)}    color="text-[#D96648]"  bg="bg-[#FDF2ED]" />
          <StatTile icon={<FaMoneyBillWave />} label="Monthly Rent"
            value={`₱${parseFloat(contract.rent_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            color="text-emerald-600" bg="bg-emerald-50"
          />
          <div className="bg-[#5c1f10] p-4 sm:p-5 rounded-3xl shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-white/10 rounded-2xl shrink-0" style={{ color: st.text }}>
              {st.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Status</p>
              <p className="text-sm sm:text-base font-black text-white uppercase tracking-tight truncate">{contract.status}</p>
            </div>
          </div>
        </div>

        {/* UNIT INFO STRIP */}
        {profile?.unitNumber && (
          <div className="bg-white border border-[#F2DED4] rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm">
            <div className="p-2.5 bg-[#FDF2ED] text-[#D96648] rounded-xl shrink-0">
              <FaHome size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest">Assigned Unit</p>
              <p className="font-black text-[#330101]">Unit {profile.unitNumber}</p>
            </div>
          </div>
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: ACTIONS */}
          <div className="lg:col-span-4 flex flex-col gap-4">

            {/* View PDF */}
            <button
              onClick={() => contract.contract_file && setPdfModal(true)}
              disabled={!contract.contract_file}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-xs uppercase tracking-widest bg-[#5c1f10] text-[#FFEDE1] hover:bg-[#7a2e1a] active:scale-[0.98] transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FaEye size={16} /> View Full Agreement
            </button>

            {/* Download PDF */}
            <a
              href={contract.contract_file || "#"}
              target="_blank"
              rel="noopener noreferrer"
              download
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-xs uppercase tracking-widest border border-[#F2DED4] bg-white text-[#330101] hover:bg-[#FFF9F6] active:scale-[0.98] transition-all ${!contract.contract_file ? "opacity-40 pointer-events-none" : ""}`}
            >
              <FaFileDownload size={16} /> Download Digital Copy
            </a>

            {/* Secure badge */}
            <div className="bg-white border border-[#F2DED4] rounded-4xl p-6 flex-1 flex flex-col items-center justify-center text-center gap-3">
              <div className="p-4 bg-[#FDF2ED] rounded-2xl">
                <FaShieldAlt className="text-[#D96648]" size={22} />
              </div>
              <h4 className="font-black text-sm text-[#330101]">Secure Agreement</h4>
              <p className="text-[11px] text-[#330101]/40 leading-relaxed max-w-[200px]">
                This contract is legally binding and stored securely in the MGC Portal.
              </p>
            </div>
          </div>

          {/* RIGHT: TERMS */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-4xl border border-[#F2DED4] shadow-sm overflow-hidden">
              <div className="px-7 py-5 border-b border-[#F2DED4] flex items-center gap-3">
                <div className="p-2.5 bg-[#FDF2ED] text-[#D96648] rounded-xl">
                  <FaClipboardList size={16} />
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-[#330101]">
                  Terms & Conditions
                </h2>
              </div>

              <div className="p-6 sm:p-8 space-y-8 max-h-[520px] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <RulesSection title="Tenancy Rules" items={rules} />
                  <RulesSection title="Renewal & Termination" items={conditions} />
                </div>
                <div className="pt-6 border-t border-dashed border-[#F2DED4]">
                  <p className="text-[10px] font-bold text-[#330101]/20 uppercase tracking-widest text-center">
                    End of Document — MGC Building Management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF VIEWER MODAL */}
      {pdfModal && contract.contract_file && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col">
          {/* Modal toolbar */}
          <div className="bg-[#5c1f10] px-5 py-3 flex items-center justify-between shrink-0">
            <span className="text-white font-black text-sm uppercase tracking-widest">
              Lease Agreement
            </span>
            <div className="flex items-center gap-3">
              <a
                href={contract.contract_file}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all uppercase tracking-widest"
              >
                <FaFileDownload size={12} /> Download
              </a>
              <button
                onClick={() => setPdfModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>

          {/* PDF iframe — opens in new tab on mobile */}
          <div className="flex-1 w-full bg-[#1a1a1a] hidden sm:block">
            <iframe
              src={`${contract.contract_file}#toolbar=0`}
              className="w-full h-full"
              title="Contract PDF"
            />
          </div>
          <div className="flex-1 flex items-center justify-center bg-[#1a1a1a] sm:hidden p-8 text-center">
            <div className="space-y-4">
              <FaClipboardList className="text-white/20 mx-auto" size={48} />
              <p className="text-white/60 text-sm">PDF preview isn't available on mobile.</p>
              <a
                href={contract.contract_file}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#f7b094] text-[#330101] font-bold text-xs px-6 py-3 rounded-xl uppercase tracking-widest"
              >
                <FaFileDownload size={14} /> Open PDF
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

function StatTile({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white px-4 sm:px-5 py-4 rounded-3xl border border-[#F2DED4] shadow-sm flex items-center gap-3 sm:gap-4">
      <div className={`p-2.5 sm:p-3 ${bg} ${color} rounded-2xl shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-[#330101]/40 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-xs sm:text-sm font-black text-[#330101] truncate">{value}</h3>
      </div>
    </div>
  );
}

function RulesSection({ title, items }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black text-[#D96648] uppercase tracking-widest flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D96648] shrink-0" /> {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-[#330101]/30 italic">No items listed.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="mt-2 w-1 h-1 rounded-full bg-[#F2DED4] shrink-0" />
              <span className="text-xs text-[#330101]/70 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
