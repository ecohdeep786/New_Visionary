import { Link } from "react-router-dom";
import HeroFanCards from "@/components/landing/HeroFanCards";
import { ChevronIcon } from "@/components/landing/persona/PersonaSections";
import { fontStack } from "@/components/landing/system/tokens";


/* ── Fan cards: every main category plus the sub-categories used on each
      category page. All sub-category cards redirect to their main category
      page — no separate sub-pages exist. ── */
const FAN_GROUPS = [
  { to: "/student", label: "Students", subject: "student", tint: "rgba(0,102,204,0.10)", subs: [["Primary", "math"], ["Secondary", "physics"], ["Higher secondary", "chemistry"], ["Competitive exams", "flag"], ["Vocational and skills", "build"], ["Higher education", "research"], ["Learning on your own", "loop"]] },
  { to: "/teacher", label: "Teachers", subject: "teacher", tint: "#e9f5ef", subs: [["Lesson planning", "document"], ["In class", "ask"], ["Checking understanding", "practice"], ["Adapting", "compass"], ["Supporting individuals", "handshake"], ["Growing", "growth"]] },
  { to: "/parent", label: "Parents", subject: "parent", tint: "#fef3df", subs: [["Early years", "learn"], ["Primary", "math"], ["Secondary", "physics"], ["Higher secondary", "chemistry"]] },
  { to: "/professional", label: "Professionals", subject: "briefcase", tint: "#f3edff", subs: [["Early career", "growth"], ["Mid-Level", "practice"], ["Senior", "compass"], ["Leadership", "handshake"], ["Specialist", "research"], ["Entrepreneur", "build"]] },
  { to: "/organization", label: "Organizations", subject: "team", tint: "#fcebe8", subs: [["Schools", "student"], ["Colleges and universities", "research"], ["Coaching", "practice"], ["Workplace learning", "computerScience"]] },
];

const STRIP_CARDS = FAN_GROUPS.flatMap((group) => [
  { to: group.to, label: group.label, subject: group.subject, tint: group.tint },
  ...group.subs.map(([label, subject]) => ({ to: group.to, label, subject, tint: group.tint })),
]);

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

/* ── Main hero — the communities.google layout: centered eyebrow, statement,
      and CTAs first, then the full-width fanned card strip with paging. ── */
export default function AboutUsHero() {
  return (
    <section
      data-section="01-hero"
      className="relative overflow-hidden bg-white"
      style={{
        fontFamily: fontStack,
        paddingTop: "calc(64px + 168px)",
        paddingBottom: "40px",
      }}
    >
      <div className="mx-auto max-w-[1240px] px-6 sm:px-8 lg:px-10">
        <p className="text-center text-[12px] font-medium uppercase tracking-[0.15em] text-[#6e6e73]">About Visionary</p>
        <div className="mx-auto mt-6 max-w-[1120px] text-center">
          <h1 className="max-w-[960px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] text-[#1d1d1f] sm:text-[64px] lg:text-[76px]">
            Helping people turn questions into <span className="accent-gradient">understanding.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-[760px] text-[17.5px] leading-[25px] text-[#6e6e73]">
            A learning product for people who want to understand, practise, and apply what they learn.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/how-it-works"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#1d1d1f] px-7 text-[15px] font-medium tracking-[0.24px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4"
            >
              See how it works
            </Link>
            <ArrowLink to="/research">Explore our approach</ArrowLink>
          </div>
        </div>
      </div>

      {/* Fanned card strip — full page width, drifting anticlockwise */}
      <div className="mt-14">
        <HeroFanCards items={STRIP_CARDS} ariaLabel="Explore Visionary by category" />
      </div>
    </section>
  );
}
