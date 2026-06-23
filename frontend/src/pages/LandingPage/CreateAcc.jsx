import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import signBG from "../../assets/images/sign-inBG.jpg";
import { FaUser, FaPhoneAlt, FaHome, FaArrowLeft, FaCheckCircle, FaLock, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { MdEmail, MdApartment } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";
import { LuEye, LuEyeClosed } from "react-icons/lu";

import TermsAndConditions from "./TermsAndConditions.jsx";
import PrivacyPolicy from "./PrivacyPolicy.jsx";
import PendingVerificationModal from "../../components/PendingVerificationModal.jsx";

// AOS
import AOS from "aos";
import "aos/dist/aos.css";

// Api
import { registerTenant } from "../../api/tenantAPI/tenantAuth";
import api from "../../api/config";

const CreateAcc = () => {
  const navigate = useNavigate();

  // Multi-step state
  const [step, setStep] = useState(1);
  const totalSteps = 3;


  const [expandedFloor, setExpandedFloor] = useState(null);

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [usernameError] = useState("");

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Load available units on mount — status comes directly from the API
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });

    api.get("/config/units").then((res) => {
      if (res.data.success) setAvailableUnits(res.data.units || []);
    }).catch(() => { });
  }, []);

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
      setError(""); // clear errors when changing unit
    } else {
      setForm({ ...form, [name]: value });
    }
  };


  /* ===== Pure Accordion Toggle Logic ===== */
  const toggleFloor = (floorNum) => {
    // If clicking the already open floor, close it (set to null). 
    // Otherwise, open the clicked floor (which automatically closes any other).
    setExpandedFloor((prev) => (prev === floorNum ? null : floorNum));
  };

  /* ===== Navigation Methods ===== */
  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!form.unit) {
        setError("Please select an available unit to continue.");
        return;
      }
    }
    if (step === 2) {
      if (!form.tenants) {
        setError("Please select the number of occupants.");
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  /* ===== Submission ===== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (usernameError) return;

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

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
      await registerTenant({
        fullName: form.fullName.trim(),
        email: form.email,
        contactNumber: form.phone.replace(/-/g, ""),
        unitNumber: Number(form.unit),
        numberOfTenants: Number(form.tenants),
        userName: form.username,
        password: form.password,
      });
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ===== Render Helpers ===== */
  const renderStepIndicator = () => (
    <div className="mb-8">
      {/* Segmented Lines */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= num ? "bg-[#db6747]" : "bg-slate-200"
              }`}
          />
        ))}
      </div>
      {/* Title & Fraction */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl lg:text-4xl font-OswaldRegular text-gray-900 uppercase tracking-wide">
            {step === 1 && "Unit Selection"}
            {step === 2 && "Account Setup"}
            {step === 3 && "Create Account"}
          </h2>
          <p className="text-slate-400 text-[10px] uppercase tracking-[3px] mt-1 font-bold">
            Tenant Registration
          </p>
        </div>
        <div className="text-2xl font-OswaldRegular text-[#db6747] leading-none">
          {step}/{totalSteps}
        </div>
      </div>
    </div>
  );

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
        <div data-aos="fade-down" className="relative z-10 flex flex-col items-center lg:items-start">
          <img src={logo} alt="Logo" className="w-24 lg:w-32 mb-4 lg:mb-6 drop-shadow-lg" />
          <h1 className="font-LemonMilkRegular text-xl lg:text-2xl text-white uppercase tracking-[4px] text-center lg:text-left drop-shadow-md">
            MGC Building
          </h1>
          <div className="w-12 h-1 bg-[#db6747] mt-4 hidden lg:block rounded-full"></div>
        </div>

        <div data-aos="fade-up" className="relative z-10 space-y-4 mt-8 lg:mt-0">
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
      <div className="w-full lg:w-2/3 bg-[#fff7f1] flex items-center justify-center py-12 px-6 sm:px-16">
        <div
          className="w-full max-w-3xl bg-white p-8 md:p-10 rounded-2xl shadow-xl shadow-orange-900/5"
          data-aos="fade-left"
        >
          {renderStepIndicator()}

          <div className="min-h-80">
            {/* STEP 1: Unit Selection */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <p className="text-sm text-slate-500 font-semibold mb-4">
                  Please select an available unit from the list below to begin your registration.
                </p>

                <div className="space-y-4">
                  {[
                    { label: "Ground Floor", num: 1 },
                    { label: "2nd Floor", num: 2 },
                    { label: "3rd Floor", num: 3 },
                    { label: "4th Floor", num: 4 },
                  ].map(({ label, num }) => {
                    const floorUnits = availableUnits.filter((u) => u.floor === num);
                    if (!floorUnits.length) return null;

                    const isExpanded = expandedFloor === num;

                    return (
                      <div key={num} className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                        <button
                          type="button"
                          onClick={() => toggleFloor(num)}
                          className="w-full flex justify-between items-center p-4 bg-white hover:bg-slate-50 transition-colors focus:outline-none"
                        >
                          <h4 className="text-[10px] font-LemonMilkRegular text-[#db6747] tracking-[2px] uppercase mb-0">
                            {label}
                          </h4>
                          {isExpanded ? (
                            <FaChevronUp className="text-slate-400" />
                          ) : (
                            <FaChevronDown className="text-slate-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-4 border-t border-slate-100 bg-slate-50 animate-fadeIn">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                              {floorUnits.map((u) => {
                                const isSelectable = u.status === "Vacant";
                                const isSelected = form.unit === String(u.unit_number);

                                const STATUS_STYLE = {
                                  Vacant:              { badge: "text-green-600",  badgeBg: "bg-green-50",       label: "Available" },
                                  Occupied:            { badge: "text-[#db6747]",  badgeBg: "bg-[#db6747]/10",   label: "Occupied" },
                                  "Under Maintenance": { badge: "text-amber-600",  badgeBg: "bg-amber-50",       label: "Maintenance" },
                                  Disabled:            { badge: "text-slate-400",  badgeBg: "bg-slate-100",      label: "Disabled" },
                                };
                                const st = STATUS_STYLE[u.status] ?? STATUS_STYLE.Vacant;

                                return (
                                  <button
                                    key={u.ID}
                                    type="button"
                                    disabled={!isSelectable}
                                    onClick={() => handleChange({ target: { name: 'unit', value: String(u.unit_number) } })}
                                    className={`
                                      relative flex flex-col items-center justify-center py-4 px-2 rounded-lg border-2 transition-all
                                      ${!isSelectable ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed' :
                                        isSelected ? 'bg-[#fff0eb] border-[#db6747] text-[#db6747] ring-2 ring-[#db6747]' : 'bg-white border-slate-200 hover:border-orange-300 text-slate-600'}
                                    `}
                                  >
                                    <MdApartment size={18} className={`mb-1.5 ${isSelected ? 'text-[#db6747]' : 'text-slate-400'}`} />
                                    <span className="font-bold text-xs md:text-sm">Unit {u.unit_number}</span>
                                    <span className={`text-[8px] md:text-[9px] uppercase tracking-wider font-bold mt-1 ${isSelected ? 'text-[#db6747]' : st.badge}`}>
                                      {st.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Account Type */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn max-w-xl mx-auto">
                <div className="bg-[#fff0eb] border border-orange-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FaCheckCircle className="text-[#db6747] text-xl" />
                    <h3 className="font-OswaldRegular text-xl text-slate-800 tracking-wide uppercase">
                      Primary Tenant Account
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 font-semibold leading-relaxed mt-3">
                    As a strict security measure, only <b>ONE</b> primary account can be registered per unit (Unit {form.unit}).
                    This account will serve as the main point of contact and access.
                  </p>
                </div>

                <Select
                  label="Number of Occupants"
                  name="tenants"
                  value={form.tenants}
                  onChange={handleChange}
                  required
                >
                  <option value="1">1 Person</option>
                  <option value="2">2 Persons</option>
                </Select>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-2">
                  * Additional occupants will share this primary account access.
                </p>
              </div>
            )}

            {/* STEP 3: Form Details */}
            {step === 3 && (
              <form id="registration-form" onSubmit={handleSubmit} className="space-y-5 animate-fadeIn max-w-xl mx-auto">

                {/* Row 1: Full Name + Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    icon={<FaUser size={14} />}
                    label="Full Name"
                    name="fullName"
                    placeholder="Juan Dela Cruz"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    icon={<FaPhoneAlt size={14} />}
                    label="Contact Number"
                    name="phone"
                    placeholder="09XX-XXX-XXXX"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Row 2: Email */}
                <Input
                  icon={<MdEmail size={16} />}
                  label="Email Address"
                  name="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />

                {/* Username — Styled callout */}
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-[#db6747]/10 rounded-lg">
                      <FaLock size={11} className="text-[#db6747]" />
                    </div>
                    <label className="text-[9px] font-bold tracking-[2px] text-slate-500 uppercase font-LemonMilkRegular">
                      Username <span className="text-slate-400 font-medium normal-case tracking-normal">(System Generated)</span>
                    </label>
                  </div>
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg px-4 py-3 gap-3">
                    <FaLock size={13} className="text-slate-300 shrink-0" />
                    <span className="flex-1 text-sm font-bold text-[#db6747] tracking-wide font-mono">
                      {form.username || <span className="text-slate-300 font-normal">—</span>}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                      Read‑only
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 font-medium tracking-wide">
                    🔒 Locked to Unit {form.unit} for security. Cannot be changed.
                  </p>
                  {usernameError && (
                    <p className="text-[9px] text-red-500 font-bold mt-1 flex items-center gap-1">
                      <span>⚠</span> {usernameError}
                    </p>
                  )}
                </div>

                {/* Password row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Password
                    label="Password"
                    name="password"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    show={showPassword}
                    toggle={() => setShowPassword(!showPassword)}
                    hint="Min. 8 chars · uppercase · lowercase · number · special char (!@#$)"
                    required
                  />
                  <Password
                    label="Confirm Password"
                    name="confirm"
                    placeholder="Re-enter password"
                    value={form.confirm}
                    onChange={handleChange}
                    show={showPassword}
                    toggle={() => setShowPassword(!showPassword)}
                    required
                  />
                </div>

                {/* Inline error — appears right above terms */}
                {error && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 animate-shake">
                    <span className="text-red-500 text-base leading-none mt-0.5 shrink-0">⚠</span>
                    <p className="text-[11px] text-red-600 font-semibold leading-relaxed">{error}</p>
                  </div>
                )}

                {/* Terms & Privacy checkbox */}
                <label className={`flex items-start gap-3.5 p-4 rounded-xl cursor-pointer transition-all border
                  ${form.agreed
                    ? "bg-[#fff7f4] border-[#db6747]/30"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}>
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      name="agreed"
                      checked={form.agreed}
                      onChange={handleChange}
                      className="peer sr-only"
                    />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                      ${form.agreed ? "bg-[#db6747] border-[#db6747]" : "bg-white border-slate-300"}`}>
                      {form.agreed && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] lg:text-[11px] uppercase tracking-wider text-slate-500 leading-relaxed font-semibold">
                    I certify the accuracy of my information and agree to the{" "}
                    <button type="button" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
                      className="text-[#db6747] font-black hover:underline focus:outline-none">
                      Terms
                    </button>{" "}
                    &{" "}
                    <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }}
                      className="text-[#db6747] font-black hover:underline focus:outline-none">
                      Privacy Policy
                    </button>
                  </span>
                </label>

              </form>
            )}
          </div>

          {/* Global Error Display — shown for steps 1 & 2 only; step 3 renders inline */}
          {error && step !== 3 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mt-4 max-w-xl mx-auto animate-shake">
              <span className="text-red-500 text-base leading-none mt-0.5 shrink-0">⚠</span>
              <p className="text-[11px] text-red-600 font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3 max-w-xl mx-auto">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="w-1/3 py-3.5 rounded-xl text-xs tracking-[2px] font-bold text-slate-500 border-2 border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all duration-200 uppercase active:scale-95"
              >
                ← Back
              </button>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className={`flex-1 py-3.5 rounded-xl text-xs tracking-[3px] font-LemonMilkRegular transition-all duration-200 uppercase shadow-md active:scale-95
                  ${form.unit
                    ? "bg-[#db6747] hover:bg-[#c45a3a] text-white shadow-[#db6747]/25"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"}`}
              >
                Next Step →
              </button>
            ) : (
              <button
                type="submit"
                form="registration-form"
                disabled={loading}
                className="flex-1 bg-[#db6747] hover:bg-[#c45a3a] active:bg-[#b84e32] text-white py-3.5 rounded-xl text-xs tracking-[3px] font-LemonMilkRegular transition-all duration-200 shadow-lg shadow-[#db6747]/25 disabled:opacity-60 disabled:cursor-not-allowed uppercase active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Processing...
                  </>
                ) : "Create Account"}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Modals */}
      <PendingVerificationModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
      <TermsAndConditions isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyPolicy isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />

      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
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

const Input = ({ icon, label, name, className, required, ...props }) => (
  <div className="w-full">
    <label className="block text-[9px] font-bold tracking-[2px] text-slate-500 mb-2 uppercase font-LemonMilkRegular">
      {label}{required && <span className="text-[#db6747] ml-0.5">*</span>}
    </label>
    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 gap-3 group focus-within:border-[#db6747] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#db6747]/10 transition-all duration-200">
      <span className="text-slate-400 group-focus-within:text-[#db6747] shrink-0 transition-colors duration-200">
        {icon}
      </span>
      <input
        {...props}
        name={name}
        className={className || "w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 font-medium"}
      />
    </div>
  </div>
);

const Select = ({ label, children, name, required, ...props }) => (
  <div className="w-full">
    <label className="block text-[9px] font-bold tracking-[2px] text-slate-400 mb-2 uppercase font-LemonMilkRegular">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <select
        {...props}
        name={name}
        className="w-full bg-transparent border-b-2 border-slate-200 focus:border-[#db6747] py-2.5 text-sm text-slate-800 outline-none appearance-none cursor-pointer font-semibold pr-6"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </span>
    </div>
  </div>
);

const Password = ({ label, name, show, toggle, required, hint, ...props }) => (
  <div className="w-full">
    <label className="block text-[9px] font-bold tracking-[2px] text-slate-500 mb-2 uppercase font-LemonMilkRegular">
      {label}{required && <span className="text-[#db6747] ml-0.5">*</span>}
    </label>
    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 gap-3 group focus-within:border-[#db6747] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#db6747]/10 transition-all duration-200">
      <RiLockPasswordFill className="text-slate-400 group-focus-within:text-[#db6747] shrink-0 transition-colors duration-200" size={16} />
      <input
        {...props}
        name={name}
        type={show ? "text" : "password"}
        className="w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 font-medium"
      />
      <button
        type="button"
        onClick={toggle}
        className="text-slate-400 hover:text-[#db6747] transition-colors duration-200 p-0.5 shrink-0 rounded focus:outline-none focus:text-[#db6747]"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <LuEye size={17} /> : <LuEyeClosed size={17} />}
      </button>
    </div>
    {hint && (
      <p className="text-[9px] text-slate-400 mt-1.5 leading-relaxed font-medium tracking-wide">{hint}</p>
    )}
  </div>
);

export default CreateAcc;