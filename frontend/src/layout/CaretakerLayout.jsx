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
    <div className="flex h-screen bg-gray-50 overflow-hidden font-NunitoSans">
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 lg:static lg:shrink-0 transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${open ? "w-72" : "lg:w-20 w-72"}`}>
        <CaretakerSidebar open={open} setOpen={setOpen} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <CaretakerHeader open={open} setOpen={setOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f8f9fa] p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
