import { useState, useEffect } from "react";
import { MdEmail } from "react-icons/md";
import { FaCheckCircle, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { LuEye, LuEyeClosed } from "react-icons/lu";
import axios from "axios";

const BASE = import.meta.env.VITE_BACKEND_URL;

// Step 1 → request code  |  Step 2 → enter code + new password  |  Step 3 → success
export default function ForgotPassword({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        resetCode: code.trim(),
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
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Signature Top Accent Bar */}
        <div className="h-1.5 w-full bg-[#db6747] shrink-0" />

        {/* Header */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <h2 className="text-slate-800 font-bold text-xs sm:text-sm uppercase tracking-widest">
              Reset Password
            </h2>
            <p className="text-slate-400 text-[9px] sm:text-[10px] uppercase tracking-widest mt-0.5 font-bold">
              MGC Building
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 transition-colors text-lg px-2 active:scale-90"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">

          {/* ── STEP 1: Enter email ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100 shadow-sm">
                  <FaLock className="text-[#db6747]" size={20} />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
                  Enter your registered email address to receive a 6-digit reset code.
                </p>
              </div>

              <form onSubmit={handleRequestCode} className="space-y-6">
                <div>
                  <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 mb-2 uppercase">
                    Email Address
                  </label>
                  <div className="flex items-center border-b-2 border-slate-200 focus-within:border-[#db6747] transition-all py-2.5 group">
                    <MdEmail className="text-slate-300 group-focus-within:text-[#db6747] mr-3 transition-colors shrink-0" size={18} />
                    <input type="email" required placeholder="email@example.com"
                      className="w-full bg-transparent outline-none text-sm text-slate-800 font-semibold placeholder:text-slate-300"
                      value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                {error && <ErrorMsg msg={error} />}

                <div className="pt-2">
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-[#db6747] hover:bg-[#c45a3a] text-white text-xs font-bold transition-all shadow-md disabled:opacity-60 uppercase tracking-widest active:scale-95">
                    {loading ? "Sending..." : "Send Reset Code"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── STEP 2: Enter code + new password ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
                  A 6-digit code was sent to <br />
                  <span className="font-bold text-slate-800">{email}</span>
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 mb-2 uppercase">Reset Code</label>
                  <div className="flex items-center border-b-2 border-slate-200 focus-within:border-[#db6747] transition-all py-2.5">
                    <input type="text" required maxLength={6} placeholder="Enter 6-digit code"
                      className="w-full bg-transparent outline-none text-center text-lg text-slate-800 font-black tracking-[8px] transition-colors placeholder:tracking-normal placeholder:font-semibold placeholder:text-sm placeholder:text-slate-300"
                      value={code} onChange={(e) => setCode(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 mb-2 uppercase">New Password</label>
                  <div className="flex items-center border-b-2 border-slate-200 focus-within:border-[#db6747] transition-all py-2.5 group">
                    <FaLock className="text-slate-300 group-focus-within:text-[#db6747] mr-3 transition-colors shrink-0" size={14} />
                    <input type={showPass ? "text" : "password"} required placeholder="Min. 8 characters"
                      className="w-full bg-transparent outline-none text-sm text-slate-800 font-semibold placeholder:text-slate-300"
                      value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPass((p) => !p)}
                      className="text-slate-300 hover:text-[#db6747] transition-colors ml-2 p-1">
                      {showPass ? <LuEye size={18} /> : <LuEyeClosed size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 mb-2 uppercase">Confirm Password</label>
                  <div className="flex items-center border-b-2 border-slate-200 focus-within:border-[#db6747] transition-all py-2.5 group">
                    <FaLock className="text-slate-300 group-focus-within:text-[#db6747] mr-3 transition-colors shrink-0" size={14} />
                    <input type={showPass ? "text" : "password"} required placeholder="Repeat password"
                      className="w-full bg-transparent outline-none text-sm text-slate-800 font-semibold placeholder:text-slate-300"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                </div>

                {error && <ErrorMsg msg={error} />}

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => { setStep(1); setError(""); setCode(""); }}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest active:scale-95">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-[#db6747] hover:bg-[#c45a3a] text-white text-xs font-bold transition-all shadow-md disabled:opacity-60 uppercase tracking-widest active:scale-95">
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── STEP 3: Success ── */}
          {step === 3 && (
            <div className="py-4 space-y-6 text-center">
              <FaCheckCircle className="text-emerald-500 mx-auto mb-4 drop-shadow-sm" size={56} />

              <div className="space-y-2">
                <h2 className="font-black text-2xl text-slate-900 uppercase tracking-wider">Password Updated</h2>
                <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Your password has been successfully reset. You can now log in with your new credentials.
                </p>
              </div>

              <div className="pt-4">
                <button onClick={onClose}
                  className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-md uppercase tracking-widest active:scale-95">
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3 text-[11px] text-red-600 font-bold uppercase tracking-widest rounded-r-xl shadow-sm animate-shake">
      {msg}
    </div>
  );
}