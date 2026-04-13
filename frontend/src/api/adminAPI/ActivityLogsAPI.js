import api from "../config";

export const fetchAllActivityLogs = async (filters = {}) => {
  const params = {};

  if (filters.role && filters.role !== "All") params.role = filters.role.toLowerCase();
  if (filters.search?.trim()) params.search = filters.search.trim();
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.limit) params.limit = filters.limit;
  if (filters.offset) params.offset = filters.offset;

  const res = await api.get("/admin/activity-logs", { params });
  return res.data;
};
