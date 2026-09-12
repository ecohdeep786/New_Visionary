import React, { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  UserPlus, Target, Compass, RefreshCw, Monitor, Laptop, Smartphone, Lock, ArrowRight,
  GraduationCap, Users, HeartHandshake, Briefcase, Building2,
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

/* ═══ TYPE SCALE — exact pricing page match ═══
   Hero H1 / major H2 : clamp(36px,5vw,72px)
   Mid-section H2     : clamp(30px,4vw,56px)
   Card / step H3     : clamp(28px,2.78vw,40px) · small card title 22px
   Body large         : 17.5px / 25px
   Body               : 15px/1.6 · card copy 14px/1.5 · meta 13px · fine 12px
   Tag / eyebrow      : 12px uppercase tracking-[0.43px]  (grey for hero/section, blue for steps)
   Pills / tabs       : h-[52px] rounded-[90px], 12–14px
   Buttons            : h-14 = 16px · h-12 = 15px
=========================================================== */

/* ═══ CONTROLLERS ═══ */
function useCycleIndex(total, intervalMs) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), intervalMs);
    return () => clearInterval(id);
  }, [total, intervalMs, index]);
  return { index };
}
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
function useActiveStep(total) {
  const nodes = useRef([]);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const i = Number(entry.target.dataset.step);
          if (!isNaN(i)) setActive(i);
        }
      }),
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    nodes.current.slice(0, total).forEach((n) => n && observer.observe(n));
    return () => observer.disconnect();
  }, [total]);
  const setStepRef = useCallback((i) => (node) => { nodes.current[i] = node; }, []);
  return { active, setStepRef };
}
const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

/* Two tags — grey for section headers (hero-style), blue for in-flow step labels */
const GreyTag = React.memo(function GreyTag({ children, className = "" }) {
  return (
    <p className={`font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px] ${className}`} style={{ color: COLORS.grey }}>
      {children}
    </p>
  );
});
const BlueTag = React.memo(function BlueTag({ children, className = "" }) {
  return (
    <p className={`font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px] ${className}`} style={{ color: COLORS.blue }}>
      {children}
    </p>
  );
});

/* ═══ MODELS ═══ */
const HERO_WORDS = ["step by step.", "your way.", "from day one.", "together."];

/* Step 02 renamed: "Start as yourself" (matches Visionary's personal, journey-first vibe)
   Step 03 renamed: "Your space" (Visionary's word for the ongoing personal workspace — never "dashboard") */
/* ═══ MODELS — user journey ═══ */
const USER_JOURNEY_STEPS = [
  {
    id: "signup",
    n: "Step - 01",
    Icon: UserPlus,
    title: "Create your account.",
    do: "Sign up free with your email or Google account. Already on Visionary? Sign in and pick up where you left off.",
    micro: "Takes less than 30 seconds. Your journey starts here.",
  },
  {
    id: "onboarding",
    n: "Step - 02",
    Icon: Target,
    title: "Start as yourself.",
    do: "Tell Visionary who you are and what you want to work on — it shapes everything around that from the first moment.",
    micro: "Student · Teacher · Parent · Professional · Organization — one intelligence, shaped for you.",
  },
  {
    id: "space",
    n: "Step - 03",
    Icon: Compass,
    title: "Step into your space.",
    do: "Your personal space shows what matters to you — your progress, your questions, your next step. Always ready, always yours.",
    micro: "Ask, practise, and continue — all from one space that knows you.",
  },
  {
    id: "connected",
    n: "Step - 04",
    Icon: RefreshCw,
    title: "Stay connected.",
    do: "Your learning never resets. Visionary remembers your context, connects you to the people who matter, and keeps everything moving forward.",
    micro: "Yesterday's work becomes today's foundation. Your journey is always connected.",
  },
];
/* Step 01 — left column copy, synced with the right auth mock */
const AUTH_STATES = {
  signup: {
    tag: " Step - 01 · Sign up",
    title: "your account.",
    blue: "Create",
    do: "Sign up free with your email or Google account. No credit card required.",
    micro: "Takes less than 30 seconds. Your journey starts here.",
  },
  signin: {
    tag: "Step - 01 · Sign in",
    title: "your account.",
    blue: "Sign in",
    do: "Already on Visionary? Sign in and pick up exactly where you left off.",
    micro: "Your space, your progress, your context — all waiting for you.",
  },
};


