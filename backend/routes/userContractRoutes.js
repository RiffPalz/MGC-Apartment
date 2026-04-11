import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getUserContractsController,
  proxyContractPdf,
} from "../controllers/userContractController.js";
import {
  submitTerminationRequestController,
  getTenantTerminationRequestController,
} from "../controllers/terminationRequestController.js";

const router = express.Router();

router.get("/", authenticate, authorize("tenant"), getUserContractsController);
router.get("/:id/pdf", authenticate, proxyContractPdf);

// Termination requests (tenant)
router.post("/termination-request", authenticate, authorize("tenant"), submitTerminationRequestController);
router.get("/termination-request/mine", authenticate, authorize("tenant"), getTenantTerminationRequestController);

export default router;