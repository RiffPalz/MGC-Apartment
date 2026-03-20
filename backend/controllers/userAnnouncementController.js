import { getAnnouncements, getSingleAnnouncement } from "../services/userAnnouncementService.js";


/* GET ANNOUNCEMENTS */
export const getAnnouncementsController = async (req, res) => {
  try {

    const { category } = req.query;

    const announcements = await getAnnouncements(category);

    return res.status(200).json({
      success: true,
      count: announcements.length,
      announcements
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch announcements"
    });
  }
};

/* GET SINGLE ANNOUNCEMENT */
export const getSingleAnnouncementController = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await getSingleAnnouncement(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found"
      });
    }

    return res.status(200).json({
      success: true,
      announcement
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch announcement"
    });
  }
};