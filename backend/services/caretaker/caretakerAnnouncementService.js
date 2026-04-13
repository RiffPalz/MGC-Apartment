import Announcement from "../../models/announcement.js";
import User from "../../models/user.js";
import { createNotification } from "../../services/notificationService.js";
import { createActivityLog } from "../../services/activityLogService.js";
import { sendSMSBulk } from "../../utils/sms.js";
import { sms } from "../../utils/smsTemplates.js";

export const getAnnouncements = async (category) => {
  const where = category && category !== "All" ? { category } : {};
  return await Announcement.findAll({ where, order: [["created_at", "DESC"]] });
};

export const createAnnouncement = async ({ announcementTitle, announcementMessage, category, caretakerId }) => {
  if (!announcementTitle || !announcementMessage) throw new Error("Title and message are required");

  const announcement = await Announcement.create({
    announcementTitle,
    announcementMessage,
    category,
    createdBy: caretakerId,
  });

  await createNotification({
    role: "tenant",
    type: "announcement created",
    title: announcementTitle,
    message: announcementMessage,
    referenceId: announcement.ID,
    referenceType: "announcement",
  });

  const tenants = await User.findAll({
    where: { role: "tenant", status: "Approved" },
    attributes: ["contactNumber"],
  });
  sendSMSBulk(tenants.map((t) => t.contactNumber), sms.announcementPosted(announcementTitle, category || "General"));

  await createActivityLog({
    userId: caretakerId,
    role: "caretaker",
    action: "CREATE ANNOUNCEMENT",
    description: `You posted a new announcement: "${announcementTitle}".`,
    referenceId: announcement.ID,
    referenceType: "announcement",
  });

  return announcement;
};

export const updateAnnouncement = async (announcementId, updates, caretakerId) => {
  const announcement = await Announcement.findByPk(announcementId);
  if (!announcement) throw new Error("Announcement not found");

  await announcement.update(updates);

  await createActivityLog({
    userId: caretakerId,
    role: "caretaker",
    action: "UPDATE ANNOUNCEMENT",
    description: `You updated the announcement: "${announcement.announcementTitle}".`,
    referenceId: announcement.ID,
    referenceType: "announcement",
  });

  return announcement;
};

export const deleteAnnouncement = async (announcementId, caretakerId) => {
  const announcement = await Announcement.findByPk(announcementId);
  if (!announcement) throw new Error("Announcement not found");

  await createActivityLog({
    userId: caretakerId,
    role: "caretaker",
    action: "DELETE ANNOUNCEMENT",
    description: `You deleted the announcement: "${announcement.announcementTitle}".`,
    referenceId: announcement.ID,
    referenceType: "announcement",
  });

  await announcement.destroy();
  return { message: "Announcement deleted successfully" };
};
