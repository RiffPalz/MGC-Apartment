import api from "../config";

export const fetchPaymentDashboard = async () => {
  const res = await api.get("/admin/payments/dashboard");
  return res.data;
};

export const fetchAllPayments = async () => {
  const res = await api.get("/admin/payments");
  return res.data;
};

export const createPayment = async (payload, utilityBillFile = null) => {
  const fd = new FormData();

  Object.entries(payload).forEach(([k, v]) => {
    if (k !== "utilityBillFile" && v !== "" && v !== null && v !== undefined) {
      fd.append(k, v);
    }
  });

  if (utilityBillFile) fd.append("utilityBillFile", utilityBillFile);

  const res = await api.post("/admin/payments", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updatePayment = async (id, payload, utilityBillFile = null) => {
  const fd = new FormData();
  const frontendOnlyKeys = ["utilityBillFile", "newUtilityBillFile", "existingUtilityBillFile", "receiptImage"];

  Object.entries(payload).forEach(([k, v]) => {
    if (!frontendOnlyKeys.includes(k) && v !== "" && v !== null && v !== undefined) {
      fd.append(k, v);
    }
  });

  if (utilityBillFile) fd.append("utilityBillFile", utilityBillFile);

  const res = await api.patch(`/admin/payments/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deletePayment = async (id) => {
  const res = await api.delete(`/admin/payments/${id}`);
  return res.data;
};

export const verifyPayment = async (id) => {
  const res = await api.patch(`/admin/payments/${id}/verify`);
  return res.data;
};

export const fetchContractsActive = async () => {
  const res = await api.get("/admin/contracts/dashboard");
  return res.data;
};
