import ApplicationRequest from "../../models/applicationRequest.js";
import { sequelize } from "../../config/database.js";
import { Op } from "sequelize";
import { createActivityLog } from "../../services/activityLogService.js";

/* GET ALL APPLICATION REQUESTS */
export const getAllApplicationRequests = async () => {
  const applications = await ApplicationRequest.findAll({
    order: [["created_at", "DESC"]],
  });
  return applications;
};

/* GET TODAY'S UNREAD APPLICATION REQUESTS (for dashboard) */
export const getTodayUnreadApplicationRequests = async () => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const applications = await ApplicationRequest.findAll({
      where: {
        is_read: false,
        created_at: { [Op.between]: [startOfDay, endOfDay] },
      },
      order: [["created_at", "DESC"]],
    });
    return applications;
  } catch {
    // Fallback: if is_read column doesn't exist yet, return today's records without filter
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const applications = await ApplicationRequest.findAll({
      where: {
        created_at: { [Op.between]: [startOfDay, endOfDay] },
      },
      order: [["created_at", "DESC"]],
    });
    return applications;
  }
};

/* MARK APPLICATION REQUEST AS READ */
export const markApplicationRequestRead = async (id, adminId) => {
  const app = await ApplicationRequest.findByPk(id);
  if (!app) throw new Error("Application request not found");
  app.is_read = true;
  await app.save();

  if (adminId) {
    await createActivityLog({
      userId: adminId,
      role: "admin",
      action: "MARK APP REQUEST READ",
      description: `You marked an application request as read.`,
      referenceId: app.id,
      referenceType: "application_request",
    });
  }

  return app;
};



/* DELETE APPLICATION REQUEST */
export const deleteApplicationRequest = async (applicationId, adminId) => {

  const application = await ApplicationRequest.findByPk(applicationId);

  if (!application) {
    throw new Error("Application request not found");
  }

  await application.destroy();

  if (adminId) {
    await createActivityLog({
      userId: adminId,
      role: "admin",
      action: "DELETE APP REQUEST",
      description: `You deleted an application request.`,
      referenceId: applicationId,
      referenceType: "application_request",
    });
  }

  return {
    message: "Application request deleted successfully"
  };
};



/* GET APPLICATION REQUEST STATS */
export const getApplicationRequestStats = async () => {

  const [stats] = await sequelize.query(`
    SELECT
      COUNT(*) AS totalApplications,

      SUM(
        CASE
          WHEN DATE(created_at) = CURDATE()
          THEN 1 ELSE 0
        END
      ) AS todayApplications,

      SUM(
        CASE
          WHEN MONTH(created_at) = MONTH(CURRENT_DATE())
          AND YEAR(created_at) = YEAR(CURRENT_DATE())
          THEN 1 ELSE 0
        END
      ) AS monthApplications

    FROM application_requests
  `);

  return stats[0];
};