import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MdDeleteForever, MdEdit, MdPeople, MdSearchOff,
  MdMeetingRoom, MdNoMeetingRoom, MdOutlineBedroomParent, MdPerson
} from "react-icons/md";
import { HiPlus } from "react-icons/hi";
import { IoSettingsSharp } from "react-icons/io5";
import { FaSearch } from "react-icons/fa";
import toast from "../../utils/toast";
import { fetchAllUnits, createUnit, updateUnit, deleteUnit } from "../../api/adminAPI/unitsAPI";
import GeneralConfirmationModal from "../../components/GeneralConfirmationModal";

const FLOORS = ["Ground Floor", "Second Floor", "Third Floor", "Fourth Floor"];
const FLOOR_NUM = { "Ground Floor": 1, "Second Floor": 2, "Third Floor": 3, "Fourth Floor": 4 };

export default function AdminUnitsCards() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isConfigureMode, setIsConfigureMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingUnit, setEditingUnit] = useState(null);
  const [newUnit, setNewUnit] = useState({ number: "", floor: "Ground Floor", capacity: 2 });
  const [saving, setSaving] = useState(false);

  const loadUnits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAllUnits();
      if (res.success) setUnits(res.units);
      else toast.error("Failed to load units");
    } catch (err) {
      console.error("fetchAllUnits error:", err);
      toast.error(err?.response?.data?.message || "Failed to load units");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUnits(); }, [loadUnits]);

  const handleAddUnit = async () => {
    if (!newUnit.number || !newUnit.floor) return toast.warn("Unit number and floor are required");
    try {
      setSaving(true);
      const res = await createUnit({
        unit_number: parseInt(newUnit.number),
        floor: FLOOR_NUM[newUnit.floor],
        max_capacity: newUnit.capacity,
      });
      if (res.success) {
        toast.success("Unit created successfully");
        setShowAddModal(false);
        setNewUnit({ number: "", floor: "Ground Floor", capacity: 2 });
        await loadUnits();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create unit");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUnit) return;
    try {
      setSaving(true);
      const res = await updateUnit(editingUnit.id, {
        max_capacity: editingUnit.maxCapacity,
        is_active: editingUnit.isActive,
      });
      if (res.success) {
        toast.success("Unit updated");
        setShowEditModal(false);
        setEditingUnit(null);
        await loadUnits();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update unit");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await deleteUnit(confirmDelete.id);
      if (res.success) {
        toast.success(`Unit ${confirmDelete.unitNumber} deleted`);
        setConfirmDelete(null);
        await loadUnits();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete unit");
    }
  };

  const filtered = units.filter((u) =>
    String(u.unitNumber).includes(search) ||
    u.floor.toLowerCase().includes(search.toLowerCase())
  );

  const byFloor = (floor) => filtered.filter((u) => u.floor === floor);
  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.occupied).length;
  const vacantUnits = totalUnits - occupiedUnits;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return (
    <div className="w-full bg-[#f4f6f9] p-4 md:p-6 text-slate-800 font-sans flex flex-col gap-5 min-h-screen">

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MdOutlineBedroomParent size={22} />}
          label="Total Units"
          value={loading ? "—" : totalUnits}
          color="text-[#5c1f10]"
          bg="bg-[#5c1f10]/10"
          accent="#5c1f10"
        />
        <StatCard
          icon={<MdMeetingRoom size={22} />}
          label="Occupied"
          value={loading ? "—" : occupiedUnits}
          color="text-blue-600"
          bg="bg-blue-50"
          accent="#2563eb"
        />
        <StatCard
          icon={<MdNoMeetingRoom size={22} />}
          label="Vacant"
          value={loading ? "—" : vacantUnits}
          color="text-emerald-600"
          bg="bg-emerald-50"
          accent="#059669"
        />
        <StatCard
          icon={<MdPeople size={22} />}
          label="Occupancy Rate"
          value={loading ? "—" : `${occupancyRate}%`}
          color="text-[#db6747]"
          bg="bg-[#db6747]/10"
          accent="#db6747"
        />
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search unit or floor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#db6747]/25 focus:border-[#db6747] transition-all bg-slate-50 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border-2 border-slate-200 text-slate-600 hover:border-[#db6747] hover:text-[#db6747] transition-all uppercase tracking-widest"
            >
              <HiPlus size={15} /> Add Unit
            </button>
            <button
              onClick={() => setIsConfigureMode(!isConfigureMode)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest
                ${isConfigureMode
                  ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-200"
                  : "bg-[#5c1f10] text-white hover:bg-[#4a1809] shadow-md shadow-[#5c1f10]/30"}`}
            >
              <IoSettingsSharp size={14} className={isConfigureMode ? "animate-spin" : ""} />
              {isConfigureMode ? "Done Editing" : "Configure"}
            </button>
          </div>
        </div>
      </div>

      {/* ── FLOOR BLOCKS ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4 text-slate-400">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-[#db6747] rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest">Loading units...</p>
          </div>
        ) : filtered.length > 0 ? (
          FLOORS.map((floor) => (
            <FloorBlock
              key={floor}
              label={floor}
              floorUnits={byFloor(floor)}
              isConfigureMode={isConfigureMode}
              onEdit={(u) => { setEditingUnit({ ...u }); setShowEditModal(true); }}
              onDelete={(u) => setConfirmDelete(u)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-slate-400 gap-3">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
              <MdSearchOff size={30} className="text-slate-300" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">No units found{search ? ` for "${search}"` : ""}</p>
          </div>
        )}
      </div>

      {/* ── ADD MODAL ── */}
      {showAddModal && (
        <Modal>
          <ModalHeader icon={<HiPlus size={18} />} iconBg="bg-[#db6747]/10 text-[#db6747]" title="Add New Unit" onClose={() => setShowAddModal(false)} />
          <div className="flex flex-col gap-4 mt-5">
            <Field label="Unit Number">
              <input type="number" placeholder="e.g. 108" className={inputCls} onChange={(e) => setNewUnit({ ...newUnit, number: e.target.value })} />
            </Field>
            <Field label="Floor Level">
              <select className={inputCls} value={newUnit.floor} onChange={(e) => setNewUnit({ ...newUnit, floor: e.target.value })}>
                {FLOORS.map(f => <option key={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Max Capacity">
              <select className={inputCls} value={newUnit.capacity} onChange={(e) => setNewUnit({ ...newUnit, capacity: parseInt(e.target.value) })}>
                <option value={1}>1 Person</option>
                <option value={2}>2 Persons</option>
              </select>
            </Field>
          </div>
          <ModalFooter onCancel={() => setShowAddModal(false)} onConfirm={handleAddUnit} confirmLabel="Save Unit" loading={saving} confirmCls="bg-[#db6747] hover:bg-[#c45a3d] shadow-[#db6747]/30" />
        </Modal>
      )}

      {/* ── EDIT MODAL ── */}
      {showEditModal && editingUnit && (
        <Modal>
          <ModalHeader icon={<MdEdit size={17} />} iconBg="bg-blue-50 text-blue-600" title="Edit Unit" subtitle={`Unit ${editingUnit.unitNumber} · ${editingUnit.floor}`} onClose={() => setShowEditModal(false)} />
          <div className="flex flex-col gap-4 mt-5">
            <Field label="Max Capacity">
              <input type="number" min="1" className={inputCls} value={editingUnit.maxCapacity} onChange={(e) => setEditingUnit({ ...editingUnit, maxCapacity: parseInt(e.target.value) || 1 })} />
            </Field>
            <Field label="Status">
              <select className={inputCls} value={editingUnit.isActive ? "active" : "inactive"} onChange={(e) => setEditingUnit({ ...editingUnit, isActive: e.target.value === "active" })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
          <ModalFooter onCancel={() => setShowEditModal(false)} onConfirm={handleSaveEdit} confirmLabel="Save Changes" loading={saving} confirmCls="bg-blue-600 hover:bg-blue-700 shadow-blue-200" />
        </Modal>
      )}

      {/* ── DELETE CONFIRM ── */}
      <GeneralConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        variant="delete"
        title={confirmDelete ? `Delete Unit ${confirmDelete.unitNumber}?` : "Delete Unit?"}
        message="All data associated with this unit will be permanently removed. This cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}

/* ── FloorBlock ── */
function FloorBlock({ label, floorUnits, isConfigureMode, onEdit, onDelete }) {
  if (floorUnits.length === 0) return null;
  const occupied = floorUnits.filter(u => u.occupied).length;
  return (
    <div className="mb-8 last:mb-0">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-slate-100" />
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span>
          <span className="text-[10px] font-bold text-slate-400">·</span>
          <span className="text-[10px] font-bold text-slate-400">{occupied}/{floorUnits.length} occupied</span>
        </div>
        <div className="flex-1 h-px bg-slate-100" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {floorUnits.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            isConfigureMode={isConfigureMode}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

/* ── UnitCard ── */
function UnitCard({ unit, isConfigureMode, onEdit, onDelete }) {
  const primaryTenantId = unit.tenants?.[0]?.ID ?? null;
  const fillPct = unit.maxCapacity > 0 ? (unit.currentTenants / unit.maxCapacity) * 100 : 0;

  return (
    <div className={`relative bg-white rounded-2xl flex flex-col overflow-hidden transition-all duration-200
      ${isConfigureMode
        ? "border-2 border-amber-400 shadow-lg shadow-amber-100"
        : unit.occupied
          ? "border border-[#db6747]/25 shadow-sm hover:shadow-lg hover:shadow-[#db6747]/10 hover:-translate-y-0.5"
          : "border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"}`}
    >
      {/* Top color strip */}
      <div className={`h-1 w-full ${unit.occupied ? "bg-gradient-to-r from-[#db6747] to-[#e8845f]" : "bg-gradient-to-r from-emerald-400 to-emerald-500"}`} />

      <div className="p-3.5 flex flex-col gap-2.5 flex-1">
        {/* Unit number + badge */}
        <div className="flex items-start justify-between gap-1">
          {unit.occupied && primaryTenantId ? (
            <Link
              to={`/admin/tenants/${primaryTenantId}`}
              className="text-2xl font-black text-[#db6747] leading-none hover:text-[#c45a3d] transition-colors"
              title="View tenant profile"
            >
              {unit.unitNumber}
            </Link>
          ) : (
            <span className="text-2xl font-black text-slate-300 leading-none">{unit.unitNumber}</span>
          )}
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 mt-0.5
            ${unit.occupied ? "bg-[#db6747]/10 text-[#db6747]" : "bg-emerald-50 text-emerald-600"}`}>
            {unit.occupied ? "Occupied" : "Vacant"}
          </span>
        </div>

        {/* Capacity bar */}
        <div>
          <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden mb-1">
            <div
              className={`h-1 rounded-full transition-all ${unit.occupied ? "bg-[#db6747]" : "bg-emerald-400"}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-semibold">
            {unit.currentTenants}/{unit.maxCapacity} pax
          </p>
        </div>

        {/* Tenant list */}
        {unit.tenants && unit.tenants.length > 0 && (
          <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
            {unit.tenants.map((t) => (
              <Link
                key={t.ID}
                to={`/admin/tenants/${t.ID}`}
                className="flex items-center gap-1.5 group/t"
              >
                <div className="w-5 h-5 rounded-full bg-[#db6747]/10 flex items-center justify-center shrink-0">
                  <MdPerson size={11} className="text-[#db6747]" />
                </div>
                <span className="text-[10px] text-slate-500 font-semibold truncate group-hover/t:text-[#db6747] transition-colors leading-tight">
                  {t.fullName || t.publicUserID}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Configure buttons */}
      {isConfigureMode && (
        <div className="flex border-t border-amber-100">
          <button
            onClick={() => onEdit(unit)}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <MdEdit size={12} /> Edit
          </button>
          <div className="w-px bg-amber-100" />
          <button
            onClick={() => onDelete(unit)}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold text-red-500 hover:bg-red-50 transition-colors"
          >
            <MdDeleteForever size={12} /> Del
          </button>
        </div>
      )}
    </div>
  );
}

/* ── StatCard ── */
function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 flex items-center gap-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
      <div className={`p-3 ${bg} ${color} rounded-xl shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
      </div>
    </div>
  );
}

/* ── Modal ── */
function Modal({ children, maxW = "max-w-md" }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className={`bg-white rounded-2xl p-6 w-full ${maxW} shadow-2xl border border-slate-100`}>
        {children}
      </div>
    </div>
  );
}

/* ── ModalHeader ── */
function ModalHeader({ icon, iconBg, title, subtitle, onClose }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
        <div>
          <h2 className="text-base font-black text-slate-900 leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none mt-0.5">✕</button>
    </div>
  );
}

/* ── Field ── */
function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

/* ── ModalFooter ── */
function ModalFooter({ onCancel, onConfirm, confirmLabel, loading, confirmCls }) {
  return (
    <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
      <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest">
        Cancel
      </button>
      <button onClick={onConfirm} disabled={loading} className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all uppercase tracking-widest shadow-md disabled:opacity-60 ${confirmCls}`}>
        {loading ? "Saving..." : confirmLabel}
      </button>
    </div>
  );
}

const inputCls = "w-full border-2 border-slate-200 p-2.5 rounded-xl text-sm focus:ring-0 focus:border-[#db6747] outline-none transition-all bg-white placeholder:text-slate-300";
