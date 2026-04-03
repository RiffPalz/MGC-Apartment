import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getUserContractsController,
  proxyContractPdf,
} from "../controllers/userContractController.js";

const router = express.Router();

router.get("/", authenticate, authorize("tenant"), getUserContractsController);

// Proxy: streams PDF from Cloudinary — avoids CORS issues in browser
router.get("/:id/pdf", authenticate, proxyContractPdf);

export default router;