import api from "../config";

export const fetchAnnouncements = async () => {
  // Matches the userAnnouncementRoutes.js
  const response = await api.get("/users/announcements");
  return response.data;
};

export const fetchSingleAnnouncement = async (id) => {
  const response = await api.get(`/users/announcements/${id}`);
  return response.data;
};