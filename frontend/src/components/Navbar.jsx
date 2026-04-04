import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Link as ScrollLink, animateScroll as scroll } from "react-scroll";
import { FaBars } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import logo from "../assets/images/logo.png";
import { fetchConfig } from "../api/adminAPI/ConfigAPI";

export default function Navbar() {
  const [isOpen, setIsOpen]       = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [mgcName, setMgcName]     = useState("MGC Building");
  const lastScrollY = useRef(0);

  const location    = useLocation();
  const isLandingPage = location.pathname === "/";

  /* fetch mgc name from config */
  useEffect(() => {
    fetchConfig().then((data) => {
      if (data?.config?.mgc_name) setMgcName(data.config.mgc_name);
    }).catch(() => {});
  }, []);

  /* scroll hide / hero color */
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setShowNavbar(!(y > lastScrollY.current && y > 120));
      lastScrollY.current = y;
      const hero = document.getElementById("hero");
      if (hero) setScrolled(y > hero.offsetHeight - 100);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* body scroll lock when menu open */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const close      = () => setIsOpen(false);
  const textColor  = scrolled ? "text-gray-900" : "text-white";
  const NAV_ITEMS  = ["hero", "about", "apply", "contact"];

  /* ── Mobile full-screen menu rendered via portal so it's never clipped ── */
  const mobileMenu = createPortal(
    <div
      className={`fixed inset-0 bg-white flex flex-col transition-all duration-400 ease-in-out md:hidden
        ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      style={{ zIndex: 99999 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img src={logo} alt="MGC Logo" className="h-9" />
          <span className="font-OswaldRegular text-gray-900 text-base tracking-[3px] uppercase">
            {mgcName}
          </span>
        </div>
        <button onClick={close} aria-label="Close menu" className="p-1 text-gray-700 hover:text-[#db6747] transition-colors">
          <IoMdClose size={28} />
        </button>
      </div>

      {/* Nav links */}
      <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6">
        {NAV_ITEMS.map((target) => (
          isLandingPage ? (
            <ScrollLink
              key={target}
              to={target}
              smooth
              duration={500}
              offset={-80}
              onClick={close}
              className="text-2xl uppercase tracking-[4px] font-OswaldRegular text-gray-800 hover:text-[#db6747] transition-colors cursor-pointer"
            >
              {target === "hero" ? "Home" : target}
            </ScrollLink>
          ) : (
            <Link
              key={target}
              to={`/#${target}`}
              onClick={close}
              className="text-2xl uppercase tracking-[4px] font-OswaldRegular text-gray-800 hover:text-[#db6747] transition-colors"
            >
              {target === "hero" ? "Home" : target}
            </Link>
          )
        ))}

        <div className="w-full max-w-xs flex flex-col gap-3 pt-4">
          <Link to="/login" onClick={close}
            className="w-full text-center bg-[#db6747] text-white py-4 uppercase tracking-[3px] font-OswaldRegular text-sm hover:bg-[#3a0f08] transition-colors">
            Log In
          </Link>
          <Link to="/applynow" onClick={close}
            className="w-full text-center border-2 border-[#db6747] text-[#db6747] py-4 uppercase tracking-[3px] font-OswaldRegular text-sm hover:bg-[#db6747] hover:text-white transition-colors">
            Apply Now
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-transform duration-500 ease-in-out
          ${showNavbar ? "translate-y-0" : "-translate-y-full"}
          ${scrolled ? "bg-white/90 backdrop-blur-lg py-3 shadow-md" : "bg-transparent py-5 md:py-8"}`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-12">
          <div className="flex items-center justify-between h-14">

            {/* LOGO */}
            <Link to="/" onClick={() => scroll.scrollToTop()}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {/* mobile logo */}
              <img src={logo} alt="MGC Logo" className="h-8 md:hidden" />
              <span className={`md:hidden font-OswaldRegular text-sm tracking-[3px] uppercase ${textColor}`}>
                {mgcName}
              </span>
              {/* desktop logo */}
              <span className={`hidden md:block font-OswaldRegular tracking-[4px] font-bold text-2xl ${textColor}`}>
                {mgcName}<span className="text-[#db6747]">.</span>
              </span>
            </Link>

            {/* DESKTOP NAV */}
            <div className="hidden md:flex items-center space-x-10">
              {isLandingPage ? (
                NAV_ITEMS.map((target) => (
                  <ScrollLink
                    key={target}
                    to={target}
                    smooth
                    duration={800}
                    offset={-80}
                    spy
                    className={`relative ${textColor} font-NunitoSans font-bold uppercase tracking-[2px] text-sm cursor-pointer
                      after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-2
                      after:w-0 after:h-0.5 after:bg-[#db6747] hover:after:w-full after:transition-all`}
                    activeClass="text-[#db6747] after:w-full"
                  >
                    {target === "hero" ? "Home" : target}
                  </ScrollLink>
                ))
              ) : (
                <Link to="/" className="uppercase tracking-[2px] font-bold text-[#db6747]">
                  Back to Home
                </Link>
              )}
              <Link to="/login"
                className="bg-[#db6747] text-white px-8 py-3 uppercase text-xs tracking-[2px] hover:bg-[#3a0f08] transition shadow-lg">
                Log In
              </Link>
            </div>

            {/* MOBILE HAMBURGER */}
            <button
              onClick={() => setIsOpen(true)}
              className={`md:hidden p-2 ${textColor} hover:text-[#db6747] transition-colors`}
              aria-label="Open menu"
            >
              <FaBars size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu rendered outside nav via portal */}
      {mobileMenu}
    </>
  );
}
