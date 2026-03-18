import express from "express";
import caretakerAuth from "../../middleware/caretakerAuth.js";

import {
  getAnnouncementsController
} from "../../controllers/caretaker/caretakerAnnouncementController.js";

const router = express.Router();

// Protect all routes
router.use(caretakerAuth);

// Get announcements
router.get("/", getAnnouncementsController);

export default router;