const ONBOARDING_ROLES = [
  { id: "student", label: "Student", Icon: GraduationCap, desc: "Learn with a companion that keeps your place." },
  { id: "teacher", label: "Teacher", Icon: Users, desc: "See every learner and teach in your language." },
  { id: "parent", label: "Parent", Icon: HeartHandshake, desc: "Follow your child's journey with confidence." },
  { id: "professional", label: "Professional", Icon: Briefcase, desc: "Grow the skills your work demands next." },
  { id: "organization", label: "Organization", Icon: Building2, desc: "Roll out learning across your institution." },
];

const SPACE_ANIMATIONS = [
  { role: "Student", text: "Today: Fractions → Decimals → Your first project" },
  { role: "Teacher", text: "Today: 23 students ready · 5 need support · Lesson plan adapts" },
  { role: "Parent", text: "Today: Priya understood fractions · stuck on decimals · help tonight" },
  { role: "Professional", text: "Today: Architecture review → trade-offs → ship with confidence" },
  { role: "Organization", text: "Today: 847 learners · 12 gaps found · 3 interventions ready" },
];

const ROLES = [
  { id: "student", tab: "Student", prompt: "Explain this simply.", ui: "I need to understand fractions.", outcome: "The explanation clicks. You try the first problem. It's saved for tomorrow." },
  { id: "teacher", tab: "Teacher", prompt: "How should I explain this?", ui: "Plan tomorrow's lesson for a mixed class.", outcome: "The lesson maps the gaps. You adapt before the bell rings." },
  { id: "parent", tab: "Parent", prompt: "How is Priya doing?", ui: "Show me this week in one view.", outcome: "You see where she's stuck. You help before the test." },
  { id: "professional", tab: "Professional", prompt: "How do I improve this?", ui: "Reason through this architecture with me.", outcome: "The trade-offs surface. You ship with confidence." },
  { id: "organization", tab: "Organization", prompt: "Where does my team need help?", ui: "Show me learning signals across the cohort.", outcome: "You find the gap. You intervene before outcomes drop." },
];

/* ═══ MOCK SHELL ═══ */
/* ═══ MOCK SHELL ═══ */
const MockShell = React.memo(function MockShell({ children, label }) {
  return (
    <div className="w-full max-w-[440px] overflow-hidden rounded-[24px] border bg-white lg:max-w-none" style={{ borderColor: COLORS.mist }}>
      <div className="flex items-center gap-2 border-b px-5 py-3" style={{ borderColor: COLORS.mist }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.mist }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.mist }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.chipBg }} />
        <span className="ml-2 font-normal uppercase tracking-[0.43px] text-[10px]" style={{ color: COLORS.lightGrey }}>{label}</span>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
});

/* Step 01 — animated signup ↔ signin (form + button non-interactive, visual only) */
/* ═══ AUTH MOCK — real links, cycle pauses on hover/focus so clicks never land wrong ═══ */
function AuthMock({ state, onPause, onResume }) {
  const isSignIn = state === "signin";
  return (
    <div onMouseEnter={onPause} onMouseLeave={onResume} onFocus={onPause} onBlur={onResume}>
      <MockShell label={isSignIn ? "Sign in" : "Sign up"}>
        <p key={`title-${state}`} className="hero-fade-up font-medium tracking-[0] text-[15px]" style={{ color: COLORS.ink }}>
          {isSignIn ? "Welcome back" : "Create your account"}
        </p>
        <div className="mt-4 space-y-3">
          <div key={`email-${state}`} className="hero-fade-up rounded-[12px] border px-4 py-3" style={{ borderColor: COLORS.mist }}>
            <p className="text-[14px] tracking-[0]" style={{ color: COLORS.lightGrey }}>Email address</p>
          </div>
          {!isSignIn && (
            <div key="name" className="hero-fade-up rounded-[12px] border px-4 py-3" style={{ borderColor: COLORS.mist }}>
              <p className="text-[14px] tracking-[0]" style={{ color: COLORS.lightGrey }}>Your name</p>
            </div>
          )}
          <div key={`password-${state}`} className="hero-fade-up rounded-[12px] border px-4 py-3" style={{ borderColor: COLORS.mist }}>
            <p className="text-[14px] tracking-[0]" style={{ color: COLORS.lightGrey }}>Password</p>
          </div>
        </div>
        <Link
          key={`btn-${state}`}
          to={isSignIn ? "/login" : "/register"}
          aria-label={isSignIn ? "Sign in to Visionary" : "Create a free Visionary account"}
          className="hero-fade-up mt-6 flex w-full items-center justify-center rounded-full py-3 text-[15px] font-medium tracking-[0.24px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#121317]"
          style={{ backgroundColor: COLORS.blue }}
        >
          {isSignIn ? "Sign in" : "Create account"}
        </Link>
        <p className="mt-4 text-center text-[12px] tracking-[0]" style={{ color: COLORS.lightGrey }}>Or continue with Google</p>
      </MockShell>
    </div>
  );
}

