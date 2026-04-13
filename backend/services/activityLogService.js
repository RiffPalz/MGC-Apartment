import ActivityLog from "../models/activityLog.js";
import { Op } from "sequelize";

export const createActivityLog = async ({
  userId = null,
  role,
  action,
  description,
  referenceId = null,
  referenceType = null,
}) => {
  if (!role || !action || !description) {
    throw new Error("Missing required activity log fields");
  }

  return await ActivityLog.create({
    user_id: userId,
    role,
    action,
    description,
    reference_id: referenceId,
    reference_type: referenceType,
  });
};

export const getActivityLogs = async (filters = {}) => {
  const { userId, role, action, search, startDate, endDate, limit = 100, offset = 0 } = filters;

  const whereClause = {};

  if (userId) whereClause.user_id = userId;
  if (role && role !== "All") whereClause.role = role;
  if (action) whereClause.action = action;
  if (search) whereClause.description = { [Op.like]: `%${search}%` };

  if (startDate || endDate) {
    whereClause.created_at = {};
    if (startDate) whereClause.created_at[Op.gte] = new Date(startDate);
    if (endDate) whereClause.created_at[Op.lte] = new Date(endDate);
  }

  return await ActivityLog.findAll({
    where: whereClause,
    order: [["created_at", "DESC"]],
    limit: Math.min(parseInt(limit) || 100, 100),
    offset: parseInt(offset) || 0,
  });
};
