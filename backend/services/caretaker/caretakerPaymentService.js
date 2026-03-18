import Payment from "../../models/payment.js";
import Contract from "../../models/contract.js";
import Unit from "../../models/unit.js";
import User from "../../models/user.js";
import { createNotification } from "../../services/notificationService.js";
import { createActivityLog } from "../../services/activityLogService.js";


/* GET ALL PAYMENTS */
export const getAllPayments = async () => {

    const payments = await Payment.findAll({
        include: [
            {
                model: Contract,
                as: "contract",
                attributes: ["ID"],
                include: [
                    {
                        model: Unit,
                        as: "unit",
                        attributes: ["unit_number", "floor"]
                    },
                    {
                        model: User,
                        as: "tenants",
                        attributes: ["ID", "fullName", "publicUserID"],
                        through: { attributes: [] }
                    }
                ]
            }
        ],
        order: [["created_at", "DESC"]]
    });

    return payments;
};


/* GET PENDING PAYMENTS */
export const getPendingPayments = async () => {

    const payments = await Payment.findAll({
        where: { status: "Pending Verification" },
        include: [
            {
                model: Contract,
                as: "contract",
                include: [
                    {
                        model: Unit,
                        as: "unit",
                        attributes: ["unit_number"]
                    },
                    {
                        model: User,
                        as: "tenants",
                        attributes: ["ID", "fullName"],
                        through: { attributes: [] }
                    }
                ]
            }
        ],
        order: [["created_at", "DESC"]]
    });

    return payments;
};


/* VERIFY PAYMENT */
export const verifyPayment = async (paymentId, caretakerId) => {

    const payment = await Payment.findOne({
        where: { ID: paymentId },
        include: [
            {
                model: Contract,
                as: "contract",
                include: [
                    {
                        model: User,
                        as: "tenants",
                        attributes: ["ID"],
                        through: { attributes: [] }
                    }
                ]
            }
        ]
    });

    if (!payment) {
        throw new Error("Payment not found");
    }

    if (payment.status !== "Pending Verification") {
        throw new Error("Payment is not awaiting verification");
    }

    const tenantId = payment.contract.tenants?.[0]?.ID;

    payment.status = "Paid";
    await payment.save();

    await createNotification({
        role: "tenant",
        userId: tenantId,
        type: "payment_verified",
        title: "Payment Verified",
        message: "Your payment has been verified successfully.",
        referenceId: payment.ID,
        referenceType: "payment"
    });

    await createNotification({
        role: "admin",
        type: "payment_verified",
        title: "Payment Verified",
        message: `Payment ${payment.ID} verified by caretaker.`,
        referenceId: payment.ID,
        referenceType: "payment"
    });

    await createActivityLog({
        userId: caretakerId,
        role: "caretaker",
        action: "VERIFY_PAYMENT",
        description: `Verified payment ${payment.ID}`,
        referenceId: payment.ID,
        referenceType: "payment"
    });

    return payment;
};