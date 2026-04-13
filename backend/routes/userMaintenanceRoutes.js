import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createMaintenanceRequest,
  getMyMaintenanceRequests,
  followUpMaintenanceRequest,
  editMaintenanceRequest,
} from "../controllers/userMaintenanceController.js";

const router = express.Router();

router.post("/", authenticate, authorize("tenant"), createMaintenanceRequest);
router.get("/my", authenticate, authorize("tenant"), getMyMaintenanceRequests);
router.patch("/:id", authenticate, authorize("tenant"), editMaintenanceRequest);
router.patch("/:id/followup", authenticate, authorize("tenant"), followUpMaintenanceRequest);

export default router;
