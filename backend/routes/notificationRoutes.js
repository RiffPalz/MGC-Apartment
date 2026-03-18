import express from "express";

import {
    getUserNotificationsController,
    getRoleNotificationsController,
    markNotificationAsReadController,
    markAllNotificationsAsReadController
} from "../controllers/notificationController.js";

import { authenticate } from "../middleware/auth.js";

const router = express.Router();


/* GET USER NOTIFICATIONS (Tenant) */
router.get(
    "/users",
    authenticate,
    getUserNotificationsController
);


/* GET ROLE NOTIFICATIONS (Admin / Caretaker) */
router.get(
    "/role",
    authenticate,
    getRoleNotificationsController
);


/* MARK SINGLE NOTIFICATION AS READ */
router.patch(
    "/:id/read",
    authenticate,
    markNotificationAsReadController
);


/* MARK ALL USER NOTIFICATIONS AS READ */
router.patch(
    "/read-all",
    authenticate,
    markAllNotificationsAsReadController
);


export default router;