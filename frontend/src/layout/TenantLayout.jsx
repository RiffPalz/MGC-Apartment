/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TenantSidebar from "../components/TenantSidebar.jsx";
import TenantHeader from "../components/TenantHeader.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getToken, setAuth } from "../api/authStorage.js";

export default function TenantLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const location = useLocation();
  const socket = useSocket();
  const { updateUser } = useAuth();

  // Sync profile updates via socket
  useEffect(() => {
    if (!socket) return;
    const handler = (updated) => {
      updateUser(updated);
      setAuth(getToken(), updated, updated.role);
    };
    socket.on("profile_updated", handler);
    return () => socket.off("profile_updated", handler);
  }, [socket, updateUser]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [location, isMobile]);

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-NunitoSans overflow-hidden w-full">
      {isMobile && (
        <div
          className={`fixed inset-0 bg-[#330101]/60 z-40 transition-opacity duration-300 backdrop-blur-sm ${
            isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {isMobile && (
        <div
          className={`fixed inset-y-0 left-0 z-50 max-w-[80vw] w-72 h-full shadow-2xl transition-transform duration-300 ease-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <TenantSidebar open={true} setOpen={setIsSidebarOpen} />
        </div>
      )}

      {!isMobile && (
        <div className="h-full shadow-xl z-20 relative shrink-0">
          <TenantSidebar open={isSidebarOpen} setOpen={setIsSidebarOpen} />
        </div>
      )}

      <div className="flex-1 flex flex-col h-full relative overflow-hidden min-w-0 w-full transition-all duration-300">
        <TenantHeader setOpen={setIsSidebarOpen} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
