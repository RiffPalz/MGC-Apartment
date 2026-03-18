import express from "express";
import { fetchActivityLogsController } from "../controllers/activityLogController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Require a valid token
router.use(authenticate);

// Allow Admins, Caretakers, and Tenants to hit this endpoint
router.get(
    "/", 
    authorize("admin", "caretaker", "tenant"), 
    fetchActivityLogsController
);

export default router;