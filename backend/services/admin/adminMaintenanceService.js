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

  const request = await Maintenance.create({
    userId,
    category,
    title,
    description,
    status: status || "Pending",
    startDate: startDate || null,
    endDate: endDate || null,
  });

  /* NOTIFY TENANT */
  await createNotification({
    userId,
    role: "tenant",
    type: "maintenance_created",
    title: "Maintenance Request Created",
    message: `Admin created a maintenance request: ${title}`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  /* NOTIFY CARETAKER */
  await createNotification({
    role: "caretaker",
    type: "maintenance_created",
    title: "New Maintenance Task",
    message: `Admin created maintenance request: ${title}`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  await createActivityLog({
    role: "admin",
    action: "CREATE_MAINTENANCE",
    description: `Admin created maintenance request: ${title}`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  return {
    message: "Maintenance request created by admin",
    id: request.ID,
  };
};

/**
 * APPROVE MAINTENANCE REQUEST
 */
export const approveMaintenance = async (maintenanceId) => {

  const request = await Maintenance.findByPk(maintenanceId);

  if (!request) {
    throw new Error("Maintenance request not found");
  }

  if (request.status !== "Pending") {
    throw new Error("Only pending requests can be approved");
  }

  request.status = "Approved";
  request.startDate = new Date();

  await request.save();

  /* NOTIFY TENANT */
  await createNotification({
    userId: request.userId,
    role: "tenant",
    type: "maintenance_approved",
    title: "Maintenance Approved",
    message: "Your maintenance request has been approved.",
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  /* NOTIFY CARETAKER */
  await createNotification({
    role: "caretaker",
    type: "maintenance_approved",
    title: "Maintenance Request Approved",
    message: `Maintenance request ${request.ID} is approved.`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  await createActivityLog({
    role: "admin",
    action: "APPROVE_MAINTENANCE",
    description: `Approved maintenance request ID ${request.ID}`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  return {
    message: "Maintenance request approved",
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
    "Pending",
    "Approved",
    "In Progress",
    "Done",
  ];

  if (status && !allowedStatuses.includes(status)) {
    throw new Error("Invalid status value");
  }

  if (status) request.status = status;
  if (startDate) request.startDate = startDate;
  if (endDate) request.endDate = endDate;

  if (startDate && endDate) {
    if (new Date(endDate) < new Date(startDate)) {
      throw new Error("End date must be later than start date");
    }
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

  /* NOTIFY CARETAKER */
  await createNotification({
    role: "caretaker",
    type: "maintenance_update",
    title: "Maintenance Status Updated",
    message: `Maintenance request ${request.ID} is now ${request.status}.`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  await createActivityLog({
    role: "admin",
    action: "APPROVE_MAINTENANCE",
    description: `Approved maintenance request ID ${request.ID}`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  return {
    message: "Maintenance updated successfully",
  };
};

/**
 * GET ALL MAINTENANCE REQUESTS (ADMIN)
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
 * DELETE MAINTENANCE (ADMIN)
 */
export const deleteMaintenance = async (maintenanceId) => {
  const request = await Maintenance.findByPk(maintenanceId);

  if (!request) {
    throw new Error("Maintenance request not found");
  }

  await request.destroy();

  return {
    message: "Maintenance deleted successfully",
  };
};