import React, { useCallback, useEffect, useState, useRef } from "react";
import professionalHero from "@/assets/hero-cutouts/professional-800w.webp";
import teacherHero from "@/assets/hero-cutouts/teacher-800w.webp";
import studentHero from "@/assets/hero-cutouts/student-800w.webp";
import parentHero from "@/assets/hero-cutouts/parent-800w.webp";
import orgHero from "@/assets/hero-cutouts/organization-800w.webp";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingFAQ from "@/components/landing/LandingFAQ";
import studentmeet from "@/assets/student-hero-main-1600w.webp"
import teachermeet from "@/assets/teacher-hero-main-1600w.webp"
import parentmeet from "@/assets/parent-hero-main-1600w.webp"
import promeet from "@/assets/pro-face-main-1600w.webp"
import orgmeet from "@/assets/org-face-main-1600w.webp"
import problemunderstanding from "@/assets/problem-understanding.webp";
import teacherSlide from "@/assets/teacher-hero-main-1600w.webp";
import parentSlide from "@/assets/parent-hero-main-1600w.webp";
import proSlide from "@/assets/pro-face-main-1600w.webp";
import cmAdapt from "@/assets/student-primary.webp";
import cmGrow from "@/assets/student-secondary.webp";
import cmCreate from "@/assets/student-vocational.webp";
import cmContinue from "@/assets/student-higher.webp";
import { ShieldCheck, HeartHandshake, Scale } from "lucide-react";



/* ═══════════════════════ TOKENS ═══════════════════════ */
const COLORS = {
  ink: "#121317",
  graphite: "#5f6368",
  slate: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  surface: "#F5F6F8",
  white: "#ffffff",
  blue: "#4285F4",
  chipBg: "#D2E3FC",
  ring: "rgba(66,133,244,0.4)",
  track: "rgba(69,71,77,0.15)",
  line: "rgba(18,19,23,0.26)",
  circle: "rgba(18,19,23,0.06)",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* ═══════════════════════ CONTROLLERS ═══════════════════════ */
function useCycleIndex(total, intervalMs) {
  const [index, setIndex] = useState(0);
  const goTo = useCallback((i) => setIndex(((i % total) + total) % total), [total]);
  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), intervalMs);
    return () => clearInterval(id);
  }, [total, intervalMs, index]);
  return { index, goTo };
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
        if (entry.isIntersecting && !hasRevealed.current) {
          setVisible(true);
          hasRevealed.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

function useRevealContinuous(rootMargin = "-40% 0px -10% 0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) { setVisible(true); return undefined; }
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0, rootMargin });
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

/* ═══════════════════════ SHARED VIEWS ═══════════════════════ */
const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

const CarouselDots = React.memo(function CarouselDots({ total, active, onSelect }) {
  return (
    <div className="flex items-center gap-2" role="tablist" aria-label="Carousel slides">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-label={`Go to slide ${i + 1}`}
          aria-selected={i === active}
          onClick={() => onSelect(i)}
          className={`relative h-2 rounded-full transition-all duration-300 after:absolute after:-inset-y-3 after:-inset-x-1.5 after:content-[''] ${i === active ? "w-10" : "w-2 hover:opacity-70"}`}
          style={{ backgroundColor: i === active ? COLORS.ink : `${COLORS.ink}33` }}
        />
      ))}
    </div>
  );
});

function ChevronIcon({ direction = "right", className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`${className} ${direction === "left" ? "rotate-180" : ""}`}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function VoiceIcon({ className = "h-9 w-9", style }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>
      <path d="M25 7l-5 9 6 4-5 9 3 3-2 7" />
      <path d="M31 19c2.5 2.5 2.5 7.5 0 10" />
      <path d="M35.5 15.5c4.5 4.5 4.5 12 0 16.5" />
    </svg>
  );
}

function VMark({ className = "h-10 w-auto" }) {
  return (
    <svg viewBox="1.5 6 60 44.5" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform="translate(0,64) scale(0.1,-0.1)" fill={COLORS.ink} stroke="none">
        <path d="M49 551 c-16 -16 -29 -40 -29 -53 0 -14 42 -98 93 -187 l92 -163 6 38 c13 76 99 118 159 77 33 -22 44 -41 50 -83 5 -33 9 -28 98 128 60 105 92 172 92 192 0 34 -28 67 -66 76 -41 10 -72 -22 -149 -154 -38 -66 -72 -123 -75 -126 -4 -3 -41 55 -83 128 -95 164 -128 186 -188 127z" />
      </g>
    </svg>
  );
}

/* ═══════════════════════ MODELS ═══════════════════════ */
const PROBLEM_SLIDES = [
  { black: "Teaching everyone is possible.", blue: "Reaching everyone isn't", persona: "A teacher", quote: "I taught the whole class. Half of them still left lost.", image: teacherSlide, alt: "Teacher addressing a full classroom" },
  { black: "Seeing progress is easy.", blue: "Knowing how to help isn't", persona: "A parent", quote: "The report card says fine. I still don't know how to help at home.", image: parentSlide, alt: "Parent reviewing a child's progress" },
  { black: "Accessing knowledge is easy.", blue: "Applying it isn't", persona: "A student", quote: "I watched eight hours of videos and still couldn't solve a single problem on my own.", image: problemunderstanding, alt: "Student studying alone with a tablet" },
  { black: "Knowledge is everywhere.", blue: "Turning it into capability isn't", persona: "A professional", quote: "I have all the articles. I still can't turn them into the work.", image: proSlide, alt: "Professional applying knowledge at work" },
];
const PROBLEM_MS = 4200;

const MEET_WORDS = ["understands.", "remembers.", "grows with you.", "starts with where you are."];
const MEET_WORD_MS = 3000;
const MEET_IMG = [studentmeet, teachermeet, parentmeet, promeet, orgmeet];

