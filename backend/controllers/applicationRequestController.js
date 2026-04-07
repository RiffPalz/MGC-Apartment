import {
    createApplicationRequest,
    checkApplicationStatus
} from "../services/applicationRequestService.js";
import { emitEvent } from "../utils/emitEvent.js";

// Submit application + notify admin
export const submitApplicationRequestController = async (req, res) => {
    try {
        const { fullName, emailAddress, contactNumber, message } = req.body;

        const application = await createApplicationRequest({
            fullName,
            emailAddress,
            contactNumber,
            validID: req.file?.path,
            message
        });

        emitEvent(req, "applications_updated");

        // Send notification
        const io = req.app.get("io");
        io.to("admin").emit("new_notification", {
            title: "New Application Request",
            message: `${fullName} submitted an application.`,
            type: "default",
            is_read: false,
            created_at: new Date().toISOString()
        });

        return res.status(201).json({
            success: true,
            message: "Application request submitted successfully",
            application
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Check application status
export const checkApplicationStatusController = async (req, res) => {
    try {
        if (!req.query.email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const result = await checkApplicationStatus(req.query.email);

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};