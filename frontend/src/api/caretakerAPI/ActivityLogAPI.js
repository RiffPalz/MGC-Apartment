import api from "../config";

export const fetchCaretakerActivityLogs = async (filters = {}) => {
  const params = { limit: 100 };
  if (filters.search) params.search = filters.search;
  const res = await api.get("/activity-logs", { params });
  return res.data;
};
