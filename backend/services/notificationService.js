import Notification from "../models/notifications.js";
import { Op } from "sequelize";

export const createNotification = async ({
  userId = null,
  role,
  type,
  title,
  message,
  referenceId = null,
  referenceType = null,
}) => {
  if (!role || !type || !title || !message) {
    throw new Error("Missing required notification fields");
  }

  return await Notification.create({
    user_id: userId,
    role,
    type,
    title,
    message,
    reference_id: referenceId,
    reference_type: referenceType,
  });
};

/* Fetch personal and global notifications for a user */
export const getUserNotifications = async (userId) => {
  if (!userId) throw new Error("User ID is required to fetch notifications");

  return await Notification.findAll({
    where: {
      [Op.or]: [{ user_id: userId }, { role: "tenant", user_id: null }],
    },
    order: [["created_at", "DESC"]],
  });
};

export const getRoleNotifications = async (role) => {
  if (!role) throw new Error("Role is required to fetch notifications");

  return await Notification.findAll({
    where: { role },
    order: [["created_at", "DESC"]],
  });
};

export const markNotificationAsRead = async (notificationId) => {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) throw new Error("Notification not found");

  notification.is_read = true;
  await notification.save();
  return notification;
};

export const markAllNotificationsAsRead = async (userId, userRole) => {
  if (!userId || !userRole) throw new Error("User ID and role are required");

  let whereClause;
  if (userRole === "tenant") {
    whereClause = {
      [Op.or]: [{ user_id: userId }, { role: "tenant", user_id: null }],
    };
  } else {
    whereClause = {
      [Op.or]: [{ role: userRole }, { user_id: userId }],
    };
  }

  await Notification.update({ is_read: true }, { where: whereClause });
  return { message: "All notifications marked as read" };
};
