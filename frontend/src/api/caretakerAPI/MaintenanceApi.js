import api from "../config";

export const fetchAllMaintenance = async () => {
  const res = await api.get("/caretaker/maintenance");
  return res.data;
};

export const createMaintenance = async (payload) => {
  const res = await api.post("/caretaker/maintenance", payload);
  return res.data;
};

export const updateMaintenance = async (id, payload) => {
  const res = await api.patch(`/caretaker/maintenance/${id}`, payload);
  return res.data;
};

export const deleteMaintenance = async (id) => {
  const res = await api.delete(`/caretaker/maintenance/${id}`);
  return res.data;
};
