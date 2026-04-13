import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import uploadUtilityBill from "../../middleware/uploadUtilityBill.js";
import Payment from "../../models/payment.js";
import {
  createPaymentAdmin,
  getAllPaymentsAdmin,
  getPaymentsByContractAdmin,
  verifyPaymentAdmin,
  getMonthlySummaryAdmin,
  getPaymentDashboardAdmin,
  updatePaymentAdmin,
  deletePaymentAdmin,
} from "../../controllers/admin/adminPaymentController.js";

const router = express.Router();

/* Pre-upload duplicate check — runs before Multer so no file is uploaded on duplicates */
const checkDuplicatePayment = async (req, res, next) => {
  try {
    const { contract_id, category, billing_month } = req.body;
    if (!contract_id || !category || !billing_month) return next();

    const existing = await Payment.findOne({ where: { contract_id, category, billing_month } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Payment for this month already exists." });
    }
    next();
  } catch {
    next();
  }
};

router.post("/", adminAuth, checkDuplicatePayment, uploadUtilityBill.single("utilityBillFile"), createPaymentAdmin);
router.get("/", adminAuth, getAllPaymentsAdmin);
router.get("/contract/:id", adminAuth, getPaymentsByContractAdmin);
router.patch("/:id/verify", adminAuth, verifyPaymentAdmin);
router.patch("/:id", adminAuth, uploadUtilityBill.single("utilityBillFile"), updatePaymentAdmin);
router.delete("/:id", adminAuth, deletePaymentAdmin);
router.get("/summary", adminAuth, getMonthlySummaryAdmin);
router.get("/dashboard", adminAuth, getPaymentDashboardAdmin);

export default router;
