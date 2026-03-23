import { useState, useEffect } from "react";
import {
  FaSearch, FaDoorOpen, FaDoorClosed, FaUsers,
  FaEdit, FaTimes, FaPlus, FaUserCircle,
} from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import { MdMeetingRoom } from "react-icons/md";
import { toast } from "react-toastify";
import { fetchAllUnits, updateUnit } from "../../api/adminAPI/unitsAPI";

const FLOORS = ["Ground Floor", "Second Floor", "Third Floor", "Fourth Floor"];

const floorColor = {
  "Ground Floor":  { dot: "bg-blue-500",    badge: "text-blue-700 bg-blue-50 border-blue-200" },
  "Second Floor":  { dot: "bg-violet-500",  badge: "text-violet-700 bg-violet-50 border-violet-200" },
  "Third Floor":   { dot: "bg-amber-500",   badge: "text-amber-700 bg-amber-50 border-amber-200" },
  "Fourth Floor":  { dot: "bg-emerald-500", badge: "text-emerald-700 bg-emerald-50 border-emerald-200" },
};

export default function AdminUnits() {
  const [units, setUnits]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [floorFilter, setFloorFilter]   = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [configureMode, setConfigureMode] = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [saving, setSaving]             = useState(false);

  // Add Unit modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUnit, setNewUnit]           = useState({ unit_number: "", floor: 1, max_capacity: 2 });
  const [adding, setAdding]             = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchAllUnits();
      setUnits(res.units || []);
    } catch {
      toast.error("Failed to load units.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = units.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = String(u.unitNumber).includes(q) || u.floor.toLowerCase().includes(q);
    const matchFloor  = floorFilter === "All" || u.floor === floorFilter;
    const matchStatus = statusFilter === "All"
      || (statusFilter === "Occupied" && u.occupied)
      || (statusFilter === "Vacant"   && !u.occupied);
    return matchSearch && matchFloor && matchStatus;
  });

  const totalOccupied = units.filter((u) => u.occupied).length;
  const totalVacant   = units.filter((u) => !u.occupied).length;

  const handleSave = async () => {
    if (!editTarget) return;
    try {
      setSaving(true);
      await updateUnit(editTarget.id, {
        max_capacity: editTarget.maxCapacity,
        is_active:    editTarget.isActive,
      });
      toast.success(`Unit ${editTarget.unitNumber} updated.`);
      setEditTarget(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="font-NunitoSans text-[#1a1a2e] space-y-5">

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<MdMeetingRoom size={20} />} label="Total Units" value={units.length}  color="text-blue-600"    bg="bg-blue-50" />
        <StatCard icon={<FaDoorClosed  size={20} />} label="Occupied"    value={totalOccupied} color="text-red-500"     bg="bg-red-50" />
        <StatCard icon={<FaDoorOpen    size={20} />} label="Vacant"      value={totalVacant}   color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      {/* TOOLBAR */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input
              type="text"
              placeholder="Search unit number or floor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747]"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Floor filters */}
            {["All", ...FLOORS].map((f) => (
              <button key={f} onClick={() => setFloorFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors
                  ${floorFilter === f ? "bg-[#db6747] text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {f === "All" ? "All Floors" : f.replace(" Floor", "")}
              </button>
            ))}
            <div className="h-5 w-px bg-gray-200" />
            {/* Status filters */}
            {["All", "Occupied", "Vacant"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors
                  ${statusFilter === s ? "bg-[#3a0f08] text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {s}
              </button>
            ))}
            <div className="h-5 w-px bg-gray-200" />
            {/* Add Unit */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-[#db6747] text-white hover:bg-[#c45a3c] transition-colors shadow-sm"
            >
              <FaPlus size={11} /> Add Unit
            </button>
            {/* Configure */}
            <button
              onClick={() => setConfigureMode((p) => !p)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors
                ${configureMode ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-[#3a0f08] text-white hover:bg-[#4a1a10]"}`}
            >
              <IoSettingsSharp className={configureMode ? "animate-spin" : ""} size={13} />
              {configureMode ? "Exit Configure" : "Configure"}
            </button>
          </div>
        </div>
      </div>

      {/* FLOOR SECTIONS */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#db6747]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 text-center text-gray-400">
          No units found.
        </div>
      ) : (
        FLOORS.map((floor) => {
          const floorUnits = filtered.filter((u) => u.floor === floor);
          if (floorUnits.length === 0) return null;
          const fc = floorColor[floor];
          return (
            <div key={floor} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                <span className={`w-3 h-3 rounded-full ${fc.dot} shrink-0`} />
                <h3 className="text-sm font-black text-[#1a1a2e] uppercase tracking-widest">{floor}</h3>
                <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full border ${fc.badge}`}>
                  {floorUnits.length} units
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
                {floorUnits.map((u) => (
                  <UnitCard
                    key={u.id}
                    unit={u}
                    configureMode={configureMode}
                    onEdit={() => setEditTarget({ ...u })}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* ── ADD UNIT MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-[#1a1a2e]">Add New Unit</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <FaTimes size={14} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Unit Number</label>
                <input
                  type="number"
                  placeholder="e.g. 101"
                  value={newUnit.unit_number}
                  onChange={(e) => setNewUnit({ ...newUnit, unit_number: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Floor</label>
                <select
                  value={newUnit.floor}
                  onChange={(e) => setNewUnit({ ...newUnit, floor: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747]"
                >
                  <option value={1}>Ground Floor</option>
                  <option value={2}>Second Floor</option>
                  <option value={3}>Third Floor</option>
                  <option value={4}>Fourth Floor</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Max Capacity</label>
                <input
                  type="number" min={1} max={10}
                  value={newUnit.max_capacity}
                  onChange={(e) => setNewUnit({ ...newUnit, max_capacity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} disabled={adding}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                disabled={adding || !newUnit.unit_number}
                onClick={async () => {
                  try {
                    setAdding(true);
                    // NOTE: Add unit endpoint not yet implemented — wire up when backend ready
                    toast.info("Add unit endpoint coming soon.");
                    setShowAddModal(false);
                  } finally {
                    setAdding(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#db6747] text-white text-sm font-bold hover:bg-[#c45a3c] transition-colors disabled:opacity-60"
              >
                {adding ? "Adding..." : "Add Unit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT UNIT MODAL ── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-[#1a1a2e]">Edit Unit {editTarget.unitNumber}</h3>
              <button onClick={() => setEditTarget(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <FaTimes size={14} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Max Capacity</label>
                <input
                  type="number" min={1} max={10}
                  value={editTarget.maxCapacity}
                  onChange={(e) => setEditTarget({ ...editTarget, maxCapacity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Status</label>
                <select
                  value={editTarget.isActive ? "active" : "inactive"}
                  onChange={(e) => setEditTarget({ ...editTarget, isActive: e.target.value === "active" })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditTarget(null)} disabled={saving}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#db6747] text-white text-sm font-bold hover:bg-[#c45a3c] transition-colors disabled:opacity-60">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Unit Card ── */
function UnitCard({ unit, configureMode, onEdit }) {
  const occupied = unit.occupied;
  return (
    <div className={`relative rounded-xl border p-4 flex flex-col gap-2.5 transition-all hover:shadow-md
      ${occupied ? "border-red-100 bg-red-50/30" : "border-emerald-100 bg-emerald-50/20"}`}>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-base font-black text-[#1a1a2e]">{unit.unitNumber}</span>
        {configureMode && (
          <button onClick={onEdit} title="Edit"
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-[#db6747] hover:border-[#db6747] transition-colors shadow-sm">
            <FaEdit size={11} />
          </button>
        )}
      </div>

      {/* Status badge */}
      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest w-fit
        ${occupied ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
        {occupied ? "Occupied" : "Vacant"}
      </span>

      {/* Occupancy count */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <FaUsers size={11} className="shrink-0" />
        <span className="font-bold text-[#1a1a2e]">{unit.currentTenants}</span>
        <span>/ {unit.maxCapacity}</span>
      </div>

      {/* Capacity bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${occupied ? "bg-red-400" : "bg-emerald-400"}`}
          style={{ width: unit.maxCapacity > 0 ? `${(unit.currentTenants / unit.maxCapacity) * 100}%` : "0%" }}
        />
      </div>

      {/* Tenant list */}
      {unit.tenants?.length > 0 && (
        <div className="mt-1 space-y-1.5 border-t border-gray-100 pt-2">
          {unit.tenants.map((t) => (
            <div key={t.ID} className="flex items-center gap-1.5">
              <FaUserCircle size={12} className="text-gray-400 shrink-0" />
              <span className="text-[11px] text-gray-600 truncate">{t.fullName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Inactive label */}
      {!unit.isActive && (
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Inactive</span>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3.5 ${bg} ${color} rounded-xl shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-[#1a1a2e] leading-none">{value}</p>
      </div>
    </div>
  );
}
