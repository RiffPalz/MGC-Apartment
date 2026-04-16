import express from "express";
import { getConfigController } from "../controllers/admin/adminConfigController.js";
import { Unit, Contract, User } from "../models/index.js";

const configRouter = express.Router();

configRouter.get("/", getConfigController);

// Public endpoint — returns units available for tenant registration
configRouter.get("/units", async (req, res) => {
  try {
    const units = await Unit.findAll({
      where: { is_active: true },
      attributes: ["ID", "unit_number", "floor", "status"],
      order: [["unit_number", "ASC"]],
    });

    const activeContracts = await Contract.findAll({
      where: { status: "Active" },
      attributes: ["unit_id"],
      include: [{
        model: User,
        as: "tenants",
        attributes: ["ID"],
        through: { attributes: [] },
        required: true,
      }],
    });
    const occupiedUnitIds = new Set(activeContracts.map((c) => c.unit_id));

    const result = units.map((u) => {
      const isOccupied = occupiedUnitIds.has(u.ID) || u.status === "Occupied";
      const derivedStatus = isOccupied
        ? "Occupied"
        : u.status === "Under Maintenance"
          ? "Under Maintenance"
          : "Vacant";

      return { ID: u.ID, unit_number: u.unit_number, floor: u.floor, status: derivedStatus };
    });

    return res.status(200).json({ success: true, units: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export { configRouter };
