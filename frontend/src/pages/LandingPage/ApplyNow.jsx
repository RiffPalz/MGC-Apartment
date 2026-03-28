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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
          <div className="relative z-10 bg-[#fff7f1] p-12 max-w-md w-full text-center shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#db6747]" />
            <FaCheckCircle className="text-[#db6747] mx-auto mb-5" size={52} />
            <h2 className="font-OswaldRegular text-3xl uppercase tracking-wide text-gray-900 mb-3">Application Submitted</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-2">
              Thank you, <span className="font-bold text-gray-800">{form.fullName}</span>. Your application has been received.
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-8">
              A confirmation email has been sent to <span className="font-bold">{form.emailAddress}</span>
            </p>
            <a href="/"
              className="inline-block bg-[#db6747] hover:bg-[#3a0f08] text-white py-4 px-10 font-OswaldRegular text-sm tracking-[4px] uppercase transition-all duration-500">
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
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        <div className="relative z-10 w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* LEFT INFO */}
          <div className="text-white space-y-8 lg:sticky lg:top-32">
            <div className="space-y-4">
              <h4 className="font-LemonMilkRegular text-white tracking-[4px] text-xs sm:text-sm uppercase">Tenant Application</h4>
              <h1 className="font-OswaldRegular text-5xl md:text-7xl uppercase leading-tight tracking-tight">
                Apply <span className="text-[#e9cbb7]">Now</span>
              </h1>
              <p className="text-lg text-white/90 max-w-lg leading-relaxed border-l-2 border-[#db6747] pl-6">
                Start your journey with MGC Building. Submit your application together with a valid ID to begin our tenant screening process.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-4 border-l-4 border-[#db6747] transition-transform hover:scale-105">
                <FaBuilding className="text-[#db6747] text-xl" />
                <span className="text-[11px] font-bold tracking-[2px] uppercase">Company ID</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-4 border-l-4 border-[#db6747] transition-transform hover:scale-105">
                <FaIdCard className="text-[#db6747] text-xl" />
                <span className="text-[11px] font-bold tracking-[2px] uppercase">Govt ID</span>
              </div>
            </div>

            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-3 text-[#db6747]">
                <FaMapMarkerAlt className="animate-bounce" />
                <span className="text-sm font-bold tracking-[3px] uppercase">Visit Our Location</span>
              </div>
              <div className="w-full h-[220px] rounded-sm border border-white/20 overflow-hidden shadow-2xl">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3866.568474278144!2d121.1118!3d14.3128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDE4JzQ2LjEiTiAxMjHCsDA2JzQyLjUiRQ!5e0!3m2!1sen!2sph!4v1642435000000!5m2!1sen!2sph"
                  width="100%" height="100%" loading="lazy" style={{ border: 0 }} title="MGC Location"
                />
              </div>
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="bg-[#fff7f1] p-8 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#db6747]" />

            <div className="mb-10 text-center sm:text-left">
              <h2 className="font-OswaldRegular text-3xl text-gray-900 uppercase tracking-wide">Application Form</h2>
              <p className="text-gray-500 text-[10px] uppercase tracking-[2px] mt-1">Please provide accurate information</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="label">Full Name</label>
                <input name="fullName" className="input" placeholder="Juan Dela Cruz" required
                  value={form.fullName} onChange={handleChange} />
              </div>

              <div className="space-y-1">
                <label className="label">Contact No.</label>
                <input name="contactNumber" type="tel" className="input" placeholder="09123456789" required
                  value={form.contactNumber} onChange={handleChange} />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="label">Email Address</label>
                <input name="emailAddress" type="email" className="input" placeholder="example@email.com" required
                  value={form.emailAddress} onChange={handleChange} />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="label">Identity Verification (Valid ID)</label>
                {!idFile ? (
                  <label className="group flex items-center gap-4 px-4 py-3 border-2 border-dashed border-gray-300 bg-white cursor-pointer hover:border-[#db6747] hover:bg-orange-50/30 transition-all duration-300">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                      <FaUpload className="text-gray-400 group-hover:text-[#db6747]" size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Click to upload ID</span>
                      <span className="text-[9px] text-gray-400 uppercase tracking-tighter">JPG, PNG, or PDF (max 5MB)</span>
                    </div>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdUpload} />
                  </label>
                ) : (
                  <div className="flex items-center gap-4 border border-[#db6747] bg-white p-2 shadow-sm">
                    {idPreview ? (
                      <img src={idPreview} alt="ID Preview" className="w-14 h-10 object-cover rounded-sm ring-1 ring-gray-100" />
                    ) : (
                      <div className="w-14 h-10 flex items-center justify-center bg-[#3a0f08] text-white text-[9px] font-bold uppercase">PDF</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-gray-800 truncate">{idFile.name}</p>
                      <button type="button" onClick={() => { setIdFile(null); setIdPreview(null); }}
                        className="text-[9px] font-black text-[#db6747] uppercase tracking-widest hover:text-[#3a0f08] transition-colors">
                        Remove & Change
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="label">Message / Preferred Move-in Date</label>
                <textarea name="message" rows="3"
                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#db6747] focus:ring-1 focus:ring-[#db6747] outline-none resize-none font-NunitoSans text-sm transition-all"
                  placeholder="Tell us about your preferred unit or move-in schedule..."
                  value={form.message} onChange={handleChange} />
              </div>

              {error && (
                <div className="md:col-span-2 bg-red-50 border-l-4 border-red-500 px-4 py-3 text-[11px] text-red-600 font-bold uppercase tracking-widest">
                  {error}
                </div>
              )}

              <div className="md:col-span-2 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-[1px] leading-relaxed">
                  By clicking submit, you agree to our{" "}
                  <button type="button" onClick={() => setIsTermsOpen(true)} className="text-[#db6747] font-bold hover:underline">Terms & Conditions</button>{" "}
                  and{" "}
                  <button type="button" onClick={() => setIsPrivacyOpen(true)} className="text-[#db6747] font-bold hover:underline">Privacy Policy</button>.
                </p>
              </div>

              <div className="md:col-span-2">
                <button type="submit" disabled={loading}
                  className="w-full bg-[#db6747] hover:bg-[#3a0f08] text-white py-5 font-OswaldRegular text-sm tracking-[4px] uppercase transition-all duration-500 shadow-xl shadow-[#db6747]/30 active:scale-95 disabled:opacity-60">
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
        .label { font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #444; display: block; margin-bottom: 6px; }
        .input { width: 100%; padding: 10px 0; background: transparent; border-bottom: 2px solid #e5e7eb; outline: none; font-family: 'Nunito Sans', sans-serif; font-size: 15px; color: #1a1a1a; transition: all 0.3s; }
        .input:focus { border-color: #db6747; }
        .input::placeholder { color: #ccc; font-size: 13px; }
      `}</style>
    </div>
  );
}

export default Applypage;
