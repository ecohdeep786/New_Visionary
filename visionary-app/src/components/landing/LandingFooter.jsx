import { Link } from "react-router-dom";
import { Youtube, Twitter, Linkedin, Instagram, Globe } from "lucide-react";

const FONT = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";
const C = { ink: "#121317", graphite: "#3c4043", slate: "#5f6368", mist: "#dadce0", white: "#ffffff", blue: "#4285F4" };

const FOOTER_LINK =
  "-mx-3 inline-block rounded-full px-3 py-1.5 text-[14px] font-normal tracking-[0.24px] transition-colors hover:bg-white hover:text-[#121317] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]";

/* 4-column directory per final IA */
const FOOTER_SECTIONS = [
  {
    title: "Company",
    links: [
      { label: "About Visionary", to: "/about" },
      { label: "Our mission", to: "/about#mission" },
      { label: "Team", to: "/about#team" },
      { label: "Careers", to: "/careers" },
      { label: "Press", to: "/press" },
      { label: "Research", to: "/research" },
      { label: "Stories", to: "/stories" },
      { label: "Brand resources", to: "/brand" },
    ],
  },
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
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", to: "/help" },
      { label: "Documentation", to: "/docs" },
      { label: "Status", to: "/status" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Trust & Legal",
    links: [
      { label: "Safety", to: "/safety" },
      { label: "Privacy", to: "/privacy" },
      { label: "Security", to: "/safety#security" },
      { label: "Accessibility", to: "/safety#accessibility" },
      { label: "Terms", to: "/terms" },
      { label: "Cookies", to: "/cookies" },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: "YouTube", Icon: Youtube },
  { label: "Twitter", Icon: Twitter },
  { label: "LinkedIn", Icon: Linkedin },
  { label: "Instagram", Icon: Instagram },
];

const LEGAL_LINKS = [
  { label: "Privacy policy", to: "/privacy" },
  { label: "Terms of service", to: "/terms" },
  { label: "Cookie policy", to: "/cookies" },
  { label: "Sitemap" },
];

export default function LandingFooter({ variant = "brand" }) {
  const quiet = variant === "quiet";
  return (
    <footer className="border-t" style={{ fontFamily: FONT, backgroundColor: C.white, borderColor: C.mist }}>
      <div className="w-full px-6 pt-12 lg:px-10">
        {/* TOP ROW: social + language */}
        <div className="flex items-start justify-between gap-6 pb-12">
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map(({ label, Icon }) => (
              <a key={label} href="#" aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full border bg-white transition-colors hover:border-[#4285F4] hover:text-[#4285F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                style={{ borderColor: C.mist, color: C.slate }}>
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </a>
            ))}
          </div>
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border bg-white py-1 pl-4 pr-2 focus-within:ring-2 focus-within:ring-[#4285F4]" style={{ borderColor: C.mist }}>
            <Globe className="h-4 w-4" style={{ color: C.slate }} />
            <select defaultValue="en" aria-label="Select language" className="cursor-pointer bg-transparent py-1.5 pr-1 text-[13px] tracking-[0.24px] focus:outline-none" style={{ color: C.graphite }}>
              <option value="en">English (United States)</option>
              <option value="hi">हिन्दी</option>
              <option value="bn">বাংলা</option>
              <option value="ta">தமிழ்</option>
              <option value="te">తెలుగు</option>
              <option value="mr">मराठी</option>
            </select>
          </label>
        </div>

        {/* 4-column directory */}
        <div className="grid grid-cols-2 gap-10 border-t pb-16 sm:grid-cols-3 lg:grid-cols-4 lg:gap-8" style={{ borderColor: C.mist }}>
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
            <p aria-hidden="true" className="select-none whitespace-nowrap text-center font-medium leading-[0.95] tracking-[-0.02em] text-[clamp(64px,15vw,260px)]" style={{ color: C.ink }}>
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