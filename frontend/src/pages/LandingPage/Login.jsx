import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import signBG from "../../assets/images/sign-inBG.jpg";
import { FaUser, FaHome, FaArrowRight, FaSearch, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import { LuEye, LuEyeClosed } from "react-icons/lu";
import axios from "axios";

// Modals
import TermsAndConditions from "./TermsAndConditions.jsx";
import PrivacyPolicy from "./PrivacyPolicy.jsx";

// AOS
import AOS from "aos";
import "aos/dist/aos.css";

// Assets and Components
import ForgotPassword from "./ForgotPassword.jsx";

// ✅ AUTH SERVICE
import { login } from "../../api/authService";

const Login = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Detect role from input to swap field label
  const lowerUsername = username.toLowerCase();
  const isAdmin = lowerUsername.startsWith("admin@") || lowerUsername.includes("@");

  // Modal States
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Forgot Password Modal State
  const [showForgot, setShowForgot] = useState(false);

  // Check Status Modal
  const [showCheckStatus, setShowCheckStatus] = useState(false);
  const [checkEmail, setCheckEmail] = useState("");
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [checkError, setCheckError] = useState("");

  useEffect(() => {
    AOS.init({ duration: 1000, once: true, easing: "ease-in-out" });
  }, []);

  const handleCheckStatus = async (e) => {
    e.preventDefault();
    setCheckError("");
    setCheckResult(null);
    if (!checkEmail.trim()) { setCheckError("Please enter your email address."); return; }
    try {
      setCheckLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/applications/status?email=${encodeURIComponent(checkEmail.trim())}`
      );
      setCheckResult(res.data);
    } catch (err) {
      setCheckError(err?.response?.data?.message || "No registered account found with this email.");
    } finally {
      setCheckLoading(false);
    }
  };

  const closeCheckStatus = () => {
    setShowCheckStatus(false);
    setCheckEmail("");
    setCheckResult(null);
    setCheckError("");
  };

  // 🔐 ROLE-BASED LOGIN HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your credentials.");
      return;
    }

    setLoading(true);

    try {
      // 🧠 SMART ROUTING LOGIC
      let assignedRole = "user";
      const lowerUsername = username.toLowerCase();

      if (lowerUsername.includes("@")) {
        // Email input → admin login
        assignedRole = "admin";
      } else if (
        lowerUsername.startsWith("ct") ||
        lowerUsername.includes("caretaker") ||
        lowerUsername.includes("crtkr")
      ) {
        assignedRole = "caretaker";
      }

      // Build credentials based on role
      const credentials =
        assignedRole === "admin"
          ? { email: username, password }
          : { userName: username, password };

      const response = await login({ role: assignedRole, credentials });

      // ================= ROLE-BASED REDIRECT =================
      if (assignedRole === "admin") {
        // Admin flow goes to verification first (no token yet)
        navigate("/verification", {
          state: { adminId: response.adminId },
        });
      } else if (assignedRole === "caretaker") {
        navigate("/caretaker/dashboard");
      } else {
        navigate("/tenant/dashboard");
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-NunitoSans bg-white overflow-x-hidden">
      {/* LEFT BRANDING PANEL */}
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
          <div className="w-12 h-1 bg-[#db6747] mt-4 hidden lg:block rounded-full"></div>
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
          <button
            onClick={() => navigate("/createAccount")}
            className="flex items-center gap-3 text-white/70 hover:text-white transition-all group font-RegularMilk text-[10px] tracking-widest uppercase active:scale-95"
          >
            <div className="p-2.5 border border-white/20 rounded-full group-hover:bg-[#db6747] group-hover:border-transparent transition-all shadow-sm">
              <FaArrowRight size={14} />
            </div>
            Create Account
          </button>
          <button
            onClick={() => setShowCheckStatus(true)}
            className="flex items-center gap-3 text-white/70 hover:text-white transition-all group font-RegularMilk text-[10px] tracking-widest uppercase active:scale-95"
          >
            <div className="p-2.5 border border-white/20 rounded-full group-hover:bg-[#db6747] group-hover:border-transparent transition-all shadow-sm">
              <FaSearch size={14} />
            </div>
            Check Status
          </button>
        </div>
      </div>

      {/* RIGHT LOGIN SECTION */}
      <div className="w-full lg:w-2/3 bg-[#fff7f1] flex items-center justify-center px-6 py-12 sm:px-16 lg:px-24">
        <div className="w-full max-w-sm" data-aos="fade-left">
          <div className="mb-10 text-center lg:text-left">
            <h4 className="text-[#db6747] font-bold tracking-[4px] uppercase text-xs mb-2">
              Authorized Access
            </h4>
            <h2 className="text-4xl font-OswaldRegular text-gray-900 uppercase tracking-wide">
              Welcome Back
            </h2>
            <div className="w-16 h-1.5 bg-[#db6747] mt-4 mx-auto lg:mx-0 rounded-full"></div>
          </div>

          <div
            className="mb-8 bg-white border border-orange-100 p-4 rounded-xl shadow-sm"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <p className="text-[11px] text-slate-500 uppercase tracking-wider leading-relaxed text-center lg:text-left font-bold">
              <strong className="text-[#db6747]">Note:</strong> Only verified
              tenants are authorized to access the building management
              dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div data-aos="fade-up" data-aos-delay="200">
              <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 mb-2 uppercase font-RegularMilk">
                {isAdmin ? "Email Address" : "Username"}
              </label>
              <div className="flex items-center border-b-2 border-slate-200 focus-within:border-[#db6747] transition-all py-2.5 group">
                <FaUser className="text-slate-300 group-focus-within:text-[#db6747] mr-3 transition-colors" />
                <input
                  type={isAdmin ? "email" : "text"}
                  placeholder={isAdmin ? "admin@email.com" : "Enter unique ID"}
                  className="w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-300 font-semibold"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div data-aos="fade-up" data-aos-delay="300">
              <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 uppercase font-LemonMilkRegular mb-2">
                Password
              </label>

              <div className="flex items-center border-b-2 border-slate-200 focus-within:border-[#db6747] transition-all py-2.5 group">
                <RiLockPasswordFill className="text-slate-300 group-focus-within:text-[#db6747] mr-3 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-300 font-semibold"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-300 hover:text-[#db6747] transition-colors p-1"
                >
                  {showPassword ? (
                    <LuEye size={18} />
                  ) : (
                    <LuEyeClosed size={18} />
                  )}
                </button>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-[9px] uppercase tracking-widest text-slate-400 hover:text-[#db6747] transition-colors font-bold"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-[10px] text-red-600 font-bold uppercase tracking-widest animate-shake rounded-r-xl shadow-sm">
                {error}
              </div>
            )}

            <div className="pt-4" data-aos="zoom-in" data-aos-delay="400">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#db6747] hover:bg-[#c45a3a] text-white py-5 rounded-xl text-xs tracking-[4px] font-RegularMilk transition-all duration-300 shadow-lg shadow-orange-500/30 disabled:opacity-60 uppercase active:scale-95"
              >
                {loading ? "Authenticating..." : "Login to Portal"}
              </button>

              <p className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed font-bold">
                By logging in, you acknowledge that you agree to our <br />
                <button type="button" onClick={() => setShowTerms(true)} className="text-[#db6747] font-black hover:underline mt-1">Terms & Conditions</button>{" "}
                and{" "}
                <button type="button" onClick={() => setShowPrivacy(true)} className="text-[#db6747] font-black hover:underline">Privacy Policy</button>.
              </p>

              <p className="mt-5 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-orange-50/50 py-3 rounded-lg border border-orange-100/50">
                Already submitted a registration? <br />
                <button type="button" onClick={() => setShowCheckStatus(true)} className="text-[#db6747] font-black hover:underline mt-1">Check status</button>
              </p>
            </div>
          </form>
        </div>
      </div>

      <ForgotPassword isOpen={showForgot} onClose={() => setShowForgot(false)} />
      <TermsAndConditions isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyPolicy isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />

      {/* ── CHECK STATUS MODAL ── */}
      {showCheckStatus && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

            <div className="h-1.5 w-full bg-[#db6747] shrink-0" />
            <div className="border-b border-slate-100 px-6 sm:px-8 py-4 sm:py-5 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div>
                <h2 className="text-slate-800 font-bold text-xs sm:text-sm uppercase tracking-widest">Check Status</h2>
                <p className="text-slate-400 text-[9px] sm:text-[10px] uppercase tracking-widest mt-0.5 font-bold">MGC Building</p>
              </div>
              <button onClick={closeCheckStatus} className="text-slate-400 hover:text-slate-800 transition-colors text-lg px-2 active:scale-90">✕</button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
              {!checkResult ? (
                <form onSubmit={handleCheckStatus} className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100 shadow-sm">
                      <FaSearch className="text-[#db6747]" size={20} />
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
                      Enter your email address to view the current status of your registration request.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-[2px] text-slate-400 mb-2 uppercase">Email Address <span className="text-red-500">*</span></label>
                    <input type="email" required value={checkEmail}
                      onChange={e => setCheckEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#db6747]/30 focus:border-[#db6747] transition-all bg-slate-50 font-semibold text-slate-700 shadow-sm" />
                  </div>

                  {checkError && (
                    <p className="text-[11px] text-red-600 font-bold uppercase tracking-widest bg-red-50 px-4 py-3 rounded-r-xl border-l-4 border-red-500 shadow-sm">{checkError}</p>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-100 mt-6">
                    <button type="button" onClick={closeCheckStatus}
                      className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest active:scale-95">
                      Cancel
                    </button>
                    <button type="submit" disabled={checkLoading}
                      className="flex-1 py-3 rounded-xl bg-[#db6747] hover:bg-[#c45a3a] text-white text-xs font-bold transition-all shadow-md disabled:opacity-60 uppercase tracking-widest active:scale-95">
                      {checkLoading ? "Checking..." : "Check Status"}
                    </button>
                  </div>

                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => { closeCheckStatus(); navigate("/createAccount"); }}
                      className="text-[#db6747] font-black hover:underline">Sign up here</button>
                  </p>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="text-center py-4">
                    {checkResult.status === "Approved" ? (
                      <FaCheckCircle className="text-emerald-500 mx-auto mb-4 drop-shadow-sm" size={48} />
                    ) : checkResult.status === "Declined" ? (
                      <FaTimesCircle className="text-red-500 mx-auto mb-4 drop-shadow-sm" size={48} />
                    ) : (
                      <FaClock className="text-amber-500 mx-auto mb-4 drop-shadow-sm" size={48} />
                    )}
                    <p className="text-xl font-black text-slate-900">{checkResult.fullName}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                      {checkResult.type === "account" ? "Account Registration" : "Application Request"}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-center shadow-inner">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1.5 font-bold">Current Status</p>
                    <span className={`inline-block text-[11px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest border shadow-sm
                      ${checkResult.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        checkResult.status === "Declined" ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                      {checkResult.status}
                    </span>

                    <div className="mt-4 pt-4 border-t border-slate-200/60">
                      {checkResult.status === "Approved" && (
                        <p className="text-xs text-slate-600 font-semibold leading-relaxed">Your account is ready. You can now log in to the portal.</p>
                      )}
                      {checkResult.status === "Under Review" && (
                        <p className="text-xs text-slate-600 font-semibold leading-relaxed">Your application is currently being reviewed. We'll notify you via email once a decision is made.</p>
                      )}
                      {checkResult.status === "Declined" && (
                        <p className="text-xs text-slate-600 font-semibold leading-relaxed">Your application was not approved. Please contact the property management office for more details.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button onClick={closeCheckStatus}
                      className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-md uppercase tracking-widest active:scale-95">
                      Close Window
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default Login;