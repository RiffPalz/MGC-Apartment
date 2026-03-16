import express from "express";
import adminAuth from "../../middleware/adminAuth.js";

import {
  createAnnouncementController,
  getAllAnnouncementsController,
  updateAnnouncementController,
  deleteAnnouncementController
} from "../../controllers/admin/adminAnnouncementController.js";

const router = express.Router();


/* CREATE ANNOUNCEMENT */
router.post(
  "/",
  adminAuth,
  createAnnouncementController
);


/* GET ALL ANNOUNCEMENTS */
router.get(
  "/",
  adminAuth,
  getAllAnnouncementsController
);


/* UPDATE ANNOUNCEMENT */
router.patch(
  "/:id",
  adminAuth,
  updateAnnouncementController
);


/* DELETE ANNOUNCEMENT */
router.delete(
  "/:id",
  adminAuth,
  deleteAnnouncementController
);


export default router;