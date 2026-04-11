import cloudinary from "../config/cloudinary.js";
import {
  getMyPayments,
  getPaymentDetails,
  uploadPaymentReceipt
} from "../services/userPaymentService.js";
import { emitEvent } from "../utils/emitEvent.js";

// Get user's payments
export const getMyPaymentsController = async (req, res) => {
  try {
    const payments = await getMyPayments(req.auth.id);

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get payment details
export const getPaymentDetailsController = async (req, res) => {
  try {
    const payment = await getPaymentDetails(req.params.id, req.auth.id);

    return res.status(200).json({
      success: true,
      payment
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Upload receipt + notify admin/caretaker
export const uploadReceiptController = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentType, referenceNumber, arNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Receipt image is required"
      });
    }

    const payment = await uploadPaymentReceipt(
      id,
      req.file.path,
      req.auth.id,
      paymentType,
      referenceNumber,
      arNumber
    );

    emitEvent(req, "payment_updated");

    // Send notification
    const io = req.app.get("io");
    const payload = {
      title: "Payment Receipt Uploaded",
      message: "A tenant uploaded a payment receipt.",
      type: "payment",
      is_read: false,
      created_at: new Date().toISOString()
    };

    io.to("admin").emit("new_notification", payload);
    io.to("caretaker").emit("new_notification", payload);

    return res.status(200).json({
      success: true,
      message: "Receipt uploaded successfully",
      payment
    });

  } catch (error) {
    // Cleanup uploaded file on error
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};