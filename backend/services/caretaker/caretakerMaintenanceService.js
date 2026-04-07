import { Maintenance, User } from "../../models/index.js";
import { createNotification } from "../../services/notificationService.js";
import { createActivityLog } from "../../services/activityLogService.js";
import { sendSMS } from "../../utils/sms.js";
import { sms } from "../../utils/smsTemplates.js";


/* CREATE MAINTENANCE */
export const createMaintenance = async (data, caretakerId) => {

    const { userId, category, title, description, status, startDate, endDate } = data;

    if (!userId || !title || !category || !description) {
        throw new Error("Missing required maintenance fields");
    }

    const user = await User.findByPk(userId);

    if (!user || user.role !== "tenant") {
        throw new Error("Tenant not found");
    }

    const allowedStatuses = ["Pending", "Approved", "In Progress", "Done"];

    if (status && !allowedStatuses.includes(status)) {
        throw new Error("Invalid status value");
    }

    const request = await Maintenance.create({
        userId,
        category,
        title,
        description,
        status: status || "Pending",
        startDate: null,
        endDate: null,
    });

    await createNotification({
        userId,
        role: "tenant",
        type: "maintenance created",
        title: "Maintenance Scheduled",
        message: "A maintenance request has been scheduled for your unit.",
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    await createNotification({
        role: "admin",
        type: "maintenance created",
        title: "Maintenance Scheduled",
        message: `Caretaker scheduled maintenance: ${title}`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    await createActivityLog({
        userId: caretakerId,
        role: "caretaker",
        action: "CREATE MAINTENANCE",
        description: `You created a maintenance request: "${title}".`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    return {
        message: "Maintenance request created",
        id: request.ID
    };
};



/* UPDATE MAINTENANCE */
export const updateMaintenance = async (maintenanceId, data, caretakerId) => {

    const { status, startDate, endDate } = data;

    const request = await Maintenance.findByPk(maintenanceId, {
        include: [
            { model: User, as: "user", attributes: ["contactNumber", "unitNumber"] },
        ],
    });

    if (!request) {
        throw new Error("Maintenance request not found");
    }

    const allowedStatuses = ["Pending", "Approved", "In Progress", "Done"];

    if (status && !allowedStatuses.includes(status)) {
        throw new Error("Invalid status update");
    }

    // Prevent rolling back once In Progress
    const forwardOnly = ["In Progress", "Done"];
    if (forwardOnly.includes(request.status) && (status === "Pending" || status === "Approved")) {
        throw new Error(`Cannot roll back status from "${request.status}" to "${status}".`);
    }

    const now = new Date();

    if (status) {
        request.status = status;

        // Auto-set startDate only when moving to In Progress
        if (status === "In Progress" && !request.startDate) {
            request.startDate = startDate || now;
        }

        // Auto-set endDate when marking Done
        if (status === "Done") {
            if (!request.startDate) request.startDate = startDate || now;
            request.endDate = endDate || now;
        }

        // Clear dates if rolling back to Pending or Approved
        if (status === "Pending" || status === "Approved") {
            request.startDate = null;
            request.endDate = null;
        }
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        throw new Error("End date must be later than start date");
    }

    await request.save();

    await createNotification({
        userId: request.userId,
        role: "tenant",
        type: "maintenance update",
        title: "Maintenance Updated",
        message: `Maintenance status is now ${request.status}.`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    await createNotification({
        role: "admin",
        type: "maintenance update",
        title: "Maintenance Updated",
        message: `Maintenance ${request.ID} updated to ${request.status}.`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    // SMS → tenant (only for meaningful status changes)
    if (["Approved", "In Progress", "Done"].includes(request.status)) {
        sendSMS(request.user?.contactNumber, sms.maintenanceStatusUpdated(request.title, request.status));
    }

    await createActivityLog({
        userId: caretakerId,
        role: "caretaker",
        action: "UPDATE MAINTENANCE",
        description: `You updated Unit ${request.user?.unitNumber ?? "—"}'s maintenance request "${request.title}" to ${request.status}.`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    return { message: "Maintenance updated successfully" };
};



/* GET ALL MAINTENANCE */
export const getAllMaintenance = async () => {

    const requests = await Maintenance.findAll({
        include: [
            {
                model: User,
                as: "user",
                attributes: ["publicUserID", "fullName", "unitNumber"]
            }
        ],
        order: [["created_at", "DESC"]]
    });

    return requests.map(item => ({
        id: item.ID,
        title: item.title,
        category: item.category,
        description: item.description,
        status: item.status,
        followedUp: item.followedUp,
        requestedDate: item.dateRequested,
        startDate: item.startDate,
        endDate: item.endDate,
        tenant: {
            publicUserID: item.user?.publicUserID,
            fullName: item.user?.fullName,
            unitNumber: item.user?.unitNumber
        }
    }));
};



/* DELETE MAINTENANCE */
export const deleteMaintenance = async (maintenanceId, caretakerId) => {

    const request = await Maintenance.findByPk(maintenanceId);

    if (!request) {
        throw new Error("Maintenance request not found");
    }

    await createActivityLog({
        userId: caretakerId,
        role: "caretaker",
        action: "DELETE MAINTENANCE",
        description: `You deleted the maintenance request: "${request.title}".`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    await request.destroy();

    return { message: "Maintenance deleted successfully" };
};