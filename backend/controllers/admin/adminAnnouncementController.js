import {
  createAnnouncement,
  getAllAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../services/admin/adminAnnouncementService.js";

export const createAnnouncementController = async (req, res) => {
  try {
    const adminId = req.admin?.id || req.auth?.id;
    const { announcementTitle, announcementMessage, category } = req.body;

    const announcement = await createAnnouncement({ announcementTitle, announcementMessage, category, adminId });

    const io = req.app.get("io");
    io.emit("newAnnouncement", announcement);
    io.to("tenant").emit("new_notification", {
      ID: null,
      user_id: null,
      role: "tenant",
      type: "announcement",
      title: announcementTitle,
      message: announcementMessage,
      reference_id: announcement.ID,
      reference_type: "announcement",
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return res.status(201).json({ success: true, message: "Announcement created successfully", announcement });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllAnnouncementsController = async (req, res) => {
  try {
    const announcements = await getAllAnnouncements();
    return res.status(200).json({ success: true, count: announcements.length, announcements });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch announcements" });
  }
};

export const updateAnnouncementController = async (req, res) => {
  try {
    const adminId = req.admin?.id || req.auth?.id;
    const announcement = await updateAnnouncement(req.params.id, req.body, adminId);

    const io = req.app.get("io");
    io.emit("updateAnnouncement", announcement);

    return res.status(200).json({ success: true, message: "Announcement updated", announcement });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAnnouncementController = async (req, res) => {
  try {
    const adminId = req.admin?.id || req.auth?.id;
    const result = await deleteAnnouncement(req.params.id, adminId);

    const io = req.app.get("io");
    io.emit("deleteAnnouncement", { id: req.params.id });

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