const MEET_SECTIONS = [
  { id: "student", tab: "Student", leadBlack: "Understand", blues: ["what you're learning.", "why it matters.", "where you're stuck.", "what stays with you."], copy: "See the idea, practise it, and use it in the next thing you build.", link: "Explore student learning", to: "/student", alt: "Student studying with books" },
  { id: "teacher", tab: "Teacher", leadBlack: "Know", blues: ["what your class is learning.", "who needs another explanation.", "who's ready to move forward.", "how to teach the next idea."], copy: "Plan, explain, and check understanding while the lesson is still in front of you.", link: "Explore teaching tools", to: "/teacher", alt: "Teacher presenting at a whiteboard" },
  { id: "parent", tab: "Parent", leadBlack: "Know", blues: ["what your child is learning.", "where they need support.", "how they're growing.", "what to ask next."], copy: "See the progress behind the report and find a useful next step at home.", link: "Explore parent support", to: "/parent", alt: "Parent helping child with homework" },
  { id: "professional", tab: "Professional", leadBlue: ["Learn", "Build"], midBlack: "what the work", blues: ["requires.", "rewards."], copy: "Turn a question, project, or new skill into work you can use.", link: "Explore professional work", to: "/professional", alt: "Professional writing notes beside a laptop" },
  { id: "organization", tab: "Organization", leadBlack: "See", midBlack: "what your people are", blues: ["learning.", "building."], copy: "Give teams a shared view of learning across people, projects, and time.", link: "Explore organization learning", to: "/organization", alt: "Leader reviewing team progress on a tablet" },
];

const OI_STATES = [
  { label: "Remember", heading: "It remembers more than what you said.", body: "It remembers what you understood, where you struggled, what you tried, and what changed along the way." },
  { label: "Understand", heading: "You never have to start over.", body: "When you return, Visionary already knows where you were, what you've done, and what makes sense to do next." },
  { label: "Continue", heading: "It learns from what you do.", body: "Each lesson, practice, project, and decision gives the next step more context." },
  { label: "Grow", heading: "Understanding grows.", body: "What you learn, teach, and build today becomes the foundation for what you can do tomorrow." },
];
const OI_STEP_LABELS = ["Remember", "Understand", "Continue", "Grow"];
const OI_PHASE_MS = [3000, 3000, 3000, 4000, 4500];

const LG_CHIPS = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "kn", label: "Kannada" },
  { code: "pa", label: "Punjabi" },
];
const LG_QUESTIONS = [
  { hi: "Aaj maine kya samjha?", en: "What did I understand today?", bn: "আজ আমি কী বুঝেছি?", ta: "இன்று நான் என்ன புரிந்துகொண்டேன்?", kn: "ಇಂದು ನಾನು ಏನು ಅರ್ಥಮಾಡಿಕೊಂಡೆ?", pa: "ਮੈਂ ਅੱਜ ਕੀ ਸਮਝਿਆ?" },
  { hi: "Yeh concept real life mein kaise kaam karta hai?", en: "How does this concept work in real life?", bn: "এই ধারণাটি বাস্তব জীবনে কীভাবে কাজ করে?", ta: "இந்தக் கருத்து நிஜ வாழ்வில் எப்படி வேலை செய்கிறது?", kn: "ಈ ಪರಿಕಲ್ಪನೆ ನಿಜ ಜೀವನದಲ್ಲಿ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?", pa: "ਇਹ ਧਾਰਨਾ ਅਸਲ ਜ਼ਿੰਦਗੀ ਵਿੱਚ ਕਿਵੇਂ ਕੰਮ ਕਰਦੀ ਹੈ?" },
  { hi: "Mera bachcha kahan madad chahta hai?", en: "Where does my child need support?", bn: "আমার সন্তানের কোথায় সাহায্য দরকার?", ta: "என் குழந்தைக்கு எங்கே உதவி தேவை?", kn: "ನನ್ನ ಮಗುವಿಗೆ ಎಲ್ಲಿ ಸಹಾಯ ಬೇಕು?", pa: "ਮੇਰੇ ਬੱਚੇ ਨੂੰ ਕਿੱਥੇ ਮਦਦ ਚਾਹੀਦੀ ਹੈ?" },
  { hi: "Is project ke liye kaunsi skill chahiye?", en: "Which skill does this project need?", bn: "এই প্রজেক্টের জন্য কোন দক্ষতা লাগবে?", ta: "இந்தத் திட்டத்திற்கு எந்தத் திறன் தேவை?", kn: "ಈ ಯೋಜನೆಗೆ ಯಾವ ಕೌಶಲ್ಯ ಬೇಕು?", pa: "ਇਸ ਪ੍ਰੋਜੈਕਟ ਲਈ ਕਿਹੜਾ ਹੁਨਰ ਚਾਹੀਦਾ ਹੈ?" },
];
const LG_QUESTION_MS = 3200;

const COMMITMENT_STEPS = [
  { title: "Adapt", copy: "When what you need changes, the way you learn can change with it.", image: cmAdapt, alt: "Child learning with a tablet outdoors" },
  { title: "Grow", copy: "When you know more, you should be able to go further.", image: cmGrow, alt: "Student growing their skills" },
  { title: "Create", copy: "When an idea becomes real, your intelligence should come with you.", image: cmCreate, alt: "Person building a real project" },
  { title: "Continue", copy: "Wherever you go next, you shouldn't have to begin again.", image: cmContinue, alt: "Learner continuing their journey" },
];
const CM_FILL_MS = 4000;

const LX_TRUST_WORDS = ["information", "privacy", "progress."];
const LX_TRUST_CARDS = [
  { title: "Your data stays yours.", copy: "You choose what Visionary remembers and how you use it.", alt: "Person working privately on a laptop", Icon: ShieldCheck, to: "/privacy", link: "Read our privacy approach" },
  { title: "Safe to grow with.", copy: "Age-aware guidance and human review help keep learning on track.", alt: "Shield protecting a learner's journey", Icon: HeartHandshake, to: "/security", link: "See our security practices" },
  { title: "Built with care.", copy: "Visionary helps people learn, work, and create.", alt: "Responsibly built intelligence illustration", Icon: Scale, to: "/terms", link: "Read our commitments" },
];
const LX_TRUST_IMG = [cmContinue, teacherSlide, parentSlide];
const LX_EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Understand lessons, practise ideas, and build with confidence.", alt: "Student learning with a laptop" },
  { slug: "teacher", chip: "Teacher", copy: "Plan lessons, check understanding, and teach the next idea.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "parent", chip: "Parent", copy: "See progress clearly and know when to help.", alt: "Parent helping a child at a desk" },
  { slug: "professional", chip: "Professional", copy: "Turn what you learn into work you can use.", alt: "Professional discussing work with a tablet" },
  { slug: "organization", chip: "Organization", copy: "Help teams share context across projects.", alt: "Leader talking at an organization table" },
];

