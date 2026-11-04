import { Link } from "react-router-dom";
import HeroFanCards from "@/components/landing/HeroFanCards";
import { ChevronIcon } from "@/components/landing/persona/PersonaSections";
import { fontStack } from "@/components/landing/system/tokens";


/* ── Fan cards — one card per main category, in cycle order. The strip
      repeats this five-card cycle across the fan (communities.google
      repeats its five programmes the same way), so every visible window
      mixes all five tints. Sub-category cards all redirect to these same
      five pages, so the mains carry the navigation. ── */
const FAN_GROUPS = [
  { to: "/student", label: "Students", subject: "student", tint: "rgba(0,102,204,0.10)" },
  { to: "/teacher", label: "Teachers", subject: "teacher", tint: "#e9f5ef" },
  { to: "/parent", label: "Parents", subject: "parent", tint: "#fef3df" },
  { to: "/professional", label: "Professionals", subject: "briefcase", tint: "#f3edff" },
  { to: "/organization", label: "Organizations", subject: "team", tint: "#fcebe8" },
];

const HERO_FAN_CARDS = FAN_GROUPS.map((group) => ({
  to: group.to,
  label: group.label,
  subject: group.subject,
  tint: group.tint,
}));

/* ── ArrowLink — the site's quiet link: ink blue with the chevron ── */
function ArrowLink({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`group inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4 ${className}`}
    >
      {children}
      <ChevronIcon className="h-4 w-4" />
    </Link>
  );
}

/* ── Main hero — the communities.google layout, voiced for an about page:
      a centered tag, statement, and one quiet wayfinding link (no
      conversion pair — this page explains, the fan carries the nav), then
      the static fanned card strip with Google's balanced beats. ── */
export default function AboutUsHero() {
  return (
    <section
      data-section="01-hero"
      className="relative overflow-hidden bg-white"
      style={{
        fontFamily: fontStack,
        /* Top air: the communities hero carries ~177px of nav-to-heading
           breath at 1440 — the grand opener an about page deserves. */
        paddingTop: "clamp(7.5rem, 12.5vw, 12rem)",
        paddingBottom: "clamp(4.5rem, 6vw, 6rem)",
      }}
    >
      <div className="mx-auto max-w-[1240px] px-6 sm:px-8 lg:px-10">
        <p data-type="label" className="text-center text-[#6e6e73]">About Visionary</p>
        {/* Google communities hero rhythm — big air above the unit, one tight
            beat from heading to subhead, one moderate beat to the quiet
            link, then the wide breath before the card field. */}
        <div className="mx-auto mt-6 max-w-[1120px] text-center">
          <h1 className="mx-auto max-w-[960px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] text-[#1d1d1f] sm:text-[64px] lg:text-[76px]">
            Understanding. <span className="accent-gradient">Built in.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[760px] text-[17px] leading-[25px] text-[#6e6e73]">
            A learning product for people who want to understand, practise, and apply what they learn.
          </p>
          <div className="mt-6 flex justify-center">
            <ArrowLink to="/research">Explore our approach</ArrowLink>
          </div>
        </div>
      </div>

      {/* Fanned card strip — static centered fan, bleeding off both edges */}
      <div className="mt-24">
        <HeroFanCards items={HERO_FAN_CARDS} ariaLabel="Explore Visionary by category" />
      </div>
    </section>
  );
}
