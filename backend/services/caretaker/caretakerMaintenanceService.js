import { Maintenance, User } from "../../models/index.js";
import { createNotification } from "../../services/notificationService.js";
import { createActivityLog } from "../../services/activityLogService.js";


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
        status: status || "In Progress",
        startDate: startDate || new Date(),
        endDate: endDate || null
    });

    await createNotification({
        userId,
        role: "tenant",
        type: "maintenance_created",
        title: "Maintenance Scheduled",
        message: "A maintenance request has been scheduled for your unit.",
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    await createNotification({
        role: "admin",
        type: "maintenance_created",
        title: "Maintenance Scheduled",
        message: `Caretaker scheduled maintenance: ${title}`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    await createActivityLog({
        userId: caretakerId,
        role: "caretaker",
        action: "CREATE_MAINTENANCE",
        description: `Created maintenance: ${title}`,
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

    const request = await Maintenance.findByPk(maintenanceId);

    if (!request) {
        throw new Error("Maintenance request not found");
    }

    const allowedStatuses = ["In Progress", "Done"];

    if (status && !allowedStatuses.includes(status)) {
        throw new Error("Invalid status update");
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        throw new Error("End date must be later than start date");
    }

    if (status) request.status = status;
    if (startDate) request.startDate = startDate;
    if (endDate) request.endDate = endDate;

    if (status === "Done" && !endDate) {
        request.endDate = new Date();
    }

    await request.save();

    await createNotification({
        userId: request.userId,
        role: "tenant",
        type: "maintenance_update",
        title: "Maintenance Updated",
        message: `Maintenance status is now ${request.status}.`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    await createNotification({
        role: "admin",
        type: "maintenance_update",
        title: "Maintenance Updated",
        message: `Maintenance ${request.ID} updated to ${request.status}.`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    await createActivityLog({
        userId: caretakerId,
        role: "caretaker",
        action: "UPDATE_MAINTENANCE",
        description: `Updated maintenance ${request.ID} to ${request.status}`,
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

    if (["In Progress", "Done"].includes(request.status)) {
        throw new Error("Cannot delete active or completed maintenance");
    }

    await createActivityLog({
        userId: caretakerId,
        role: "caretaker",
        action: "DELETE_MAINTENANCE",
        description: `Deleted maintenance ${request.ID}`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    await request.destroy();

    return { message: "Maintenance deleted successfully" };
};