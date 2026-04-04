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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Signature Top Accent Bar */}
        <div className="h-1.5 w-full bg-[#db6747] shrink-0" />

        {/* Header */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <h2 className="text-slate-800 font-bold text-sm sm:text-base uppercase tracking-widest">
              Privacy Policy
            </h2>
            <p className="text-slate-400 text-[9px] sm:text-[10px] uppercase tracking-widest mt-1 font-bold">
              Effective Date: January 2026
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 transition-colors p-2 active:scale-90"
            aria-label="Close Privacy Policy"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar font-sans text-sm text-slate-600 space-y-8 leading-relaxed flex-1">

          <section className="space-y-2.5">
            <p className="font-bold text-slate-800 uppercase tracking-widest text-[11px]">
              Privacy Policy for MGC Building
            </p>
            <p className="font-medium text-slate-500">
              At MGC Building, we respect your privacy and are committed to
              protecting your personal information. This Privacy Policy outlines
              how we collect, use, store, and safeguard your data, in accordance
              with the{" "}
              <strong className="text-slate-700">Data Privacy Act of 2012 (Republic Act No. 10173)</strong>.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-3">
              <h3 className="section-title">1. Information We Collect</h3>
              <ul className="custom-list text-slate-500 font-medium">
                <li>Full name & Login credentials</li>
                <li>Email address & Contact number</li>
                <li>Unit number & Property details</li>
                <li>Voluntary Information via forms</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="section-title">2. How We Use Data</h3>
              <ul className="custom-list text-slate-500 font-medium">
                <li>Respond to inquiries & Requests</li>
                <li>Manage tenant & User accounts</li>
                <li>Send announcements & Notices</li>
                <li>Improve Website functionality</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="section-title">3. Data Protection and Security</h3>
            <p className="bg-orange-50 p-4 border-l-4 border-[#db6747] text-slate-600 font-medium rounded-r-xl shadow-sm italic">
              We implement administrative, technical, and physical safeguards to
              protect your personal data from unauthorized access, loss, or
              misuse.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="section-title">4. Your Rights as a Data Subject</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm flex items-center gap-2.5">
                <span className="text-emerald-500 text-sm font-black">✓</span> Right to Access
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm flex items-center gap-2.5">
                <span className="text-emerald-500 text-sm font-black">✓</span> Right to Correction
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm flex items-center gap-2.5">
                <span className="text-emerald-500 text-sm font-black">✓</span> Right to Object
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm flex items-center gap-2.5">
                <span className="text-emerald-500 text-sm font-black">✓</span> Right to Erasure
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="section-title">5. Contact Information</h3>
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl shadow-inner">
              <p className="font-bold text-[10px] tracking-widest text-[#db6747] uppercase mb-1">
                MGC Building Management
              </p>
              <p className="text-slate-500 font-medium text-sm">Santa Rosa, Laguna, Philippines</p>
              <p className="text-slate-800 font-bold mt-1 text-sm">
                mgcbuilding762@gmail.com
              </p>
            </div>
          </div>

          <p className="pt-6 text-[10px] text-slate-400 uppercase tracking-widest text-center border-t border-slate-100 font-bold">
            By using this Website, you acknowledge that you have read and
            understood this Privacy Policy.
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
          }
          .custom-list li::before {
            content: "•";
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