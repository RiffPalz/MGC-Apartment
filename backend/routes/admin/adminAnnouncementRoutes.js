import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import {
  createAnnouncementController,
  getAllAnnouncementsController,
  updateAnnouncementController,
  deleteAnnouncementController,
} from "../../controllers/admin/adminAnnouncementController.js";

const router = express.Router();

router.post("/", adminAuth, createAnnouncementController);
router.get("/", adminAuth, getAllAnnouncementsController);
router.patch("/:id", adminAuth, updateAnnouncementController);
router.delete("/:id", adminAuth, deleteAnnouncementController);

export default router;
