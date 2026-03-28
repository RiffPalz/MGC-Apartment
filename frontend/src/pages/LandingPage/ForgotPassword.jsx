import { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { MdEmail } from "react-icons/md";
import { FaCheckCircle, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";

const BASE = import.meta.env.VITE_BACKEND_URL;

// Step 1 → request code  |  Step 2 → enter code + new password  |  Step 3 → success
export default function ForgotPassword({ isOpen, onClose }) {
  const [step, setStep]           = useState(1);
  const [email, setEmail]         = useState("");
  const [code, setCode]           = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setStep(1); setEmail(""); setCode("");
        setNewPassword(""); setConfirmPassword("");
        setError(""); setLoading(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) { setError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError("Please enter a valid email address."); return; }
    try {
      setLoading(true);
      await axios.post(`${BASE}/users/forgot-password`, { emailAddress: trimmed });
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) { setError("Please enter the reset code."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    try {
      setLoading(true);
      await axios.post(`${BASE}/users/reset-password`, {
        emailAddress: email.trim(),
        resetCode:    code.trim(),
        newPassword,
      });
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-[#fff7f1] w-full max-w-md shadow-2xl overflow-hidden border-t-4 border-[#db6747]">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#db6747] transition-colors z-10">
          <IoMdClose size={24} />
        </button>

        <div className="p-8 sm:p-10">

          {/* ── STEP 1: Enter email ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="font-OswaldRegular text-3xl text-gray-900 uppercase">Reset Password</h2>
                <p className="font-NunitoSans text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
                  Enter your registered email to receive a reset code.
                </p>
              </div>

              <form onSubmit={handleRequestCode} className="space-y-6 text-left">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 tracking-[2px] uppercase block">
                    Email Address
                  </label>
                  <div className="flex items-center border-b border-gray-200 focus-within:border-[#db6747] transition-all py-2 group">
                    <MdEmail className="text-gray-300 group-focus-within:text-[#db6747] mr-3 transition-colors shrink-0" />
                    <input type="email" required placeholder="email@example.com"
                      className="w-full bg-transparent outline-none text-sm text-gray-700 font-NunitoSans"
                      value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                {error && <ErrorMsg msg={error} />}

                <button type="submit" disabled={loading}
                  className="w-full bg-[#db6747] hover:bg-[#3a0f08] text-white py-4 font-OswaldRegular text-sm tracking-[3px] uppercase transition-all duration-500 shadow-lg disabled:opacity-50">
                  {loading ? "Sending..." : "Send Reset Code"}
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 2: Enter code + new password ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="font-OswaldRegular text-3xl text-gray-900 uppercase">Enter Code</h2>
                <p className="font-NunitoSans text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
                  A 6-digit code was sent to <span className="font-bold text-gray-700">{email}</span>
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5 text-left">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 tracking-[2px] uppercase block">Reset Code</label>
                  <input type="text" required maxLength={10} placeholder="Enter code"
                    className="w-full bg-transparent border-b border-gray-200 focus:border-[#db6747] outline-none py-2 text-sm text-gray-700 font-NunitoSans tracking-[4px] transition-colors"
                    value={code} onChange={(e) => setCode(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 tracking-[2px] uppercase block">New Password</label>
                  <div className="flex items-center border-b border-gray-200 focus-within:border-[#db6747] transition-all py-2 group">
                    <FaLock className="text-gray-300 group-focus-within:text-[#db6747] mr-3 transition-colors shrink-0" size={14} />
                    <input type={showPass ? "text" : "password"} required placeholder="Min. 6 characters"
                      className="w-full bg-transparent outline-none text-sm text-gray-700 font-NunitoSans"
                      value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPass((p) => !p)}
                      className="text-gray-300 hover:text-[#db6747] transition-colors ml-2">
                      {showPass ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 tracking-[2px] uppercase block">Confirm Password</label>
                  <div className="flex items-center border-b border-gray-200 focus-within:border-[#db6747] transition-all py-2 group">
                    <FaLock className="text-gray-300 group-focus-within:text-[#db6747] mr-3 transition-colors shrink-0" size={14} />
                    <input type={showPass ? "text" : "password"} required placeholder="Repeat password"
                      className="w-full bg-transparent outline-none text-sm text-gray-700 font-NunitoSans"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                </div>

                {error && <ErrorMsg msg={error} />}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setStep(1); setError(""); setCode(""); }}
                    className="flex-1 border-2 border-gray-300 py-3 font-OswaldRegular text-xs tracking-[2px] uppercase hover:border-gray-900 transition-all duration-300">
                    ← Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-[#db6747] hover:bg-[#3a0f08] text-white py-3 font-OswaldRegular text-xs tracking-[2px] uppercase transition-all duration-500 shadow-lg disabled:opacity-50">
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── STEP 3: Success ── */}
          {step === 3 && (
            <div className="py-6 space-y-6 text-center">
              <div className="flex justify-center text-[#db6747]">
                <FaCheckCircle size={60} />
              </div>
              <div className="space-y-2">
                <h2 className="font-OswaldRegular text-2xl text-gray-900 uppercase">Password Updated</h2>
                <p className="font-NunitoSans text-sm text-gray-600 leading-relaxed">
                  Your password has been reset successfully.<br />
                  You can now log in with your new password.
                </p>
              </div>
              <button onClick={onClose}
                className="w-full border-2 border-gray-900 py-3 font-OswaldRegular text-xs tracking-[2px] uppercase hover:bg-gray-900 hover:text-white transition-all duration-300">
                Back to Login
              </button>
            </div>
          )}
        </div>

        <div className="h-1 bg-gray-100 w-full opacity-30" />
      </div>
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3 text-[11px] text-red-600 font-bold uppercase tracking-widest rounded-r-lg">
      {msg}
    </div>
  );
}
