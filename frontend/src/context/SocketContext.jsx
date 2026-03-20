import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getUser, getRole } from "../api/authStorage";

// Create context to share socket across components
const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const user = getUser();
    const role = getRole();

    // Only connect if a user is logged in
    if (!user) return;

    // Strip trailing /api path — Socket.IO must connect to the root server URL
    const rawUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const backendUrl = rawUrl.replace(/\/api\/?$/, "");

    const newSocket = io(backendUrl, {
      transports: ["polling", "websocket"], // Start with polling, upgrade to WS
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
      autoConnect: true,
    });

    // Join user-specific rooms after connecting
    newSocket.on("connect", () => {
      console.log(`🔌 Socket Connected: ${newSocket.id}`);
      newSocket.emit("join_role", role);
      newSocket.emit("join_user", user.id || user.ID);
    });

    // Handle connection errors quietly
    newSocket.on("connect_error", () => {
      console.warn("⚠️ Socket connection delayed. Retrying...");
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []); // Run only once

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};