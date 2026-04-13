/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getUser, getRole } from "../api/authStorage";

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const user = getUser();
    const role = getRole();

    if (!user) return;

    // Strip trailing /api — Socket.IO must connect to the root server URL
    const rawUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const backendUrl = rawUrl.replace(/\/api\/?$/, "");

    const newSocket = io(backendUrl, {
      transports: ["polling", "websocket"],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      newSocket.emit("join_role", role);
      newSocket.emit("join_user", user.id || user.ID);
    });

    newSocket.on("connect_error", () => {
      console.warn("Socket connection delayed. Retrying...");
    });

    setSocket(newSocket);

    return () => { if (newSocket) newSocket.disconnect(); };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
