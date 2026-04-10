import {
    submitTerminationRequest,
    getTenantTerminationRequest,
    getAllTerminationRequests,
    approveTerminationRequest,
    rejectTerminationRequest,
} from "../services/terminationRequestService.js";
import { emitEvent } from "../utils/emitEvent.js";

/* TENANT: Submit */
export const submitTerminationRequestController = async (req, res) => {
    try {
        const userId = req.auth.id;
        const { lessee_name, lessee_address, vacate_date } = req.body;
        const request = await submitTerminationRequest(userId, { lessee_name, lessee_address, vacate_date });
        emitEvent(req, "termination_request_updated");
        const io = req.app.get("io");
        io.to("admin").emit("new_notification", {
            title: "Termination Request",
            message: "A tenant submitted a termination request.",
            type: "termination_request",
            is_read: false,
            created_at: new Date().toISOString(),
        });
        return res.status(201).json({ success: true, message: "Termination request submitted.", request });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

/* TENANT: Get own request */
export const getTenantTerminationRequestController = async (req, res) => {
    try {
        const userId = req.auth.id;
        const request = await getTenantTerminationRequest(userId);
        return res.status(200).json({ success: true, request: request || null });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ADMIN: Get all */
export const getAllTerminationRequestsController = async (req, res) => {
    try {
        const requests = await getAllTerminationRequests();
        return res.status(200).json({ success: true, requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ADMIN: Approve */
export const approveTerminationRequestController = async (req, res) => {
    try {
        const adminId = req.admin?.id || req.auth?.id;
        const request = await approveTerminationRequest(req.params.id, adminId);
        emitEvent(req, "termination_request_updated");
        emitEvent(req, "contract_updated");
        const io = req.app.get("io");
        io.to(`user_${request.user_id}`).emit("new_notification", {
            title: "Termination Approved",
            message: "Your termination request has been approved. Your contract end date has been updated.",
            type: "termination_request",
            is_read: false,
            created_at: new Date().toISOString(),
        });
        return res.status(200).json({ success: true, message: "Request approved.", request });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

/* ADMIN: Reject */
export const rejectTerminationRequestController = async (req, res) => {
    try {
        const adminId = req.admin?.id || req.auth?.id;
        const request = await rejectTerminationRequest(req.params.id, adminId);
        emitEvent(req, "termination_request_updated");
        const io = req.app.get("io");
        io.to(`user_${request.user_id}`).emit("new_notification", {
            title: "Termination Rejected",
            message: "Your termination request has been rejected.",
            type: "termination_request",
            is_read: false,
            created_at: new Date().toISOString(),
        });
        return res.status(200).json({ success: true, message: "Request rejected.", request });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
