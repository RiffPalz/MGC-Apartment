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

  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [savingPw, setSavingPw]   = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { type: "info" | "password", action: fn }

  // Personal info fields
  const [fullName, setFullName]           = useState("");
  const [emailAddress, setEmailAddress]   = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [numberOfTenants, setNumberOfTenants] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);

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
      <div className="bg-[#FFF9F6] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D96648]" />
      </div>
    );
  }

  return (
    <div className="bg-[#FFF9F6] min-h-screen w-full px-4 sm:px-6 md:px-10 py-6 md:py-10 text-[#330101]">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* PROFILE CARD */}
        <div className="bg-white rounded-[2rem] border border-[#F2DED4] shadow-sm overflow-hidden">
          <div className="h-24 bg-[#5c1f10] relative">
            <div className="absolute -bottom-10 left-7">
              <div className="w-20 h-20 rounded-2xl bg-[#FDF2ED] border-4 border-white flex items-center justify-center text-[#D96648] font-black text-2xl shadow-md">
                {initials}
              </div>
            </div>
          </div>
          <div className="pt-14 px-7 pb-7">
            <h2 className="text-lg font-black text-[#330101]">{profile?.fullName}</h2>
            <p className="text-xs text-[#330101]/40 font-bold uppercase tracking-widest mt-0.5">
              {profile?.publicUserID}
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              {profile?.unitNumber && (
                <Chip icon={<FaHome size={11} />} label={`Unit ${profile.unitNumber}`} />
              )}
              <Chip icon={<FaIdBadge size={11} />} label={profile?.userName} />
              {profile?.numberOfTenants && (
                <Chip icon={<FaUsers size={11} />} label={`${profile.numberOfTenants} Resident${profile.numberOfTenants > 1 ? "s" : ""}`} />
              )}
            </div>
          </div>
        </div>

        {/* PERSONAL INFO FORM */}
        <div className="bg-white rounded-[2rem] border border-[#F2DED4] shadow-sm overflow-hidden">
          <div className="px-7 py-5 border-b border-[#F2DED4] flex items-center gap-3">
            <div className="p-2.5 bg-[#FDF2ED] text-[#D96648] rounded-xl shrink-0">
              <FaUser size={14} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#330101]">
              Personal Information
            </h3>
          </div>
          <div className="p-7 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field icon={<FaUser size={13} />}    label="Full Name"      value={fullName}      onChange={setFullName}      placeholder="Your full name" />
              <Field icon={<FaEnvelope size={13} />} label="Email Address" value={emailAddress}  onChange={setEmailAddress}  placeholder="your@email.com" type="email" />
              <Field icon={<FaPhone size={13} />}   label="Contact Number" value={contactNumber} onChange={setContactNumber} placeholder="09xxxxxxxxx" type="tel" />
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="text-[#D96648]"><FaUsers size={13} /></span> Number of Residents
                </label>
                <select
                  value={numberOfTenants}
                  onChange={(e) => setNumberOfTenants(e.target.value)}
                  className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition cursor-pointer"
                >
                  <option value="">Select</option>
                  <option value="1">1 Resident</option>
                  <option value="2">2 Residents</option>
                </select>
              </div>
            </div>

            {/* Read-only */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              <ReadOnlyField icon={<FaIdBadge size={13} />} label="Username"    value={profile?.userName} />
              <ReadOnlyField icon={<FaHome size={13} />}    label="Unit Number" value={profile?.unitNumber || "Not assigned"} />
            </div>

            <button
              onClick={handleSaveInfo}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#5c1f10] hover:bg-[#7a2e1a] text-[#FFEDE1] font-bold py-4 rounded-2xl transition-all shadow-lg uppercase tracking-widest text-xs disabled:opacity-50"
            >
              <FaSave size={14} /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* CHANGE PASSWORD */}
        <div className="bg-white rounded-[2rem] border border-[#F2DED4] shadow-sm overflow-hidden">
          <div className="px-7 py-5 border-b border-[#F2DED4] flex items-center gap-3">
            <div className="p-2.5 bg-[#FDF2ED] text-[#D96648] rounded-xl shrink-0">
              <FaLock size={14} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#330101]">
              Change Password
            </h3>
          </div>
          <div className="p-7 space-y-5">
            <PasswordField label="Current Password"  value={currentPassword} onChange={setCurrentPassword} show={showCurrent} toggle={() => setShowCurrent(!showCurrent)} />
            <PasswordField label="New Password"      value={newPassword}     onChange={setNewPassword}     show={showNew}     toggle={() => setShowNew(!showNew)} />
            <PasswordField label="Confirm Password"  value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />

            <button
              onClick={handleChangePassword}
              disabled={savingPw}
              className="w-full flex items-center justify-center gap-2 bg-[#5c1f10] hover:bg-[#7a2e1a] text-[#FFEDE1] font-bold py-4 rounded-2xl transition-all shadow-lg uppercase tracking-widest text-xs disabled:opacity-50"
            >
              <FaLock size={14} /> {savingPw ? "Updating..." : "Update Password"}
            </button>
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
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest flex items-center gap-1.5">
        <span className="text-[#D96648]">{icon}</span> {label}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition placeholder:opacity-30" />
    </div>
  );
}

function ReadOnlyField({ icon, label, value }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest flex items-center gap-1.5">
        <span className="text-[#D96648]">{icon}</span> {label}
      </label>
      <div className="w-full bg-[#F5F5F5] border border-[#F2DED4] rounded-2xl px-5 py-4 text-sm font-bold text-[#330101]/40 cursor-not-allowed select-none">
        {value}
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, toggle }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-[#330101]/40 uppercase tracking-widest flex items-center gap-1.5">
        <span className="text-[#D96648]"><FaLock size={11} /></span> {label}
      </label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-[#FFF9F6] border border-[#F2DED4] rounded-2xl px-5 py-4 pr-12 text-sm font-bold focus:ring-2 focus:ring-[#f7b094] outline-none transition placeholder:opacity-30" />
        <button type="button" onClick={toggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#330101]/30 hover:text-[#D96648] transition-colors">
          {show ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
        </button>
      </div>
    </div>
  );
}

function Chip({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#FDF2ED] text-[#D96648] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
      {icon} {label}
    </span>
  );
}
