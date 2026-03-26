import api from "../config";
import { setAuth, clearAuth } from "../authStorage";

/** Caretaker login */
export const caretakerLogin = async ({ userName, password }) => {
  const res = await api.post("/caretaker/login", { userName, password });
  const { accessToken, caretaker } = res.data;
  if (accessToken && caretaker) {
    setAuth(accessToken, { ...caretaker, role: "caretaker" }, "caretaker");
  }
  return res.data;
};

/** Fetch caretaker profile */
export const fetchCaretakerProfile = async () => {
  const res = await api.get("/caretaker/profile");
  return res.data;
};

/** Update caretaker profile */
export const updateCaretakerProfile = async (payload) => {
  const res = await api.patch("/caretaker/profile/update", payload);
  return res.data;
};

/** Logout */
export const caretakerLogout = () => clearAuth();
