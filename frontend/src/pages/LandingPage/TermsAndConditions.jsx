import { IoMdClose } from "react-icons/io";
import { useEffect } from "react";

export default function TermsAndConditions({ isOpen, onClose }) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Signature Top Accent Bar */}
        <div className="h-1.5 w-full bg-[#db6747] shrink-0" />

        {/* Header Area */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <h2 className="text-slate-800 font-bold text-sm sm:text-base uppercase tracking-widest">
              Terms & Conditions
            </h2>
            <p className="text-slate-400 text-[9px] sm:text-[10px] uppercase tracking-widest mt-1 font-bold">
              Last Updated: January 2026
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 transition-colors p-2 active:scale-90"
            aria-label="Close Terms and Conditions"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar font-sans text-sm text-slate-600 space-y-8 leading-relaxed flex-1">

          <section className="space-y-2.5">
            <p className="font-bold text-slate-800 uppercase tracking-widest text-[11px] underline decoration-[#db6747]/50 underline-offset-4">
              Legal Agreement for MGC Building Website
            </p>
            <p className="font-medium text-slate-500">
              Welcome to the MGC Building website. By accessing or using this
              platform, you agree to be bound by these Terms and Conditions.
              These terms govern your use of our digital services and
              information related to our residential complex in Santa Rosa,
              Laguna.
            </p>
          </section>

          {/* Grid Layout for readability */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-3">
              <h3 className="section-title">1. About the Website</h3>
              <p className="text-xs font-medium text-slate-500">
                An online platform providing premium services and unit
                information for the MGC Building residential complex.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="section-title">2. Eligibility</h3>
              <p className="text-xs font-medium text-slate-500">
                Users must be at least 18 years old or possess legal
                parental/guardian consent to utilize this platform.
              </p>
            </div>
          </div>

          <div className="space-y-3 bg-slate-50 p-5 sm:p-6 border-l-4 border-slate-200 rounded-r-xl shadow-inner">
            <h3 className="section-title">3. Acceptable Use Policy</h3>
            <ul className="custom-list grid grid-cols-1 sm:grid-cols-2 gap-x-4 font-medium text-slate-500">
              <li>No unlawful or unauthorized use</li>
              <li>No attempts to disrupt security</li>
              <li>No distribution of harmful code</li>
              <li>No disruption of operations</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="section-title">4. Intellectual Property</h3>
            <p className="font-medium text-slate-500">
              All architectural photography, branding, and content are the sole
              property of <strong className="text-slate-700">MGC Building</strong>. Unauthorized
              reproduction, distribution, or commercial use is strictly
              prohibited.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="section-title">5. Limitation of Liability</h3>
            <p className="bg-orange-50 p-4 border-l-4 border-[#db6747] text-slate-600 font-medium rounded-r-xl shadow-sm italic text-xs">
              MGC Building management shall not be held liable for any indirect
              loss or data damages arising from the use or inability to use this
              digital platform.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="section-title">6. Contact & Governing Law</h3>
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl shadow-inner">
              <p className="font-bold text-[10px] tracking-widest text-[#db6747] uppercase mb-1">
                Legal Jurisdiction
              </p>
              <p className="text-slate-500 font-medium text-sm mb-4">
                Republic of the Philippines
              </p>
              <p className="text-slate-800 font-bold mt-1 text-sm tracking-wide">
                MGC Building Management
              </p>
              <p className="text-[#db6747] font-bold mt-1 text-xs">
                mgcbuilding762@gmail.com
              </p>
            </div>
          </div>

          <p className="pt-6 text-[10px] text-slate-400 uppercase tracking-widest text-center border-t border-slate-100 font-bold">
            Continued use of this website constitutes full acceptance of these
            terms.
          </p>
        </div>

        {/* Footer Action */}
        <div className="px-6 sm:px-8 py-4 sm:py-5 border-t border-slate-100 bg-slate-50/80 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-[#db6747] hover:bg-[#c45a3a] text-white px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all duration-300 shadow-md active:scale-95"
          >
            I Agree
          </button>
        </div>

        {/* Internal Styles */}
        <style>{`
          .section-title {
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-size: 11px;
            color: #db6747;
            display: block;
          }
          .custom-list {
            list-style: none;
            padding-left: 0;
          }
          .custom-list li {
            position: relative;
            padding-left: 1.25rem;
            margin-bottom: 0.5rem;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .custom-list li::before {
            content: "→";
            position: absolute;
            left: 0;
            color: #db6747;
            font-weight: 900;
          }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>
      </div>
    </div>
  );
}