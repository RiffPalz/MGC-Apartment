import api from "../config";
import { setAuth, clearAuth } from "../authStorage";

/** Admin login (email & password) */
export const adminLogin = async ({ email, password }) => {
  const response = await api.post("/admin/login", { email, password });
  return response.data;
};

/** Verify OTP and store admin session */
export const adminVerifyOtp = async ({ adminId, verificationCode }) => {
  const response = await api.post("/admin/login/verify", { adminId, verificationCode });
  const { accessToken, admin } = response.data;

  if (accessToken && admin) {
    setAuth(accessToken, { ...admin, role: "admin" }, "admin");
  }

  return response.data;
};

/** Resend admin OTP */
export const adminResendOtp = async (adminId) => {
  const response = await api.post("/admin/login/resend", { adminId });
  return response.data;
};

/** Fetch admin profile */
export const fetchAdminProfile = async () => {
  const response = await api.get("/admin/profile");
  return response.data;
};

/** Update admin profile */
export const updateAdminProfile = async (payload) => {
  const response = await api.patch("/admin/profile/update", payload);
  return response.data;
};

/** Logout admin */
export const adminLogout = () => {
  clearAuth();
};