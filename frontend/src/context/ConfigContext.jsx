import { createContext, useContext, useState, useEffect } from "react";
import { fetchConfig } from "../api/adminAPI/ConfigAPI";
import { useSocket } from "./SocketContext";

const ConfigContext = createContext(null);

const DEFAULTS = {
  mgc_name: "MGC",
  address: "762 F. Gomez St., Barangay Ibaba, Santa Rosa, Laguna",
  monthly_rate: 3000,
  monthly_rate_description: "Our units are priced competitively to ensure affordability for working professionals.",
  deposit_terms: "One-month advance payment, One-month security deposit, Minimum 6-month contract, Subleasing is strictly prohibited",
  deposit_terms_description: "",
  gallery_images: [],
};

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULTS);
  const [configLoaded, setConfigLoaded] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    fetchConfig()
      .then((data) => { if (data?.config) setConfig((prev) => ({ ...prev, ...data.config })); })
      .catch(() => {})
      .finally(() => setConfigLoaded(true));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      fetchConfig()
        .then((data) => { if (data?.config) setConfig((prev) => ({ ...prev, ...data.config })); })
        .catch(() => {});
    };
    socket.on("config_updated", handler);
    return () => socket.off("config_updated", handler);
  }, [socket]);

  return (
    <ConfigContext.Provider value={{ config, setConfig, configLoaded }}>
      {children}
    </ConfigContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfig() {
  return useContext(ConfigContext);
}
