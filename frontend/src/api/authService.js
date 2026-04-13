import api from "./config.js";
import { setAuth, clearAuth } from "./authStorage.js";

export const login = async ({ role, credentials }) => {
  let endpoint = "";

  switch (role) {
    case "user":      endpoint = "/users/login";     break;
    case "admin":     endpoint = "/admin/login";     break;
    case "caretaker": endpoint = "/caretaker/login"; break;
    default: throw new Error("Invalid role");
  }

  const response = await api.post(endpoint, credentials);

  if (role === "admin") return response.data;

  const { accessToken } = response.data;
  const userData = response.data.caretaker || response.data.user;
  if (accessToken && userData) {
    setAuth(accessToken, { ...userData, role: userData.role || role }, userData.role || role);
  }

  return response.data;
};

export const verifyAdminOtp = async ({ adminId, verificationCode }) => {
  const response = await api.post("/admin/login/verify", { adminId, verificationCode });
  const { accessToken, admin } = response.data;
  setAuth(accessToken, { ...admin, role: "admin" }, "admin");
  return response.data;
};

export const resendAdminOtp = async (adminId) => {
  const response = await api.post("/admin/login/resend", { adminId });
  return response.data;
};

export const logout = () => clearAuth();
