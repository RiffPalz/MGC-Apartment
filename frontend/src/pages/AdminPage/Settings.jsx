import { useState, useEffect, useCallback } from "react";
import {
  FaUsers, FaPlus, FaTrashAlt, FaEye, FaEyeSlash,
  FaUserTie, FaSearch, FaChevronLeft, FaChevronRight,
  FaEdit, FaSave, FaTimes, FaBuilding, FaEnvelope, FaMapMarkerAlt, FaTag,
} from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import { toast } from "react-toastify";
import api from "../../api/config";
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

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "---";

const ROLE_CFG = {
  admin: { color: "bg-red-50 text-red-700 border-red-200", label: "Admin" },
  caretaker: { color: "bg-teal-50 text-teal-700 border-teal-200", label: "Caretaker" },
};

const EMPTY_FORM = { fullName: "", emailAddress: "", contactNumber: "", userName: "", password: "" };
const PAGE_SIZE = 8;

export default function AdminSettings() {
  const [tab, setTab] = useState("staff");
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [addModal, setAddModal] = useState(null); // "admin" | "caretaker"
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // System Info state
  const [sysInfo, setSysInfo] = useState(loadSysInfo);
  const [sysEdit, setSysEdit] = useState(false);
  const [sysDraft, setSysDraft] = useState({ ...SYSINFO_DEFAULTS });

  const openSysEdit = () => { setSysDraft({ ...sysInfo }); setSysEdit(true); };
  const cancelSysEdit = () => setSysEdit(false);
  const saveSysInfo = () => {
    if (!sysDraft.systemName.trim() || !sysDraft.contactEmail.trim() || !sysDraft.address.trim()) {
      toast.error("All fields are required.");
      return;
    }
    const updated = { ...sysDraft };
    setSysInfo(updated);
    localStorage.setItem(SYSINFO_KEY, JSON.stringify(updated));
    setSysEdit(false);
    toast.success("System info updated.");
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/staff");
      if (res.data.success) setStaff(res.data.staff || []);
    } catch {
      toast.error("Failed to load staff.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = (role) => {
    setAddModal(role);
    setForm(EMPTY_FORM);
    setShowPass(false);
    setFormError("");
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      setSubmitting(true);
      const endpoint = addModal === "admin" ? "/admin/admin" : "/admin/caretaker";
      await api.post(endpoint, form);
      toast.success(`${addModal === "admin" ? "Admin" : "Caretaker"} created successfully.`);
      setAddModal(null);
      load();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/users/${deleteTarget.ID}`);
      toast.success("User removed successfully.");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const admins = staff.filter((s) => s.role === "admin");
  const caretakers = staff.filter((s) => s.role === "caretaker");

  const filtered = staff.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.fullName?.toLowerCase().includes(q) ||
      s.userName?.toLowerCase().includes(q) ||
      s.emailAddress?.toLowerCase().includes(q);
    const matchRole = roleFilter === "All" || s.role === roleFilter.toLowerCase();
    return matchSearch && matchRole;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SYSINFO_FIELDS = [
    { key: "systemName", label: "System Name", icon: <FaBuilding size={15} />, color: "bg-blue-50 text-blue-500" },
    { key: "version", label: "Version", icon: <FaTag size={15} />, color: "bg-purple-50 text-purple-500" },
    { key: "contactEmail", label: "Contact Email", icon: <FaEnvelope size={15} />, color: "bg-amber-50 text-amber-500" },
    { key: "address", label: "Address", icon: <FaMapMarkerAlt size={15} />, color: "bg-teal-50 text-teal-500" },
  ];

  return (
    <>
      <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 min-h-screen">

        {/* STAT CARDS — always visible */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<FaUsers size={18} />} label="Total Staff" value={staff.length} color="text-blue-500" bg="bg-blue-50" />
          <StatCard icon={<FaUserTie size={18} />} label="Admins" value={admins.length} color="text-red-500" bg="bg-red-50" />
          <StatCard icon={<MdAdminPanelSettings size={20} />} label="Caretakers" value={caretakers.length} color="text-teal-500" bg="bg-teal-50" />
        </div>

        {/* TABS + ACTIONS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {[["staff", "Staff Management"], ["system", "System Info"]].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
                    ${tab === key ? "bg-white text-[#db6747] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                  {label}
                </button>
              ))}
            </div>
            {tab === "staff" && (
              <div className="flex gap-2">
                <button onClick={() => openAdd("caretaker")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-teal-500 text-white hover:bg-teal-600 transition-all shadow-sm">
                  <FaPlus size={11} /> <span className="uppercase tracking-widest">Add Caretaker</span>
                </button>
                <button onClick={() => openAdd("admin")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all shadow-sm">
                  <FaPlus size={11} /> <span className="uppercase tracking-widest">Add Admin</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* STAFF TAB */}
        {tab === "staff" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1">

            {/* Search + Filter toolbar */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Search name, username, or email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-all"
                />
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {["All", "Admin", "Caretaker"].map((f) => (
                  <button key={f} onClick={() => { setRoleFilter(f); setPage(1); }}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
                      ${roleFilter === f ? "bg-white text-[#db6747] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-bold">Full Name</th>
                    <th className="px-5 py-4 font-bold">Username</th>
                    <th className="px-5 py-4 font-bold">Email</th>
                    <th className="px-5 py-4 font-bold">Contact</th>
                    <th className="px-5 py-4 font-bold">Role</th>
                    <th className="px-5 py-4 font-bold">Added</th>
                    <th className="px-5 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={7} className="py-24 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db6747] mx-auto mb-3" />
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Loading...</p>
                    </td></tr>
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={7} className="py-24 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FaUsers className="text-slate-300" size={20} />
                      </div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No staff found</p>
                    </td></tr>
                  ) : paginated.map((s) => (
                    <tr key={s.ID} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0
                            ${s.role === "admin" ? "bg-red-50 text-red-500" : "bg-teal-50 text-teal-500"}`}>
                            {(s.fullName || "?")[0].toUpperCase()}
                          </div>
                          <p className="text-sm font-bold text-slate-800">{s.fullName}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">@{s.userName}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">{s.emailAddress}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">{s.contactNumber || "---"}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${ROLE_CFG[s.role]?.color}`}>
                          {ROLE_CFG[s.role]?.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400">{fmt(s.created_at)}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button title="Remove user" onClick={() => setDeleteTarget(s)}
                            className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                            <FaTrashAlt size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && filtered.length > PAGE_SIZE && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50 gap-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Showing <span className="text-slate-700">{(page - 1) * PAGE_SIZE + 1}</span> – <span className="text-slate-700">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="text-slate-700">{filtered.length}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all">
                    <FaChevronLeft size={12} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === "..." ? (
                        <span key={`e-${idx}`} className="px-2 text-slate-400 text-xs">…</span>
                      ) : (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-7 h-7 rounded-md text-xs font-bold transition-all
                            ${page === p ? "bg-[#db6747] text-white shadow-sm" : "text-slate-500 hover:bg-white hover:border hover:border-slate-200 border border-transparent"}`}>
                          {p}
                        </button>
                      )
                    )}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all">
                    <FaChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SYSTEM INFO TAB */}
        {tab === "system" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">System Information</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Building & contact details</p>
              </div>
              {!sysEdit ? (
                <button onClick={openSysEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all shadow-sm">
                  <FaEdit size={11} /> <span className="uppercase tracking-widest">Edit</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={cancelSysEdit}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                    <FaTimes size={11} /> <span className="uppercase tracking-widest">Cancel</span>
                  </button>
                  <button onClick={saveSysInfo}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm">
                    <FaSave size={11} /> <span className="uppercase tracking-widest">Save</span>
                  </button>
                </div>
              )}
            </div>

            {/* Fields */}
            <div className="divide-y divide-slate-100">
              {SYSINFO_FIELDS.map(({ key, label, icon, color }) => (
                <div key={key} className="flex items-center gap-5 px-6 py-5 hover:bg-slate-50/60 transition-colors">
                  <div className={`p-3 rounded-xl shrink-0 ${color}`}>{icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    {sysEdit ? (
                      <input
                        type={key === "contactEmail" ? "email" : "text"}
                        value={sysDraft[key]}
                        onChange={(e) => setSysDraft((d) => ({ ...d, [key]: e.target.value }))}
                        className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800">{sysInfo[key]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ADD MODAL */}
      {addModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">
                  Add {addModal === "admin" ? "Admin" : "Caretaker"}
                </h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">Account will be created as Approved</p>
              </div>
              <button onClick={() => setAddModal(null)} className="text-slate-400 hover:text-slate-800 text-lg px-2">✕</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Full Name</label>
                  <input required type="text" value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    placeholder="Juan Dela Cruz"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Email</label>
                  <input required type="email" value={form.emailAddress}
                    onChange={(e) => setForm((f) => ({ ...f, emailAddress: e.target.value }))}
                    placeholder="email@mgc.com"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Contact</label>
                  <input type="text" value={form.contactNumber}
                    onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))}
                    placeholder="09XXXXXXXXX"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Username</label>
                  <input required type="text" value={form.userName}
                    onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
                    placeholder="unique_username"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Password</label>
                  <div className="relative">
                    <input required type={showPass ? "text" : "password"} value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-9 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50" />
                    <button type="button" onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#db6747]">
                      {showPass ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3 text-[11px] text-red-600 font-bold uppercase tracking-widest rounded-r-lg">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setAddModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className={`px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-colors shadow-sm disabled:opacity-60
                    ${addModal === "admin" ? "bg-[#db6747] hover:bg-[#c45a3a]" : "bg-teal-500 hover:bg-teal-600"}`}>
                  {submitting ? "Creating..." : `Create ${addModal === "admin" ? "Admin" : "Caretaker"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      <GeneralConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="delete"
        title="Remove User"
        message={deleteTarget ? <>Remove <span className="font-bold text-slate-900">{deleteTarget.fullName}</span>{" "}<span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${ROLE_CFG[deleteTarget.role]?.color}`}>{ROLE_CFG[deleteTarget.role]?.label}</span>? This cannot be undone.</> : null}
        confirmText="Confirm Remove"
        loading={deleting}
      />
    </>
  );
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
      <div className={`p-3.5 ${bg} ${color} rounded-lg shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
      </div>
    </div>
  );
}
