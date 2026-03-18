import { Maintenance, User } from "../../models/index.js";
import { createNotification } from "../../services/notificationService.js";
import { createActivityLog } from "../../services/activityLogService.js";

// Admin creates a maintenance request on behalf of a tenant
export const createMaintenance = async (data, adminId) => {
  const { userId, category, title, description, status, startDate, endDate } = data;

  // Validate tenant existence
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

  // Notify tenant and caretaker about the new task
  await createNotification({
    userId,
    role: "tenant",
    type: "maintenance_created",
    title: "Maintenance Request Created",
    message: `Admin created a maintenance request: ${title}`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  await createNotification({
    role: "caretaker",
    type: "maintenance_created",
    title: "New Maintenance Task",
    message: `Admin created maintenance request: ${title}`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  // Log the admin action
  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "CREATE_MAINTENANCE",
    description: `Admin created maintenance request: ${title}`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  return { message: "Maintenance request created by admin", id: request.ID };
};

// Mark a pending request as Approved and set today as the start date
export const approveMaintenance = async (maintenanceId, adminId) => {
  const request = await Maintenance.findByPk(maintenanceId);

  if (!request) throw new Error("Maintenance request not found");
  if (request.status !== "Pending") throw new Error("Only pending requests can be approved");

  request.status = "Approved";
  request.startDate = new Date();
  await request.save();

  // Notify parties and log the approval
  await createNotification({
    userId: request.userId,
    role: "tenant",
    type: "maintenance_approved",
    title: "Maintenance Approved",
    message: "Your maintenance request has been approved.",
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  await createNotification({
    role: "caretaker",
    type: "maintenance_approved",
    title: "Maintenance Request Approved",
    message: `Maintenance request ${request.ID} is approved.`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "APPROVE_MAINTENANCE",
    description: `Approved maintenance request ID ${request.ID}`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  return { message: "Maintenance request approved" };
};

// Update status or timeline for an existing request
export const updateMaintenance = async (maintenanceId, data, adminId) => {
  const { status, startDate, endDate } = data;
  const request = await Maintenance.findByPk(maintenanceId);

  if (!request) throw new Error("Maintenance request not found");

  // Status and date validation
  const allowedStatuses = ["Pending", "Approved", "In Progress", "Done"];
  if (status && !allowedStatuses.includes(status)) throw new Error("Invalid status value");
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    throw new Error("End date must be later than start date");
  }

  if (status) request.status = status;
  if (startDate) request.startDate = startDate;
  if (endDate) request.endDate = endDate;

  await request.save();

  // Notify parties of the progress update
  await createNotification({
    userId: request.userId,
    role: "tenant",
    type: "maintenance_update",
    title: "Maintenance Status Updated",
    message: `Your maintenance request is now ${request.status}.`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  await createNotification({
    role: "caretaker",
    type: "maintenance_update",
    title: "Maintenance Status Updated",
    message: `Maintenance request ${request.ID} is now ${request.status}.`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "UPDATE_MAINTENANCE",
    description: `Updated maintenance request ID ${request.ID} to ${request.status}`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  return { message: "Maintenance updated successfully" };
};

// Fetch all maintenance records with tenant and unit details
export const getAllMaintenance = async () => {
    const requests = await Maintenance.findAll({
        include: [{
            model: User,
            as: "user",
            attributes: ["publicUserID", "fullName", "unitNumber"],
        }],
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

// Delete a maintenance record and log the action before it's gone
export const deleteMaintenance = async (maintenanceId, adminId) => {
  const request = await Maintenance.findByPk(maintenanceId);

  if (!request) throw new Error("Maintenance request not found");

  await createActivityLog({
      userId: adminId,
      role: "admin",
      action: "DELETE_MAINTENANCE",
      description: `Admin deleted maintenance request ID ${request.ID}`,
      referenceId: request.ID,
      referenceType: "maintenance"
  });

  await request.destroy();

  return { message: "Maintenance deleted successfully" };
};