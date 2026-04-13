import { getAllPayments, getPendingPayments, verifyPayment } from "../../services/caretaker/caretakerPaymentService.js";
import { emitEvent } from "../../utils/emitEvent.js";

export const getAllPaymentsController = async (req, res) => {
  try {
    const payments = await getAllPayments();
    return res.status(200).json({ success: true, count: payments.length, payments });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch payments" });
  }
};

export const getPendingPaymentsController = async (req, res) => {
  try {
    const payments = await getPendingPayments();
    return res.status(200).json({ success: true, count: payments.length, payments });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch pending payments" });
  }
};

export const verifyPaymentController = async (req, res) => {
  try {
    const payment = await verifyPayment(req.params.id, req.caretaker.id);

    emitEvent(req, "payment_updated");

    const io = req.app.get("io");
    const targetUser = payment.user_id || payment.tenant_id;
    if (targetUser) {
      io.to(`user_${targetUser}`).emit("new_notification", {
        title: "Payment Verified",
        message: "Your payment has been verified.",
        type: "payment",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return res.status(200).json({ success: true, message: "Payment verified successfully", payment });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deletePaymentController = async (req, res) => {
  try {
    const Payment = (await import("../../models/payment.js")).default;
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    await payment.destroy();
    return res.status(200).json({ success: true, message: "Payment deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
