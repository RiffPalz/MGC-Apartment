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

export const getContractPdfProxyUrl = (id) =>
  `${import.meta.env.VITE_BACKEND_URL}/users/contracts/${id}/pdf`;

/** Submit a termination request */
export const submitTerminationRequest = async (data) => {
  const res = await api.post("/users/contracts/termination-request", data);
  return res.data;
};

/** Get own termination request status */
export const getMyTerminationRequest = async () => {
  const res = await api.get("/users/contracts/termination-request/mine");
  return res.data;
};
