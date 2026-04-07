import cloudinary from "../../config/cloudinary.js";
import {
  createPayment, getAllPayments, getPaymentsByContract,
  verifyPayment, getMonthlySummary, getPaymentDashboard,
  updatePayment, deletePayment,
} from "../../services/admin/adminPaymentService.js";
import { emitEvent } from "../../utils/emitEvent.js";

// Create payment + notify tenant
export const createPaymentAdmin = async (req, res) => {
  try {
    const adminId = req.admin?.id || req.auth?.id;
    const { contract_id, category, billing_month, amount, due_date } = req.body;

    const utility_bill_file = req.file
      ? (req.file.secure_url || req.file.path)
      : null;

    const payment = await createPayment(
      { contract_id, category, billing_month, amount, due_date, utility_bill_file },
      adminId
    );

    emitEvent(req, "payment_updated");

    // Send real-time notification
    const io = req.app.get("io");
    const targetUser = payment.user_id || payment.tenant_id;

    if (targetUser) {
      io.to(`user_${targetUser}`).emit("new_notification", {
        title: "New Bill Posted",
        message: `A new ${category} bill for ${billing_month} has been posted.`,
        type: "payment",
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    return res.status(201).json({
      success: true,
      message: "Payment bill created successfully",
      payment
    });

  } catch (error) {
    // Cleanup uploaded file on error
    if (req.file?.filename) {
      await cloudinary.uploader
        .destroy(req.file.filename, { resource_type: "raw" })
        .catch(console.error);
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all payments
export const getAllPaymentsAdmin = async (req, res) => {
  try {
    const payments = await getAllPayments();

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments"
    });
  }
};

// Get payments by contract
export const getPaymentsByContractAdmin = async (req, res) => {
  try {
    const payments = await getPaymentsByContract(req.params.id);

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contract payments"
    });
  }
};

// Verify payment + notify tenant
export const verifyPaymentAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id || req.auth?.id;

    const payment = await verifyPayment(id, adminId);

    emitEvent(req, "payment_updated");

    // Send real-time notification
    const io = req.app.get("io");
    const targetUser = payment.user_id || payment.tenant_id;

    if (targetUser) {
      io.to(`user_${targetUser}`).emit("new_notification", {
        title: "Payment Verified",
        message: "Your payment has been verified.",
        type: "payment",
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get monthly summary
export const getMonthlySummaryAdmin = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Month is required"
      });
    }

    const summary = await getMonthlySummary(month);

    return res.status(200).json({
      success: true,
      summary
    });

  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly summary"
    });
  }
};

// Get dashboard data
export const getPaymentDashboardAdmin = async (req, res) => {
  try {
    const dashboard = await getPaymentDashboard();

    return res.status(200).json({
      success: true,
      dashboard
    });

  } catch (error) {
    console.error("getPaymentDashboard error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch dashboard data"
    });
  }
};

// Update payment
export const updatePaymentAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id || req.auth?.id;

    if (req.file) {
      req.body.utility_bill_file = req.file.secure_url || req.file.path;
    }

    const payment = await updatePayment(id, req.body, adminId);

    emitEvent(req, "payment_updated");

    return res.status(200).json({
      success: true,
      message: "Payment updated",
      payment
    });

  } catch (error) {
    console.error("updatePaymentAdmin error:", error);

    // Cleanup uploaded file on error
    if (req.file?.filename) {
      await cloudinary.uploader
        .destroy(req.file.filename, { resource_type: "raw" })
        .catch(console.error);
    }

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete payment
export const deletePaymentAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id || req.auth?.id;

    await deletePayment(id, adminId);

    emitEvent(req, "payment_updated");

    return res.status(200).json({
      success: true,
      message: "Payment deleted"
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};