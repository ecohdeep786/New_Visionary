import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, Users, HeartHandshake, Briefcase, Building2, ArrowRight,
} from "lucide-react";
import SpotIllustration from "@/components/landing/SpotIllustration";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import studentmeet from "@/assets/student-hero-main-1600w.webp"
import teachermeet from "@/assets/teacher-hero-main-1600w.webp"
import parentmeet from "@/assets/parent-hero-main-1600w.webp"
import promeet from "@/assets/pro-face-main-1600w.webp"
import orgmeet from "@/assets/org-face-main-1600w.webp"
import imgStudentCompetitive from "@/assets/student-competitive.webp"
import imgStudentSecondary from "@/assets/student-secondary.webp"
import imgProblemPractice from "@/assets/problem-practice.webp"
import imgProfessionalFace from "@/assets/professional-face-main.webp"

/* ═══ TOKENS (one system across all pages) ═══ */
const COLORS = {
  ink: "#121317",
  surface: "#ffffff",
  blue: "#4285F4",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  white: "#ffffff",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* ═══ CONTROLLERS ═══ */
function useRevealOnce(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const hasRevealed = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (hasRevealed.current) { setVisible(true); return undefined; }
    if (!node) { setVisible(true); return undefined; }
    if (typeof IntersectionObserver === "undefined") { setVisible(true); hasRevealed.current = true; return undefined; }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRevealed.current) { setVisible(true); hasRevealed.current = true; observer.disconnect(); }
      },
      { threshold: 0, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}
function useCycleIndex(total, intervalMs) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), intervalMs);
    return () => clearInterval(id);
  }, [total, intervalMs, index]);
  return { index };
}
const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});
const GreyTag = React.memo(function GreyTag({ children, className = "" }) {
  return (
    <p className={`font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px] ${className}`} style={{ color: COLORS.grey }}>
      {children}
    </p>
  );
});

/* ═══ MODELS ═══ */
const ECOSYSTEM = [
  { id: "student", label: "Student", Icon: GraduationCap },
  { id: "teacher", label: "Teacher", Icon: Users },
  { id: "parent", label: "Parent", Icon: HeartHandshake },
  { id: "professional", label: "Professional", Icon: Briefcase },
  { id: "organization", label: "Organization", Icon: Building2 },
];

const WHY_FUTURES = [
  { role: "Student", line: "Lessons used to fade by Friday. Now the understanding stays with you." },
  { role: "Teacher", line: "One lesson, forty different minds. Now you see every one of them." },
  { role: "Parent", line: "The report card came too late. Now you know this week — and where to help." },
  { role: "Professional", line: "Courses ended, and skills ended with them. Now they go to work with you." },
  { role: "Organization", line: "Attendance said who showed up. Now you see who understood." },
];

const ABOUT_APPS = [
  { label: "Learn", subject: "learn" },
  { label: "Ask", subject: "ask" },
  { label: "Practice", subject: "practice" },
  { label: "Build", subject: "build" },
];

const SERVE_CARDS = [
  { id: "student", label: "Student", big: true, span: "sm:col-span-2 lg:col-span-4", img: studentmeet, title: "Understand what you're learning.", line: "From the first question to what you build from it — and it stays with you for life." },
  { id: "teacher", label: "Teacher", span: "lg:col-span-2", img: teachermeet, title: "See who understood.", line: "Reach the ones who didn't — before the next bell." },
  { id: "parent", label: "Parent", span: "lg:col-span-2", img: parentmeet, title: "Know the week, not the report card.", line: "Follow your child's journey with confidence." },
  { id: "professional", label: "Professional", span: "lg:col-span-2", img: promeet, title: "Turn learning into work.", line: "Skills that ship — not just certificates." },
  { id: "organization", label: "Organization", span: "sm:col-span-2 lg:col-span-2", img: orgmeet, title: "Build understanding that stays.", line: "Across your entire institution — every classroom, every team."  },
];

