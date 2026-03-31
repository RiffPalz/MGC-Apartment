import { IoMdClose } from "react-icons/io";
import { useEffect } from "react";

export default function PrivacyPolicy({ isOpen, onClose }) {
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
        {/* Header - Architectural Style */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-white z-10 shrink-0">
          <div>
            <h2 className="font-OswaldRegular text-2xl uppercase tracking-[3px] text-gray-900 leading-none">
              Privacy <span className="text-[#db6747]">Policy</span>
            </h2>
            <p className="font-NunitoSans text-[10px] text-gray-400 uppercase tracking-widest mt-2">
              Effective Date: January 2026
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#fff7f1] text-gray-400 hover:text-[#db6747] transition-all rounded-full active:scale-90"
            aria-label="Close Privacy Policy"
          >
            <IoMdClose size={28} />
          </button>
        </div>

        {/* Content Area - Clean Typography */}
        <div className="px-8 py-8 overflow-y-auto font-NunitoSans text-sm text-gray-600 space-y-8 leading-relaxed scrollbar-thin scrollbar-thumb-gray-200">
          <section className="space-y-3">
            <p className="font-bold text-gray-800 uppercase tracking-wide">
              Privacy Policy for MGC Building Website
            </p>
            <p>
              At MGC Building, we respect your privacy and are committed to
              protecting your personal information. This Privacy Policy outlines
              how we collect, use, store, and safeguard your data, in accordance
              with the{" "}
              <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>
              .
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="section-title">1. Information We Collect</h3>
              <ul className="custom-list">
                <li>Full name & Login credentials</li>
                <li>Email address & Contact number</li>
                <li>Unit number & Property details</li>
                <li>Voluntary Information via forms</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="section-title">2. How We Use Data</h3>
              <ul className="custom-list">
                <li>Respond to inquiries & Requests</li>
                <li>Manage tenant & User accounts</li>
                <li>Send announcements & Notices</li>
                <li>Improve Website functionality</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="section-title">3. Data Protection and Security</h3>
            <p className="bg-[#fff7f1] p-4 border-l-2 border-[#db6747] italic">
              We implement administrative, technical, and physical safeguards to
              protect your personal data from unauthorized access, loss, or
              misuse.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="section-title">4. Your Rights as a Data Subject</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold uppercase tracking-tighter text-gray-500">
              <div className="p-2 border border-gray-100">
                ✓ Right to Access
              </div>
              <div className="p-2 border border-gray-100">
                ✓ Right to Correction
              </div>
              <div className="p-2 border border-gray-100">
                ✓ Right to Object
              </div>
              <div className="p-2 border border-gray-100">
                ✓ Right to Erasure
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="section-title">5. Contact Information</h3>
            <div className="bg-gray-50 p-6 rounded-sm">
              <p className="font-LemonMilkRegular text-[10px] tracking-widest text-[#db6747] mb-2">
                MGC Building Management
              </p>
              <p className="text-gray-700">Santa Rosa, Laguna, Philippines</p>
              <p className="text-[#db6747] font-bold mt-1">
                mgcbuilding762@gmail.com
              </p>
            </div>
          </div>

          <p className="pt-4 text-[10px] text-gray-400 uppercase tracking-[2px] text-center border-t border-gray-50">
            By using this Website, you acknowledge that you have read and
            understood this Privacy Policy.
          </p>
        </div>

        {/* Footer Action */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-gray-900 text-white px-8 py-3 font-OswaldRegular uppercase text-xs tracking-[2px] hover:bg-[#db6747] transition-all duration-300"
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
          }
          .custom-list li::before {
            content: "•";
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
