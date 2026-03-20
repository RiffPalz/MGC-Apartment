import api from "../config";

export const fetchMyPayments = async () => {
  const response = await api.get("/users/payments");
  return response.data;
};


export const uploadReceipt = async (paymentId, formData) => {
  const response = await api.post(`/users/payments/${paymentId}/upload-receipt`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};