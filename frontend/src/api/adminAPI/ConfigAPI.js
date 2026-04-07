import axios from "axios";
import api from "../config";

let configCache = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 10000;

/** GET /api/config — public, no auth required */
export const fetchConfig = async () => {
  const now = Date.now();
  if (configCache && now - configCacheTime < CONFIG_CACHE_TTL) {
    return configCache;
  }

  const base = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
  const url = base ? `${base}/config` : "/api/config";
  const res = await axios.get(url);
  configCache = res.data;
  configCacheTime = Date.now();
  return res.data;
};

export const updateConfig = async (formData) => {
  const res = await api.put("/admin/config", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  configCache = null;
  configCacheTime = 0;
  return res.data;
};
