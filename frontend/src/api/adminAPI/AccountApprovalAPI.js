import api from "../config";

export const fetchPendingUsers = async () => {
  const res = await api.get("/admin/users/pending");
  return res.data;
};

export const updateUserApproval = async (userId, status) => {
  const res = await api.patch(`/admin/users/${userId}/approval`, { status });
  return res.data;
};
