import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getAnnouncementsController,
  getSingleAnnouncementController,
} from "../controllers/userAnnouncementController.js";

const router = express.Router();

router.get("/", authenticate, authorize("tenant"), getAnnouncementsController);
router.get("/:id", authenticate, authorize("tenant"), getSingleAnnouncementController);

export default router;
