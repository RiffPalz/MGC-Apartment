import { useState, useEffect, useRef } from "react";
import { FaCamera, FaEdit, FaSave, FaTimes, FaUserShield, FaEnvelope, FaPhone, FaUser, FaIdBadge } from "react-icons/fa";
import toast from "../../utils/toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/config";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

export default function AdminProfile() {
  const { updateUser } = useAuth();
  const fileRef = useRef();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState({});
  const [formError, setFormError] = useState("");
  
  // Confirmation Modal State
  const [confirmSave, setConfirmSave] = useState(false);

  /* fetch profile */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/admin/profile");
        if (res.data.success) setProfile(res.data.admin);
      } catch {
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openEdit = () => {
    setDraft({
      fullName: profile.fullName || "",
      emailAddress: profile.emailAddress || "",
      contactNumber: profile.contactNumber || "",
      userName: profile.userName || "",
    });
    setFormError("");
    setEditing(true);
  };

  // 1. Intercept the form submission
  const handlePreSave = (e) => {
    e.preventDefault();
    setFormError("");
    if (!draft.fullName.trim() || !draft.emailAddress.trim() || !draft.userName.trim()) {
      setFormError("Full name, email, and username are required.");
      return;
    }
    setConfirmSave(true);
  };

  // 2. Execute the actual API call
  const executeSave = async () => {
    try {
      setSaving(true);
      const res = await api.patch("/admin/profile/update", draft);
      if (res.data.success) {
        setProfile((p) => ({ ...p, ...res.data.admin }));
        updateUser(res.data.admin);
        setEditing(false);
        setConfirmSave(false);
        toast.success("Profile updated successfully.");
      }
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to update profile.");
      setConfirmSave(false);
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("Image must be under 3MB."); return; }

    const fd = new FormData();
    fd.append("profilePicture", file);
    try {
      setUploading(true);
      const res = await api.post("/admin/profile/picture", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setProfile((p) => ({ ...p, profilePicture: res.data.profilePicture }));
        updateUser({ profilePicture: res.data.profilePicture });
        toast.success("Profile picture updated.");
      }
    } catch {
      toast.error("Failed to upload picture.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#db6747]" />
    </div>
  );

  const displayName = profile?.fullName || profile?.userName || "Admin";
  const initial = displayName[0]?.toUpperCase() ?? "A";

  const FIELDS = [
    { key: "fullName", label: "Full Name", icon: <FaUser size={14} />, type: "text" },
    { key: "emailAddress", label: "Email Address", icon: <FaEnvelope size={14} />, type: "email" },
    { key: "contactNumber", label: "Contact Number", icon: <FaPhone size={14} />, type: "text" },
    { key: "userName", label: "Username", icon: <FaIdBadge size={14} />, type: "text" },
  ];

  return (
    <div className="w-full bg-[#f8fafc] p-4 md:p-6 font-sans flex flex-col gap-6 min-h-screen overflow-x-hidden">
      
      {/* 4K Containment Wrapper */}
      <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-5 sm:gap-6 flex-1">

        {/* PROFILE CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

          {/* Banner */}
          <div className="h-24 sm:h-32 bg-gradient-to-r from-[#3a0f08] to-[#db6747] relative shrink-0" />

          {/* Avatar + Name Section */}
          <div className="px-5 sm:px-8 pb-6 sm:pb-8 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-6">
              
              {/* Avatar - Pulled up into banner */}
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 mx-auto sm:mx-0 -mt-12 sm:-mt-16">
                {profile?.profilePicture ? (
                  <img src={profile.profilePicture} alt="Profile"
                    className="w-full h-full rounded-2xl sm:rounded-3xl object-cover border-[5px] sm:border-[6px] border-white shadow-lg bg-white" />
                ) : (
                  <div className="w-full h-full rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-[#3a0f08] to-[#db6747] flex items-center justify-center border-[5px] sm:border-[6px] border-white shadow-lg">
                    <span className="text-white font-black text-3xl sm:text-4xl">{initial}</span>
                  </div>
                )}
                {/* Upload button */}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-9 h-9 sm:w-10 sm:h-10 bg-[#db6747] hover:bg-[#c45a3a] text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-60 active:scale-95 border-2 border-white"
                  title="Change photo"
                >
                  {uploading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <FaCamera size={14} />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePictureUpload} />
              </div>

              {/* Name + Role Text (Pushed down slightly to clear the avatar curve) */}
              <div className="flex-1 min-w-0 text-center sm:text-left mt-4 sm:mt-0 sm:pt-4 sm:pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight truncate">{displayName}</h2>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                    <FaUserShield size={14} className="text-[#db6747]" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">{profile?.role ?? "Admin"}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">{profile?.adminID}</span>
                  </div>
                </div>

                {/* Edit button */}
                {!editing && (
                  <div className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                    <button onClick={openEdit}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#db6747] text-white text-xs font-bold hover:bg-[#c45a3a] transition-colors shadow-sm uppercase tracking-widest w-full active:scale-95">
                      <FaEdit size={14} /> Edit Profile
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* INFO / EDIT FORM */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-4 shrink-0">
            <div>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Personal Information</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                {editing ? "Make your changes below" : "Your account details"}
              </p>
            </div>
            {editing && (
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => setEditing(false)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95 uppercase tracking-widest">
                  <FaTimes size={11} /> Cancel
                </button>
                <button form="profile-form" type="submit" disabled={saving}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-60 active:scale-95 uppercase tracking-widest">
                  <FaSave size={11} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <form id="profile-form" onSubmit={handlePreSave} className="p-5 sm:p-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {FIELDS.map(({ key, label, icon, type }) => (
                  <div key={key}>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                      <span className="text-[#db6747]">{icon}</span> {label}
                    </label>
                    <input
                      type={type}
                      value={draft[key] || ""}
                      maxLength={key === "contactNumber" ? 11 : undefined}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (key === "contactNumber") val = val.replace(/\D/g, "").slice(0, 11);
                        setDraft((d) => ({ ...d, [key]: val }));
                      }}
                      className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-all shadow-sm"
                    />
                  </div>
                ))}
              </div>
              {formError && (
                <div className="mt-5 bg-red-50 border-l-4 border-red-500 px-4 py-3 text-[11px] text-red-600 font-bold uppercase tracking-widest rounded-r-lg">
                  {formError}
                </div>
              )}
            </form>
          ) : (
            <div className="divide-y divide-slate-100 flex-1">
              {FIELDS.map(({ key, label, icon }) => (
                <div key={key} className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className="p-3 bg-orange-50 text-[#db6747] rounded-xl shrink-0 border border-orange-100 shadow-sm">{icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{profile?.[key] || "---"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── CONFIRMATION MODAL ── */}
      <GeneralConfirmationModal
        isOpen={confirmSave}
        onClose={() => setConfirmSave(false)}
        onConfirm={executeSave}
        variant="save"
        title="Update Profile"
        message="Are you sure you want to save these changes to your admin profile?"
        confirmText="Save Changes"
        loading={saving}
      />
    </div>
  );
}