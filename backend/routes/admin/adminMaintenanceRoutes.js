import express from "express";
import adminAuth from "../../middleware/adminAuth.js";

import {
  fetchAllMaintenance,
  approveMaintenanceController,
  updateMaintenanceController,
  createMaintenanceController,
  deleteMaintenanceController
} from "../../controllers/admin/adminMaintenanceController.js";

const router = express.Router();


router.post(
  "/",
  adminAuth,
  createMaintenanceController
);


// Approve maintenance request
router.patch(
  "/:id/approve",
  adminAuth,
  approveMaintenanceController
);

// Update maintenance status (In Progress / Done)
router.patch(
  "/:id",
  adminAuth,
  updateMaintenanceController
);

router.delete(
  "/:id",
  adminAuth,
  deleteMaintenanceController
);

// Get all maintenance requests
router.get(
  "/",
  adminAuth,
  fetchAllMaintenance
);


export default router;