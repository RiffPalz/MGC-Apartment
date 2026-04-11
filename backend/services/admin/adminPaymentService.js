import { sequelize } from "../../config/database.js";
import Payment from "../../models/payment.js";
import Contract from "../../models/contract.js";
import Unit from "../../models/unit.js";
import User from "../../models/user.js";
import { createNotification } from "../../services/notificationService.js";
import { createActivityLog } from "../../services/activityLogService.js";
import { sendSMS, sendSMSBulk } from "../../utils/sms.js";
import { sms } from "../../utils/smsTemplates.js";

/* CREATE PAYMENT */
export const createPayment = async ({ contract_id, category, billing_month, amount, due_date, utility_bill_file }, adminId) => {
  const contract = await Contract.findOne({
    where: { ID: contract_id },
    include: [
      { model: Unit, as: "unit", attributes: ["unit_number"] },
      { model: User, as: "tenants", attributes: ["ID", "contactNumber"], through: { attributes: [] } }
    ]
  });
  if (!contract) throw new Error("Contract not found");
  if (!contract.tenants?.length) throw new Error("No tenant associated with this contract");

  const tenant = contract.tenants[0];
  const unitNumber = contract.unit?.unit_number ?? "—";
  const billingLabel = new Date(billing_month).toLocaleDateString("en-US", { year: "numeric", month: "long" });

  const today = new Date().setHours(0, 0, 0, 0);
  const dueDate = new Date(due_date).setHours(0, 0, 0, 0);
  if (dueDate < today) throw new Error("Due date cannot be in the past.");

  const existing = await Payment.findOne({ where: { contract_id, category, billing_month } });
  if (existing) throw new Error("Payment for this month already exists.");

  const payment = await Payment.create({
    contract_id, category, billing_month, amount, due_date,
    ...(utility_bill_file ? { utility_bill_file } : {}),
  });

  await createNotification({
    userId: tenant.ID,
    role: "tenant",
    type: "bill created",
    title: "New Bill Generated",
    message: `${category} bill for ${billing_month} has been created.`,
    referenceId: payment.ID,
    referenceType: "payment"
  });

  sendSMS(tenant.contactNumber, sms.billCreated(category, billing_month));

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "CREATE PAYMENT",
    description: `You created a ${category} bill for Unit ${unitNumber} for the month of ${billingLabel}.`,
    referenceId: payment.ID,
    referenceType: "payment"
  });

  return payment;
};

/* GET ALL PAYMENTS WITH DETAILS */
export const getAllPayments = async () => {
  return await Payment.findAll({
    include: [
      {
        model: Contract,
        as: "contract",
        attributes: ["ID", "start_date", "end_date"],
        include: [
          { model: Unit, as: "unit", attributes: ["unit_number", "floor"] },
          { model: User, as: "tenants", attributes: ["ID", "fullName", "publicUserID", "contactNumber"], through: { attributes: [] } }
        ]
      }
    ],
    order: [["created_at", "DESC"]]
  });
};

/* GET PAYMENTS BY CONTRACT */
export const getPaymentsByContract = async (contractId) => {
  return await Payment.findAll({
    where: { contract_id: contractId },
    order: [["billing_month", "DESC"]]
  });
};

/* VERIFY PAYMENT */
export const verifyPayment = async (paymentId, adminId) => {
  const payment = await Payment.findOne({
    where: { ID: paymentId },
    include: [{
      model: Contract,
      as: "contract",
      include: [
        { model: Unit, as: "unit", attributes: ["unit_number"] },
        { model: User, as: "tenants", attributes: ["ID", "contactNumber"], through: { attributes: [] } }
      ]
    }]
  });

  if (!payment) throw new Error("Payment not found");
  if (payment.status !== "Pending Verification") throw new Error("Payment is not awaiting verification");

  const tenant = payment.contract.tenants[0];
  const unitNumber = payment.contract.unit?.unit_number ?? "—";
  payment.status = "Paid";
  await payment.save();

  await createNotification({
    userId: tenant.ID,
    role: "tenant",
    type: "payment verified",
    title: "Payment Verified",
    message: "Your payment has been verified successfully.",
    referenceId: payment.ID,
    referenceType: "payment"
  });

  await createNotification({
    role: "caretaker",
    type: "payment verified",
    title: "Payment Verified",
    message: `Payment ${payment.ID} has been verified by admin.`,
    referenceId: payment.ID,
    referenceType: "payment"
  });

  sendSMS(tenant.contactNumber, sms.paymentVerified(payment.category));

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "VERIFY PAYMENT",
    description: `You verified Unit ${unitNumber}'s ${payment.category} payment receipt.`,
    referenceId: payment.ID,
    referenceType: "payment"
  });

  return payment;
};

