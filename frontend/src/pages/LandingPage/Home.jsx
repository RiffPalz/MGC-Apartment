import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import toast from "../../utils/toast";

import AOS from "aos";
import "aos/dist/aos.css";

import Landingpagebg from "../../assets/images/front-pic.png";
import img1 from "../../assets/images/LP-img1.jpg";
import img2 from "../../assets/images/LP-img2.png";
import img3 from "../../assets/images/LP-img3.png";
import img4 from "../../assets/images/LP-img4.jpg";
import img5 from "../../assets/images/LP-img5.jpg";
import applynowbg from "../../assets/images/applynowbg.png";

import GalleryLayout from "../../components/GalleryLayout.jsx";
import Navbar from "../../components/Navbar.jsx";
import TermsAndConditions from "./TermsAndConditions.jsx";
import PrivacyPolicy from "./PrivacyPolicy.jsx";
import { fetchConfig } from "../../api/adminAPI/ConfigAPI.js";

const HARDCODED_DEFAULTS = {
  mgc_name: "MGC",
  address: "762 F. Gomez St., Barangay Ibaba, Santa Rosa, Laguna",
  monthly_rate: 3000,
  monthly_rate_description: "Our units are priced competitively to ensure affordability for working professionals.",
  deposit_terms: "One-month advance payment, One-month security deposit, Minimum 6-month contract, Subleasing is strictly prohibited",
  deposit_terms_description: "",
  gallery_images: [
    { url: img1, caption: "Front View", slot: "left1" },
    { url: img2, caption: "Main Gate", slot: "rightTop" },
    { url: img3, caption: "Parking Space", slot: "left2" },
    { url: img4, caption: "Inside the Building", slot: "rightLarge" },
    { url: img5, caption: "Main Road", slot: "left3" },
  ],
};

