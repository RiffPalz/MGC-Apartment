import { Maintenance, User } from "../../models/index.js";
import { createNotification } from "../../services/notificationService.js";
import { createActivityLog } from "../../services/activityLogService.js";

/**
 * CREATE MAINTENANCE 
 */
export const createMaintenance = async (data) => {
    const {
        userId,
        category,
        title,
        description,
        status,
        startDate,
        endDate,
    } = data;

    const user = await User.findByPk(userId);

    if (!user || user.role !== "tenant") {
        throw new Error("Tenant not found");
    }

    const allowedStatuses = [
        "Pending",
        "Approved",
        "In Progress",
        "Done",
    ];

    if (status && !allowedStatuses.includes(status)) {
        throw new Error("Invalid status value");
    }

    const request = await Maintenance.create({
        userId,
        category,
        title,
        description,
        status: status || "In Progress", // caretaker usually starts work immediately
        startDate: startDate || new Date(),
        endDate: endDate || null,
    });

    /* NOTIFY TENANT */
    await createNotification({
        userId,
        role: "tenant",
        type: "maintenance_created",
        title: "Maintenance Scheduled",
        message: "A maintenance request has been scheduled for your unit.",
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    /* NOTIFY ADMIN */
    await createNotification({
        role: "admin",
        type: "maintenance_created",
        title: "Maintenance Scheduled",
        message: `Caretaker scheduled maintenance: ${title}`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    /* NOTIFY CARETAKER */
    await createActivityLog({
        role: "caretaker",
        action: "CREATE_MAINTENANCE",
        description: `Caretaker created maintenance request: ${title}`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    return {
        message: "Maintenance request created by caretaker",
        id: request.ID,
    };
};


/**
 * UPDATE MAINTENANCE STATUS 
 */
export const updateMaintenance = async (maintenanceId, data) => {
    const { status, startDate, endDate } = data;

    const request = await Maintenance.findByPk(maintenanceId);

    if (!request) {
        throw new Error("Maintenance request not found");
    }

    const allowedStatuses = [
        "In Progress",
        "Done",
    ];

    if (status && !allowedStatuses.includes(status)) {
        throw new Error("Invalid status update");
    }

    // Update fields only if provided
    if (status) request.status = status;
    if (startDate) request.startDate = startDate;
    if (endDate) request.endDate = endDate;

    // Validate timeline
    if (startDate && endDate) {
        if (new Date(endDate) < new Date(startDate)) {
            throw new Error("End date must be later than start date");
        }
    }

    // If marking as Done and no endDate provided → auto-set
    if (status === "Done" && !endDate) {
        request.endDate = new Date();
    }

    await request.save();

    /* NOTIFY TENANT */
    await createNotification({
        userId: request.userId,
        role: "tenant",
        type: "maintenance_update",
        title: "Maintenance Status Updated",
        message: `Your maintenance request is now ${request.status}.`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    /* NOTIFY ADMIN */
    await createNotification({
        role: "admin",
        type: "maintenance_update",
        title: "Maintenance Status Updated",
        message: `Maintenance request ${request.ID} updated to ${request.status}.`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    await createActivityLog({
        role: "caretaker",
        action: "CREATE_MAINTENANCE",
        description: `Caretaker created maintenance request: ${title}`,
        referenceId: request.ID,
        referenceType: "maintenance"
    });

    return {
        message: "Maintenance updated successfully",
    };
};


/**
 * GET ALL MAINTENANCE REQUESTS 
 */
export const getAllMaintenance = async () => {
    const requests = await Maintenance.findAll({
        include: [
            {
                model: User,
                as: "user",
                attributes: ["publicUserID", "fullName", "unitNumber"],
            },
        ],
        order: [["created_at", "DESC"]],
    });

    return requests.map((item) => ({
        id: item.ID,
        title: item.title,
        category: item.category,
        description: item.description,
        status: item.status,
        requestedDate: item.dateRequested,
        startDate: item.startDate,
        endDate: item.endDate,
        tenant: {
            publicUserID: item.user.publicUserID,
            fullName: item.user.fullName,
            unitNumber: item.user.unitNumber,
        },
    }));
};

/**
 * DELETE MAINTENANCE 
 */
export const deleteMaintenance = async (maintenanceId) => {
    const request = await Maintenance.findByPk(maintenanceId);

    if (!request) {
        throw new Error("Maintenance request not found");
    }

    // Prevent deleting active/completed work
    if (["In Progress", "Done"].includes(request.status)) {
        throw new Error(
            "Cannot delete maintenance that is already in progress or completed"
        );
    }

    await request.destroy();

    return {
        message: "Maintenance deleted successfully",
    };
};