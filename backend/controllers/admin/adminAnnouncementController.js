import {
  createAnnouncement,
  getAllAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../services/admin/adminAnnouncementService.js";

/* CREATE ANNOUNCEMENT */
export const createAnnouncementController = async (req, res) => {
  try {
    const adminId = req.admin?.id || req.auth?.id;
    const { announcementTitle, announcementMessage, category } = req.body;

    const announcement = await createAnnouncement({
      announcementTitle,
      announcementMessage,
      category,
      adminId,
    });

    const io = req.app.get("io");
    io.emit("newAnnouncement", announcement);

    return res
      .status(201)
      .json({
        success: true,
        message: "Announcement created successfully",
        announcement,
      });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/* GET ALL ANNOUNCEMENTS */
export const getAllAnnouncementsController = async (req, res) => {
  try {
    const announcements = await getAllAnnouncements();
    return res
      .status(200)
      .json({ success: true, count: announcements.length, announcements });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch announcements" });
  }
};

/* UPDATE ANNOUNCEMENT */
export const updateAnnouncementController = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id || req.auth?.id;

    const announcement = await updateAnnouncement(id, req.body, adminId); // Pass Admin ID

    const io = req.app.get("io");
    io.emit("updateAnnouncement", announcement);

    return res
      .status(200)
      .json({ success: true, message: "Announcement updated", announcement });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/* DELETE ANNOUNCEMENT */
export const deleteAnnouncementController = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id || req.auth?.id;

    const result = await deleteAnnouncement(id, adminId); // Pass Admin ID

    const io = req.app.get("io");
    io.emit("deleteAnnouncement", { id });

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
