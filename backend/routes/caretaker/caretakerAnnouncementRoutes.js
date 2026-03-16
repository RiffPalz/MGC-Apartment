import express from "express";
import caretakerAuth from "../../middleware/caretakerAuth.js";

import {
  getAnnouncementsController
} from "../../controllers/caretaker/caretakerAnnouncementController.js";

const router = express.Router();

/* GET ANNOUNCEMENTS */
router.get(
  "/",
  caretakerAuth,
  getAnnouncementsController
);

export default router;