import { getActivityLogs } from "../services/activityLogService.js";

export const fetchActivityLogsController = async (req, res) => {
  try {

    // Copy query parameters
    const queryFilters = { ...req.query };

    // Logged-in user from auth middleware
    const loggedInUser = req.auth;

    // Restrict logs to the current user
    queryFilters.userId = loggedInUser.id;
    queryFilters.role = loggedInUser.role;

    const logs = await getActivityLogs(queryFilters);

    return res.status(200).json({
      success: true,
      count: logs.length,
      filters: queryFilters,
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