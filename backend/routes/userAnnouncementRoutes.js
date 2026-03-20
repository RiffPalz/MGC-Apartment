import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";

import {
  getAnnouncementsController,
  getSingleAnnouncementController
} from "../controllers/userAnnouncementController.js";

const router = express.Router();


/* GET ANNOUNCEMENTS */
router.get(
  "/",
  authenticate,
  authorize("tenant"),
  getAnnouncementsController
);

/* GET SINGLE ANNOUNCEMENT */
router.get(
  "/:id",
  authenticate,
  authorize("tenant"),
  getSingleAnnouncementController
);

export default router;