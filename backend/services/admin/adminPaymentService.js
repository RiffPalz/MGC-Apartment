import { sequelize } from "../../config/database.js";
import Payment from "../../models/payment.js";
import Contract from "../../models/contract.js";
import Unit from "../../models/unit.js";
import User from "../../models/user.js";
import { createNotification } from "../../services/notificationService.js";
import { createActivityLog } from "../../services/activityLogService.js";

// Create a new bill, notify the tenant, and log the admin action
export const createPayment = async ({
    contract_id,
    category,
    billing_month,
    amount,
    due_date
}, adminId) => {

    // Verify contract exists and identify the primary tenant
    const contract = await Contract.findOne({
        where: { ID: contract_id },
        include: [
            {
                model: User,
                as: "tenants",
                attributes: ["ID"],
                through: { attributes: [] }
            }
        ]
    });

    if (!contract) throw new Error("Contract not found");
    if (!contract.tenants?.length) throw new Error("No tenant associated with this contract");

    const tenantId = contract.tenants[0].ID;

    // Validate that the due date is not in the past
    const today = new Date().setHours(0, 0, 0, 0);
    const dueDate = new Date(due_date).setHours(0, 0, 0, 0);
    if (dueDate < today) throw new Error("That date is already past.");

    // Prevent duplicate billing for the same category and month
    const existing = await Payment.findOne({
        where: { contract_id, category, billing_month }
    });
    if (existing) throw new Error("Payment for this month already exists.");

    const payment = await Payment.create({
        contract_id,
        category,
        billing_month,
        amount,
        due_date
    });

    // Notify tenant of the new bill
    await createNotification({
        userId: tenantId,
        role: "tenant",
        type: "bill_created",
        title: "New Bill Generated",
        message: `${category} bill for ${billing_month} has been created.`,
        referenceId: payment.ID,
        referenceType: "payment"
    });

    // Log which admin created this bill
    await createActivityLog({
        userId: adminId,
        role: "admin",
        action: "CREATE_PAYMENT",
        description: `Created ${category} bill for contract ${contract_id}`,
        referenceId: payment.ID,
        referenceType: "payment"
    });

    return payment;
};

// Fetch all payments with detailed unit and tenant information
export const getAllPayments = async () => {
    return await Payment.findAll({
        include: [
            {
                model: Contract,
                as: "contract",
                attributes: ["ID", "start_date", "end_date"],
                include: [
                    { model: Unit, as: "unit", attributes: ["unit_number", "floor"] },
                    {
                        model: User,
                        as: "tenants",
                        attributes: ["ID", "fullName", "publicUserID"],
                        through: { attributes: [] }
                    },
                ],
            },
        ],
        order: [["created_at", "DESC"]],
    });
};

// Fetch history for a specific contract
export const getPaymentsByContract = async (contractId) => {
    return await Payment.findAll({
        where: { contract_id: contractId },
        order: [["billing_month", "DESC"]],
    });
};

// Confirm payment receipt, notify parties, and log the verification
export const verifyPayment = async (paymentId, adminId) => {

    const payment = await Payment.findOne({
        where: { ID: paymentId },
        include: [{
            model: Contract,
            as: "contract",
            include: [{ model: User, as: "tenants", attributes: ["ID"], through: { attributes: [] } }]
        }]
    });

    if (!payment) throw new Error("Payment not found");
    if (payment.status !== "Pending Verification") throw new Error("Payment is not awaiting verification");

    const tenantId = payment.contract.tenants[0].ID;
    payment.status = "Paid";
    await payment.save();

    // Notify tenant and caretaker of the verification
    await createNotification({
        userId: tenantId,
        role: "tenant",
        type: "payment_verified",
        title: "Payment Verified",
        message: "Your payment has been verified successfully.",
        referenceId: payment.ID,
        referenceType: "payment"
    });

    await createNotification({
        role: "caretaker",
        type: "payment_verified",
        title: "Payment Verified",
        message: `Payment ${payment.ID} has been verified by admin.`,
        referenceId: payment.ID,
        referenceType: "payment"
    });

    // Log which admin verified the payment
    await createActivityLog({
        userId: adminId,
        role: "admin",
        action: "VERIFY_PAYMENT",
        description: `Verified payment ${payment.ID} for contract ${payment.contract_id}`,
        referenceId: payment.ID,
        referenceType: "payment"
    });

    return payment;
};

// Sum up all bills per unit for a specific month
export const getMonthlySummary = async (billingMonth) => {
    return await Payment.findAll({
        attributes: [
            [sequelize.col("contract.unit.unit_number"), "unit_number"],
            "billing_month",
            [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"]
        ],
        include: [{
            model: Contract, as: "contract", attributes: [],
            include: [{ model: Unit, as: "unit", attributes: [] }]
        }],
        where: { billing_month: billingMonth },
        group: ["contract.unit.unit_number", "billing_month"],
        order: [[sequelize.col("contract.unit.unit_number"), "ASC"]]
    });
};

// Calculate totals and counts for the Admin Dashboard
export const getPaymentDashboard = async () => {
    const totalCollected = await Payment.sum("amount", { where: { status: "Paid" } });
    const pendingVerification = await Payment.count({ where: { status: "Pending Verification" } });
    const overduePayments = await Payment.count({ where: { status: "Overdue" } });
    const unpaidBills = await Payment.count({ where: { status: "Unpaid" } });

    const monthlyRevenue = await Payment.findAll({
        attributes: ["billing_month", [sequelize.fn("SUM", sequelize.col("amount")), "total"]],
        where: { status: "Paid" },
        group: ["billing_month"],
        order: [["billing_month", "ASC"]]
    });

    return {
        totalCollected: totalCollected || 0,
        pendingVerification,
        overduePayments,
        unpaidBills,
        monthlyRevenue
    };
};