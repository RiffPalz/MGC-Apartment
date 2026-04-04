import {
    getAllPayments, getPendingPayments, verifyPayment
} from "../../services/caretaker/caretakerPaymentService.js";
import { emitEvent } from "../../utils/emitEvent.js";


// Get all payments
export const getAllPaymentsController = async (req, res) => {
    try {

        const payments = await getAllPayments();

        return res.status(200).json({
            success: true,
            count: payments.length,
            payments
        });

    } catch (error) {

        console.error("Fetch payments error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch payments"
        });

    }
};


// Get payments waiting for verification
export const getPendingPaymentsController = async (req, res) => {
    try {

        const payments = await getPendingPayments();

        return res.status(200).json({
            success: true,
            count: payments.length,
            payments
        });

    } catch (error) {

        console.error("Fetch pending payments error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending payments"
        });

    }
};


// Verify tenant payment
export const verifyPaymentController = async (req, res) => {
    try {

        const { id } = req.params;
        const caretakerId = req.caretaker.id;

        const payment = await verifyPayment(id, caretakerId);
        emitEvent(req, "payment_updated");
        return res.status(200).json({ success: true, message: "Payment verified successfully", payment });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};

// Delete a payment record
export const deletePaymentController = async (req, res) => {
    try {
        const { id } = req.params;
        const Payment = (await import("../../models/payment.js")).default;
        const payment = await Payment.findByPk(id);
        if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
        await payment.destroy();
        return res.status(200).json({ success: true, message: "Payment deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
