import api from "../config";

export const fetchAllUnits = async () => {
  const response = await api.get("/admin/units");
  return response.data;
};

export const createUnit = async (payload) => {
  const response = await api.post("/admin/units", payload);
  return response.data;
};

export const updateUnit = async (unitId, payload) => {
  const response = await api.patch(`/admin/units/${unitId}`, payload);
  return response.data;
};

export const deleteUnit = async (unitId) => {
  const response = await api.delete(`/admin/units/${unitId}`);
  return response.data;
};

export const fetchTenantProfile = async (tenantId) => {
  const response = await api.get(`/admin/tenants/${tenantId}`);
  return response.data;
};

export const updateTenantProfile = async (tenantId, payload) => {
  const response = await api.patch(`/admin/tenants/${tenantId}`, payload);
  return response.data;
};
