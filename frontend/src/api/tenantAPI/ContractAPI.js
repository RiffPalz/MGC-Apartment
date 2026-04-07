import api from "../config";

let contractsCache = null;
let contractsCacheTime = 0;
const CONTRACTS_CACHE_TTL = 10000;

export const fetchUserContracts = async () => {
  const now = Date.now();
  if (contractsCache && now - contractsCacheTime < CONTRACTS_CACHE_TTL) {
    return contractsCache;
  }

  try {
    const response = await api.get("/users/contracts");
    contractsCache = response.data;
    contractsCacheTime = now;
    return response.data;
  } catch (error) {
    console.error("Error fetching contracts:", error);
    throw error;
  }
};

/** Get proxied PDF URL for viewing/downloading (avoids CORS) */
export const getContractPdfProxyUrl = (id) =>
  `${import.meta.env.VITE_BACKEND_URL}/users/contracts/${id}/pdf`;
