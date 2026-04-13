import api from "../config";

export const fetchAllMaintenance = async () => {
  const res = await api.get("/admin/maintenance");
  return res.data;
};

export const createMaintenance = async (payload) => {
  const res = await api.post("/admin/maintenance", payload);
  return res.data;
};

export const approveMaintenance = async (id) => {
  const res = await api.patch(`/admin/maintenance/${id}/approve`);
  return res.data;
};

export const updateMaintenance = async (id, payload) => {
  const res = await api.patch(`/admin/maintenance/${id}`, payload);
  return res.data;
};

export const deleteMaintenance = async (id) => {
  const res = await api.delete(`/admin/maintenance/${id}`);
  return res.data;
};
