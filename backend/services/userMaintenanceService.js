import Maintenance from "../models/maintenance.js";
import User from "../models/user.js";
import { createNotification } from "../services/notificationService.js";
import { createActivityLog } from "../services/activityLogService.js";

/**
 * CREATE MAINTENANCE REQUEST (Tenant)
 */
export const createMaintenance = async (userId, data) => {
  const { category, title, description } = data;

  if (!category || !title || !description) {
    throw new Error("Category, title, and description are required");
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
    type: "maintenance_request",
    title: "New Maintenance Request",
    message: `${title} reported by a tenant`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  /* NOTIFY ADMIN */
  await createNotification({
    role: "admin",
    type: "maintenance_request",
    title: "New Maintenance Request",
    message: `${title} reported by a tenant`,
    referenceId: request.ID,
    referenceType: "maintenance"
  });

  await createActivityLog({
    userId,
    role: "tenant",
    action: "CREATE_MAINTENANCE",
    description: `Tenant created maintenance request: ${title}`,
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
  }));
};