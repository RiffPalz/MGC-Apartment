import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
    createMaintenanceRequest,
    getMyMaintenanceRequests,
    followUpMaintenanceRequest,
} from "../controllers/userMaintenanceController.js";

const router = express.Router();

// Create maintenance request
router.post(
    "/",
    authenticate,
    authorize("tenant"),
    createMaintenanceRequest
);

// View own maintenance requests
router.get(
    "/my",
    authenticate,
    authorize("tenant"),
    getMyMaintenanceRequests
);

// Follow up on a request
router.patch(
    "/:id/followup",
    authenticate,
    authorize("tenant"),
    followUpMaintenanceRequest
);

export default router;