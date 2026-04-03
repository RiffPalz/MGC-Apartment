import { useState, useEffect } from "react";
import {
  FaEdit, FaSave, FaTimes, FaUserShield,
  FaEnvelope, FaPhone, FaUser, FaIdBadge,
} from "react-icons/fa";
import toast from "../../utils/toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/config";

export default function CaretakerProfile() {
  const { updateUser } = useAuth();

  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [draft, setDraft]       = useState({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/caretaker/profile");
        if (res.data.success) setProfile(res.data.caretaker);
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
      fullName:      profile.fullName      || "",
      emailAddress:  profile.emailAddress  || "",
      contactNumber: profile.contactNumber || "",
      userName:      profile.username      || "",
    });
    setFormError("");
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!draft.fullName.trim() || !draft.emailAddress.trim() || !draft.userName.trim()) {
      setFormError("Full name, email, and username are required.");
      return;
    }
    try {
      setSaving(true);
      const res = await api.patch("/caretaker/profile/update", {
        fullName:      draft.fullName,
        emailAddress:  draft.emailAddress,
        contactNumber: draft.contactNumber,
        userName:      draft.userName,
      });
      if (res.data.success) {
        setProfile((p) => ({ ...p, ...res.data.caretaker }));
        updateUser(res.data.caretaker);
        setEditing(false);
        toast.success("Profile updated successfully.");
      }
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#db6747]" />
    </div>
  );

  const displayName = profile?.fullName || profile?.username || "Caretaker";
  const initial     = displayName[0]?.toUpperCase() ?? "C";

  const FIELDS = [
    { key: "fullName",      label: "Full Name",      icon: <FaUser size={14}/>,    type: "text",  draftKey: "fullName" },
    { key: "emailAddress",  label: "Email Address",  icon: <FaEnvelope size={14}/>, type: "email", draftKey: "emailAddress" },
    { key: "contactNumber", label: "Contact Number", icon: <FaPhone size={14}/>,   type: "text",  draftKey: "contactNumber" },
    { key: "username",      label: "Username",       icon: <FaIdBadge size={14}/>, type: "text",  draftKey: "userName" },
  ];

  return (
    <div className="w-full bg-[#f8fafc] p-4 md:p-6 font-sans flex flex-col gap-6 min-h-screen">

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-28 sm:h-36 bg-gradient-to-r from-[#3a0f08] to-[#db6747]" />
        <div className="px-7 pb-6 mt-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-[#3a0f08] to-[#db6747] flex items-center justify-center border-4 border-white shadow-lg shrink-0">
              <span className="text-white font-black text-3xl sm:text-4xl">{initial}</span>
            </div>
            {/* Name + role */}
            <div className="flex-1 min-w-0 mt-2 sm:mt-0 sm:pb-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{displayName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <FaUserShield size={11} className="text-[#db6747]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Caretaker</span>
                <span className="text-slate-200">·</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile?.caretaker_id}</span>
              </div>
            </div>
            {!editing && (
              <button onClick={openEdit}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#db6747] text-white text-xs font-bold hover:bg-[#c45a3a] transition-colors shadow-sm uppercase tracking-widest shrink-0">
                <FaEdit size={12}/> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info / Edit form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Personal Information</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
              {editing ? "Make your changes below" : "Your account details"}
            </p>
          </div>
          {editing && (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                <FaTimes size={11}/> Cancel
              </button>
              <button form="profile-form" type="submit" disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-60">
                <FaSave size={11}/> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <form id="profile-form" onSubmit={handleSave} className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {FIELDS.map(({ label, icon, type, draftKey }) => (
                <div key={draftKey}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                    {icon} {label}
                  </label>
                  <input type={type} value={draft[draftKey] || ""}
                    maxLength={draftKey === "contactNumber" ? 11 : undefined}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (draftKey === "contactNumber") val = val.replace(/\D/g, "").slice(0, 11);
                      setDraft((d) => ({ ...d, [draftKey]: val }));
                    }}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 transition-all"/>
                </div>
              ))}
            </div>
            {formError && (
              <div className="mt-4 bg-red-50 border-l-4 border-red-500 px-4 py-3 text-[11px] text-red-600 font-bold uppercase tracking-widest rounded-r-lg">
                {formError}
              </div>
            )}
          </form>
        ) : (
          <div className="divide-y divide-slate-100">
            {FIELDS.map(({ key, label, icon }) => (
              <div key={key} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
                <div className="p-2.5 bg-orange-50 text-[#db6747] rounded-lg shrink-0">{icon}</div>
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
  );
}