const FAQ_ITEMS = [
  { q: "What is Visionary?", a: "Visionary brings explanations, practice, an AI mentor, and project tools into one place for learning and work." },
  { q: "Who is Visionary for?", a: "Students, teachers, parents, professionals, and organizations can each use a journey shaped around their work." },
  { q: "What can Visionary remember?", a: "It can remember what you understood, where you struggled, and what you tried, so you can continue when you return." },
  { q: "How does Visionary use my information?", a: "Visionary uses your information to support your journey. It does not sell your information, and you stay in control." },
  { q: "Can I use Visionary in my own language?", a: "Yes. You can ask, learn, and practise in 20+ languages while keeping your context connected." },
  { q: "Is Visionary suitable for children?", a: "Yes. Age-aware guidance, strong protections, and human review help make Visionary safe to grow with." },
];

/* ═══════════════════════ SECTION VIEWS ═══════════════════════ */

/* 01 · HERO — the universal front door, product-first. Analyzed against
   Apple's iPhone 18 Pro hero ("iPhone 18 Pro" / "Pro further." / links) and
   Google's Store + Workspace heroes (name / short tagline / one CTA): tiny
   word counts, a clear title→tagline hierarchy, and the product visual as
   the largest element on screen. So: the five journeys stand together as
   one family on top (the lead visual), then a single-line title, a true
   sub-heading, the one-sentence promise, and the CTA pair — no eyebrow, no
   decoration. All vertical rhythm is vh-clamped so every device keeps the
   same proportional breathing space. Non-interactive — the Meet Visionary
   section owns per-category navigation. */
const LINEUP_WIDTHS = {
  outer: "clamp(54px, min(23vh, 12.3vw), 240px)",
  mid: "clamp(70px, min(29vh, 15.5vw), 300px)",
  center: "clamp(88px, min(34vh, 19vw), 380px)",
};

const LANDING_HERO_LINEUP = [
  { label: "Professional", src: professionalHero, w: "outer" },
  { label: "Teacher", src: teacherHero, w: "mid" },
  { label: "Student", src: studentHero, w: "center" },
  { label: "Parent", src: parentHero, w: "mid" },
  { label: "Organization", src: orgHero, w: "outer" },
];

/* the cast overlaps slightly on desktop — one group, not five cards */
const overlapCls = (i) => (i > 0 ? "lg:-ml-6 xl:-ml-8" : "");

