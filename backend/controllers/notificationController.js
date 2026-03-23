import {
  getUserNotifications,
  getRoleNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../services/notificationService.js";

/* GET USER NOTIFICATIONS (Tenant) */
export const getUserNotificationsController = async (req, res) => {
  try {
    const userId = req.auth?.ID || req.auth?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed"
      });
    }

    const notifications = await getUserNotifications(userId);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });

  } catch (error) {
    console.error("Get User Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications"
    });
  }
};

/* GET ROLE NOTIFICATIONS (Admin / Caretaker) */
export const getRoleNotificationsController = async (req, res) => {
  try {
    const role = req.auth?.role;

    if (!role) {
      return res.status(401).json({
        success: false,
        message: "User role missing"
      });
    }

    const notifications = await getRoleNotifications(role);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });

  } catch (error) {
    console.error("Get Role Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch role notifications"
    });
  }
};

/* MARK SINGLE NOTIFICATION AS READ */
export const markNotificationAsReadController = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await markNotificationAsRead(id);

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification
    });

  } catch (error) {
    console.error("Mark Notification Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* MARK ALL USER NOTIFICATIONS AS READ */
export const markAllNotificationsAsReadController = async (req, res) => {
  try {
    const userId = req.auth?.ID || req.auth?.id;
    const userRole = req.auth?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed or role missing"
      });
    }

    const result = await markAllNotificationsAsRead(userId, userRole);

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error("Mark All Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read"
    });
  }
};
