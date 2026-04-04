import express from "express";
import adminAuth from "../../middleware/adminAuth.js";

import {
  loginAdmin,
  loginCodeVerify,
  resendCodeController,
  fetchAdminProfile,
  saveAdminProfile,
  uploadProfilePictureController,
  createCaretaker,
  createAdmin,
  deleteUser,
  getPendingUsers,
  updateUserApproval,
  getTenantsOverview,
  getTenantProfile,
  getApprovedTenantsNoContract,
  getStaffUsers,
} from "../../controllers/admin/adminControllers.js";

import { fetchAllActivityLogsController } from "../../controllers/activityLogController.js";
import uploadProfilePicture from "../../middleware/uploadProfilePicture.js";

const adminRouter = express.Router();

/* AUTHENTICATION */
adminRouter.post("/login", loginAdmin);
adminRouter.post("/login/verify", loginCodeVerify);
adminRouter.post("/login/resend", resendCodeController);

/* PROFILE */
adminRouter.get("/profile", adminAuth, fetchAdminProfile);
adminRouter.patch("/profile/update", adminAuth, saveAdminProfile);
adminRouter.post("/profile/picture", adminAuth, uploadProfilePicture.single("profilePicture"), uploadProfilePictureController);

/* USER MANAGEMENT */
adminRouter.post("/caretaker", adminAuth, createCaretaker);
adminRouter.post("/admin", adminAuth, createAdmin);
adminRouter.get("/staff", adminAuth, getStaffUsers);
/* TENANT MANAGEMENT */
adminRouter.get("/users/pending", adminAuth, getPendingUsers);
adminRouter.get("/users/approved-no-contract", adminAuth, getApprovedTenantsNoContract);
adminRouter.patch("/users/:userId/approval", adminAuth, updateUserApproval);
adminRouter.delete("/users/:userId", adminAuth, deleteUser);
adminRouter.get("/tenants/overview", adminAuth, getTenantsOverview);
adminRouter.get("/tenants/:id", adminAuth, getTenantProfile);

/* ACTIVITY LOGS */
adminRouter.get("/activity-logs", adminAuth, fetchAllActivityLogsController);

export default adminRouter;