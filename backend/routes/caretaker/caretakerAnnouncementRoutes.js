import express from "express";
import caretakerAuth from "../../middleware/caretakerAuth.js";
import {
  getAnnouncementsController,
  createAnnouncementController,
  updateAnnouncementController,
  deleteAnnouncementController,
} from "../../controllers/caretaker/caretakerAnnouncementController.js";

const router = express.Router();

router.use(caretakerAuth);

router.get("/", getAnnouncementsController);
router.post("/", createAnnouncementController);
router.put("/:id", updateAnnouncementController);
router.delete("/:id", deleteAnnouncementController);

export default router;
