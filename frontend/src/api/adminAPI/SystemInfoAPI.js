import api from "../config";

export const fetchSystemInfo = async () => {
  const res = await api.get("/system-info");
  return res.data; // { success, systemInfo }
};

export const updateSystemInfo = async (payload) => {
  const res = await api.patch("/system-info", payload);
  return res.data; // { success, systemInfo }
};
