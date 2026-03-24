import api from "../config";

/** GET all approved tenants with active contracts */
export const fetchTenantsOverview = async () => {
  const response = await api.get("/admin/tenants/overview");
  return response.data;
};

/** GET approved tenants with no active contract (for new contract creation) */
export const fetchApprovedTenantsNoContract = async () => {
  const response = await api.get("/admin/users/approved-no-contract");
  return response.data;
};

/** POST create a new tenant */
export const createTenant = async (payload) => {
  const response = await api.post("/admin/tenants", payload);
  return response.data;
};

/** DELETE a tenant by userId */
export const deleteTenant = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};
