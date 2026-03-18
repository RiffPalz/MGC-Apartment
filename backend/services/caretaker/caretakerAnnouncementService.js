import Announcement from "../../models/announcement.js";

/* GET ANNOUNCEMENTS */
export const getAnnouncements = async (category) => {

  const where = category && category !== "All"
    ? { category }
    : {};

  const announcements = await Announcement.findAll({
    where,
    order: [["created_at", "DESC"]]
  });

  return announcements;
};