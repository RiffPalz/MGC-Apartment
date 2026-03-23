import api from "../config";

export const fetchUserContracts = async () => {
  try {
    const response = await api.get("/users/contracts");
    return response.data;
  } catch (error) {
    console.error("Error fetching contracts:", error);
    throw error;
  }
};
