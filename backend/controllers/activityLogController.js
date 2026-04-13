import { getActivityLogs } from "../services/activityLogService.js";

export const fetchActivityLogsController = async (req, res) => {
  try {
    const queryFilters = { ...req.query };
    queryFilters.userId = req.auth.id;
    queryFilters.role = req.auth.role;

    const logs = await getActivityLogs(queryFilters);

    return res.status(200).json({
      success: true,
      count: logs.length,
      filters: queryFilters,
      logs,
    });
  } catch (error) {
    console.error("Fetch Activity Logs Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch activity logs" });
  }
};

/* Admin — fetch all logs across all users */
export const fetchAllActivityLogsController = async (req, res) => {
  try {
    const { role, action, search, startDate, endDate, limit = 100, offset = 0 } = req.query;

    const logs = await getActivityLogs({
      role: role || undefined,
      action: action || undefined,
      search: search || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
      offset,
    });

    return res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    console.error("Fetch All Activity Logs Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch activity logs" });
  }
};
