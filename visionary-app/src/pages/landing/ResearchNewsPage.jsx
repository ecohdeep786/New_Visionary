import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import SpotIllustration from "@/components/landing/SpotIllustration";
import imgHeroChip from "@/assets/student-higher.webp";
import imgStudent from "@/assets/student-hero-main-1600w.webp";
import imgTeacher from "@/assets/teacher-hero-main-1600w.webp";
import imgParent from "@/assets/parent-hero-main-1600w.webp";
import imgProfessional from "@/assets/pro-face-main-1600w.webp";
import imgOrganization from "@/assets/org-face-main-1600w.webp";
import imgProjectA from "@/assets/problem-practice.webp";
import imgProjectB from "@/assets/problem-understanding.webp";
import imgProjectC from "@/assets/organization-problem-2-1600w.webp";
import imgResponsible from "@/assets/problem-understanding.webp";
import imgFutureCommunity from "@/assets/teacher-problem-2.webp";
import imgFutureCareers from "@/assets/organization-problem-3-1600w.webp";

/* ═══ Tokens — the careers-page dialect (Material geometry, #202124 ink,
   #1a73e8 actions, pill buttons), shared across converted pages. Styling
   uses Tailwind arbitrary values of the same tokens. ═══ */
const FONT = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* ═══ The research, honestly labelled. "In the product" items are real,
   shipped capabilities of the internal mentor; "Next" items are the work
   ahead. No live-AGI claim — the page describes a direction, like every
   company research page. ═══ */
const AREAS = [
  {
    role: "For students",
    to: "/student",
    cta: "Explore the student experience",
    title: "A mentor for every step",
    photo: imgStudent,
    alt: "A student learning with the Visionary mentor",
    tint: "#e8f0fe",
    copy: "The Learn, Ask, Practice, and Build loop turns one day of learning into evidence the mentor plans from — progress described by what was actually done, never by invented scores.",
    items: [
      { tag: "In the product", subject: "updates", title: "The Daily Mentor plan", detail: "Home is a decision, not a grid: one evidence-backed next step, chosen from classwork, activity, and due practice." },
      { tag: "In the product", subject: "learn", title: "Exact session resume", detail: "A lesson interrupted by a refresh or a language change resumes exactly where it stopped." },
      { tag: "In the product", subject: "build", title: "Build with recovery", detail: "An artifact that fails to save partway recovers instead of losing the learner's work." },
      { tag: "Next", subject: "growth", title: "Practice that truly adapts", detail: "Deeper adaptation from real outcomes across subjects — not a score dressed up as understanding." },
    ],
  },
  {
    role: "For teachers",
    to: "/teacher",
    cta: "Explore the teacher experience",
    title: "Teaching, amplified",
    photo: imgTeacher,
    alt: "A teacher guiding a classroom",
    tint: "#e9f5ef",
    copy: "Prepare, publish, and review classwork while the intelligence handles the follow-through — and the learner's private learning stays the learner's own.",
    items: [
      { tag: "In the product", subject: "document", title: "Publish and review loop", detail: "Teacher preparation flows to publication, student submission, and a reviewed check — one connected loop." },
      { tag: "In the product", subject: "community", title: "Class communities, moderated", detail: "Class-scoped communities with report and rate-limit controls, kept safe by the teacher." },
      { tag: "In the product", subject: "handshake", title: "Work in a learner's day", detail: "Classwork joins a student's Daily Mentor plan without taking ownership of their private learning." },
      { tag: "Next", subject: "student", title: "Stage-aware presentation", detail: "The same concept presented for the learner's stage, derived from evidence rather than age alone." },
    ],
    flip: true,
  },
  {
    role: "For parents",
    to: "/parent",
    cta: "Explore the parent experience",
    title: "The journey, with consent",
    photo: imgParent,
    alt: "A parent supporting learning at home",
    tint: "#fef3df",
    copy: "Follow a child's learning through summaries scoped by consent — support at home without opening the learner's private world.",
    items: [
      { tag: "In the product", subject: "shield", title: "Consent-scoped summaries", detail: "Parent reports show only what the learner's consent allows — nothing more is rendered anywhere." },
      { tag: "In the product", subject: "lock", title: "Boundaries by design", detail: "Private doubts and personal projects stay outside family and organizational views by default." },
      { tag: "Next", subject: "eye", title: "Richer progress signals", detail: "Clearer summaries of what changed and why, as the evidence model grows." },
    ],
  },
  {
    role: "For professionals",
    to: "/professional",
    cta: "Explore the professional experience",
    title: "From goal to evidence",
    photo: imgProfessional,
    alt: "A professional building skills for work",
    tint: "#f3edff",
    copy: "A professional declares a goal; the mentor turns study and real work into skill evidence — and the evidence into a portfolio employers can read.",
    items: [
      { tag: "In the product", subject: "briefcase", title: "Goal, evidence, portfolio", detail: "A professional goal becomes applied artifacts that save as skill evidence, assembled into a portfolio." },
      { tag: "In the product", subject: "growth", title: "Understanding, not percentages", detail: "Progress is described by evidence — invented confidence scores and exam-readiness numbers are never shown." },
      { tag: "Next", subject: "research", title: "Verified skill claims", detail: "Outcome-level claims that independent evaluation can support." },
    ],
    flip: true,
  },
  {
    role: "For organizations",
    to: "/organization",
    cta: "Explore the organization experience",
    title: "Understanding at scale",
    photo: imgOrganization,
    alt: "An organization bringing learning to its people",
    tint: "#fcebe8",
    copy: "Schools, colleges, coaching institutes, and workplaces roll out learning across cohorts — with role isolation enforced at every view.",
    items: [
      { tag: "In the product", subject: "team", title: "Cohorts and aggregate insights", detail: "Organization setup flows to cohorts and aggregates — institution insight without exposing any individual." },
      { tag: "In the product", subject: "shield", title: "Isolation enforced", detail: "One account can switch roles without data leakage; organizational views never see private work." },
      { tag: "Next", subject: "handshake", title: "Production enforcement", detail: "Server-side authorization repeating every client-side role and consent check." },
    ],
  },
];

