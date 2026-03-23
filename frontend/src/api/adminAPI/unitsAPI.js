import api from "../config";

/** GET all units with occupancy data */
export const fetchAllUnits = async () => {
  const response = await api.get("/admin/units");
  return response.data; // { success, count, units[] }
};

/** POST create a new unit */
export const createUnit = async (payload) => {
  const response = await api.post("/admin/units", payload);
  return response.data;
};

/** PATCH update a unit (max_capacity, is_active) */
export const updateUnit = async (unitId, payload) => {
  const response = await api.patch(`/admin/units/${unitId}`, payload);
  return response.data;
};

/** DELETE a unit */
export const deleteUnit = async (unitId) => {
  const response = await api.delete(`/admin/units/${unitId}`);
  return response.data;
};

/** GET single tenant profile by user ID */
export const fetchTenantProfile = async (tenantId) => {
  const response = await api.get(`/admin/tenants/${tenantId}`);
  return response.data; // { success, tenant }
};
