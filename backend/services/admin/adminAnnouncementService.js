import Announcement from "../../models/announcement.js";
import { createNotification } from "../../services/notificationService.js";
import { createActivityLog } from "../../services/activityLogService.js";

// Create an announcement, notify everyone, and log the action
export const createAnnouncement = async ({
    announcementTitle,
    announcementMessage,
    category,
    adminId 
}) => {
    if (!announcementTitle || !announcementMessage) {
        throw new Error("Title and message are required");
    }

    const announcement = await Announcement.create({
        announcementTitle,
        announcementMessage,
        category,
        createdBy: adminId
    });

    // Send notifications to both Tenants and Caretakers
    await createNotification({
        role: "tenant",
        type: "announcement_created",
        title: announcementTitle,
        message: announcementMessage,
        referenceId: announcement.ID,
        referenceType: "announcement"
    });

    await createNotification({
        role: "caretaker",
        type: "announcement_created",
        title: announcementTitle,
        message: announcementMessage,
        referenceId: announcement.ID,
        referenceType: "announcement"
    });

    // Record this action in the Admin activity log
    await createActivityLog({
        userId: adminId,
        role: "admin",
        action: "CREATE_ANNOUNCEMENT",
        description: `Created announcement: ${announcementTitle}`,
        referenceId: announcement.ID,
        referenceType: "announcement"
    });

    return announcement;
};

// Fetch all announcements, newest first
export const getAllAnnouncements = async () => {
    return await Announcement.findAll({
        order: [["created_at", "DESC"]]
    });
};

// Update an existing announcement and log the change
export const updateAnnouncement = async (announcementId, updates, adminId) => {
    const announcement = await Announcement.findByPk(announcementId);
    
    if (!announcement) throw new Error("Announcement not found");
    
    await announcement.update(updates);

    await createActivityLog({
        userId: adminId,
        role: "admin",
        action: "UPDATE_ANNOUNCEMENT",
        description: `Updated announcement ID ${announcement.ID}`,
        referenceId: announcement.ID,
        referenceType: "announcement"
    });
    
    return announcement;
};

// Log the deletion and then remove the announcement from the database
export const deleteAnnouncement = async (announcementId, adminId) => {
    const announcement = await Announcement.findByPk(announcementId);

    if (!announcement) throw new Error("Announcement not found");

    // Log the action before destroying the data
    await createActivityLog({
        userId: adminId,
        role: "admin",
        action: "DELETE_ANNOUNCEMENT",
        description: `Deleted announcement ID ${announcement.ID}`,
        referenceId: announcement.ID,
        referenceType: "announcement"
    });

    await announcement.destroy();

    return { message: "Announcement deleted successfully" };
};