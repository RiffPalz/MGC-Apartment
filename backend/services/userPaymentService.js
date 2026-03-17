import Payment from "../models/payment.js";
import Contract from "../models/contract.js";
import User from "../models/user.js";
import Unit from "../models/unit.js";
import { createNotification } from "../services/notificationService.js";
import { createActivityLog } from "../services/activityLogService.js";


/* GET TENANT PAYMENTS */
export const getMyPayments = async (userId) => {

    const payments = await Payment.findAll({
        include: [
            {
                model: Contract,
                as: "contract",
                required: true,
                attributes: ["ID"],
                include: [
                    {
                        model: User,
                        as: "tenants",
                        required: true,
                        attributes: ["ID"],
                        where: { ID: userId },
                        through: { attributes: [] }
                    },
                    {
                        model: Unit,
                        as: "unit",
                        attributes: ["unit_number", "floor"]
                    }
                ]
            }
        ],
        order: [["billing_month", "DESC"]]
    });

    return payments;
};


/* GET PAYMENT DETAILS */
export const getPaymentDetails = async (paymentId, userId) => {

    const payment = await Payment.findOne({
        where: { ID: paymentId },
        include: [
            {
                model: Contract,
                as: "contract",
                required: true,
                include: [
                    {
                        model: User,
                        as: "tenants",
                        attributes: ["ID"],
                        where: { ID: userId },
                        through: { attributes: [] }
                    }
                ]
            }
        ]
    });

    if (!payment) {
        throw new Error("Payment not found or access denied");
    }

    return payment;
};


/* UPLOAD RECEIPT */
export const uploadPaymentReceipt = async (
    paymentId,
    imageUrl,
    userId,
    paymentType,
    referenceNumber
) => {

    const payment = await Payment.findOne({
        where: { ID: paymentId },
        include: [
            {
                model: Contract,
                as: "contract",
                required: true,
                include: [
                    {
                        model: User,
                        as: "tenants",
                        attributes: ["ID"],
                        where: { ID: userId },
                        through: { attributes: [] }
                    }
                ]
            }
        ]
    });

    if (!payment) {
        throw new Error("Payment not found or access denied");
    }

    if (payment.status !== "Unpaid" && payment.status !== "Overdue") {
        throw new Error("Receipt already uploaded or payment processed");
    }

    // Validate payment type
    if (!paymentType) {
        throw new Error("Payment type is required");
    }

    if (!["Cash", "GCash"].includes(paymentType)) {
        throw new Error("Invalid payment type");
    }

    // Cash payments should not have reference number
    if (paymentType === "Cash") {
        referenceNumber = null;
    }

    // GCash must have reference number
    if (paymentType === "GCash" && !referenceNumber) {
        throw new Error("Reference number is required for GCash payments");
    }

    // Prevent duplicate GCash reference
    if (paymentType === "GCash") {

        const existingReference = await Payment.findOne({
            where: { referenceNumber }
        });

        if (existingReference) {
            throw new Error("Reference number already used");
        }
    }

    // Save payment
    payment.receipt_image = imageUrl;
    payment.paymentType = paymentType;
    payment.referenceNumber = referenceNumber;
    payment.status = "Pending Verification";

    // Record payment date when tenant uploads receipt
    payment.payment_date = new Date();

    await payment.save();

    /* NOTIFY ADMIN */
    await createNotification({
        role: "admin",
        type: "payment_receipt_uploaded",
        title: "Payment Receipt Uploaded",
        message: "A tenant uploaded a payment receipt for verification.",
        referenceId: payment.ID,
        referenceType: "payment"
    });

    /* NOTIFY CARETAKER */
    await createNotification({
        role: "caretaker",
        type: "payment_receipt_uploaded",
        title: "Payment Receipt Uploaded",
        message: "A tenant uploaded a payment receipt for verification.",
        referenceId: payment.ID,
        referenceType: "payment"
    });

    /* LOG ACTIVITY */
    await createActivityLog({
        userId,
        role: "tenant",
        action: "UPLOAD_PAYMENT_RECEIPT",
        description: `Tenant uploaded receipt for payment ID ${payment.ID}`,
        referenceId: payment.ID,
        referenceType: "payment"
    });

    return payment;
};