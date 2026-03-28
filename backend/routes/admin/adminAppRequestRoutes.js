import express from "express";
import adminAuth from "../../middleware/adminAuth.js";

import {
  getAllApplicationRequestsController,
  deleteApplicationRequestController,
  getApplicationRequestStatsController,
  getTodayUnreadController,
  markApplicationReadController,
} from "../../controllers/admin/adminAppRequestController.js";

const router = express.Router();

router.get("/stats",      adminAuth, getApplicationRequestStatsController);
router.get("/today",      adminAuth, getTodayUnreadController);
router.get("/",           adminAuth, getAllApplicationRequestsController);
router.patch("/:id/read", adminAuth, markApplicationReadController);
router.delete("/:id",     adminAuth, deleteApplicationRequestController);


export default router;