import {
    getAllApplicationRequests,
    deleteApplicationRequest,
    getApplicationRequestStats,
    getTodayUnreadApplicationRequests,
    markApplicationRequestRead,
} from "../../services/admin/adminAppRequestService.js";

/* GET TODAY'S UNREAD APPLICATION REQUESTS */
export const getTodayUnreadController = async (req, res) => {
    try {
        const applications = await getTodayUnreadApplicationRequests();
        return res.status(200).json({ success: true, count: applications.length, applications });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch today's requests" });
    }
};

/* MARK APPLICATION REQUEST AS READ */
export const markApplicationReadController = async (req, res) => {
    try {
        await markApplicationRequestRead(req.params.id);
        return res.status(200).json({ success: true, message: "Marked as read" });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};


/* GET ALL APPLICATION REQUESTS */
export const getAllApplicationRequestsController = async (req, res) => {
    try {

        const applications = await getAllApplicationRequests();

        return res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Failed to fetch application requests"
        });

    }
};



/* DELETE APPLICATION REQUEST */
export const deleteApplicationRequestController = async (req, res) => {
    try {

        const { id } = req.params;

        const result = await deleteApplicationRequest(id);

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};



/* GET APPLICATION REQUEST STATS */
export const getApplicationRequestStatsController = async (req, res) => {
    try {

        const stats = await getApplicationRequestStats();

        return res.status(200).json({
            success: true,
            stats
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Failed to fetch application statistics"
        });

    }
};