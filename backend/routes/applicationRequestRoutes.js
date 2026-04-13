import express from "express";
import {
  submitApplicationRequestController,
  checkApplicationStatusController,
} from "../controllers/applicationRequestController.js";
import uploadApplicationID from "../middleware/uploadApplicationID.js";

const router = express.Router();

router.post("/", uploadApplicationID.single("validID"), submitApplicationRequestController);
router.get("/status", checkApplicationStatusController);

export default router;
