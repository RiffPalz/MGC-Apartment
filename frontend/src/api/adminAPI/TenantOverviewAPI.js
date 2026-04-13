import api from "../config";

export const fetchTenantsOverview = async () => {
  const response = await api.get("/admin/tenants/overview");
  return response.data;
};

export const fetchApprovedTenantsNoContract = async () => {
  const response = await api.get("/admin/users/approved-no-contract");
  return response.data;
};

export const createTenant = async (payload) => {
  const response = await api.post("/admin/tenants", payload);
  return response.data;
};

export const deleteTenant = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};