/* Recently shipped — real capabilities, real month. */
const LATEST = [
  { label: "September 2026", title: "The Daily Mentor Engine", copy: "Home became a decision: one evidence-backed next step for every role, chosen from classwork, activity, and due practice.", subject: "updates", tint: "#e8f0fe" },
  { label: "September 2026", title: "Two faces of one intelligence", copy: "Vision Boy and Vision Girl ship as two presentations of the same cognition — one memory, one pedagogy, one safety policy.", subject: "ask", tint: "#e9f5ef" },
  { label: "September 2026", title: "Community, teacher-moderated", copy: "Class-scoped communities where learners grow together and teachers keep the space safe.", subject: "community", tint: "#fef3df" },
];

/* The work the research feeds — product surfaces shaped by these questions. */
const PROJECTS = [
  { title: "How it works", photo: imgProjectA, alt: "A designer shaping a learning exercise on paper", copy: "The learning loop the research feeds — explore, check, practise, build." },
  { title: "The product", photo: imgProjectB, alt: "A learner reading closely to make sense of an idea", copy: "Where questions become the experiences learners use every day." },
  { title: "Community", photo: imgProjectC, alt: "Teammates discussing work in a meeting", copy: "Learners, teachers, and parents growing together — and shaping the questions." },
];

/* ═══ Motion — the shared reveal grammar ═══ */
function useRevealOnce() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const hasRevealed = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (hasRevealed.current) { setVisible(true); return undefined; }
    if (!node || typeof IntersectionObserver === "undefined") { setVisible(true); hasRevealed.current = true; return undefined; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasRevealed.current) { setVisible(true); hasRevealed.current = true; observer.disconnect(); }
    }, { rootMargin: "0px 0px -8% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "" }) {
  const { ref, visible } = useRevealOnce();
  return (
    <div ref={ref} className={`${className} transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
      {children}
    </div>
  );
}

function Pill({ to, href, onClick, children, outline = false }) {
  const cls = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2 ${
    outline ? "border border-[#dadce0] bg-white text-[#202124] hover:bg-[#f1f3f4]" : "bg-[#1a73e8] text-white shadow-[0_1px_3px_rgba(60,64,67,0.3)] hover:bg-[#1765cc]"
  } ${onClick ? "cursor-pointer" : ""}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <a href={href} onClick={onClick} className={cls}>{children}</a>;
}

function TextLink({ to, href, onClick, children }) {
  if (to) return <Link to={to} className="inline-flex items-center gap-2 rounded-sm text-[15px] font-medium text-[#1a73e8] transition-colors hover:text-[#1765cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">{children}</Link>;
  return <a href={href} onClick={onClick} className="inline-flex items-center gap-2 rounded-sm text-[15px] font-medium text-[#1a73e8] transition-colors hover:text-[#1765cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">{children}</a>;
}

export default function ResearchNewsPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}>
      <LandingNav />
      <main id="main">
        <Breadcrumb page="Research" />

        {/* HERO — the research.google statement: a huge staggered two-line
            headline with floating image accents and a hand-drawn arrow */}
        <section className="relative overflow-hidden">
          <div className="relative mx-auto max-w-[1240px] px-4 pb-24 pt-16 sm:px-6 lg:px-10 lg:pb-36 lg:pt-24">
            <div className="pointer-events-none absolute right-[8%] top-[9%] hidden w-[170px] rotate-3 overflow-hidden rounded-2xl border-4 border-white shadow-[0_12px_32px_rgba(0,0,0,0.2)] lg:block">
              <img src={imgHeroChip} alt="" aria-hidden="true" className="aspect-[4/3] w-full object-cover" />
            </div>
            <div className="pointer-events-none absolute bottom-[14%] right-[24%] hidden -rotate-2 lg:block">
              <SpotIllustration subject="loop" className="h-[112px] w-[150px] rounded-2xl border-4 border-white shadow-[0_12px_32px_rgba(0,0,0,0.2)]" />
            </div>
            <Reveal>
              <h1 className="max-w-[1000px] text-[60px] font-normal leading-[1.02] tracking-[-0.045em] text-[#202124] sm:text-[88px] lg:text-[104px]">
                <span className="block">One intelligence,</span>
                <span className="block pl-[10%] sm:pl-[18%]">
                  every learner.
                  <svg aria-hidden="true" viewBox="0 0 120 40" className="ml-5 inline-block h-9 w-28 text-[#202124] sm:h-11 sm:w-36">
                    <path d="M6 8 C 40 34, 78 34, 108 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M98 14 L 110 17 L 102 27" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </h1>
              <p className="mt-14 max-w-[480px] text-[17px] leading-[1.65] text-[#5f6368] sm:text-[18px]">
                Visionary is building a mentor intelligence — one intelligence that knows your journey, teaches in your language, and turns every day of learning into evidence. This page is the record of that work.
              </p>
            </Reveal>
          </div>
        </section>

        {/* MISSION SPLIT — "Amplifying human curiosity" beside a dark brand
            panel (Google's video panel position) */}
        <section className="px-4 pb-20 sm:px-6 lg:px-10 lg:pb-28">
          <Reveal className="mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <h2 className="text-[24px] font-medium leading-[1.3] tracking-[-0.02em] text-[#202124] sm:text-[28px]">
                Building the mentor intelligence.
              </h2>
              <p className="mt-4 max-w-[520px] text-[16px] leading-[1.75] text-[#5f6368]">
                The product contract is simple to say and hard to do: one identity across five roles, one cognition behind every view, one evidence-backed next step each day. The mentor is not artificial general intelligence today — that is the direction of the research, and this page shares where it stands.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-[#202124] p-10 sm:p-14">
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/60">Visionary Intelligence</p>
              <p className="mt-6 max-w-[420px] text-[28px] font-normal leading-[1.2] tracking-[-0.02em] text-white sm:text-[36px]">
                I am your Intelligence.
              </p>
              <div className="mt-8 flex flex-wrap gap-2.5">
                {["Knows your journey", "Speaks your language", "Works across roles", "Built on evidence"].map((chip) => (
                  <span key={chip} className="rounded-full border border-white/25 px-4 py-1.5 text-[13px] text-white/75">{chip}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* QUOTE BAND — full-width photo band with dark overlay and the
            founding idea (Google's attributed quote band) */}
        <section className="px-4 sm:px-6 lg:px-10">
          <Reveal className="relative mx-auto max-w-[1240px] overflow-hidden rounded-3xl bg-[#202124] px-8 py-16 sm:px-14 sm:py-24">
            <img src={imgHeroChip} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-30" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#202124]/90 via-[#202124]/70 to-[#202124]/40" />
            <div className="relative">
              <p className="max-w-[860px] text-[24px] font-normal leading-[1.35] tracking-[-0.02em] text-white sm:text-[32px]">
                "A person should not have to start over every time life asks them to learn something new."
              </p>
              <div className="mt-8 flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a73e8] text-[14px] font-medium text-white">MA</span>
                <p className="text-[14px] text-white/80">Md Shahid Ali · Founder and CEO</p>
              </div>
            </div>
          </Reveal>
        </section>
        {/* READ THE LATEST — real capabilities, really shipped */}
        <section id="latest" className="scroll-mt-32 px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#202124] sm:text-[48px]">Read the latest</h2>
              <div className="flex flex-wrap gap-3">
                <Pill to="/updates" outline>View product updates <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Pill>
                <Pill to="/how-it-works" outline>Explore how it works <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Pill>
              </div>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {LATEST.map((item) => (
                <article key={item.title} className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#dadce0] bg-white transition-shadow duration-300 hover:shadow-[0_2px_8px_rgba(32,33,36,0.16)]">
                  <div className="flex h-[160px] items-center justify-center" style={{ backgroundColor: item.tint }}>
                    <SpotIllustration subject={item.subject} className="h-24 w-24" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-[18px] font-medium leading-[1.35] text-[#202124]">{item.title}</h3>
                    <p className="mt-2 text-[14px] leading-[1.6] text-[#5f6368]">{item.copy}</p>
                    <div className="mt-auto flex items-center gap-3 pt-5 text-[13px] text-[#5f6368]">
                      <span>{item.label}</span>
                      <span aria-hidden="true">·</span>
                      <Link to="/how-it-works" className="inline-flex items-center gap-1 rounded-sm font-medium text-[#1a73e8] transition-colors hover:text-[#1765cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
                        Learn more <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        {/* OUR RESEARCH DRIVES REAL UNDERSTANDING — three focus areas, each
            with its shipped capabilities and what comes next */}
        <section id="areas" className="scroll-mt-32 border-t border-[#e8eaed] bg-[#f8f9fa] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="mx-auto max-w-[760px] text-center">
              <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#202124] sm:text-[48px]">
                Our research drives real understanding.
              </h2>
              <p className="mx-auto mt-4 max-w-[640px] text-[15px] leading-[1.65] text-[#5f6368] sm:text-[16px]">
                One intelligence, researched across every role the product serves — what it does for each person today, and what comes next.
              </p>
            </div>
            <div className="mt-16 space-y-24">
              {AREAS.map((area) => (
                <div key={area.role}>
                  <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <div className={`overflow-hidden rounded-2xl ${area.flip ? "lg:order-2" : ""}`} style={{ backgroundColor: area.tint }}>
                      <img src={area.photo} alt={area.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-contain object-bottom mix-blend-multiply" />
                    </div>
                    <div className={area.flip ? "lg:order-1" : ""}>
                      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#1a73e8]">{area.role}</p>
                      <h3 className="mt-3 text-[28px] font-normal leading-[1.15] tracking-[-0.025em] text-[#202124] sm:text-[36px]">{area.title}</h3>
                      <p className="mt-4 max-w-[480px] text-[16px] leading-[1.7] text-[#5f6368]">{area.copy}</p>
                      <div className="mt-6">
                        <Pill to={area.to} outline>
                          {area.cta} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </Pill>
                      </div>
                    </div>
                  </div>
                  <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                    {area.items.map((item) => (
                      <article key={item.title} className="flex gap-4">
                        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${item.tag === "Next" ? "bg-[#f1f3f4]" : "bg-[#e8f0fe]"}`}>
                          <SpotIllustration subject={item.subject} className="h-10 w-10" />
                        </span>
                        <div>
                          <p className={`text-[11px] font-medium uppercase tracking-[0.12em] ${item.tag === "Next" ? "text-[#5f6368]" : "text-[#0b57d0]"}`}>{item.tag}</p>
                          <h4 className="mt-1.5 text-[16px] font-medium leading-[1.4] text-[#202124]">{item.title}</h4>
                          <p className="mt-1 text-[14px] leading-[1.6] text-[#5f6368]">{item.detail}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* PROJECTS — see our impact across other products (Google's
            "other projects" row) */}
        <section id="projects" className="scroll-mt-32 border-t border-[#e8eaed] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <h2 className="max-w-[560px] text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#202124] sm:text-[48px]">
                See the work this research feeds.
              </h2>
              <Pill to="/how-it-works" outline>More about the product <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Pill>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {PROJECTS.map((project) => (
                <article key={project.title} className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#dadce0] bg-white transition-shadow duration-300 hover:shadow-[0_2px_8px_rgba(32,33,36,0.16)]">
                  <img src={project.photo} alt={project.alt} loading="lazy" decoding="async" className="h-[190px] w-full object-cover" />
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-[21px] font-normal leading-[1.3] text-[#202124]">{project.title}</h3>
                    <p className="mt-2 text-[15px] leading-[1.6] text-[#5f6368]">{project.copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </section>
        {/* DOMAINS — the dark band: the mind behind the mentor */}
        <section className="px-4 sm:px-6 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px] overflow-hidden rounded-3xl bg-[#202124] px-8 py-16 sm:px-14 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
              <div>
                <h2 className="text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-white sm:text-[42px]">
                  The mind behind the mentor.
                </h2>
                <p className="mt-5 max-w-[460px] text-[16px] leading-[1.7] text-white/70">
                  The mentor's intelligence is an adapter, not a fixed brain. Retrieval, grounding, safety, memory, and evaluation sit behind one contract — so the mind can improve without the mentor changing, and an unconnected answer is always shown as unconnected.
                </p>
                <div className="mt-8">
                  <Pill to="/how-it-works" outline>Explore how it works <ArrowRight className="h-4 w-4" aria-hidden="true" /></Pill>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {["Retrieval", "Grounding", "Safety", "Verification", "Memory", "Evaluation"].map((chip) => (
                  <div key={chip} className="flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-7 text-[14px] font-medium text-white/85">{chip}</div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ORIGIN — one question started it all, and the honest public record */}
        <section id="origin" className="scroll-mt-32 px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <Reveal className="mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <h2 className="text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#202124] sm:text-[42px]">
                One question started it all.
              </h2>
              <p className="mt-5 max-w-[520px] text-[16px] leading-[1.75] text-[#5f6368]">
                The mentor began with a question, not a feature: why an explanation reaches one learner and misses another. It is why the product began, and why the research continues.
              </p>
              <p className="mt-4 max-w-[520px] text-[15px] leading-[1.75] text-[#5f6368]">
                The method stays the same: begin with a learner need, turn it into a testable product question, design and observe, and share what the evidence supports — with methods and limits described clearly.
              </p>
              <p className="mt-4 max-w-[520px] text-[15px] leading-[1.75] text-[#5f6368]">
                Visionary has not published formal research papers yet. When work is ready, this page will link to the method, contributors, evidence, and limitations so readers can assess the finding for themselves.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-7 gap-y-4">
                <TextLink to="/updates">Visit product updates <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></TextLink>
                <TextLink href="mailto:research@visionary.org.in">Contact the research team <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></TextLink>
              </div>
            </div>
            <div className="rounded-2xl border border-[#dadce0] bg-white p-8 shadow-[0_8px_28px_rgba(0,0,0,0.08)] sm:p-10">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#1a73e8]">The first question</p>
                <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f0fe] text-[13px] font-medium text-[#0b57d0]">01</span>
              </div>
              <p className="mt-6 text-[26px] font-normal leading-[1.25] tracking-[-0.02em] text-[#202124] sm:text-[30px]">
                "What helps an idea make sense?"
              </p>
              <div className="mt-8 border-t border-[#e8eaed] pt-5">
                <p className="text-[14px] leading-[1.6] text-[#5f6368]">
                  Asked at the founding of Visionary · still open · now studied through explanation, examples, and visual representations in the product.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* RESPONSIBLE — research at the heart, with our honest framing */}
        <section className="border-t border-[#e8eaed] bg-[#f8f9fa] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <Reveal className="mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="overflow-hidden rounded-2xl">
              <img src={imgResponsible} alt="A learner reading closely to make sense of an idea" loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
            </div>
            <div>
              <h2 className="text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#202124] sm:text-[42px]">
                Responsible research is at the heart of what we do.
              </h2>
              <p className="mt-5 max-w-[520px] text-[16px] leading-[1.75] text-[#5f6368]">
                Learning involves trust. The research shared here describes questions and methods — not claims of proven outcomes — and the product treats learner privacy and safety as part of the work itself.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Pill to="/safety" outline>Our approach to safety <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Pill>
                <Pill to="/privacy" outline>Privacy <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Pill>
              </div>
            </div>
          </Reveal>
        </section>

        {/* FUTURE — help us shape it: community and careers */}
        <section id="future" className="scroll-mt-32 px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <Reveal className="mx-auto max-w-[1240px]">
            <h2 className="max-w-[700px] text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#202124] sm:text-[48px]">
              Help us shape the future.
            </h2>
            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#dadce0] bg-white transition-shadow duration-300 hover:shadow-[0_2px_8px_rgba(32,33,36,0.16)]">
                <img src={imgFutureCommunity} alt="A teacher explaining an idea" loading="lazy" decoding="async" className="h-[200px] w-full object-cover" />
                <div className="flex flex-1 flex-col p-7">
                  <h3 className="text-[23px] font-normal leading-[1.3] text-[#202124]">Join the community</h3>
                  <p className="mt-2 text-[15px] leading-[1.65] text-[#5f6368]">
                    Learners, teachers, and parents use the product every day — their experience is a primary source for every question on this page.
                  </p>
                  <div className="mt-auto pt-5">
                    <TextLink to="/community">Explore the community <ArrowRight className="h-4 w-4" aria-hidden="true" /></TextLink>
                  </div>
                </div>
              </article>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#dadce0] bg-white transition-shadow duration-300 hover:shadow-[0_2px_8px_rgba(32,33,36,0.16)]">
                <img src={imgFutureCareers} alt="A teammate at work in a shared space" loading="lazy" decoding="async" className="h-[200px] w-full object-cover" />
                <div className="flex flex-1 flex-col p-7">
                  <h3 className="text-[23px] font-normal leading-[1.3] text-[#202124]">Work with us</h3>
                  <p className="mt-2 text-[15px] leading-[1.65] text-[#5f6368]">
                    Help turn these questions into a product — research-minded people across engineering, design, and evidence.
                  </p>
                  <div className="mt-auto pt-5">
                    <TextLink to="/careers">See careers at Visionary <ArrowRight className="h-4 w-4" aria-hidden="true" /></TextLink>
                  </div>
                </div>
              </article>
            </div>
            <div className="mt-12 flex flex-col gap-2 border-t border-[#e8eaed] pt-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-[17px] font-medium text-[#202124]">Have a research question?</h3>
                <p className="mt-1 text-[14px] text-[#5f6368]">Write to the Visionary team.</p>
              </div>
              <TextLink href="mailto:research@visionary.org.in">research@visionary.org.in <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></TextLink>
            </div>
          </Reveal>
        </section>

      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}

