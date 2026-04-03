import api from "../config";

/** Fetch payment dashboard data */
export const fetchPaymentDashboard = async () => {
  const res = await api.get("/admin/payments/dashboard");
  return res.data;
};

/** Fetch all payments */
export const fetchAllPayments = async () => {
  const res = await api.get("/admin/payments");
  return res.data;
};

/** Create a new payment bill (supports utility bill file upload) */
export const createPayment = async (payload, utilityBillFile = null) => {
  const fd = new FormData();
  
  // FIX: Exclude 'utilityBillFile' from the automatic loop so it doesn't double-append
  Object.entries(payload).forEach(([k, v]) => { 
    if (k !== "utilityBillFile" && v !== "" && v !== null && v !== undefined) {
      fd.append(k, v); 
    }
  });

  // Safely append the file exactly once
  if (utilityBillFile) {
      fd.append("utilityBillFile", utilityBillFile);
  }

  const res = await api.post("/admin/payments", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/** Update payment details (Now supports file uploads during edits!) */
export const updatePayment = async (id, payload, utilityBillFile = null) => {
  const fd = new FormData();

  // Only send backend-relevant fields, exclude frontend-only state
  const frontendOnlyKeys = ["utilityBillFile", "newUtilityBillFile", "existingUtilityBillFile", "receiptImage"];
  Object.entries(payload).forEach(([k, v]) => {
    if (!frontendOnlyKeys.includes(k) && v !== "" && v !== null && v !== undefined) {
      fd.append(k, v);
    }
  });

  // Append the new file if one was selected
  if (utilityBillFile) {
    fd.append("utilityBillFile", utilityBillFile);
  }

  const res = await api.patch(`/admin/payments/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/** Delete a payment */
export const deletePayment = async (id) => {
  const res = await api.delete(`/admin/payments/${id}`);
  return res.data;
};

/** Verify a payment */
export const verifyPayment = async (id) => {
  const res = await api.patch(`/admin/payments/${id}/verify`);
  return res.data;
};

/** Fetch active contracts (for payments) */
export const fetchContractsActive = async () => {
  const res = await api.get("/admin/contracts/dashboard");
  return res.data;
};