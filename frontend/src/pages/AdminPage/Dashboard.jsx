import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers, FaTools, FaMoneyBillWave, FaClipboardList,
  FaCheckCircle, FaClock, FaArrowRight,
  FaUserCheck, FaChartLine, FaFileAlt, FaEnvelope,
} from "react-icons/fa";
import { MdPendingActions } from "react-icons/md";
import { MdApartment } from "react-icons/md";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import api from "../../api/config";
import { useSocketEvent } from "../../hooks/useSocketEvent";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const fmt = (n) =>
  `₱${parseFloat(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const [tenantsRes, pendingRes, paymentRes, maintenanceRes, appReqRes, todayAppRes, unitsRes] = await Promise.all([
        api.get("/admin/tenants/overview"),
        api.get("/admin/users/pending"),
        api.get("/admin/payments/dashboard"),
        api.get("/admin/maintenance"),
        api.get("/admin/applications"),
        api.get("/admin/applications/today"),
        api.get("/admin/units"),
      ]);
      setData({
        tenants: tenantsRes.data,
        pending: pendingRes.data,
        payments: paymentRes.data.dashboard ?? paymentRes.data,
        maintenance: maintenanceRes.data,
        appRequests: appReqRes.data,
        todayApps: todayAppRes.data,
        units: unitsRes.data,
      });
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useSocketEvent(["maintenance_updated", "payment_updated", "contract_updated", "tenants_updated", "announcements_updated", "applications_updated", "units_updated"], loadDashboard);

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-4 sm:gap-5 font-sans animate-pulse">
        {/* Welcome Banner Skeleton */}
        <div className="h-24 bg-slate-200 rounded-2xl w-full" />
        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-2/3" />
                <div className="h-6 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
        {/* Chart + Side Panel Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 h-64 shadow-sm" />
          <div className="bg-white rounded-2xl border border-slate-100 p-5 h-64 shadow-sm space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl" />)}
          </div>
        </div>
        {/* Bottom Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 h-48 shadow-sm" />
          <div className="bg-white rounded-2xl border border-slate-100 p-5 h-48 shadow-sm" />
        </div>
      </div>
    );
  }

  const totalTenants = data?.tenants?.count ?? 0;
  const pendingCount = data?.pending?.count ?? 0;
  const payDash = data?.payments ?? {};
  const maintenance = data?.maintenance?.requests ?? [];
  const pendingMaint = maintenance.filter((m) => m.status === "Pending").length;
  const inProgressMaint = maintenance.filter((m) => m.status === "In Progress").length;


  const revenueMap = {};
  (payDash.monthlyRevenue || []).forEach((r) => {
    const [year, month] = r.billing_month.split("-").map(Number);
    const key = `${year}-${month - 1}`;

    // Fix: Add to the existing value instead of overwriting it
    revenueMap[key] = (revenueMap[key] || 0) + parseFloat(r.total || 0);
  });
  const currentYear = new Date().getFullYear();
  const chartLabels = isMobile ? MONTHS_SHORT : MONTHS_FULL;
  const chartValues = MONTHS_FULL.map((_, i) => revenueMap[`${currentYear}-${i}`] ?? 0);

  const chartData = {
    labels: chartLabels,
    datasets: [{
      label: "Revenue",
      data: chartValues,
      borderColor: "#db6747",
      backgroundColor: (ctx) => {
        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
        g.addColorStop(0, "rgba(219,103,71,0.25)");
        g.addColorStop(1, "rgba(219,103,71,0)");
        return g;
      },
      borderWidth: 2,
      pointBackgroundColor: "#db6747",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: true,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a1a2e",
        titleColor: "#9ca3af",
        bodyColor: "#fff",
        padding: 10,
        callbacks: { label: (ctx) => ` ₱${ctx.raw.toLocaleString()}` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#9ca3af", font: { size: 11 } },
      },
      y: {
        grid: { color: "#f3f4f6", drawBorder: false },
        border: { display: false },
        ticks: {
          color: "#9ca3af",
          font: { size: 11 },
          callback: (v) => `₱${(v / 1000).toFixed(0)}k`,
        },
        beginAtZero: true,
      },
    },
  };

  const recentMaint = maintenance.slice(0, 3);
  const allUnits = data?.units?.units ?? [];
  const occupiedCount = allUnits.filter((u) => u.occupied).length;
  const vacantCount = allUnits.length - occupiedCount;
  const totalUnits = allUnits.length;
  const hasAlerts = payDash.pendingVerification > 0 || payDash.overduePayments > 0 || payDash.unpaidBills > 0;


  const todayApps = data?.todayApps?.applications ?? [];
  const todayAppsCount = data?.todayApps?.count ?? 0;

  // Account approvals — first 3 + overflow indicator
  const pendingUsers = data?.pending?.users ?? [];
  const shownPending = pendingUsers.slice(0, 3);
  const extraPending = Math.max(0, pendingCount - 3);

  // Today's unread app requests — first 3 + overflow
  const shownTodayApps = todayApps.slice(0, 3);
  const extraTodayApps = Math.max(0, todayAppsCount - 3);

  return (
    <div className="w-full h-full bg-[#f8fafc] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-4">

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FaUsers size={18} />}
          label="Total Tenants" value={totalTenants}
          color="text-blue-500" bg="bg-blue-50"
          onClick={() => navigate("/admin/tenants")}
        />
        <StatCard
          icon={<MdPendingActions size={18} />}
          label="Pending Approvals" value={pendingCount}
          color="text-amber-500" bg="bg-amber-50"
          onClick={() => navigate("/admin/approvalpage")}
          badge={pendingCount > 0}
        />
        <StatCard
          icon={<FaTools size={18} />}
          label="Open Maintenance" value={pendingMaint + inProgressMaint}
          color="text-[#db6747]" bg="bg-orange-50"
          onClick={() => navigate("/admin/maintenance")}
        />
        <StatCard
          icon={<FaMoneyBillWave size={18} />}
          label="Total Collected" value={fmt(payDash.totalCollected)}
          color="text-emerald-500" bg="bg-emerald-50"
        />
      </div>

      {/* ── ALERTS ── */}
      {hasAlerts && (
        <div className="flex flex-wrap gap-2">
          {payDash.pendingVerification > 0 && (
            <AlertChip icon={<FaClock size={11} />}
              label={`${payDash.pendingVerification} pending verification`}
              cls="text-[#db6747] bg-white border-orange-200"
              onClick={() => navigate("/admin/payments")} />
          )}
        </div>
      )}

      {/* ── MIDDLE ROW: Chart + Maintenance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-80">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[#db6747]">
              <div className="p-1.5 bg-orange-50 rounded-md"><FaChartLine size={14} /></div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Monthly Rent and Utilities Collected</h3>
                <p className="text-[10px] text-slate-400 uppercase">Collected payments · {currentYear}</p>
              </div>
            </div>
            <NavBtn onClick={() => navigate("/admin/payments")} />
          </div>
          <div className="flex-1 w-full min-h-[220px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Unit Occupancy */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
          <div className="flex items-center gap-2 text-[#db6747] mb-6">
            <div className="p-1.5 bg-orange-50 rounded-md"><MdApartment size={14} /></div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Unit Occupancy</h3>
              <p className="text-[10px] text-slate-400 uppercase">Current status</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-5">
            <OccupancyRow label="Occupied" value={occupiedCount} total={totalUnits} color="bg-[#db6747]" textColor="text-[#db6747]" />
            <OccupancyRow label="Vacant" value={vacantCount} total={totalUnits} color="bg-slate-300" textColor="text-slate-500" />
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Units</p>
            <p className="text-2xl font-black text-slate-800">{totalUnits}</p>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: Requests + Approvals + App Requests ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Maintenance Requests — caretaker dashboard style */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#db6747]">
              <div className="p-1.5 bg-orange-50 rounded-md"><FaClipboardList size={13} /></div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Recent Requests</h3>
                <p className="text-[10px] text-slate-400 uppercase">Latest maintenance</p>
              </div>
            </div>
            <NavBtn onClick={() => navigate("/admin/maintenance")} />
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {recentMaint.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <FaCheckCircle className="text-emerald-300 mb-2" size={24} />
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">No pending requests</p>
              </div>
            ) : recentMaint.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#db6747] flex items-center justify-center shrink-0">
                    <FaTools size={11} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{m.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{m.tenant?.fullName} · {m.category}</p>
                  </div>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Account Approvals */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#db6747]">
              <div className="p-1.5 bg-orange-50 rounded-md"><FaUserCheck size={13} /></div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Account Approvals</h3>
                <p className="text-[10px] text-slate-400 uppercase">Pending review</p>
              </div>
            </div>
            <NavBtn onClick={() => navigate("/admin/approvalpage")} />
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {pendingCount === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <FaCheckCircle className="text-emerald-400 mb-2" size={24} />
                <p className="text-xs text-slate-400">All caught up</p>
              </div>
            ) : shownPending.map((u) => (
              <div key={u.ID} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#db6747] flex items-center justify-center font-bold text-xs shrink-0">
                  {(u.fullName || u.userName || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{u.fullName || u.userName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{u.emailAddress}</p>
                </div>
                <StatusBadge status="Pending" />
              </div>
            ))}
          </div>
          {extraPending > 0 && (
            <button onClick={() => navigate("/admin/approvalpage")}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 border-t border-slate-100 text-[11px] font-bold text-[#db6747] hover:bg-orange-50 transition-colors">
              <span className="w-4 h-4 rounded-full bg-[#db6747] text-white text-[9px] flex items-center justify-center font-black">+</span>
              {extraPending}+ more pending
            </button>
          )}
        </div>

        {/* Application Requests — today + unread only */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#db6747]">
              <div className="p-1.5 bg-orange-50 rounded-md"><FaFileAlt size={13} /></div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">App. Requests</h3>
                <p className="text-[10px] text-slate-400 uppercase">Today · Unread</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {todayAppsCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                  {todayAppsCount} new
                </span>
              )}
              <NavBtn onClick={() => navigate("/admin/applicationrequest")} />
            </div>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {shownTodayApps.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <FaFileAlt className="text-slate-300 mb-2" size={24} />
                <p className="text-xs text-slate-400">No new requests today</p>
              </div>
            ) : shownTodayApps.map((a) => (
              <div key={a.ID} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center font-bold text-xs shrink-0">
                  {(a.fullName || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{a.fullName}</p>
                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                    <FaEnvelope size={9} /> {a.emailAddress}
                  </p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-wider shrink-0">
                  New
                </span>
              </div>
            ))}
          </div>
          {extraTodayApps > 0 && (
            <button onClick={() => navigate("/admin/applicationrequest")}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 border-t border-slate-100 text-[11px] font-bold text-purple-600 hover:bg-purple-50 transition-colors">
              <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-[9px] flex items-center justify-center font-black">+</span>
              {extraTodayApps}+ more today
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({ icon, label, value, color, bg, onClick, badge }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 relative shadow-sm
        ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <div className={`p-3.5 ${bg} ${color} rounded-lg shrink-0 relative`}>
        {icon}
        {badge && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white -translate-y-1/2 translate-x-1/2" />}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-none truncate">{value}</p>
      </div>
    </div>
  );
}

function AlertChip({ icon, label, cls, onClick }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-bold shadow-sm transition-opacity hover:opacity-80 ${cls}`}>
      {icon} {label}
    </button>
  );
}

function NavBtn({ onClick }) {
  return (
    <button onClick={onClick}
      className="text-[10px] font-bold text-[#db6747] flex items-center gap-1 uppercase tracking-widest hover:opacity-70 transition-opacity">
      View <FaArrowRight size={8} />
    </button>
  );
}

function MaintStat({ label, value, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`} />
          <span className="text-sm text-slate-600">{label}</span>
        </div>
        <span className="text-sm font-bold text-slate-800">{value}</span>
      </div>
      <div className="h-1 bg-slate-100 rounded-full w-full overflow-hidden">
        {/* Placeholder bar, you can calculate real width if preferred */}
        <div className={`h-full ${color} rounded-full`} style={{ width: value > 0 ? "100%" : "0%" }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isPending = status?.toLowerCase() === "pending";
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shrink-0 
      ${isPending ? "bg-orange-50 text-[#db6747]" : "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

function OccupancyRow({ label, value, total, color, textColor }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-black ${textColor}`}>{value}</span>
          <span className="text-xs text-slate-400">({pct}%)</span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}