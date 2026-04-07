/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TenantSidebar from "../components/TenantSidebar.jsx";
import TenantHeader from "../components/TenantHeader.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getToken, setAuth } from "../api/authStorage.js";

export default function TenantLayout() {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const socket = useSocket();
  const { updateUser } = useAuth();
  const isMounted = useRef(false);

  // Sync profile updates
  useEffect(() => {
    if (!socket) return;

    const handler = (updated) => {
      updateUser(updated);
      setAuth(getToken(), updated, updated.role);
    };

    socket.on("profile_updated", handler);
    return () => socket.off("profile_updated", handler);
  }, [socket, updateUser]);

  // Toggle sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setOpen(false);
      } else {
        setOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    if (window.innerWidth < 1024) {
      setOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden font-NunitoSans relative">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-[#330101]/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:shrink-0 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-xl
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} 
        ${open ? "w-72 max-w-[80vw]" : "lg:w-20 w-72 max-w-[80vw]"}`}
      >
        <TenantSidebar open={open} setOpen={setOpen} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        {/* Header */}
        <TenantHeader setOpen={setOpen} />

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth bg-[#f8f9fa]">
          <div className="w-full max-w-[1600px] mx-auto min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