const ABOUT_STATS = [
  { n: "22", label: "Indian languages" },
  { n: "4", label: "Ways to use it" },
  { n: "1", label: "Memory per person" },
  { n: "100%", label: "Data stored in India" },
];

const BELIEFS = [
  {
    n: "01",
    title: "Understanding over scores.",
    short: "Measure what people can do, not what they watched.",
    copy: "We measure what people can do with what they know — not how long they watched or how many boxes they ticked. A score tells you what happened after learning was complete. We focus on what is happening while learning is in progress."
  },
  {
    n: "02",
    title: "Continuity over restarts.",
    short: "Understanding travels — across days, devices, and years.",
    copy: "Your understanding travels with you. Across days, devices, classes, and years — you never start over. When you move from one grade to the next, from one school to the next, from one career to the next, everything you built is still there."
  },
  {
    n: "03",
    title: "One intelligence, every role.",
    short: "One system serving every role, not five tools.",
    copy: "The same underlying intelligence serves the student, the teacher, the parent, the professional, and the organization. Not five different tools. One system that understands what each person needs and responds accordingly."
  },
  {
    n: "04",
    title: "Language is access.",
    short: "22 Indian languages, natively — not translated.",
    copy: "If you can only learn in English, you can only reach the people who think in English. Visionary works in 22 Indian languages — natively, not translated. Because the language you think in is the language you understand in."
  },
  {
    n: "05",
    title: "Private by design.",
    short: "Your learning belongs to you. We never sell data.",
    copy: "Trust is not a feature we added. It is the foundation we built on. Your learning, your questions, your gaps, and your progress belong to you — not to the platform. We do not sell your data. What you build with Visionary is yours."
  },
];

const RESEARCH_PRINCIPLES = [
  { n: "01", title: "The Socratic method.", copy: "Understanding is verified through dialogue — not delivery. Visionary explains, then asks back. When you can answer the question yourself, the understanding is yours." },
  { n: "02", title: "Mastery tracking.", copy: "Visionary tracks understanding at the concept level, not the chapter level. When a gap appears, it is addressed before the next concept is introduced. Nothing is skipped. Nothing is unnecessarily repeated." },
  { n: "03", title: "Native language pedagogy.", copy: "Research consistently shows that people understand more deeply in the language they think in. Visionary is built in 22 Indian languages from the ground up — not translated, but natively constructed." },
];

const COMMITMENTS = [
  { to: "/safety", label: "Safety", subject: "safety", line: "Age-appropriate answers by default. Flag anything — a human reviews it." },
  { to: "/privacy", label: "Privacy", subject: "lock", line: "Your memory is yours. See it, export it, or delete it — instantly." },
  { to: "/security", label: "Security", subject: "shield", line: "Encrypted end to end, signed builds, updates that arrive safely." },
  { to: "/accessibility", label: "Accessibility", subject: "accessibility", line: "Web, phone, desktop, and voice — built for 20+ languages." },
];

const LATEST = [
  { to: "/updates", tag: "Product updates", title: "What's new across Visionary", line: "Follow the product as it ships — new apps, languages, and tools." },
  { to: "/research", tag: "Research", title: "How we study learning", line: "What we're learning about understanding, published as we go." },
  { to: "/community", tag: "Community", title: "Stories from learners", line: "Notes from students, teachers, and parents using Visionary." },
];

const CONTACT_ROUTES = [
  { label: "General questions", email: "hello@visionary.org.in" },
  { label: "Schools and institutions", email: "partnerships@visionary.org.in" },
  { label: "Press and media", email: "press@visionary.org.in" },
  { label: "Safety concerns", email: "safety@visionary.org.in" },
];

/* ── THE ABOUT HUB — 'Explore everything' (founder wayfinding contract) ──
   Grouped like Google's about.google directory: Company / Support &
   programs / Trust & legal. Each group is a labeled sub-grid of the
   same flat-bordered card (ONE label top-left, thin arrow top-right,
   hover-only shadow). */
