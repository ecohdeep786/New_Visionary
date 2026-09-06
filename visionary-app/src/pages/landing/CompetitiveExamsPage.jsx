import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, Users, HeartHandshake, Briefcase, Building2,
  ArrowRight, ShieldCheck, BadgeCheck, Eye, Lock, Shield,
  Monitor, Smartphone, Laptop, Globe, Mic,
  FileText, Cookie, RefreshCw, Flag, Check,
} from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

/* ═══ TOKENS (one system across all pages) ═══ */
const COLORS = {
  ink: "#121317",
  surface: "#F5F6F8",
  blue: "#4285F4",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  chipBg: "#D2E3FC",
  white: "#ffffff",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* Observational photography — replace with real commissioned imagery before launch */
const IMG_STORY = "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png";
const IMG_APPROACH = "https://storage.googleapis.com/gweb-research2023-media/images/Gemini.width-800.png";
const IMG_BENEFITS = "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png";
const IMG_IMPACT_1 = "https://storage.googleapis.com/gweb-research2023-media/images/Gemini.width-800.png";
const IMG_IMPACT_2 = "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png";
const IMG_FUTURE = "https://storage.googleapis.com/gweb-research2023-media/images/Gemini.width-800.png";
const IMG_SAFETY = "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png";
const IMG_ACCESS = "https://storage.googleapis.com/gweb-research2023-media/images/Gemini.width-800.png";
const IMG_WHY = "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png";

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
function useScrollSpy(ids, offset = 150) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const onScroll = () => {
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids, offset]);
  return active;
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
    <div className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
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
const IconTile = React.memo(function IconTile({ Icon }) {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
      <Icon className="h-6 w-6" strokeWidth={1.8} />
    </span>
  );
});

/* ═══ MODELS ═══ */
const PILL_SECTIONS = [
  { id: "about", label: "About" },
  { id: "safety", label: "Safety" },
  { id: "privacy", label: "Privacy" },
  { id: "security", label: "Security" },
  { id: "accessibility", label: "Accessibility" },
  { id: "terms", label: "Terms" },
  { id: "cookies", label: "Cookies" },
];
const PILL_IDS = PILL_SECTIONS.map((s) => s.id);

const ECOSYSTEM = [
  { id: "student", label: "Student", Icon: GraduationCap },
  { id: "teacher", label: "Teacher", Icon: Users },
  { id: "parent", label: "Parent", Icon: HeartHandshake },
  { id: "professional", label: "Professional", Icon: Briefcase },
  { id: "organization", label: "Organization", Icon: Building2 },
];

const PROBLEMS = [
  "One lesson for thirty different minds.",
  "Learning restarts every year, every class, every device.",
  "Scores measure one day, not understanding.",
  "Parents see a report card, not the journey.",
];

const LOOP_STEPS = ["Understand", "Ask", "Practise", "Build", "Continue"];

const BENEFITS = [
  { id: "student", label: "Student", Icon: GraduationCap, line: "Understand what you're learning — and carry it forward." },
  { id: "teacher", label: "Teacher", Icon: Users, line: "See who understood, and teach every learner." },
  { id: "parent", label: "Parent", Icon: HeartHandshake, line: "Follow your child's journey with confidence." },
  { id: "professional", label: "Professional", Icon: Briefcase, line: "Turn learning into the work you do." },
  { id: "organization", label: "Organization", Icon: Building2, line: "Connect learning across every person and team." },
];

const IMPACT_STORIES = [
  { img: IMG_IMPACT_1, quote: "I used to forget what I learned by next week. Now it stays with me.", who: "A student, grade 9 · Pune" },
  { img: IMG_IMPACT_2, quote: "For the first time, I can see exactly where each of my 40 students stands.", who: "A teacher · Chennai" },
];

const NEXT_CHIPS = ["More languages", "Offline-first mobile", "School & district rollout", "Career pathways", "Open research"];

const ACCESS_CHIPS = [
  { Icon: Monitor, t: "Web" },
  { Icon: Smartphone, t: "Phone" },
  { Icon: Laptop, t: "Desktop" },
  { Icon: Mic, t: "Voice + text" },
  { Icon: Globe, t: "20+ languages" },
];

const MISSION_WORDS = ["in any language.", "at any age.", "for every role."];

