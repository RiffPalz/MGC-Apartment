import { useState, useEffect, useCallback } from "react";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import {
  FaEye, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaFilePdf,
} from "react-icons/fa";
import toast from "../../utils/toast";
import {
  fetchTerminationRequests,
  approveTerminationRequest,
  rejectTerminationRequest,
} from "../../api/adminAPI/ContractAPI";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

const STATUS_CFG = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-green-50 text-green-700 border-green-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function AdminTerminationRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { action: "approve"|"reject", request }
  const [actioning, setActioning] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchTerminationRequests();
      if (res.success) setRequests(res.requests || []);
    } catch {
      toast.error("Failed to load termination requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useSocketEvent("termination_request_updated", load);

  const handleAction = async () => {
    if (!actionModal) return;
    try {
      setActioning(true);
      if (actionModal.action === "approve") {
        await approveTerminationRequest(actionModal.request.ID);
        toast.success("Termination request approved");
      } else {
        await rejectTerminationRequest(actionModal.request.ID);
        toast.success("Termination request rejected");
      }
      setActionModal(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setActioning(false);
    }
  };

  const counts = {
    All: requests.length,
    Pending: requests.filter(r => r.status === "Pending").length,
    Approved: requests.filter(r => r.status === "Approved").length,
    Rejected: requests.filter(r => r.status === "Rejected").length,
  };

  const filtered = statusFilter === "All" ? requests : requests.filter(r => r.status === statusFilter);

  return (
    <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 sm:gap-5 min-h-screen">
      <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-4 sm:gap-5 flex-1">

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total", value: counts.All, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Pending", value: counts.Pending, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "Approved", value: counts.Approved, color: "text-green-500", bg: "bg-green-50" },
            { label: "Rejected", value: counts.Rejected, color: "text-red-500", bg: "bg-red-50" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm">
              <div className={`p-3 ${bg} ${color} rounded-lg shrink-0`}>
                <FaExclamationTriangle size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
            {["All", "Pending", "Approved", "Rejected"].map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5
                  ${statusFilter === f ? "bg-white text-[#db6747] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                {f}
                {f === "Pending" && counts.Pending > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                    {counts.Pending}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db6747]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 flex-1">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaExclamationTriangle className="text-slate-300" size={20} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest">No termination requests</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4 font-bold">Tenant</th>
                      <th className="px-5 py-4 font-bold">Unit</th>
                      <th className="px-5 py-4 font-bold">Vacate Date</th>
                      <th className="px-5 py-4 font-bold">Submitted</th>
                      <th className="px-5 py-4 font-bold">Status</th>
                      <th className="px-5 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((r) => (
                      <tr key={r.ID} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-800">{r.tenant?.fullName ?? "—"}</p>
                          <p className="text-xs text-slate-400">{r.tenant?.emailAddress ?? ""}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-black text-[#db6747]">{r.contract?.unit?.unit_number ?? "—"}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700 font-medium whitespace-nowrap">{fmt(r.vacate_date)}</td>
                        <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{fmt(r.created_at)}</td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${STATUS_CFG[r.status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setViewModal(r)} title="View"
                              className="p-2 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95">
                              <FaEye size={13} />
                            </button>
                            {r.status === "Pending" && (
                              <>
                                <button onClick={() => setActionModal({ action: "approve", request: r })} title="Approve"
                                  className="p-2 rounded-md text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all active:scale-95">
                                  <FaCheckCircle size={13} />
                                </button>
                                <button onClick={() => setActionModal({ action: "reject", request: r })} title="Reject"
                                  className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95">
                                  <FaTimesCircle size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden flex-1 divide-y divide-slate-100">
                {filtered.map((r) => (
                  <div key={r.ID} className="p-5 space-y-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{r.tenant?.fullName ?? "—"}</p>
                        <p className="text-xs text-slate-400">{r.tenant?.emailAddress ?? ""}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border shrink-0 ${STATUS_CFG[r.status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Unit</p>
                        <p className="text-sm font-black text-[#db6747]">{r.contract?.unit?.unit_number ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Vacate Date</p>
                        <p className="text-xs font-medium text-slate-700">{fmt(r.vacate_date)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setViewModal(r)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold active:scale-[0.98]">
                        <FaEye size={12} /> View
                      </button>
                      {r.status === "Pending" && (
                        <>
                          <button onClick={() => setActionModal({ action: "approve", request: r })}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-50 text-green-600 border border-green-100 rounded-lg text-[10px] font-bold active:scale-[0.98]">
                            <FaCheckCircle size={12} /> Approve
                          </button>
                          <button onClick={() => setActionModal({ action: "reject", request: r })}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold active:scale-[0.98]">
                            <FaTimesCircle size={12} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Termination Request</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">Unit {viewModal.contract?.unit?.unit_number ?? "—"}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-slate-800 text-lg px-2 active:scale-90">✕</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Tenant</p>
                  <p className="text-sm font-bold text-slate-800">{viewModal.tenant?.fullName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Status</p>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${STATUS_CFG[viewModal.status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {viewModal.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Lessee Name</p>
                  <p className="text-sm text-slate-700">{viewModal.lessee_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Vacate Date</p>
                  <p className="text-sm text-slate-700">
                    {viewModal.vacate_date ? new Date(viewModal.vacate_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Address</p>
                  <p className="text-sm text-slate-700">{viewModal.lessee_address}</p>
                </div>
              </div>
              {viewModal.request_pdf && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">Request Letter PDF</p>
                  <a href={viewModal.request_pdf} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all shadow-sm active:scale-95">
                    <FaFilePdf size={12} /> View PDF
                  </a>
                </div>
              )}
              {viewModal.status === "Pending" && (
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button onClick={() => { setViewModal(null); setActionModal({ action: "reject", request: viewModal }); }}
                    className="flex-1 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95">
                    Reject
                  </button>
                  <button onClick={() => { setViewModal(null); setActionModal({ action: "approve", request: viewModal }); }}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-all active:scale-95">
                    Approve
                  </button>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button onClick={() => setViewModal(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest active:scale-95">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION CONFIRM */}
      <GeneralConfirmationModal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        onConfirm={handleAction}
        variant={actionModal?.action === "approve" ? "approve" : "reject"}
        title={actionModal?.action === "approve" ? "Approve Termination Request" : "Reject Termination Request"}
        message={actionModal
          ? actionModal.action === "approve"
            ? <>Approving will update the contract end date to <span className="font-bold text-slate-900">{fmt(actionModal.request.vacate_date)}</span> for Unit <span className="font-bold text-slate-900">{actionModal.request.contract?.unit?.unit_number}</span>. The contract will be completed on that date.</>
            : <>Reject the termination request from <span className="font-bold text-slate-900">{actionModal.request.tenant?.fullName}</span>?</>
          : null}
        confirmText={actionModal?.action === "approve" ? "Approve" : "Reject"}
        loading={actioning}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #db6747; border-radius: 10px; }
      `}</style>
    </div>
  );
}
