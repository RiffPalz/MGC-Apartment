import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import signBG from "../../assets/images/sign-inBG.jpg";
import { FaUser, FaPhoneAlt, FaHome, FaArrowLeft } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";
import { LuEye, LuEyeClosed } from "react-icons/lu";

import TermsAndConditions from "./TermsAndConditions.jsx";
import PrivacyPolicy from "./PrivacyPolicy.jsx";
import PendingVerificationModal from "../../components/PendingVerificationModal.jsx";

// AOS
import AOS from "aos";
import "aos/dist/aos.css";

// Api
import { registerTenant, checkAvailability } from "../../api/tenantAPI/tenantAuth";

const CreateAcc = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    unit: "",
    tenants: "1",
    username: "",
    password: "",
    confirm: "",
    agreed: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [takenUnits, setTakenUnits] = useState([]);
  const [usernameError, setUsernameError] = useState("");

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  /* ===== Initialize AOS ===== */
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });

    // Load taken units on mount
    checkAvailability().then((res) => {
      if (res.takenUnits) setTakenUnits(res.takenUnits);
    }).catch(() => {});
  }, []);

  /* ===== Progress Calculation ===== */
  useEffect(() => {
    const fields = [
      "fullName",
      "email",
      "phone",
      "username",
      "password",
      "confirm",
    ];
    // Check if fields are filled
    const filled = fields.filter(
      (f) => form[f] && form[f].trim() !== "",
    ).length;
    const bonus = form.agreed ? 1 : 0;

    // Total fields to track are fields.length + 1 (for the checkbox)
    setProgress(Math.round(((filled + bonus) / (fields.length + 1)) * 100));
  }, [form]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else if (name === "fullName") {
      /* ===== Auto-Capitalization Logic ===== */
      const capitalized = value
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
      setForm({ ...form, [name]: capitalized });
    } else if (name === "phone") {
      /* ===== Phone Formatting Logic (09XX-XXX-XXXX) ===== */
      let raw = value.replace(/\D/g, "");
      if (raw.length > 11) raw = raw.slice(0, 11);
      let formatted = raw;
      if (raw.length > 4 && raw.length <= 7) {
        formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
      } else if (raw.length > 7) {
        formatted = `${raw.slice(0, 4)}-${raw.slice(4, 7)}-${raw.slice(7)}`;
      }
      setForm({ ...form, [name]: formatted });
    } else if (name === "unit") {
      setForm({
        ...form,
        [name]: value,
        username: value ? `unit${value}_mgc` : "",
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleUsernameBlur = async () => {
    const username = form.username.trim();
    if (!username) return;
    try {
      const res = await checkAvailability(username);
      setUsernameError(res.usernameTaken ? "This username already has an existing account." : "");
    } catch {
      // silent — backend will catch it on submit
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (usernameError) return; // block if username already taken

    // Basic Validation
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    // Password strength (mirrors backend rules)
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(form.password)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(form.password)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
      setError('Password must contain at least one special character (!@#$%...).');
      return;
    }

    if (!form.agreed) {
      setError("You must accept the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      // 🚀 Send the exact data structure the Express backend expects
      await registerTenant({
        // Removed the fake userID so the backend can generate its own TENANT-XXX ID
        fullName: form.fullName.trim(),
        email: form.email,
        contactNumber: form.phone.replace(/-/g, ""), // Removes dashes, sends "09123456789"
        unitNumber: Number(form.unit),
        numberOfTenants: Number(form.tenants),
        userName: form.username,
        password: form.password,
      });

      // Show the success modal upon 201 Created response
      setShowSuccessModal(true);
    } catch (err) {
      // Safely catch backend validation errors (e.g., "Email already in use")
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-NunitoSans bg-white overflow-x-hidden">
      {/* LEFT BRANDING PANEL (Responsive) */}
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
          <h1 className="font-LemonMilkRegular text-xl lg:text-2xl text-white uppercase tracking-[4px] text-center lg:text-left drop-shadow-md">
            MGC Building
          </h1>
          <div className="w-12 h-1 bg-[#db6747] mt-4 hidden lg:block rounded-full"></div>
        </div>

        {/* NAVIGATION CONTROLS (Desktop & Mobile Friendly) */}
        <div
          data-aos="fade-up"
          className="relative z-10 space-y-4 mt-8 lg:mt-0"
        >
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-white/70 hover:text-white transition-all group font-LemonMilkRegular text-[10px] tracking-widest active:scale-95"
          >
            <div className="p-2.5 border border-white/20 rounded-full group-hover:bg-[#db6747] group-hover:border-transparent transition-all shadow-sm">
              <FaHome size={14} />
            </div>
            BACK TO HOME
          </button>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-3 text-white/70 hover:text-white transition-all group font-LemonMilkRegular text-[10px] tracking-widest active:scale-95"
          >
            <div className="p-2.5 border border-white/20 rounded-full group-hover:bg-[#db6747] group-hover:border-transparent transition-all shadow-sm">
              <FaArrowLeft size={14} />
            </div>
            BACK TO LOGIN
          </button>
        </div>
      </div>

      {/* RIGHT FORM SECTION */}
      <div className="w-full lg:w-2/3 bg-[#fff7f1] overflow-y-auto px-6 py-12 sm:px-16 lg:px-24">
        <div className="max-w-2xl mx-auto" data-aos="fade-left">
          {/* HEADER & INTEGRATED PROGRESS BAR */}
          <div className="mb-10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-3xl lg:text-4xl font-OswaldRegular text-gray-900 uppercase tracking-wide">
                  Registration
                </h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-[3px] mt-1 font-bold">
                  Tenant Account Setup
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase block">
                  Progress
                </span>
                <p className="text-2xl font-OswaldRegular text-[#db6747] leading-none">
                  {progress}%
                </p>
              </div>
            </div>
            {/* Progress Bar Container */}
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-[#db6747] transition-all duration-700 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8"
          >
            {/* Property Details Section */}
            <div className="space-y-6" data-aos="fade-up" data-aos-delay="100">
              <h3 className="font-LemonMilkRegular text-[#db6747] text-[11px] tracking-[2px] border-l-4 border-[#db6747] pl-3 uppercase">
                Property Details
              </h3>
              <Input
                icon={<FaUser />}
                label="Full Name"
                name="fullName"
                placeholder="Juan Dela Cruz"
                value={form.fullName}
                onChange={handleChange}
              />
              <Input
                icon={<MdEmail />}
                label="Email Address"
                name="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={handleChange}
              />
              <Input
                icon={<FaPhoneAlt />}
                label="Contact Number"
                name="phone"
                placeholder="09XX-XXX-XXXX"
                value={form.phone}
                onChange={handleChange}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Unit"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select unit...</option>
                  <optgroup label="1st Floor" className="text-[#db6747] font-bold bg-slate-50">
                    {[101, 102, 103, 104, 105, 106, 107].map((n) => (
                      <option key={n} value={n} disabled={takenUnits.includes(n)} className="text-slate-700">
                        Unit {n}{takenUnits.includes(n) ? " (Occupied)" : ""}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="2nd Floor" className="text-[#db6747] font-bold bg-slate-50">
                    {[201, 202, 203, 204, 205, 206].map((n) => (
                      <option key={n} value={n} disabled={takenUnits.includes(n)} className="text-slate-700">
                        Unit {n}{takenUnits.includes(n) ? " (Occupied)" : ""}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="3rd Floor" className="text-[#db6747] font-bold bg-slate-50">
                    {[301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316].map((n) => (
                      <option key={n} value={n} disabled={takenUnits.includes(n)} className="text-slate-700">
                        Unit {n}{takenUnits.includes(n) ? " (Occupied)" : ""}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="4th Floor" className="text-[#db6747] font-bold bg-slate-50">
                    {[401, 402, 403, 404, 405, 406, 407, 408].map((n) => (
                      <option key={n} value={n} disabled={takenUnits.includes(n)} className="text-slate-700">
                        Unit {n}{takenUnits.includes(n) ? " (Occupied)" : ""}
                      </option>
                    ))}
                  </optgroup>
                </Select>

                <Select
                  label="Tenants"
                  name="tenants"
                  value={form.tenants}
                  onChange={handleChange}
                >
                  <option value="1">1 Person</option>
                  <option value="2">2 Persons</option>
                </Select>
              </div>
            </div>

            {/* Security Access Section */}
            <div className="space-y-6" data-aos="fade-up" data-aos-delay="200">
              <h3 className="font-LemonMilkRegular text-[#db6747] text-[11px] tracking-[2px] border-l-4 border-[#db6747] pl-3 uppercase">
                Security Access
              </h3>

              <div className="relative group">
                <Input
                  icon={<FaUser />}
                  label="Username (System Generated)"
                  name="username"
                  placeholder="Select a unit number first"
                  value={form.username}
                  onChange={handleChange}
                  onBlur={handleUsernameBlur}
                  readOnly
                  className="bg-slate-100/50 cursor-not-allowed text-slate-400 font-bold w-full outline-none text-sm placeholder:text-slate-300"
                />
                <p className="text-[8px] text-[#db6747] mt-1.5 uppercase tracking-wider font-bold">
                  * Locked to your unit number for security
                </p>
                {usernameError && (
                  <p className="text-[9px] text-red-500 font-bold mt-1 uppercase tracking-wider">
                    {usernameError}
                  </p>
                )}
              </div>

              <Password
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                show={showPassword}
                toggle={() => setShowPassword(!showPassword)}
              />
              <p className="text-[9px] text-slate-400 -mt-4 leading-relaxed font-semibold">
                Min. 8 chars · uppercase · lowercase · number · special character (!@#$%...)
              </p>

              <Password
                label="Confirm Password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                show={showPassword}
                toggle={() => setShowPassword(!showPassword)}
              />
            </div>

            {/* Submit & Legal Section */}
            <div
              className="md:col-span-2 pt-6 space-y-6 border-t border-orange-200/50"
              data-aos="zoom-in"
              data-aos-delay="300"
            >
              <label className="flex items-start gap-4 bg-white border border-slate-100 p-5 rounded-xl shadow-sm cursor-pointer group hover:border-orange-200 transition-colors">
                <input
                  type="checkbox"
                  name="agreed"
                  checked={form.agreed}
                  onChange={handleChange}
                  className="mt-1 accent-[#db6747] w-4 h-4 shrink-0 cursor-pointer"
                />
                <span className="text-[10px] lg:text-[11px] uppercase tracking-wider text-slate-500 leading-relaxed font-semibold">
                  I certify accuracy and agree to the{" "}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
                    className="text-[#db6747] font-black hover:underline"
                  >
                    Terms
                  </button>{" "}
                  &{" "}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }}
                    className="text-[#db6747] font-black hover:underline"
                  >
                    Privacy Policy
                  </button>
                </span>
              </label>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 text-[10px] text-red-600 font-bold uppercase tracking-widest animate-shake rounded-r-xl shadow-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#db6747] hover:bg-[#c45a3a] text-white py-5 rounded-xl text-xs tracking-[4px] font-LemonMilkRegular transition-all duration-300 shadow-lg shadow-orange-500/30 disabled:opacity-60 uppercase active:scale-95"
              >
                {loading ? "Processing..." : "Complete Registration"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <PendingVerificationModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
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

/* ===== Reusable Styled Components ===== */

const Input = ({ icon, label, name, className, ...props }) => (
  <div className="w-full">
    <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 mb-2 uppercase font-LemonMilkRegular">
      {label}
    </label>
    <div className="flex items-center border-b-2 border-slate-200 focus-within:border-[#db6747] transition-all py-2.5 group">
      <span className="text-slate-300 group-focus-within:text-[#db6747] mr-3 transition-colors">
        {icon}
      </span>
      <input
        {...props}
        name={name}
        className={className || "w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-300 font-semibold"}
      />
    </div>
  </div>
);

const Select = ({ label, children, name, ...props }) => (
  <div className="w-full">
    <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 mb-2 uppercase font-LemonMilkRegular">
      {label}
    </label>
    <select
      {...props}
      name={name}
      className="w-full bg-transparent border-b-2 border-slate-200 focus:border-[#db6747] py-2.5 text-sm text-slate-800 outline-none appearance-none cursor-pointer font-semibold"
    >
      {children}
    </select>
  </div>
);

const Password = ({ label, name, show, toggle, ...props }) => (
  <div className="w-full">
    <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 mb-2 uppercase font-LemonMilkRegular">
      {label}
    </label>
    <div className="flex items-center border-b-2 border-slate-200 focus-within:border-[#db6747] transition-all py-2.5 group">
      <RiLockPasswordFill className="text-slate-300 group-focus-within:text-[#db6747] mr-3 transition-colors" />
      <input
        {...props}
        name={name}
        type={show ? "text" : "password"}
        className="w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-300 font-semibold"
      />
      <button
        type="button"
        onClick={toggle}
        className="text-slate-300 hover:text-[#db6747] transition-colors p-1"
      >
        {show ? <LuEye size={18} /> : <LuEyeClosed size={18} />}
      </button>
    </div>
  </div>
);

export default CreateAcc;