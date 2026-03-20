import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TenantSidebar from "../components/TenantSidebar.jsx";
import UserHeader from "../components/Header.jsx";
import Notification from "../components/Notification.jsx";


export default function TenantLayout() {
  // Initialize state based on screen width
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const location = useLocation();

  // 1. Resize Listener: Auto-switch between "Mobile Drawer" and "Desktop Sidebar"
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Force sidebar open on desktop, closed on mobile by default
      if (!mobile) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. Auto-close Sidebar on Mobile when navigating
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [location, isMobile]);

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-NunitoSans overflow-hidden relative">
      {/* === MOBILE LAYOUT (Floating Drawer) === */}
      {isMobile && (
        <>
          {/* Dark Overlay/Backdrop */}
          <div
            className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 backdrop-blur-sm ${
              isSidebarOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Floating Sidebar Container */}
          <div
            className={`fixed inset-y-0 left-0 z-50 w-72 h-full shadow-2xl transition-transform duration-300 ease-out ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* We force 'open={true}' so the internal sidebar content is always fully visible inside the drawer */}
            <TenantSidebar open={true} setOpen={setIsSidebarOpen} />
          </div>
        </>
      )}

      {/* === DESKTOP LAYOUT (Fixed Sidebar) === */}
      {!isMobile && (
        <div className="h-full shadow-xl z-20 relative">
          <TenantSidebar open={isSidebarOpen} setOpen={setIsSidebarOpen} />
        </div>
      )}

     {/* === MAIN CONTENT AREA === */}
<div className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300">
  
  {/* Role-based Header */}
  <UserHeader onMenuClick={() => setIsSidebarOpen(true)} />

  {/* Dashboard Content */}
  <main className="flex-1 overflow-y-auto scroll-smooth bg-[#f8f9fa]">
    <Outlet />
  </main>
</div>

    </div>
  );
}
