/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import CaretakerSidebar from "../components/CaretakerSidebar.jsx";
import CaretakerHeader from "../components/CaretakerHeader.jsx";

export default function CaretakerLayout() {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) setOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-800">
      
      {/* Mobile Sidebar Overlay with Glass Blur */}
      {open && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity" 
          onClick={() => setOpen(false)} 
        />
      )}
      
      {/* Sidebar Wrapper */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:static lg:shrink-0 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${open ? "w-72" : "lg:w-20 w-72"}`}>
        <CaretakerSidebar open={open} setOpen={setOpen} />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <CaretakerHeader open={open} setOpen={setOpen} />
        
        {/* This central wrapper now dictates the max-width and padding.
          Child pages just need to fill the space! 
        */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
          <div className="max-w-[1600px] w-full h-full mx-auto flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
      
    </div>
  );
}