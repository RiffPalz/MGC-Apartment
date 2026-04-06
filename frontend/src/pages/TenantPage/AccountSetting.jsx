import { useState, useEffect } from "react";
import toast from "../../utils/toast";
import {
  FaUser, FaEnvelope, FaPhone, FaHome,
  FaIdBadge, FaSave, FaLock, FaUsers, FaEye, FaEyeSlash,
} from "react-icons/fa";
import { fetchTenantProfile } from "../../api/tenantAPI/tenantAuth";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/config";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

export default function AccountSetting() {
  const { updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  // Personal info fields
  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [numberOfTenants, setNumberOfTenants] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchTenantProfile();
        if (res.user) {
          setProfile(res.user);
          setFullName(res.user.fullName || "");
          setEmailAddress(res.user.emailAddress || "");
          setContactNumber(res.user.contactNumber || "");
          setNumberOfTenants(res.user.numberOfTenants != null ? String(res.user.numberOfTenants) : "");
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const doSaveInfo = async () => {
    setSaving(true);
    try {
      const res = await api.patch("/users/profile/update", {
        fullName, emailAddress, contactNumber,
        numberOfTenants: numberOfTenants ? parseInt(numberOfTenants) : undefined,
      });
      const updated = res.data.user;
      setProfile(updated);
      updateUser(updated);
      toast.success("Profile updated.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInfo = () => {
    if (!fullName.trim()) return toast.error("Full name is required.");
    setConfirmModal({ title: "Save Changes?", message: "Are you sure you want to update your personal information?", action: doSaveInfo });
  };

  const doChangePassword = async () => {
    setSavingPw(true);
    try {
      await api.patch("/users/profile/update", { currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      toast.success("Password changed successfully.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Password change failed.");
    } finally {
      setSavingPw(false);
    }
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) return toast.error("Fill in all password fields.");
    if (newPassword !== confirmPassword) return toast.error("New passwords do not match.");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters.");
    setConfirmModal({ title: "Change Password?", message: "Are you sure you want to update your password?", action: doChangePassword });
  };

  const initials = (profile?.fullName || profile?.userName || "U")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  if (loading) {
    return (
      <div className="bg-[#FFF9F6] min-h-screen w-full px-4 sm:px-6 md:px-10 py-6 md:py-10 animate-pulse">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-[#F2DED4] p-6 space-y-5 shadow-sm">
            <div className="flex gap-5 items-center">
              <div className="w-20 h-20 bg-slate-200 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF9F6] min-h-screen w-full px-4 sm:px-6 md:px-10 2xl:px-14 py-6 md:py-10 2xl:py-14 text-[#330101] font-NunitoSans">

      {/* Responsive Wrapper: 
        - max-w-3xl on mobile/laptop so form doesn't look stretched 
        - Expands to max-w-[1600px] and splits into 2 columns on 4K (2xl) screens
      */}
      <div className="max-w-3xl 2xl:max-w-[1600px] mx-auto">
        <div className="flex flex-col 2xl:grid 2xl:grid-cols-12 gap-6 2xl:gap-10">

          {/* LEFT COLUMN: Profile & Personal Info */}
          <div className="2xl:col-span-7 flex flex-col gap-6 2xl:gap-8">

            {/* PROFILE CARD */}
            <div className="bg-white rounded-3xl sm:rounded-[2rem] border border-[#F2DED4] shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="h-20 sm:h-24 2xl:h-32 bg-[#5c1f10] relative">
                <div className="absolute -bottom-8 sm:-bottom-10 2xl:-bottom-12 left-5 sm:left-7 2xl:left-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 2xl:w-24 2xl:h-24 rounded-2xl sm:rounded-[1.25rem] bg-[#FDF2ED] border-4 border-white flex items-center justify-center text-[#D96648] font-black text-xl sm:text-2xl 2xl:text-3xl shadow-md">
                    {initials}
                  </div>
                </div>
              </div>
              <div className="pt-12 sm:pt-14 2xl:pt-16 px-5 sm:px-7 2xl:px-8 pb-6 sm:pb-7 2xl:pb-8">
                <h2 className="text-base sm:text-lg 2xl:text-xl font-black text-[#330101]">{profile?.fullName}</h2>
                <p className="text-[10px] sm:text-xs 2xl:text-sm text-[#330101]/40 font-bold uppercase tracking-widest mt-0.5">
                  {profile?.publicUserID}
                </p>
                <div className="flex flex-wrap gap-2.5 sm:gap-3 mt-4 sm:mt-5 2xl:mt-6">
                  {profile?.unitNumber && (
                    <Chip icon={<FaHome className="w-2.5 h-2.5 sm:w-3 sm:h-3 2xl:w-3.5 2xl:h-3.5" />} label={`Unit ${profile.unitNumber}`} />
                  )}
                  <Chip icon={<FaIdBadge className="w-2.5 h-2.5 sm:w-3 sm:h-3 2xl:w-3.5 2xl:h-3.5" />} label={profile?.userName} />
                  {profile?.numberOfTenants && (
                    <Chip icon={<FaUsers className="w-2.5 h-2.5 sm:w-3 sm:h-3 2xl:w-3.5 2xl:h-3.5" />} label={`${profile.numberOfTenants} Resident${profile.numberOfTenants > 1 ? "s" : ""}`} />
                  )}
                </div>
              </div>
            </div>

            {/* PERSONAL INFO FORM */}
            <div className="bg-white rounded-3xl sm:rounded-[2rem] border border-[#F2DED4] shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="px-5 sm:px-7 2xl:px-8 py-4 sm:py-5 2xl:py-6 border-b border-[#F2DED4] flex items-center gap-3 shrink-0">
                <div className="p-2 sm:p-2.5 2xl:p-3 bg-[#FDF2ED] text-[#D96648] rounded-xl shrink-0">
                  <FaUser className="w-3 h-3 sm:w-3.5 sm:h-3.5 2xl:w-4 2xl:h-4" />
                </div>
                <h3 className="text-xs sm:text-sm 2xl:text-base font-black uppercase tracking-widest text-[#330101]">
                  Personal Information
                </h3>
              </div>

              <div className="p-5 sm:p-7 2xl:p-8 space-y-5 2xl:space-y-6 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 2xl:gap-6">
                  <Field icon={<FaUser className="2xl:w-3.5 2xl:h-3.5" />} label="Full Name" value={fullName} onChange={setFullName} placeholder="Your full name" />
                  <Field icon={<FaEnvelope className="2xl:w-3.5 2xl:h-3.5" />} label="Email Address" value={emailAddress} onChange={setEmailAddress} placeholder="your@email.com" type="email" />
                  <Field icon={<FaPhone className="2xl:w-3.5 2xl:h-3.5" />} label="Contact Number" value={contactNumber} onChange={setContactNumber} placeholder="09xxxxxxxxx" type="tel" />

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] 2xl:text-xs font-bold text-[#330101]/50 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="text-[#D96648]"><FaUsers className="2xl:w-3.5 2xl:h-3.5" /></span> Number of Residents
                    </label>
                    <select
                      value={numberOfTenants}
                      onChange={(e) => setNumberOfTenants(e.target.value)}
                      className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 2xl:py-4.5 text-xs sm:text-sm 2xl:text-base font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition-all cursor-pointer shadow-sm"
                    >
                      <option value="">Select</option>
                      <option value="1">1 Resident</option>
                      <option value="2">2 Residents</option>
                    </select>
                  </div>
                </div>

                {/* Read-only */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 2xl:gap-6 pt-2 2xl:pt-4 border-t border-dashed border-[#F2DED4]">
                  <ReadOnlyField icon={<FaIdBadge className="2xl:w-3.5 2xl:h-3.5" />} label="Username" value={profile?.userName} />
                  <ReadOnlyField icon={<FaHome className="2xl:w-3.5 2xl:h-3.5" />} label="Unit Number" value={profile?.unitNumber || "Not assigned"} />
                </div>

                <div className="pt-2 2xl:pt-4">
                  <button
                    onClick={handleSaveInfo}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-[#5c1f10] hover:bg-[#7a2e1a] active:scale-[0.98] text-[#FFEDE1] font-bold py-3.5 sm:py-4 2xl:py-4.5 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-[#5c1f10]/20 uppercase tracking-widest text-[10px] sm:text-xs 2xl:text-sm disabled:opacity-50 mt-2"
                  >
                    <FaSave className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" /> {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Password Settings */}
          <div className="2xl:col-span-5 flex flex-col gap-6 2xl:gap-8 mt-6 2xl:mt-0">
            <div className="bg-white rounded-3xl sm:rounded-[2rem] border border-[#F2DED4] shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md h-full">
              <div className="px-5 sm:px-7 2xl:px-8 py-4 sm:py-5 2xl:py-6 border-b border-[#F2DED4] flex items-center gap-3 shrink-0">
                <div className="p-2 sm:p-2.5 2xl:p-3 bg-[#FDF2ED] text-[#D96648] rounded-xl shrink-0">
                  <FaLock className="w-3 h-3 sm:w-3.5 sm:h-3.5 2xl:w-4 2xl:h-4" />
                </div>
                <h3 className="text-xs sm:text-sm 2xl:text-base font-black uppercase tracking-widest text-[#330101]">
                  Change Password
                </h3>
              </div>

              <div className="p-5 sm:p-7 2xl:p-8 space-y-4 sm:space-y-5 2xl:space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4 sm:space-y-5 2xl:space-y-6">
                  <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} toggle={() => setShowCurrent(!showCurrent)} />
                  <div className="pt-2 pb-1 border-t border-dashed border-[#F2DED4]" />
                  <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} show={showNew} toggle={() => setShowNew(!showNew)} />
                  <PasswordField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
                </div>

                <div className="pt-6 2xl:pt-8 mt-auto">
                  <button
                    onClick={handleChangePassword}
                    disabled={savingPw}
                    className="w-full flex items-center justify-center gap-2 bg-[#5c1f10] hover:bg-[#7a2e1a] active:scale-[0.98] text-[#FFEDE1] font-bold py-3.5 sm:py-4 2xl:py-4.5 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-[#5c1f10]/20 uppercase tracking-widest text-[10px] sm:text-xs 2xl:text-sm disabled:opacity-50"
                  >
                    <FaLock className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" /> {savingPw ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* CONFIRM MODAL */}
      <GeneralConfirmationModal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        onConfirm={() => { const action = confirmModal?.action; setConfirmModal(null); action?.(); }}
        variant="save"
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmText="Confirm"
      />
    </div>
  );
}

/* ---------- Sub-components ---------- */

function Field({ icon, label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <label className="text-[9px] sm:text-[10px] 2xl:text-xs font-bold text-[#330101]/50 uppercase tracking-widest flex items-center gap-1.5">
        <span className="text-[#D96648]">{icon}</span> {label}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 2xl:py-4.5 text-xs sm:text-sm 2xl:text-base font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition-all placeholder:opacity-40 shadow-sm" />
    </div>
  );
}

function ReadOnlyField({ icon, label, value }) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <label className="text-[9px] sm:text-[10px] 2xl:text-xs font-bold text-[#330101]/50 uppercase tracking-widest flex items-center gap-1.5">
        <span className="text-[#D96648]">{icon}</span> {label}
      </label>
      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 2xl:py-4.5 text-xs sm:text-sm 2xl:text-base font-bold text-[#330101]/40 cursor-not-allowed select-none">
        {value}
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, toggle }) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <label className="text-[9px] sm:text-[10px] 2xl:text-xs font-bold text-[#330101]/50 uppercase tracking-widest flex items-center gap-1.5">
        <span className="text-[#D96648]"><FaLock className="w-2.5 h-2.5 2xl:w-3.5 2xl:h-3.5" /></span> {label}
      </label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 2xl:py-4.5 pr-12 text-xs sm:text-sm 2xl:text-base font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition-all placeholder:opacity-40 shadow-sm tracking-[0.2em]" />
        <button type="button" onClick={toggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#330101]/30 hover:text-[#D96648] transition-colors p-1">
          {show ? <FaEyeSlash className="w-4 h-4 2xl:w-5 2xl:h-5" /> : <FaEye className="w-4 h-4 2xl:w-5 2xl:h-5" />}
        </button>
      </div>
    </div>
  );
}

function Chip({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#FDF2ED] text-[#D96648] text-[9px] sm:text-[10px] 2xl:text-xs font-black px-3 sm:px-3.5 2xl:px-4 py-1.5 sm:py-2 rounded-full uppercase tracking-widest shadow-sm">
      {icon} {label}
    </span>
  );
}