import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getMyPaymentsController,
  getPaymentDetailsController,
  uploadReceiptController,
} from "../controllers/userPaymentController.js";
import uploadReceipt from "../middleware/uploadReceipt.js";

const router = express.Router();

router.get("/", authenticate, authorize("tenant"), getMyPaymentsController);
router.get("/:id", authenticate, authorize("tenant"), getPaymentDetailsController);
router.post("/:id/upload-receipt", authenticate, authorize("tenant"), uploadReceipt.single("receipt"), uploadReceiptController);

export default router;
