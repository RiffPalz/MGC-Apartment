/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "../../utils/toast";
import {
  FaArrowLeft,
  FaSyncAlt,
  FaHome,
} from "react-icons/fa";
import logo from "../../assets/images/logo.png";
import signBG from "../../assets/images/sign-inBG.jpg";

import AOS from "aos";
import "aos/dist/aos.css";

import { verifyAdminOtp, resendAdminOtp } from "../../api/authService";

export default function Verification() {
  const [code, setCode] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const adminId = location.state?.adminId;
  const verifyingRef = useRef(false);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true, easing: "ease-in-out" });
  }, []);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  const handleVerify = useCallback(async (finalCode) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;

    if (!adminId) {
      toast.error("Session expired. Please log in again.");
      return navigate("/login");
    }

    setLoading(true);

    try {
      await verifyAdminOtp({ adminId, verificationCode: finalCode });
      toast.success("Identity Verified.");
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired verification code.");
      setLoading(false);
      setCode(new Array(6).fill(""));
      verifyingRef.current = false;
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }, [adminId, navigate]);

  useEffect(() => {
    if (error) setError("");
    const filled = code.every((d) => d !== "");
    if (filled && !loading && !verifyingRef.current) {
      handleVerify(code.join(""));
    }
  }, [code, loading, handleVerify, error]);

  const handleChange = (value, index) => {
    if (isNaN(value)) return;
    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-NunitoSans bg-white overflow-x-hidden">
      <div
        className="w-full lg:w-1/3 relative flex flex-col justify-between p-8 lg:p-12 overflow-hidden min-h-[300px] lg:min-h-screen"
        style={{
          backgroundImage: `linear-gradient(rgba(58, 15, 8, 0.85), rgba(58, 15, 8, 0.85)), url(${signBG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          data-aos="fade-down"
          className="relative z-10 flex flex-col items-center lg:items-start"
        >
          <img src={logo} alt="Logo" className="w-24 lg:w-32 mb-4 lg:mb-6 drop-shadow-lg" />
          <h1 className="font-RegularMilk text-xl lg:text-2xl text-white uppercase tracking-[4px] text-center lg:text-left drop-shadow-md">
            MGC Building
          </h1>
          <div className="w-12 h-1.5 bg-[#db6747] mt-4 hidden lg:block rounded-full"></div>
        </div>

        <div
          data-aos="fade-up"
          className="relative z-10 space-y-4 mt-8 lg:mt-0"
        >
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-white/70 hover:text-white transition-all group font-RegularMilk text-[10px] tracking-widest uppercase active:scale-95"
          >
            <div className="p-2.5 border border-white/20 rounded-full group-hover:bg-[#db6747] group-hover:border-transparent transition-all shadow-sm">
              <FaHome size={14} />
            </div>
            Back to Home
          </button>
        </div>
      </div>

      <div className="w-full lg:w-2/3 bg-[#fff7f1] flex items-center justify-center px-6 py-12 sm:px-16 lg:px-24">
        <div className="w-full max-w-md" data-aos="fade-left">
          <div className="mb-10 text-center lg:text-left">
            <h4 className="text-[#db6747] font-bold tracking-[4px] uppercase text-xs mb-2">
              Security Protocol
            </h4>
            <h2 className="text-4xl font-OswaldRegular text-slate-900 uppercase tracking-wide">
              Verify Identity
            </h2>
            <div className="w-16 h-1.5 bg-[#db6747] mt-4 mx-auto lg:mx-0 rounded-full"></div>
          </div>

          <div
            className="mb-8 bg-white border border-orange-100 p-4 sm:p-5 rounded-xl shadow-sm"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <p className="text-[11px] text-slate-500 uppercase tracking-wider leading-relaxed text-center lg:text-left font-bold">
              <strong className="text-[#db6747]">Important:</strong> A 6-digit
              verification code was sent to your registered admin email.
            </p>
          </div>

          <div data-aos="fade-up" data-aos-delay="200">
            <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 mb-5 uppercase font-RegularMilk text-center lg:text-left">
              Security Code
            </label>

            <div className="flex justify-between gap-2 sm:gap-3">
              {code.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  ref={(el) => (inputRefs.current[index] = el)}
                  value={data}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black border-b-2 outline-none transition-all text-slate-800 focus:-translate-y-1 ${
                    error
                      ? "border-red-400 bg-red-50 focus:border-red-500"
                      : "border-slate-200 bg-transparent focus:border-[#db6747]"
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="mt-4 text-center text-[11px] font-bold text-red-500 uppercase tracking-wider">
                {error}
              </p>
            )}
          </div>

          <div className="mt-10 flex flex-col items-center gap-5">
            <div className="h-6 flex items-center">
              {loading ? (
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                  Verifying...
                </p>
              ) : canResend ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (!adminId) {
                        toast.error("Session expired. Please log in again.");
                        return navigate("/login");
                      }
                      await resendAdminOtp(adminId);
                      toast.success("Verification code resent.");
                      setTimer(60);
                      setCanResend(false);
                      setError("");
                      setCode(new Array(6).fill(""));
                      inputRefs.current[0]?.focus();
                    } catch (err) {
                      toast.error(err.response?.data?.message || "Failed to resend verification code.");
                    }
                  }}
                  className="text-[#db6747] font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-2"
                >
                  <FaSyncAlt size={11} /> Resend Code
                </button>
              ) : (
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  Resend available in{" "}
                  <span className="text-slate-800">{timer}s</span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-slate-400 hover:text-[#db6747] transition-all font-bold text-[10px] tracking-widest uppercase"
            >
              <FaArrowLeft size={11} /> Return to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}