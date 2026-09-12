import React, { useCallback, useEffect, useState, useRef } from "react";
import studentImage from "@/assets/student-face-main.png";
import teacherImage from "@/assets/teacher-face-main.png";
import parentImage from "@/assets/parent-face-main.png";
import professionalImage from "@/assets/professional-face-main.png";
import organizationImage from "@/assets/organization-face-main.png";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import studentmeet from "@/assets/student-hero-main.png"
import teachermeet from "@/assets/teacher-hero-main.png"
import parentmeet from "@/assets/parent-hero-main.png"
import promeet from "@/assets/pro-face-main.png"
import orgmeet from "@/assets/org-face-main.png"
import problemunderstanding from "@/assets/problem-understanding.png";
import teacherSlide from "@/assets/teacher-hero-main.png";
import parentSlide from "@/assets/parent-hero-main.png";
import proSlide from "@/assets/pro-face-main.png";
import cmAdapt from "@/assets/student-primary.png";
import cmGrow from "@/assets/student-secondary.png";
import cmCreate from "@/assets/student-vocational.png";
import cmContinue from "@/assets/student-higher.png";
import { ShieldCheck, HeartHandshake, Scale } from "lucide-react";



/* ═══════════════════════ TOKENS ═══════════════════════ */
const COLORS = {
  ink: "#121317",
  graphite: "#3c4043",
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
const HERO_WORDS = ["your classroom.", "their journey.", "your work.", "your people."];
const HERO_WORD_MS = 2800;

const PROBLEM_SLIDES = [
  { black: "Teaching everyone is possible.", blue: "Reaching everyone isn't", persona: "A Teacher", quote: "I taught the whole class. Half of them still left lost.", image: teacherSlide, alt: "Teacher addressing a full classroom" },
  { black: "Seeing progress is easy.", blue: "Knowing how to help isn't", persona: "A Parent", quote: "The report card says fine. I still don't know how to help at home.", image: parentSlide, alt: "Parent reviewing a child's progress" },
  { black: "Accessing knowledge is easy.", blue: "Applying it isn't", persona: "A Student", quote: "I watched eight hours of videos and still couldn't solve a single problem on my own.", image: problemunderstanding, alt: "Student studying alone with a tablet" },
  { black: "Knowledge is everywhere.", blue: "Turning it into capability isn't", persona: "A Professional", quote: "I have all the articles. I still can't turn them into the work.", image: proSlide, alt: "Professional applying knowledge at work" },
];
const PROBLEM_MS = 4200;

const MEET_WORDS = ["understands.", "remembers.", "grows with you.", "starts with where you are."];
const MEET_WORD_MS = 3000;
const MEET_IMG = [studentmeet, teachermeet, parentmeet, promeet, orgmeet];

const MEET_SECTIONS = [
  { id: "student", tab: "Student", leadBlack: "Understand", blues: ["what you're learning.", "why it matters.", "where you're stuck.", "it for life."], copy: "Every lesson becomes easier to understand through visual learning, natural conversation, guided practice, and real-world application. One chapter leads naturally to the next, so your understanding keeps growing—not just your completed syllabus.", link: "See how students learn", to: "/student", alt: "Student studying with books" },
  { id: "teacher", tab: "Teacher", leadBlack: "Know", blues: ["what your class is learning.", "who needs another explanation.", "who's ready to move forward.", "every learner better."], copy: "Every learner understands differently. Visionary helps you adapt every lesson through visual teaching, guided conversations, and continuous support, so your classroom keeps moving forward together.", link: "Explore the Teacher Journey", to: "/teacher", alt: "Teacher presenting at a whiteboard" },
  { id: "parent", tab: "Parent", leadBlack: "Know", blues: ["what your child is learning.", "where they need support.", "how they're growing.", "before the exam."], copy: "See how your child is learning before report cards arrive. Understand their progress, know where they need support, and help them grow with confidence every step of the way.", link: "Explore the Parent Journey", to: "/parent", alt: "Parent helping child with homework" },
  { id: "professional", tab: "Professional", leadBlue: ["Learn", "Build"], midBlack: "what the work", blues: ["requires.", "rewards."], copy: "Learning shouldn't interrupt your work. Visionary helps every project become an opportunity to learn, solve problems, and build skills that continue growing with your career.", link: "Explore the Professional Journey", to: "/professional", alt: "Professional writing notes beside a laptop" },
  { id: "organization", tab: "Organization", leadBlack: "See", midBlack: "what your people are", blues: ["learning.", "becoming."], copy: "Great organizations don't just share information—they build understanding that lasts. Visionary helps knowledge grow across people, teams, and projects, so every experience strengthens what comes next.", link: "Explore the Organization Journey", to: "/organization", alt: "Leader reviewing team progress on a tablet" },
];

const OI_STATES = [
  { label: "Remember", heading: "It remembers more than what you said.", body: "It remembers what you understood, where you struggled, what you tried, and what changed along the way." },
  { label: "Understand", heading: "You never have to start over.", body: "When you return, Visionary already knows where you were, what you've done, and what makes sense to do next." },
  { label: "Continue", heading: "The more you use it, the more it understands you.", body: "Every lesson, conversation, practice, project, and decision gives the next one more context to work with." },
  { label: "Grow", heading: "Understanding compounds.", body: "What you learn, teach, and build today becomes the foundation for what you can do tomorrow." },
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
  { title: "Private by Design", copy: "Your personal information is treated with care.", alt: "Person working privately on a laptop", Icon: ShieldCheck, to: "/privacy", link: "Read the privacy approach" },
  { title: "Safe to grow with", copy: "Built from the first question to what's next.", alt: "Shield protecting a learner's journey", Icon: HeartHandshake, to: "/security", link: "See security practices" },
  { title: "Built responsibly.", copy: "Intelligence should help people without compromising matters to them.", alt: "Responsibly built intelligence illustration", Icon: Scale, to: "/terms", link: "Terms & commitments" },
];
const LX_TRUST_IMG = [cmContinue, teacherSlide, parentSlide];
const LX_EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Know how Visionary fits into your learning.", alt: "Student learning with a laptop" },
  { slug: "teacher", chip: "Teacher", copy: "Know how Visionary fits into your classroom.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "parent", chip: "Parent", copy: "Know how Visionary fits into your child's journey.", alt: "Parent helping a child at a desk" },
  { slug: "professional", chip: "Professional", copy: "Know how Visionary fits into the work you do.", alt: "Professional discussing work with a tablet" },
  { slug: "organization", chip: "Organization", copy: "Know how Visionary fits across your organization.", alt: "Leader talking at an organization table" },
];

const FAQ_ITEMS = [
  { q: "What is Visionary?", a: "Visionary is an all-in-one learning platform that offers visual explanations, AI mentor support, practice tools, and no-code project creation for students, teachers, parents, professionals, and institutions." },
  { q: "Who is Visionary for?", a: "Visionary is built for every learner — students, teachers, parents, professionals, and organizations. Each journey adapts to the person using it, while the same intelligence connects them all." },
  { q: "What can Visionary remember?", a: "It remembers what you understood, where you struggled, what you tried, and what changed along the way — so you never have to start over when you return." },
  { q: "How does Visionary use my information?", a: "Your information is used only to make your learning better. Visionary is designed with privacy, security, and transparency at the heart of the experience — your data is never sold." },
  { q: "Can I use Visionary in my own language?", a: "Yes. You can ask, learn, and practice in 20+ languages. Visionary keeps the meaning, the context, and your journey connected even as your language changes." },
  { q: "Is Visionary suitable for children?", a: "Yes. Visionary is built responsibly — safe to grow with, from the first question to what's next, with age-appropriate guidance and strong protections for young learners." },
];

/* ═══════════════════════ SECTION VIEWS ═══════════════════════ */

/* 01 · HERO */
const LANDING_HERO_PEOPLE = [
  {
    role: "Student",
    src: studentImage,
    alt: "Student",
  },
  {
    role: "Teacher",
    src: teacherImage,
    alt: "Teacher",
  },
  {
    role: "Parent",
    src: parentImage,
    alt: "Parent",
  },
  {
    role: "Professional",
    src: professionalImage,
    alt: "Professional",
  },
  {
    role: "Organization",
    src: organizationImage,
    alt: "Organization leader",
  },
];

const LANDING_HERO_MS = 4200;

const LandingHeroSection = React.memo(function LandingHeroSection() {
  const { index } = useCycleIndex(
    LANDING_HERO_PEOPLE.length,
    LANDING_HERO_MS
  );

  const activePerson = LANDING_HERO_PEOPLE[index];

  // Same display treatment as category pages for consistency
  const display = "block whitespace-nowrap font-medium tracking-[0] leading-[1] text-[#121317] text-[clamp(34px,9.57vw,168px)] sm:text-[clamp(40px,9.57vw,168px)]";

  return (
    <section
      data-section="01-hero"
      className="
        relative
        overflow-hidden
        bg-white
      "
      style={{
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        className="
          relative
          mx-auto
          flex
          min-h-[calc(100svh-64px)]
          w-full
          max-w-[1400px]
          flex-col
          items-center
          px-6
          pb-24
          pt-28
          text-center
          sm:px-8
          sm:pt-32
          lg:pt-36
        "
      >

        {/* =========================================================
            HUMAN VISUAL
            The changing face is the visual meaning of "you"
        ========================================================= */}

        <div
          className="
            relative
            mt-12
            flex
            h-[230px]
            w-[230px]
            items-center
            justify-center
            sm:mt-14
            sm:h-[260px]
            sm:w-[260px]
            lg:mt-16
            lg:h-[300px]
            lg:w-[300px]
          "
        >
          {/* Main circular face */}
          <div
            className="
              relative
              z-10
              h-full
              w-full
              overflow-hidden
              rounded-full
              border
              border-[#dadce0]
              bg-[#F8F9FA]
            "
          >
            <img
              key={activePerson.src}
              src={activePerson.src}
              alt={activePerson.alt}
              loading="eager"
              decoding="async"
              className="
                hero-fade-up
                block
                h-full
                w-full
                object-cover
              "
              style={{
                animationDuration: "0.9s",
                animationTimingFunction:
                  "cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>

          {/* Small surrounding visual circles */}
          <span
            aria-hidden="true"
            className="
              absolute
              -left-6
              top-[24%]
              h-10
              w-10
              rounded-full
              border
              border-[#dadce0]
              bg-white
            "
          />

          <span
            aria-hidden="true"
            className="
              absolute
              -right-8
              top-[18%]
              h-14
              w-14
              rounded-full
              border
              border-[#dadce0]
              bg-white
            "
          />

          <span
            aria-hidden="true"
            className="
              absolute
              -right-5
              bottom-[18%]
              h-8
              w-8
              rounded-full
            "
            style={{
              backgroundColor: COLORS.blue,
            }}
          />

          <span
            aria-hidden="true"
            className="
              absolute
              -left-2
              bottom-[8%]
              h-5
              w-5
              rounded-full
            "
            style={{
              backgroundColor: "#FBBC04",
            }}
          />

          {/* Quiet pointer */}
          <svg
            viewBox="0 0 170 90"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-[74px]
              -top-[38px]
              h-[54px]
              w-[108px]
            "
            style={{
              color: COLORS.ink,
            }}
          >
            <path d="M160 8 C126 12, 80 28, 36 66" />
            <path d="M36 66 l5 -13" />
            <path d="M36 66 l13 -4" />
          </svg>
        </div>

        {/* =========================================================
            UNIVERSAL HEADLINE
            Same treatment as category pages for consistency
        ========================================================= */}

        <h1
          className="
            hero-fade-up
            mt-14
          "
          style={{
            animationDelay: "80ms",
          }}
        >
          <span aria-hidden="true" className={display}>
            One Intelligence.
          </span>
          
          <span className="sr-only">One Intelligence. Built around you.</span>
        </h1>

        {/* =========================================================
            SUPPORTING COPY
        ========================================================= */}

        <p
          className="
            hero-fade-up
            mx-auto
            mt-10
            max-w-[760px]
            font-normal
            tracking-[0]
            leading-[25px]
            text-[17.5px]
          "
          style={{
            color: COLORS.slate,
            animationDelay: "200ms",
          }}
        >
          Visionary understands what you're trying to do, adapts to how you
          work, and carries useful context forward — across learning,
          teaching, supporting, building and leading.
        </p>

        {/* =========================================================
            CTA
        ========================================================= */}

        <div
          className="
            hero-fade-up
            mt-10
            flex
            flex-wrap
            items-center
            justify-center
            gap-4
          "
          style={{
            animationDelay: "280ms",
          }}
        >
          <Link
            to="/register"
            className="
              inline-flex
              h-12
              items-center
              justify-center
              gap-2
              rounded-full
              bg-[#121317]
              px-8
              text-[15px]
              font-medium
              tracking-[0]
              text-white
              transition-transform
              duration-200
              hover:scale-[1.01]
              active:scale-[0.98]
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#4285F4]
              focus-visible:ring-offset-2
            "
          >
            Start free

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>

          <Link
            to="/how-it-works"
            className="
              inline-flex
              h-12
              items-center
              justify-center
              rounded-full
              border
              border-[#dadce0]
              bg-white
              px-8
              text-[15px]
              font-normal
              tracking-[0]
              text-[#4285F4]
              transition-colors
              duration-200
              hover:bg-[#F8F9FA]
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#4285F4]
              focus-visible:ring-offset-2
            "
          >
            See how it works
          </Link>
        </div>
      </div>

      {/* Quiet transition into the next story */}
      <div
        aria-hidden="true"
        className="
          mx-auto
          h-px
          w-[88%]
          max-w-[1420px]
          bg-[#121317]/[0.08]
        "
      />
    </section>
  );
});

/* 02 · PROBLEM */
function LandingProblemSection() {
  const { index, goTo } = useCycleIndex(PROBLEM_SLIDES.length, PROBLEM_MS);
  const { ref, visible } = useRevealContinuous();
  const slide = PROBLEM_SLIDES[index];
  return (
    <section ref={ref} data-section="02-problem" className="relative overflow-hidden bg-white py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto grid w-full max-w-[1756px] grid-cols-1 items-center gap-14 px-6 lg:grid-cols-12 lg:gap-10 lg:px-0">
          <div className="lg:col-span-5 lg:pl-[6.5%]">
            <p className="font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.slate }}>Why it needs to exist</p>
            <h2 key={`h-${index}`} className="hero-fade-up mt-6 max-w-[460px] font-medium tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>
              {slide.black} <span style={{ color: COLORS.blue }}>{slide.blue}</span>.
            </h2>
          </div>
          <div className="lg:col-span-7 lg:pr-[6%]">
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
          className={`flex h-full flex-1 items-center justify-center rounded-[90px] text-[12px] sm:text-[14px] tracking-[0.24px] transition-colors ${active === i ? "font-medium" : "font-normal hover:bg-[#f8f9fa]"}`}
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
          <p className="text-center font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.slate }}>Meet Visionary</p>
          <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
            It <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{MEET_WORDS[wordIndex]}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
            Visionary continues your journey instead of restarting it. Whether you're learning, teaching, supporting, building, or leading, every interaction grows from what you already know and where you're going next.
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

/* 05 · ONE INTELLIGENCE */
function LandingOneIntelligenceSection() {
  const { ref, visible } = useRevealOnce();
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setPhase((p) => (p + 1) % 5), OI_PHASE_MS[phase]);
    return () => clearTimeout(id);
  }, [phase]);
  const finale = phase === 4;
  const state = OI_STATES[Math.min(phase, 3)];
  return (
    <section ref={ref} data-section="05-one-intelligence" className="relative overflow-hidden bg-white py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <style>{"@keyframes oiSpin{to{transform:rotate(360deg)}}@keyframes oiFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}"}</style>
      <div className={`px-6 transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Every tomorrow</p>
        <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.08] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          What you <span style={{ color: COLORS.blue }}>understand</span> today
          <br className="hidden md:block" /> make tomorrow easier.
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0.27px] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
          Every lesson, conversation, project, and breakthrough becomes part of what comes next.
        </p>
 <div className="relative mx-auto mt-32 h-[min(440px,88vw)] w-[min(440px,88vw)] sm:h-[540px] sm:w-[540px] lg:h-[640px] lg:w-[640px]">          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" style={{ animation: "oiSpin 60s linear infinite" }} aria-hidden="true">
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
                  <h3 className="mt-5 font-medium tracking-[0] leading-[1.15] text-[clamp(20px,2.4vw,30px)]" style={{ color: COLORS.ink }}>One Intelligence, Always stay with you.</h3>
                </>
              ) : (
                <>
                  <span className="rounded-full px-4 py-1 font-normal uppercase tracking-[0.43px] text-[10px]" style={{ backgroundColor: COLORS.chipBg, color: COLORS.ink }}>{state.label}</span>
                  <h3 className="mt-5 font-medium tracking-[0] leading-[1.2] text-[clamp(22px,2.6vw,34px)]" style={{ color: COLORS.ink }}>{state.heading}</h3>
                  <p className="mt-4 font-normal tracking-[0.24px] leading-[1.5] text-[14px]" style={{ color: COLORS.slate }}>{state.body}</p>
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
        <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.08] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>You won't stay the same.<br />Neither should your intelligence.</h2>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0.27px] leading-[1.6] text-[16px]" style={{ color: COLORS.slate }}>
          New questions. New goals. New challenges. New possibilities. What you need today shouldn't limit what you can become tomorrow.
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
          Built For Who You Are. Ready For <span style={{ color: COLORS.blue }}>Who You Become.</span>
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
          className={`rounded-full px-5 py-2 font-normal uppercase tracking-[0] leading-[14px] text-[10px] transition-colors ${active === lang.code ? "" : "border hover:bg-[#121317]/5"}`}
          style={{ backgroundColor: active === lang.code ? COLORS.chipBg : "transparent", color: COLORS.ink, borderColor: active === lang.code ? "transparent" : `${COLORS.ink}40` }}>
          {lang.label}
        </button>
      ))}
      <span className="font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.ink }}>+20 languages</span>
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
    <section ref={ref} data-section="07-language" className="relative overflow-hidden bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <style>{"@keyframes voiceDot{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}"}</style>
      <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Every language</p>
        <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Every language.<br /><span style={{ color: COLORS.blue }}>One understanding.</span></h2>
        <p className="mx-auto mt-6 max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
          Learning, teaching, asking, practicing, and building feel different when they happen in the language that comes naturally to you. Visionary understands what you mean — not just the words you use.
        </p>
        <div className="mt-14 lg:mt-20"><LGLanguageChips active={lang} onSelect={setLang} /></div>
        <div className="mx-auto mt-16 w-full max-w-[860px] lg:mt-24">
          <div className="flex items-end justify-center gap-2" aria-hidden="true">
            {["#4285F4", "#4285F4", "#4285F4", "#4285F4"].map((c, i) => (
              <span key={c} className="h-8 w-1.5 rounded-full" style={{ backgroundColor: c, transformOrigin: "center", animation: `voiceDot 1.2s ease-in-out ${i * 0.15}s infinite` }} />
            ))}
          </div>
          <p aria-live="polite" className="mx-auto mt-8 max-w-[760px] text-center font-normal tracking-[0] leading-[1.25] text-[clamp(26px,3.4vw,48px)]" style={{ color: COLORS.blue }}>
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
    <div className="elevation-1 relative w-full max-w-[780px] overflow-hidden rounded-[32px] border bg-white" style={{ borderColor: `${COLORS.ink}1A` }}>
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
        <p className="px-6 text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Our trust</p>
        <h2 className="mt-4 px-6 text-center font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Your <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{LX_TRUST_WORDS[wordIndex]}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] px-6 text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
          Your learning, conversations, ideas, and progress are personal. Visionary is designed with privacy, security, and transparency at the heart of the experience.
        </p>
        <div className="mx-auto mt-24 grid w-full max-w-[1600px] grid-cols-1 items-start gap-16 px-6 lg:mt-32 lg:grid-cols-[4fr_8fr] lg:gap-24 lg:px-0">
          <div className="lg:pl-[6.5%]">
            <h3 key={activeCard.title} className="hero-fade-up max-w-[460px] font-medium tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>{activeCard.title}</h3>
            <div className="mt-12 flex gap-4">
              <button type="button" aria-label="Previous trust card" onClick={() => stepCards(-1)} className="flex h-12 w-12 items-center justify-center rounded-full border bg-white transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}><ChevronIcon direction="left" /></button>
              <button type="button" aria-label="Next trust card" onClick={() => stepCards(1)} className="flex h-12 w-12 items-center justify-center rounded-full border bg-white transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}><ChevronIcon direction="right" /></button>
            </div>
          </div>
          <div className="flex flex-col gap-8 2xl:grid 2xl:grid-cols-2 2xl:gap-10 lg:pr-[6%]">
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
    <section ref={ref} data-section="09-cta" className="relative px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY, backgroundColor: COLORS.white }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <p className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>Start when you are</p>
        <h2 className="mt-4 font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Your next step starts here.</h2>
        <p className="mx-auto mt-6 max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.slate }}>
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
        <p className="font-normal uppercase tracking-[0] leading-[14px] text-[10px]" style={{ color: COLORS.slate }}>{category.chip}</p>
        <p className="mt-3 font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.ink }}>{category.copy}</p>
        <span className="mt-4 font-normal tracking-[0] leading-[22px] text-[16px]" style={{ color: COLORS.blue }}>Explore more</span>
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
          <h2 className="font-normal tracking-[0] leading-[1.08] text-[clamp(28px,2.78vw,40px)]" style={{ color: COLORS.ink }}>Explore more categories</h2>
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
function FQChevron({ open, className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`${className} transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

function LandingFAQSection() {
  const { ref, visible } = useRevealOnce();
  const [open, setOpen] = useState(0);
  const toggle = useCallback((i) => { setOpen((cur) => (cur === i ? (i === 0 ? 1 : i - 1) : i)); }, []);
  return (
    <section ref={ref} data-section="11-faq" className="relative overflow-hidden bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.slate }}>FAQ</p>
        <h2 className="mx-auto mt-4 max-w-[1100px] text-center font-medium tracking-[0] leading-[1.08] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Find answers to common questions about Visionary</h2>
        <div className="mx-auto mt-24 w-full max-w-[1400px]">
          {FAQ_ITEMS.map((item, i) => (
            <div key={item.q} className="border-b py-10 lg:py-12" style={{ borderColor: COLORS.line }}>
              <button type="button" aria-expanded={open === i} onClick={() => toggle(i)} className="flex w-full items-center justify-between gap-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-[8px]">
                <span className="font-normal tracking-[0] leading-[1.15] text-[clamp(22px,2.4vw,34px)]" style={{ color: COLORS.ink }}>{item.q}</span>
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16" style={{ backgroundColor: COLORS.circle, color: COLORS.ink }}>
                  <FQChevron open={open === i} />
                </span>
              </button>
              <div className={`grid transition-all duration-500 ease-google ${open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <p className="max-w-[1240px] pt-8 font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.ink }}>{item.a}</p>
                </div>
              </div>
            </div>
          ))}
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