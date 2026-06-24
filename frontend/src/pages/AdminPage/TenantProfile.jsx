import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MdPerson, MdEmail, MdPhone, MdCalendarToday,
  MdPeople, MdArrowBack, MdEdit, MdHome, MdBadge,
  MdCheckCircle, MdAccessTime, MdVpnKey, MdSave, MdClose,
} from "react-icons/md";
import { fetchTenantProfile, updateTenantProfile } from "../../api/adminAPI/unitsAPI";
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

  // Edit Profile States
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [confirmSaveProfile, setConfirmSaveProfile] = useState(false);

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

  const handleOpenEditProfile = () => {
    setEditForm({
      fullName: tenant.fullName ?? "",
      emailAddress: tenant.emailAddress ?? "",
      contactNumber: tenant.contactNumber ?? "",
      numberOfTenants: tenant.numberOfTenants ?? 1,
      startDate: contract?.startDate?.slice(0, 10) ?? "",
      endDate: contract?.endDate?.slice(0, 10) ?? "",
    });
    setShowEditProfile(true);
  };

  const handlePreSaveProfile = () => {
    if (!editForm.fullName?.trim()) return toast.warn("Full name is required");
    if (!editForm.emailAddress?.trim()) return toast.warn("Email address is required");
    if (contract) {
      if (!editForm.startDate || !editForm.endDate) return toast.warn("Both contract dates are required");
      if (new Date(editForm.endDate) <= new Date(editForm.startDate))
        return toast.warn("End date must be after start date");
    }
    setConfirmSaveProfile(true);
  };

  const executeSaveProfile = async () => {
    try {
      setSavingProfile(true);

      // Save profile fields
      await updateTenantProfile(id, {
        fullName: editForm.fullName.trim(),
        emailAddress: editForm.emailAddress.trim(),
        contactNumber: editForm.contactNumber,
        numberOfTenants: Number(editForm.numberOfTenants),
      });

      // Save contract dates if a contract exists
      if (contract && editForm.startDate && editForm.endDate) {
        await api.put(`/admin/contracts/${contract.id}`, {
          start_date: editForm.startDate,
          end_date: editForm.endDate,
        });
      }

      toast.success("Profile updated successfully");
      setConfirmSaveProfile(false);
      setShowEditProfile(false);
      const updated = await fetchTenantProfile(id);
      if (updated.success) setTenant(updated.tenant);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
      setConfirmSaveProfile(false);
    } finally {
      setSavingProfile(false);
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

          {/* Edit Profile Button */}
          <div className="shrink-0 self-start md:self-center">
            <button
              onClick={handleOpenEditProfile}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#db6747] hover:bg-[#c45a3d] text-white text-xs font-bold uppercase tracking-widest shadow-md shadow-orange-200 transition-all active:scale-95"
            >
              <MdEdit size={14} /> Edit Profile
            </button>
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
            >
              {contract ? (
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

      {/* ── EDIT PROFILE MODAL ── */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex justify-center items-center p-4 sm:p-6 transition-all duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl shadow-slate-900/20 border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#db6747]/20 to-[#db6747]/5 flex items-center justify-center border border-[#db6747]/10 shadow-inner">
                  <MdEdit size={20} className="text-[#db6747]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 uppercase tracking-wider">Edit Profile</h2>
                  <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-0.5">
                    ID: {tenant.publicUserID}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditProfile(false)}
                className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 transition-all p-2.5 rounded-xl border border-transparent hover:border-slate-200 active:scale-95"
              >
                <MdClose size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">

              {/* Main Form Fields */}
              <div className="space-y-4">

                {/* Full Name */}
                <div className="relative group">
                  <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <MdPerson size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#db6747] transition-colors" />
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-[#db6747] text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-[#db6747]/10 outline-none transition-all py-3.5 px-4 pl-11 placeholder:text-slate-400"
                      placeholder="Juan Dela Cruz"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="relative group">
                  <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                  <div className="relative">
                    <MdEmail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#db6747] transition-colors" />
                    <input
                      type="email"
                      value={editForm.emailAddress}
                      onChange={(e) => setEditForm({ ...editForm, emailAddress: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-[#db6747] text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-[#db6747]/10 outline-none transition-all py-3.5 px-4 pl-11 placeholder:text-slate-400"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="relative group">
                  <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                  <div className="relative">
                    <MdPhone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#db6747] transition-colors" />
                    <input
                      type="text"
                      value={editForm.contactNumber}
                      onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-[#db6747] text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-[#db6747]/10 outline-none transition-all py-3.5 px-4 pl-11 placeholder:text-slate-400"
                      placeholder="09XX-XXX-XXXX"
                    />
                  </div>
                </div>

                {/* 2-Column Grid */}
<div className="grid grid-cols-2 gap-5">
                   {/* Occupants */}
                   <div className="relative group col-span-2">
                     <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Occupants</label>
                     <div className="relative">
                       <MdPeople size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#db6747] transition-colors z-10" />
                       <select
                         value={editForm.numberOfTenants}
                         onChange={(e) => setEditForm({ ...editForm, numberOfTenants: e.target.value })}
                         className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-[#db6747] text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-[#db6747]/10 outline-none transition-all py-3.5 px-4 pl-11 appearance-none cursor-pointer"
                       >
                         <option value={1}>1 Person</option>
                         <option value={2}>2 Persons</option>
                       </select>
                     </div>
                   </div>
                 </div>
              </div>

              {/* Contract Dates */}
              {contract && (
                <div className="bg-orange-50/50 border border-orange-100/50 rounded-2xl p-5 space-y-4">
                  <p className="text-[10px] font-semibold text-[#db6747] uppercase tracking-widest flex items-center gap-2">
                    <MdCalendarToday size={14} /> Contract Duration
                  </p>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="relative group">
                      <label className="block text-[9px] font-medium text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Start Date</label>
                      <input
                        type="date"
                        value={editForm.startDate}
                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                        className="w-full bg-white border border-slate-200 focus:border-[#db6747] text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-[#db6747]/10 outline-none transition-all py-3 px-4"
                      />
                    </div>
                    <div className="relative group">
                      <label className="block text-[9px] font-medium text-slate-500 uppercase tracking-widest mb-1.5 ml-1">End Date</label>
                      <input
                        type="date"
                        value={editForm.endDate}
                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                        className="w-full bg-white border border-slate-200 focus:border-[#db6747] text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-[#db6747]/10 outline-none transition-all py-3 px-4"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Read-only Data Container */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">System Data</p>
                  <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">Read Only</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mb-1">Username</p>
                    <p className="text-xs font-mono text-slate-600 truncate">{tenant.userName}</p>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mb-1">Unit Number</p>
                    <p className="text-xs text-slate-600">{tenant.unitNumber ?? "—"}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-8 py-5 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button
                onClick={() => setShowEditProfile(false)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all uppercase tracking-widest active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handlePreSaveProfile}
                disabled={savingProfile}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#db6747] text-white text-xs font-semibold hover:bg-[#c45a3d] transition-all uppercase tracking-widest shadow-lg shadow-[#db6747]/30 disabled:opacity-60 disabled:shadow-none active:scale-95"
              >
                <MdSave size={16} /> {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── EDIT PROFILE CONFIRMATION MODAL ── */}
      <GeneralConfirmationModal
        isOpen={confirmSaveProfile}
        onClose={() => setConfirmSaveProfile(false)}
        onConfirm={executeSaveProfile}
        variant="save"
        title="Update Tenant Profile"
        message={`Are you sure you want to save changes to ${tenant?.fullName}'s profile?`}
        confirmText="Save Changes"
        loading={savingProfile}
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