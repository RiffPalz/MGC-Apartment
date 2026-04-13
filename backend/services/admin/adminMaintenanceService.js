import { Maintenance, User } from "../../models/index.js";
import { createNotification } from "../../services/notificationService.js";
import { createActivityLog } from "../../services/activityLogService.js";
import { sendSMS } from "../../utils/sms.js";
import { sms } from "../../utils/smsTemplates.js";

export const createMaintenance = async (data, adminId) => {
  const { userId, category, title, description, status, startDate, endDate } = data;

  const user = await User.findByPk(userId);
  if (!user || user.role !== "tenant") throw new Error("Tenant not found");

  const request = await Maintenance.create({
    userId,
    category,
    title,
    description,
    status: status || "Pending",
    startDate: startDate || null,
    endDate: endDate || null,
  });

  await createNotification({
    userId,
    role: "tenant",
    type: "maintenance created",
    title: "Maintenance Request Created",
    message: `Admin created a maintenance request: ${title}`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  await createNotification({
    role: "caretaker",
    type: "maintenance created",
    title: "New Maintenance Task",
    message: `Admin created maintenance request: ${title}`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "CREATE MAINTENANCE",
    description: `You created a maintenance request: "${title}" for Unit ${user.unitNumber ?? "—"}.`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  return { message: "Maintenance request created by admin", id: request.ID };
};

export const approveMaintenance = async (maintenanceId, adminId) => {
  const request = await Maintenance.findByPk(maintenanceId, {
    include: [{ model: User, as: "user", attributes: ["contactNumber", "fullName", "unitNumber"] }],
  });
  if (!request) throw new Error("Maintenance request not found");
  if (request.status !== "Pending") throw new Error("Only pending requests can be approved");

  request.status = "Approved";
  await request.save();

  await createNotification({
    userId: request.userId,
    role: "tenant",
    type: "maintenance approved",
    title: "Maintenance Approved",
    message: "Your maintenance request has been approved.",
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  await createNotification({
    role: "caretaker",
    type: "maintenance approved",
    title: "Maintenance Request Approved",
    message: `Maintenance request ${request.ID} is approved.`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  sendSMS(request.user?.contactNumber, sms.maintenanceStatusUpdated(request.title, "Approved"));

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "APPROVE MAINTENANCE",
    description: `You approved the maintenance request: "${request.title}" for Unit ${request.user?.unitNumber ?? "—"}.`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  return { message: "Maintenance request approved" };
};

export const updateMaintenance = async (maintenanceId, data, adminId) => {
  const { status, startDate, endDate } = data;

  const request = await Maintenance.findByPk(maintenanceId, {
    include: [{ model: User, as: "user", attributes: ["contactNumber", "unitNumber"] }],
  });
  if (!request) throw new Error("Maintenance request not found");

  const allowedStatuses = ["Pending", "Approved", "In Progress", "Done"];
  if (status && !allowedStatuses.includes(status)) throw new Error("Invalid status value");

  const forwardOnly = ["In Progress", "Done"];
  if (forwardOnly.includes(request.status) && (status === "Pending" || status === "Approved")) {
    throw new Error(`Cannot roll back status from "${request.status}" to "${status}".`);
  }

  const now = new Date();

  if (status) {
    request.status = status;

    if (status === "In Progress" && !request.startDate) {
      request.startDate = startDate || now;
    }

    if (status === "Done") {
      if (!request.startDate) request.startDate = startDate || now;
      request.endDate = endDate || now;
    }

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
    title: "Maintenance Status Updated",
    message: `Your maintenance request is now ${request.status}.`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  await createNotification({
    role: "caretaker",
    type: "maintenance update",
    title: "Maintenance Status Updated",
    message: `Maintenance request ${request.ID} is now ${request.status}.`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  if (["Approved", "In Progress", "Done"].includes(request.status)) {
    sendSMS(request.user?.contactNumber, sms.maintenanceStatusUpdated(request.title, request.status));
  }

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "UPDATE MAINTENANCE",
    description: `You updated Unit ${request.user?.unitNumber ?? "—"}'s maintenance request "${request.title}" to ${request.status}.`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  return { message: "Maintenance updated successfully" };
};

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
    followedUp: item.followedUp,
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

export const deleteMaintenance = async (maintenanceId, adminId) => {
  const request = await Maintenance.findByPk(maintenanceId);
  if (!request) throw new Error("Maintenance request not found");

  await createActivityLog({
    userId: adminId,
    role: "admin",
    action: "DELETE MAINTENANCE",
    description: `You deleted the maintenance request: "${request.title}".`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  await request.destroy();
  return { message: "Maintenance deleted successfully" };
};
