import api from "../config";

export const fetchAllPayments = async () => {
  const res = await api.get("/caretaker/payments");
  return res.data; // { success, count, payments[] }
};

export const fetchPendingPayments = async () => {
  const res = await api.get("/caretaker/payments/pending");
  return res.data;
};

export const verifyPayment = async (id) => {
  const res = await api.patch(`/caretaker/payments/${id}/verify`);
  return res.data;
};

export const deletePayment = async (id) => {
  const res = await api.delete(`/caretaker/payments/${id}`);
  return res.data;
};
