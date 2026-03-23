import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import signBG from "../../assets/images/sign-inBG.jpg";
import { FaUser, FaHome, FaArrowRight } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import { LuEye, LuEyeClosed } from "react-icons/lu";

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

  useEffect(() => {
    AOS.init({ duration: 1000, once: true, easing: "ease-in-out" });
  }, []);

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
      } else if (lowerUsername.startsWith("ct") || lowerUsername.startsWith("caretaker")) {
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
          <button
            onClick={() => navigate("/createAccount")}
            className="flex items-center gap-3 text-white/70 hover:text-white transition-all group font-RegularMilk text-[10px] tracking-widest uppercase"
          >
            <div className="p-2 border border-white/20 rounded-full group-hover:bg-[#db6747] group-hover:border-transparent transition-all">
              <FaArrowRight size={14} />
            </div>
            Create Account
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
            <h2 className="text-4xl font-OswaldRegular text-gray-900 uppercase">
              Welcome Back
            </h2>
            <div className="w-16 h-1 bg-[#db6747] mt-4 mx-auto lg:mx-0"></div>
          </div>

          <div
            className="mb-8 bg-white border border-gray-100 p-4 shadow-sm"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <p className="text-[11px] text-gray-500 uppercase tracking-wider leading-relaxed text-center lg:text-left">
              <strong className="text-[#db6747]">Note:</strong> Only verified
              tenants are authorized to access the building management
              dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div data-aos="fade-up" data-aos-delay="200">
              <label className="block text-[9px] font-bold tracking-[2px] text-gray-400 mb-2 uppercase font-RegularMilk">
                {isAdmin ? "Email Address" : "Username"}
              </label>
              <div className="flex items-center border-b border-gray-200 focus-within:border-[#db6747] transition-all py-2 group">
                <FaUser className="text-gray-300 group-focus-within:text-[#db6747] mr-3 transition-colors" />
                <input
                  type={isAdmin ? "email" : "text"}
                  placeholder={isAdmin ? "admin@email.com" : "Enter unique ID"}
                  className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div data-aos="fade-up" data-aos-delay="300">
              <label className="block text-[9px] font-bold tracking-[2px] text-gray-400 uppercase font-LemonMilkRegular mb-2">
                Password
              </label>

              <div className="flex items-center border-b border-gray-200 focus-within:border-[#db6747] transition-all py-2 group">
                <RiLockPasswordFill className="text-gray-300 group-focus-within:text-[#db6747] mr-3 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-300 hover:text-[#db6747] transition-colors"
                >
                  {showPassword ? (
                    <LuEye size={18} />
                  ) : (
                    <LuEyeClosed size={18} />
                  )}
                </button>
              </div>

              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-[9px] uppercase tracking-widest text-gray-400 hover:text-[#db6747] transition-colors font-bold"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-[10px] text-red-600 font-bold uppercase tracking-widest animate-shake">
                {error}
              </div>
            )}

            <div className="pt-4" data-aos="zoom-in" data-aos-delay="400">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#db6747] hover:bg-[#3a0f08] text-white py-5 text-xs tracking-[4px] font-RegularMilk transition-all duration-500 shadow-xl disabled:opacity-60 uppercase active:scale-[0.98]"
              >
                {loading ? "Authenticating..." : "Login"}
              </button>

              <p className="mt-8 text-center text-[10px] text-gray-400 uppercase tracking-[1px] leading-relaxed">
                By logging in, you acknowledge that you agree to our <br />
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-[#db6747] font-bold hover:underline"
                >
                  Terms & Conditions
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="text-[#db6747] font-bold hover:underline"
                >
                  Privacy Policy
                </button>
                .
              </p>
            </div>
          </form>
        </div>
      </div>

      <ForgotPassword
        isOpen={showForgot}
        onClose={() => setShowForgot(false)}
      />

      <TermsAndConditions
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
      />
      <PrivacyPolicy
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />

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
};

export default Login;