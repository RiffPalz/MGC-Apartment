import api from "../config";

const BASE_URL = "/users/maintenance";

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

/** Follow up on a maintenance request */
export const followUpMaintenanceRequest = async (id) => {
  const response = await api.patch(`${BASE_URL}/${id}/followup`);
  return response.data;
};