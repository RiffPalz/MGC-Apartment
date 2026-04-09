import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { getSystemInfoController, updateSystemInfoController } from "../controllers/systemInfoController.js";

const router = express.Router();

router.get("/", getSystemInfoController);               // public — anyone can read
router.patch("/", adminAuth, updateSystemInfoController); // admin only — write

export default router;
