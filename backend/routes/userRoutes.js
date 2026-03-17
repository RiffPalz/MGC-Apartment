import express from "express";
import { register, login, getUserProfile, updateUserProfile } from "../controllers/userControllers.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { userRegisterValidator } from "../validator/userRegisterValidator.js";
import { userLoginValidator } from "../validator/userLoginValidator.js";

const router = express.Router();

// Register a new account with data validation
router.post("/register", userRegisterValidator, register);

// Login with data validation
router.post("/login", userLoginValidator, login);

// Get the logged-in tenant's profile info
router.get("/profile", authenticate, authorize("tenant"), getUserProfile);

// Update specific fields of the tenant's profile
router.patch("/profile/update", authenticate, authorize("tenant"), updateUserProfile);

export default router;