const HUB_GROUPS = [
  {
    title: "Company",
    links: [
      { to: '/careers', label: 'Careers', subject: 'briefcase' },
      { to: '/career', label: 'Career growth', subject: 'growth' },
      { to: '/research', label: 'Research', subject: 'research' },
      { to: '/community', label: 'Community', subject: 'community' },
      { to: '/contact', label: 'Contact', subject: 'mail' },
      { to: '/partners', label: 'Partners', subject: 'handshake' },
      { to: '/updates', label: 'Updates', subject: 'updates' },
      { to: '/referral', label: 'Referral', subject: 'gift' },
    ],
  },
  {
    title: "Support & programs",
    links: [
      { to: '/how-it-works', label: 'How it works', subject: 'compass' },
      { to: '/pricing', label: 'Pricing', subject: 'tag' },
      { to: '/download', label: 'Download', subject: 'download' },
      { to: '/help', label: 'Help', subject: 'help' },
    ],
  },
  {
    title: "Trust & legal",
    links: [
      { to: '/privacy', label: 'Privacy policy', subject: 'lock' },
      { to: '/terms', label: 'Terms', subject: 'document' },
      { to: '/security', label: 'Security', subject: 'shield' },
      { to: '/safety', label: 'Safety', subject: 'safety' },
      { to: '/cookies', label: 'Cookies', subject: 'cookie' },
      { to: '/accessibility', label: 'Accessibility', subject: 'accessibility' },
    ],
  },
];

/* ═══ HERO — the page's single H1 statement ═══ */
function AboutHeroSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} id="about" className="relative scroll-mt-44 overflow-hidden px-6 pb-10 pt-28 lg:pt-36" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">About Visionary</GreyTag>
        <h1 className="mx-auto mt-4 max-w-[1080px] text-center font-normal tracking-[-0.025em] leading-[1.06] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Make <span className="hero-fade-up inline-block" style={{ color: COLORS.ink }}>understanding</span> last.
        </h1>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          One intelligence that helps anyone learn, teach, support, build, and lead — anywhere, anytime, in any language.
        </p>
        <div className="mt-8 text-center">
          <Link
            to="/register"
            className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
            style={{ backgroundColor: COLORS.blue }}
          >
            Start learning free
          </Link>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ MISSION — the formal statement + the five roles it serves ═══ */
function AboutMissionSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} id="mission" className="relative scroll-mt-24 bg-white px-6 pb-24 pt-16 lg:pb-32 lg:pt-24" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Our mission</GreyTag>
        <h2 className="mx-auto max-w-[1080px] text-center font-normal tracking-[-0.025em] leading-[1.1] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Built for <span style={{ color: COLORS.blue }}>every Indian mind</span>.
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          One intelligence. Every language. A teacher for everyone.
        </p>

        <div className="mx-auto mt-24 grid w-full max-w-[1500px] grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
          {ECOSYSTEM.map((e) => (
            <div key={e.id} className="flex flex-col items-center gap-6">
              <span className="flex h-24 w-24 items-center justify-center rounded-[28px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                <e.Icon className="h-10 w-10" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>{e.label}</span>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-20 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
          One intelligence. <span style={{ color: COLORS.ink }}>One long-term journey.</span>
        </p>
      </FadeReveal>
    </section>
  );
}

/* ═══ WHY WE EXIST — editorial photo + rotating futures ═══ */
function AboutWhySection() {
  const { ref, visible } = useRevealOnce();
  const { index: futureIndex } = useCycleIndex(WHY_FUTURES.length, 4800);
  const future = WHY_FUTURES[futureIndex];
  return (
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Why we exist</GreyTag>
        <h2 className="mx-auto max-w-[1080px] text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Understand more. <span className="hero-fade-up inline-block" style={{ color: COLORS.ink }}>Forget less.</span>
        </h2>

        <div className="relative mx-auto mt-16 max-w-[1400px]">
          <div className={`overflow-hidden rounded-t-[48px] ${visible ? "hero-fade-right" : "opacity-0"}`}>
            <img
              src={imgStudentCompetitive}
              alt="School students in uniform — the future Visionary is built for"
              loading="lazy"
              decoding="async"
              className="aspect-[16/5] w-full object-cover"
            />
          </div>

          <div className="relative z-10 -mt-24 rounded-[32px] border bg-white px-6 py-12 text-center lg:-mt-32 lg:px-24 lg:py-14" style={{ borderColor: COLORS.mist }}>
            <div key={futureIndex} className="hero-fade-right mx-auto max-w-[1100px]">
              <p className="font-normal tracking-[0] leading-[1.6] text-[clamp(16px,1.6vw,20px)]" style={{ color: COLORS.grey }}>
                "{future.line}"
              </p>
              <p className="mt-8 font-medium tracking-[0] text-[15px]" style={{ color: COLORS.ink }}>
                ~ {future.role}, Visionary.
              </p>
            </div>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ THE PRODUCT — four apps, Google's 4-up product grid ═══ */
function AboutAppsSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">The product</GreyTag>
        <h2 className="mx-auto max-w-[1080px] text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Four ways to use it.
        </h2>
        <p className="mx-auto max-w-[640px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          One intelligence, four apps. See how each one works.
        </p>
        <div className="mx-auto mt-14 grid w-full max-w-[1400px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ABOUT_APPS.map(({ label, subject }) => (
            <Link key={label} to="/how-it-works"
              className="group relative flex min-h-[176px] flex-col rounded-[16px] border bg-white p-7 transition-all duration-300 hover:shadow-[0_1px_6px_rgba(32,33,36,0.1)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
              style={{ borderColor: COLORS.mist }}>
              <span className="text-[16px] font-medium leading-[1.4] tracking-[0]" style={{ color: COLORS.ink }}>{label}</span>
              <ArrowRight className="absolute right-6 top-7 h-[18px] w-[18px] transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#4285F4]" strokeWidth={1.7} style={{ color: COLORS.lightGrey }} aria-hidden="true" />
              <SpotIllustration subject={subject} className="absolute bottom-3 right-4 h-[92px] w-[92px]" />
            </Link>
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ WHO WE SERVE — five real-photo role cards + closing vision line ═══ */
function AboutBenefitsSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Who we serve</GreyTag>
        <h2 className="mx-auto max-w-[1080px] text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Whoever you are, <span style={{ color: COLORS.ink }}>it's built for you.</span>
        </h2>

        <div className="mx-auto mt-16 grid w-full max-w-[1400px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {SERVE_CARDS.map((c) => (
            <Link
              key={c.id}
              to={`/${c.id}`}
              className={`group flex flex-col overflow-hidden rounded-[28px] border bg-white transition-all hover:border-[#4285F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] ${c.span}`}
              style={{ borderColor: COLORS.mist }}
            >
              <div className="overflow-hidden">
                <img
                  src={c.img}
                  alt={`${c.label} — ${c.title}`}
                  loading="lazy"
                  decoding="async"
                  className={`w-full object-cover transition-transform duration-700 ease-google group-hover:scale-[1.03] ${c.big ? "aspect-[16/7]" : "aspect-[16/9]"}`}
                />
              </div>

              <div className={`flex flex-1 flex-col ${c.big ? "p-8 lg:p-10" : "p-7"}`}>
                <p className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[11px]" style={{ color: COLORS.grey }}>{c.label}</p>
                <h3 className={`${c.big ? "mt-[calc(clamp(22px,2.4vw,32px)*0.375)]" : "mt-[12px]"} font-medium tracking-[0] ${c.big ? "leading-[1.15] text-[clamp(22px,2.4vw,32px)]" : "leading-[1.25] text-[20px]"}`} style={{ color: COLORS.ink }}>{c.title}</h3>
                <p className={`${c.big ? "mt-[calc(clamp(22px,2.4vw,32px)*0.375)]" : "mt-[12px]"} font-normal tracking-[0] transition-all duration-300 group-hover:font-medium ${c.big ? "leading-[25px] text-[17.5px]" : "leading-[1.6] text-[15px]"}`} style={{ color: COLORS.grey }}>
                  {c.line}
                </p>
                <span className="mt-auto pt-8">
                  <span className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#121317]/30 px-6 font-medium tracking-[0.24px] text-[14px] text-[#121317] transition-all duration-300 group-hover:border-[#4285F4] group-hover:bg-[#4285F4] group-hover:text-white">
                    See the page <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mx-auto mt-16 max-w-[720px] text-center text-[19px] font-normal leading-[1.5] sm:text-[22px]" style={{ color: COLORS.grey }}>
          One connected journey — from the first question to the work you do. <span style={{ color: COLORS.ink }}>That is the world we are building.</span>
        </p>
      </FadeReveal>
    </section>
  );
}

/* ═══ STAT BAND — big light numbers + grey labels, type + white only ═══ */
function AboutStatBand() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-2 gap-y-14 lg:grid-cols-4">
          {ABOUT_STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-normal tracking-[-0.02em] leading-[1] text-[clamp(48px,5vw,72px)]" style={{ color: COLORS.ink }}>{s.n}</p>
              <p className="mt-4 font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>{s.label}</p>
            </div>
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ WHAT WE BELIEVE — photo panel + hairline label rows ═══ */
function AboutBeliefsSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto grid w-full max-w-[1280px] gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <div className="overflow-hidden rounded-[24px] border" style={{ borderColor: COLORS.mist }}>
              <img
                src={imgStudentSecondary}
                alt="A student writing out an idea until it holds — the moment Visionary is built for"
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <p className="mt-8 text-[12px] uppercase tracking-[0.43px]" style={{ color: COLORS.grey }}>What we believe</p>
            <h2 className="mt-3 text-[30px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink }}>
              Five things we build by.
            </h2>
            <p className="mt-4 max-w-[460px] text-[15px] leading-[1.6]" style={{ color: COLORS.grey }}>
              Not values we display — constraints on how we work.
            </p>
          </div>
          <div className="border-t" style={{ borderColor: COLORS.mist }}>
            {BELIEFS.map((r) => (
              <div key={r.n} className="border-b py-6" style={{ borderColor: COLORS.mist }}>
                <div className="flex items-baseline gap-4">
                  <span className="shrink-0 text-[12px] font-medium" style={{ color: COLORS.lightGrey }}>{r.n}</span>
                  <div>
                    <h3 className="text-[17px] font-medium leading-[1.4]" style={{ color: COLORS.ink }}>{r.title}</h3>
                    <p className="mt-1 text-[14px] leading-[1.6]" style={{ color: COLORS.grey }}>{r.short}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ THE COMPANY — facts, DPIIT, CIN, data storage ═══ */
function AboutCompanySection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">The company</GreyTag>
        <h2 className="mx-auto max-w-[1080px] text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Built in India. <span style={{ color: COLORS.ink }}>Built for India.</span>
        </h2>
        <p className="mx-auto max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          Visionary is built by Ecoh Solution Private Limited, incorporated in India and committed to operating within Indian law — including the Digital Personal Data Protection Act 2023.
        </p>

        <div className="mx-auto mt-16 grid w-full max-w-[1080px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Founded", value: "2025" },
            { label: "Entity", value: "Ecoh Solution Pvt. Ltd." },
            { label: "CIN", value: "U85499WB2025PTC284471" },
            { label: "Recognition", value: "DPIIT Startup India" },
          ].map((f) => (
            <div key={f.label} className="rounded-[24px] border bg-white p-7" style={{ borderColor: COLORS.mist }}>
              <p className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[11px]" style={{ color: COLORS.grey }}>{f.label}</p>
              <p className="mt-3 font-medium tracking-[0] text-[17.5px]" style={{ color: COLORS.ink }}>{f.value}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 grid w-full max-w-[1080px] grid-cols-1 gap-6 sm:grid-cols-2">
          {[
            { label: "All data stored", value: "In India." },
            { label: "All development", value: "In India." },
          ].map((f) => (
            <div key={f.label} className="rounded-[24px] border bg-white p-7" style={{ borderColor: COLORS.mist }}>
              <p className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[11px]" style={{ color: COLORS.grey }}>{f.label}</p>
              <p className="mt-3 font-medium tracking-[0] text-[17.5px]" style={{ color: COLORS.ink }}>{f.value}</p>
            </div>
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}
const IMG_FOUNDER = imgProfessionalFace;

/* ═══ THE PEOPLE — founder with real bio ═══ */
function AboutPeopleSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} id="team" className="relative scroll-mt-24 px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">The people</GreyTag>
        <h2 className="mx-auto max-w-[1080px] text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          The people <span style={{ color: COLORS.ink }}>building Visionary.</span>
        </h2>

        <div className="mx-auto mt-16 flex w-full max-w-[900px] flex-col items-center gap-10 rounded-[24px] border bg-white p-8 lg:flex-row lg:items-start lg:p-12" style={{ borderColor: COLORS.mist }}>
          <div className="h-40 w-40 shrink-0 overflow-hidden rounded-full border" style={{ borderColor: COLORS.mist }}>
            <img src={IMG_FOUNDER} alt="Md Shahid Ali, Founder and CEO of Visionary" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="font-medium tracking-[0] text-[22px]" style={{ color: COLORS.ink }}>Md Shahid Ali</p>
            <p className="mt-1 font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Founder &amp; CEO</p>
            <p className="mt-6 font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>
              Md Shahid Ali built Visionary from one conviction: that the gap between effort and understanding is the most important problem in Indian education — and that it is solvable.
            </p>
            <p className="mt-4 font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>
              Before Visionary, he studied Computer Science and Engineering at Lovely Professional University, where his undergraduate research was acquired by the university for advanced study.
            </p>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ HOW WE THINK — research grounding, photo panel ═══ */
function AboutResearchSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">How we think</GreyTag>
        <h2 className="mx-auto max-w-[1080px] text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Visionary is grounded in how <span style={{ color: COLORS.ink }}>people actually learn.</span>
        </h2>
        <p className="mx-auto max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          The way Visionary teaches is not arbitrary. It is based on decades of research in cognitive science, pedagogy, and language acquisition.
        </p>
        <div className="mx-auto mt-16 grid w-full max-w-[1400px] grid-cols-1 gap-16 lg:grid-cols-[1fr_340px] lg:gap-24 xl:gap-32">
          <div>
            {RESEARCH_PRINCIPLES.map((r, i) => (
              <div key={r.n} className={`grid grid-cols-1 gap-4 py-10 md:grid-cols-[120px_1fr] md:gap-10 ${i < RESEARCH_PRINCIPLES.length - 1 ? "border-b" : ""}`} style={{ borderColor: `${COLORS.ink}14` }}>
                <p className="font-medium tracking-[0] text-[14px]" style={{ color: COLORS.lightGrey }}>{r.n}</p>
                <div>
                  <h3 className="font-medium tracking-[0] leading-[1.2] text-[clamp(22px,2.4vw,32px)]" style={{ color: COLORS.ink }}>{r.title}</h3>
                  <p className="mt-[calc(clamp(22px,2.4vw,32px)*0.545)] max-w-[640px] font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>{r.copy}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-start justify-center">
            <div className="w-full max-w-[340px] overflow-hidden rounded-[24px] border" style={{ borderColor: COLORS.mist }}>
              <img
                src={imgProblemPractice}
                alt="A learner working through practice problems at a desk"
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ OUR COMMITMENTS — one Google-style trust row linking out ═══ */
function AboutCommitmentsSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Our commitments</GreyTag>
        <h2 className="mx-auto max-w-[1080px] text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          Trust is built in. <span style={{ color: COLORS.ink }}>Not bolted on.</span>
        </h2>
        <p className="mx-auto max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          Four promises we keep on every page — read the detail behind each one.
        </p>

        <div className="mx-auto mt-14 grid w-full max-w-[1400px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {COMMITMENTS.map(({ to, label, subject, line }) => (
            <Link key={to} to={to}
              className="group relative flex min-h-[200px] flex-col rounded-[16px] border bg-white p-7 transition-all duration-300 hover:shadow-[0_1px_6px_rgba(32,33,36,0.1)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
              style={{ borderColor: COLORS.mist }}>
              <span className="text-[16px] font-medium leading-[1.4] tracking-[0]" style={{ color: COLORS.ink }}>{label}</span>
              <span className="mt-2 pr-16 text-[14px] font-normal leading-[1.55] tracking-[0]" style={{ color: COLORS.grey }}>{line}</span>
              <ArrowRight className="absolute right-6 top-7 h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.7} style={{ color: COLORS.lightGrey }} aria-hidden="true" />
              <SpotIllustration subject={subject} className="absolute bottom-3 right-4 h-[80px] w-[80px]" />
            </Link>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[15px]" style={{ color: COLORS.grey }}>
          Fair rules, in plain language — read our <Link to="/terms" className="font-medium hover:underline" style={{ color: COLORS.blue }}>terms</Link> and <Link to="/cookies" className="font-medium hover:underline" style={{ color: COLORS.blue }}>cookie policy</Link>.
        </p>
      </FadeReveal>
    </section>
  );
}

/* ═══ GET IN TOUCH — 4 specific routes ═══ */
function AboutContactSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Get in touch</GreyTag>
        <h2 className="mx-auto max-w-[1080px] text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          We would like to <span style={{ color: COLORS.ink }}>hear from you.</span>
        </h2>

        <div className="mx-auto mt-16 grid w-full max-w-[1080px] grid-cols-1 gap-6 sm:grid-cols-2">
          {CONTACT_ROUTES.map((c) => (
            <a key={c.email} href={`mailto:${c.email}`} className="group flex flex-col rounded-[24px] border bg-white p-7 transition-all hover:border-[#4285F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ borderColor: COLORS.mist }}>
              <p className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[11px]" style={{ color: COLORS.grey }}>{c.label}</p>
              <p className="mt-3 font-medium tracking-[0] text-[17.5px]" style={{ color: COLORS.ink }}>{c.email}</p>
              <span className="mt-4 inline-flex items-center gap-1 font-normal tracking-[0] text-[14px] group-hover:underline" style={{ color: COLORS.blue }}>
                Send email <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          We respond within one business day. For urgent safety concerns, we respond within 24 hours.
        </p>
      </FadeReveal>
    </section>
  );
}

/* ═══ THE LATEST — blog.google news-card grammar: label → headline → read ═══ */
function AboutLatestSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">The latest</GreyTag>
        <h2 className="mx-auto max-w-[1080px] text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>
          News from Visionary.
        </h2>

        <div className="mx-auto mt-14 grid w-full max-w-[1400px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {LATEST.map((c) => (
            <Link key={c.to} to={c.to}
              className="group flex flex-col rounded-[16px] border bg-white p-7 transition-all duration-300 hover:shadow-[0_1px_6px_rgba(32,33,36,0.1)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
              style={{ borderColor: COLORS.mist }}>
              <p className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>{c.tag}</p>
              <h3 className="mt-3 text-[22px] font-medium leading-[1.25] tracking-[0]" style={{ color: COLORS.ink }}>{c.title}</h3>
              <p className="mt-2 text-[15px] font-normal leading-[1.6]" style={{ color: COLORS.grey }}>{c.line}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-6 text-[14px] font-medium" style={{ color: COLORS.blue }}>
                Read more <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}

function AboutHubSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} data-section="hub" className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Explore</GreyTag>
        <h2 className="mt-4 text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink }}>
          Explore everything.
        </h2>
        <p className="mx-auto mt-5 max-w-[560px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Every page of Visionary, one grid. Start anywhere.
        </p>

        <div className="mx-auto mt-14 grid w-full max-w-[1280px] grid-cols-1 gap-y-16 lg:gap-y-20">
          {HUB_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-6 text-[12px] font-medium uppercase tracking-[0.43px]" style={{ color: COLORS.grey }}>
                {group.title}
              </p>
              <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {group.links.map(({ to, label, subject }) => (
                  <Link key={to} to={to} className="group relative flex min-h-[176px] flex-col rounded-[16px] border bg-white p-7 transition-all duration-300 hover:shadow-[0_1px_6px_rgba(32,33,36,0.1)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ borderColor: COLORS.mist }}>
                    <span className="text-[16px] font-medium leading-[1.4] tracking-[0]" style={{ color: COLORS.ink }}>{label}</span>
                    <ArrowRight className="absolute right-6 top-7 h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.7} style={{ color: COLORS.lightGrey }} aria-hidden="true" />
                    <SpotIllustration subject={subject} className="absolute bottom-3 right-4 h-[92px] w-[92px]" />
                  </Link>
                ))}
                {/* pad the last row so the grid stays flush-left across groups */}
                <div aria-hidden="true" className="hidden min-h-[168px] lg:block" />
              </div>
            </div>
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ NEWSLETTER — Google's "Get the latest" pattern ═══ */
function AboutNewsletterSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto max-w-[640px] text-center">
          <GreyTag className="text-center">Newsletter</GreyTag>
          <h2 className="mt-6 font-normal tracking-[-0.02em] leading-[1.06] text-[34px] sm:text-[42px]" style={{ color: COLORS.ink }}>
            Get the latest news from Visionary
          </h2>
          <p className="mx-auto mt-6 max-w-[560px] font-normal tracking-[0] leading-[26px] text-[17px]" style={{ color: COLORS.grey }}>
            Product updates, research highlights, and learning tips — no spam, ever.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const email = e.target.elements.email.value;
              if (email) window.location.href = `/register?ref=newsletter&email=${encodeURIComponent(email)}`;
            }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              className="flex-1 rounded-[32px] border border-[#dadce0] px-6 py-3.5 text-[15px] placeholder-[#9AA0A6] outline-none focus:border-[#4285F4]"
              style={{ backgroundColor: COLORS.white }}
            />
            <button
              type="submit"
              className="rounded-full px-10 font-medium text-[15px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
              style={{ backgroundColor: COLORS.blue }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ FINAL CTA — account-style closing band ═══ */
function AboutCTASection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-28 lg:py-36" style={{ fontFamily: FONT_FAMILY }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <GreyTag className="text-center">Start here</GreyTag>
        <h2 className="mt-6 font-normal tracking-[-0.03em] leading-[1.12] text-[36px] sm:text-[48px]" style={{ color: COLORS.ink }}>
          Start using Visionary. <br />Or see how it works first.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Free to start. No account needed to ask your first question.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/register" className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ backgroundColor: COLORS.blue }}>
            Get started
          </Link>
          <Link to="/how-it-works" className="inline-flex h-14 items-center justify-center rounded-full border px-10 font-medium tracking-[0] text-[16px] transition-colors hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
            See how it works
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══ PAGE ═══ */
export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <AboutHeroSection />
        <AboutMissionSection />
        <AboutWhySection />
        <AboutAppsSection />
        <AboutBenefitsSection />
        <AboutStatBand />
        <AboutBeliefsSection />
        <AboutCompanySection />
        <AboutPeopleSection />
        <AboutResearchSection />
        <AboutCommitmentsSection />
        <AboutContactSection />
        <AboutLatestSection />
        <AboutHubSection />
        <AboutNewsletterSection />
        <AboutCTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
