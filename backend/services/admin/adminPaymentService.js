import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import Payment from "../../models/payment.js";
import Contract from "../../models/contract.js";
import Unit from "../../models/unit.js";
import User from "../../models/user.js";
import { createNotification } from "../../services/notificationService.js";
import { createActivityLog } from "../../services/activityLogService.js";
import { sendSMS } from "../../utils/sms.js";
import { sms } from "../../utils/smsTemplates.js";

export const createPayment = async ({ contract_id, category, billing_month, amount, due_date, utility_bill_file }, adminId) => {
  const contract = await Contract.findOne({
    where: { ID: contract_id },
    include: [
      { model: Unit, as: "unit", attributes: ["unit_number"] },
      { model: User, as: "tenants", attributes: ["ID", "contactNumber"], through: { attributes: [] } },
    ],
  });
  if (!contract) throw new Error("Contract not found");
  if (!contract.tenants?.length) throw new Error("No tenant associated with this contract");

  const tenant = contract.tenants[0];
  const unitNumber = contract.unit?.unit_number ?? "—";
  const billingLabel = new Date(billing_month).toLocaleDateString("en-US", { year: "numeric", month: "long" });

  const today = new Date().setHours(0, 0, 0, 0);
  if (new Date(due_date).setHours(0, 0, 0, 0) < today) throw new Error("Due date cannot be in the past.");

  // Only check non-deleted records for duplicates
  const existing = await Payment.findOne({ where: { contract_id, category, billing_month, is_deleted: { [Op.or]: [false, null] } } });
  if (existing) throw new Error("Payment for this month already exists.");

  const payment = await Payment.create({
    contract_id,
    category,
    billing_month,
    amount,
    due_date,
    ...(utility_bill_file ? { utility_bill_file } : {}),
  });

  await createNotification({
    userId: tenant.ID,
    role: "tenant",
    type: "bill created",
    title: "New Bill Generated",
    message: `${category} bill for ${billing_month} has been created.`,
    referenceId: payment.ID,
    referenceType: "payment",
  });

  sendSMS(tenant.contactNumber, sms.billCreated(category, billing_month));

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "CREATE PAYMENT",
    description: `You created a ${category} bill for Unit ${unitNumber} for the month of ${billingLabel}.`,
    referenceId: payment.ID,
    referenceType: "payment",
  });

  return payment;
};

export const getAllPayments = async () => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Mark overdue — exclude hard-deleted and soft-deleted rows
  await Payment.update(
    { status: "Overdue" },
    { where: { due_date: { [Op.lt]: todayStr }, status: "Unpaid", is_deleted: { [Op.or]: [false, null] } } }
  );

  return await Payment.findAll({
    where: { is_deleted: { [Op.or]: [false, null] } },
    include: [{
      model: Contract,
      as: "contract",
      attributes: ["ID", "start_date", "end_date"],
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
    order: [["billing_month", "DESC"]],
  });
};

export const getPaymentsByContract = async (contractId) => {
  return await Payment.findAll({
    where: { contract_id: contractId },
    order: [["billing_month", "DESC"]],
  });
};

export const verifyPayment = async (paymentId, adminId) => {
  const payment = await Payment.findOne({
    where: { ID: paymentId },
    include: [{
      model: Contract,
      as: "contract",
      include: [
        { model: Unit, as: "unit", attributes: ["unit_number"] },
        { model: User, as: "tenants", attributes: ["ID", "contactNumber"], through: { attributes: [] } },
      ],
    }],
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
    referenceType: "payment",
  });

  await createNotification({
    role: "caretaker",
    type: "payment verified",
    title: "Payment Verified",
    message: `Payment ${payment.ID} has been verified by admin.`,
    referenceId: payment.ID,
    referenceType: "payment",
  });

  sendSMS(tenant.contactNumber, sms.paymentVerified(payment.category));

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "VERIFY PAYMENT",
    description: `You verified Unit ${unitNumber}'s ${payment.category} payment receipt.`,
    referenceId: payment.ID,
    referenceType: "payment",
  });

  return payment;
};

