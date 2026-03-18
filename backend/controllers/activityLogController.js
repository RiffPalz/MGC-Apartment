import { getActivityLogs } from "../services/activityLogService.js";

export const fetchActivityLogsController = async (req, res) => {
    try {
        // Clone the incoming query parameters
        const queryFilters = { ...req.query };

        // Ensure your auth middleware attaches the user to req.user
        const loggedInUser = req.user;

        // 🔒 STRICT ISOLATION FOR ALL ROLES
        // Every single user (admin, caretaker, tenant) is forcefully 
        // restricted to their own specific activity logs. 
        queryFilters.userId = loggedInUser.id;
        queryFilters.role = loggedInUser.role;

        const logs = await getActivityLogs(queryFilters);

        return res.status(200).json({
            success: true,
            count: logs.length,
            filters: queryFilters, // Returns the forced filters to verify in Postman
            logs
        });

    } catch (error) {
        console.error("Fetch Activity Logs Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch activity logs"
        });
    }
};