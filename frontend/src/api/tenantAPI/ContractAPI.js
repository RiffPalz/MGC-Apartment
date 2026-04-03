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

/** Get proxied PDF URL for viewing/downloading (avoids CORS) */
export const getContractPdfProxyUrl = (id) =>
  `${import.meta.env.VITE_BACKEND_URL}/users/contracts/${id}/pdf`;
