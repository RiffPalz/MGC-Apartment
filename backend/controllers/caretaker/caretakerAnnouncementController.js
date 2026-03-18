import { getAnnouncements } from "../../services/caretaker/caretakerAnnouncementService.js";

// Get announcements (optionally filter by category)
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
    console.error("Fetch announcements error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch announcements"
    });
  }
};