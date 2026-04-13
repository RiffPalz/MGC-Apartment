import api from "../config";
import { setAuth, clearAuth } from "../authStorage";

export const adminLogin = async ({ email, password }) => {
  const response = await api.post("/admin/login", { email, password });
  return response.data;
};

export const adminVerifyOtp = async ({ adminId, verificationCode }) => {
  const response = await api.post("/admin/login/verify", { adminId, verificationCode });
  const { accessToken, admin } = response.data;
  if (accessToken && admin) setAuth(accessToken, { ...admin, role: "admin" }, "admin");
  return response.data;
};

export const adminResendOtp = async (adminId) => {
  const response = await api.post("/admin/login/resend", { adminId });
  return response.data;
};

export const fetchAdminProfile = async () => {
  const response = await api.get("/admin/profile");
  return response.data;
};

export const updateAdminProfile = async (payload) => {
  const response = await api.patch("/admin/profile/update", payload);
  return response.data;
};

export const adminLogout = () => clearAuth();
