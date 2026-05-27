import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { getUserContractsController, proxyContractPdf, proxyTerminationRequestPdf } from "../controllers/userContractController.js";
import {
  submitTerminationRequestController,
  getTenantTerminationRequestController,
} from "../controllers/terminationRequestController.js";

const router = express.Router();

router.get("/", authenticate, authorize("tenant"), getUserContractsController);
// Specific routes first — must come before /:id/pdf to avoid param collision
router.get("/termination-request/mine", authenticate, authorize("tenant"), getTenantTerminationRequestController);
router.get("/termination-request/:id/pdf", authenticate, proxyTerminationRequestPdf);
router.post("/termination-request", authenticate, authorize("tenant"), submitTerminationRequestController);
router.get("/:id/pdf", authenticate, proxyContractPdf);

export default router;
