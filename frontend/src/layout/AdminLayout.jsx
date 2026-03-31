import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminHeader from "../components/AdminHeader.jsx";

export default function AdminLayout() {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  // 1. Mobile Responsiveness: Automatically close sidebar on mobile or route change
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setOpen(false);
      } else {
        setOpen(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when navigating to a new page on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setOpen(false);
    }
  }, [location]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-NunitoSans">
      {/* MOBILE OVERLAY */}
      {/* This darkens the background when the sidebar is open on mobile */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:shrink-0 transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} 
        ${open ? "w-72" : "lg:w-20 w-72"}`}
      >
        <AdminSidebar open={open} setOpen={setOpen} />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER */}
        <AdminHeader open={open} setOpen={setOpen} />

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f8f9fa] p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* This is where your individual admin pages will render */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}