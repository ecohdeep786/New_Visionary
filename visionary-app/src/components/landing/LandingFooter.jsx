import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";

const FONT = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";
const C = { ink: "#121317", graphite: "#3c4043", slate: "#5f6368", mist: "#dadce0", white: "#ffffff", blue: "#4285F4" };

const FOOTER_LINK =
  "-mx-3 inline-block rounded-full px-3 py-1.5 text-[14px] font-normal tracking-[0.24px] transition-colors hover:bg-white hover:text-[#121317] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]";

const FOOTER_SECTIONS = [
  {
    title: "Product",
    links: [
      { label: "Students", to: "/student" },
      { label: "Teachers", to: "/teacher" },
      { label: "Parents", to: "/parent" },
      { label: "Professionals", to: "/professional" },
      { label: "Organizations", to: "/organization" },
      { label: "How it works", to: "/how-it-works" },
      { label: "Download", to: "/download" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Visionary", to: "/about" },
      { label: "Our mission", to: "/about#mission" },
      { label: "Team", to: "/about#team" },
      { label: "Careers", to: "/careers" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Research", to: "/research" },
      { label: "Updates", to: "/updates" },
      { label: "Community", to: "/community" },
      { label: "Referral", to: "/referral" },
    ],
  },
  {
    title: "Partners & Support",
    links: [
      { label: "Help Center", to: "/help" },
      { label: "Contact & Sales", to: "/contact" },
      { label: "Partner program", to: "/partners" },
      { label: "Find a Partner", to: "/partners" },
      { label: "Sign up for updates", to: "/updates" },
    ],
  },
  {
    title: "Trust & Legal",
    links: [
      { label: "Safety", to: "/safety" },
      { label: "Privacy", to: "/privacy" },
      { label: "Security", to: "/security" },
      { label: "Accessibility", to: "/accessibility" },
      { label: "Terms", to: "/terms" },
      { label: "Cookies", to: "/cookies" },
    ],
  },
];

/* Social profiles ship only with real URLs (01-PM, Wave L1): no href="#" placeholders. */

const LEGAL_LINKS = [
  { label: "Privacy policy", to: "/privacy" },
  { label: "Terms of service", to: "/terms" },
  { label: "Cookie policy", to: "/cookies" },
  { label: "Accessibility", to: "/accessibility" },
];

export default function LandingFooter({ variant = "brand" }) {
  const quiet = variant === "quiet";
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem("visionary_lang") || "en"; } catch { return "en"; }
  });
  const onLanguageChange = (event) => {
    const code = event.target.value;
    setLanguage(code);
    try { localStorage.setItem("visionary_lang", code); } catch { /* storage unavailable */ }
    document.documentElement.lang = code;
  };
  return (
    <footer className="border-t" style={{ fontFamily: FONT, backgroundColor: C.white, borderColor: C.mist }}>
      <div className="w-full px-6 pt-12 lg:px-10">
        <div className="grid grid-cols-2 gap-10 border-t pb-16 sm:grid-cols-3 lg:grid-cols-5 lg:gap-8" style={{ borderColor: C.mist }}>
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="pt-10">
              <h4 className="mb-4 text-[12px] font-medium uppercase tracking-[0.43px]" style={{ color: C.ink }}>{section.title}</h4>
              <ul className="space-y-1">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to || "#"} className={FOOTER_LINK} style={{ color: C.graphite }}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Giant wordmark — brand pages only */}
        {!quiet && (
          <div className="mt-12 overflow-hidden px-2">
            <p aria-hidden="true" className="select-none whitespace-nowrap text-center font-medium leading-[0.9] tracking-[-0.02em] text-[clamp(22px,6vw,48px)]" style={{ color: C.ink }}>
              Visionary
            </p>
          </div>
        )}
      </div>

      {/* Hairline + legal band */}
      <div className={`border-t ${quiet ? "" : "mt-12"}`} style={{ borderColor: C.mist }}>
        <div className="flex w-full flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row lg:px-10">
          <p className="text-[12px] tracking-[0.24px]" style={{ color: C.slate }}>© {new Date().getFullYear()} Visionary. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <label className="flex items-center gap-1.5 text-[12px] tracking-[0.24px]" style={{ color: C.slate }}>
              <Globe className="h-3.5 w-3.5" style={{ color: C.slate }} />
              <span>Language:</span>
              <select value={language} onChange={onLanguageChange} aria-label="Select language" className="cursor-pointer bg-transparent text-[12px] tracking-[0.24px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: C.graphite }}>
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="bn">বাংলা</option>
                <option value="ta">தமிழ்</option>
                <option value="te">తెలుగు</option>
                <option value="mr">मराठी</option>
              </select>
            </label>
            {LEGAL_LINKS.map((link) => (
              <Link key={link.label} to={link.to || "#"} className="text-[13px] tracking-[0.2px] transition-colors hover:text-[#121317]" style={{ color: C.ink }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
