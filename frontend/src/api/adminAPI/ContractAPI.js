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

/** Renew a contract */
export const renewContract = async (id, formData) => {
  const res = await api.post(`/admin/contracts/${id}/renew`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};