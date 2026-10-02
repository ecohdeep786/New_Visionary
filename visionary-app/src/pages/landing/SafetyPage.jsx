import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, Check, Eye, Flag, Lock, ShieldCheck, UsersRound,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import SpotIllustration from "@/components/landing/SpotIllustration";
import { LEGAL_META, RESPONSE_TIMES } from "@/data/legalMeta";

/* ═══ Tokens — the shared Material dialect (#202124 ink, #0b57d0/#1a73e8
   actions, #e8eaed hairlines, pill buttons, rounded-2xl cards). ═══ */
const FONT = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";
const SAFETY_EMAIL = "safety@visionary.org.in";

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

/* The reference's on-page anchor chips */
function AnchorChip({ href, children }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-9 items-center rounded-full border border-[#dadce0] bg-white px-4 text-[13px] font-medium text-[#5f6368] transition-colors hover:bg-[#f1f3f4] hover:text-[#202124] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
    >
      {children}
    </a>
  );
}

/* Device-style frame — the reference's phone mockups, drawn in our voice */
function DeviceFrame({ subject, tint, title, className = "" }) {
  return (
    <div className={`relative mx-auto w-full max-w-[320px] ${className}`}>
      <div className="rounded-[36px] border-[5px] border-[#202124] bg-white p-4 pb-7 shadow-[0_2px_12px_rgba(32,33,36,0.08)]">
        <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-[#e8eaed]" />
        <div className="flex items-center justify-center rounded-[22px] py-2" style={{ backgroundColor: tint }}>
          <SpotIllustration subject={subject} className="h-[170px] w-[170px]" title={title} />
        </div>
      </div>
    </div>
  );
}

/* ═══ BUILT-IN PROTECTIONS — the reference's alternating feature rows ═══ */
const PROTECTIONS = [
  {
    eyebrow: "Age-aware experiences", subject: "shield", tint: "#F1F1F4",
    title: <>Safety that fits <span className="text-[#0b57d0]">the learner.</span></>,
    copy: "Safety guidance and product boundaries follow the learner's age and context: a twelve-year-old and an adult professional see different guardrails for the same question.",
    visualSide: "right",
  },
  {
    eyebrow: "Safe by default", subject: "lock", tint: "#F1F1F4",
    title: <>On from the <span className="text-[#0b57d0]">first question.</span></>,
    copy: "Core safeguards are part of the experience from the beginning. Families and organizations can add boundaries, but the default is already safe.",
    visualSide: "left",
  },
  {
    eyebrow: "Private by design", subject: "eye", tint: "#F1F1F4",
    title: <>Your memory is <span className="text-[#0b57d0]">yours.</span></>,
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
    eyebrow: "Flag", subject: "flag", tint: "#F1F1F4",
    title: "One tap to flag anything",
    copy: "Every answer can be flagged in one tap, from any persona. Flagging is always available: no special mode, no forms to find.",
    link: { to: "/community", label: "How moderation works" },
  },
  {
    eyebrow: "Review", subject: "safety", tint: "#F1F1F4",
    title: "A human reads every report",
    copy: RESPONSE_TIMES.safety + " Automated filters help, but a person decides what stayed wrong and what changes.",
    link: { to: "/contact", label: "Contact the safety team" },
  },
  {
    eyebrow: "Policy", subject: "document", tint: "#F1F1F4",
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
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}>
      <LandingNav />
      <main id="main">
        <Breadcrumb page="Safety" />

        {/* HERO — the reference's shield badge + two-tone heading + chips */}
        <section className="px-6 pb-12 pt-8 sm:px-8 lg:px-10 lg:pb-16">
          <Reveal className="mx-auto max-w-[880px]">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0b57d2] text-white shadow-[0_2px_8px_rgba(11,87,210,0.3)]">
              <ShieldCheck className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h1 className="mt-7 text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px] text-[#202124]">
              Safe by design,<br />
              <span className="text-[#0b57d0]">for every learner.</span>
            </h1>
            <p className="mt-6 max-w-[560px] text-[16px] leading-[1.7] text-[#5f6368] sm:text-[17px]">
              Protection is on from the start. See how it works and what you control.
            </p>
            <nav aria-label="On this page" className="mt-7 flex flex-wrap gap-2">
              <AnchorChip href="#protections">Built-in protections</AnchorChip>
              <AnchorChip href="#family">Family controls</AnchorChip>
              <AnchorChip href="#reporting">Reporting &amp; review</AnchorChip>
              <AnchorChip href="#share">Before you share</AnchorChip>
            </nav>
          </Reveal>
        </section>

        {/* STATEMENT + ICON STRIP — the reference's icon row */}
        <section aria-labelledby="statement-title" className="px-6 pb-20 sm:px-8 lg:px-10 lg:pb-28">
          <Reveal className="mx-auto max-w-[880px] text-center">
            <h2 id="statement-title" className="text-[clamp(24px,3vw,34px)] font-normal leading-[1.25] tracking-[-0.025em] text-[#202124]">
              The questions you ask every day, <span className="text-[#0b57d0]">safer in all kinds of ways.</span>
            </h2>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              {[ShieldCheck, Lock, Eye, Flag, UsersRound].map((Icon, i) => (
                <span key={i} className="flex h-12 w-12 items-center justify-center rounded-[14px] g-card text-[#0b57d0] shadow-[0_1px_3px_rgba(60,64,67,0.08)]">
                  <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-[640px] text-[15px] leading-[1.75] text-[#5f6368]">
              You shouldn't have to configure safety. It should be there before you ask your first question, and visible enough to check.
            </p>
          </Reveal>
        </section>

        {/* BUILT-IN PROTECTIONS — the reference's alternating rows */}
        <section id="protections" aria-labelledby="protections-title" className="scroll-mt-28 border-t border-[#e8eaed] px-6 py-24 lg:py-32 sm:px-8 lg:px-10 lg:py-32">
          <Reveal className="mx-auto max-w-[1080px]">
            <h2 id="protections-title" className="sr-only">Built-in protections</h2>
            <div className="grid gap-16 lg:gap-24">
              {PROTECTIONS.map((row) => (
                <div key={row.eyebrow} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
                  <div className={row.visualSide === "left" ? "lg:order-2" : ""}>
                    <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">{row.eyebrow}</p>
                    <h3 className="mt-3 text-[28px] font-normal leading-[1.2] tracking-[-0.025em] text-[#202124] sm:text-[36px]">
                      {row.title}
                    </h3>
                    <p className="mt-4 max-w-[480px] text-[15px] leading-[1.75] text-[#5f6368] sm:text-[16px]">{row.copy}</p>
                  </div>
                  <Reveal delay={120} className={row.visualSide === "left" ? "lg:order-1" : ""}>
                    <DeviceFrame subject={row.subject} tint={row.tint} title={row.eyebrow} />
                  </Reveal>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* FAMILY CONTROLS — the reference's centered heading + action cards */}
        <section id="family" aria-labelledby="family-title" className="scroll-mt-28 border-t border-[#e8eaed] bg-[#f8f9fa] px-6 py-24 lg:py-32 sm:px-8 lg:px-10 lg:py-32">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="mx-auto max-w-[760px] text-center">
              <h2 id="family-title" className="text-[32px] font-normal leading-[1.18] tracking-[-0.03em] text-[#202124] sm:text-[44px]">
                Set boundaries that are<br className="hidden sm:block" />
                <span className="text-[#0b57d0]"> right for your family.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-[620px] text-[15px] leading-[1.75] text-[#5f6368] sm:text-[16px]">
                We work directly with the realities of family learning: children in classrooms, parents who want visibility, and organizations that need patterns without privacy trade-offs.
              </p>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {FAMILY_CARDS.map(({ Icon, eyebrow, to, title, copy }) => (
                <Link key={title} to={to} aria-label={title} className="group relative flex min-h-[280px] flex-col overflow-hidden rounded-2xl g-card bg-white p-6 pb-14 sm:p-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f0fe] text-[#0b57d0]">
                    <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#5f6368]">{eyebrow}</p>
                  <h3 className="mt-1.5 text-[17px] font-medium leading-[1.4] text-[#202124]">{title}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-[1.65] text-[#5f6368]">{copy}</p>
                  {/* google.com card curve — the section background sweeps into
                      the corner and the card's destination floats in it with breath */}
                  <div aria-hidden="true" className="absolute bottom-0 right-0 h-[56px] w-[92px] rounded-tl-[20px] bg-[#f8f9fa]" />
                  <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center"><ArrowUpRight className="h-5 w-5 text-[#0b57d0] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" aria-hidden="true" /></div>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>

        {/* REPORTING & REVIEW — the reference's eyebrow cards */}
        <section id="reporting" aria-labelledby="reporting-title" className="scroll-mt-28 px-6 py-24 lg:py-32 sm:px-8 lg:px-10 lg:py-32">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="mx-auto max-w-[760px] text-center">
              <h2 id="reporting-title" className="text-[32px] font-normal leading-[1.18] tracking-[-0.03em] text-[#202124] sm:text-[44px]">
                Seen something wrong? <span className="text-[#0b57d0]">Flag it.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-[600px] text-[15px] leading-[1.75] text-[#5f6368] sm:text-[16px]">
                Reporting is one tap away everywhere in the product, and a person reads every report, not a queue.
              </p>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {REPORTING_CARDS.map(({ eyebrow, subject, tint, title, copy, link }) => (
                <Link key={eyebrow} to={link.to} aria-label={link.label} className="group relative flex min-h-[340px] flex-col overflow-hidden rounded-2xl g-card p-6 pb-14 sm:p-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
                  <span className="flex h-[120px] w-[120px] items-center justify-center rounded-[24px]" style={{ backgroundColor: tint }}>
                    <SpotIllustration subject={subject} className="h-[88px] w-[88px]" title={eyebrow} />
                  </span>
                  <p className="mt-5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#5f6368]">{eyebrow}</p>
                  <h3 className="mt-1.5 text-[17px] font-medium leading-[1.4] text-[#202124]">{title}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-[1.65] text-[#5f6368]">{copy}</p>
                  <div aria-hidden="true" className="absolute bottom-0 right-0 h-[56px] w-[92px] rounded-tl-[20px] bg-white" />
                  <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center"><ArrowUpRight className="h-5 w-5 text-[#0b57d0] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" aria-hidden="true" /></div>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>

        {/* BEFORE YOU SHARE — the reference's checklist band */}
        <section id="share" className="scroll-mt-28 px-6 pb-20 sm:px-8 lg:px-10 lg:pb-28">
          <Reveal className="mx-auto max-w-[1080px]">
            <div className="rounded-[28px] bg-[#e8f0fe] px-8 py-12 sm:px-12 lg:py-14">
              <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
                <div>
                  <h2 className="text-[26px] font-normal leading-[1.2] tracking-[-0.025em] text-[#202124] sm:text-[34px]">
                    Three checks before you share anything.
                  </h2>
                  <p className="mt-4 max-w-[420px] text-[15px] leading-[1.7] text-[#3c4043]">
                    Most safety problems start with a message that felt urgent. Slow down, run the checks, and stay in control of your account.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <a
                      href={`mailto:${SAFETY_EMAIL}?subject=${encodeURIComponent("Safety concern")}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0b57d2] px-5 text-[14px] font-medium text-white transition-all hover:bg-[#0a4cb8] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2"
                    >
                      Report something suspicious
                    </a>
                    <Link
                      to="/privacy"
                      className="inline-flex min-h-11 items-center rounded-full border border-[#202124]/30 px-5 text-[14px] font-medium text-[#202124] transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
                    >
                      Read the privacy policy
                    </Link>
                  </div>
                </div>
                <ul className="space-y-3">
                  {SHARE_CHECKS.map((check) => (
                    <li key={check} className="flex items-start gap-3 rounded-2xl bg-white/80 p-5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#188038] text-white" aria-hidden="true">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      <span className="text-[14px] leading-[1.65] text-[#3c4043]">{check}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </section>

        {/* LAST UPDATED — the trust meta line */}
        <p className="px-6 pb-4 text-center text-[13px] tracking-[0.24px] text-[#5f6368] sm:px-8">
          Last updated: <strong className="font-medium text-[#121317]">{LEGAL_META.safety.lastUpdated}</strong>
        </p>

        {/* CLOSING — the reference's blue band, in our rounded card */}
        <section aria-labelledby="closing-title" className="px-6 py-12 sm:px-8 lg:px-10 lg:py-16">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="relative overflow-hidden rounded-[28px] bg-[#e8f0fe] px-8 py-14 text-center sm:px-12 lg:py-16">
              <h2 id="closing-title" className="mx-auto max-w-[680px] text-[clamp(28px,3.6vw,42px)] font-normal leading-[1.12] tracking-[-0.03em] text-[#202124]">
                Discover more ways we keep learning safe.
              </h2>
              <p className="mx-auto mt-4 max-w-[520px] text-[15px] leading-[1.7] text-[#3c4043]">
                Tour the product's guardrails end to end, or write to the safety team directly. A human reads every message.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={`mailto:${SAFETY_EMAIL}?subject=${encodeURIComponent("Safety concern")}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 text-[14px] font-medium text-[#0b57d2] shadow-[0_1px_3px_rgba(60,64,67,0.2)] transition-all hover:shadow-[0_2px_8px_rgba(32,33,36,0.16)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2"
                >
                  Contact the safety team <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <Link
                  to="/how-it-works"
                  className="inline-flex min-h-11 items-center rounded-full border border-[#202124]/30 px-6 text-[14px] font-medium text-[#202124] transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
                >
                  Explore how it works
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
