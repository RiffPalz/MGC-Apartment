import ActivityLog from "../models/activityLog.js";
import { Op } from "sequelize";

/* CREATE ACTIVITY LOG */
export const createActivityLog = async ({
    userId = null,
    role,
    action,
    description,
    referenceId = null,
    referenceType = null
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
        reference_type: referenceType
    });
};

/* GET ACTIVITY LOGS (ADVANCED FILTERS) */
export const getActivityLogs = async (filters = {}) => {
    const {
        userId, // 🔹 Added userId here
        role,
        action,
        search,
        startDate,
        endDate,
        limit = 100,
        offset = 0
    } = filters;

    const whereClause = {};

    // 🔹 User ID filter (Crucial for Tenant/Caretaker isolation)
    if (userId) {
        whereClause.user_id = userId;
    }

    // 🔹 Role filter
    if (role && role !== "All") {
        whereClause.role = role;
    }

    // 🔹 Action filter
    if (action) {
        whereClause.action = action;
    }

    // 🔹 Search filter (description)
    if (search) {
        whereClause.description = {
            [Op.like]: `%${search}%`
        };
    }

    // 🔹 Date range filter
    if (startDate || endDate) {
        whereClause.created_at = {};

        if (startDate) {
            whereClause.created_at[Op.gte] = new Date(startDate);
        }

        if (endDate) {
            whereClause.created_at[Op.lte] = new Date(endDate);
        }
    }

    const safeLimit = Math.min(parseInt(limit) || 100, 100);
    const safeOffset = parseInt(offset) || 0;

    const logs = await ActivityLog.findAll({
        where: whereClause,
        order: [["created_at", "DESC"]],
        limit: safeLimit,
        offset: safeOffset
    });

    return logs;
};