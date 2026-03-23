import { useState, useEffect } from "react";
import {
  FaSearch, FaPrint, FaEye, FaTrashAlt,
  FaUsers, FaCheckCircle, FaTimesCircle, FaChevronLeft, FaChevronRight,
  FaFileContract
} from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchTenantsOverview, deleteTenant } from "../../api/adminAPI/tenantOverviewAPI";
import logo from "../../assets/images/logo.png";

const PAGE_SIZE = 10;

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

const PRINT_COLS = ["Unit No.", "Username", "Full Name", "Email", "Contact No.", "Occupancy", "Move-in Date", "Lease End", "Lease Status"];

export default function AdminTenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [leaseFilter, setLeaseFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchTenantsOverview();
      setTenants(res.tenants || []);
    } catch {
      toast.error("Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = tenants.map((t) => {
    const contract = t.contracts?.[0] ?? null;
    const unit = contract?.unit ?? null;
    return {
      id: t.ID,
      unitNumber: unit?.unit_number ?? t.unitNumber ?? "—",
      userName: t.userName,
      fullName: t.fullName,
      email: t.emailAddress,
      contact: t.contactNumber ?? "—",
      occupancy: t.numberOfTenants ?? "—",
      moveIn: contract?.start_date ?? null,
      leaseEnd: contract?.end_date ?? null,
      leaseStatus: contract?.status ?? null,
    };
  });

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.fullName.toLowerCase().includes(q) ||
      r.userName.toLowerCase().includes(q) ||
      String(r.unitNumber).includes(q) ||
      r.email.toLowerCase().includes(q);
    const matchLease =
      leaseFilter === "All" ||
      r.leaseStatus === leaseFilter ||
      (!r.leaseStatus && leaseFilter === "No Contract");
    return matchSearch && matchLease;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteTenant(deleteTarget.id);
      toast.success(`${deleteTarget.fullName} removed.`);
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = rows.filter((r) => r.leaseStatus === "Active").length;
  const noContractCount = rows.filter((r) => !r.leaseStatus).length;

  return (
    <>
      {/* ── PRINT STYLES ── */}
      <style>{`
        @media print {
          /* Force landscape orientation and clean margins for tables */
          @page { size: A4 landscape; margin: 15mm; }
          
          body { background: white !important; }
          body * { visibility: hidden; }
          
          #tenant-print-area, #tenant-print-area * {
            visibility: visible;
          }
          
          #tenant-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
            color: #0f172a;
          }
          
          /* Force the printer to render background colors and text colors */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── HIDDEN PRINT AREA ── */}
      <div id="tenant-print-area" className="hidden print:block">

        {/* Document Header */}
        <div className="flex justify-between items-end border-b-[3px] border-slate-900 pb-5 mb-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="MGC Logo" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none mb-1">MGC BUILDING</h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#db6747]">Tenant Summary Report</p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500 flex flex-col gap-1.5">
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Date Generated:</span> {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Department:</span> Property Management Office</p>
          </div>
        </div>

        {/* Filters Context */}
        {leaseFilter !== "All" && (
          <div className="mb-4 inline-block bg-slate-100 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest text-slate-600 border border-slate-200">
            Applied Filter: {leaseFilter} Leases
          </div>
        )}

        {/* Data Table */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {PRINT_COLS.map((h) => (
                <th key={h} className="pb-3 pt-2 px-3 border-b-2 border-slate-300 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                <td className="py-2.5 px-3 text-[11px] font-black text-slate-900">{r.unitNumber}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">@{r.userName}</td>
                <td className="py-2.5 px-3 text-[11px] font-bold text-slate-800">{r.fullName}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{r.email}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{r.contact}</td>
                <td className="py-2.5 px-3 text-[11px] text-center font-bold text-slate-700">{r.occupancy}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{fmt(r.moveIn)}</td>
                <td className="py-2.5 px-3 text-[11px] text-slate-600">{fmt(r.leaseEnd)}</td>
                <td className="py-2.5 px-3 text-[11px]">
                  <span className={`font-bold uppercase tracking-wider ${r.leaseStatus === 'Active' ? 'text-emerald-600' : r.leaseStatus === 'Terminated' ? 'text-red-600' : 'text-slate-500'}`}>
                    {r.leaseStatus ?? "No contract"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Document Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[9px] uppercase tracking-widest text-slate-400 font-bold">
          <p>Total Records: <span className="text-slate-800 text-[11px] ml-1">{filtered.length}</span></p>
          <p>MGC Building — Enterprise Property Management System</p>
          <p className="text-right">CONFIDENTIAL</p>
        </div>
      </div>

      {/* ── SCREEN UI ── */}
      <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 no-print min-h-screen">

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<FaUsers size={18} />} label="Total Tenants" value={rows.length} color="text-blue-500" bg="bg-blue-50" />
          <StatCard icon={<FaCheckCircle size={18} />} label="Active Leases" value={activeCount} color="text-emerald-500" bg="bg-emerald-50" />
          <StatCard icon={<FaFileContract size={18} />} label="No Contract" value={noContractCount} color="text-slate-500" bg="bg-slate-100" />
        </div>

        {/* TOOLBAR */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search tenant, unit, or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white"
              />
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {["All", "Active", "Completed", "Terminated", "No Contract"].map((f) => (
                  <button
                    key={f}
                    onClick={() => { setLeaseFilter(f); setPage(1); }}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
                      ${leaseFilter === f ? "bg-white text-[#db6747] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
              >
                <FaPrint size={12} /> <span className="uppercase tracking-widest">Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4 font-bold">Unit</th>
                  <th className="px-5 py-4 font-bold">Tenant Profile</th>
                  <th className="px-5 py-4 font-bold">Contact</th>
                  <th className="px-5 py-4 font-bold text-center">Pax</th>
                  <th className="px-5 py-4 font-bold">Lease Period</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db6747] mx-auto mb-3" />
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Loading Tenants...</p>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FaUsers className="text-slate-300" size={20} />
                      </div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No tenants found</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm font-black text-[#db6747]">{r.unitNumber}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-slate-800">{r.fullName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{r.email}</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-700">{r.contact}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">@{r.userName}</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                          {r.occupancy}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {r.moveIn || r.leaseEnd ? (
                          <>
                            <p className="text-xs text-slate-700 font-semibold">{fmt(r.moveIn)} <span className="text-slate-300 font-normal mx-1">to</span></p>
                            <p className="text-xs text-slate-500 mt-0.5">{fmt(r.leaseEnd)}</p>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={r.leaseStatus} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button title="View Details" className="p-2 rounded-md text-slate-400 hover:text-[#db6747] hover:bg-orange-50 transition-all">
                            <FaEye size={14} />
                          </button>
                          <button title="Delete Tenant" onClick={() => setDeleteTarget(r)} className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                            <FaTrashAlt size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50 gap-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Showing <span className="text-slate-700">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="text-slate-700">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="text-slate-700">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all">
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
                          ${page === p ? "bg-[#db6747] text-white shadow-sm shadow-orange-200" : "text-slate-500 hover:bg-white hover:border hover:border-slate-200 border border-transparent"}`}>
                        {p}
                      </button>
                    )
                  )}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all">
                  <FaChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── DELETE MODAL ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <FaTrashAlt className="text-red-500" size={18} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Remove Tenant</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-slate-900">{deleteTarget.fullName}</span>?
              This action cannot be undone and will clear their associated records.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60 flex justify-center items-center">
                {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Sub-components ── */

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 relative shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3.5 ${bg} ${color} rounded-lg shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-none truncate">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const getStyle = (s) => {
    if (!s) return "bg-slate-100 text-slate-500 border-slate-200";
    if (s === "Active") return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (s === "Completed") return "bg-blue-50 text-blue-600 border-blue-100";
    if (s === "Terminated") return "bg-red-50 text-red-600 border-red-100";
    return "bg-slate-100 text-slate-500 border-slate-200";
  };

  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border shrink-0 ${getStyle(status)}`}>
      {status || "No Contract"}
    </span>
  );
}