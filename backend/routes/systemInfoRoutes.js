import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { getSystemInfoController, updateSystemInfoController } from "../controllers/systemInfoController.js";

const router = express.Router();

router.get("/", getSystemInfoController);
router.patch("/", adminAuth, updateSystemInfoController);

export default router;
