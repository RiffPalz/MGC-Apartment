import Announcement from "../models/announcement.js";

export const getAnnouncements = async (category) => {
  const whereClause = {};
  if (category && category !== "All") whereClause.category = category;

  return await Announcement.findAll({
    where: whereClause,
    attributes: [
      "ID",
      ["announcementTitle", "title"],
      ["announcementMessage", "message"],
      "category",
      "created_at",
    ],
    order: [["created_at", "DESC"]],
  });
};

export const getSingleAnnouncement = async (id) => {
  return await Announcement.findByPk(id, {
    attributes: [
      "ID",
      ["announcementTitle", "title"],
      ["announcementMessage", "message"],
      "category",
      "created_at",
    ],
  });
};
