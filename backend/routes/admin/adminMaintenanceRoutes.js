import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import {
  fetchAllMaintenance,
  approveMaintenanceController,
  updateMaintenanceController,
  createMaintenanceController,
  deleteMaintenanceController,
} from "../../controllers/admin/adminMaintenanceController.js";

const router = express.Router();

router.post("/", adminAuth, createMaintenanceController);
router.patch("/:id/approve", adminAuth, approveMaintenanceController);
router.patch("/:id", adminAuth, updateMaintenanceController);
router.delete("/:id", adminAuth, deleteMaintenanceController);
router.get("/", adminAuth, fetchAllMaintenance);

export default router;