const LandingHeroSection = React.memo(function LandingHeroSection() {
  return (
    <section
      data-section="01-hero"
      className="relative flex min-h-[calc(100svh-64px)] flex-col overflow-hidden bg-white"
      style={{ fontFamily: FONT_FAMILY, marginTop: 64 }}
    >
      {/* Apple-style entrance: the product lands first with a soft blur-rise,
          then the words resolve in — the launch-tile sequence. After landing,
          the family keeps a barely-there levitation and the ground shadow
          breathes with it. Devices that report reduced-motion (many Windows
          installs ship with client-area animations off) still get a calm
          staggered crossfade — visible, just without movement. */}
      <style>
        {`@keyframes appleRise{
from{opacity:0;transform:translateY(30px) scale(0.96);filter:blur(10px)}
to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
}
@keyframes appleTextIn{
from{opacity:0;transform:translateY(16px);filter:blur(8px)}
to{opacity:1;transform:translateY(0);filter:blur(0)}
}
@keyframes appleFloat{
0%,100%{transform:translateY(0)}
50%{transform:translateY(-7px)}
}
@keyframes appleShadowSwell{
0%,100%{transform:scaleX(1)}
50%{transform:scaleX(0.96)}
}
@keyframes appleFadeIn{
from{opacity:0}
to{opacity:1}
}
@media (prefers-reduced-motion: reduce){
.apple-anim{animation-name:appleFadeIn !important;animation-duration:0.7s !important;animation-timing-function:ease-out !important;animation-iteration-count:1 !important}
.apple-float{animation:none !important}
}`}
      </style>

      {/* the stage — white. The cutouts' baked mist fades dissolve them into
          it, so the cast stands in light without any atmosphere layer. */}

      <div
        className="relative mx-auto flex w-full max-w-[1756px] flex-1 flex-col items-center justify-center px-6 pt-14 pb-12 text-center sm:px-8 lg:pt-[min(8.5vh,110px)] lg:pb-[4.5vh]"
      >
        {/* the five journeys — one cast, standing together in the light.
            The figures are background-free cutouts with a baked mist fade,
            so they can share a stage and overlap like a family portrait. */}
        <div className="relative flex w-full flex-col items-center">
          {/* portraits — stepped heights, bottom-aligned on one ground line;
              after the entrance the whole row levitates almost imperceptibly */}
          <div
            className="apple-float relative z-10 flex items-end justify-center gap-0 sm:gap-3 lg:gap-4"
            style={{ animation: "appleFloat 7s ease-in-out 2.6s infinite" }}
          >
            {LANDING_HERO_LINEUP.map((p, i) => (
              <div
                key={p.label}
                className={`apple-anim relative ${overlapCls(i)}`}
                style={{
                  width: LINEUP_WIDTHS[p.w],
                  zIndex: p.w === "center" ? 30 : p.w === "mid" ? 20 : 10,
                  animation: "appleRise 1.1s cubic-bezier(0.16,1,0.3,1) both",
                  animationDelay: `${100 + i * 80}ms`,
                }}
              >
                <img
                  src={p.src}
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  decoding="async"
                  draggable="false"
                  className="h-auto w-full select-none"
                />
              </div>
            ))}
          </div>

          {/* contact shadow — tight and quiet, like a product shot */}
          <div
            aria-hidden="true"
            className="apple-anim relative z-10 -mt-1.5 h-[11px] w-[min(1280px,94%)] rounded-[100%]"
            style={{
              backgroundColor: "rgba(31,35,45,0.12)",
              filter: "blur(9px)",
              animation: "appleRise 1s cubic-bezier(0.16,1,0.3,1) both",
              animationDelay: "480ms",
            }}
          />

          {/* labels — identification only, never links (Meet section navigates) */}
          <div className="mt-3 flex items-start justify-center gap-1.5 sm:gap-3 lg:gap-4">
            {LANDING_HERO_LINEUP.map((p, i) => (
              <span
                key={p.label}
                className={`apple-anim hidden font-normal uppercase tracking-[0.14em] leading-[14px] text-[12px] sm:block ${overlapCls(i)}`}
                style={{
                  width: LINEUP_WIDTHS[p.w],
                  color: COLORS.slate,
                  animation: "appleTextIn 0.9s cubic-bezier(0.16,1,0.3,1) both",
                  animationDelay: "600ms",
                }}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>

        {/* title → tagline → promise — the Apple/Google hero hierarchy at the
            canonical display scale; vh caps keep shorter laptops whole */}
        <h1 className="m-0 mt-[max(28px,6vh)] lg:mt-[5.5vh]">
          <span
            className="apple-anim block font-medium leading-[1.05] tracking-[0] text-[#121317]"
            style={{
              fontSize: "clamp(48px, min(5.55vw, 11vh), 80px)",
              animation: "appleTextIn 1s cubic-bezier(0.16,1,0.3,1) both",
              animationDelay: "560ms",
            }}
          >
            One Intelligence.
          </span>
          <span
            className="apple-anim block font-medium leading-[1.2] tracking-[0]"
            style={{
              fontSize: "clamp(22px, min(2.6vw, 4.2vh), 40px)",
              color: COLORS.blue,
              marginTop: "clamp(10px, 1.6vh, 22px)",
              animation: "appleTextIn 1s cubic-bezier(0.16,1,0.3,1) both",
              animationDelay: "660ms",
            }}
          >
            Built around you.
          </span>
        </h1>

        {/* promise — Google writing style: plain, personal, one breath */}
        <p
          className="apple-anim mx-auto mt-3 max-w-[680px] font-normal tracking-[0] leading-[1.55] text-[16.5px] lg:text-[17.5px]"
          style={{
            color: COLORS.slate,
            animation: "appleTextIn 1s cubic-bezier(0.16,1,0.3,1) both",
            animationDelay: "760ms",
          }}
        >
          Visionary carries your context across learning, teaching,
          work, and life.
        </p>

        {/* CTA pair — same pills as every category hero */}
        <div
          className="apple-anim mt-[max(24px,3.5vh)] flex flex-wrap items-center justify-center gap-3 lg:mt-[3vh]"
          style={{
            animation: "appleTextIn 1s cubic-bezier(0.16,1,0.3,1) both",
            animationDelay: "860ms",
          }}
        >
          <Link
            to="/register"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#121317] px-7 text-[16px] font-medium tracking-[0.24px] text-white transition-transform duration-200 hover:scale-[1.01] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
          >
            Start free
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex h-12 items-center justify-center rounded-full border border-[#dadce0] bg-white px-7 text-[16px] font-normal tracking-[0.24px] text-[#121317] transition-colors duration-200 hover:bg-[#F8F9FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
          >
            See how it works
          </Link>
        </div>
      </div>
    </section>
  );
});

/* 02 · PROBLEM */
function LandingProblemSection() {
  const { index, goTo } = useCycleIndex(PROBLEM_SLIDES.length, PROBLEM_MS);
  const { ref, visible } = useRevealContinuous();
  const slide = PROBLEM_SLIDES[index];
  return (
    <section ref={ref} data-section="02-problem" className="relative overflow-hidden bg-[#f8f9fa] py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto grid w-full max-w-[1756px] grid-cols-1 items-center gap-14 px-6 lg:grid-cols-12 lg:gap-10 lg:px-0">
          <div className="lg:col-span-5 lg:pl-[var(--frame-x)]">
            <p className="font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Why Visionary exists</p>
            <h2 key={`h-${index}`} className="hero-fade-up mt-[calc(clamp(28px,2.78vw,40px)*0.857)] max-w-[460px] font-medium tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
              {slide.black} <span style={{ color: COLORS.blue }}>{slide.blue}</span>.
            </h2>
          </div>
          <div className="lg:col-span-7 lg:pr-[var(--frame-x)]">
            <figure className="m-0">
              <div key={`m-${index}`} className="hero-fade-up [animation-delay:120ms] [animation-fill-mode:both]">
                <img src={slide.image} alt={slide.alt} loading="lazy" decoding="async" className="aspect-[16/9] w-full max-w-[640px] mx-auto rounded-[50px] object-cover" />
              </div>
              <figcaption key={`q-${index}`} aria-live="polite" className="hero-fade-up mx-auto mt-10 w-full max-w-[560px] text-center [animation-delay:200ms] [animation-fill-mode:both]">
                <p className="font-medium tracking-[0] leading-[20px] text-[16px]" style={{ color: COLORS.ink }}>{slide.persona}</p>
                <p className="mt-2 font-normal tracking-[0] leading-[1.27] text-[clamp(16px,1.39vw,20px)]" style={{ color: COLORS.ink }}>{slide.quote}</p>
              </figcaption>
            </figure>
          </div>
        </div>
        <div className="mt-14 flex justify-center"><CarouselDots total={PROBLEM_SLIDES.length} active={index} onSelect={goTo} /></div>
      </FadeReveal>
    </section>
  );
}

/* 03 · PROMISE */
const LandingPromiseSection = React.memo(function LandingPromiseSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} data-section="03-promise" className="relative overflow-hidden px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY, backgroundColor: COLORS.white }}>
      <h2 className={`mx-auto max-w-[1080px] text-center font-medium tracking-[0] leading-[1] text-[clamp(34px,5vw,72px)] transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ color: COLORS.ink }}>
        What if your intelligence never forgot <span style={{ color: COLORS.blue }}>where you were?</span>
      </h2>
    </section>
  );
});

/* 04 · MEET */
const MeetHeading = React.memo(function MeetHeading({ section, index }) {
  const blue = section.blues[index % section.blues.length];
  return (
    <h3 className="font-medium tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
      {section.leadBlue ? (
        <>
          <span key={`l-${index}`} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{section.leadBlue[index % section.leadBlue.length]}</span>{" "}
          {section.midBlack}{" "}
          <span key={`b-${index}`} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{blue}</span>
        </>
      ) : (
        <>
          {section.leadBlack} {section.midBlack ? `${section.midBlack} ` : ""}
          <span key={`b-${index}`} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{blue}</span>
        </>
      )}
    </h3>
  );
});

const MeetTabs = React.memo(function MeetTabs({ active, onSelect }) {
  return (
    <div className="mx-auto flex h-[52px] w-full max-w-[900px] items-stretch overflow-hidden rounded-[90px] border bg-white p-0" style={{ borderColor: COLORS.mist }} role="tablist" aria-label="Audiences">
      {MEET_SECTIONS.map((s, i) => (
        <button key={s.id} type="button" role="tab" aria-selected={active === i} onClick={() => onSelect(i)}
          className={`flex h-full flex-1 items-center justify-center rounded-[90px] text-[12px] sm:text-[14px] tracking-[0.24px] transition-colors ${active === i ? "font-medium" : "font-normal hover:bg-[#ffffff]"}`}
          style={{ backgroundColor: active === i ? COLORS.ink : "transparent", color: active === i ? "#ffffff" : COLORS.slate }}>
          {s.tab}
        </button>
      ))}
    </div>
  );
});

const MeetCopy = React.memo(function MeetCopy({ section }) {
  const { index } = useCycleIndex(section.blues.length, 3000);
  return (
    <div className="max-w-[460px]">
      <MeetHeading section={section} index={index} />
      <p className="mt-8 font-normal tracking-[0] leading-[1.6] text-[14px]" style={{ color: COLORS.graphite }}>{section.copy}</p>
      <Link to={section.to} className="mt-10 inline-flex h-10 items-center justify-center rounded-full border border-[#dadce0] px-6 text-[14px] font-normal tracking-[0.24px] text-[#4285F4] transition-colors hover:border-[#4285F4] hover:bg-[#4285F4] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">
        {section.link}
      </Link>
    </div>
  );
});

function LandingMeetSection() {
  const { index: wordIndex } = useCycleIndex(MEET_WORDS.length, MEET_WORD_MS);
  const { ref: headRef, visible } = useRevealOnce();
  const { active, setStepRef } = useActiveStep(MEET_SECTIONS.length);
  const sectionRef = useRef(null);
  const scrollToRow = (i) => {
    const rows = sectionRef.current?.querySelectorAll("[data-step]");
    rows?.[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return (
    <section ref={sectionRef} data-section="04-meet" className="relative bg-white py-24 lg:py-32 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <div ref={headRef} className="px-6">
        <FadeReveal visible={visible}>
          <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Meet Visionary</p>
          <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
            It <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{MEET_WORDS[wordIndex]}</span>
          </h2>
          <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
            Visionary continues your journey instead of restarting it.
          </p>
        </FadeReveal>
      </div>
      <div className="sticky top-16 z-30 bg-white px-6 py-6"><MeetTabs active={active} onSelect={scrollToRow} /></div>
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-16 px-6 pb-24 pt-16 lg:grid-cols-[5fr_6fr] lg:gap-60 lg:px-0 lg:pt-24">
        <div className="hidden lg:block">
          <div className="sticky top-[140px] flex h-[calc(100vh-160px)] items-center">
            <div key={active} className="hero-fade-up"><MeetCopy section={MEET_SECTIONS[active]} /></div>
          </div>
        </div>
        <div className="flex flex-col gap-32 lg:gap-[40vh] lg:py-[12vh]">
          {MEET_SECTIONS.map((s, i) => (
            <div key={s.id}>
              <figure ref={setStepRef(i)} data-step={i} className="m-0">
                <div className="mx-auto w-full max-w-[440px] overflow-hidden border border-[#121317]/30 rounded-[50px] lg:mx-0 lg:max-w-none">
                  <img src={MEET_IMG[i]} alt={s.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover lg:aspect-[15/16]" />
                </div>
              </figure>
              <div className="mt-10 lg:hidden"><MeetCopy section={s} /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 05 · ONE INTELLIGENCE — the Apple Vision Pro pinned stage: on desktop the
   visual holds in place while scroll position advances the four phases;
   mobile and reduced motion keep the autonomous cycle. */
function LandingOneIntelligenceSection() {
  const { ref, visible } = useRevealOnce();
  const [phase, setPhase] = useState(0);
  const [scrollDriven, setScrollDriven] = useState(false);
  const runwayRef = useRef(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setScrollDriven(desktop.matches && !reduce.matches);
    update();
    desktop.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (scrollDriven) return undefined;
    const id = setTimeout(() => setPhase((p) => (p + 1) % 5), OI_PHASE_MS[Math.min(phase, 4)]);
    return () => clearTimeout(id);
  }, [phase, scrollDriven]);

  useEffect(() => {
    if (!scrollDriven) return undefined;
    let raf = 0;
    const measure = () => {
      const run = runwayRef.current;
      if (!run) return;
      const rect = run.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      setPhase(progress >= 0.96 ? 4 : Math.min(3, Math.floor(progress / 0.24)));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [scrollDriven]);

  const finale = phase === 4;
  const state = OI_STATES[Math.min(phase, 3)];
  return (
    <section ref={ref} data-section="05-one-intelligence" className="relative [overflow-x:clip] bg-white py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <style>{"@keyframes oiSpin{to{transform:rotate(360deg)}}@keyframes oiFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}"}</style>
      <div className={`px-6 transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>One Intelligence</p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] text-center font-medium tracking-[0] leading-[1.08] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          What you <span style={{ color: COLORS.blue }}>understand</span> today
          <br className="hidden md:block" /> makes tomorrow easier.
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] text-center font-normal tracking-[0.27px] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
          Every lesson, conversation, project, and breakthrough becomes part of what comes next.
        </p>
        <div ref={runwayRef} className={scrollDriven ? "relative lg:h-[280vh]" : "relative"}>
          <div className={scrollDriven ? "lg:sticky lg:top-[10vh] flex justify-center lg:min-h-[76vh] lg:items-center" : undefined}>
            <div className={`relative mx-auto mt-32 h-[min(440px,88vw)] w-[min(440px,88vw)] sm:h-[540px] sm:w-[540px] lg:h-[640px] lg:w-[640px] ${scrollDriven ? "lg:mt-0" : ""}`}>          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" style={{ animation: "oiSpin 60s linear infinite" }} aria-hidden="true">
          <circle cx="50" cy="50" r="49" fill="none" stroke={COLORS.ring} strokeWidth="0.35" strokeDasharray="4 5" />
        </svg>
          <svg viewBox="0 0 100 100" className="absolute inset-[13%] h-[74%] w-[74%]" style={{ animation: "oiSpin 90s linear infinite reverse" }} aria-hidden="true">
            <circle cx="50" cy="50" r="49" fill="none" stroke={COLORS.ring} strokeWidth="0.4" strokeDasharray="4 5" />
          </svg>
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div key={phase} className="flex w-full max-w-[340px] flex-col items-center px-4 text-center" style={{ animation: "oiFade 900ms cubic-bezier(0.22,1,0.36,1) both" }}>
              {finale ? (
                <>
                  <VMark className="h-10 w-auto" />
                  <h3 className="mt-[calc(clamp(20px,2.4vw,30px)*1)] font-medium tracking-[0] leading-[1.15] text-[clamp(20px,2.4vw,30px)]" style={{ color: COLORS.ink }}>One intelligence. Always with you.</h3>
                </>
              ) : (
                <>
                  <span className="rounded-full px-4 py-1 font-normal uppercase tracking-[0.43px] text-[12px]" style={{ backgroundColor: COLORS.chipBg, color: COLORS.ink }}>{state.label}</span>
                  <h3 className="mt-[calc(clamp(22px,2.6vw,34px)*0.909)] font-medium tracking-[0] leading-[1.2] text-[clamp(22px,2.6vw,34px)]" style={{ color: COLORS.ink }}>{state.heading}</h3>
                  <p className="mt-[calc(clamp(22px,2.6vw,34px)*0.727)] font-normal tracking-[0.24px] leading-[1.5] text-[14px]" style={{ color: COLORS.slate }}>{state.body}</p>
                  <div className="mt-6 h-[2px] w-[240px] overflow-hidden rounded-full" style={{ backgroundColor: COLORS.mist }}>
                    <div className="h-full transition-all duration-700" style={{ width: `${((Math.min(phase, 3) + 1) / 4) * 100}%`, backgroundColor: COLORS.blue }} />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-1/2 z-20 w-[min(680px,92vw)] -translate-x-1/2 translate-y-1/2 bg-white px-2 sm:px-6">
            <div className="flex items-start justify-between">
              {OI_STEP_LABELS.map((label, i) => (
                <React.Fragment key={label}>
                  <div className="flex w-16 flex-col items-center gap-3 sm:w-20">
                    {phase >= i ? (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full text-[28px] font-medium transition-colors duration-700" style={{ backgroundColor: COLORS.blue, color: COLORS.white }}>{i + 1}</span>
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center text-[28px] font-normal leading-none transition-colors duration-700" style={{ color: COLORS.lightGrey }}>{i + 1}</span>
                    )}
                    <span className="text-[12px] font-normal uppercase tracking-[0.43px] transition-colors duration-700" style={{ color: phase >= i ? COLORS.blue : COLORS.lightGrey }}>{label}</span>
                  </div>
                  {i < 3 && <div className="mx-1 mt-6 h-[2px] flex-1 transition-colors duration-700" style={{ backgroundColor: phase > i ? COLORS.blue : COLORS.mist }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        </div>
          </div>
        <div className="mx-auto mt-24 flex w-fit max-w-full items-center justify-center gap-4 rounded-full px-8 py-5 sm:px-10" style={{ backgroundColor: COLORS.surface }}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-6 w-6 shrink-0" style={{ color: COLORS.ink }}><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" /></svg>
          <p className="text-center font-normal tracking-[0.24px] text-[15px] text-balance" style={{ color: COLORS.ink }}>It doesn't just remember your past. <span style={{ color: COLORS.blue }}>It understands what comes next.</span></p>
        </div>
      </div>
    </section>
  );
}

/* 06 · COMMITMENT */
function LandingCommitmentSection() {
  const { ref, visible } = useRevealOnce();
  const [active, setActive] = useState(0);
  const [runId, setRunId] = useState(0);
  const select = (i) => { setActive(i); setRunId((r) => r + 1); };
  const next = () => { setActive((a) => (a + 1) % COMMITMENT_STEPS.length); setRunId((r) => r + 1); };
  const step = COMMITMENT_STEPS[active];
  return (
    <section ref={ref} data-section="06-commitment" className="relative overflow-hidden bg-white py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <style>{"@keyframes cmFill{from{transform:scaleY(0)}to{transform:scaleY(1)}}"}</style>
      <div className={`px-6 transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Our commitment</p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] text-center font-medium tracking-[0] leading-[1.08] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>You keep changing.<br />Visionary keeps learning with you.</h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] text-center font-normal tracking-[0.27px] leading-[1.6] text-[16px]" style={{ color: COLORS.slate }}>
          New questions bring new work. Visionary helps you carry what you learn into the next step.
        </p>
        <div className="mx-auto mt-24 grid w-full max-w-[1400px] grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="flex flex-col gap-10">
            {COMMITMENT_STEPS.map((s, i) => {
              const isActive = i === active;
              return (
                <button key={s.title} type="button" onClick={() => select(i)} aria-expanded={isActive} className="flex items-start gap-6 rounded-[8px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
                  <span className={`relative w-[4px] shrink-0 overflow-hidden rounded-full transition-all duration-700 ease-google ${isActive ? "h-[96px]" : "mt-1 h-[28px]"}`} style={{ backgroundColor: COLORS.track }}>
                    {isActive && <span key={`fill-${active}-${runId}`} className="absolute inset-0 origin-top rounded-full" style={{ backgroundColor: COLORS.blue, transform: "scaleY(0)", animation: `cmFill ${CM_FILL_MS}ms linear forwards` }} onAnimationEnd={next} />}
                  </span>
                  <span className="flex-1">
                    <span className="block tracking-[0] leading-[1.15] text-[clamp(24px,2.4vw,32px)]" style={{ color: COLORS.ink, fontWeight: isActive ? 500 : 400 }}>{i + 1}. {s.title}</span>
                    <span className={`grid transition-all duration-500 ease-google ${isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <span className="block overflow-hidden">
                        <span className="mt-3 block max-w-[420px] text-[14px] leading-[1.6] tracking-[0.24px]" style={{ color: COLORS.slate }}>{s.copy}</span>
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div key={`${active}-${runId}`} className="hero-fade-up">
            <img src={step.image} alt={step.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full rounded-[48px] object-cover lg:aspect-[5/4]" />
          </div>
        </div>
        <p className="mx-auto mt-28 max-w-[1400px] text-center font-normal tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
          Built for who you are. Ready for <span style={{ color: COLORS.blue }}>who you become.</span>
        </p>
      </div>
    </section>
  );
}

/* 07 · LANGUAGE */
const LGLanguageChips = React.memo(function LGLanguageChips({ active, onSelect }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Language selection">
      {LG_CHIPS.map((lang) => (
        <button key={lang.code} type="button" aria-pressed={active === lang.code} onClick={() => onSelect(lang.code)}
          className={`rounded-full px-5 py-2 font-normal uppercase tracking-[0] leading-[14px] text-[12px] transition-colors ${active === lang.code ? "" : "border hover:bg-[#121317]/5"}`}
          style={{ backgroundColor: active === lang.code ? COLORS.chipBg : "transparent", color: COLORS.ink, borderColor: active === lang.code ? "transparent" : `${COLORS.ink}40` }}>
          {lang.label}
        </button>
      ))}
      <span className="font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.ink }}>+20 languages</span>
    </div>
  );
});

function LandingLanguageSection() {
  const { ref, visible } = useRevealOnce();
  const [lang, setLang] = useState("hi");
  const [qIndex, setQIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setQIndex((i) => (i + 1) % LG_QUESTIONS.length), LG_QUESTION_MS);
    return () => clearInterval(id);
  }, []);
  const question = LG_QUESTIONS[qIndex][lang];
  return (
    <section ref={ref} data-section="07-language" className="relative overflow-hidden bg-[#f8f9fa] px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <style>{"@keyframes voiceDot{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}"}</style>
      <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Every language</p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Every language.<br /><span style={{ color: COLORS.blue }}>One understanding.</span></h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
          Visionary understands what you mean, in the language you think in.
        </p>
        <div className="mt-14 lg:mt-20"><LGLanguageChips active={lang} onSelect={setLang} /></div>
        <div className="mx-auto mt-16 w-full max-w-[860px] lg:mt-24">
          <div className="flex items-end justify-center gap-2" aria-hidden="true">
            {["#4285F4", "#4285F4", "#4285F4", "#4285F4"].map((c, i) => (
              <span key={`${c}-${i}`} className="h-8 w-1.5 rounded-full" style={{ backgroundColor: c, transformOrigin: "center", animation: `voiceDot 1.2s ease-in-out ${i * 0.15}s infinite` }} />
            ))}
          </div>
          <p aria-live="polite" lang={lang} className="mx-auto mt-8 max-w-[760px] text-center font-normal tracking-[0] leading-[1.25] text-[clamp(26px,3.4vw,48px)]" style={{ color: COLORS.blue }}>
            <span key={`${lang}-${qIndex}`} className="hero-fade-up inline">{question}</span>
          </p>
          <p className="mt-6 text-center font-normal tracking-[0] leading-[20px] text-[13px]" style={{ color: COLORS.lightGrey }}>
            Listening in {LG_CHIPS.find((c) => c.code === lang)?.label || lang} · understood in every language
          </p>
        </div>
        <div className="mt-14 flex justify-center lg:mt-20">
          <div className="flex items-center gap-4 rounded-full px-8 py-4" style={{ backgroundColor: COLORS.surface }}>
            <VoiceIcon className="h-6 w-6 shrink-0" style={{ color: COLORS.blue }} />
            <div>
              <p className="font-normal tracking-[0] leading-[20px] text-[15px]" style={{ color: COLORS.ink }}>Speak your way</p>
              <p className="mt-1 font-normal tracking-[0] leading-[19px] text-[13px]" style={{ color: COLORS.slate }}>Use voice or text in the way you're comfortable.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 08 · TRUST */
const LXTrustCard = React.memo(function LXTrustCard({ card, cardIndex }) {
  const img = LX_TRUST_IMG[cardIndex % LX_TRUST_IMG.length];
  return (
    <div className="relative w-full max-w-[780px] overflow-hidden rounded-[32px]">
      <img src={img} alt={card.alt} loading="lazy" decoding="async" className="aspect-[8/5] w-full object-cover" />
      <div className="absolute left-6 top-6 sm:left-8 sm:top-8 sm:max-w-[320px]">
        <div className="rounded-[20px] bg-white/95 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.chipBg, color: COLORS.blue }}>
            <card.Icon className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <p className="mt-3 font-normal tracking-[0] leading-[22px] text-[15px]" style={{ color: COLORS.ink }}>{card.copy}</p>
          <Link to={card.to} className="mt-3 inline-flex items-center gap-1.5 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
            {card.link}
            <ChevronIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
});

function useLXScrollTrack() {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const update = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    setCanPrev(t.scrollLeft > 4);
    setCanNext(t.scrollLeft < t.scrollWidth - t.clientWidth - 4);
  }, []);
  useEffect(() => {
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, [update]);
  const scrollByCard = useCallback((dir) => {
    const t = trackRef.current;
    if (!t) return;
    const card = t.querySelector("[data-card]");
    if (!card) return;
    const gap = parseFloat(getComputedStyle(t).columnGap) || 0;
    t.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: "smooth" });
  }, []);
  return { trackRef, canPrev, canNext, scrollByCard, update };
}

function LandingTrustSection() {
  const { ref, visible } = useRevealOnce();
  const { index: wordIndex } = useCycleIndex(LX_TRUST_WORDS.length, 3000);
  const [cardIndex, setCardIndex] = useState(0);
  const stepCards = useCallback((d) => setCardIndex((i) => (i + d + LX_TRUST_CARDS.length) % LX_TRUST_CARDS.length), []);
  const activeCard = LX_TRUST_CARDS[cardIndex];
  const nextCard = LX_TRUST_CARDS[(cardIndex + 1) % LX_TRUST_CARDS.length];
  return (
    <section ref={ref} data-section="08-trust" className="relative overflow-hidden bg-white py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="px-6 text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Trust and safety</p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{LX_TRUST_WORDS[wordIndex]}</span>
        </h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
          Your learning, conversations, ideas, and progress are personal. Visionary keeps it that way.
        </p>
        <div className="mx-auto mt-24 grid w-full max-w-[1600px] grid-cols-1 items-start gap-16 px-6 lg:mt-32 lg:grid-cols-[4fr_8fr] lg:gap-24 lg:px-0">
          <div className="lg:pl-[var(--frame-x)]">
            <h3 key={activeCard.title} className="hero-fade-up max-w-[460px] font-medium tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>{activeCard.title}</h3>
            <div className="mt-12 flex gap-4">
              <button type="button" aria-label="Previous trust card" onClick={() => stepCards(-1)} className="flex h-12 w-12 items-center justify-center rounded-full border bg-white transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}><ChevronIcon direction="left" /></button>
              <button type="button" aria-label="Next trust card" onClick={() => stepCards(1)} className="flex h-12 w-12 items-center justify-center rounded-full border bg-white transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}><ChevronIcon direction="right" /></button>
            </div>
          </div>
          <div className="flex flex-col gap-8 2xl:grid 2xl:grid-cols-2 2xl:gap-10 lg:pr-[var(--frame-x)]">
            <div key={`a-${cardIndex}`} className="hero-fade-up w-full max-w-[780px]"><LXTrustCard card={activeCard} cardIndex={cardIndex} /></div>
            <div key={`b-${cardIndex}`} className="hero-fade-up hidden w-full max-w-[780px] 2xl:block [animation-delay:80ms] [animation-fill-mode:both]"><LXTrustCard card={nextCard} cardIndex={(cardIndex + 1) % LX_TRUST_CARDS.length} /></div>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* 09 · CTA */
function LandingCTASection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} data-section="09-cta" className="relative px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY, backgroundColor: "#e8f0fe" }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Start today</p>
        <h2 className="mt-[calc(clamp(36px,5vw,72px)*0.444)] font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Your next step starts here.</h2>
        <p className="mx-auto mt-[calc(clamp(36px,5vw,72px)*0.667)] max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
          Ask a question. Explore an idea. Start learning. Visionary is ready when you are.
        </p>
        <div className="mt-12 flex justify-center">
          <Link to="/register" className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ backgroundColor: COLORS.blue }}>
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
}

/* 10 · EXPLORE */
const LXExploreCard = React.memo(function LXExploreCard({ category, image }) {
  return (
    <Link to={`/${category.slug}`} data-card className="elevation-1 block w-[260px] shrink-0 snap-start overflow-hidden rounded-[24px] border bg-white" style={{ borderColor: `${COLORS.ink}1A` }}>
      <img src={image} alt={category.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
      <div className="flex flex-col items-center px-6 pb-6 pt-5 text-center">
        <p className="font-normal uppercase tracking-[0] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>{category.chip}</p>
        <p className="mt-3 font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>{category.copy}</p>
        <span className="mt-4 font-normal tracking-[0] leading-[22px] text-[16px]" style={{ color: COLORS.blue }}>Learn more</span>
      </div>
    </Link>
  );
});

function LandingExploreSection() {
  const { ref, visible } = useRevealOnce();
  const { trackRef, canPrev, canNext, scrollByCard, update } = useLXScrollTrack();
  return (
    <section ref={ref} data-section="10-explore" className="relative bg-white py-16 lg:py-20 [overflow-x:clip]" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="flex items-center justify-between gap-6 px-6 lg:pl-[6.5%] lg:pr-[6%]">
          <h2 className="font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>Explore Visionary</h2>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Previous categories" onClick={() => scrollByCard(-1)}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-white transition-all hover:bg-[#121317]/5 ${canPrev ? "opacity-100" : "pointer-events-none opacity-40"}`}
              style={{ borderColor: `${COLORS.ink}1A`, color: COLORS.ink, boxShadow: "0 8px 24px rgba(60,64,67,0.08)" }}>
              <ChevronIcon direction="left" />
            </button>
            <button type="button" aria-label="Next categories" onClick={() => scrollByCard(1)}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-white transition-all hover:bg-[#121317]/5 ${canNext ? "opacity-100" : "pointer-events-none opacity-40"}`}
              style={{ borderColor: `${COLORS.ink}1A`, color: COLORS.ink, boxShadow: "0 8px 24px rgba(60,64,67,0.08)" }}>
              <ChevronIcon direction="right" />
            </button>
          </div>
        </div>
        <div ref={trackRef} onScroll={update} className="mt-16 flex snap-x snap-mandatory gap-8 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mt-20 lg:gap-12 lg:pl-[6.5%] lg:pr-6">
          {LX_EXPLORE_CATEGORIES.map((c, i) => <LXExploreCard key={c.slug} category={c} image={MEET_IMG[i % MEET_IMG.length]} />)}
        </div>
      </FadeReveal>
    </section>
  );
}

/* 11 · FAQ */
function LandingFAQSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} data-section="11-faq" className="relative overflow-hidden bg-[#f8f9fa] px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>FAQ</p>
        <h2 className="mx-auto max-w-[1100px] text-center font-medium tracking-[0] leading-[1.08] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-title-sub-display)" }}>Questions, answered.</h2>
        <div className="mx-auto mt-24 w-full max-w-[1240px]">
          <LandingFAQ faqs={FAQ_ITEMS} variant="hero" defaultOpen={0} />
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <LandingHeroSection />
        <LandingProblemSection />
        <LandingPromiseSection />
        <LandingMeetSection />
        <LandingOneIntelligenceSection />
        <LandingCommitmentSection />
        <LandingLanguageSection />
        <LandingTrustSection />
        <LandingCTASection />
        <LandingExploreSection />
        <LandingFAQSection />
      </main>
      <LandingFooter />
    </div>
  );
}