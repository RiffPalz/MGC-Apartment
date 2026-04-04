import { useState } from "react";
import applynowbg from "../../assets/images/applynowbg.png";
import Navbar from "../../components/Navbar.jsx";
import { FaBuilding, FaIdCard, FaMapMarkerAlt, FaUpload, FaCheckCircle } from "react-icons/fa";
import axios from "axios";

import TermsAndConditions from "./TermsAndConditions.jsx";
import PrivacyPolicy from "./PrivacyPolicy.jsx";

function Applypage() {
  const [form, setForm] = useState({
    fullName: "", emailAddress: "", contactNumber: "", message: "",
  });
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const handleIdUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIdFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setIdPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setIdPreview(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "fullName") {
      setForm(f => ({ ...f, fullName: value.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) }));
    } else if (name === "contactNumber") {
      if (/^\d*$/.test(value) && value.length <= 11) setForm(f => ({ ...f, contactNumber: value }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!idFile) { setError("Please upload a valid ID."); return; }
    if (!form.fullName.trim()) { setError("Full name is required."); return; }
    if (!form.emailAddress.trim()) { setError("Email address is required."); return; }
    if (!form.contactNumber.trim() || form.contactNumber.trim().length < 7) {
      setError("Please enter a valid contact number (at least 7 digits)."); return;
    }

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("fullName", form.fullName.trim());
      fd.append("emailAddress", form.emailAddress.trim());
      fd.append("contactNumber", form.contactNumber.trim());
      fd.append("message", form.message.trim());
      fd.append("validID", idFile);

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/applications`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white font-NunitoSans overflow-y-auto">
        <Navbar />
        <div className="relative min-h-screen bg-cover bg-center flex items-center justify-center px-4"
          style={{ backgroundImage: `url(${applynowbg})` }}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative z-10 bg-white p-8 sm:p-12 max-w-md w-full text-center shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#db6747]" />
            <FaCheckCircle className="text-emerald-500 mx-auto mb-5 drop-shadow-sm" size={56} />
            <h2 className="font-OswaldRegular text-3xl uppercase tracking-wide text-slate-900 mb-3">Application Submitted</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-3 font-medium">
              Thank you, <span className="font-bold text-slate-800">{form.fullName}</span>. Your application has been received and is under review.
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Updates will be sent to: <br />
                <span className="font-black text-slate-700 text-xs mt-1 block">{form.emailAddress}</span>
              </p>
            </div>
            <a href="/"
              className="block w-full bg-slate-800 hover:bg-slate-900 text-white py-4 px-10 font-bold text-xs tracking-widest uppercase transition-all duration-300 rounded-xl shadow-md active:scale-95">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-NunitoSans overflow-y-auto">
      <Navbar />

      <div className="relative min-h-screen bg-cover bg-center flex items-center pt-28 pb-16 px-4 sm:px-10 lg:px-20"
        style={{ backgroundImage: `url(${applynowbg})` }}>
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]" />

        <div className="relative z-10 w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* LEFT INFO */}
          <div className="text-white space-y-8 lg:sticky lg:top-32">
            <div className="space-y-4">
              <h4 className="font-bold tracking-[4px] text-[10px] sm:text-xs uppercase text-slate-300">Tenant Application</h4>
              <h1 className="font-OswaldRegular text-5xl md:text-7xl uppercase leading-tight tracking-tight">
                Apply <span className="text-[#db6747]">Now</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed border-l-4 border-[#db6747] pl-5 font-medium">
                Start your journey with MGC Building. Submit your application together with a valid ID to begin our tenant screening process.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 shadow-lg">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <FaBuilding className="text-[#db6747] text-lg" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold tracking-[2px] uppercase">Company ID</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 shadow-lg">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <FaIdCard className="text-[#db6747] text-lg" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold tracking-[2px] uppercase">Govt ID</span>
              </div>
            </div>

            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-3 text-[#db6747]">
                <FaMapMarkerAlt className="animate-bounce" size={18} />
                <span className="text-[11px] font-bold tracking-[3px] uppercase text-white">Visit Our Location</span>
              </div>
              <div className="w-full h-[220px] rounded-2xl border border-white/20 overflow-hidden shadow-2xl bg-slate-800">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3866.568474278144!2d121.1118!3d14.3128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDE4JzQ2LjEiTiAxMjHCsDA2JzQyLjUiRQ!5e0!3m2!1sen!2sph!4v1642435000000!5m2!1sen!2sph"
                  width="100%" height="100%" loading="lazy" style={{ border: 0 }} title="MGC Location"
                />
              </div>
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="bg-[#fff7f1] p-8 sm:p-10 shadow-2xl relative rounded-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#db6747]" />

            <div className="mb-10 text-center sm:text-left">
              <h2 className="font-OswaldRegular text-3xl text-slate-900 uppercase tracking-wide">Application Form</h2>
              <p className="text-slate-400 text-[10px] uppercase tracking-[2px] mt-1 font-bold">Please provide accurate information</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              <div className="space-y-2">
                <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 uppercase">Full Name</label>
                <input name="fullName" placeholder="Juan Dela Cruz" required
                  value={form.fullName} onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-slate-200 focus:border-[#db6747] py-2.5 text-sm text-slate-800 font-semibold outline-none transition-colors placeholder:text-slate-300 placeholder:font-medium" />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 uppercase">Contact No.</label>
                <input name="contactNumber" type="tel" placeholder="09123456789" required
                  value={form.contactNumber} onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-slate-200 focus:border-[#db6747] py-2.5 text-sm text-slate-800 font-semibold outline-none transition-colors placeholder:text-slate-300 placeholder:font-medium" />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 uppercase">Email Address</label>
                <input name="emailAddress" type="email" placeholder="example@email.com" required
                  value={form.emailAddress} onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-slate-200 focus:border-[#db6747] py-2.5 text-sm text-slate-800 font-semibold outline-none transition-colors placeholder:text-slate-300 placeholder:font-medium" />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 uppercase">Identity Verification (Valid ID)</label>
                {!idFile ? (
                  <label className="group flex items-center gap-4 px-5 py-4 border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl cursor-pointer hover:border-[#db6747] hover:bg-orange-50/50 transition-all duration-300 shadow-sm">
                    <div className="shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:border-[#db6747]/30 transition-colors">
                      <FaUpload className="text-slate-400 group-hover:text-[#db6747] transition-colors" size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Click to upload ID</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">JPG, PNG, or PDF (max 5MB)</span>
                    </div>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdUpload} />
                  </label>
                ) : (
                  <div className="flex items-center gap-4 border-2 border-[#db6747] bg-white p-3 rounded-xl shadow-sm">
                    {idPreview ? (
                      <img src={idPreview} alt="ID Preview" className="w-16 h-12 object-cover rounded-lg border border-slate-200 shadow-sm" />
                    ) : (
                      <div className="w-16 h-12 flex items-center justify-center bg-slate-800 rounded-lg text-white text-[10px] font-black uppercase tracking-widest shadow-sm">PDF</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{idFile.name}</p>
                      <button type="button" onClick={() => { setIdFile(null); setIdPreview(null); }}
                        className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors mt-1">
                        Remove File
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 uppercase">Message / Preferred Move-in Date</label>
                <textarea name="message" rows="3"
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-[#db6747] rounded-xl outline-none resize-none text-sm text-slate-800 font-semibold transition-all placeholder:text-slate-300 placeholder:font-medium"
                  placeholder="Tell us about your preferred unit or move-in schedule..."
                  value={form.message} onChange={handleChange} />
              </div>

              {error && (
                <div className="md:col-span-2 bg-red-50 border-l-4 border-red-500 px-4 py-3 text-[11px] text-red-600 font-bold uppercase tracking-widest rounded-r-xl shadow-sm animate-shake">
                  {error}
                </div>
              )}

              <div className="md:col-span-2 text-center pt-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-[1px] leading-relaxed font-bold">
                  By clicking submit, you agree to our{" "}
                  <button type="button" onClick={(e) => { e.preventDefault(); setIsTermsOpen(true); }} className="text-[#db6747] font-black hover:underline">Terms & Conditions</button>{" "}
                  and{" "}
                  <button type="button" onClick={(e) => { e.preventDefault(); setIsPrivacyOpen(true); }} className="text-[#db6747] font-black hover:underline">Privacy Policy</button>.
                </p>
              </div>

              <div className="md:col-span-2">
                <button type="submit" disabled={loading}
                  className="w-full bg-[#db6747] hover:bg-[#c45a3a] text-white py-5 rounded-xl font-bold text-xs tracking-[3px] uppercase transition-all duration-300 shadow-lg shadow-orange-500/30 active:scale-95 disabled:opacity-60">
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <PrivacyPolicy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsAndConditions isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

      <style>{`
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
}

export default Applypage;