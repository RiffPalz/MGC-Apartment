import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
    getMyPaymentsController,
    getPaymentDetailsController,
    uploadReceiptController
} from "../controllers/userPaymentController.js";
import uploadReceipt from "../middleware/uploadReceipt.js";

const router = express.Router();

// Get all payments for the logged-in tenant
router.get(
    "/",
    authenticate,
    authorize("tenant"),
    getMyPaymentsController
);

// Get details for a specific payment ID
router.get(
    "/:id",
    authenticate,
    authorize("tenant"),
    getPaymentDetailsController
);

// Upload a receipt image for a payment
router.post(
    "/:id/upload-receipt",
    authenticate,
    authorize("tenant"),
    uploadReceipt.single("receipt"),
    uploadReceiptController
);

export default router;