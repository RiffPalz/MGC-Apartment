import Maintenance from "../models/maintenance.js";
import User from "../models/user.js";
import Contract from "../models/contract.js";
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

  // Block terminated tenants from submitting new requests
  const terminatedContract = await Contract.findOne({
    include: [{ model: User, as: "tenants", where: { ID: userId }, required: true, through: { attributes: [] } }],
    where: { status: "Terminated" },
  });
  const activeContract = await Contract.findOne({
    include: [{ model: User, as: "tenants", where: { ID: userId }, required: true, through: { attributes: [] } }],
    where: { status: "Active" },
  });
  if (terminatedContract && !activeContract) {
    throw new Error("Maintenance requests are disabled for terminated contracts.");
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
    description: `You submitted a maintenance request: "${title}".`,
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
    description: `You sent a follow-up on your maintenance request: "${request.title}".`,
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
    description: item.description,
    requestedDate: item.dateRequested,
    startDate: item.startDate,
    endDate: item.endDate,
    status: item.status,
    followedUp: item.followedUp,
  }));
};

/**
 * EDIT MAINTENANCE REQUEST (Tenant)
 */
export const editMaintenance = async (userId, maintenanceId, data) => {
  const { title, category, description } = data;

  const ALLOWED_CATEGORIES = [
    "Electrical Maintenance",
    "Water Interruptions",
    "Floor Renovation",
    "Other",
  ];

  if (!title || typeof title !== "string" || title.trim() === "") {
    throw new Error("Title is required");
  }

  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new Error("Invalid category");
  }

  const request = await Maintenance.findOne({ where: { ID: maintenanceId, userId } });
  if (!request) throw new Error("Maintenance request not found");

  if (request.status !== "Pending") {
    throw new Error("Only pending requests can be edited");
  }

  const trimmedTitle = title.trim();

  request.title = trimmedTitle;
  request.category = category;
  request.description = description ?? "";
  await request.save();

  await createNotification({
    role: "admin",
    type: "maintenance update",
    title: "Maintenance Request Edited",
    message: `Maintenance request "${trimmedTitle}" has been edited by the tenant.`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  await createNotification({
    role: "caretaker",
    type: "maintenance update",
    title: "Maintenance Request Edited",
    message: `Maintenance request "${trimmedTitle}" has been edited by the tenant.`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  await createActivityLog({
    userId,
    role: "tenant",
    action: "EDIT MAINTENANCE",
    description: `You edited your maintenance request: "${trimmedTitle}".`,
    referenceId: request.ID,
    referenceType: "maintenance",
  });

  /* SMS → admin & caretaker */
  const user = await User.findByPk(userId);
  const staffUsers = await User.findAll({
    where: { role: ["admin", "caretaker"] },
    attributes: ["contactNumber"],
  });
  sendSMSBulk(
    staffUsers.map((u) => u.contactNumber),
    sms.maintenanceEdited(user?.fullName ?? "Tenant", user?.unitNumber ?? "?", trimmedTitle)
  );

  return {
    id: request.ID,
    title: request.title,
    category: request.category,
    description: request.description,
    status: request.status,
    requestedDate: request.dateRequested,
  };
};
