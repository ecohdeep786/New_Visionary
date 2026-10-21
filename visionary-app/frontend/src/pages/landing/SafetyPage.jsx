import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check, Eye, Flag, Lock, ShieldCheck, UsersRound,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import ValuesStrip from "@/components/landing/ValuesStrip";
import SpotIllustration from "@/components/landing/SpotIllustration";
import { ChevronIcon } from "@/components/landing/persona/PersonaSections";
import { LEGAL_META, RESPONSE_TIMES } from "@/data/legalMeta";
import { fontStack } from "@/components/landing/system/tokens";

/* ═══ Tokens — the shared public dialect (#1d1d1f ink pills, #0066cc quiet
   links, #f5f5f7 grounds, borderless white cards). ═══ */
const SAFETY_EMAIL = "safety@visionary.org.in";

/* ═══ Link, pill and chip grammar — the approved public classes, verbatim ═══ */
const quietLink = "inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4";
const inkPill = "inline-flex min-h-12 items-center justify-center rounded-full bg-[#1d1d1f] px-7 text-[15px] font-medium tracking-[0.24px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4";
const chipPill = "inline-flex min-h-11 items-center rounded-full bg-[#f5f5f7] px-6 text-[15px] font-medium tracking-[0.24px] text-[#1d1d1f] transition-colors duration-200 hover:bg-[#e8e8ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4";

/* ═══ Motion — reveal on first scroll into view (shared reveal grammar,
   motion-reduce safe). ═══ */
function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") { setShown(true); return undefined; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); observer.disconnect(); } },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-700 ease-google motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* Device-style frame — the reference's phone mockups, redrawn as quiet tinted
   illustration panels in our voice */
function DeviceFrame({ subject, title, className = "" }) {
  return (
    <div className={`mx-auto flex w-full max-w-[320px] items-center justify-center rounded-[24px] bg-[#f5f5f7] py-16 ${className}`}>
      <SpotIllustration subject={subject} className="h-[170px] w-[170px]" title={title} />
    </div>
  );
}

/* ═══ BUILT-IN PROTECTIONS — the reference's alternating feature rows ═══ */
const PROTECTIONS = [
  {
    eyebrow: "Age-aware experiences", subject: "shield",
    title: <>Safety that fits <span className="text-[#0066cc]">the learner.</span></>,
    copy: "Safety guidance and product boundaries follow the learner's age and context: a twelve-year-old and an adult professional see different guardrails for the same question.",
    visualSide: "right",
  },
  {
    eyebrow: "Safe by default", subject: "lock",
    title: <>On from the <span className="text-[#0066cc]">first question.</span></>,
    copy: "Core safeguards are part of the experience from the beginning. Families and organizations can add boundaries, but the default is already safe.",
    visualSide: "left",
  },
  {
    eyebrow: "Private by design", subject: "eye",
    title: <>Your memory is <span className="text-[#0066cc]">yours.</span></>,
    copy: "Parents follow progress through consent-based summaries. Organizations see patterns across cohorts, never an individual learner's answers. Details live in the privacy policy.",
    visualSide: "right",
  },
];

/* ═══ FAMILY CONTROLS — the reference's action cards ═══ */
const FAMILY_CARDS = [
  {
    Icon: Eye, eyebrow: "For parents", to: "/parent", linkLabel: "See parent features",
    title: "Consent-scoped progress summaries",
    copy: "Parents and guardians follow the journey with confidence: summaries shaped by consent, without opening the learner's private space.",
  },
  {
    Icon: UsersRound, eyebrow: "For families", to: "/privacy", linkLabel: "Read the privacy policy",
    title: "Boundaries for younger learners",
    copy: "Set boundaries that shape what younger learners see and do, without changing the default safety posture for everyone else.",
  },
  {
    Icon: ShieldCheck, eyebrow: "For organizations", to: "/organization", linkLabel: "See organization features",
    title: "Aggregate insights, never individual answers",
    copy: "Institutions see patterns across cohorts to guide support. An individual learner's answers stay individual, by design.",
  },
];

/* ═══ REPORTING & REVIEW — the reference's eyebrow cards ═══ */
const REPORTING_CARDS = [
  {
    eyebrow: "Flag", subject: "flag",
    title: "One tap to flag anything",
    copy: "Every answer can be flagged in one tap, from any persona. Flagging is always available: no special mode, no forms to find.",
    link: { to: "/community", label: "How moderation works" },
  },
  {
    eyebrow: "Review", subject: "safety",
    title: "A human reads every report",
    copy: RESPONSE_TIMES.safety + " Automated filters help, but a person decides what stayed wrong and what changes.",
    link: { to: "/contact", label: "Contact the safety team" },
  },
  {
    eyebrow: "Policy", subject: "document",
    title: "Reviewed in the open",
    copy: "We review our safety policies regularly and update them as we learn from real use, just like the product itself. Changes land in the terms and policies you can read.",
    link: { to: "/terms", label: "Read the terms" },
  },
];

