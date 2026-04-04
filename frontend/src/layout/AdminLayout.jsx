/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminHeader from "../components/AdminHeader.jsx";

export default function AdminLayout() {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const isMounted = useRef(false);

  // Handle resize
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

  // Close sidebar on route change (mobile only), skip on first mount
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
      {/* MOBILE OVERLAY */}
      {/* Darkens the background when the sidebar is open on mobile */}
      {open && (
        <div 
          className="fixed inset-0 bg-[#330101]/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      {/* FIX: Removed the 2xl scaling here so it perfectly matches your internal AdminSidebar component */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:shrink-0 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-xl
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} 
        ${open ? "w-72 max-w-[80vw]" : "lg:w-20 w-72 max-w-[80vw]"}`}
      >
        <AdminSidebar open={open} setOpen={setOpen} />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        {/* HEADER */}
        <AdminHeader open={open} setOpen={setOpen} />

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth bg-[#f8f9fa]">
          {/* Universal 4K Guardrails applied here */}
          <div className="w-full max-w-[1600px] mx-auto min-h-full">
            {/* This is where your individual admin pages will render */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}