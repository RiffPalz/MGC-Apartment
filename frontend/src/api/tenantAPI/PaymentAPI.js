import api from "../config";

let paymentsCache = null;
let paymentsCacheTime = 0;
const PAYMENTS_CACHE_TTL = 10000;

export const fetchMyPayments = async () => {
  const now = Date.now();
  if (paymentsCache && now - paymentsCacheTime < PAYMENTS_CACHE_TTL) return paymentsCache;

  const response = await api.get("/users/payments");
  paymentsCache = response.data;
  paymentsCacheTime = now;
  return response.data;
};

export const uploadReceipt = async (paymentId, formData) => {
  const response = await api.post(`/users/payments/${paymentId}/upload-receipt`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  paymentsCache = null;
  paymentsCacheTime = 0;
  return response.data;
};
