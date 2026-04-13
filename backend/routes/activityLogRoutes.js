import express from "express";
import { fetchActivityLogsController } from "../controllers/activityLogController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.get("/", authorize("admin", "caretaker", "tenant"), fetchActivityLogsController);

export default router;
