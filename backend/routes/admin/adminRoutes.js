import express from "express";
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
  getTenantsOverview
} from "../../controllers/admin/adminControllers.js";

import adminAuth from "../../middleware/adminAuth.js";

const adminRouter = express.Router();

/* =========================
   AUTH
========================= */
adminRouter.post("/login", loginAdmin);
adminRouter.post("/login/verify", loginCodeVerify);
adminRouter.post("/login/resend", resendCodeController);

/* =========================
   PROFILE
========================= */
adminRouter.get("/profile", adminAuth, fetchAdminProfile);
adminRouter.patch("/profile/update", adminAuth, saveAdminProfile);

/* =========================
   USER MANAGEMENT
========================= */
adminRouter.post("/caretaker", adminAuth, createCaretaker);
adminRouter.post("/admin", adminAuth, createAdmin);
adminRouter.delete("/users/:userId", adminAuth, deleteUser);

/* =========================
   TENANT MANAGEMENT
========================= */
adminRouter.get("/users/pending", adminAuth, getPendingUsers);
adminRouter.patch("/users/:userId/approval", adminAuth, updateUserApproval);
adminRouter.get("/tenants/overview", adminAuth, getTenantsOverview);

export default adminRouter;