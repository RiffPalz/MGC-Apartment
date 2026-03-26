import api from "../config";

export const fetchAnnouncements = async (category) => {
  const params = category && category !== "All" ? { category } : {};
  const res = await api.get("/caretaker/announcements", { params });
  return res.data; // { success, count, announcements[] }
};
