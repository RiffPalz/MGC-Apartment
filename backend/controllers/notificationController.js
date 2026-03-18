import {
    getUserNotifications,
    getRoleNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from "../services/notificationService.js";

/**
 * GET USER NOTIFICATIONS (Tenant specific)
 */
export const getUserNotificationsController = async (req, res) => {
    try {
        // ✅ FIX: Changed req.auth to req.user
        const userId = req.user?.ID || req.user?.id;

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
        console.error("Notification fetch error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications"
        });
    }
};

/**
 * GET ROLE NOTIFICATIONS (Admin / Caretaker)
 */
export const getRoleNotificationsController = async (req, res) => {
    try {
        // ✅ FIX: Changed req.auth to req.user
        const role = req.user?.role;

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
        console.error("Role notification error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch role notifications"
        });
    }
};

/**
 * MARK SINGLE NOTIFICATION AS READ
 */
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
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * MARK ALL USER NOTIFICATIONS AS READ
 */
export const markAllNotificationsAsReadController = async (req, res) => {
    try {
        // ✅ FIX: Changed req.auth to req.user
        const userId = req.user?.ID || req.user?.id;
        const userRole = req.user?.role; 

        if (!userId || !userRole) {
            return res.status(401).json({
                success: false,
                message: "User authentication failed or role missing"
            });
        }

        // Pass both to the service function
        const result = await markAllNotificationsAsRead(userId, userRole);

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error("Mark all notifications error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark notifications as read"
        });
    }
};