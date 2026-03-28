import api from "../config";

export const fetchCaretakerActivityLogs = async (filters = {}) => {
  const params = { limit: 500 };
  if (filters.search?.trim()) params.search = filters.search.trim();
  const res = await api.get("/activity-logs", { params });
  return res.data; // { success, count, logs[] }
};
