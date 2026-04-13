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
  updateTenantProfile,
  getApprovedTenantsNoContract,
  getStaffUsers,
} from "../../controllers/admin/adminControllers.js";
import { fetchAllActivityLogsController } from "../../controllers/activityLogController.js";
import uploadProfilePicture from "../../middleware/uploadProfilePicture.js";
import { updateConfigController } from "../../controllers/admin/adminConfigController.js";
import uploadGalleryImages from "../../middleware/uploadGalleryImages.js";

const adminRouter = express.Router();

// Authentication
adminRouter.post("/login", loginAdmin);
adminRouter.post("/login/verify", loginCodeVerify);
adminRouter.post("/login/resend", resendCodeController);

// Profile
adminRouter.get("/profile", adminAuth, fetchAdminProfile);
adminRouter.patch("/profile/update", adminAuth, saveAdminProfile);
adminRouter.post("/profile/picture", adminAuth, uploadProfilePicture.single("profilePicture"), uploadProfilePictureController);

// Staff management
adminRouter.post("/caretaker", adminAuth, createCaretaker);
adminRouter.post("/admin", adminAuth, createAdmin);
adminRouter.get("/staff", adminAuth, getStaffUsers);

// Tenant management
adminRouter.get("/users/pending", adminAuth, getPendingUsers);
adminRouter.get("/users/approved-no-contract", adminAuth, getApprovedTenantsNoContract);
adminRouter.patch("/users/:userId/approval", adminAuth, updateUserApproval);
adminRouter.delete("/users/:userId", adminAuth, deleteUser);
adminRouter.get("/tenants/overview", adminAuth, getTenantsOverview);
adminRouter.get("/tenants/:id", adminAuth, getTenantProfile);
adminRouter.patch("/tenants/:id", adminAuth, updateTenantProfile);

// System configuration
adminRouter.put("/config", adminAuth, uploadGalleryImages, updateConfigController);

// Activity logs
adminRouter.get("/activity-logs", adminAuth, fetchAllActivityLogsController);

export default adminRouter;
