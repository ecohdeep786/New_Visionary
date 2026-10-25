import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, Check, ChevronLeft, ChevronRight, Clock, Compass,
  GraduationCap, Newspaper, UsersRound,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import QuietLink from "@/components/landing/QuietLink";
import LandingFAQ from "@/components/landing/LandingFAQ";
import SpotIllustration from "@/components/landing/SpotIllustration";
import { ChevronIcon } from "@/components/landing/persona/PersonaSections";
import { RESPONSE_TIMES } from "@/data/legalMeta";
import { fontStack } from "@/components/landing/system/tokens";

/* ═══ Tokens — the shared Material dialect (#1d1d1f ink, #0066cc/#0066cc
   actions, #d2d2d7 hairlines, pill buttons, rounded-2xl cards). ═══ */
const PARTNERS_EMAIL = "partnerships@visionary.org.in";

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
      className={`transition-[opacity,transform] duration-700 ease-apple motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* The outlined label chip from the reference's access-levels grid */
function AccessChip({ children }) {
  return (
    <span className="inline-flex items-center rounded-[12px] border border-[rgba(18,19,23,0.12)] bg-white px-2.5 py-1 apple-eyebrow text-[#1d1d1f]">
      {children}
    </span>
  );
}

/* ═══ WHO WE PARTNER WITH — the reference's 2×2 access-levels grid:
   illustration tile + outlined chip + copy, on a soft arc backdrop. ═══ */
const PARTNER_TYPES = [
  { subject: "learn", chip: "Schools & systems", copy: "Schools and educators can share the settings, cohorts, and outcomes they want us to understand, from a single classroom to a whole network." },
  { subject: "computerScience", chip: "Technology teams", copy: "Technology teams can explore integrations that make learning, identity, or administration easier to connect." },
  { subject: "languages", chip: "Regional & language experts", copy: "People with regional or language expertise can describe where existing learning experiences might not fit, and help shape what should exist instead." },
  { subject: "community", chip: "Institutions & organizations", copy: "Colleges, coaching institutes, and workplaces can explore a partnership around a specific learning need, audience, or implementation goal." },
];

/* ═══ WHAT A PARTNERSHIP INCLUDES — the reference's benefit columns ═══ */
const BENEFITS = [
  {
    Icon: GraduationCap, tile: "bg-[#f5f5f7] text-[#0066cc]", title: "Enablement & onboarding",
    items: [
      { t: "Walkthroughs for your team", d: "Sessions that take teachers and administrators through the learning loop: Learn, Ask, Practice, Build." },
      { t: "Classroom-ready setup guides", d: "Setup, cohort creation, and consent-based access, documented for your context." },
    ],
  },
  {
    Icon: UsersRound, tile: "bg-[#f5f5f7] text-[#0066cc]", title: "Co-design & pilot support",
    items: [
      { t: "A named point of contact", d: "One person accountable for the work, from the first call to the final review." },
      { t: "Scoped pilots with real classrooms", d: "Bounded rollouts with success measures agreed in writing before anything begins." },
    ],
  },
  {
    Icon: Newspaper, tile: "bg-[#f5f5f7] text-[#0066cc]", title: "Recognition and shared learning",
    items: [
      { t: "Co-publication of results", d: "Findings from pilots are written up and shared with your name on them, where both teams agree." },
      { t: "Early visibility of what is changing", d: "Roadmap changes that affect your rollout, before they reach the release notes." },
    ],
  },
];

/* ═══ ENGAGEMENT DEPTH — the reference's tier comparison table, mapped to
   an honest enquiry-based process: depth is agreed, not purchased. ═══ */
const DEPTH_TIERS = ["Conversation", "Scoped pilot", "Ongoing programme"];
const DEPTH_ROWS = [
  { label: "Named point of contact", reach: [true, true, true] },
  { label: "Product enablement for your team", reach: [true, true, true] },
  { label: "Scoped success measures", reach: [false, true, true] },
  { label: "Co-designed rollout plan", reach: [false, true, true] },
  { label: "Aggregate insights review", reach: [false, true, true] },
  { label: "Co-publication of results", reach: [false, false, true] },
];

/* ═══ HOW A PARTNERSHIP BEGINS — the multi-step journey ═══ */
const JOURNEY = [
  { n: "01", title: "Write to us", copy: `Send your organization, the learners you serve, and the idea you want to explore to ${PARTNERS_EMAIL}. Your email app opens a draft. Nothing is submitted from this page.` },
  { n: "02", title: "A context call", copy: "A short conversation about needs, constraints, and timing. " + RESPONSE_TIMES.partners },
  { n: "03", title: "A scoped pilot", copy: "Where the idea fits, we agree a bounded pilot: scope, responsibilities, privacy, costs, and success measures, in writing." },
  { n: "04", title: "Review, then begin", copy: "We start, review against the measures together, and decide what continues, with findings written up either way." },
];

/* ═══ CAROUSEL — the reference's "What is EMP?" slides:
   tinted circle backdrop + illustration left, title + copy right. ═══ */
const SLIDES = [
  {
    subject: "loop",
    title: "A source to grow learning capability",
    copy: "A partnership gives your team the guides and teaching materials to introduce Visionary and run the learning loop: Learn, Ask, Practise, Build.",
  },
  {
    subject: "languages",
    title: "Local context, real languages",
    copy: "Language journeys run in English, Hindi, and Bengali today. Regional partners help us see where learning experiences need to work differently.",
  },
  {
    subject: "research",
    title: "Evidence over claims",
    copy: "We study how people learn with Visionary and publish what we find. Partners see what worked, what did not, and what changed.",
  },
];

function WhatCarousel() {
  const [index, setIndex] = useState(0);
  const go = (next) => setIndex((next + SLIDES.length) % SLIDES.length);
  const arrowCls = "flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(18,19,23,0.12)] bg-white text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]";

  return (
    <div role="region" aria-roledescription="carousel" aria-label="What a Visionary partnership is">
      <div className="overflow-hidden" aria-live="polite">
        <div
          className="flex transition-transform duration-500 motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={slide.title}
              role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}`}
              aria-hidden={i !== index}
              className="w-full shrink-0"
            >
              <div className="grid items-center gap-10 md:grid-cols-[minmax(0,420px)_1fr] md:gap-16">
                <div className="flex justify-center">
                  <SpotIllustration
                    subject={slide.subject}
                    className="h-[240px] w-[240px] sm:h-[280px] sm:w-[280px]"
                    title={slide.title}
                  />
                </div>
                <div className="max-w-[520px]">
                  <h3 className="text-[28px] font-normal leading-[1.25] tracking-[-0.02em] text-[#1d1d1f]">
                    {slide.title}
                  </h3>
                  <p className="mt-4 text-[16px] leading-[1.7] text-[#6e6e73] sm:text-[16px]">{slide.copy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls — arrows flanking the dot indicators, the reference's pattern */}
      <div className="mt-10 flex items-center justify-center gap-6">
        <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className={arrowCls}>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2.5" role="tablist" aria-label="Choose slide">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.title}
              type="button" role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`relative h-2 rounded-full transition-all duration-300 after:absolute after:-inset-y-[18px] after:-inset-x-[18px] after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 ${
                i === index ? "w-6 bg-[#0066cc]" : "w-2 bg-[#d2d2d7] hover:bg-[#86868b]"
              }`}
            />
          ))}
        </div>
        <button type="button" onClick={() => go(index + 1)} aria-label="Next slide" className={arrowCls}>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ═══ PAGE ═══ */
