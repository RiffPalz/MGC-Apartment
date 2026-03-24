import express from "express";
import adminAuth from "../../middleware/adminAuth.js";

import {
  loginAdmin,
  loginCodeVerify,
  resendCodeController,
  fetchAdminProfile,
  saveAdminProfile,
  createCaretaker,
  createAdmin,
  deleteUser,
  getPendingUsers,
  updateUserApproval,
  getTenantsOverview,
  getTenantProfile,
  getApprovedTenantsNoContract,
} from "../../controllers/admin/adminControllers.js";

const adminRouter = express.Router();

/* AUTHENTICATION */
adminRouter.post("/login", loginAdmin);
adminRouter.post("/login/verify", loginCodeVerify);
adminRouter.post("/login/resend", resendCodeController);

/* PROFILE */
adminRouter.get("/profile", adminAuth, fetchAdminProfile);
adminRouter.patch("/profile/update", adminAuth, saveAdminProfile);

/* USER MANAGEMENT */
adminRouter.post("/caretaker", adminAuth, createCaretaker);
adminRouter.post("/admin", adminAuth, createAdmin);
adminRouter.delete("/users/:userId", adminAuth, deleteUser);

/* TENANT MANAGEMENT */
adminRouter.get("/users/pending", adminAuth, getPendingUsers);
adminRouter.get("/users/approved-no-contract", adminAuth, getApprovedTenantsNoContract);
adminRouter.patch("/users/:userId/approval", adminAuth, updateUserApproval);
adminRouter.get("/tenants/overview", adminAuth, getTenantsOverview);
adminRouter.get("/tenants/:id", adminAuth, getTenantProfile);

export default adminRouter;