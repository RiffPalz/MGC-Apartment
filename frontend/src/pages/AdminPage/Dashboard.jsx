import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounceCallback } from "../../hooks/useDebounceCallback";
import {
  FaUsers, FaTools, FaMoneyBillWave,
  FaCheckCircle, FaClock, FaArrowRight,
  FaUserCheck, FaChartLine, FaMale, FaFemale,
} from "react-icons/fa";
import { MdPendingActions, MdApartment } from "react-icons/md";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  ArcElement,
  Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Doughnut, Pie } from "react-chartjs-2";
import api from "../../api/config";
import { useSocketEvent } from "../../hooks/useSocketEvent";

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement,
  ArcElement,
  Title, Tooltip, Legend, Filler
);

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
      const [tenantsRes, pendingRes, paymentRes, maintenanceRes, unitsRes] = await Promise.all([
        api.get("/admin/tenants/overview"),
        api.get("/admin/users/pending"),
        api.get("/admin/payments/dashboard"),
        api.get("/admin/maintenance"),
        api.get("/admin/units"),
      ]);
      setData({
        tenants: tenantsRes.data,
        pending: pendingRes.data,
        payments: paymentRes.data.dashboard ?? paymentRes.data,
        maintenance: maintenanceRes.data,
        units: unitsRes.data,
      });
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  const debouncedLoad = useDebounceCallback(loadDashboard, 1500);
  useSocketEvent(["maintenance_updated", "payment_updated", "contract_updated", "tenants_updated", "announcements_updated", "applications_updated", "units_updated"], debouncedLoad);

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

  // Gender counts from tenant list
  const tenantList = data?.tenants?.tenants ?? [];
  const maleCount = tenantList.filter((t) => t.sex === "Male").length;
  const femaleCount = tenantList.filter((t) => t.sex === "Female").length;

  // Unit status counts (4 statuses)
  const allUnits = data?.units?.units ?? [];
  const unitStatusCounts = {
    Occupied: allUnits.filter((u) => u.status === "Occupied").length,
    Vacant: allUnits.filter((u) => u.status === "Vacant").length,
    Disabled: allUnits.filter((u) => u.status === "Disabled").length,
    "Under Maintenance": allUnits.filter((u) => u.status === "Under Maintenance").length,
  };
  const totalUnits = allUnits.length;

  // Maintenance by category (current year)
  const currentYear = new Date().getFullYear();
  const yearlyMaint = maintenance.filter((m) => {
    const d = m.dateRequested || m.createdAt || m.created_at;
    return d ? new Date(d).getFullYear() === currentYear : true;
  });
  const MAINT_CATEGORIES = ["Electrical Maintenance", "Water Interruptions", "Floor Renovation", "Other"];
  const maintByCat = MAINT_CATEGORIES.map((cat) =>
    yearlyMaint.filter((m) => m.category === cat || (cat === "Other" && !MAINT_CATEGORIES.slice(0, 3).includes(m.category))).length
  );


  const revenueMap = {};
  (payDash.monthlyRevenue || []).forEach((r) => {
    const [year, month] = r.billing_month.split("-").map(Number);
    const key = `${year}-${month - 1}`;
    revenueMap[key] = (revenueMap[key] || 0) + parseFloat(r.total || 0);
  });
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

  const hasAlerts = payDash.pendingVerification > 0 || payDash.overduePayments > 0 || payDash.unpaidBills > 0;
  // Account approvals — first 3 + overflow indicator
  const pendingUsers = data?.pending?.users ?? [];
  const shownPending = pendingUsers.slice(0, 3);
  const extraPending = Math.max(0, pendingCount - 3);

  // Doughnut chart — Unit Occupancy (4 statuses)
  const doughnutData = {
    labels: ["Occupied", "Vacant", "Under Maintenance", "Disabled"],
    datasets: [{
      data: [
        unitStatusCounts.Occupied,
        unitStatusCounts.Vacant,
        unitStatusCounts["Under Maintenance"],
        unitStatusCounts.Disabled,
      ],
      backgroundColor: ["#db6747", "#34d399", "#f59e0b", "#94a3b8"],
      borderColor: ["#fff", "#fff", "#fff", "#fff"],
      borderWidth: 3,
      hoverOffset: 6,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a1a2e",
        titleColor: "#9ca3af",
        bodyColor: "#fff",
        padding: 10,
        callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} units` },
      },
    },
  };

  // Pie chart — Maintenance by Category
  const pieData = {
    labels: MAINT_CATEGORIES,
    datasets: [{
      data: maintByCat,
      backgroundColor: ["#f59e0b", "#38bdf8", "#fb923c", "#94a3b8"],
      borderColor: ["#fff", "#fff", "#fff", "#fff"],
      borderWidth: 3,
      hoverOffset: 6,
    }],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a1a2e",
        titleColor: "#9ca3af",
        bodyColor: "#fff",
        padding: 10,
        callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}` },
      },
    },
  };

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
          label="Maintenance Requests" value={pendingMaint}
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

        {/* Unit Occupancy — Doughnut Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
          <div className="flex items-center gap-2 text-[#db6747] mb-4">
            <div className="p-1.5 bg-orange-50 rounded-md"><MdApartment size={14} /></div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Unit Occupancy</h3>
              <p className="text-[10px] text-slate-400 uppercase">Current status · {totalUnits} units</p>
            </div>
          </div>

          {/* Doughnut */}
          <div className="relative flex-1 min-h-40 flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800">{totalUnits}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              { label: "Occupied",          color: "bg-[#db6747]", count: unitStatusCounts.Occupied },
              { label: "Vacant",            color: "bg-emerald-400", count: unitStatusCounts.Vacant },
              { label: "Under Maint.",      color: "bg-amber-400", count: unitStatusCounts["Under Maintenance"] },
              { label: "Disabled",          color: "bg-slate-400", count: unitStatusCounts.Disabled },
            ].map(({ label, color, count }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                <span className="text-[10px] text-slate-500 font-bold truncate">{label}</span>
                <span className="text-[10px] font-black text-slate-700 ml-auto">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: Maintenance Pie + Gender ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Maintenance Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center gap-2 text-[#db6747] mb-4">
            <div className="p-1.5 bg-orange-50 rounded-md"><FaTools size={13} /></div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Maintenance by Category</h3>
              <p className="text-[10px] text-slate-400 uppercase">All categories · {currentYear}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6 flex-1">
            {/* Pie */}
            <div className="relative w-44 h-44 shrink-0">
              <Pie data={pieData} options={pieOptions} />
            </div>
            {/* Legend */}
            <div className="flex flex-col gap-3 flex-1 w-full">
              {[
                { label: "Electrical Maintenance", color: "bg-amber-400",  idx: 0 },
                { label: "Water Interruptions",    color: "bg-sky-400",    idx: 1 },
                { label: "Floor Renovation",       color: "bg-orange-400", idx: 2 },
                { label: "Other",                  color: "bg-slate-400",  idx: 3 },
              ].map(({ label, color, idx }) => {
                const count = maintByCat[idx];
                const total = maintByCat.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                        <span className="text-xs font-bold text-slate-600">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">{count}</span>
                        <span className="text-[10px] text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tenants by Gender */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#db6747]">
              <div className="p-1.5 bg-orange-50 rounded-md"><FaUsers size={13} /></div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Tenants by Gender</h3>
                <p className="text-[10px] text-slate-400 uppercase">Building-wide total</p>
              </div>
            </div>
            <NavBtn onClick={() => navigate("/admin/tenants")} />
          </div>
          <div className="flex-1 flex flex-col justify-center gap-4 p-5">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <FaMale size={22} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Male</p>
                <p className="text-2xl font-black text-blue-600 leading-none">{maleCount}</p>
              </div>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest shrink-0">
                {totalTenants > 0 ? Math.round((maleCount / totalTenants) * 100) : 0}%
              </p>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-pink-50 border border-pink-100">
              <div className="w-11 h-11 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                <FaFemale size={22} className="text-pink-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-0.5">Female</p>
                <p className="text-2xl font-black text-pink-500 leading-none">{femaleCount}</p>
              </div>
              <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest shrink-0">
                {totalTenants > 0 ? Math.round((femaleCount / totalTenants) * 100) : 0}%
              </p>
            </div>
            {(totalTenants - maleCount - femaleCount) > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Not Specified</p>
                <p className="text-sm font-black text-slate-500">{totalTenants - maleCount - femaleCount}</p>
              </div>
            )}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Tenants</p>
            <p className="text-lg font-black text-slate-800">{totalTenants}</p>
          </div>
        </div>

      </div>

      {/* ── EXTRA ROW: Account Approvals + Unpaid Payments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

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

        {/* Unpaid Payments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-500">
              <div className="p-1.5 bg-amber-50 rounded-md"><FaMoneyBillWave size={13} /></div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Unpaid Payments</h3>
                <p className="text-[10px] text-slate-400 uppercase">Bills awaiting payment</p>
              </div>
            </div>
            <NavBtn onClick={() => navigate("/admin/payments")} />
          </div>

          <div className="flex-1 flex flex-col">
            {payDash.unpaidBills === 0 || !payDash.unpaidBills ? (
              <div className="p-8 flex flex-col items-center justify-center flex-1">
                <FaCheckCircle className="text-emerald-400 mb-2" size={24} />
                <p className="text-xs text-slate-400">No unpaid bills</p>
              </div>
            ) : (
              <>
                {/* Summary row */}
                <div className="px-5 py-3 bg-amber-50/60 border-b border-amber-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">
                    {payDash.unpaidBills} unpaid bill{payDash.unpaidBills !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                    {payDash.unpaidUnitNumbers?.length ?? 0} unit{(payDash.unpaidUnitNumbers?.length ?? 0) !== 1 ? "s" : ""} affected
                  </span>
                </div>

                {/* Unit list */}
                <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-52 custom-scrollbar">
                  {(payDash.unpaidUnitNumbers ?? []).map((unitNum) => (
                    <div
                      key={unitNum}
                      onClick={() => navigate("/admin/payments")}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-amber-50/40 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                        <MdApartment size={15} className="text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-800">Unit {unitNum}</p>
                        <p className="text-[10px] text-slate-400">Unpaid bill pending</p>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider shrink-0">
                        Unpaid
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer total */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Unpaid</p>
            <p className="text-lg font-black text-amber-600">{payDash.unpaidBills ?? 0}</p>
          </div>
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

function StatusBadge({ status }) {
  const isPending = status?.toLowerCase() === "pending";
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shrink-0 
      ${isPending ? "bg-orange-50 text-[#db6747]" : "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}