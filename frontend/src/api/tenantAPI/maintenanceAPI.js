import api from "../config"; // Adjust path if needed

const BASE_URL = "/users/maintenance"; // Base endpoint

/** Create a maintenance request */
export const submitMaintenanceRequest = async (payload) => {
  const response = await api.post(`${BASE_URL}/`, payload);
  return response.data;
};

/** Get tenant's maintenance history */
export const fetchMyMaintenanceHistory = async () => {
  const response = await api.get(`${BASE_URL}/my`);
  return response.data;
};