import api from "../config";

const BASE_URL = "/users/maintenance";

export const submitMaintenanceRequest = async (payload) => {
  const response = await api.post(`${BASE_URL}/`, payload);
  return response.data;
};

export const fetchMyMaintenanceHistory = async () => {
  const response = await api.get(`${BASE_URL}/my`);
  return response.data;
};

export const followUpMaintenanceRequest = async (id) => {
  const response = await api.patch(`${BASE_URL}/${id}/followup`);
  return response.data;
};

export const editMaintenanceRequest = async (id, payload) => {
  const response = await api.patch(`${BASE_URL}/${id}`, payload);
  return response.data;
};
