import express from "express";
import caretakerAuth from "../../middleware/caretakerAuth.js";
import {
  getAllPaymentsController,
  getPendingPaymentsController,
  verifyPaymentController,
  deletePaymentController,
} from "../../controllers/caretaker/caretakerPaymentController.js";

const router = express.Router();

router.use(caretakerAuth);

router.get("/", getAllPaymentsController);
router.get("/pending", getPendingPaymentsController);
router.patch("/:id/verify", verifyPaymentController);
router.delete("/:id", deletePaymentController);

export default router;
