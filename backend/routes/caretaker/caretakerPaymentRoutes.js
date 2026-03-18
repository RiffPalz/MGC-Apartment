import express from "express";
import caretakerAuth from "../../middleware/caretakerAuth.js";

import {
  getAllPaymentsController,
  getPendingPaymentsController,
  verifyPaymentController
} from "../../controllers/caretaker/caretakerPaymentController.js";

const router = express.Router();

// Protect all routes
router.use(caretakerAuth);

/* GET ALL PAYMENTS */
router.get("/", getAllPaymentsController);

/* GET PAYMENTS PENDING VERIFICATION */
router.get("/pending", getPendingPaymentsController);

/* VERIFY PAYMENT */
router.patch("/:id/verify", verifyPaymentController);

export default router;