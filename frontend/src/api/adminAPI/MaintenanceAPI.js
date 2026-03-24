import api from "../config";

/** GET all maintenance requests */
export const fetchAllMaintenance = async () => {
  const res = await api.get("/admin/maintenance");
  return res.data; // { success, count, requests[] }
};

/** POST create a maintenance request */
export const createMaintenance = async (payload) => {
  const res = await api.post("/admin/maintenance", payload);
  return res.data;
};

/** PATCH approve a request (Pending → Approved) */
export const approveMaintenance = async (id) => {
  const res = await api.patch(`/admin/maintenance/${id}/approve`);
  return res.data;
};

/** PATCH update status / dates */
export const updateMaintenance = async (id, payload) => {
  const res = await api.patch(`/admin/maintenance/${id}`, payload);
  return res.data;
};

/** DELETE a maintenance request */
export const deleteMaintenance = async (id) => {
  const res = await api.delete(`/admin/maintenance/${id}`);
  return res.data;
};
