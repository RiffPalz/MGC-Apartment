import api from "../config";

export const registerTenant = async (payload) => {
  const response = await api.post("/users/register", payload);
  return response.data;
};

export const checkAvailability = async (userName = "") => {
  const response = await api.get("/users/check-availability", {
    params: userName ? { userName } : {},
  });
  return response.data;
};

export const loginTenant = async ({ userName, password }) => {
  const response = await api.post("/users/login", { userName, password });
  if (response.data?.accessToken) {
    localStorage.setItem("tenantToken", response.data.accessToken);
  }
  return response.data;
};

export const logoutTenant = () => {
  localStorage.removeItem("tenantToken");
  tenantProfileCache = null;
  tenantProfileCacheTime = 0;
};

let tenantProfileCache = null;
let tenantProfileCacheTime = 0;
const TENANT_PROFILE_CACHE_TTL = 10000;

export const fetchTenantProfile = async () => {
  const now = Date.now();
  if (tenantProfileCache && now - tenantProfileCacheTime < TENANT_PROFILE_CACHE_TTL) {
    return tenantProfileCache;
  }
  const response = await api.get("/users/profile");
  tenantProfileCache = response.data;
  tenantProfileCacheTime = Date.now();
  return response.data;
};
