import Unit from "../../models/unit.js";
import Contract from "../../models/contract.js";
import User from "../../models/user.js";
import { createActivityLog } from "../../services/activityLogService.js";

const FLOOR_MAP = { 1: "Ground Floor", 2: "Second Floor", 3: "Third Floor", 4: "Fourth Floor" };

/* GET ALL UNITS with occupancy info */
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
    const tenants        = activeContract?.tenants ?? [];
    return {
      id:           u.ID,
      unitNumber:   u.unit_number,
      floor:        FLOOR_MAP[u.floor] ?? `Floor ${u.floor}`,
      floorNum:     u.floor,
      maxCapacity:  u.max_capacity,
      isActive:     u.is_active,
      occupied:     tenants.length > 0,
      currentTenants: tenants.length,
      tenants,
      contractId:   activeContract?.ID ?? null,
    };
  });
};

/* UPDATE UNIT */
export const updateUnit = async (unitId, data, adminId) => {
  const unit = await Unit.findByPk(unitId);
  if (!unit) throw new Error("Unit not found");

  if (data.max_capacity !== undefined) unit.max_capacity = data.max_capacity;
  if (data.is_active    !== undefined) unit.is_active    = data.is_active;
  await unit.save();

  await createActivityLog({
    userId: adminId, role: "admin",
    action: "UPDATE_UNIT",
    description: `Updated unit ${unit.unit_number}`,
    referenceId: unit.ID, referenceType: "unit",
  });

  return unit;
};
