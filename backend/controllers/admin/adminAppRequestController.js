import {
  getAllApplicationRequests,
  deleteApplicationRequest,
  getApplicationRequestStats,
  getTodayUnreadApplicationRequests,
  markApplicationRequestRead,
} from "../../services/admin/adminAppRequestService.js";

export const getTodayUnreadController = async (req, res) => {
  try {
    const applications = await getTodayUnreadApplicationRequests();
    return res.status(200).json({ success: true, count: applications.length, applications });
  } catch (error) {
    console.error("getTodayUnreadApplicationRequests error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch today's requests" });
  }
};

export const markApplicationReadController = async (req, res) => {
  try {
    await markApplicationRequestRead(req.params.id, req.admin?.id);
    return res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllApplicationRequestsController = async (req, res) => {
  try {
    const applications = await getAllApplicationRequests();
    return res.status(200).json({ success: true, count: applications.length, applications });
  } catch (error) {
    console.error("getAllApplicationRequests error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch application requests" });
  }
};

export const deleteApplicationRequestController = async (req, res) => {
  try {
    const result = await deleteApplicationRequest(req.params.id, req.admin?.id);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getApplicationRequestStatsController = async (req, res) => {
  try {
    const stats = await getApplicationRequestStats();
    return res.status(200).json({ success: true, stats });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch application statistics" });
  }
};
