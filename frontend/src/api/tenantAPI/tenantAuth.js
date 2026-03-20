import api from "../config";

/** Register a new tenant */
export const registerTenant = async (payload) => {
  const response = await api.post("/users/register", payload);
  return response.data;
};

/** Tenant login with username & password */
export const loginTenant = async ({ userName, password }) => {
  const response = await api.post("/users/login", { userName, password });

  // Store token locally
  if (response.data?.accessToken) {
    localStorage.setItem("tenantToken", response.data.accessToken);
  }

  return response.data;
};

/** Tenant logout (clears local token) */
export const logoutTenant = () => {
  localStorage.removeItem("tenantToken");
};

/** Fetch tenant profile (protected) */
export const fetchTenantProfile = async () => {
  const response = await api.get("/users/profile");
  return response.data;
};