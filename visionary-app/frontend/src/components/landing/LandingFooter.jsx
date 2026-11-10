import { Link } from "react-router-dom";
import { fontStack } from "@/components/landing/system/tokens";

const C = { ink: "#1d1d1f", graphite: "#1d1d1f", slate: "#6e6e73", mist: "#d2d2d7", white: "#ffffff", blue: "#0066cc" };

const FOOTER_LINK =
  "-mx-3 inline-flex min-h-11 items-center rounded-full px-3 text-[16px] font-normal tracking-[0.24px] transition-colors hover:bg-white hover:text-[#1d1d1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]";

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
      { label: "Download Visionary", to: "/download" },
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
    title: "Partners and support",
    links: [
      { label: "Help center", to: "/help" },
      { label: "Contact sales", to: "/contact" },
      { label: "Partner program", to: "/partners" },
      { label: "Find a partner", to: "/partners" },
      { label: "Sign up for updates", to: "/updates" },
    ],
  },
  {
    title: "Trust and legal",
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
  /* The public site is English. Real language support (English, Hindi,
     Bengali) lives in the signed-in workspace and onboarding, where the
     choice changes content. A footer selector that only set <html lang>
     and a storage key nothing read was removed as a false affordance
     (F-31: do not label unimplemented translations as available). */
  return (
    /* Apple's global footer surface: #F5F5F7, hairline seams, quiet link
       columns — sized for legibility (15px rows on 44px targets), so the
       page ends in air, not a logo. */
    <footer className="border-t" style={{ fontFamily: fontStack, backgroundColor: "#F5F5F7", borderColor: "#d2d2d7" }}>
      <div className="public-frame public-frame-wide pt-16">
        <div className="grid grid-cols-2 gap-10 border-t pb-16 sm:grid-cols-3 lg:grid-cols-5 lg:gap-8" style={{ borderColor: "#d2d2d7" }}>
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="pt-10">
              <h3 className="mb-4 text-[13px] font-semibold tracking-[-0.010em]" style={{ color: C.ink }}>{section.title}</h3>
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
      <div className={`border-t ${quiet ? "" : "mt-12"}`} style={{ borderColor: "#d2d2d7" }}>
        <div className="public-frame public-frame-wide flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <p className="text-[13px] tracking-[0.24px]" style={{ color: C.slate }}>© {new Date().getFullYear()} Visionary. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.label} to={link.to || "#"} className="inline-flex min-h-11 items-center text-[14px] tracking-[0.2px] transition-colors hover:text-[#1d1d1f]" style={{ color: C.ink }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
