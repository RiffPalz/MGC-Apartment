import express from "express";
import {
  register,
  login,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  checkAvailability,
} from "../controllers/userControllers.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { userRegisterValidator } from "../validator/userRegisterValidator.js";
import { userLoginValidator } from "../validator/userLoginValidator.js";

const router = express.Router();

router.get("/check-availability", checkAvailability);
router.post("/register", userRegisterValidator, register);
router.post("/login", userLoginValidator, login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/profile", authenticate, authorize("tenant"), getUserProfile);
router.patch("/profile/update", authenticate, authorize("tenant"), updateUserProfile);

export default router;
