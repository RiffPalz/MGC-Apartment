import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../services/caretaker/caretakerAnnouncementService.js";

export const getAnnouncementsController = async (req, res) => {
  try {
    const { category } = req.query;
    const announcements = await getAnnouncements(category);
    return res.status(200).json({ success: true, count: announcements.length, announcements });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch announcements" });
  }
};

export const createAnnouncementController = async (req, res) => {
  try {
    const caretakerId = req.caretaker.id;
    const announcement = await createAnnouncement({ ...req.body, caretakerId });
    return res.status(201).json({ success: true, message: "Announcement created", announcement });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAnnouncementController = async (req, res) => {
  try {
    const caretakerId = req.caretaker.id;
    const announcement = await updateAnnouncement(req.params.id, req.body, caretakerId);
    return res.status(200).json({ success: true, message: "Announcement updated", announcement });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAnnouncementController = async (req, res) => {
  try {
    const caretakerId = req.caretaker.id;
    await deleteAnnouncement(req.params.id, caretakerId);
    return res.status(200).json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
