import api from "../config";

let announcementsCache = null;
let announcementsCacheTime = 0;
const ANNOUNCEMENTS_CACHE_TTL = 10000;

export const fetchAnnouncements = async () => {
  const now = Date.now();
  if (announcementsCache && now - announcementsCacheTime < ANNOUNCEMENTS_CACHE_TTL) {
    return announcementsCache;
  }
  const response = await api.get("/users/announcements");
  announcementsCache = response.data;
  announcementsCacheTime = now;
  return response.data;
};

export const fetchSingleAnnouncement = async (id) => {
  const response = await api.get(`/users/announcements/${id}`);
  return response.data;
};
