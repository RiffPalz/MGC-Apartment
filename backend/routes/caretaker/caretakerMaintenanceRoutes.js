import express from "express";
import caretakerAuth from "../../middleware/caretakerAuth.js";
import {
  createMaintenanceController,
  updateMaintenanceController,
  deleteMaintenanceController,
  fetchAllMaintenanceController,
} from "../../controllers/caretaker/caretakerMaintenanceController.js";

const router = express.Router();

router.use(caretakerAuth);

router.post("/", createMaintenanceController);
router.get("/", fetchAllMaintenanceController);
router.patch("/:id", updateMaintenanceController);
router.delete("/:id", deleteMaintenanceController);

export default router;
