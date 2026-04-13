import api from "../config";

export const fetchApplicationRequests = async () => {
  const res = await api.get("/admin/applications");
  return res.data;
};

export const fetchApplicationStats = async () => {
  const res = await api.get("/admin/applications/stats");
  return res.data;
};

export const markApplicationRequestRead = async (id) => {
  const res = await api.patch(`/admin/applications/${id}/read`);
  return res.data;
};

export const deleteApplicationRequest = async (id) => {
  const res = await api.delete(`/admin/applications/${id}`);
  return res.data;
};
