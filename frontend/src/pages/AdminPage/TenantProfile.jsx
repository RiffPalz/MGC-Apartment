import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MdPerson, MdEmail, MdPhone, MdCalendarToday,
  MdPeople, MdArrowBack, MdEdit, MdHome, MdBadge,
  MdCheckCircle, MdAccessTime, MdVpnKey, MdSave, MdClose
} from "react-icons/md";
import { fetchTenantProfile } from "../../api/adminAPI/unitsAPI";
import api from "../../api/config";
import toast from "../../utils/toast";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

const FLOOR_MAP = { 1: "Ground Floor", 2: "Second Floor", 3: "Third Floor", 4: "Fourth Floor" };

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

export default function TenantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Contract Edit States
  const [editingContract, setEditingContract] = useState(false);
  const [contractDates, setContractDates] = useState({ startDate: "", endDate: "" });

  // Confirmation Modal States
  const [savingContract, setSavingContract] = useState(false);
  const [confirmSaveContract, setConfirmSaveContract] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchTenantProfile(id);
        if (res.success) setTenant(res.tenant);
        else toast.error("Tenant not found");
      } catch (err) {
        console.error("fetchTenantProfile error:", err);
        toast.error(err?.response?.data?.message || "Failed to load tenant profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] animate-pulse">
        <div className="w-full max-w-2xl p-6 space-y-5">
          <div className="h-32 bg-slate-200 rounded-2xl w-full" />
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-slate-200 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-6 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-100 rounded w-1/3" />
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] text-slate-800 gap-4 p-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-2">
          <MdPerson size={32} className="text-slate-300" />
        </div>
        <p className="font-semibold text-lg text-center">Tenant not found</p>
        <button onClick={() => navigate(-1)} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium uppercase tracking-widest shadow-sm w-full sm:w-auto">
          <MdArrowBack size={16} /> Go back
        </button>
      </div>
    );
  }

  const contract = tenant.contract;
  const initials = tenant.fullName
    ? tenant.fullName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const isContractActive = contract?.status === "Active";
  const contractDaysLeft = contract?.endDate
    ? Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const handleEditContract = () => {
    setContractDates({
      startDate: contract?.startDate?.slice(0, 10) ?? "",
      endDate: contract?.endDate?.slice(0, 10) ?? "",
    });
    setEditingContract(true);
  };

  // 1. Intercept Save Action to show confirmation modal
  const handlePreSaveContract = () => {
    if (!contractDates.startDate || !contractDates.endDate)
      return toast.warn("Both dates are required");
    if (new Date(contractDates.endDate) <= new Date(contractDates.startDate))
      return toast.warn("End date must be after start date");

    setConfirmSaveContract(true);
  };

  // 2. Execute the actual API call
  const executeSaveContract = async () => {
    try {
      setSavingContract(true);
      const res = await api.put(`/admin/contracts/${contract.id}`, {
        start_date: contractDates.startDate,
        end_date: contractDates.endDate,
      });
      if (res.data.success) {
        toast.success("Contract dates updated");
        setConfirmSaveContract(false);
        setEditingContract(false);
        // refresh profile
        const updated = await fetchTenantProfile(id);
        if (updated.success) setTenant(updated.tenant);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update contract");
      setConfirmSaveContract(false);
    } finally {
      setSavingContract(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-12 flex flex-col overflow-x-hidden">

      {/* ── TOP NAVIGATION ── */}
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-[#db6747] transition-colors text-[11px] font-bold uppercase tracking-widest mb-6 py-2 px-1 -ml-1 rounded-lg active:bg-slate-100 w-fit"
        >
          <MdArrowBack size={14} /> Back to Directory
        </button>
      </div>

      {/* ── MAIN CONTENT WRAPPER ── */}
      {/* max-w-[1600px] guarantees it expands safely on 4K, while remaining snug on standard laptops */}
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 space-y-6 flex-1">

        {/* ── PROFILE HERO CARD ── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
          {/* Decorative background accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -z-10 opacity-60 translate-x-1/3 -translate-y-1/3 pointer-events-none" />

          {/* Avatar Area */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#db6747] to-[#e8845f] flex items-center justify-center shadow-md shadow-orange-200">
              <span className="text-white text-3xl font-semibold tracking-tight">{initials}</span>
            </div>
            <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-xl border-4 border-white flex items-center justify-center shadow-sm
              ${isContractActive ? "bg-emerald-500" : "bg-slate-400"}`}>
              {isContractActive
                ? <MdCheckCircle size={14} className="text-white" />
                : <MdAccessTime size={14} className="text-white" />}
            </div>
          </div>

          {/* Core Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight truncate">
              {tenant.fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
              <span className="flex items-center gap-1.5 text-slate-500 text-sm font-normal">
                <MdBadge size={16} className="text-slate-400" /> {tenant.publicUserID}
              </span>
              {contract?.unit && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-[#db6747] rounded-lg text-sm font-medium border border-orange-100 whitespace-nowrap">
                  <MdHome size={16} />
                  Unit {contract.unit.unitNumber} <span className="text-orange-300 font-normal mx-1">|</span> {FLOOR_MAP[contract.unit.floor] ?? `Floor ${contract.unit.floor}`}
                </span>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge color="bg-slate-100 text-slate-600 border border-slate-200" label={tenant.status} />
              {isContractActive && (
                <Badge color="bg-emerald-50 text-emerald-700 border border-emerald-200" label="Active Contract" />
              )}
              {contractDaysLeft !== null && contractDaysLeft > 0 && (
                <Badge
                  color={contractDaysLeft <= 30 ? "bg-red-50 text-red-600 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}
                  label={`${contractDaysLeft} days remaining`}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Info */}
            <Section title="Personal Information" icon={<MdPerson size={18} />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-bold">
                <DataCard icon={<MdPerson size={16} />} label="Full Name" value={tenant.fullName} />
                <DataCard icon={<MdEmail size={16} />} label="Email Address" value={tenant.emailAddress} />
                <DataCard icon={<MdPhone size={16} />} label="Phone Number" value={tenant.contactNumber || "—"} />
                <DataCard icon={<MdBadge size={16} />} label="System ID" value={tenant.publicUserID} mono />
              </div>
            </Section>

            {/* Contract Info */}
            <Section
              title="Contract Details"
              icon={<MdCalendarToday size={18} />}
              action={contract && !editingContract && (
                <button
                  onClick={handleEditContract}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-[#db6747] bg-orange-50 hover:bg-orange-100 border border-orange-100 transition-colors shadow-sm active:scale-95"
                >
                  <MdEdit size={12} /> Edit Dates
                </button>
              )}
            >
              {contract ? (
                editingContract ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest block mb-1.5">Start Date</label>
                        <input
                          type="date"
                          value={contractDates.startDate}
                          onChange={(e) => setContractDates({ ...contractDates, startDate: e.target.value })}
                          className="w-full border border-slate-200 focus:border-[#db6747] focus:ring-2 focus:ring-[#db6747]/20 rounded-xl p-2.5 text-sm outline-none transition-all bg-white shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest block mb-1.5">End Date</label>
                        <input
                          type="date"
                          value={contractDates.endDate}
                          onChange={(e) => setContractDates({ ...contractDates, endDate: e.target.value })}
                          className="w-full border border-slate-200 focus:border-[#db6747] focus:ring-2 focus:ring-[#db6747]/20 rounded-xl p-2.5 text-sm outline-none transition-all bg-white shadow-sm"
                        />
                      </div>
                    </div>
                    {/* Responsive Buttons: Stack on mobile, side-by-side on larger screens */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-5 mt-2 border-t border-slate-100">
                      <button
                        onClick={() => setEditingContract(false)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest w-full sm:w-auto active:scale-95"
                      >
                        <MdClose size={13} /> Cancel
                      </button>
                      <button
                        onClick={handlePreSaveContract}
                        disabled={savingContract}
                        className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#db6747] text-white text-xs font-bold hover:bg-[#c45a3d] transition-colors uppercase tracking-widest shadow-md shadow-orange-200 disabled:opacity-60 w-full sm:w-auto active:scale-95"
                      >
                        <MdSave size={13} /> {savingContract ? "Saving..." : "Save Dates"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DataCard icon={<MdCalendarToday size={16} />} label="Start Date" value={formatDate(contract.startDate)} />
                    <DataCard icon={<MdCalendarToday size={16} />} label="End Date" value={formatDate(contract.endDate)} />
                    <DataCard
                      icon={<MdHome size={16} />}
                      label="Assigned Unit"
                      value={contract.unit ? `Unit ${contract.unit.unitNumber}` : "—"}
                    />
                    <DataCard
                      icon={<MdCheckCircle size={16} />}
                      label="Contract Status"
                      value={contract.status}
                      valueColor={contract.status === "Active" ? "text-emerald-600 font-medium" : "text-slate-600 font-medium"}
                    />
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                    <MdCalendarToday size={20} className="text-slate-300" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-widest text-center px-4">No active contract on record</p>
                </div>
              )}
            </Section>
          </div>

          {/* Side Column */}
          <div className="space-y-6">

            {/* Occupancy Info */}
            <Section title="Occupancy" icon={<MdPeople size={18} />}>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-5 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm border border-blue-100">
                    <MdVpnKey size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Total Pax</p>
                    <p className="text-lg font-semibold text-slate-800">{tenant.numberOfTenants || 0} Registered</p>
                  </div>
                </div>
              </div>

              {/* Tenant list */}
              <div>
                <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-3 px-1">Registered Occupants</h3>
                <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-[#db6747]/30 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100 group-hover:bg-[#db6747] transition-colors">
                    <MdPerson size={18} className="text-[#db6747] group-hover:text-white transition-colors" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{tenant.fullName}</p>
                    <p className="text-[11px] text-slate-500 font-normal truncate">{tenant.publicUserID}</p>
                  </div>
                  <div className="shrink-0">
                    <span className="text-[9px] font-medium px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider">
                      Primary
                    </span>
                  </div>
                </div>
              </div>
            </Section>

          </div>
        </div>

      </div>

      {/* ── CONFIRMATION MODAL ── */}
      <GeneralConfirmationModal
        isOpen={confirmSaveContract}
        onClose={() => setConfirmSaveContract(false)}
        onConfirm={executeSaveContract}
        variant="save"
        title="Update Contract Dates"
        message="Are you sure you want to update the start and end dates for this tenant's contract?"
        confirmText="Save Dates"
        loading={savingContract}
      />
    </div>
  );
}

/* ── UI Components ── */

function Section({ title, icon, children, action }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between gap-2.5 px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-[#db6747]">{icon}</span>
          <h2 className="text-[12px] font-semibold text-slate-700 uppercase tracking-widest">{title}</h2>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-6 flex-1">
        {children}
      </div>
    </div>
  );
}

function DataCard({ icon, label, value, mono = false, valueColor = "text-slate-800" }) {
  return (
    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all">
      <div className="flex items-center gap-2 text-slate-400">
        {icon} <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-sm font-normal break-words mt-0.5 ${mono ? "font-mono tracking-wide text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded w-max" : ""} ${valueColor}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function Badge({ color, label }) {
  return (
    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-md uppercase tracking-wider whitespace-nowrap ${color}`}>
      {label}
    </span>
  );
}