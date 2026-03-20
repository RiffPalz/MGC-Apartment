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
    attributes: [
      'ID',
      ['announcementTitle', 'title'],
      ['announcementMessage', 'message'],
      'category',
      'created_at'
    ],
    order: [["created_at", "DESC"]]
  });

  return announcements;
};

/* GET SINGLE ANNOUNCEMENT */
export const getSingleAnnouncement = async (id) => {
  const announcement = await Announcement.findByPk(id, {
    attributes: [
      'ID',
      ['announcementTitle', 'title'],
      ['announcementMessage', 'message'],
      'category',
      'created_at'
    ]
  });

  return announcement;
};