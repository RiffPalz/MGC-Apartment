import Maintenance from "../models/maintenance.js";
import User from "../models/user.js";
import { createNotification } from "../services/notificationService.js";
import { createActivityLog } from "../services/activityLogService.js";
import { sendSMSBulk } from "../utils/sms.js";
import { sms } from "../utils/smsTemplates.js";

/**
 * CREATE MAINTENANCE REQUEST (Tenant)
 */
export const createMaintenance = async (userId, data) => {
  const { category, title, description } = data;

  if (!category || !title) {
    throw new Error("Category and title are required");
  }

  const user = await User.findByPk(userId);

  if (!user || user.role !== "tenant") {
    throw new Error("Only tenants can create maintenance requests");
  }

  const request = await Maintenance.create({
    userId,
    category,
    title,
    description,
  });

  /* NOTIFY CARETAKER */
  await createNotification({
    role: "caretaker",
    type: "maintenance request",
    title: "New Maintenance Request",
    message: `${title} reported by a tenant`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  /* NOTIFY ADMIN */
  await createNotification({
    role: "admin",
    type: "maintenance request",
    title: "New Maintenance Request",
    message: `${title} reported by a tenant`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  /* SMS → admin & caretaker */
  const staffUsers = await User.findAll({
    where: { role: ["admin", "caretaker"] },
    attributes: ["contactNumber"],
  });
  sendSMSBulk(
    staffUsers.map((u) => u.contactNumber),
    sms.maintenanceSubmitted(user.fullName, user.unitNumber ?? "?", title)
  );

  await createActivityLog({
    userId,
    role: "tenant",
    action: "CREATE MAINTENANCE",
    description: `You created maintenance request: ${title}`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  return {
    id: request.ID,
    title: request.title,
    category: request.category,
    status: request.status,
    requestedDate: request.dateRequested,
  };
};

/**
 * FOLLOW UP ON MAINTENANCE REQUEST (Tenant)
 */
export const followUpMaintenance = async (userId, maintenanceId) => {
  const request = await Maintenance.findOne({ where: { ID: maintenanceId, userId } });
  if (!request) throw new Error("Maintenance request not found");
  if (request.status === "Done") throw new Error("Cannot follow up on a completed request");

  request.followedUp = true;
  await request.save();

  // Notify admin
  await createNotification({
    role: "admin",
    type: "maintenance follow-up",
    title: "Follow-Up Reminder",
    message: `Tenant sent a follow-up on: ${request.title}`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  // Notify caretaker
  await createNotification({
    role: "caretaker",
    type: "maintenance follow-up",
    title: "Follow-Up Reminder",
    message: `Tenant sent a follow-up on: ${request.title}`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  await createActivityLog({
    userId,
    role: "tenant",
    action: "FOLLOW-UP MAINTENANCE",
    description: `Tenant followed up on maintenance request: ${request.title}`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  return { message: "Follow-up sent successfully" };
};

/**
 * GET TENANT MAINTENANCE REQUESTS
 */
export const getTenantMaintenance = async (userId) => {
  const requests = await Maintenance.findAll({
    where: { userId },
    order: [["created_at", "DESC"]],
  });

  return requests.map((item) => ({
    id: item.ID,
    title: item.title,
    category: item.category,
    requestedDate: item.dateRequested,
    startDate: item.startDate,
    endDate: item.endDate,
    status: item.status,
    followedUp: item.followedUp,
  }));
};