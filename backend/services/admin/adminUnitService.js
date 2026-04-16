import { Unit, Contract, User } from "../../models/index.js";
import { createActivityLog } from "../../services/activityLogService.js";

const FLOOR_MAP = { 1: "Ground Floor", 2: "Second Floor", 3: "Third Floor", 4: "Fourth Floor" };

/* Derive the real display status for a unit */
const deriveStatus = (unit, tenants) => {
  if (!unit.is_active) return "Disabled";
  if (tenants.length > 0) return "Occupied";
  if (unit.status === "Occupied") return "Occupied";
  if (unit.status === "Under Maintenance") return "Under Maintenance";
  return "Vacant";
};

export const getAllUnits = async () => {
  const units = await Unit.findAll({
    include: [{
      model: Contract,
      as: "contracts",
      where: { status: "Active" },
      required: false,
      include: [{
        model: User,
        as: "tenants",
        attributes: ["ID", "fullName", "publicUserID"],
        through: { attributes: [] },
      }],
    }],
    order: [["unit_number", "ASC"]],
  });

  return units.map((u) => {
    const activeContract = u.contracts?.[0] ?? null;
    const tenants = activeContract?.tenants ?? [];
    const status = deriveStatus(u, tenants);

    return {
      id: u.ID,
      unitNumber: u.unit_number,
      floor: FLOOR_MAP[u.floor] ?? `Floor ${u.floor}`,
      floorNum: u.floor,
      maxCapacity: u.max_capacity,
      isActive: u.is_active,
      status,
      occupied: status === "Occupied",
      currentTenants: tenants.length,
      tenants,
      contractId: activeContract?.ID ?? null,
    };
  });
};

export const createUnit = async (data, adminId) => {
  const { unit_number, floor, max_capacity } = data;
  if (!unit_number || !floor) throw new Error("unit_number and floor are required");

  const existing = await Unit.findOne({ where: { unit_number } });
  if (existing) throw new Error(`Unit ${unit_number} already exists`);

  const unit = await Unit.create({
    unit_number,
    floor,
    max_capacity: max_capacity ?? 2,
    is_active: true,
    status: "Vacant",
  });

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "CREATE UNIT",
    description: `You added Unit ${unit.unit_number}.`,
    referenceId: unit.ID,
    referenceType: "unit",
  });

  return unit;
};

export const deleteUnit = async (unitId, adminId) => {
  const unit = await Unit.findByPk(unitId);
  if (!unit) throw new Error("Unit not found");

  const unitNumber = unit.unit_number;
  await unit.destroy();

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "DELETE UNIT",
    description: `You deleted Unit ${unitNumber}.`,
    referenceId: unitId,
    referenceType: "unit",
  });
};

export const updateUnit = async (unitId, data, adminId) => {
  const unit = await Unit.findByPk(unitId);
  if (!unit) throw new Error("Unit not found");

  if (data.max_capacity !== undefined) unit.max_capacity = data.max_capacity;

  if (data.status !== undefined) {
    if (data.status === "Disabled") {
      unit.is_active = false;
      unit.status = "Disabled";
    } else if (data.status === "Under Maintenance") {
      unit.is_active = true;
      unit.status = "Under Maintenance";
    } else {
      unit.is_active = true;
      unit.status = "Vacant";
    }
  }

  // Legacy boolean support
  if (data.is_active !== undefined && data.status === undefined) {
    unit.is_active = data.is_active;
    if (!data.is_active) unit.status = "Disabled";
    else if (unit.status === "Disabled") unit.status = "Vacant";
  }

  await unit.save();

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "UPDATE UNIT",
    description: `You updated Unit ${unit.unit_number} — status: ${unit.status}.`,
    referenceId: unit.ID,
    referenceType: "unit",
  });

  return unit;
};