function StepMock({ step, activeRole, activeSpace, authState, onPause, onResume }) {
  if (step.id === "signup") {
    return <AuthMock state={authState} onPause={onPause} onResume={onResume} />;
  }
  if (step.id === "onboarding") {
    return (
      <MockShell label="Start as yourself">
        <p className="font-medium tracking-[0] text-[15px]" style={{ color: COLORS.ink }}>Who are you?</p>
        <div className="mt-4 grid grid-cols-1 gap-3">
          {ONBOARDING_ROLES.map((role, i) => {
            const isActive = activeRole === i;
            return (
              <div key={role.id} className="flex items-start gap-4 rounded-[16px] border p-4 transition-colors" style={{ borderColor: isActive ? COLORS.blue : COLORS.mist, backgroundColor: isActive ? COLORS.chipBg : "transparent" }}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                  <role.Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="font-medium tracking-[0] text-[14px]" style={{ color: COLORS.ink }}>{role.label}</p>
                  <p className="mt-1 text-[12px] tracking-[0]" style={{ color: COLORS.grey }}>{role.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </MockShell>
    );
  }
  if (step.id === "space") {
    const currentSpace = SPACE_ANIMATIONS[activeSpace || 0];
    return (
      <MockShell label="Your space">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.chipBg }}>
            {React.createElement(ONBOARDING_ROLES[activeSpace || 0].Icon, { className: "h-5 w-5", strokeWidth: 1.8, style: { color: COLORS.blue } })}
          </span>
          <div>
            <p className="font-medium tracking-[0] text-[15px]" style={{ color: COLORS.ink }}>Welcome back</p>
            <p className="text-[12px] tracking-[0]" style={{ color: COLORS.grey }}>{currentSpace.role}</p>
          </div>
        </div>
        <div className="mt-6 rounded-[16px] border p-5" style={{ borderColor: COLORS.mist, backgroundColor: COLORS.surface }}>
          <p className="text-[13px] uppercase tracking-[0.43px]" style={{ color: COLORS.grey }}>Today</p>
          <p className="mt-2 text-[15px] tracking-[0]" style={{ color: COLORS.ink }}>
            <span key={activeSpace} className="hero-fade-up inline-block">{currentSpace.text}</span>
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          {["Ask", "Practise", "Continue"].map((action) => (
            <span key={action} className="rounded-full border px-4 py-2 text-[13px] tracking-[0.24px]" style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
              {action}
            </span>
          ))}
        </div>
      </MockShell>
    );
  }
  return (
    <MockShell label="Connected">
      <p className="font-medium tracking-[0] text-[15px]" style={{ color: COLORS.ink }}>Your journey, connected</p>
      <div className="mt-4 space-y-4">
        {[
          { t: "Yesterday", v: "Fractions — mastered", color: COLORS.lightGrey },
          { t: "Today", v: "Decimals — in progress", color: COLORS.blue },
          { t: "Next", v: "Percentages — builds on decimals", color: COLORS.ink },
        ].map((r, i) => (
          <div key={r.t} className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} />
              {i < 2 && <span className="h-8 w-px" style={{ backgroundColor: COLORS.mist }} />}
            </div>
            <div>
              <p className="text-[12px] uppercase tracking-[0.43px]" style={{ color: COLORS.lightGrey }}>{r.t}</p>
              <p className="text-[14px] tracking-[0]" style={{ color: COLORS.ink }}>{r.v}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-[16px] border p-4" style={{ borderColor: COLORS.mist, backgroundColor: COLORS.surface }}>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" strokeWidth={1.8} style={{ color: COLORS.blue }} />
          <p className="text-[13px] tracking-[0]" style={{ color: COLORS.ink }}>Connected to: Teacher · Parent · Team</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {[{ Icon: Monitor, t: "Web" }, { Icon: Smartphone, t: "Phone" }, { Icon: Laptop, t: "Desktop" }].map(({ Icon, t }) => (
          <span key={t} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] tracking-[0.24px]" style={{ borderColor: COLORS.mist, color: COLORS.grey }}>
            <Icon className="h-3.5 w-3.5" strokeWidth={1.8} /> {t}
          </span>
        ))}
      </div>
    </MockShell>
  );
}

/* ═══ 01 · HERO — grey eyebrow, cycling word always on line 2 ═══ */
function HowHeroSection() {
  const { ref, visible } = useRevealOnce();
  const { index } = useCycleIndex(HERO_WORDS.length, 2400);
  return (
    <section ref={ref} className="relative overflow-hidden px-6 pb-24 pt-40 lg:pt-48" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">How Visionary works</GreyTag>
        <h1 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          How you use Visionary,
          <br />
          <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{HERO_WORDS[index]}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Four simple steps from sign-up to connected learning. See exactly how Visionary works for students, teachers, parents, professionals, and organizations.
        </p>
      </FadeReveal>
    </section>
  );
}

/* ═══ 02-05 · USER JOURNEY WALKTHROUGH ═══ */
/* ═══ 02-05 · USER JOURNEY WALKTHROUGH — left + right animate in sync ═══ */
function HowJourneySection() {
  const { ref: headRef, visible } = useRevealOnce();
  const { active, setStepRef } = useActiveStep(USER_JOURNEY_STEPS.length);
  const current = USER_JOURNEY_STEPS[active];

  /* Auth cycle with pause-on-hover/focus — a click always lands on the state it shows */
  const [authIndex, setAuthIndex] = useState(0);
  const [authPaused, setAuthPaused] = useState(false);
  useEffect(() => {
    if (authPaused) return undefined;
    const id = setInterval(() => setAuthIndex((i) => (i + 1) % 2), 3000);
    return () => clearInterval(id);
  }, [authPaused]);
  const authState = authIndex === 0 ? "signup" : "signin";
  const pauseAuth = useCallback(() => setAuthPaused(true), []);
  const resumeAuth = useCallback(() => setAuthPaused(false), []);

  const { index: roleIndex } = useCycleIndex(ONBOARDING_ROLES.length, 2800);
  const { index: spaceIndex } = useCycleIndex(SPACE_ANIMATIONS.length, 3000);

  /* Left column copy — signup step re-animates tag → blue heading word → body on every swap */
  const StepCopy = ({ step, state }) => {
    if (step.id === "signup") {
      const a = AUTH_STATES[state];
      return (
        <>
          <BlueTag>{a.tag}</BlueTag>
          <h3 className="mt-5 font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
            {a.blue} <span style={{ color: COLORS.blue }}>{a.title}</span>
          </h3>
          <p className="mt-6 font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>{a.do}</p>
          <p className="mt-6 rounded-[16px] px-5 py-4 font-normal tracking-[0] leading-[1.6] text-[14px]" style={{ backgroundColor: COLORS.surface, color: COLORS.grey }}>{a.micro}</p>
        </>
      );
    }
    return (
      <>
        <BlueTag>{step.n} · {step.id}</BlueTag>
        <h3 className="mt-5 font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>{step.title}</h3>
        <p className="mt-6 font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>{step.do}</p>
        <p className="mt-6 rounded-[16px] px-5 py-4 font-normal tracking-[0] leading-[1.6] text-[14px]" style={{ backgroundColor: COLORS.surface, color: COLORS.grey }}>{step.micro}</p>
      </>
    );
  };

  return (
    <section ref={headRef} className="relative bg-white [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-16 px-6 pb-24 pt-16 lg:grid-cols-[5fr_6fr] lg:gap-60 lg:px-0 lg:pt-24">
        <div className="hidden lg:block">
          <div className="sticky top-16 flex h-[calc(100dvh-4rem)] items-center">
            <div
              key={current.id === "signup" ? `signup-${authState}` : current.id}
              className="hero-fade-up max-w-[460px]"
            >
              <StepCopy step={current} state={authState} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-32 lg:gap-[40vh] lg:py-[12vh]">
          {USER_JOURNEY_STEPS.map((s, i) => {
            const mockProps =
              s.id === "signup" ? { authState, onPause: pauseAuth, onResume: resumeAuth } :
              s.id === "onboarding" ? { activeRole: roleIndex } :
              s.id === "space" ? { activeSpace: spaceIndex } :
              {};
            return (
              <div key={s.id} id={s.id} className="scroll-mt-24">
                <figure ref={setStepRef(i)} data-step={i} className="m-0"><StepMock step={s} {...mockProps} /></figure>
                <div className="mt-8 lg:hidden">
                  <StepCopy step={s} state={authState} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══ 06 · DIFFERENT PEOPLE — GREY tag (matches hero) ═══ */
function HowDifferentPeopleSection() {
  const { ref, visible } = useRevealOnce();
  const [role, setRole] = useState(0);
  const scenario = ROLES[role];
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Different people</GreyTag>
        <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          One intelligence. <span style={{ color: COLORS.blue }}>Different ways to use it.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          The product doesn't change. What you're doing does.
        </p>

        <div className="mx-auto mt-12 flex h-[52px] w-full max-w-[900px] items-stretch overflow-hidden rounded-[90px] border bg-white" style={{ borderColor: COLORS.mist }} role="tablist" aria-label="Roles">
          {ROLES.map((r, i) => (
            <button key={r.id} type="button" role="tab" aria-selected={role === i} onClick={() => setRole(i)}
              className={`flex h-full flex-1 items-center justify-center rounded-[90px] text-[12px] sm:text-[14px] tracking-[0.24px] transition-colors ${role === i ? "font-medium" : "font-normal hover:bg-[#f8f9fa]"}`}
              style={{ backgroundColor: role === i ? COLORS.ink : "transparent", color: role === i ? "#ffffff" : COLORS.grey }}>
              {r.tab}
            </button>
          ))}
        </div>

        <div key={scenario.id} className="hero-fade-up mx-auto mt-14 grid w-full max-w-[1240px] grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col justify-center rounded-[24px] border bg-white p-8" style={{ borderColor: COLORS.mist }}>
            <BlueTag>{scenario.tab} — prompt</BlueTag>
            <p className="mt-4 font-medium tracking-[0] leading-[1.2] text-[clamp(22px,2.4vw,32px)]" style={{ color: COLORS.ink }}>"{scenario.prompt}"</p>
            <p className="mt-6 rounded-[16px] px-5 py-4 font-normal tracking-[0] leading-[1.6] text-[14px]" style={{ backgroundColor: COLORS.surface, color: COLORS.grey }}>
              {scenario.ui}
            </p>
            <p className="mt-6 font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>{scenario.outcome}</p>
            <Link to={`/${scenario.id === "organization" ? "organization" : scenario.id}`} className="mt-8 inline-flex items-center gap-1 w-fit font-normal tracking-[0] text-[15px]" style={{ color: COLORS.blue }}>
              See the {scenario.tab.toLowerCase()} page <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
          <div className="rounded-[24px] border bg-white p-2" style={{ borderColor: COLORS.mist }}>
            <MockShell label={scenario.tab}>
              <p className="font-medium tracking-[0] text-[15px]" style={{ color: COLORS.ink }}>{scenario.prompt}</p>
              <div className="mt-4 rounded-[12px] border px-4 py-3" style={{ borderColor: COLORS.mist }}>
                <p className="text-[14px] tracking-[0]" style={{ color: COLORS.ink }}>{scenario.ui}</p>
              </div>
              <div className="mt-4 flex gap-2">
                {["Understand", "Ask", "Try", "Continue"].map((m, i) => (
                  <span key={m} className="rounded-full border px-3 py-1 text-[11px] tracking-[0.24px]" style={{ borderColor: i === 0 ? COLORS.blue : COLORS.mist, color: i === 0 ? COLORS.blue : COLORS.grey }}>{m}</span>
                ))}
              </div>
              <p className="mt-5 text-[12px] tracking-[0]" style={{ color: COLORS.lightGrey }}>Same intelligence · shaped for {scenario.tab.toLowerCase()}</p>
            </MockShell>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 07 · CTA — GREY tag (matches hero) ═══ */
function HowCTASection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-28 lg:py-36" style={{ backgroundColor: COLORS.surface, fontFamily: FONT_FAMILY }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <GreyTag className="text-center">Get started</GreyTag>
        <h2 className="mt-4 font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>See it with your own question.</h2>
        <p className="mx-auto mt-6 max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Ask a question. Try an idea. See where it takes you.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/register" className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ backgroundColor: COLORS.blue }}>
            Get started
          </Link>
          <Link to="/pricing" className="inline-flex h-14 items-center justify-center rounded-full border px-10 font-medium tracking-[0] text-[16px] transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══ PAGE ═══ */
export default function CoachingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <HowHeroSection />
        <HowJourneySection />
        <HowDifferentPeopleSection />
        <HowCTASection />
      </main>
      <LandingFooter />
    </div>
  );
}