const WHY_FUTURES = [
  { role: "Student", line: "Lessons used to fade by Friday. Now the understanding stays with you." },
  { role: "Teacher", line: "One lesson, forty different minds. Now you see every one of them." },
  { role: "Parent", line: "The report card came too late. Now you know this week — and where to help." },
  { role: "Professional", line: "Courses ended, and skills ended with them. Now they go to work with you." },
  { role: "Organization", line: "Attendance said who showed up. Now you see who understood." },
];



const APPROACH_ROWS = [
  { n: "01", title: "Start from what you know.", copy: "Every journey begins where you are — not where the syllabus happens to be." },
  { n: "02", title: "Make it make sense.", copy: "Visual, conversational, and in your language, until it clicks." },
  { n: "03", title: "Keep it for life.", copy: "What you understand today becomes the foundation for what you become tomorrow." },
];

const SERVE_CARDS = [
  { id: "student", label: "Student", big: true, span: "sm:col-span-2 lg:col-span-4", img: IMG_BENEFITS, title: "Understand what you're learning.", line: "From the first question to what you build from it — and it stays with you for life." },
  { id: "teacher", label: "Teacher", span: "lg:col-span-2", img: IMG_BENEFITS, title: "See who understood.", line: "Reach the ones who didn't — before the next bell." },
  { id: "parent", label: "Parent", span: "lg:col-span-2", img: IMG_BENEFITS, title: "Know the week, not the report card.", line: "Follow your child's journey with confidence." },
  { id: "professional", label: "Professional", span: "lg:col-span-2", img: IMG_BENEFITS, title: "Turn learning into work.", line: "Skills that ship — not just certificates." },
  { id: "organization", label: "Organization", span: "sm:col-span-2 lg:col-span-2", img: IMG_BENEFITS, title: "Build understanding that stays.", line: "Across your entire institution — every classroom, every team."  },
];

const SAFETY_PILLARS = [
  { Icon: ShieldCheck, title: "You see age-appropriate answers.", copy: "Every explanation is checked against guidance for the learner's age — before it reaches them." },
  { Icon: BadgeCheck, title: "You're protected by default.", copy: "Safeguards are on from the first question. Nothing to configure." },
  { Icon: Eye, title: "You can flag anything.", copy: "Report any answer, anytime. A human reviews it and fixes it." },
];
const SAFETY_TOOLS = [
  { Icon: Users, t: "Family controls" },
  { Icon: Flag, t: "Report anything" },
  { Icon: BadgeCheck, t: "Safe by default" },
  { Icon: ShieldCheck, t: "Reviewed guidance" },
];

const PRIVACY_PILLARS = [
  { Icon: Lock, title: "You share only what you need to.", copy: "Visionary remembers your learning — not your life." },
  { Icon: Eye, title: "You see everything we remember.", copy: "One screen shows every note Visionary keeps about you." },
  { Icon: BadgeCheck, title: "You'll never be sold.", copy: "No ads. No data sales. Ever." },
  { Icon: ShieldCheck, title: "You're private before you ask.", copy: "Defaults protect you before you touch a setting." },
];

const SECURITY_ROWS = [
  { n: "01", title: "Your journey stays unreadable to others.", copy: "Encrypted in transit and at rest." },
  { n: "02", title: "Your app verifies itself.", copy: "Every build is signed; updates arrive safely, automatically." },
  { n: "03", title: "Your report gets fixed.", copy: "Responsible disclosure — we listen, we patch, we tell you." },
];

/* ═══ HERO ═══ */
function AboutHeroSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} id="about" className="relative scroll-mt-44 overflow-hidden px-6 pb-10 pt-40 lg:pt-48" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <h1 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Make <span className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>understanding</span> last.
        </h1>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          One intelligence that helps anyone learn, teach, support, build, and lead — anywhere, anytime, in any language.
        </p>
      </FadeReveal>
    </section>
  );
}

