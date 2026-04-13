import api from "../config";

export const fetchContractDashboard = async () => {
  const res = await api.get("/admin/contracts/dashboard");
  return res.data;
};

export const fetchExpiringContracts = async () => {
  const res = await api.get("/admin/contracts/expiring");
  return res.data;
};

export const createContract = async (unitId, formData) => {
  const res = await api.post(`/admin/contracts/${unitId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const editContract = async (id, formData) => {
  const res = await api.put(`/admin/contracts/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const terminateContract = async (id) => {
  const res = await api.put(`/admin/contracts/${id}/terminate`);
  return res.data;
};

export const completeContract = async (id) => {
  const res = await api.put(`/admin/contracts/${id}/complete`);
  return res.data;
};

export const renewContract = async (id, { newStartDate, newEndDate }) => {
  const res = await api.post(`/admin/contracts/${id}/renew`, { newStartDate, newEndDate });
  return res.data;
};

export const generateContractPdf = async (id) => {
  const res = await api.post(`/admin/contracts/${id}/generate-pdf`);
  return res.data;
};

export const getContractPdfProxyUrl = (id) =>
  `${import.meta.env.VITE_BACKEND_URL}/admin/contracts/${id}/pdf`;

export const deleteContract = async (id) => {
  const res = await api.delete(`/admin/contracts/${id}`);
  return res.data;
};

export const fetchTerminationRequests = async () => {
  const res = await api.get("/admin/contracts/termination-requests");
  return res.data;
};

export const approveTerminationRequest = async (id) => {
  const res = await api.put(`/admin/contracts/termination-requests/${id}/approve`);
  return res.data;
};

export const rejectTerminationRequest = async (id) => {
  const res = await api.put(`/admin/contracts/termination-requests/${id}/reject`);
  return res.data;
};
