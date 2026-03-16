import Announcement from "../models/announcement.js";
import { Op } from "sequelize";

/* GET ALL ANNOUNCEMENTS */
export const getAnnouncements = async (category) => {

  const whereClause = {};

  // filter by category if provided
  if (category && category !== "All") {
    whereClause.category = category;
  }

  const announcements = await Announcement.findAll({
    where: whereClause,
    order: [["created_at", "DESC"]]
  });

  return announcements;
};