export default function PartnersPage() {
  return (
    <div className="page-partners min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main">
        <Breadcrumb page="Partners" />

        {/* HERO — the reference's split statement: eyebrow, display heading, dek,
            two CTAs on the left; illustration scene with floating trust chip right */}
        <section data-section="01-hero" className="px-6 pb-16 pt-10 sm:px-8 lg:px-10 lg:pb-24 lg:pt-16">
          <Reveal className="mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="max-w-[640px]">
              <p data-type="label" className="text-[#6e6e73]">
                Visionary partnerships
              </p>
              <h1 className="mt-4 text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px] text-[#1d1d1f]">
                Better learning, <span className="accent-gradient">together.</span>
              </h1>
              <p className="mt-6 max-w-[560px] text-[17px] leading-[25px] text-[#6e6e73]">
                Education, technology, and local knowledge in one effort, measured by outcomes.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${PARTNERS_EMAIL}?subject=${encodeURIComponent("Partnership enquiry")}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-7 text-[16px] font-medium tracking-[0.24px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4"
                >
                  Discuss a partnership <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <Link
                  to="/how-it-works"
                  className="group inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4"
                >
                  See how it works
                  <ChevronIcon className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-5 flex items-center gap-2 text-[13px] tracking-[0.01em] text-[#6e6e73]">
                <Clock className="h-4 w-4 text-[#0066cc]" aria-hidden="true" />
                {RESPONSE_TIMES.partners}
              </p>
            </div>

            {/* Illustration — the HIG wide scene on its own card, with an
                honest trust chip */}
            <div className="relative mx-auto w-full max-w-[520px]">
              <SpotIllustration
                subject="collab"
                className="w-full rounded-[24px]"
                title="Two partners meeting over a laptop"
              />
              <p className="absolute -bottom-5 left-6 flex items-center gap-2 rounded-full border border-[rgba(18,19,23,0.12)] bg-white py-2 pl-3 pr-4 text-[13px] font-medium text-[#1d1d1f] shadow-[0_1px_3px_rgba(18,19,23,0.06)]">
                <Clock className="h-4 w-4 text-[#0066cc]" aria-hidden="true" />
                Reply within 5 business days
              </p>
            </div>
          </Reveal>
        </section>

        {/* WHAT IS A VISIONARY PARTNERSHIP? — the reference's carousel */}
        <section id="what" data-section="02-what" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="mx-auto max-w-[720px] text-center">
              <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#1d1d1f] sm:text-[46px]">
                What is a Visionary partnership?
              </h2>
              <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-[1.65] text-[#6e6e73] sm:text-[16px]">
                Three things, agreed honestly: enablement, co-design, and evidence. Move through each below.
              </p>
            </div>
            <div className="mt-14">
              <WhatCarousel />
            </div>
            <div className="mt-12 flex justify-center">
              <QuietLink href="#who">
                See who we partner with <ChevronIcon className="h-4 w-4" aria-hidden="true" />
              </QuietLink>
            </div>
          </Reveal>
        </section>

        {/* WHO WE PARTNER WITH — the reference's 2×2 access-levels grid
            on a soft arc backdrop */}
        <section id="who" data-section="03-who" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="mx-auto max-w-[820px] text-center">
              <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#1d1d1f] sm:text-[46px]">
                Who we partner with
              </h2>
              <p className="mx-auto mt-5 max-w-[720px] text-[16px] leading-[1.7] text-[#6e6e73] sm:text-[16px]">
                Partnerships start from different kinds of knowledge, the contexts our product must understand to serve learners well. Each starts with the same conversation.
              </p>
            </div>
            <div className="mt-16 grid gap-x-12 gap-y-14 lg:grid-cols-2">
              {PARTNER_TYPES.map((type) => (
                <div key={type.chip} className="grid items-center gap-6 sm:grid-cols-[128px_1fr] sm:gap-8">
                  <div className="flex h-[128px] w-[128px] items-center justify-center rounded-[20px] bg-[#f5f5f7]">
                    <SpotIllustration subject={type.subject} className="h-[92px] w-[92px]" title={type.chip} />
                  </div>
                  <div>
                    <h3>
                      <AccessChip>{type.chip}</AccessChip>
                    </h3>
                    <p className="mt-3 max-w-[460px] text-[16px] leading-[1.7] text-[#6e6e73]">{type.copy}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <QuietLink href="#includes">
                What the programme covers <ChevronIcon className="h-4 w-4" aria-hidden="true" />
              </QuietLink>
            </div>
          </Reveal>
        </section>

        {/* WHAT A PARTNERSHIP INCLUDES — the reference's benefit columns */}
        <section id="includes" data-section="04-includes" className="scroll-mt-28 bg-[#f5f5f7] px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="mx-auto max-w-[720px] text-center">
              <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#1d1d1f] sm:text-[46px]">
                What a partnership includes
              </h2>
              <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-[1.65] text-[#6e6e73] sm:text-[16px]">
                The same foundations for every partner, scaled to the work we agree on together.
              </p>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-3 lg:gap-6">
              {BENEFITS.map(({ Icon, tile, title, items }) => (
                <article key={title} className="flex flex-col rounded-[20px] bg-white p-6 sm:p-7">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${tile}`}>
                    <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-[20px] font-normal tracking-[-0.02em] text-[#1d1d1f]">{title}</h3>
                  <dl className="mt-4 space-y-5">
                    {items.map(({ t, d }) => (
                      <div key={t}>
                        <dt className="text-[16px] font-medium leading-[1.4] text-[#1d1d1f]">{t}</dt>
                        <dd className="mt-1 text-[14px] leading-[1.65] text-[#6e6e73]">{d}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ENGAGEMENT DEPTH — the reference's tier table, honestly framed:
            depth is agreed together, not purchased */}
        <section id="depth" data-section="05-depth" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto grid max-w-[1240px] items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f5f7] text-[#0066cc]">
                <Compass />
              </span>
              <h2 className="mt-5 text-[30px] font-normal leading-[1.15] tracking-[-0.025em] text-[#1d1d1f] sm:text-[38px]">
                How deep the work can go
              </h2>
              <p className="mt-4 max-w-[440px] text-[16px] leading-[1.7] text-[#6e6e73] sm:text-[16px]">
                Every partnership begins as a conversation. Where it goes from there is agreed together, measured in outcomes, not tiers.
              </p>
              <dl className="mt-7 space-y-4 border-t border-[rgba(18,19,23,0.12)] pt-6">
                {DEPTH_TIERS.map((tier) => (
                  <div key={tier}>
                    <dt className="text-[16px] font-medium text-[#1d1d1f]">{tier}</dt>
                    <dd className="mt-0.5 text-[14px] leading-[1.6] text-[#6e6e73]">
                      {tier === "Conversation" && "Understand each other's context, constraints, and timing."}
                      {tier === "Scoped pilot" && "A bounded rollout with success measures agreed in writing."}
                      {tier === "Ongoing programme" && "A longer partnership, reviewed together each term."}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <caption className="sr-only">What each partnership depth includes</caption>
                <thead>
                  <tr className="border-b border-[rgba(18,19,23,0.12)] bg-[#f5f5f7]">
                    <th scope="col" className="px-5 py-4 apple-eyebrow text-[#6e6e73]">
                      What is included
                    </th>
                    {DEPTH_TIERS.map((tier) => (
                      <th key={tier} scope="col" className="px-4 py-4 text-center">
                        <span className="inline-flex items-center rounded-[12px] border border-[rgba(18,19,23,0.12)] bg-white px-2.5 py-1 apple-eyebrow text-[#1d1d1f]">
                          {tier}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEPTH_ROWS.map(({ label, reach }) => (
                    <tr key={label} className="border-b border-[rgba(18,19,23,0.12)] last:border-b-0">
                      <th scope="row" className="px-5 py-4 text-[14px] font-medium leading-[1.5] text-[#1d1d1f]">
                        {label}
                      </th>
                      {reach.map((included, i) => (
                        <td key={i} className="px-4 py-4 text-center">
                          {included ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#188038] text-white" aria-hidden="true">
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="text-[#86868b]" aria-hidden="true">—</span>
                          )}
                          <span className="sr-only">{included ? "Included" : "Not included"}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
          <div className="mx-auto mt-10 max-w-[1240px]">
            <QuietLink to="/contact">
              Begin the conversation <ChevronIcon className="h-4 w-4" aria-hidden="true" />
            </QuietLink>
          </div>
        </section>

        {/* HOW A PARTNERSHIP BEGINS — the four-step journey */}
        <section id="journey" data-section="06-journey" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="max-w-[680px]">
              <p className="apple-eyebrow text-[#6e6e73]">The process</p>
              <h2 className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#1d1d1f] sm:text-[42px]">
                How a partnership begins.
              </h2>
              <p className="mt-4 text-[16px] leading-[1.75] text-[#6e6e73]">
                Four steps from a first note to work in progress, with writing at every hinge.
              </p>
            </div>
            <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {JOURNEY.map(({ n, title, copy }) => (
                <li key={n} className="border-t-2 border-[#1d1d1f] pt-5">
                  <p className="text-[13px] font-medium text-[#0066cc]">Step {n}</p>
                  <h3 className="mt-2 text-[19px] font-medium leading-[1.3] text-[#1d1d1f]">{title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.7] text-[#6e6e73]">{copy}</p>
                </li>
              ))}
            </ol>
            <p className="mt-12 max-w-[820px] rounded-[20px] bg-[#f5f5f7] px-6 py-5 text-[14px] leading-[1.7] text-[#1d1d1f]">
              Every partnership begins with shared expectations. Scope, responsibilities, privacy, support, costs, and measures of success are agreed in writing before work begins. Sending an enquiry starts a conversation and does not create an endorsement or commercial agreement.
            </p>
            <div className="mt-10">
              <QuietLink href="#faq">
                Straight answers, before you write <ChevronIcon className="h-4 w-4" aria-hidden="true" />
              </QuietLink>
            </div>
          </Reveal>
        </section>

        {/* STATEMENT BAND — the reference's grey call-to-decision band */}
        <section data-section="07-statement" className="bg-[#f5f5f7] px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto flex max-w-[1000px] flex-col items-center text-center">
            <h2 className="text-[clamp(26px,3.4vw,38px)] font-normal leading-[1.25] tracking-[-0.025em] text-[#1d1d1f]">
              If your organization works with learners, in a classroom, a system, or a region, we want to understand your context.
            </h2>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`mailto:${PARTNERS_EMAIL}?subject=${encodeURIComponent("Partnership enquiry")}`}
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#1d1d1f] px-7 font-medium tracking-[0.24px] text-[17px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
              >
                Discuss a partnership <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#support"
                className="group inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4"
              >
                Looking for support instead?
                <ChevronIcon className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </section>

        {/* TAKE THE NEXT STEP — the reference's light-blue support card,
            for organizations seeking help rather than partnership */}
        <section id="support" data-section="08-support" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="relative grid items-center gap-10 overflow-hidden rounded-[30px] bg-[#f5f5f7] p-8 sm:p-12 lg:grid-cols-[1.35fr_0.65fr] lg:gap-16">
              <div>
                <p className="apple-eyebrow text-[#6e6e73]">For organizations seeking support</p>
                <h2 className="mt-3 text-[30px] font-normal leading-[1.15] tracking-[-0.025em] text-[#1d1d1f] sm:text-[38px]">
                  Start with the support you need.
                </h2>
                <p className="mt-4 max-w-[640px] text-[16px] leading-[1.75] text-[#1d1d1f] sm:text-[16px]">
                  Tell us about your organization, location, and goal. We can explain the available Visionary options and, when appropriate, whether partner support is available for that need.
                </p>
                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                  <Link to="/help" className="group inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4">
                    Browse help topics
                    <ChevronIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="flex h-[180px] w-[180px] items-center justify-center rounded-full bg-white">
                  <SpotIllustration subject="compass" className="h-[120px] w-[120px]" title="A compass pointing toward the right support" />
                </div>
              </div>
              {/* google.com card curve — the page background sweeps into the corner
                  and the banner's primary destination floats in it with breath */}
              <div aria-hidden="true" className="absolute bottom-0 right-0 h-[56px] w-[92px] rounded-tl-[20px] bg-white" />
              <Link to="/contact" aria-label="Contact Visionary" className="absolute bottom-0 right-0 flex h-[56px] w-[92px] items-end justify-end rounded-tl-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]">
                <ArrowUpRight className="mb-3 mr-3 h-5 w-5 text-[#0066cc]" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS — the reference's expand-all accordion */}
        <section id="faq" data-section="09-faq" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[840px]">
            <div className="text-center">
              <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#1d1d1f] sm:text-[46px]">
                Frequently asked questions
              </h2>
              <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-[1.65] text-[#6e6e73] sm:text-[16px]">
                Straight answers about how partnerships work, and what they do not promise.
              </p>
            </div>
            <div className="mt-12">
              <LandingFAQ
                faqs={[
                  { q: "Who can become a partner?", a: "Schools, school systems, colleges, coaching institutes, workplaces, technology teams, and people with regional or language expertise. If your work touches how people learn, the conversation can start." },
                  { q: "How quickly will the partnerships team reply?", a: RESPONSE_TIMES.partners + " Every enquiry is read by a person on the team." },
                  { q: "What does a partnership cost?", a: "There is no programme fee to start a conversation. Costs, if any, are agreed in writing for a scoped piece of work before that work begins." },
                  { q: "Is there a public partner directory?", a: "Not today. This page is the single enquiry route. If a public directory is introduced, it will be published here first." },
                  { q: "How is learner data protected in a partnership?", a: "Learner data stays governed by the Privacy Policy. Pilots use consent-based access and views that group learners by default, and sensitive learner information never travels by email." },
                  { q: "Does an enquiry create an endorsement?", a: "No. An enquiry starts a conversation. Scope, responsibilities, and any public acknowledgement are agreed in writing before work begins." },
                  { q: "Can we bring Visionary to our school or organization?", a: `Yes. That is the most common starting point. Write to ${PARTNERS_EMAIL} about rollouts for classrooms, cohorts, and workplaces.` },
                ]}
                multiple={true}
                showExpandAll={true}
                visibleCount={5}
                expandAllLabel="Expand all"
                collapseAllLabel="Collapse all"
                showMoreLabel="Show more"
              />
            </div>
          </Reveal>
        </section>

        {/* CLOSING CTA — one closing promise, two routes (the email opens a
            draft), and the response-time note as fine print */}
        <section data-section="10-cta" className="bg-[#f5f5f7] px-6 text-center sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[840px]">
            <h2 className="mx-auto max-w-[720px] text-[clamp(30px,4vw,46px)] font-normal leading-[1.1] tracking-[-0.03em] text-[#1d1d1f]">
              Bring Visionary closer to your learners.
            </h2>
            <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={`mailto:${PARTNERS_EMAIL}?subject=${encodeURIComponent("Partnership enquiry")}`}
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#1d1d1f] px-7 font-medium tracking-[0.24px] text-[17px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px]"
              >
                Email the partnerships team
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link
                to="/contact"
                className="group inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4"
              >
                Or use the contact routes
                <ChevronIcon className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-8 text-[14px] leading-[1.5] font-normal tracking-[0] text-[#6e6e73]">
              A five-minute note is enough to start. Tell us your context, and the partnerships team will reply within five business days.
            </p>
          </Reveal>
        </section>

      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
