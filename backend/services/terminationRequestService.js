import TerminationRequest from "../models/terminationRequest.js";
import Contract from "../models/contract.js";
import Unit from "../models/unit.js";
import User from "../models/user.js";
import { generateTenantTerminationRequestPdf } from "./admin/contractPdfService.js";
import { createNotification } from "./notificationService.js";
import { createActivityLog } from "./activityLogService.js";
import { sendSMSBulk } from "../utils/sms.js";
import { sms } from "../utils/smsTemplates.js";

/* TENANT: Submit a termination request */
export const submitTerminationRequest = async (userId, { lessee_name, lessee_address, vacate_date }) => {
    if (!lessee_name || !lessee_address || !vacate_date) {
        throw new Error("All fields are required.");
    }

    // Find the tenant's active contract
    const contract = await Contract.findOne({
        include: [
            { model: User, as: "tenants", where: { ID: userId }, required: true, through: { attributes: [] } },
            { model: Unit, as: "unit", attributes: ["unit_number"] },
        ],
        where: { status: "Active" },
    });

    if (!contract) throw new Error("No active contract found.");

    // Prevent duplicate pending requests
    const existing = await TerminationRequest.findOne({
        where: { contract_id: contract.ID, user_id: userId, status: "Pending" },
    });
    if (existing) throw new Error("You already have a pending termination request.");

    // Generate PDF
    const pdfUrl = await generateTenantTerminationRequestPdf({
        unit_number: contract.unit?.unit_number,
        lessee_name,
        lessee_address,
        contract_date: contract.start_date,
        vacate_date,
        request_date: new Date(),
    });

    const request = await TerminationRequest.create({
        contract_id: contract.ID,
        user_id: userId,
        lessee_name,
        lessee_address,
        vacate_date,
        request_pdf: pdfUrl,
        status: "Pending",
    });

    // Notify admin
    await createNotification({
        role: "admin",
        type: "termination request",
        title: "Termination Request Submitted",
        message: `Tenant of Unit ${contract.unit?.unit_number} submitted a termination request.`,
        referenceId: request.ID,
        referenceType: "termination_request",
    });

    // SMS → admin & caretaker staff
    const staffUsers = await User.findAll({
        where: { role: ["admin", "caretaker"] },
        attributes: ["contactNumber"],
    });
    sendSMSBulk(
        staffUsers.map((u) => u.contactNumber).filter(Boolean),
        sms.terminationRequestSubmitted(lessee_name, contract.unit?.unit_number)
    );

    await createActivityLog({
        userId,
        role: "tenant",
        action: "SUBMIT TERMINATION REQUEST",
        description: `You submitted a termination request.`,
        referenceId: request.ID,
        referenceType: "termination_request",
    });

    return request;
};

/* TENANT: Get own termination request for active/terminated contract */
export const getTenantTerminationRequest = async (userId) => {
    const request = await TerminationRequest.findOne({
        where: { user_id: userId },
        order: [["created_at", "DESC"]],
        include: [
            { model: Contract, as: "contract", attributes: ["ID", "status", "unit_id"], include: [{ model: Unit, as: "unit", attributes: ["unit_number"] }] },
        ],
    });
    return request;
};

/* ADMIN: Get all termination requests */
export const getAllTerminationRequests = async () => {
    return await TerminationRequest.findAll({
        order: [["created_at", "DESC"]],
        include: [
            { model: User, as: "tenant", attributes: ["ID", "fullName", "emailAddress", "contactNumber"] },
            { model: Contract, as: "contract", attributes: ["ID", "status", "unit_id"], include: [{ model: Unit, as: "unit", attributes: ["unit_number"] }] },
        ],
    });
};

/* ADMIN: Approve a termination request → updates end_date, cron handles actual termination */
export const approveTerminationRequest = async (requestId, adminId) => {
    const request = await TerminationRequest.findByPk(requestId, {
        include: [
            { model: Contract, as: "contract" },
            { model: User, as: "tenant" },
        ],
    });
    if (!request) throw new Error("Termination request not found.");
    if (request.status !== "Pending") throw new Error("Request is no longer pending.");

    await request.update({ status: "Approved" });

    // Update the contract end_date to the tenant's requested vacate date.
    // The daily cron will auto-complete the contract when that date arrives.
    if (request.contract?.status === "Active") {
        await Contract.update(
            { end_date: request.vacate_date },
            { where: { ID: request.contract_id } }
        );
    }

    await createNotification({
        userId: request.user_id,
        role: "tenant",
        type: "termination request approved",
        title: "Termination Request Approved",
        message: `Your termination request has been approved. Your contract will end on ${new Date(request.vacate_date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}.`,
        referenceId: request.ID,
        referenceType: "termination_request",
    });

    // SMS → tenant
    if (request.tenant?.contactNumber) {
        sendSMSBulk(
            [request.tenant.contactNumber],
            sms.terminationRequestApproved(request.contract?.unit?.unit_number ?? "", request.vacate_date)
        );
    }

    await createActivityLog({
        userId: adminId,
        role: "admin",
        action: "APPROVE TERMINATION REQUEST",
        description: `You approved the termination request from ${request.tenant?.fullName ?? "tenant"}. Contract end date updated to ${request.vacate_date}.`,
        referenceId: request.ID,
        referenceType: "termination_request",
    });

    return request;
};

/* ADMIN: Reject a termination request */
export const rejectTerminationRequest = async (requestId, adminId) => {
    const request = await TerminationRequest.findByPk(requestId, {
        include: [{ model: User, as: "tenant" }],
    });
    if (!request) throw new Error("Termination request not found.");
    if (request.status !== "Pending") throw new Error("Request is no longer pending.");

    await request.update({ status: "Rejected" });

    await createNotification({
        userId: request.user_id,
        role: "tenant",
        type: "termination request rejected",
        title: "Termination Request Rejected",
        message: "Your termination request has been rejected. Please contact management for more information.",
        referenceId: request.ID,
        referenceType: "termination_request",
    });

    // SMS → tenant
    if (request.tenant?.contactNumber) {
        sendSMSBulk(
            [request.tenant.contactNumber],
            sms.terminationRequestRejected(request.contract?.unit?.unit_number ?? "")
        );
    }

    await createActivityLog({
        userId: adminId,
        role: "admin",
        action: "REJECT TERMINATION REQUEST",
        description: `You rejected the termination request from ${request.tenant?.fullName ?? "tenant"}.`,
        referenceId: request.ID,
        referenceType: "termination_request",
    });

    return request;
};
