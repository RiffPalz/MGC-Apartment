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
    <div className="fixed inset-0 z-10000 flex items-center justify-center px-4">
      {/* Backdrop with premium blur */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border-t-4 border-[#db6747]">
        {/* Header Area */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-white z-10 shrink-0">
          <div>
            <h2 className="font-OswaldRegular text-2xl uppercase tracking-[3px] text-gray-900 leading-none">
              Terms & <span className="text-[#db6747]">Conditions</span>
            </h2>
            <p className="font-NunitoSans text-[10px] text-gray-400 uppercase tracking-widest mt-2">
              Last Updated: January 2026
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#fff7f1] text-gray-400 hover:text-[#db6747] transition-all rounded-full active:scale-90"
            aria-label="Close Terms and Conditions"
          >
            <IoMdClose size={28} />
          </button>
        </div>

        {/* Content Area */}
        <div className="px-8 py-8 overflow-y-auto font-NunitoSans text-sm text-gray-600 space-y-8 leading-relaxed scrollbar-thin scrollbar-thumb-gray-200">
          <section className="space-y-3">
            <p className="font-bold text-gray-800 uppercase tracking-wide underline decoration-[#db6747] underline-offset-4">
              Legal Agreement for MGC Building Website
            </p>
            <p>
              Welcome to the MGC Building website. By accessing or using this
              platform, you agree to be bound by these Terms and Conditions.
              These terms govern your use of our digital services and
              information related to our residential complex in Santa Rosa,
              Laguna.
            </p>
          </section>

          {/* Grid Layout for readability */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="section-title">1. About the Website</h3>
              <p className="text-xs">
                An online platform providing premium services and unit
                information for the MGC Building residential complex.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="section-title">2. Eligibility</h3>
              <p className="text-xs">
                Users must be at least 18 years old or possess legal
                parental/guardian consent to utilize this platform.
              </p>
            </div>
          </div>

          <div className="space-y-4 bg-gray-50 p-6 border-l-4 border-gray-200">
            <h3 className="section-title">3. Acceptable Use Policy</h3>
            <ul className="custom-list grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <li>No unlawful or unauthorized use</li>
              <li>No attempts to disrupt security</li>
              <li>No distribution of harmful code</li>
              <li>No disruption of operations</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="section-title">4. Intellectual Property</h3>
            <p>
              All architectural photography, branding, and content are the sole
              property of <strong>MGC Building</strong>. Unauthorized
              reproduction, distribution, or commercial use is strictly
              prohibited.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="section-title">5. Limitation of Liability</h3>
            <p className="bg-[#fff7f1] p-4 border-l-2 border-[#db6747] italic text-xs">
              MGC Building management shall not be held liable for any indirect
              loss or data damages arising from the use or inability to use this
              digital platform.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="section-title">6. Contact & Governing Law</h3>
            <div className="bg-gray-900 text-white p-6 rounded-sm">
              <p className="font-LemonMilkRegular text-[10px] tracking-widest text-[#db6747] mb-2">
                Legal Jurisdiction
              </p>
              <p className="text-gray-300 text-xs mb-4">
                Republic of the Philippines
              </p>
              <p className="font-bold text-sm tracking-wide">
                MGC Building Management
              </p>
              <p className="text-[#db6747] font-bold mt-1 text-xs">
                mgcbuilding762@gmail.com
              </p>
            </div>
          </div>

          <p className="pt-4 text-[10px] text-gray-400 uppercase tracking-[2px] text-center border-t border-gray-50">
            Continued use of this website constitutes full acceptance of these
            terms.
          </p>
        </div>

        {/* Footer Action */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-gray-900 text-white px-10 py-3 font-OswaldRegular uppercase text-xs tracking-[2px] hover:bg-[#db6747] transition-all duration-300 active:scale-95"
          >
            I Agree
          </button>
        </div>

        {/* Internal Styles */}
        <style>{`
          .section-title {
            font-family: "LemonMilkRegular", sans-serif;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 10px;
            color: #db6747;
            display: block;
          }
          .custom-list {
            list-style: none;
            padding-left: 0;
          }
          .custom-list li {
            position: relative;
            padding-left: 1.5rem;
            margin-bottom: 0.5rem;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #666;
          }
          .custom-list li::before {
            content: "→";
            position: absolute;
            left: 0;
            color: #db6747;
            font-weight: bold;
          }
        `}</style>
      </div>
    </div>
  );
}
