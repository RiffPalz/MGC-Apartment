import api from "../config";

// Uses caretaker-scoped endpoints (no admin token required)
export const fetchTenantsOverview = async () => {
  const res = await api.get("/caretaker/tenants");
  return res.data; // { success, count, tenants[] }
};

export const fetchUnits = async () => {
  const res = await api.get("/caretaker/units");
  return res.data;
};