export const getMonthlySummary = async (billingMonth) => {
  return await Payment.findAll({
    attributes: [
      [sequelize.col("contract.unit.unit_number"), "unit_number"],
      "billing_month",
      [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"],
    ],
    include: [{
      model: Contract,
      as: "contract",
      attributes: [],
      include: [{ model: Unit, as: "unit", attributes: [] }],
    }],
    where: { billing_month: billingMonth },
    group: ["contract.unit.unit_number", "billing_month"],
    order: [[sequelize.col("contract.unit.unit_number"), "ASC"]],
  });
};

export const getPaymentDashboard = async () => {
  // Sync overdue status before computing dashboard counts (skip soft-deleted bills)
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  await Payment.update(
    { status: "Overdue" },
    { where: { due_date: { [Op.lt]: todayStr }, status: "Unpaid", is_deleted: { [Op.or]: [false, null] } } }
  );

  const totalCollected = (await Payment.sum("amount", { where: { status: "Paid", is_deleted: { [Op.or]: [false, null] } } })) || 0;
  const pendingVerification = await Payment.count({ where: { status: "Pending Verification", is_deleted: { [Op.or]: [false, null] } } });
  const overduePayments = await Payment.count({ where: { status: "Overdue", is_deleted: { [Op.or]: [false, null] } } });

  // Current billing month (YYYY-MM-01)
  const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const currentMonthEndStr = `${currentMonthEnd.getFullYear()}-${String(currentMonthEnd.getMonth() + 1).padStart(2, "0")}-${String(currentMonthEnd.getDate()).padStart(2, "0")}`;

  const totalMonthlyCollected = (await Payment.sum("amount", {
    where: {
      status: "Paid",
      is_deleted: { [Op.or]: [false, null] },
      billing_month: { [Op.between]: [currentMonthStart, currentMonthEndStr] },
    },
  })) || 0;

  const unpaidRecords = await Payment.findAll({
    where: { status: "Unpaid", is_deleted: { [Op.or]: [false, null] } },
    attributes: ["ID"],
    include: [{
      model: Contract,
      as: "contract",
      attributes: ["unit_id"],
      include: [{ model: Unit, as: "unit", attributes: ["unit_number"] }],
    }],
  });

  const unpaidBills = unpaidRecords.length;
  const unpaidUnitNumbers = [
    ...new Set(unpaidRecords.map((p) => p.contract?.unit?.unit_number).filter(Boolean)),
  ].sort((a, b) => a - b);

  const overdueRecords = await Payment.findAll({
    where: { status: "Overdue", is_deleted: { [Op.or]: [false, null] } },
    attributes: ["ID"],
    include: [{
      model: Contract,
      as: "contract",
      attributes: ["unit_id"],
      include: [{ model: Unit, as: "unit", attributes: ["unit_number"] }],
    }],
  });

  const overdueUnitNumbers = [
    ...new Set(overdueRecords.map((p) => p.contract?.unit?.unit_number).filter(Boolean)),
  ].sort((a, b) => a - b);

  const monthlyRevenue = await Payment.findAll({
    attributes: [
      [sequelize.fn("DATE_FORMAT", sequelize.col("billing_month"), "%Y-%m-01"), "billing_month"],
      [sequelize.fn("SUM", sequelize.col("amount")), "total"],
    ],
    where: { status: "Paid" },
    group: ["billing_month"],
    order: [["billing_month", "ASC"]],
    raw: true,
  });

  return { totalCollected, totalMonthlyCollected, currentBillingMonth: currentMonthStart, pendingVerification, overduePayments, unpaidBills, unpaidUnitNumbers, overdueUnitNumbers, monthlyRevenue };
};

export const updatePayment = async (paymentId, data, adminId) => {
  const payment = await Payment.findByPk(paymentId, {
    include: [{ model: Contract, as: "contract", include: [{ model: Unit, as: "unit", attributes: ["unit_number"] }] }],
  });
  if (!payment) throw new Error("Payment not found");

  const allowed = ["category", "billing_month", "amount", "due_date", "payment_date", "paymentType", "referenceNumber", "arNumber", "status", "utility_bill_file"];
  allowed.forEach((key) => { if (data[key] !== undefined) payment[key] = data[key]; });

  // Auto-recalculate status when due_date changes, unless payment is already Paid or Pending Verification
  if (data.due_date !== undefined && payment.status !== "Paid" && payment.status !== "Pending Verification") {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    payment.status = data.due_date < todayStr ? "Overdue" : "Unpaid";
  }

  await payment.save();

  const unitNumber = payment.contract?.unit?.unit_number ?? "—";
  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "UPDATE PAYMENT",
    description: `You updated Unit ${unitNumber}'s ${payment.category} payment record.`,
    referenceId: payment.ID,
    referenceType: "payment",
  });

  return payment;
};

export const deletePayment = async (paymentId, adminId) => {
  const payment = await Payment.findByPk(paymentId, {
    include: [{
      model: Contract,
      as: "contract",
      include: [
        { model: Unit, as: "unit", attributes: ["unit_number"] },
        { model: User, as: "tenants", attributes: ["ID", "contactNumber"], through: { attributes: [] } },
      ],
    }],
  });
  if (!payment) throw new Error("Payment not found");

  // Only unpaid bills (Unpaid / Overdue) can be deleted
  if (payment.status === "Paid") throw new Error("Paid bills cannot be deleted.");
  if (payment.status === "Pending Verification") throw new Error("Bills pending verification cannot be deleted. Reject the receipt first.");

  const unitNumber = payment.contract?.unit?.unit_number ?? "—";
  const category = payment.category;
  const tenant = payment.contract?.tenants?.[0];

  // Hard delete — removes the row entirely so the same bill can be re-created
  await payment.destroy();

  // Notify the tenant in-app
  if (tenant?.ID) {
    await createNotification({
      userId: tenant.ID,
      role: "tenant",
      type: "bill deleted",
      title: "Bill Removed",
      message: `Your ${category} bill has been removed by the admin.`,
      referenceId: paymentId,
      referenceType: "payment",
    });
  }

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "DELETE PAYMENT",
    description: `You deleted Unit ${unitNumber}'s ${category} payment record.`,
    referenceId: paymentId,
    referenceType: "payment",
  });

  // Return tenant ID so the controller can push a real-time socket event
  return { tenantId: tenant?.ID ?? null };
};
