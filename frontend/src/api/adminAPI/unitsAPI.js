import api from "../config";

/** GET all units with occupancy data */
export const fetchAllUnits = async () => {
  const response = await api.get("/admin/units");
  return response.data;
};

/** PATCH update a unit (max_capacity, is_active) */
export const updateUnit = async (unitId, payload) => {
  const response = await api.patch(`/admin/units/${unitId}`, payload);
  return response.data;
};
