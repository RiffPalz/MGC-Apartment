import api from "../config";

export const fetchTenantsOverview = async () => {
  const res = await api.get("/caretaker/tenants");
  return res.data;
};

export const fetchUnits = async () => {
  const res = await api.get("/caretaker/units");
  return res.data;
};

export const createTenant = async (payload) => {
  const res = await api.post("/caretaker/tenants", payload);
  return res.data;
};
