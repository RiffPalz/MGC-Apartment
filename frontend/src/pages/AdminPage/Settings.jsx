import { useState, useEffect, useCallback } from "react";
import {
  FaUsers, FaPlus, FaTrashAlt, FaEye, FaEyeSlash,
  FaUserTie, FaSearch, FaChevronLeft, FaChevronRight,
  FaEdit, FaSave, FaTimes, FaBuilding, FaEnvelope, FaMapMarkerAlt, FaTag,
} from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import toast from "../../utils/toast";
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

  // Modals / Confirmation States
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [addModal, setAddModal] = useState(null); // "admin" | "caretaker"
  const [confirmAdd, setConfirmAdd] = useState(false);
  const [confirmSysEdit, setConfirmSysEdit] = useState(false);

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

  // Intercept System Info Save
  const handlePreSaveSysInfo = () => {
    if (!sysDraft.systemName.trim() || !sysDraft.contactEmail.trim() || !sysDraft.address.trim()) {
      toast.error("All fields are required.");
      return;
    }
    setConfirmSysEdit(true);
  };

  const executeSaveSysInfo = () => {
    const updated = { ...sysDraft };
    setSysInfo(updated);
    localStorage.setItem(SYSINFO_KEY, JSON.stringify(updated));
    setSysEdit(false);
    setConfirmSysEdit(false);
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

  // Intercept Form Submit
  const handlePreAdd = (e) => {
    e.preventDefault();
    setFormError("");
    setConfirmAdd(true);
  };

  const executeAdd = async () => {
    try {
      setSubmitting(true);
      const endpoint = addModal === "admin" ? "/admin/admin" : "/admin/caretaker";
      await api.post(endpoint, form);
      toast.success(`${addModal === "admin" ? "Admin" : "Caretaker"} created successfully.`);
      setConfirmAdd(false);
      setAddModal(null);
      load();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to create user.");
      setConfirmAdd(false);
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
      <div className="w-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 min-h-screen overflow-x-hidden">

        {/* 4K Containment Wrapper */}
        <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-4 sm:gap-5 flex-1">

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={<FaUsers size={18} />} label="Total Staff" value={staff.length} color="text-blue-500" bg="bg-blue-50" />
            <StatCard icon={<FaUserTie size={18} />} label="Admins" value={admins.length} color="text-red-500" bg="bg-red-50" />
            <StatCard icon={<MdAdminPanelSettings size={20} />} label="Caretakers" value={caretakers.length} color="text-teal-500" bg="bg-teal-50" />
          </div>

          {/* TABS + ACTIONS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
                {[["staff", "Staff Management"], ["system", "System Info"]].map(([key, label]) => (
                  <button key={key} onClick={() => setTab(key)}
                    className={`flex-1 sm:flex-none px-4 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap
                      ${tab === key ? "bg-white text-[#db6747] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                    {label}
                  </button>
                ))}
              </div>
              {tab === "staff" && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => openAdd("caretaker")}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-teal-500 text-white hover:bg-teal-600 transition-all shadow-sm active:scale-95">
                    <FaPlus size={11} /> <span className="uppercase tracking-widest">Add Caretaker</span>
                  </button>
                  <button onClick={() => openAdd("admin")}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all shadow-sm active:scale-95">
                    <FaPlus size={11} /> <span className="uppercase tracking-widest">Add Admin</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TAB CONTENT: STAFF */}
          {tab === "staff" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">

              {/* Search + Filter toolbar */}
              <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder="Search name, username, or email..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 hover:bg-white transition-all shadow-sm"
                  />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
                  {["All", "Admin", "Caretaker"].map((f) => (
                    <button key={f} onClick={() => { setRoleFilter(f); setPage(1); }}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
                        ${roleFilter === f ? "bg-white text-[#db6747] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table / Mobile Cards */}
              <div className="flex-1 flex flex-col">
                {loading ? (
                  <div className="py-24 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db6747] mx-auto mb-3" />
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Loading...</p>
                  </div>
                ) : paginated.length === 0 ? (
                  <div className="py-24 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaUsers className="text-slate-300" size={20} />
                    </div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No staff found</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto flex-1">
                      <table className="w-full text-left whitespace-nowrap">
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
                          {paginated.map((s) => (
                            <tr key={s.ID} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0
                                    ${s.role === "admin" ? "bg-red-50 text-red-500" : "bg-teal-50 text-teal-500"}`}>
                                    {(s.fullName || "?")[0].toUpperCase()}
                                  </div>
                                  <p className="text-sm font-bold text-slate-800">{s.fullName}</p>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-500">@{s.userName}</td>
                              <td className="px-5 py-4 text-sm text-slate-500">{s.emailAddress}</td>
                              <td className="px-5 py-4 text-sm text-slate-500">{s.contactNumber || "---"}</td>
                              <td className="px-5 py-4">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${ROLE_CFG[s.role]?.color}`}>
                                  {ROLE_CFG[s.role]?.label}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-400 font-medium">{fmt(s.created_at)}</td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button title="Remove user" onClick={() => setDeleteTarget(s)}
                                    className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95">
                                    <FaTrashAlt size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="lg:hidden flex-1 overflow-y-auto divide-y divide-slate-100 bg-slate-50/30">
                      {paginated.map((s) => (
                        <div key={s.ID} className="p-5 space-y-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border
                                ${s.role === "admin" ? "bg-red-50 text-red-500 border-red-100" : "bg-teal-50 text-teal-500 border-teal-100"}`}>
                                {(s.fullName || "?")[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-base font-bold text-slate-800 truncate">{s.fullName}</p>
                                <p className="text-xs text-slate-500 truncate">@{s.userName}</p>
                              </div>
                            </div>
                            <span className={`shrink-0 text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border ${ROLE_CFG[s.role]?.color}`}>
                              {ROLE_CFG[s.role]?.label}
                            </span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-3">
                            <div className="min-w-0">
                              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Contact</p>
                              <p className="text-xs text-slate-700 truncate">{s.contactNumber || "—"}</p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Added On</p>
                              <p className="text-xs text-slate-700 truncate">{fmt(s.created_at)}</p>
                            </div>
                            <div className="col-span-2 min-w-0 pt-2 border-t border-slate-50">
                              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Email</p>
                              <p className="text-xs text-slate-700 truncate">{s.emailAddress}</p>
                            </div>
                          </div>
                          <div className="flex justify-end pt-1">
                            <button onClick={() => setDeleteTarget(s)}
                              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold active:scale-[0.98] transition-transform w-full sm:w-auto">
                              <FaTrashAlt size={12} /> Remove User
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Pagination */}
              {!loading && filtered.length > PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50 gap-4 shrink-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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

          {/* TAB CONTENT: SYSTEM INFO */}
          {tab === "system" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/50 gap-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">System Information</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Building & contact details</p>
                </div>
                {!sysEdit ? (
                  <button onClick={openSysEdit}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all shadow-sm active:scale-95 w-full sm:w-auto">
                    <FaEdit size={11} /> <span className="uppercase tracking-widest">Edit Details</span>
                  </button>
                ) : (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={cancelSysEdit}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95">
                      <FaTimes size={11} /> <span className="uppercase tracking-widest">Cancel</span>
                    </button>
                    <button onClick={handlePreSaveSysInfo}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm active:scale-95">
                      <FaSave size={11} /> <span className="uppercase tracking-widest">Save</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="divide-y divide-slate-100">
                {SYSINFO_FIELDS.map(({ key, label, icon, color }) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 px-6 py-5 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3 sm:w-48 shrink-0">
                      <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      {sysEdit ? (
                        <input
                          type={key === "contactEmail" ? "email" : "text"}
                          value={sysDraft[key]}
                          onChange={(e) => setSysDraft((d) => ({ ...d, [key]: e.target.value }))}
                          className="w-full text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all shadow-sm"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-800 sm:px-2 break-words">{sysInfo[key]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE USER MODAL (FORM) ── */}
      {addModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div>
                <h2 className="text-slate-800 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                  <FaPlus className={addModal === "admin" ? "text-[#db6747]" : "text-teal-500"} />
                  Add {addModal === "admin" ? "Admin" : "Caretaker"}
                </h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">Account will be created instantly</p>
              </div>
              <button onClick={() => setAddModal(null)} className="text-slate-400 hover:text-slate-800 text-lg px-2 active:scale-90">✕</button>
            </div>

            <div className={`h-1 shrink-0 ${addModal === "admin" ? "bg-[#db6747]" : "bg-teal-500"}`} />

            <form onSubmit={handlePreAdd} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Full Name</label>
                  <input required type="text" value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    placeholder="Juan Dela Cruz"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 transition-colors shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Email Address</label>
                  <input required type="email" value={form.emailAddress}
                    onChange={(e) => setForm((f) => ({ ...f, emailAddress: e.target.value }))}
                    placeholder="email@mgc.com"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 transition-colors shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Contact Number</label>
                  <input type="text" value={form.contactNumber}
                    onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))}
                    placeholder="09XXXXXXXXX"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 transition-colors shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Username</label>
                  <input required type="text" value={form.userName}
                    onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
                    placeholder="unique_username"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 transition-colors shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Password</label>
                  <div className="relative">
                    <input required minLength={6} type={showPass ? "text" : "password"} value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] bg-slate-50 transition-colors shadow-sm" />
                    <button type="button" onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#db6747] p-1">
                      {showPass ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3 text-[11px] text-red-600 font-bold uppercase tracking-widest rounded-r-lg mt-2">
                  {formError}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-6 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setAddModal(null)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors w-full sm:w-auto">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className={`px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-60 w-full sm:w-auto uppercase tracking-wider
                    ${addModal === "admin" ? "bg-[#db6747] hover:bg-[#c45a3a] shadow-[#db6747]/30" : "bg-teal-500 hover:bg-teal-600 shadow-teal-500/30"}`}>
                  {submitting ? "Creating..." : `Create ${addModal === "admin" ? "Admin" : "Caretaker"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRMATIONS MODALS ── */}

      {/* Add User Confirmation */}
      <GeneralConfirmationModal
        isOpen={confirmAdd}
        onClose={() => setConfirmAdd(false)}
        onConfirm={executeAdd}
        variant="save"
        title={`Create ${addModal === "admin" ? "Admin" : "Caretaker"} Account`}
        message={`Are you sure you want to create a new ${addModal} account for ${form.fullName || "this user"}?`}
        confirmText="Yes, Create Account"
        loading={submitting}
      />

      {/* System Info Confirmation */}
      <GeneralConfirmationModal
        isOpen={confirmSysEdit}
        onClose={() => setConfirmSysEdit(false)}
        onConfirm={executeSaveSysInfo}
        variant="save"
        title="Update System Settings"
        message="Are you sure you want to save changes to the building's global system information?"
        confirmText="Save Settings"
      />

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
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3.5 ${bg} ${color} rounded-lg shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-none truncate">{value}</p>
      </div>
    </div>
  );
}