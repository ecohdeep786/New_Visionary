import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import HeroFanCards from "@/components/landing/HeroFanCards";

const FONT = "'Google Sans Flex', 'Google Sans', 'DM Sans', system-ui, sans-serif";

/* ── Fan cards: every main category plus the sub-categories used on each
      category page. All sub-category cards redirect to their main category
      page — no separate sub-pages exist. ── */
const FAN_GROUPS = [
  { to: "/student", label: "Students", subject: "student", tint: "#e8f0fe", subs: [["Primary", "math"], ["Secondary", "physics"], ["Higher secondary", "chemistry"], ["Competitive exams", "flag"], ["Vocational and skills", "build"], ["Higher education", "research"], ["Learning on your own", "loop"]] },
  { to: "/teacher", label: "Teachers", subject: "teacher", tint: "#e9f5ef", subs: [["Lesson planning", "document"], ["In class", "ask"], ["Checking understanding", "practice"], ["Adapting", "compass"], ["Supporting individuals", "handshake"], ["Growing", "growth"]] },
  { to: "/parent", label: "Parents", subject: "parent", tint: "#fef3df", subs: [["Early years", "learn"], ["Primary", "math"], ["Secondary", "physics"], ["Higher secondary", "chemistry"]] },
  { to: "/professional", label: "Professionals", subject: "briefcase", tint: "#f3edff", subs: [["Early career", "growth"], ["Mid-Level", "practice"], ["Senior", "compass"], ["Leadership", "handshake"], ["Specialist", "research"], ["Entrepreneur", "build"]] },
  { to: "/organization", label: "Organizations", subject: "team", tint: "#fcebe8", subs: [["Schools", "student"], ["Colleges and universities", "research"], ["Coaching", "practice"], ["Workplace learning", "computerScience"]] },
];

const STRIP_CARDS = FAN_GROUPS.flatMap((group) => [
  { to: group.to, label: group.label, subject: group.subject, tint: group.tint },
  ...group.subs.map(([label, subject]) => ({ to: group.to, label, subject, tint: group.tint })),
]);

/* ── ArrowLink ── */
function ArrowLink({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`group inline-flex min-h-11 items-center gap-2 rounded-sm text-[15px] font-medium text-[#0b57d0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-4 ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}

/* ── Main hero — the communities.google layout: centered eyebrow, statement,
      and CTAs first, then the full-width fanned card strip with paging. ── */
export default function AboutUsHero() {
  return (
    <section
      className="relative overflow-hidden border-b border-[#e8eaed] bg-white"
      style={{
        fontFamily: FONT,
        paddingTop: "calc(64px + 168px)",
        paddingBottom: "40px",
      }}
    >
      <div className="mx-auto max-w-[1240px] px-6 sm:px-8 lg:px-10">
        <p className="text-center text-[12px] font-medium uppercase tracking-[0.15em] text-[#5f6368]">About Visionary</p>
        <div className="mx-auto mt-6 max-w-[1120px] text-center">
          <h1 className="max-w-[960px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] text-[#202124] sm:text-[64px] lg:text-[76px]">
            Helping people turn questions into <span className="accent-gradient">understanding.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-[760px] text-[20px] leading-[1.55] text-[#3c4043] sm:text-[24px]">
            A learning product for people who want to understand, practise, and apply what they learn.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/how-it-works"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#121317] px-7 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#2c2d31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-4"
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
