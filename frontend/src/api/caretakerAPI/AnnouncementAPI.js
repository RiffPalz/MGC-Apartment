import api from "../config";

export const fetchAnnouncements = async (category) => {
  const params = category && category !== "All" ? { category } : {};
  const res = await api.get("/caretaker/announcements", { params });
  return res.data;
};

export const createAnnouncement = async (payload) => {
  const res = await api.post("/caretaker/announcements", payload);
  return res.data;
};

export const updateAnnouncement = async (id, payload) => {
  const res = await api.put(`/caretaker/announcements/${id}`, payload);
  return res.data;
};

export const deleteAnnouncement = async (id) => {
  const res = await api.delete(`/caretaker/announcements/${id}`);
  return res.data;
};
