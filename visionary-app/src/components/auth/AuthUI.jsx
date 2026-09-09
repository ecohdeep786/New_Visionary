import { Loader2, ArrowLeft, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

/* ── Shared classes ── */

export const primaryBtnClass =
  "w-full h-12 bg-[#1a73e8] text-white rounded-full text-sm font-medium hover:bg-[#1557b0] transition-colors disabled:opacity-60 flex items-center justify-center gap-2";

export const primaryBtnAutoClass =
  "h-10 px-6 bg-[#1a73e8] text-white rounded-full text-sm font-medium hover:bg-[#1557b0] transition-colors disabled:opacity-60 flex items-center justify-center gap-2";

export const outlineBtnClass =
  "w-full h-12 bg-white text-[#1a73e8] rounded-full text-sm font-medium border border-[#dadce0] hover:bg-[#f8f9fa] hover:border-[#bdc1c6] transition-colors flex items-center justify-center gap-2";

/* ── Primitives ── */

export function Spinner({ className = "w-4 h-4" }) {
  return <Loader2 className={`${className} animate-spin`} />;
}

export function AuthDivider() {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[#dadce0]" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs text-[#5f6368]">or</span>
      </div>
    </div>
  );
}

export function BackButton({ onClick = undefined, to = undefined, label = "Back" }) {
  const className = "flex items-center gap-1.5 text-sm text-[#1a73e8] font-medium hover:underline self-start mb-6";
  if (to) {
    return (
      <Link to={to} className={className}>
        <ArrowLeft className="w-4 h-4" /> {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      <ArrowLeft className="w-4 h-4" /> {label}
    </button>
  );
}

/* ── Action row: secondary link left, primary button right ── */

export function ActionRow({ left = null, children = null }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>{left}</div>
      <div>{children}</div>
    </div>
  );
}

/* ── Phone input with country code selector ── */

const countryCodes = [
  { code: "+1", flag: "🇺🇸" },
  { code: "+44", flag: "🇬🇧" },
  { code: "+91", flag: "🇮🇳" },
  { code: "+92", flag: "🇵🇰" },
  { code: "+880", flag: "🇧🇩" },
  { code: "+86", flag: "🇨🇳" },
  { code: "+81", flag: "🇯🇵" },
  { code: "+49", flag: "🇩🇪" },
  { code: "+33", flag: "🇫🇷" },
  { code: "+61", flag: "🇦🇺" },
  { code: "+971", flag: "🇦🇪" },
  { code: "+62", flag: "🇮🇩" },
  { code: "+55", flag: "🇧🇷" },
  { code: "+27", flag: "🇿🇦" },
];

export function PhoneInput({ label = "Phone number", value = "", onChange = () => {}, autoFocus = false, required = false }) {
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [focused, setFocused] = useState(false);
  const floated = focused || (phoneNumber && phoneNumber.length > 0);

  const handlePhoneChange = (e) => {
    const num = e.target.value;
    setPhoneNumber(num);
    onChange(`${countryCode} ${num}`);
  };

  const handleCountryChange = (e) => {
    const code = e.target.value;
    setCountryCode(code);
    onChange(`${code} ${phoneNumber}`);
  };

  return (
    <div className="flex gap-2">
      <div className="relative shrink-0">
        <select
          value={countryCode}
          onChange={handleCountryChange}
          className="h-14 pl-3 pr-7 rounded-lg border border-[#80868b] text-sm text-[#202124] bg-white outline-none appearance-none cursor-pointer focus:border-[#1a73e8]"
        >
          {countryCodes.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5f6368] pointer-events-none" />
      </div>
      <div className={`relative flex-1 rounded-lg border transition-colors ${focused ? "border-[#1a73e8]" : "border-[#80868b]"}`}>
        <input
          type="tel"
          autoFocus={autoFocus}
          placeholder=""
          value={phoneNumber}
          onChange={handlePhoneChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          className="w-full h-14 px-4 pt-4 bg-transparent text-sm text-[#202124] outline-none"
        />
        <label
          className={`absolute left-3 transition-all duration-150 pointer-events-none bg-white px-1 ${
            floated
              ? "top-0 -translate-y-1/2 text-xs text-[#1a73e8]"
              : "top-1/2 -translate-y-1/2 text-sm text-[#5f6368]"
          }`}
        >
          {label}
        </label>
      </div>
    </div>
  );
}

/* ── Floating-label password field + Show password checkbox ── */

export function GooglePasswordField({
  label = "",
  placeholder = "",
  value = "",
  onChange = () => {},
  autoFocus = false,
  autoComplete = "current-password",
  required = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const displayLabel = label || placeholder || "Password";
  const floated = focused || (value && value.length > 0);

  return (
    <div className="flex flex-col gap-2">
      <div className={`relative rounded-lg border transition-colors ${focused ? "border-[#1a73e8]" : "border-[#80868b]"}`}>
        <input
          type={showPassword ? "text" : "password"}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          placeholder=""
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          className="w-full h-14 px-4 pt-4 bg-transparent text-sm text-[#202124] outline-none"
        />
        <label
          className={`absolute left-3 transition-all duration-150 pointer-events-none bg-white px-1 ${
            floated
              ? "top-0 -translate-y-1/2 text-xs text-[#1a73e8]"
              : "top-1/2 -translate-y-1/2 text-sm text-[#5f6368]"
          }`}
        >
          {displayLabel}
        </label>
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showPassword}
          onChange={(e) => setShowPassword(e.target.checked)}
          className="w-4 h-4 rounded border-[#5f6368] accent-[#1a73e8]"
        />
        <span className="text-sm text-[#202124]">Show password</span>
      </label>
    </div>
  );
}

/* ── Floating-label input (Google style) ── */

export function InputField({
  label = "",
  placeholder = "",
  type = "text",
  value = "",
  onChange = () => {},
  autoFocus = false,
  autoComplete = "off",
  required = false,
}) {
  const [focused, setFocused] = useState(false);
  const displayLabel = label || placeholder;
  const floated = focused || (value && value.length > 0);

  return (
    <div className={`relative rounded-lg border transition-colors ${focused ? "border-[#1a73e8]" : "border-[#80868b]"}`}>
      <input
        type={type}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        placeholder=""
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        className="w-full h-14 px-4 pt-4 bg-transparent text-sm text-[#202124] outline-none"
      />
      <label
        className={`absolute left-3 transition-all duration-150 pointer-events-none bg-white px-1 ${
          floated
            ? "top-0 -translate-y-1/2 text-xs text-[#1a73e8]"
            : "top-1/2 -translate-y-1/2 text-sm text-[#5f6368]"
        }`}
      >
        {displayLabel}
      </label>
    </div>
  );
}