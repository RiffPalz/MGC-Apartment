import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "../../utils/toast";
import {
  FaShieldAlt,
  FaArrowLeft,
  FaSyncAlt,
  FaHome,
  FaArrowRight,
} from "react-icons/fa";
import logo from "../../assets/images/logo.png";
import signBG from "../../assets/images/sign-inBG.jpg";

// Api
import { verifyAdminOtp } from "../../api/authService";
import { resendAdminOtp } from "../../api/authService";

export default function Verification() {
  const [code, setCode] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const location = useLocation();
  const adminId = location.state?.adminId;

  // Logic remains consistent
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

  const handleVerify = async (e) => {
    e.preventDefault();
    const finalCode = code.join("");

    if (finalCode.length < 6) {
      return toast.error("Please enter the 6-digit code.");
    }

    if (!adminId) {
      toast.error("Session expired. Please log in again.");
      return navigate("/login");
    }

    setLoading(true);

    try {
      await verifyAdminOtp({
        adminId,
        verificationCode: finalCode,
      });

      toast.success("Identity Verified.");
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Invalid or expired verification code.",
      );
      setLoading(false);
      setCode(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-NunitoSans bg-white overflow-x-hidden">
      {/* LEFT BRANDING PANEL (Mirrored from Login) */}
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
          <img src={logo} alt="Logo" className="w-24 lg:w-32 mb-4 lg:mb-6" />
          <h1 className="font-RegularMilk text-xl lg:text-2xl text-white uppercase tracking-[4px] text-center lg:text-left">
            MGC Building
          </h1>
          <div className="w-12 h-1 bg-[#db6747] mt-4 hidden lg:block"></div>
        </div>

        <div
          data-aos="fade-up"
          className="relative z-10 space-y-4 mt-8 lg:mt-0"
        >
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-white/70 hover:text-white transition-all group font-RegularMilk text-[10px] tracking-widest uppercase"
          >
            <div className="p-2 border border-white/20 rounded-full group-hover:bg-[#db6747] group-hover:border-transparent transition-all">
              <FaHome size={14} />
            </div>
            Back to Home
          </button>
        </div>
      </div>

      {/* RIGHT VERIFICATION SECTION */}
      <div className="w-full lg:w-2/3 bg-[#fff7f1] flex items-center justify-center px-6 py-12 sm:px-16 lg:px-24">
        <div className="w-full max-w-sm" data-aos="fade-left">
          <div className="mb-10 text-center lg:text-left">
            <h4 className="text-[#db6747] font-bold tracking-[4px] uppercase text-xs mb-2">
              Security Protocol
            </h4>
            <h2 className="text-4xl font-OswaldRegular text-gray-900 uppercase">
              Verify Identity
            </h2>
            <div className="w-16 h-1 bg-[#db6747] mt-4 mx-auto lg:mx-0"></div>
          </div>

          <div className="mb-8 bg-white border border-gray-100 p-4 shadow-sm">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider leading-relaxed text-center lg:text-left">
              <strong className="text-[#db6747]">Important:</strong> A 6-digit
              verification code was sent to your registered admin email.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-10">
            <div>
              <label className="block text-[9px] font-bold tracking-[2px] text-gray-400 mb-6 uppercase font-RegularMilk text-center lg:text-left">
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
                    className="w-full h-12 sm:h-14 text-center text-lg font-bold border-b-2 border-gray-200 bg-transparent focus:border-[#db6747] outline-none transition-all text-gray-800"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#db6747] hover:bg-[#3a0f08] text-white py-5 text-xs tracking-[4px] font-RegularMilk transition-all duration-500 shadow-xl disabled:opacity-60 uppercase active:scale-[0.98]"
              >
                {loading ? "Verifying..." : "Confirm Access"}
              </button>

              <div className="flex flex-col items-center gap-4">
                <div className="h-6 flex items-center">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (!adminId) {
                            toast.error(
                              "Session expired. Please log in again.",
                            );
                            return navigate("/login");
                          }

                          await resendAdminOtp(adminId);

                          toast.success("Verification code resent.");
                          setTimer(60);
                          setCanResend(false);
                        } catch (err) {
                          toast.error(
                            err.response?.data?.message ||
                              "Failed to resend verification code.",
                          );
                        }
                      }}
                      className="text-[#db6747] font-bold text-[10px] uppercase tracking-widest hover:underline flex items-center gap-2"
                    >
                      <FaSyncAlt size={10} /> Resend Code
                    </button>
                  ) : (
                    <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">
                      Resend available in{" "}
                      <span className="text-gray-900">{timer}s</span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-2 text-gray-400 hover:text-[#db6747] transition-all font-bold text-[9px] tracking-widest uppercase"
                >
                  <FaArrowLeft size={10} /> Return to Login
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