function Home() {
  const formRef = useRef();
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [config, setConfig] = useState(HARDCODED_DEFAULTS);

  const [isFetchingConfig, setIsFetchingConfig] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    emailjs
      .sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        formRef.current,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      )
      .then(
        () => { toast.success("Message sent successfully!"); e.target.reset(); },
        () => { toast.error("Something went wrong. Please try again."); },
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    AOS.init({
      duration: 1200,
      once: true,
      mirror: false,
      disable: false,
    });
    AOS.refresh();

    fetchConfig().then((data) => {
      if (data?.config) {
        const cfg = data.config;

        setConfig({
          ...HARDCODED_DEFAULTS,
          ...cfg,
          gallery_images: HARDCODED_DEFAULTS.gallery_images.map((def, i) => {
            const remote = (cfg.gallery_images || [])[i];

            const isValidWebUrl = remote && remote.url && remote.url.startsWith("http");

            return isValidWebUrl
              ? { ...def, ...remote, src: remote.url }
              : { ...def, src: def.url }; // Fallback to your local images
          }),
        });
      }
    }).catch(() => { })
      // Tell the state we are done loading, regardless of success or failure
      .finally(() => {
        setIsFetchingConfig(false);
      });

    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // If we are fetching data, show the Tailwind Skeleton Loader instead of the page
  if (isFetchingConfig) {
    return null;
  }

  // Everything below here is completely untouched!
  return (
    <div className="overflow-x-hidden bg-white">
      <Navbar />

      {/* ── HERO ── */}
      <section
        id="hero"
        className="relative w-full min-h-screen bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${Landingpagebg})` }}
      >
        <div className="absolute inset-0 bg-slate-900/50" />
        <div data-aos="zoom-out" className="relative z-10 text-center px-4 sm:px-8">
          <h1
            className="text-white font-OswaldRegular uppercase tracking-[3px] sm:tracking-[6px] mb-4 leading-tight drop-shadow-lg"
            style={{ fontSize: "clamp(32px, 7vw, 90px)" }}
          >
            Modern Living <br />
            <span className="text-[#e9cbb7]">Made Simple</span>
          </h1>
          <p className="mt-4 text-slate-200 font-NunitoSans tracking-[1px] sm:tracking-[2px] max-w-xl mx-auto uppercase text-xs sm:text-sm md:text-base px-2 font-bold drop-shadow-md">
            {config.address}
          </p>
          <Link
            to="/applynow"
            className="mt-8 inline-block bg-[#db6747] hover:bg-white hover:text-[#db6747] text-white font-bold uppercase tracking-[2px] px-10 py-4 text-sm sm:text-base transition-all duration-300 rounded-xl shadow-lg shadow-[#db6747]/30 active:scale-95"
          >
            Apply Now
          </Link>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section id="home" className="py-16 sm:py-24 px-4 sm:px-8 md:px-12 lg:px-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div data-aos="fade-up" className="mb-10 sm:mb-16 text-center flex flex-col items-center">
            <h4 className="text-[#db6747] font-bold tracking-widest uppercase text-xs sm:text-sm mb-2">Our Property</h4>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-OswaldRegular uppercase text-slate-900">Overall Building</h2>
            <div className="w-16 sm:w-24 h-1.5 bg-[#db6747] mt-4 mb-6 sm:mb-8 mx-auto rounded-full" />
            <p className="text-slate-500 text-base sm:text-lg md:text-xl max-w-3xl font-NunitoSans leading-relaxed mx-auto font-medium">
              Experience convenience in a well-maintained complex designed for the modern professional.
              Located strategically for easy access to Santa Rosa's commercial hubs.
            </p>
          </div>
          <div data-aos="fade-up">
            <GalleryLayout items={config.gallery_images.map((img, i) => ({ id: i + 1, src: img.url, caption: img.caption, slot: img.slot }))} />
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-16 sm:py-24 px-4 sm:px-8 md:px-12 lg:px-24 bg-[#fff7f1] border-y border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
          {/* Image — visible on all screens */}
          <div className="w-full md:w-1/2" data-aos="fade-right">
            <div className="relative p-3 sm:p-4 border-2 border-[#db6747] rounded-xl bg-white shadow-xl">
              <img src={img1} alt="MGC Building" className="w-full h-56 sm:h-80 md:h-[500px] object-cover rounded-lg" />
              <div className="absolute -bottom-6 -left-6 bg-[#db6747] text-white p-5 sm:p-8 hidden sm:block rounded-2xl shadow-xl">
                <p className="font-OswaldRegular text-3xl sm:text-4xl drop-shadow-sm">10+</p>
                <p className="text-xs uppercase tracking-widest font-bold mt-1">Years of Service</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 space-y-5 sm:space-y-8" data-aos="fade-left">
            <h4 className="text-[#db6747] font-bold tracking-widest uppercase text-xs sm:text-sm">Established 2015</h4>
            <h2 className="text-3xl sm:text-5xl font-OswaldRegular uppercase text-slate-900 leading-tight">About MGC Building</h2>
            <p className="text-base sm:text-lg text-slate-600 font-NunitoSans leading-relaxed font-medium">
              MGC Building is a well-maintained 35-unit residential complex. We provide modern, no-fuss apartment
              living designed for individuals and couples who value comfort, security, and affordability.
            </p>
            <p className="text-base sm:text-lg text-slate-600 font-NunitoSans leading-relaxed italic border-l-4 border-[#db6747] pl-4 sm:pl-6 bg-orange-50/50 py-3 rounded-r-xl">
              "We focus on simple living without compromising quality, giving our residents a place they can truly call home."
            </p>
          </div>
        </div>
      </section>

      {/* ── RENT CONDITIONS ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 md:px-12 lg:px-24 bg-white">
        <div className="max-w-7xl mx-auto" data-aos="fade-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16 lg:gap-24">
            <div className="space-y-5 sm:space-y-6">
              <h4 className="text-[#db6747] font-bold uppercase text-xs tracking-[2px]">Monthly Rate</h4>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-OswaldRegular uppercase text-slate-900">₱{parseInt(config.monthly_rate)} Rent Rate</h3>
              <div className="w-16 h-1.5 bg-[#db6747] rounded-full" />
              <p className="text-slate-500 font-NunitoSans text-base sm:text-lg leading-relaxed font-medium">
                {config.monthly_rate_description}
              </p>
              <div className="inline-block bg-[#db6747] text-white font-bold text-[10px] uppercase tracking-[2px] px-5 py-2.5 rounded-lg shadow-sm">
                No Pets Allowed
              </div>
            </div>
            <div className="space-y-5 sm:space-y-6">
              <h4 className="text-[#db6747] font-bold uppercase text-xs tracking-[2px]">Deposit Terms</h4>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-OswaldRegular uppercase text-slate-900">Security & Terms</h3>
              <div className="w-16 h-1.5 bg-[#db6747] rounded-full" />
              <ul className="space-y-3 sm:space-y-4 text-slate-600 font-NunitoSans text-base sm:text-lg font-medium">
                {config.deposit_terms.split(",").map(t => t.trim()).map(t => (
                  <li key={t} className="flex items-start gap-3 tracking-wide">
                    <span className="text-[#db6747] mt-1 shrink-0 font-black">•</span> {t}
                  </li>
                ))}
              </ul>
              <div className="inline-block bg-slate-900 text-white font-bold text-[10px] uppercase tracking-[2px] px-5 py-2.5 rounded-lg shadow-sm">
                Strict Policy
              </div>
              {config.deposit_terms_description ? (
                <p className="text-slate-500 font-NunitoSans text-base sm:text-lg leading-relaxed font-medium">
                  {config.deposit_terms_description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ── APPLY CTA ── */}
      <section
        id="apply"
        className="relative w-full overflow-hidden flex justify-center items-center text-center py-20 sm:py-32"
        style={{
          backgroundImage: `url(${applynowbg})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundAttachment: isDesktop ? "fixed" : "scroll",
        }}
      >
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <div className="relative z-10 max-w-4xl px-4 sm:px-6 flex flex-col items-center">
          <div data-aos="fade-up">
            <h4 className="font-NunitoSans font-bold tracking-[3px] sm:tracking-[6px] text-[#e9cbb7] text-xs sm:text-base uppercase mb-3 drop-shadow-md">
              Your New Home Awaits
            </h4>
            <h2 className="font-OswaldRegular text-white text-3xl sm:text-5xl md:text-6xl uppercase leading-tight mb-4 sm:mb-6 drop-shadow-lg">
              Ready to Join Our <br />
              <span className="text-white underline decoration-[#db6747] underline-offset-8">Community?</span>
            </h2>
            <p className="text-slate-200 font-NunitoSans text-base sm:text-lg md:text-xl mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed font-semibold drop-shadow-sm">
              Secure your spot at MGC Building. Experience comfortable, modern living in the heart of Santa Rosa.
            </p>
          </div>
          <Link
            to="/applynow"
            data-aos="zoom-in"
            className="group inline-flex items-center justify-center gap-3
              px-8 py-4 text-base sm:px-12 sm:py-5 sm:text-xl
              font-bold uppercase bg-white text-[#db6747]
              hover:bg-[#db6747] hover:text-white transition-all duration-500
              rounded-2xl shadow-2xl tracking-[2px] active:scale-95"
          >
            Start Your Application
            <svg className="w-6 h-6 transition-transform duration-500 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-16 sm:py-24 md:py-32 px-4 sm:px-8 md:px-12 lg:px-24 bg-[#fff7f1] border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-start">
          {/* Left */}
          <div className="space-y-8 sm:space-y-10" data-aos="fade-right">
            <div>
              <h4 className="text-[#db6747] font-bold tracking-[4px] uppercase text-xs mb-2">Get In Touch</h4>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-OswaldRegular uppercase text-slate-900 leading-tight">
                Let's Start <br /><span className="text-[#db6747]">A Conversation</span>
              </h2>
              <div className="w-16 sm:w-24 h-1.5 bg-[#db6747] mt-4 sm:mt-6 rounded-full" />
            </div>
            <div className="space-y-6 sm:space-y-8 max-w-md">
              <p className="text-slate-500 font-NunitoSans text-base sm:text-lg leading-relaxed font-medium">
                Have questions about our units, amenities, or the application process?
                Our team is here to help you find your perfect home.
              </p>
              <div className="flex flex-col gap-4 sm:gap-6 pt-2">
                {["Fast Inquiry Response", "Unit Viewing Coordination"].map(t => (
                  <div key={t} className="flex items-center gap-4 bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm w-max">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 font-black text-sm">✓</div>
                    <p className="font-NunitoSans font-bold text-slate-700 uppercase text-[10px] sm:text-xs tracking-widest">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="bg-white p-6 sm:p-8 md:p-10 shadow-2xl shadow-slate-200/50 rounded-3xl border border-slate-100" data-aos="fade-left">
            <form ref={formRef} onSubmit={handleContactSubmit} className="space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-1 sm:space-y-2">
                  <label className="block font-NunitoSans font-bold text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-widest">Full Name</label>
                  <input required name="fullName" type="text" placeholder="Full Name"
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:bg-white focus:border-[#db6747] font-NunitoSans font-semibold text-slate-800 transition-all text-sm placeholder:font-medium placeholder:text-slate-300" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label className="block font-NunitoSans font-bold text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-widest">Email Address</label>
                  <input required name="email" type="email" placeholder="Email Address"
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:bg-white focus:border-[#db6747] font-NunitoSans font-semibold text-slate-800 transition-all text-sm placeholder:font-medium placeholder:text-slate-300" />
                </div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <label className="block font-NunitoSans font-bold text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-widest">Subject</label>
                <input required name="subject" type="text" placeholder="What is this regarding?"
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:bg-white focus:border-[#db6747] font-NunitoSans font-semibold text-slate-800 transition-all text-sm placeholder:font-medium placeholder:text-slate-300" />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <label className="block font-NunitoSans font-bold text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-widest">Message</label>
                <textarea required name="message" rows="4" placeholder="Write your message here..."
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:bg-white focus:border-[#db6747] font-NunitoSans font-semibold text-slate-800 resize-none transition-all text-sm placeholder:font-medium placeholder:text-slate-300" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={loading}
                  className={`w-full bg-[#db6747] text-white font-bold py-5 uppercase tracking-[2px] rounded-xl transition-all duration-300 shadow-lg shadow-[#db6747]/30 flex items-center justify-center gap-2 group text-xs sm:text-sm active:scale-95 ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#c45a3a]"}`}>
                  {loading ? "Sending..." : "Send Message"}
                  {!loading && <span className="group-hover:translate-x-1 transition-transform">→</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-white pt-14 sm:pt-20 pb-8 sm:pb-10 px-4 sm:px-8 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 lg:gap-8 mb-10 sm:mb-16">
            {/* Location */}
            <div className="col-span-2 sm:col-span-1 space-y-4 sm:space-y-6">
              <h4 className="font-NunitoSans font-bold text-[#db6747] uppercase tracking-widest text-xs">Location</h4>
              <a href="https://maps.app.goo.gl/K19mgqv5qpGkxbXB9" target="_blank" rel="noopener noreferrer"
                className="text-slate-400 font-NunitoSans text-sm leading-relaxed block hover:text-white transition-colors font-medium">
                762 F. Gomez St., Barangay Ibaba,<br />Santa Rosa, Laguna, Philippines
              </a>
            </div>
            {/* Caretakers */}
            <div className="space-y-4 sm:space-y-6">
              <h4 className="font-NunitoSans font-bold text-[#db6747] uppercase tracking-widest text-xs">Caretakers</h4>
              <ul className="space-y-3 text-slate-400 font-NunitoSans text-sm font-medium">
                {["Julie Pastrana Canete", "Kenneth Selencio"].map(name => (
                  <li key={name} className="flex items-center gap-3">
                    <div className="bg-white/10 p-1.5 sm:p-2 rounded-full shrink-0">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[#db6747]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
            {/* Email */}
            <div className="space-y-4 sm:space-y-6">
              <h4 className="font-NunitoSans font-bold text-[#db6747] uppercase tracking-widest text-xs">Email Address</h4>
              <a href="mailto:mgcbuilding762@gmail.com"
                className="text-slate-400 hover:text-white text-sm transition-colors font-NunitoSans break-all block font-medium">
                mgcbuilding762@gmail.com
              </a>
            </div>
            {/* Hotlines */}
            <div className="col-span-2 sm:col-span-1 space-y-4 sm:space-y-6">
              <h4 className="font-NunitoSans font-bold text-[#db6747] uppercase tracking-widest text-xs">Inquiry Hotlines</h4>
              <div className="flex flex-col space-y-2 sm:space-y-3">
                {["0921 309 2286", "0991 426 2113", "0967 663 5250"].map(num => (
                  <a key={num} href={`tel:${num.replace(/\s/g, "")}`}
                    className="text-slate-400 hover:text-white transition-colors font-NunitoSans text-sm flex items-center group font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#db6747] mr-3 group-hover:scale-125 transition-transform shrink-0" />
                    {num}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <p className="text-slate-500 font-NunitoSans text-[10px] uppercase tracking-[2px] text-center sm:text-left font-bold">
              © {new Date().getFullYear()} MGC BUILDING. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center gap-4 sm:gap-6 text-slate-500 font-bold uppercase tracking-[2px] text-[10px]">
              <button type="button" onClick={() => setShowPrivacy(true)} className="hover:text-white transition-colors">Privacy Policy</button>
              <button type="button" onClick={() => setShowTerms(true)} className="hover:text-white transition-colors">Terms & Conditions</button>
            </div>
          </div>
        </div>
      </footer>

      <TermsAndConditions isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyPolicy isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
}

export default Home;