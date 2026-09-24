import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, BookOpen, MessageCircle, CircleCheck, Hammer,
  GraduationCap, Infinity as InfinityIcon, Globe,
} from "lucide-react";
import SpotIllustration from "@/components/landing/SpotIllustration";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

/* ═══ TOKENS (one system across all pages) ═══ */
const COLORS = {
  ink: "#121317",
  blue: "#4285F4",
  darkBlue: "#0b57d2",
  grey: "#5f6368",
  mist: "#dadce0",
  tintBlue: "#e8f0fe",
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
const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div
      className={`transition-all duration-700 ease-google motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100 ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
});

const pillFilled = "inline-flex min-h-12 items-center justify-center rounded-full px-8 text-[15px] font-medium text-white transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2";

/* Small pill tag — used only where blog.google uses topic labels */
const Tag = React.memo(function Tag({ children }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-4 py-1.5 text-[13px] font-medium tracking-[0.1px]"
      style={{ borderColor: COLORS.mist, color: COLORS.ink }}
    >
      {children}
    </span>
  );
});

/* ═══ MODELS ═══ */
const FLOW = [
  { Icon: BookOpen, title: "Learn", line: "Work through an idea with guided explanations and activities." },
  { Icon: MessageCircle, title: "Ask", line: "Bring any question into the conversation, in your own words." },
  { Icon: CircleCheck, title: "Practise", line: "Try focused checks that show what you actually understand." },
  { Icon: Hammer, title: "Build", line: "Apply it in projects and work you can keep and share." },
];

const AUDIENCE = [
  { who: "Students", what: "building real understanding." },
  { who: "Teachers", what: "preparing and reviewing learning." },
  { who: "Parents", what: "following progress early." },
  { who: "Professionals", what: "growing skills that matter." },
  { who: "Organizations", what: "supporting teams and institutions." },
];

const GROWTH = [
  { Icon: GraduationCap, title: "For education", line: "Teachers see who needs help early; students see their own progress." },
  { Icon: InfinityIcon, title: "For lifelong learning", line: "Understanding compounds — every step is saved and ready to build on." },
  { Icon: Globe, title: "For everyone", line: "Prepared learning samples in English, Hindi, and Bengali, with more on the way." },
];

const LATEST = [
  { to: "/updates", tag: "Product updates", title: "Product changes and announcements", line: "What has shipped, organized by category." },
  { to: "/research", tag: "Research", title: "How we approach learning questions", line: "The questions Visionary is exploring and why." },
  { to: "/community", tag: "Community", title: "Learn and share with others", line: "Ways to take part in the Visionary community." },
];

/* Category + sub-category cards (edu.google carousel grammar). Sub-categories
   link to the category page that owns them — no separate sub-pages exist. */
const CAROUSEL_CARDS = [
  { to: "/student", label: "Students", subject: "student" },
  { to: "/student", label: "Primary school", subject: "math" },
  { to: "/student", label: "Secondary school", subject: "physics" },
  { to: "/student", label: "Higher Secondary", subject: "chemistry" },
  { to: "/student", label: "Higher Education", subject: "research" },
  { to: "/student", label: "Vocational & Skills", subject: "build" },
  { to: "/student", label: "Competitive Exams", subject: "flag" },
  { to: "/teacher", label: "Teachers", subject: "teacher" },
  { to: "/parent", label: "Parents", subject: "parent" },
  { to: "/professional", label: "Professionals", subject: "briefcase" },
  { to: "/organization", label: "Organizations", subject: "team" },
  { to: "/organization", label: "Schools", subject: "handshake" },
  { to: "/organization", label: "Colleges & Universities", subject: "economics" },
  { to: "/organization", label: "Coaching", subject: "practice" },
  { to: "/organization", label: "Workplace learning", subject: "growth" },
];
const CARD_TINTS = ["#fdf3d8", "#e3edfc", "#e0efe4", "#f1e8fb", "#fbe3e1"];

/* ═══ CATEGORY CAROUSEL — the edu.google opening module: straight cards in a
       continuous anticlockwise loop, always on (founder directive), every
       card links to its category page ═══ */
function CategoryCarousel() {
  const cards = [...CAROUSEL_CARDS, ...CAROUSEL_CARDS];
  return (
    <div className="overflow-hidden">
      <style>{`
        @keyframes about-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .no-bar::-webkit-scrollbar{display:none}
        .about-marquee { animation: about-marquee 45s linear infinite; animation-duration: 45s !important; animation-iteration-count: infinite !important; }
      `}</style>
      <div
        role="region"
        aria-label="Explore Visionary by category"
        className="no-bar overflow-hidden py-8"
      >
        <div className="about-marquee flex w-max gap-5">
          {cards.map(({ to, label, subject }, i) => {
            const dup = i >= CAROUSEL_CARDS.length;
            return (
              <Link
                key={label + "-" + i}
                to={to}
                data-card
                aria-hidden={dup || undefined}
                tabIndex={dup ? -1 : undefined}
                className="group relative flex h-[280px] w-[225px] shrink-0 flex-col overflow-hidden rounded-[24px] p-6 transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(32,33,36,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                style={{ backgroundColor: CARD_TINTS[i % CARD_TINTS.length] }}
              >
                <span className="text-[19px] font-medium leading-[1.3]" style={{ color: COLORS.ink }}>{label}</span>
                <SpotIllustration subject={subject} className="absolute bottom-2 right-2 h-[58%] w-auto" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══ HERO — centered statement: what we are building, and who it is for ═══ */
function AboutHeroSection() {
  return (
    <section id="mission" className="relative bg-white pt-14 pb-20 sm:px-8 lg:pb-24" style={{ fontFamily: FONT_FAMILY }}>
      <CategoryCarousel />
      <div className="mx-auto mt-16 max-w-[860px] px-6 text-center">
        <h1 className="mx-auto max-w-[820px] text-[40px] font-normal leading-[1.1] tracking-[-0.035em] sm:text-[54px] lg:text-[66px]" style={{ color: COLORS.ink }}>
          Building AI intelligence for anyone, anywhere.
        </h1>
        <p className="mx-auto mt-8 max-w-[640px] text-[17px] leading-[1.7] sm:text-[19px]" style={{ color: COLORS.grey }}>
          Visionary is an education product with role-based workspaces for students, teachers, parents, professionals, and organizations — one place to learn, teach, and build.
        </p>
        <div className="mt-10">
          <Link to="/how-it-works" className={pillFilled} style={{ backgroundColor: COLORS.darkBlue }}>
            See how it works
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══ WHY — why accessible understanding matters, with the learning journey ═══ */
function AboutWhySection() {
  const { ref, visible } = useRevealOnce();
  const steps = ["Ask a question", "Understand it", "Practise it", "Build with it"];
  return (
    <section ref={ref} className="relative bg-white px-6 py-20 sm:px-8 lg:py-28" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="text-[30px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[38px] lg:text-[44px]" style={{ color: COLORS.ink }}>
            Learning you can see
          </h2>
          <p className="mx-auto mt-6 text-[17px] leading-[1.7] sm:text-[18px]" style={{ color: COLORS.grey }}>
            Most tools measure learning after it ends — a score, a grade, a finished course. But understanding happens in the middle, between the question and the answer. Visionary makes that middle visible, so learners get help while it still matters and teachers can see who needs it.
          </p>
        </div>

        {/* The learning journey — the one visual on the page */}
        <div className="relative mx-auto mt-16 max-w-[880px]" aria-hidden="true">
          <div className="absolute left-[12.5%] right-[12.5%] top-[6px] hidden h-px sm:block" style={{ backgroundColor: COLORS.mist }} />
          <ol className="relative grid grid-cols-2 gap-y-10 sm:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step} className="flex flex-col items-center gap-3">
                <span className="h-[14px] w-[14px] rounded-full border-2 bg-white" style={{ borderColor: COLORS.darkBlue, backgroundColor: i === 1 ? COLORS.blue : "#ffffff" }} />
                <span className="text-[14px] font-medium tracking-[0.24px]" style={{ color: COLORS.ink }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ HOW — the guided flow: four moves, icon-led, no boxes ═══ */
function AboutFlowSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-20 sm:px-8 lg:py-28" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="text-[30px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[38px] lg:text-[44px]" style={{ color: COLORS.ink }}>
            One guided flow, four moves
          </h2>
          <p className="mx-auto mt-6 text-[17px] leading-[1.7] sm:text-[18px]" style={{ color: COLORS.grey }}>
            A single loop runs through every workspace — simple to start, honest about progress.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-[900px] grid-cols-1 gap-x-14 gap-y-12 sm:grid-cols-2">
          {FLOW.map(({ Icon, title, line }) => (
            <div key={title} className="flex items-start gap-5 text-left">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.tintBlue, color: COLORS.darkBlue }}>
                <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[18px] font-medium leading-[1.3]" style={{ color: COLORS.ink }}>{title}</h3>
                <p className="mt-1.5 text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>{line}</p>
              </div>
            </div>
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ WHO — not only for students: the roles in plain lines ═══ */
function AboutWhoSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-20 sm:px-8 lg:py-28" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="text-[30px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[38px] lg:text-[44px]" style={{ color: COLORS.ink }}>
            Not just for students
          </h2>
        </div>
        <div className="mx-auto mt-12 max-w-[680px] space-y-5 text-center">
          {AUDIENCE.map(({ who, what }) => (
            <p key={who} className="text-[20px] leading-snug sm:text-[22px]">
              <span className="font-medium" style={{ color: COLORS.ink }}>{who}</span>{" "}
              <span style={{ color: COLORS.grey }}>{what}</span>
            </p>
          ))}
        </div>
        <p className="mx-auto mt-12 max-w-[620px] text-center text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
          Same product, same flow — a workspace shaped to what each role needs to do.
        </p>
      </FadeReveal>
    </section>
  );
}

/* ═══ GROWTH & IMPACT — education, lifelong learning, social reach ═══ */
function AboutGrowthSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-20 sm:px-8 lg:py-28" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="text-[30px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[38px] lg:text-[44px]" style={{ color: COLORS.ink }}>
            Growth that lasts
          </h2>
          <p className="mx-auto mt-6 text-[17px] leading-[1.7] sm:text-[18px]" style={{ color: COLORS.grey }}>
            Education does not end at school, and neither does learning. Visionary is designed for the whole journey — from the first question in class to the skills people build at work.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-[980px] grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-3">
          {GROWTH.map(({ Icon, title, line }) => (
            <div key={title} className="text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.tintBlue, color: COLORS.darkBlue }}>
                <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[17px] font-medium" style={{ color: COLORS.ink }}>{title}</h3>
              <p className="mt-2 text-[14.5px] leading-[1.65]" style={{ color: COLORS.grey }}>{line}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-14 max-w-[620px] text-center text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
          Safety and privacy are part of the design, not an afterthought —{" "}
          <Link to="/safety" className="font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.darkBlue }}>see how we keep people safe</Link>{" "}
          and{" "}
          <Link to="/privacy" className="font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.darkBlue }}>how we handle data</Link>.
        </p>
      </FadeReveal>
    </section>
  );
}

/* ═══ THE PEOPLE — one human moment: the question behind the product (id="team") ═══ */
function AboutPeopleSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} id="team" className="relative scroll-mt-24 bg-white px-6 py-20 sm:px-8 lg:py-28" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <figure className="mx-auto max-w-[760px] text-center">
          <blockquote>
            <p className="text-[22px] font-normal leading-[1.4] tracking-[-0.015em] sm:text-[26px]" style={{ color: COLORS.ink }}>
              "How can learning tools help people move from effort toward clearer understanding?"
            </p>
          </blockquote>
          <figcaption className="mt-5 text-[14px] font-medium tracking-[0.24px]" style={{ color: COLORS.grey }}>
            Md Shahid Ali — Founder &amp; CEO
          </figcaption>
        </figure>
      </FadeReveal>
    </section>
  );
}

/* ═══ THE LATEST — blog.google list grammar: tag → headline → deck → link ═══ */
function AboutLatestSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} id="latest" className="relative scroll-mt-24 bg-white px-6 py-20 sm:px-8 lg:py-28" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <h2 className="mx-auto max-w-[860px] text-center text-[30px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[38px] lg:text-[44px]" style={{ color: COLORS.ink }}>
          The latest
        </h2>

        <ul className="mx-auto mt-12 w-full max-w-[820px] border-t" style={{ borderColor: COLORS.mist }}>
          {LATEST.map((c) => (
            <li key={c.to} className="border-b py-7" style={{ borderColor: COLORS.mist }}>
              <Link to={c.to} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-4">
                <Tag>{c.tag}</Tag>
                <h3 className="mt-4 text-[21px] font-medium leading-[1.3] tracking-[0] transition-colors group-hover:underline sm:text-[24px]" style={{ color: COLORS.ink }}>{c.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.6]" style={{ color: COLORS.grey }}>{c.line}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-medium" style={{ color: COLORS.darkBlue }}>
                  Read article <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </FadeReveal>
    </section>
  );
}

/* ═══ FINAL CTA — one action: create an account (hero owns "see how it works") ═══ */
function AboutCTASection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 sm:px-8 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto max-w-[900px] text-center">
          <h2 className="mx-auto max-w-[720px] font-normal tracking-[-0.03em] leading-[1.12] text-[34px] sm:text-[46px]" style={{ color: COLORS.ink }}>
            Start with Visionary
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-[1.7] sm:text-[18px]" style={{ color: COLORS.grey }}>
            See what understanding looks like for you — in class, at work, or anywhere in between.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4">
            <Link to="/register" className={pillFilled} style={{ backgroundColor: COLORS.darkBlue }}>
              Create an account
            </Link>
            <Link to="/how-it-works" className="inline-flex items-center justify-center text-[15px] font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ color: COLORS.darkBlue }}>
              See how it works first
            </Link>
          </div>
          <p className="mt-10 text-[13.5px] leading-[1.7]" style={{ color: COLORS.grey }}>
            Questions?{" "}
            <a href="mailto:hello@visionary.org.in" className="font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.darkBlue }}>hello@visionary.org.in</a>
          </p>
        </div>
      </FadeReveal>
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
        <AboutWhySection />
        <AboutFlowSection />
        <AboutWhoSection />
        <AboutGrowthSection />
        <AboutPeopleSection />
        <AboutLatestSection />
        <AboutCTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
