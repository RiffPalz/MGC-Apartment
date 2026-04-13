import express from "express";
import {
  getUserNotificationsController,
  getRoleNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/users", authenticate, getUserNotificationsController);
router.get("/role", authenticate, getRoleNotificationsController);
router.patch("/:id/read", authenticate, markNotificationAsReadController);
router.patch("/read-all", authenticate, markAllNotificationsAsReadController);

export default router;
