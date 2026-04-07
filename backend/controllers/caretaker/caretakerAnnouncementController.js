import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../services/caretaker/caretakerAnnouncementService.js";
import { emitEvent } from "../../utils/emitEvent.js";

// Get announcements
export const getAnnouncementsController = async (req, res) => {
  try {
    const { category } = req.query;

    const announcements = await getAnnouncements(category);

    return res.status(200).json({
      success: true,
      count: announcements.length,
      announcements
    });

  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch announcements"
    });
  }
};

// Create announcement + notify tenants
export const createAnnouncementController = async (req, res) => {
  try {
    const caretakerId = req.caretaker.id;

    const announcement = await createAnnouncement({
      ...req.body,
      caretakerId
    });

    emitEvent(req, "announcements_updated");

    const io = req.app.get("io");

    // Broadcast announcement
    io.emit("newAnnouncement", announcement);

    // Send notification
    io.to("tenant").emit("new_notification", {
      title: req.body.announcementTitle || "New Announcement",
      message: req.body.announcementMessage || "A new announcement has been posted.",
      type: "announcement",
      is_read: false,
      created_at: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: "Announcement created",
      announcement
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update announcement
export const updateAnnouncementController = async (req, res) => {
  try {
    const caretakerId = req.caretaker.id;

    const announcement = await updateAnnouncement(
      req.params.id,
      req.body,
      caretakerId
    );

    emitEvent(req, "announcements_updated");

    const io = req.app.get("io");

    // Broadcast update
    io.emit("updateAnnouncement", announcement);

    return res.status(200).json({
      success: true,
      message: "Announcement updated",
      announcement
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete announcement
export const deleteAnnouncementController = async (req, res) => {
  try {
    const caretakerId = req.caretaker.id;

    await deleteAnnouncement(req.params.id, caretakerId);

    emitEvent(req, "announcements_updated");

    const io = req.app.get("io");

    // Broadcast delete
    io.emit("deleteAnnouncement", { id: req.params.id });

    return res.status(200).json({
      success: true,
      message: "Announcement deleted"
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};