/* ═══ BEFORE YOU SHARE — the reference's checklist band ═══ */
const SHARE_CHECKS = [
  "Never share passwords, payment details, or sensitive learner information. Not with us, not with anyone.",
  "No one from Visionary will ever ask for your password or verification codes.",
  "If a message claims to be from Visionary and asks for those things, flag it and tell us.",
];

export default function SafetyPage() {
  return (
    <div className="page-safety min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main">
        <Breadcrumb page="Safety" />

        {/* HERO — the reference's shield badge + two-tone heading + jump chips */}
        <section data-section="01-hero" className="px-6 pb-14 pt-10 sm:px-8 lg:px-10 lg:pb-16 lg:pt-16">
          <Reveal className="mx-auto max-w-[880px]">
            <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#f5f5f7] text-[#0066cc]">
              <ShieldCheck className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h1 className="mt-7 text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px] text-[#1d1d1f]">
              Safe by design,<br />
              <span className="accent-gradient">for every learner.</span>
            </h1>
            <p className="mt-8 max-w-[760px] text-[17.5px] leading-[25px] text-[#6e6e73]">
              Protection is on from the start. See how it works and what you control.
            </p>
            <nav aria-label="On this page" className="mt-10 flex flex-wrap gap-4">
              <a href="#protections" className={chipPill}>Built-in protections</a>
              <a href="#family" className={chipPill}>Family controls</a>
              <a href="#reporting" className={chipPill}>Reporting &amp; review</a>
              <a href="#share" className={chipPill}>Before you share</a>
            </nav>
          </Reveal>
        </section>

        {/* STATEMENT + ICON STRIP — the reference's icon row */}
        <section data-section="02-statement" aria-labelledby="statement-title" className="px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[880px] text-center">
            <h2 id="statement-title" className="text-[clamp(24px,3vw,34px)] font-normal leading-[1.25] tracking-[-0.025em] text-[#1d1d1f]">
              The questions you ask every day, <span className="text-[#0066cc]">safer in all kinds of ways.</span>
            </h2>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              {[ShieldCheck, Lock, Eye, Flag, UsersRound].map((Icon, i) => (
                <span key={i} className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f5f7] text-[#0066cc]">
                  <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-[640px] text-[15px] leading-[1.75] text-[#6e6e73]">
              You shouldn't have to configure safety. It should be there before you ask your first question, and visible enough to check.
            </p>
          </Reveal>
        </section>

        {/* BUILT-IN PROTECTIONS — the reference's alternating rows */}
        <section id="protections" data-section="03-protections" aria-labelledby="protections-title" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1080px]">
            <h2 id="protections-title" className="sr-only">Built-in protections</h2>
            <div className="grid gap-16 lg:gap-24">
              {PROTECTIONS.map((row) => (
                <div key={row.eyebrow} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
                  <div className={row.visualSide === "left" ? "lg:order-2" : ""}>
                    <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#6e6e73]">{row.eyebrow}</p>
                    <h3 className="mt-3 text-[28px] font-normal leading-[1.2] tracking-[-0.025em] text-[#1d1d1f] sm:text-[36px]">
                      {row.title}
                    </h3>
                    <p className="mt-4 max-w-[480px] text-[15px] leading-[1.75] text-[#6e6e73] sm:text-[16px]">{row.copy}</p>
                  </div>
                  <Reveal delay={120} className={row.visualSide === "left" ? "lg:order-1" : ""}>
                    <DeviceFrame subject={row.subject} title={row.eyebrow} />
                  </Reveal>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* FAMILY CONTROLS — the reference's centered heading + action cards */}
        <section id="family" data-section="04-family" aria-labelledby="family-title" className="scroll-mt-28 bg-[#f5f5f7] px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="mx-auto max-w-[760px] text-center">
              <h2 id="family-title" className="text-[32px] font-normal leading-[1.18] tracking-[-0.03em] text-[#1d1d1f] sm:text-[44px]">
                Set boundaries that are<br className="hidden sm:block" />
                <span className="text-[#0066cc]"> right for your family.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-[620px] text-[15px] leading-[1.75] text-[#6e6e73] sm:text-[16px]">
                We work directly with the realities of family learning: children in classrooms, parents who want visibility, and organizations that need patterns without privacy trade-offs.
              </p>
            </div>
            <div className="mt-14 grid gap-3 md:grid-cols-3">
              {FAMILY_CARDS.map(({ Icon, eyebrow, to, linkLabel, title, copy }) => (
                <div key={title} className="flex min-h-[280px] flex-col rounded-[20px] bg-white p-6 sm:p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f5f7] text-[#0066cc]">
                    <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#6e6e73]">{eyebrow}</p>
                  <h3 className="mt-1.5 text-[17px] font-medium leading-[1.4] text-[#1d1d1f]">{title}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-[1.65] text-[#6e6e73]">{copy}</p>
                  <div className="mt-4">
                    <Link to={to} className={quietLink}>
                      {linkLabel}
                      <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* REPORTING & REVIEW — the reference's eyebrow cards */}
        <section id="reporting" data-section="05-reporting" aria-labelledby="reporting-title" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="mx-auto max-w-[760px] text-center">
              <h2 id="reporting-title" className="text-[32px] font-normal leading-[1.18] tracking-[-0.03em] text-[#1d1d1f] sm:text-[44px]">
                Seen something wrong? <span className="text-[#0066cc]">Flag it.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-[600px] text-[15px] leading-[1.75] text-[#6e6e73] sm:text-[16px]">
                Reporting is one tap away everywhere in the product, and a person reads every report, not a queue.
              </p>
            </div>
            <div className="mt-14 grid gap-3 md:grid-cols-3">
              {REPORTING_CARDS.map(({ eyebrow, subject, title, copy, link }) => (
                <div key={eyebrow} className="flex min-h-[340px] flex-col rounded-[20px] bg-white p-6 sm:p-7">
                  <span className="flex h-[120px] w-[120px] items-center justify-center">
                    <SpotIllustration subject={subject} className="h-[88px] w-[88px]" title={eyebrow} />
                  </span>
                  <p className="mt-5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#6e6e73]">{eyebrow}</p>
                  <h3 className="mt-1.5 text-[17px] font-medium leading-[1.4] text-[#1d1d1f]">{title}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-[1.65] text-[#6e6e73]">{copy}</p>
                  <div className="mt-4">
                    <Link to={link.to} className={quietLink}>
                      {link.label}
                      <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* BEFORE YOU SHARE — the reference's checklist band */}
        <section id="share" data-section="06-share" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1080px]">
            <div className="rounded-[30px] bg-[#f5f5f7] px-8 py-12 sm:px-12 lg:py-14">
              <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
                <div>
                  <h2 className="text-[26px] font-normal leading-[1.2] tracking-[-0.025em] text-[#1d1d1f] sm:text-[34px]">
                    Three checks before you share anything.
                  </h2>
                  <div className="mt-4 max-w-[420px]">
                    <p className="text-[15px] leading-[1.7] text-[#6e6e73]">
                      Most safety problems start with a message that felt urgent. Slow down, run the checks, and stay in control of your account.
                    </p>
                  </div>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <a
                      href={`mailto:${SAFETY_EMAIL}?subject=${encodeURIComponent("Safety concern")}`}
                      className={inkPill}
                    >
                      Report something suspicious
                    </a>
                    <Link to="/privacy" className={quietLink}>
                      Read the privacy policy
                      <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
                <ul className="space-y-3">
                  {SHARE_CHECKS.map((check) => (
                    <li key={check} className="flex items-start gap-3 rounded-[20px] bg-white p-5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#188038] text-white" aria-hidden="true">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      <span className="text-[14px] leading-[1.65] text-[#6e6e73]">{check}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </section>

        {/* LAST UPDATED — the trust meta line */}
        <p className="px-6 pb-4 text-center text-[13px] tracking-[0.24px] text-[#6e6e73] sm:px-8">
          Last updated: <strong className="font-medium text-[#1d1d1f]">{LEGAL_META.safety.lastUpdated}</strong>
        </p>

        {/* CLOSING — the reference's blue band, in our grey tray */}
        <section aria-labelledby="closing-title" data-section="07-closing" className="px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="rounded-[30px] bg-[#f5f5f7] px-8 py-14 text-center sm:px-12 lg:py-16">
              <h2 id="closing-title" className="mx-auto max-w-[680px] text-[clamp(28px,3.6vw,42px)] font-normal leading-[1.12] tracking-[-0.03em] text-[#1d1d1f]">
                Discover more ways we keep learning safe.
              </h2>
              <p className="mx-auto mt-4 max-w-[520px] text-[15px] leading-[1.7] text-[#1d1d1f]">
                Tour the product's guardrails end to end, or write to the safety team directly. A human reads every message.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a
                  href={`mailto:${SAFETY_EMAIL}?subject=${encodeURIComponent("Safety concern")}`}
                  className={inkPill}
                >
                  Contact the safety team
                </a>
                <Link to="/how-it-works" className={quietLink}>
                  Explore how it works
                  <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

      </main>
      <ValuesStrip current="/safety" />
      <LandingFooter variant="quiet" />
    </div>
  );
}
