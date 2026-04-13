import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../services/caretaker/caretakerAnnouncementService.js";
import { emitEvent } from "../../utils/emitEvent.js";

export const getAnnouncementsController = async (req, res) => {
  try {
    const announcements = await getAnnouncements(req.query.category);
    return res.status(200).json({ success: true, count: announcements.length, announcements });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch announcements" });
  }
};

export const createAnnouncementController = async (req, res) => {
  try {
    const announcement = await createAnnouncement({ ...req.body, caretakerId: req.caretaker.id });

    emitEvent(req, "announcements_updated");

    const io = req.app.get("io");
    io.emit("newAnnouncement", announcement);
    io.to("tenant").emit("new_notification", {
      title: req.body.announcementTitle || "New Announcement",
      message: req.body.announcementMessage || "A new announcement has been posted.",
      type: "announcement",
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return res.status(201).json({ success: true, message: "Announcement created", announcement });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAnnouncementController = async (req, res) => {
  try {
    const announcement = await updateAnnouncement(req.params.id, req.body, req.caretaker.id);

    emitEvent(req, "announcements_updated");
    req.app.get("io").emit("updateAnnouncement", announcement);

    return res.status(200).json({ success: true, message: "Announcement updated", announcement });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAnnouncementController = async (req, res) => {
  try {
    await deleteAnnouncement(req.params.id, req.caretaker.id);

    emitEvent(req, "announcements_updated");
    req.app.get("io").emit("deleteAnnouncement", { id: req.params.id });

    return res.status(200).json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
