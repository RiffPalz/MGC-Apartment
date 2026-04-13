import api from "../config";

export const fetchAllAnnouncements = async () => {
  const res = await api.get("/admin/announcements");
  return res.data;
};

export const createAnnouncement = async (payload) => {
  const res = await api.post("/admin/announcements", payload);
  return res.data;
};

export const updateAnnouncement = async (id, payload) => {
  const res = await api.patch(`/admin/announcements/${id}`, payload);
  return res.data;
};

export const deleteAnnouncement = async (id) => {
  const res = await api.delete(`/admin/announcements/${id}`);
  return res.data;
};
