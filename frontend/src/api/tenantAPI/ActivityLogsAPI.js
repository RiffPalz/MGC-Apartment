import api from "../config";

export const fetchActivityLogs = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.action) params.append("action", filters.action);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.limit) params.append("limit", filters.limit);
  if (filters.offset) params.append("offset", filters.offset);

  const res = await api.get(`/activity-logs?${params.toString()}`);
  return res.data;
};
