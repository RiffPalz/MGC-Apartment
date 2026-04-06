import { useState, useEffect, useCallback } from "react";
import { useSocketEvent } from "../../hooks/useSocketEvent";import {
  FaSearch, FaEye, FaCheckCircle, FaTimesCircle,
  FaUserClock, FaUsers, FaChevronLeft, FaChevronRight,
  FaEnvelope, FaPhone, FaUser, FaIdBadge, FaHome, FaUserPlus
} from "react-icons/fa";
import toast from "../../utils/toast";
import { fetchPendingUsers, updateUserApproval } from "../../api/adminAPI/AccountApprovalAPI";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

const PAGE_SIZE = 10;

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) : "";

export default function AdminAccountApproval() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewModal, setViewModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { user, action: "Approved"|"Declined" }
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchPendingUsers();
      if (res.success) setUsers(res.users || []);
    } catch {
      toast.error("Failed to load pending accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useSocketEvent("tenants_updated", load);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.emailAddress?.toLowerCase().includes(q) ||
      u.userName?.toLowerCase().includes(q) ||
      u.contactNumber?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Dynamically calculate how many pending requests came in today
  const newTodayCount = users.filter((u) => {
    if (!u.created_at) return false;
    return new Date(u.created_at).toDateString() === new Date().toDateString();
  }).length;

  const handleApproval = async () => {
    if (!confirmModal) return;
    try {
      setProcessing(true);
      await updateUserApproval(confirmModal.user.ID, confirmModal.action);
      toast.success(`Account ${confirmModal.action.toLowerCase()} successfully.`);
      setConfirmModal(null);
      setViewModal(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Action failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 sm:gap-5 min-h-screen overflow-x-hidden">

        {/* 4K Containment Wrapper */}
        <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-4 sm:gap-5 flex-1">

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard icon={<FaUserClock size={18} />} label="Pending Approvals" value={users.length} color="text-amber-500" bg="bg-amber-50" />
            <StatCard icon={<FaUserPlus size={18} />} label="New Today" value={newTodayCount} color="text-emerald-500" bg="bg-emerald-50" />
            <StatCard icon={<FaUsers size={18} />} label="Showing" value={filtered.length} color="text-blue-500" bg="bg-blue-50" />
          </div>

          {/* TOOLBAR */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative flex-1 max-w-md w-full">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search by name, email, or username..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white shadow-sm"
                />
              </div>
              <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap w-full md:w-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:inline whitespace-nowrap">
                  {filtered.length} pending
                </span>
                <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block" />
                <button
                  onClick={load}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm uppercase tracking-widest active:scale-95"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* TABLE & MOBILE CARDS CONTAINER */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-bold">#</th>
                    <th className="px-5 py-4 font-bold">Applicant</th>
                    <th className="px-5 py-4 font-bold">Username</th>
                    <th className="px-5 py-4 font-bold">Contact</th>
                    <th className="px-5 py-4 font-bold">Unit</th>
                    <th className="px-5 py-4 font-bold">Registered</th>
                    <th className="px-5 py-4 font-bold">Status</th>
                    <th className="px-5 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-5 py-4"><div className="h-4 w-28 bg-slate-200 rounded mb-1" /><div className="h-3 w-20 bg-slate-100 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-10 bg-slate-100 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                        <td className="px-5 py-4 text-right"><div className="h-6 w-16 bg-slate-100 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-24 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                          <FaUserClock className="text-slate-300" size={20} />
                        </div>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No pending accounts</p>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((u, idx) => (
                      <tr key={u.ID} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-400">{(page - 1) * PAGE_SIZE + idx + 1}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#db6747] flex items-center justify-center font-black text-sm shrink-0 border border-orange-100">
                              {(u.fullName || u.userName || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{u.fullName || u.userName}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{u.emailAddress}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-600">@{u.userName}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-600">{u.contactNumber || "—"}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-[#db6747]">{u.unitNumber || "—"}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-xs text-slate-700 font-semibold">{fmt(u.created_at)}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{fmtTime(u.created_at)}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200">
                            Pending
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              title="View Details"
                              onClick={() => setViewModal(u)}
                              className="p-2 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all active:scale-95"
                            >
                              <FaEye size={14} />
                            </button>
                            <button
                              title="Approve"
                              onClick={() => setConfirmModal({ user: u, action: "Approved" })}
                              className="p-2 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all active:scale-95"
                            >
                              <FaCheckCircle size={14} />
                            </button>
                            <button
                              title="Decline"
                              onClick={() => setConfirmModal({ user: u, action: "Declined" })}
                              className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all active:scale-95"
                            >
                              <FaTimesCircle size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden flex-1 overflow-y-auto divide-y divide-slate-100 bg-slate-50/30">
              {loading ? (
                <div className="divide-y divide-slate-100 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-4 bg-slate-200 rounded w-2/3" />
                          <div className="h-3 bg-slate-100 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-100">
                        <div className="h-8 bg-slate-100 rounded" />
                        <div className="h-8 bg-slate-100 rounded" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
                        <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
                        <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : paginated.length === 0 ? (
                <div className="py-24 text-center px-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                    <FaUserClock className="text-slate-300" size={20} />
                  </div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No pending accounts</p>
                </div>
              ) : (
                paginated.map((u) => (
                  <div key={u.ID} className="p-5 space-y-4 hover:bg-white transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#db6747] to-[#e8845f] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                          {(u.fullName || u.userName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-black text-slate-800 truncate leading-tight">{u.fullName || u.userName}</p>
                          <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{u.emailAddress}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200">
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5 flex items-center gap-1"><FaPhone size={9} /> Phone</p>
                        <p className="text-sm font-semibold text-slate-700 truncate">{u.contactNumber || "—"}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5 flex items-center gap-1"><FaHome size={9} /> Unit</p>
                        <p className="text-sm font-semibold text-[#db6747] truncate">{u.unitNumber || "—"}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button onClick={() => setViewModal(u)}
                        className="flex-1 min-w-[30%] flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold active:scale-[0.98] transition-transform">
                        <FaEye size={12} /> View
                      </button>
                      <button onClick={() => setConfirmModal({ user: u, action: "Declined" })}
                        className="flex-1 min-w-[30%] flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold active:scale-[0.98] transition-transform">
                        <FaTimesCircle size={12} /> Decline
                      </button>
                      <button onClick={() => setConfirmModal({ user: u, action: "Approved" })}
                        className="flex-1 min-w-[30%] flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold active:scale-[0.98] transition-transform">
                        <FaCheckCircle size={12} /> Approve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {!loading && filtered.length > PAGE_SIZE && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50 gap-4 shrink-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Showing <span className="text-slate-700">{(page - 1) * PAGE_SIZE + 1}</span> to{" "}
                  <span className="text-slate-700">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                  <span className="text-slate-700">{filtered.length}</span>
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
                          className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${page === p ? "bg-[#db6747] text-white shadow-sm shadow-orange-200" : "text-slate-500 hover:bg-white hover:border hover:border-slate-200 border border-transparent"}`}>
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
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div>
                <h2 className="text-slate-800 font-bold text-sm uppercase tracking-widest">Account Details</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5 font-semibold">{viewModal.publicUserID}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-slate-800 transition-colors text-lg px-2 active:scale-90 bg-white rounded-md border border-slate-200 shadow-sm w-8 h-8 flex items-center justify-center">✕</button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {/* Applicant Header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 shadow-sm hidden sm:flex">
                  <FaUser className="text-amber-500" size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-black text-slate-900 leading-tight">{viewModal.fullName}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                    <FaUserClock size={10} className="text-slate-400" />
                    Registered {fmt(viewModal.created_at)} at {fmtTime(viewModal.created_at)}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200">
                  Pending
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailRow icon={<FaEnvelope size={12} />} label="Email Address" value={viewModal.emailAddress} />
                <DetailRow icon={<FaPhone size={12} />} label="Contact Number" value={viewModal.contactNumber || "—"} />
                <DetailRow icon={<FaIdBadge size={12} />} label="Username" value={`@${viewModal.userName}`} />
                <DetailRow icon={<FaHome size={12} />} label="Unit Number" value={viewModal.unitNumber || "Not specified"} />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row gap-3 shrink-0">
              <button onClick={() => setViewModal(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white hover:border-slate-300 shadow-sm transition-all active:scale-95">
                Close
              </button>
              <div className="flex-1 flex gap-3">
                <button
                  onClick={() => { setConfirmModal({ user: viewModal, action: "Declined" }); setViewModal(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold hover:bg-red-100 shadow-sm transition-all active:scale-95"
                >
                  <FaTimesCircle size={14} /> Decline
                </button>
                <button
                  onClick={() => { setConfirmModal({ user: viewModal, action: "Approved" }); setViewModal(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 shadow-md shadow-emerald-200 transition-all active:scale-95"
                >
                  <FaCheckCircle size={14} /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      <GeneralConfirmationModal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        onConfirm={handleApproval}
        variant={confirmModal?.action === "Approved" ? "approve" : "reject"}
        title={confirmModal?.action === "Approved" ? "Approve Account" : "Decline Account"}
        message={confirmModal
          ? confirmModal.action === "Approved"
            ? <>Grant portal access to <span className="font-bold text-slate-900">{confirmModal.user.fullName}</span>? They will be able to log in immediately.</>
            : <>Decline the account request from <span className="font-bold text-slate-900">{confirmModal.user.fullName}</span>? They will not be able to access the portal.</>
          : null}
        confirmText={confirmModal?.action === "Approved" ? "Confirm Approval" : "Confirm Decline"}
        loading={processing}
      />
    </>
  );
}

/* ── Sub-components ── */

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3.5 sm:p-4 ${bg} ${color} rounded-xl shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-none truncate">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
      <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 font-bold">
        {icon} {label}
      </p>
      <p className="text-sm font-semibold text-slate-800 break-words">{value || "—"}</p>
    </div>
  );
}