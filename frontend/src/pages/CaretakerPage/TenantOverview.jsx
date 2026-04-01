import { useState, useEffect } from "react";
import {
  FaSearch, FaPrint, FaUsers, FaCheckCircle,
  FaFileContract, FaChevronLeft, FaChevronRight,
  FaPlus, FaEye, FaEyeSlash,
} from "react-icons/fa";
import toast from "../../utils/toast";
import { fetchTenantsOverview, createTenant } from "../../api/caretakerAPI/TenantsOverviewAPI";
import logo from "../../assets/images/logo.png";

const PAGE_SIZE = 10;

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

const PRINT_COLS = ["Unit No.", "Username", "Full Name", "Email", "Contact No.", "Occupancy", "Move-in Date", "Lease End", "Lease Status"];

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3.5 ${bg} ${color} rounded-lg shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    Active:     "bg-emerald-50 text-emerald-700 border-emerald-200",
    Completed:  "bg-slate-100 text-slate-600 border-slate-200",
    Terminated: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${cfg[status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {status ?? "No Contract"}
    </span>
  );
}

export default function CaretakerTenantOverview() {
  const [tenants, setTenants]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [leaseFilter, setLeaseFilter] = useState("All");
  const [page, setPage]             = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm]   = useState({
    fullName: "", emailAddress: "", contactNumber: "",
    unitNumber: "", numberOfTenants: "1", userName: "", password: "",
  });

  const EMPTY_FORM = {
    fullName: "", emailAddress: "", contactNumber: "",
    unitNumber: "", numberOfTenants: "1", userName: "", password: "",
  };

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
    const unit     = contract?.unit ?? null;
    return {
      id:          t.ID,
      unitNumber:  unit?.unit_number ?? t.unitNumber ?? "—",
      userName:    t.userName,
      fullName:    t.fullName,
      email:       t.emailAddress,
      contact:     t.contactNumber ?? "—",
      occupancy:   t.numberOfTenants ?? "—",
      moveIn:      contract?.start_date ?? null,
      leaseEnd:    contract?.end_date   ?? null,
      leaseStatus: contract?.status     ?? null,
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

  const totalPages    = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated     = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount   = rows.filter((r) => r.leaseStatus === "Active").length;
  const noContractCount = rows.filter((r) => !r.leaseStatus).length;

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");
    try {
      setSubmitting(true);
      await createTenant({
        fullName:        createForm.fullName.trim(),
        emailAddress:    createForm.emailAddress,
        contactNumber:   createForm.contactNumber.replace(/-/g, ""),
        unitNumber:      createForm.unitNumber ? Number(createForm.unitNumber) : null,
        numberOfTenants: Number(createForm.numberOfTenants),
        userName:        createForm.userName,
        password:        createForm.password,
      });
      toast.success("Tenant created successfully.");
      setCreateModal(false);
      setCreateForm(EMPTY_FORM);
      load();
    } catch (err) {
      setCreateError(err?.response?.data?.message || "Failed to create tenant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* PRINT STYLES */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 15mm; }
          body { background: white !important; }
          body * { visibility: hidden; }
          #tenant-print-area, #tenant-print-area * { visibility: visible; }
          #tenant-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* HIDDEN PRINT AREA */}
      <div id="tenant-print-area" className="hidden print:block">
        <div className="flex justify-between items-end border-b-[3px] border-slate-900 pb-5 mb-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="MGC Logo" className="w-14 h-14 object-contain"/>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none mb-1">MGC BUILDING</h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#db6747]">Tenant Summary Report</p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500 flex flex-col gap-1.5">
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Date Generated:</span>{new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p><span className="font-bold text-slate-800 uppercase tracking-widest mr-2">Department:</span>Property Management Office</p>
          </div>
        </div>
        {leaseFilter !== "All" && (
          <div className="mb-4 inline-block bg-slate-100 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest text-slate-600 border border-slate-200">
            Applied Filter: {leaseFilter} Leases
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>{PRINT_COLS.map((h) => (
              <th key={h} className="pb-3 pt-2 px-3 border-b-2 border-slate-300 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
            ))}</tr>
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
                  <span className={`font-bold uppercase tracking-wider ${r.leaseStatus === "Active" ? "text-emerald-600" : r.leaseStatus === "Terminated" ? "text-red-600" : "text-slate-500"}`}>
                    {r.leaseStatus ?? "No contract"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[9px] uppercase tracking-widest text-slate-400 font-bold">
          <p>Total Records: <span className="text-slate-800 text-[11px] ml-1">{filtered.length}</span></p>
          <p>MGC Building — Enterprise Property Management System</p>
          <p>CONFIDENTIAL</p>
        </div>
      </div>

      {/* SCREEN UI */}
      <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4 no-print min-h-screen">

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<FaUsers size={18}/>}       label="Total Tenants" value={rows.length}      color="text-blue-500"    bg="bg-blue-50"/>
          <StatCard icon={<FaCheckCircle size={18}/>} label="Active Leases" value={activeCount}      color="text-emerald-500" bg="bg-emerald-50"/>
          <StatCard icon={<FaFileContract size={18}/>} label="No Contract"  value={noContractCount}  color="text-slate-500"   bg="bg-slate-100"/>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
              <input type="text" placeholder="Search tenant, unit, or email..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 hover:bg-white"/>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="overflow-x-auto">
              <div className="flex bg-slate-100 p-1 rounded-lg min-w-max">
                {["All","Active","Completed","Terminated","No Contract"].map((f) => (
                  <button key={f} onClick={() => { setLeaseFilter(f); setPage(1); }}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
                      ${leaseFilter === f ? "bg-white text-[#db6747] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                    {f}
                  </button>
                ))}
              </div>
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"/>
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
                <FaPrint size={12}/> <span className="uppercase tracking-widest">Print</span>
              </button>
              <button onClick={() => { setCreateModal(true); setCreateForm(EMPTY_FORM); setCreateError(""); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#db6747] text-white hover:bg-[#c45a3a] transition-all shadow-sm">
                <FaPlus size={11}/> <span className="uppercase tracking-widest">New Tenant</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4 font-bold">Unit</th>
                  <th className="px-5 py-4 font-bold">Tenant Profile</th>
                  <th className="px-5 py-4 font-bold">Contact</th>
                  <th className="px-5 py-4 font-bold text-center">Occupancy</th>
                  <th className="px-5 py-4 font-bold">Lease Period</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="py-24 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db6747] mx-auto mb-3"/>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Loading Tenants...</p>
                  </td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={6} className="py-24 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaUsers className="text-slate-300" size={20}/>
                    </div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No tenants found</p>
                  </td></tr>
                ) : paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
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
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={r.leaseStatus}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50 gap-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Showing <span className="text-slate-700">{(page-1)*PAGE_SIZE+1}</span> to <span className="text-slate-700">{Math.min(page*PAGE_SIZE,filtered.length)}</span> of <span className="text-slate-700">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1,p-1))} disabled={page===1}
                  className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all">
                  <FaChevronLeft size={12}/>
                </button>
                {Array.from({length:totalPages},(_,i)=>i+1)
                  .filter((p)=>p===1||p===totalPages||Math.abs(p-page)<=1)
                  .reduce((acc,p,idx,arr)=>{if(idx>0&&p-arr[idx-1]>1)acc.push("...");acc.push(p);return acc;},[])
                  .map((p,idx)=>p==="..."
                    ?<span key={`e-${idx}`} className="px-2 text-slate-400 text-xs">…</span>
                    :<button key={p} onClick={()=>setPage(p)}
                      className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${page===p?"bg-[#db6747] text-white shadow-sm shadow-orange-200":"text-slate-500 hover:bg-white hover:border hover:border-slate-200 border border-transparent"}`}>
                      {p}
                    </button>
                  )}
                <button onClick={() => setPage((p) => Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="p-1.5 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all">
                  <FaChevronRight size={12}/>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE TENANT MODAL */}
      {createModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-slate-800 font-bold text-xs uppercase tracking-widest">New Tenant</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">Account will be created as Approved</p>
              </div>
              <button onClick={() => { setCreateModal(false); setCreateForm(EMPTY_FORM); setCreateError(""); }} className="text-slate-400 hover:text-slate-800 text-lg px-2">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                {/* Property Details */}
                <div className="space-y-5">
                  <p className="text-[10px] font-bold text-[#db6747] uppercase tracking-widest border-l-4 border-[#db6747] pl-3">Property Details</p>
                  <FormField label="Full Name">
                    <input required type="text" value={createForm.fullName}
                      onChange={e => { const cap = e.target.value.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); setCreateForm(f => ({ ...f, fullName: cap })); }}
                      placeholder="Juan Dela Cruz"
                      className="w-full bg-transparent border-b border-slate-200 focus:border-[#db6747] py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-300"/>
                  </FormField>
                  <FormField label="Email Address">
                    <input required type="email" value={createForm.emailAddress}
                      onChange={e => setCreateForm(f => ({ ...f, emailAddress: e.target.value }))}
                      placeholder="email@example.com"
                      className="w-full bg-transparent border-b border-slate-200 focus:border-[#db6747] py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-300"/>
                  </FormField>
                  <FormField label="Contact Number">
                    <input type="text" value={createForm.contactNumber}
                      onChange={e => { let raw = e.target.value.replace(/\D/g,"").slice(0,11); let fmt = raw; if(raw.length>4&&raw.length<=7)fmt=`${raw.slice(0,4)}-${raw.slice(4)}`; else if(raw.length>7)fmt=`${raw.slice(0,4)}-${raw.slice(4,7)}-${raw.slice(7)}`; setCreateForm(f=>({...f,contactNumber:fmt})); }}
                      placeholder="09XX-XXX-XXXX"
                      className="w-full bg-transparent border-b border-slate-200 focus:border-[#db6747] py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-300"/>
                  </FormField>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Unit">
                      <select required value={createForm.unitNumber}
                        onChange={e => setCreateForm(f => ({ ...f, unitNumber: e.target.value, userName: e.target.value ? `unit${e.target.value}_mgc` : "" }))}
                        className="w-full bg-transparent border-b border-slate-200 focus:border-[#db6747] py-2 text-sm text-slate-700 outline-none appearance-none cursor-pointer">
                        <option value="">Select...</option>
                        <optgroup label="1st Floor">{[101,102,103,104,105,106,107].map(n=><option key={n} value={n}>Unit {n}</option>)}</optgroup>
                        <optgroup label="2nd Floor">{[201,202,203,204,205,206].map(n=><option key={n} value={n}>Unit {n}</option>)}</optgroup>
                        <optgroup label="3rd Floor">{[301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316].map(n=><option key={n} value={n}>Unit {n}</option>)}</optgroup>
                        <optgroup label="4th Floor">{[401,402,403,404,405,406,407,408].map(n=><option key={n} value={n}>Unit {n}</option>)}</optgroup>
                      </select>
                    </FormField>
                    <FormField label="No. of Tenants">
                      <select value={createForm.numberOfTenants} onChange={e => setCreateForm(f => ({ ...f, numberOfTenants: e.target.value }))}
                        className="w-full bg-transparent border-b border-slate-200 focus:border-[#db6747] py-2 text-sm text-slate-700 outline-none appearance-none cursor-pointer">
                        <option value="1">1 Person</option>
                        <option value="2">2 Persons</option>
                      </select>
                    </FormField>
                  </div>
                </div>
                {/* Security Access */}
                <div className="space-y-5">
                  <p className="text-[10px] font-bold text-[#db6747] uppercase tracking-widest border-l-4 border-[#db6747] pl-3">Security Access</p>
                  <FormField label="Username (auto-generated)">
                    <input readOnly value={createForm.userName}
                      className="w-full bg-transparent border-b border-slate-200 py-2 text-sm text-slate-400 outline-none cursor-not-allowed font-bold"/>
                    <p className="text-[9px] text-[#db6747] mt-1 uppercase tracking-wider font-bold">* Locked to unit number</p>
                  </FormField>
                  <FormField label="Password">
                    <div className="flex items-center border-b border-slate-200 focus-within:border-[#db6747] transition-colors py-2">
                      <input type={showPass ? "text" : "password"} required value={createForm.password}
                        onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-300"/>
                      <button type="button" onClick={() => setShowPass(p => !p)} className="text-slate-400 hover:text-[#db6747] transition-colors ml-2">
                        {showPass ? <FaEye size={14}/> : <FaEyeSlash size={14}/>}
                      </button>
                    </div>
                  </FormField>
                </div>
              </div>
              {createError && (
                <div className="mt-5 bg-red-50 border-l-4 border-red-500 px-4 py-3 text-[11px] text-red-600 font-bold uppercase tracking-widest rounded-r-lg">{createError}</div>
              )}
              <div className="flex gap-3 justify-end pt-6 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => { setCreateModal(false); setCreateForm(EMPTY_FORM); setCreateError(""); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#db6747] text-white text-sm font-bold hover:bg-[#c45a3a] transition-colors shadow-sm disabled:opacity-60">
                  {submitting ? "Creating..." : "Create Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function FormField({ label, children }) {
  return (
    <div className="w-full">
      <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 mb-2 uppercase">{label}</label>
      {children}
    </div>
  );
}