/* MONTHLY PAYMENT SUMMARY */
export const getMonthlySummary = async (billingMonth) => {
  return await Payment.findAll({
    attributes: [
      [sequelize.col("contract.unit.unit_number"), "unit_number"],
      "billing_month",
      [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"]
    ],
    include: [{ model: Contract, as: "contract", attributes: [], include: [{ model: Unit, as: "unit", attributes: [] }] }],
    where: { billing_month: billingMonth },
    group: ["contract.unit.unit_number", "billing_month"],
    order: [[sequelize.col("contract.unit.unit_number"), "ASC"]]
  });
};

/* DASHBOARD SUMMARY */
export const getPaymentDashboard = async () => {
  const totalCollected = await Payment.sum("amount", { where: { status: "Paid" } }) || 0;
  const pendingVerification = await Payment.count({ where: { status: "Pending Verification" } });
  const overduePayments = await Payment.count({ where: { status: "Overdue" } });
  const unpaidBills = await Payment.count({ where: { status: "Unpaid" } });

  const monthlyRevenue = await Payment.findAll({
    attributes: [
      [sequelize.fn("DATE_FORMAT", sequelize.col("billing_month"), "%Y-%m-01"), "billing_month"],
      [sequelize.fn("SUM", sequelize.col("amount")), "total"],
    ],
    where: { status: "Paid" },
    group: ["billing_month"], // <-- Change this to use the alias
    order: [["billing_month", "ASC"]], // <-- Change this to use the alias
    raw: true,
  });

  return { totalCollected, pendingVerification, overduePayments, unpaidBills, monthlyRevenue };
};

/* UPDATE PAYMENT */
export const updatePayment = async (paymentId, data, adminId) => {
  const payment = await Payment.findByPk(paymentId, {
    include: [{ model: Contract, as: "contract", include: [{ model: Unit, as: "unit", attributes: ["unit_number"] }] }]
  });
  if (!payment) throw new Error("Payment not found");

  const allowed = ["category", "billing_month", "amount", "due_date", "payment_date", "paymentType", "referenceNumber", "arNumber", "status", "utility_bill_file"];
  allowed.forEach((key) => { if (data[key] !== undefined) payment[key] = data[key]; });
  await payment.save();

  const unitNumber = payment.contract?.unit?.unit_number ?? "—";
  await createActivityLog({
    userId: adminId, role: "admin",
    action: "UPDATE PAYMENT",
    description: `You updated Unit ${unitNumber}'s ${payment.category} payment record.`,
    referenceId: payment.ID, referenceType: "payment",
  });

  return payment;
};

/* DELETE PAYMENT */
export const deletePayment = async (paymentId, adminId) => {
  const payment = await Payment.findByPk(paymentId, {
    include: [{ model: Contract, as: "contract", include: [{ model: Unit, as: "unit", attributes: ["unit_number"] }] }]
  });
  if (!payment) throw new Error("Payment not found");

  const unitNumber = payment.contract?.unit?.unit_number ?? "—";
  const category = payment.category;
  await payment.destroy();

  await createActivityLog({
    userId: adminId, role: "admin",
    action: "DELETE PAYMENT",
    description: `You deleted Unit ${unitNumber}'s ${category} payment record.`,
    referenceId: paymentId, referenceType: "payment",
  });
};
