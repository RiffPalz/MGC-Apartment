import Payment from "../../models/payment.js";
import Contract from "../../models/contract.js";
import Unit from "../../models/unit.js";
import User from "../../models/user.js";
import { createNotification } from "../../services/notificationService.js";
import { createActivityLog } from "../../services/activityLogService.js";
import { sendSMS } from "../../utils/sms.js";
import { sms } from "../../utils/smsTemplates.js";

export const getAllPayments = async () => {
  return await Payment.findAll({
    include: [{
      model: Contract,
      as: "contract",
      attributes: ["ID"],
      include: [
        { model: Unit, as: "unit", attributes: ["unit_number", "floor"] },
        {
          model: User,
          as: "tenants",
          attributes: ["ID", "fullName", "publicUserID", "contactNumber"],
          through: { attributes: [] },
        },
      ],
    }],
    order: [["created_at", "DESC"]],
  });
};

export const getPendingPayments = async () => {
  return await Payment.findAll({
    where: { status: "Pending Verification" },
    include: [{
      model: Contract,
      as: "contract",
      include: [
        { model: Unit, as: "unit", attributes: ["unit_number"] },
        {
          model: User,
          as: "tenants",
          attributes: ["ID", "fullName", "contactNumber"],
          through: { attributes: [] },
        },
      ],
    }],
    order: [["created_at", "DESC"]],
  });
};

export const verifyPayment = async (paymentId, caretakerId) => {
  const payment = await Payment.findOne({
    where: { ID: paymentId },
    include: [{
      model: Contract,
      as: "contract",
      include: [
        { model: Unit, as: "unit", attributes: ["unit_number"] },
        {
          model: User,
          as: "tenants",
          attributes: ["ID", "contactNumber"],
          through: { attributes: [] },
        },
      ],
    }],
  });

  if (!payment) throw new Error("Payment not found");
  if (payment.status !== "Pending Verification") throw new Error("Payment is not awaiting verification");

  const tenantId = payment.contract.tenants?.[0]?.ID;
  payment.status = "Paid";
  await payment.save();

  await createNotification({
    role: "tenant",
    userId: tenantId,
    type: "payment verified",
    title: "Payment Verified",
    message: "Your payment has been verified successfully.",
    referenceId: payment.ID,
    referenceType: "payment",
  });

  await createNotification({
    role: "admin",
    type: "payment verified",
    title: "Payment Verified",
    message: `Payment ${payment.ID} verified by caretaker.`,
    referenceId: payment.ID,
    referenceType: "payment",
  });

  sendSMS(payment.contract.tenants?.[0]?.contactNumber, sms.paymentVerified(payment.category));

  await createActivityLog({
    userId: caretakerId,
    role: "caretaker",
    action: "VERIFY PAYMENT",
    description: `You verified Unit ${payment.contract?.unit?.unit_number ?? "—"}'s ${payment.category} receipt.`,
    referenceId: payment.ID,
    referenceType: "payment",
  });

  return payment;
};
