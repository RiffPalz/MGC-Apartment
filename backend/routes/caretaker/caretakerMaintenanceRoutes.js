import express from "express";
import caretakerAuth from "../../middleware/caretakerAuth.js";

import {
  createMaintenanceController,
  updateMaintenanceController,
  deleteMaintenanceController,
  fetchAllMaintenanceController
} from "../../controllers/caretaker/caretakerMaintenanceController.js";

const router = express.Router();

// Protect all routes
router.use(caretakerAuth);

// Create maintenance
router.post("/", createMaintenanceController);

// Get all maintenance
router.get("/", fetchAllMaintenanceController);

// Update maintenance
router.patch("/:id", updateMaintenanceController);

// Delete maintenance
router.delete("/:id", deleteMaintenanceController);

export default router;