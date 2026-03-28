import ApplicationRequest from "../../models/applicationRequest.js";
import { sequelize } from "../../config/database.js";
import { Op } from "sequelize";

/* GET ALL APPLICATION REQUESTS */
export const getAllApplicationRequests = async () => {
  const applications = await ApplicationRequest.findAll({
    order: [["created_at", "DESC"]],
  });
  return applications;
};

/* GET TODAY'S UNREAD APPLICATION REQUESTS (for dashboard) */
export const getTodayUnreadApplicationRequests = async () => {
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
};

/* MARK APPLICATION REQUEST AS READ */
export const markApplicationRequestRead = async (id) => {
  const app = await ApplicationRequest.findByPk(id);
  if (!app) throw new Error("Application request not found");
  app.is_read = true;
  await app.save();
  return app;
};



/* DELETE APPLICATION REQUEST */
export const deleteApplicationRequest = async (applicationId) => {

  const application = await ApplicationRequest.findByPk(applicationId);

  if (!application) {
    throw new Error("Application request not found");
  }

  await application.destroy();

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