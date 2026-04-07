import express from "express";
import { getConfigController } from "../controllers/admin/adminConfigController.js";
import { Unit } from "../models/index.js";

const configRouter = express.Router();

configRouter.get("/", getConfigController);

// Public endpoint — returns all active units grouped by floor
configRouter.get("/units", async (req, res) => {
  try {
    const units = await Unit.findAll({
      where: { is_active: true },
      attributes: ["ID", "unit_number", "floor"],
      order: [["unit_number", "ASC"]],
    });
    return res.status(200).json({ success: true, units });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export { configRouter };
