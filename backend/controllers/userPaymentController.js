import cloudinary from "../config/cloudinary.js";
import {
  getMyPayments,
  getPaymentDetails,
  uploadPaymentReceipt
} from "../services/userPaymentService.js";


/* GET TENANT PAYMENTS */
export const getMyPaymentsController = async (req, res) => {
  try {

    const userId = req.auth.id;

    const payments = await getMyPayments(userId);

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


/* GET PAYMENT DETAILS */
export const getPaymentDetailsController = async (req, res) => {
  try {

    const userId = req.auth.id;
    const { id } = req.params;

    const payment = await getPaymentDetails(id, userId);

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


/* UPLOAD RECEIPT */
export const uploadReceiptController = async (req, res) => {
  try {

    const userId = req.auth.id;
    const { id } = req.params;
    const { paymentType, referenceNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Receipt image is required"
      });
    }

    const imageUrl = req.file.path;

    const payment = await uploadPaymentReceipt(
      id,
      imageUrl,
      userId,
      paymentType,
      referenceNumber
    );

    return res.status(200).json({
      success: true,
      message: "Receipt uploaded successfully",
      payment
    });

  } catch (error) {

    // Delete uploaded image if validation fails
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });

  }
};