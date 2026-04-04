import axios from "axios";
import api from "../config";

/** GET /api/config — public, no auth required */
export const fetchConfig = async () => {
  const base = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL?.replace(/\/api$/, "") || "";
  const res = await axios.get(`${base}/api/config`);
  return res.data;
};

/** PUT /api/admin/config — admin-authenticated, multipart/form-data */
export const updateConfig = async (formData) => {
  const res = await api.put("/admin/config", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
