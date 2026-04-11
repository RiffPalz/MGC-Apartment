import api from "../config";

/** Fetch dashboard data (units + contracts) */
export const fetchContractDashboard = async () => {
  const res = await api.get("/admin/contracts/dashboard");
  return res.data;
};

/** Fetch contracts expiring soon */
export const fetchExpiringContracts = async () => {
  const res = await api.get("/admin/contracts/expiring");
  return res.data;
};

/** Create a new contract */
export const createContract = async (unitId, formData) => {
  const res = await api.post(`/admin/contracts/${unitId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/** Update contract details */
export const editContract = async (id, formData) => {
  const res = await api.put(`/admin/contracts/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/** Terminate a contract */
export const terminateContract = async (id) => {
  const res = await api.put(`/admin/contracts/${id}/terminate`);
  return res.data;
};

/** Complete a contract */
export const completeContract = async (id) => {
  const res = await api.put(`/admin/contracts/${id}/complete`);
  return res.data;
};

/** Renew a contract — updates dates and regenerates PDF */
export const renewContract = async (id, { newStartDate, newEndDate }) => {
  const res = await api.post(`/admin/contracts/${id}/renew`, { newStartDate, newEndDate });
  return res.data;
};

/** Generate a PDF contract dynamically */
export const generateContractPdf = async (id) => {
  const res = await api.post(`/admin/contracts/${id}/generate-pdf`);
  return res.data;
};

/** Get proxied PDF URL for viewing/downloading (avoids CORS) */
export const getContractPdfProxyUrl = (id) =>
  `${import.meta.env.VITE_BACKEND_URL}/admin/contracts/${id}/pdf`;

/** Delete a contract permanently */
export const deleteContract = async (id) => {
  const res = await api.delete(`/admin/contracts/${id}`);
  return res.data;
};

/** Get all tenant termination requests */
export const fetchTerminationRequests = async () => {
  const res = await api.get("/admin/contracts/termination-requests");
  return res.data;
};

/** Approve a termination request */
export const approveTerminationRequest = async (id) => {
  const res = await api.put(`/admin/contracts/termination-requests/${id}/approve`);
  return res.data;
};

/** Reject a termination request */
export const rejectTerminationRequest = async (id) => {
  const res = await api.put(`/admin/contracts/termination-requests/${id}/reject`);
  return res.data;
};