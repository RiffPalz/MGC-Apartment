import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";

import {
  getAnnouncementsController
} from "../controllers/userAnnouncementController.js";

const router = express.Router();


/* GET ANNOUNCEMENTS */
router.get(
  "/",
  authenticate,
  authorize("tenant"),
  getAnnouncementsController
);

export default router;