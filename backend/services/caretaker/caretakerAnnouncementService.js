import Announcement from "../../models/announcement.js";

/* GET ANNOUNCEMENTS */
export const getAnnouncements = async (category) => {

  const whereClause = {};

  if (category && category !== "All") {
    whereClause.category = category;
  }

  const announcements = await Announcement.findAll({
    where: whereClause,
    order: [["created_at", "DESC"]]
  });

  return announcements;
};