/* ═══ STICKY SECTION TABS ═══ */
function AboutSectionTabs() {
  const active = useScrollSpy(PILL_IDS);
  const goTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <div className="sticky top-16 z-30 bg-white/90 px-6 py-6 backdrop-blur-md">
      <div className="mx-auto flex h-[52px] w-full max-w-[1080px] items-stretch overflow-hidden rounded-[90px] border bg-white p-0" style={{ borderColor: COLORS.mist }} role="tablist" aria-label="About page sections">
        {PILL_SECTIONS.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={active === s.id} onClick={() => goTo(s.id)}
            className={`flex h-full flex-1 items-center justify-center rounded-[90px] text-[12px] sm:text-[14px] tracking-[0.24px] transition-colors ${active === s.id ? "font-medium" : "font-normal hover:bg-[#f8f9fa]"}`}
            style={{ backgroundColor: active === s.id ? COLORS.ink : "transparent", color: active === s.id ? "#ffffff" : COLORS.grey }}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══ A1 · OUR MISSION ═══ */
function AboutMissionSection() {
  const { ref, visible } = useRevealOnce();
  const { index: wordIndex } = useCycleIndex(MISSION_WORDS.length, 2400);
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Our mission</GreyTag>
        <h2 className="mx-auto mt-6 max-w-[1200px] text-center font-medium tracking-[0] leading-[1.15] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Our mission is to make <span style={{ color: COLORS.ink }}>understanding</span> last for{" "}
          <span style={{ color: COLORS.blue }}>anyone</span>, <span style={{ color: COLORS.blue }}>anywhere</span>,{" "}
          <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{MISSION_WORDS[wordIndex]}</span>
        </h2>
        <p className="mx-auto mt-8 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          We build one intelligence that remembers what you understood, where you struggled, and what you built — and carries it forward, from a student's first question to an organization's whole journey.
        </p>

        <div className="mx-auto mt-32 grid w-full max-w-[1500px] grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
          {ECOSYSTEM.map((e) => (
            <div key={e.id} className="flex flex-col items-center gap-6">
              <span className="flex h-24 w-24 items-center justify-center rounded-[28px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                <e.Icon className="h-10 w-10" strokeWidth={1.8} />
              </span>
              <span className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>{e.label}</span>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-20 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
          One intelligence. <span style={{ color: COLORS.blue }}>One long-term journey.</span>
        </p>
      </FadeReveal>
    </section>
  );
}

/* ═══ A2 · WHY WE EXIST — FIXED: white rectangle same width as image ═══ */
function AboutWhySection() {
  const { ref, visible } = useRevealOnce();
  const { index: futureIndex } = useCycleIndex(WHY_FUTURES.length, 4800);
  const future = WHY_FUTURES[futureIndex];
  return (
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Why we exist</GreyTag>
        <h2 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Understand more. <span className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>Forget less.</span>
        </h2>

        <div className="relative mx-auto mt-16 max-w-[1400px]">
          <div className={`overflow-hidden rounded-t-[48px] ${visible ? "hero-fade-right" : "opacity-0"}`}>
            <img
              src={IMG_WHY}
              alt="School students in uniform — the future Visionary is built for"
              loading="lazy"
              decoding="async"
              className="aspect-[16/5] w-full object-cover"
            />
          </div>

          {/* FIXED: removed mx-6 lg:mx-16 insets so width matches image exactly */}
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

/* ═══ A3 · OUR APPROACH ═══ */
function AboutApproachSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Our approach</GreyTag>
        <h2 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          We don't teach people. <span style={{ color: COLORS.blue }}>We remember them.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Every person on Visionary builds a private, growing record of what they understood, where they struggled, and what they made. That record — not the content — is what changes everything.
        </p>

        <div className={`mx-auto mt-16 flex w-full max-w-[1080px] flex-wrap items-center justify-center gap-3 ${visible ? "hero-fade-right" : "opacity-0"}`}>
          {LOOP_STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <span className="rounded-full border bg-white px-6 py-3 font-normal tracking-[0.24px] text-[14px]" style={{ borderColor: i === 0 ? COLORS.blue : COLORS.mist, color: i === 0 ? COLORS.blue : COLORS.ink }}>
                {s}
              </span>
              {i < LOOP_STEPS.length - 1 && <ArrowRight className="h-4 w-4" strokeWidth={1.8} style={{ color: COLORS.lightGrey }} />}
            </React.Fragment>
          ))}
          <span className="flex items-center gap-2 px-2 font-normal tracking-[0.24px] text-[13px]" style={{ color: COLORS.lightGrey }}>
            <RefreshCw className="h-4 w-4" strokeWidth={1.8} /> back to Understand
          </span>
        </div>

        <div className="mx-auto mt-16 w-full max-w-[1080px]">
          {APPROACH_ROWS.map((r, i) => (
            <div key={r.n} className={`grid grid-cols-1 gap-4 py-10 md:grid-cols-[120px_1fr] md:gap-10 ${i < APPROACH_ROWS.length - 1 ? "border-b" : ""}`} style={{ borderColor: `${COLORS.ink}14` }}>
              <p className="font-medium tracking-[0] text-[14px]" style={{ color: COLORS.blue }}>{r.n}</p>
              <div>
                <h3 className="font-medium tracking-[0] leading-[1.2] text-[clamp(22px,2.4vw,32px)]" style={{ color: COLORS.ink }}>{r.title}</h3>
                <p className="mt-3 max-w-[640px] font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>{r.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ A4 · WHO WE SERVE ═══ */
function AboutBenefitsSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Who we serve</GreyTag>
        <h2 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Whoever you are, <span style={{ color: COLORS.blue }}>it's built for you.</span>
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
                  className={`w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] ${c.big ? "aspect-[16/7]" : "aspect-[16/9]"}`}
                />
              </div>

              <div className={`flex flex-1 flex-col ${c.big ? "p-8 lg:p-10" : "p-7"}`}>
                <p className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[11px]" style={{ color: COLORS.grey }}>{c.label}</p>
                <h3 className={`mt-3 font-medium tracking-[0] ${c.big ? "leading-[1.15] text-[clamp(22px,2.4vw,32px)]" : "leading-[1.25] text-[20px]"}`} style={{ color: COLORS.ink }}>
                  {c.title}
                </h3>
                <p className={`mt-3 font-normal tracking-[0] transition-all duration-300 group-hover:font-medium ${c.big ? "leading-[25px] text-[17.5px]" : "leading-[1.6] text-[15px]"}`} style={{ color: COLORS.grey }}>
                  {c.line}
                </p>
                <span className="mt-auto pt-8">
                  <span className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#121317]/30 px-6 font-medium tracking-[0.24px] text-[14px] text-[#121317] transition-all duration-300 group-hover:border-[#4285F4] group-hover:bg-[#4285F4] group-hover:text-white">
                    See the page <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ B · SAFETY ═══ */
function AboutSafetySection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} id="safety" className="relative scroll-mt-44 bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Safety</GreyTag>
        <h2 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Safe to <span style={{ color: COLORS.blue }}>grow with.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Every answer, every interaction is built to protect the person learning — especially the youngest.
        </p>

        <div className="mx-auto mt-16 grid w-full max-w-[1400px] grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="overflow-hidden rounded-[48px]">
            <img src={IMG_SAFETY} alt="A young learner with a trusted adult, learning safely" loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
          </div>
          <div className="grid grid-cols-1 gap-6">
            {SAFETY_PILLARS.map((c) => (
              <div key={c.title} className="rounded-[24px] border p-7" style={{ borderColor: COLORS.mist, backgroundColor: COLORS.surface }}>
                <IconTile Icon={c.Icon} />
                <h3 className="mt-6 font-medium tracking-[0] leading-[1.25] text-[20px]" style={{ color: COLORS.ink }}>{c.title}</h3>
                <p className="mt-3 font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>{c.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-12 flex w-full max-w-[900px] flex-wrap items-center justify-center gap-3">
          {SAFETY_TOOLS.map(({ Icon, t }) => (
            <span key={t} className="flex items-center gap-2 rounded-full border bg-white px-5 py-2.5 font-normal tracking-[0.24px] text-[13px]" style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
              <Icon className="h-4 w-4" strokeWidth={1.8} style={{ color: COLORS.blue }} /> {t}
            </span>
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ C · PRIVACY ═══ */
function AboutPrivacySection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} id="privacy" className="relative scroll-mt-44 px-6 py-24 lg:py-32" style={{ backgroundColor: COLORS.surface, fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Privacy</GreyTag>
        <h2 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your memory is yours. <span style={{ color: COLORS.blue }}>Private by design.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Privacy here isn't a setting. It's the default — and you hold the controls.
        </p>

        <div className="mx-auto mt-16 grid w-full max-w-[1400px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRIVACY_PILLARS.map((c) => (
            <div key={c.title} className="rounded-[24px] border bg-white p-7" style={{ borderColor: COLORS.mist }}>
              <IconTile Icon={c.Icon} />
              <h3 className="mt-6 font-medium tracking-[0] leading-[1.25] text-[20px]" style={{ color: COLORS.ink }}>{c.title}</h3>
              <p className="mt-3 font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>{c.copy}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 w-full max-w-[760px] rounded-[24px] border bg-white p-8" style={{ borderColor: COLORS.mist }}>
          <div className="flex items-center gap-4">
            <IconTile Icon={Lock} />
            <p className="font-medium tracking-[0] text-[20px]" style={{ color: COLORS.ink }}>Your memory, your controls</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {["See everything", "Export", "Delete all"].map((b) => (
              <span key={b} className="inline-flex h-11 items-center justify-center rounded-full border px-6 font-medium tracking-[0.24px] text-[14px]" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
                {b}
              </span>
            ))}
          </div>
          <p className="mt-5 font-normal tracking-[0] leading-[1.6] text-[13px]" style={{ color: COLORS.lightGrey }}>
            Instant. No emails, no waiting. Your call, always.
          </p>
        </div>

        <div className="mt-12 text-center">
          <Link to="/privacy" className="inline-flex items-center gap-1 font-normal tracking-[0] text-[15px]" style={{ color: COLORS.blue }}>
            Read the privacy policy <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </Link>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ D · SECURITY ═══ */
function AboutSecuritySection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} id="security" className="relative scroll-mt-44 bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Security</GreyTag>
        <h2 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Protected <span style={{ color: COLORS.blue }}>end to end.</span>
        </h2>

        <div className="mx-auto mt-16 grid w-full max-w-[1400px] grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            {SECURITY_ROWS.map((r, i) => (
              <div key={r.n} className={`grid grid-cols-1 gap-4 py-10 md:grid-cols-[120px_1fr] md:gap-10 ${i < SECURITY_ROWS.length - 1 ? "border-b" : ""}`} style={{ borderColor: `${COLORS.ink}14` }}>
                <p className="font-medium tracking-[0] text-[14px]" style={{ color: COLORS.blue }}>{r.n}</p>
                <div>
                  <h3 className="font-medium tracking-[0] leading-[1.2] text-[clamp(22px,2.4vw,32px)]" style={{ color: COLORS.ink }}>{r.title}</h3>
                  <p className="mt-3 max-w-[640px] font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>{r.copy}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[24px] border p-8" style={{ borderColor: COLORS.mist, backgroundColor: COLORS.surface }}>
            <div className="flex items-center gap-4">
              <IconTile Icon={Shield} />
              <p className="font-medium tracking-[0] text-[20px]" style={{ color: COLORS.ink }}>Protection status</p>
            </div>
            <div className="mt-6 space-y-4">
              {[["Encryption", "on"], ["Signed builds", "verified"], ["Updates", "automatic"]].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-[16px] border bg-white px-5 py-4" style={{ borderColor: COLORS.mist }}>
                  <span className="font-normal tracking-[0] text-[15px]" style={{ color: COLORS.ink }}>{k}</span>
                  <span className="flex items-center gap-2 font-medium tracking-[0] text-[13px] uppercase tracking-[0.43px]" style={{ color: COLORS.blue }}>
                    <Check className="h-4 w-4" strokeWidth={2} /> {v}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-5 font-normal tracking-[0] leading-[1.6] text-[13px]" style={{ color: COLORS.lightGrey }}>
              Checked on every visit.
            </p>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ E · ACCESSIBILITY ═══ */
function AboutAccessibilitySection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} id="accessibility" className="relative scroll-mt-44 px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Accessibility</GreyTag>
        <h2 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Everywhere you learn.
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Learning shouldn't stop because of where you are, what device you have, or what language you think in.
        </p>

        <div className="mx-auto mt-16 grid w-full max-w-[1400px] grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="overflow-hidden rounded-[48px]">
            <img src={IMG_ACCESS} alt="People learning on different devices in different places" loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
          </div>
          <div>
            <div className="flex flex-wrap gap-3">
              {ACCESS_CHIPS.map(({ Icon, t }) => (
                <span key={t} className="flex items-center gap-2 rounded-full border bg-white px-5 py-2.5 font-normal tracking-[0.24px] text-[13px]" style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                  <Icon className="h-4 w-4" strokeWidth={1.8} style={{ color: COLORS.blue }} /> {t}
                </span>
              ))}
              <span className="rounded-full border bg-white px-5 py-2.5 font-normal tracking-[0.24px] text-[13px]" style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                Works on low bandwidth
              </span>
            </div>
            <div className="mt-8">
              <Link to="/download" className="inline-flex items-center gap-1 font-normal tracking-[0] text-[15px]" style={{ color: COLORS.blue }}>
                See download options <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ F · TERMS ═══ */
function AboutTermsSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} id="terms" className="relative scroll-mt-44 bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto flex max-w-[1080px] flex-col items-center gap-10 text-center lg:flex-row lg:items-start lg:text-left">
          <IconTile Icon={FileText} />
          <div>
            <GreyTag>Terms</GreyTag>
            <h2 className="mt-4 font-medium tracking-[0] leading-[1.075] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
              Fair rules, in plain language.
            </h2>
            <div className="mt-6 max-w-[760px] space-y-3">
              {["You own what you create.", "We only use your data to make your learning better.", "Clear cancellation, no lock-in."].map((t) => (
                <p key={t} className="font-normal tracking-[0] leading-[1.6] text-[17.5px]" style={{ color: COLORS.grey }}>{t}</p>
              ))}
            </div>
            <Link to="/terms" className="mt-8 inline-flex items-center gap-1 font-normal tracking-[0] text-[15px]" style={{ color: COLORS.blue }}>
              Read the full terms <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ G · COOKIES ═══ */
function AboutCookiesSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} id="cookies" className="relative scroll-mt-44 px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto flex max-w-[1080px] flex-col items-center gap-10 text-center lg:flex-row lg:items-start lg:text-left">
          <IconTile Icon={Cookie} />
          <div>
            <GreyTag>Cookies</GreyTag>
            <h2 className="mt-4 font-medium tracking-[0] leading-[1.075] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
              Only what's needed.
            </h2>
            <div className="mt-6 max-w-[760px] space-y-3">
              {["Essential cookies keep you signed in.", "No advertising cookies, ever.", "Analytics only with your consent."].map((t) => (
                <p key={t} className="font-normal tracking-[0] leading-[1.6] text-[17.5px]" style={{ color: COLORS.grey }}>{t}</p>
              ))}
            </div>
            <Link to="/cookies" className="mt-8 inline-flex items-center gap-1 font-normal tracking-[0] text-[15px]" style={{ color: COLORS.blue }}>
              Read the cookie policy <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

const BELIEFS = [
  {
    n: "01",
    title: "Understanding over scores.",
    copy: "We measure what people can do with what they know — not how long they watched or how many boxes they ticked. A score tells you what happened after learning was complete. We focus on what is happening while learning is in progress."
  },
  {
    n: "02",
    title: "Continuity over restarts.",
    copy: "Your understanding travels with you. Across days, devices, classes, and years — you never start over. When you move from one grade to the next, from one school to the next, from one career to the next, everything you built is still there."
  },
  {
    n: "03",
    title: "One intelligence, every role.",
    copy: "The same underlying intelligence serves the student, the teacher, the parent, the professional, and the organization. Not five different tools. One system that understands what each person needs and responds accordingly."
  },
  {
    n: "04",
    title: "Language is access.",
    copy: "If you can only learn in English, you can only reach the people who think in English. Visionary works in 22 Indian languages — natively, not translated. Because the language you think in is the language you understand in."
  },
  {
    n: "05",
    title: "Private by design.",
    copy: "Trust is not a feature we added. It is the foundation we built on. Your learning, your questions, your gaps, and your progress belong to you — not to the platform. We do not sell your data. What you build with Visionary is yours."
  },
];
/* ═══ A3 · WHAT WE BELIEVE — loop diagram + 5 expanded beliefs ═══ */
function AboutBeliefsSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">What we believe</GreyTag>
        <h2 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Five things <span style={{ color: COLORS.blue }}>we build by.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          These are not values we display. They are constraints on how we work.
        </p>

        {/* Loop diagram — still shows HOW the beliefs are delivered */}
        <div className={`mx-auto mt-16 flex w-full max-w-[1080px] flex-wrap items-center justify-center gap-3 ${visible ? "hero-fade-right" : "opacity-0"}`}>
          {LOOP_STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <span className="rounded-full border bg-white px-6 py-3 font-normal tracking-[0.24px] text-[14px]" style={{ borderColor: i === 0 ? COLORS.blue : COLORS.mist, color: i === 0 ? COLORS.blue : COLORS.ink }}>
                {s}
              </span>
              {i < LOOP_STEPS.length - 1 && <ArrowRight className="h-4 w-4" strokeWidth={1.8} style={{ color: COLORS.lightGrey }} />}
            </React.Fragment>
          ))}
          <span className="flex items-center gap-2 px-2 font-normal tracking-[0.24px] text-[13px]" style={{ color: COLORS.lightGrey }}>
            <RefreshCw className="h-4 w-4" strokeWidth={1.8} /> back to Understand
          </span>
        </div>

        {/* 5 expanded beliefs */}
        <div className="mx-auto mt-16 w-full max-w-[1080px]">
          {BELIEFS.map((r, i) => (
            <div key={r.n} className={`grid grid-cols-1 gap-4 py-10 md:grid-cols-[120px_1fr] md:gap-10 ${i < BELIEFS.length - 1 ? "border-b" : ""}`} style={{ borderColor: `${COLORS.ink}14` }}>
              <p className="font-medium tracking-[0] text-[14px]" style={{ color: COLORS.blue }}>{r.n}</p>
              <div>
                <h3 className="font-medium tracking-[0] leading-[1.2] text-[clamp(22px,2.4vw,32px)]" style={{ color: COLORS.ink }}>{r.title}</h3>
                <p className="mt-3 max-w-[640px] font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>{r.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}/* ═══ OUR VISION — direct statements, stated as fact ═══ */
function AboutVisionSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ backgroundColor: COLORS.surface, fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Our vision</GreyTag>
        <h2 className="mx-auto mt-4 max-w-[1400px] text-center font-medium tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
          A student whose understanding follows them from classroom to career.
          <br />
          A teacher who sees every learner.
          <br />
          A parent who helps before the test.
          <br />
          A team that learns faster than it forgets.
        </h2>
        <p className="mx-auto mt-14 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)]" style={{ color: COLORS.blue }}>
          That is the world we are building — one connected mind at a time.
        </p>
      </FadeReveal>
    </section>
  );
}/* ═══ THE COMPANY — facts, DPIIT, CIN, data storage ═══ */
function AboutCompanySection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">The company</GreyTag>
        <h2 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Built in India. <span style={{ color: COLORS.blue }}>Built for India.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Visionary is built by Ecoh Solution Private Limited, incorporated in India and committed to operating within Indian law — including the Digital Personal Data Protection Act 2023.
        </p>

        <div className="mx-auto mt-16 grid w-full max-w-[1080px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Founded", value: "2025" },
            { label: "Entity", value: "Ecoh Solution Pvt. Ltd." },
            { label: "CIN", value: "U85499WB2025PTC284471" },
            { label: "Recognition", value: "DPIIT Startup India" },
          ].map((f) => (
            <div key={f.label} className="rounded-[24px] border p-7" style={{ borderColor: COLORS.mist, backgroundColor: COLORS.surface }}>
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
            <div key={f.label} className="rounded-[24px] border p-7" style={{ borderColor: COLORS.mist, backgroundColor: COLORS.surface }}>
              <p className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[11px]" style={{ color: COLORS.grey }}>{f.label}</p>
              <p className="mt-3 font-medium tracking-[0] text-[17.5px]" style={{ color: COLORS.ink }}>{f.value}</p>
            </div>
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}
const IMG_FOUNDER = "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png";

/* ═══ THE PEOPLE — founder with real bio ═══ */
function AboutPeopleSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ backgroundColor: COLORS.surface, fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">The people</GreyTag>
        <h2 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          The people <span style={{ color: COLORS.blue }}>building Visionary.</span>
        </h2>

        <div className="mx-auto mt-16 flex w-full max-w-[900px] flex-col items-center gap-10 rounded-[24px] border bg-white p-8 lg:flex-row lg:items-start lg:p-12" style={{ borderColor: COLORS.mist }}>
          <div className="h-40 w-40 shrink-0 overflow-hidden rounded-full border" style={{ borderColor: COLORS.mist }}>
            <img src={IMG_FOUNDER} alt="Md Shahid Ali" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="font-medium tracking-[0] text-[22px]" style={{ color: COLORS.ink }}>Md Shahid Ali</p>
            <p className="mt-1 font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Founder & CEO</p>
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
const RESEARCH_PRINCIPLES = [
  { n: "01", title: "The Socratic method.", copy: "Understanding is verified through dialogue — not delivery. Visionary explains, then asks back. When you can answer the question yourself, the understanding is yours." },
  { n: "02", title: "Mastery tracking.", copy: "Visionary tracks understanding at the concept level, not the chapter level. When a gap appears, it is addressed before the next concept is introduced. Nothing is skipped. Nothing is unnecessarily repeated." },
  { n: "03", title: "Native language pedagogy.", copy: "Research consistently shows that people understand more deeply in the language they think in. Visionary is built in 22 Indian languages from the ground up — not translated, but natively constructed." },
];

/* ═══ HOW WE THINK — research grounding ═══ */
function AboutResearchSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">How we think</GreyTag>
        <h2 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Visionary is grounded in how <span style={{ color: COLORS.blue }}>people actually learn.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          The way Visionary teaches is not arbitrary. It is based on decades of research in cognitive science, pedagogy, and language acquisition.
        </p>
        <div className="mx-auto mt-16 w-full max-w-[1080px]">
          {RESEARCH_PRINCIPLES.map((r, i) => (
            <div key={r.n} className={`grid grid-cols-1 gap-4 py-10 md:grid-cols-[120px_1fr] md:gap-10 ${i < RESEARCH_PRINCIPLES.length - 1 ? "border-b" : ""}`} style={{ borderColor: `${COLORS.ink}14` }}>
              <p className="font-medium tracking-[0] text-[14px]" style={{ color: COLORS.blue }}>{r.n}</p>
              <div>
                <h3 className="font-medium tracking-[0] leading-[1.2] text-[clamp(22px,2.4vw,32px)]" style={{ color: COLORS.ink }}>{r.title}</h3>
                <p className="mt-3 max-w-[640px] font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>{r.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}
const CONTACT_ROUTES = [
  { label: "General questions", email: "hello@visionary.org.in" },
  { label: "Schools and institutions", email: "partnerships@visionary.org.in" },
  { label: "Press and media", email: "press@visionary.org.in" },
  { label: "Safety concerns", email: "safety@visionary.org.in" },
];

/* ═══ GET IN TOUCH — 4 specific routes ═══ */
function AboutContactSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ backgroundColor: COLORS.surface, fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Get in touch</GreyTag>
        <h2 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          We would like to <span style={{ color: COLORS.blue }}>hear from you.</span>
        </h2>

        <div className="mx-auto mt-16 grid w-full max-w-[1080px] grid-cols-1 gap-6 sm:grid-cols-2">
          {CONTACT_ROUTES.map((c) => (
            <a key={c.email} href={`mailto:${c.email}`} className="group flex flex-col rounded-[24px] border bg-white p-7 transition-all hover:border-[#4285F4]" style={{ borderColor: COLORS.mist }}>
              <p className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[11px]" style={{ color: COLORS.grey }}>{c.label}</p>
              <p className="mt-3 font-medium tracking-[0] text-[17.5px]" style={{ color: COLORS.ink }}>{c.email}</p>
              <span className="mt-4 inline-flex items-center gap-1 font-normal tracking-[0] text-[14px] group-hover:underline" style={{ color: COLORS.blue }}>
                Send email <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
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
/* ═══ H · FINAL CTA ═══ */
/* ═══ CTA — specific action, not "be part of the story" ═══ */
function AboutCTASection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-28 lg:py-36" style={{ fontFamily: FONT_FAMILY }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <GreyTag className="text-center">Start here</GreyTag>
        <h2 className="mt-4 font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Start using Visionary. <br />Or see how it works first.
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Free to start. No account needed to ask your first question.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/register" className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: COLORS.blue }}>
            Get started
          </Link>
          <Link to="/how-it-works" className="inline-flex h-14 items-center justify-center rounded-full border px-10 font-medium tracking-[0] text-[16px] transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
            See how it works
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══ PAGE ═══ */
export default function CompetitiveExamsPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main>
        <AboutSectionTabs />
        <AboutMissionSection />
        <AboutWhySection />
        <AboutBeliefsSection />
        <AboutBenefitsSection />
        <AboutVisionSection/>
        <AboutResearchSection/>
        <AboutCompanySection />
        <AboutPeopleSection/>
        <AboutSafetySection />
        <AboutPrivacySection />
        
        <AboutAccessibilitySection />
        
        <AboutCTASection />
        <AboutContactSection/>
      </main>
      <LandingFooter />
    </div>
  );
}