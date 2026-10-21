import React, { useCallback, useState } from "react";
import { Lock, ShieldCheck, HeartHandshake } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import orgHero from "@/assets/org-face-main-2400w.webp";
import orgHeroContent from "@/assets/org-face-main-1600w.webp"; /* content-slot size (L3 07-perf carry-forward) */
import PersonaHero from "@/components/landing/NewPersona";

/* Problem Section */
import orgProblem1 from "@/assets/organization-problem-1-1600w.webp";
import orgProblem2 from "@/assets/organization-problem-2-1600w.webp";
import orgProblem3 from "@/assets/organization-problem-3-1600w.webp";
import orgProblem4 from "@/assets/organization-problem-4-1600w.webp";
import orgProblem5 from "@/assets/organization-problem-5-1600w.webp";

/* Journey Section images */
import primaryStudent from "@/assets/student-primary.webp";
import competitiveStudent from "@/assets/student-competitive.webp";
import higherStudent from "@/assets/student-higher.webp";
import proFace from "@/assets/pro-face-main-2400w.webp";

/* Achievement Section */
import orgachivenment from "@/assets/achievenment-achieve.webp";
import orgbuild from "@/assets/achivenment-build.webp";

/* Explore Category */
import studentmeet from "@/assets/student-hero-main-2400w.webp";
import teachermeet from "@/assets/teacher-face-main.webp";
import parentmeet from "@/assets/parent-face-main.webp";
import promeet from "@/assets/pro-face-main-2400w.webp";
import { useCycleIndex as UseCycleIndex, useRevealOnce as UseRevealOnce, useRevealContinuous as UseRevealContinuous } from "@/components/landing/system/hooks";
import {
  StruggleChapter,
  JourneyGallery,
  JourneyModal,
  ScrollReveal,
} from "@/components/landing/persona/PersonaSections";
import {
  PremiumIntelligenceSection,
  PremiumLanguageSection,
  PremiumAchievementSection,
  PremiumJourneyFlowSection,
  PremiumTrustSection,
  PremiumCTASection,
  PremiumExploreSection,
} from "@/components/landing/persona/PremiumPersonaSections";

import { Eye, RefreshCw, Globe2, UsersRound, BookOpen, MessageCircle, Clock, Layers3, Building2, GraduationCap, Target, Brain, TrendingUp } from "lucide-react";
import { fontStack } from "@/components/landing/system/tokens";

const EXPLORE_CAT_IMG = [studentmeet, teachermeet, parentmeet, promeet];

const EXPLORE_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Understand lessons, practise ideas, and keep your place.", alt: "Student learning with a laptop" },
  { slug: "teacher", chip: "Teacher", copy: "See who needs another explanation.", alt: "Teacher working on a laptop in a classroom" },
  { slug: "parent", chip: "Parent", copy: "See where your child needs support.", alt: "Parent helping a child at a desk" },
  { slug: "professional", chip: "Professional", copy: "Turn what you know into useful work.", alt: "Professional discussing work with a tablet" },
];

/* ── DESIGN TOKENS ── */
const COLORS = {
  ink: "#1d1d1f",
  surface: "#F5F6F8",
  blue: "#0066cc",
  grey: "#6e6e73",
  lightGrey: "#86868b",
  chipBg: "#rgba(0,102,204,0.10)",
  mist: "#d2d2d7",
  white: "#ffffff",
  cardSurface: "#EEF1F6",
  cardSurfaceAlt: "#E9EFFA",
};

/* ═══════════════════════ MODELS ═══════════════════════ */

const HERO_WORDS = ["Leading.", "to scale.", "to last."];
const HERO_WORD_MS = 2800;

const STRUGGLE_LINES = ["Every","organization","wonders","about"];

const SLIDES = [
  { word: "adoption", quote: "We rolled out three learning tools. Nobody knows if anyone is learning.", image: orgProblem1, alt: "Leader facing low tool adoption" },
  { word: "progress", quote: "Every department reports green. The outcomes still surprise us.", image: orgProblem2, alt: "Leaders reviewing conflicting progress reports" },
  { word: "gaps", quote: "We find the learning gaps at the exit interview, not in week two.", image: orgProblem3, alt: "Team discovering skill gaps too late" },
  { word: "support", quote: "Our best mentors can only be in one classroom at a time.", image: orgProblem4, alt: "Mentor stretched across many learners" },
  { word: "outcomes", quote: "We measure attendance and completion. We still can't see understanding.", image: orgProblem5, alt: "Leader measuring outcomes without insight" },
];

const JOURNEY_WORD_MS = 3000;

const JOURNEY_WORDS = ["Visionary adapts to each.", "Schools see it first", "Colleges build on it", "Coaching scales with it", "Workplaces grow from it"];

const JOURNEY_STAGES = [
  { title: "Schools", statement: "One school. One picture.", copy: "Connect students, teachers, parents, and school leaders around the same learning picture.", image: primaryStudent, alt: "School learning environment" },
  { title: "Colleges and universities", statement: "Departments connected. Outcomes visible.", copy: "Help departments, faculty, and students understand progress across programs, skills, and outcomes.", image: higherStudent, alt: "University campus learning" },
  { title: "Coaching", statement: "Scale the support. Keep it personal.", copy: "Scale personalized support across batches, mentors, learners, and parent conversations.", image: competitiveStudent, alt: "Coaching institute classroom" },
  { title: "Workplace learning", statement: "Real skills. Visible capability.", copy: "Help teams build real skills, apply learning to work, and see capability grow over time.", image: proFace, alt: "Workplace learning session" },
];

const STAGE_META = {
  "Schools": { Icon: GraduationCap },
  "Colleges and universities": { Icon: BookOpen },
  "Coaching": { Icon: Target },
  "Workplace learning": { Icon: Building2 },
};

const INTELLIGENCE_STEPS = [
  { title: "See what people understand.", copy: "Learning activity becomes a clear picture of understanding across your institution." },
  { title: "Find gaps before they spread.", copy: "Know where people are stuck before small gaps become outcomes." },
  { title: "Support every role from one system.", copy: "Every role sees what matters to them, on one shared picture." },
  { title: "Improve the next decision.", copy: "Use real learning activity to improve lessons, programs, coaching, and planning." },
];

const LANGUAGE_CHIPS = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "kn", label: "Kannada" },
  { code: "pa", label: "Punjabi" },
];

const LANGUAGE_QUESTIONS = [
  { hi: "Hamare learners kahan atak rahe hain?", en: "Where are our learners getting stuck?", bn: "আমাদের শিক্ষার্থীরা কোথায় আটকে আছে?", ta: "எங்கள் கற்பவர்கள் எங்கே சிக்கிக்கொண்டிருக்கிறார்கள்?", kn: "ನಮ್ಮ ಕಲಿಯುವವರು ಎಲ್ಲಿ ಸಿಕ್ಕಿಹಾಕಿಕೊಂಡಿದ್ದಾರೆ?", pa: "ਸਾਡੇ ਸਿੱਖਿਆਰਥੀ ਕਿੱਥੇ ਅੜਕੇ ਹੋਏ ਹਨ?" },
  { hi: "Kaun si class ko zyada support chahiye?", en: "Which class needs more support?", bn: "কোন শ্রেণির বেশি সাহায্য দরকার?", ta: "எந்த வகுப்புக்கு அதிக உதவி தேவை?", kn: "ಯಾವ ತರಗತಿಗೆ ಹೆಚ್ಚಿನ ಸಹಾಯ ಬೇಕು?", pa: "ਕਿਹੜੀ ਜਮਾਤ ਨੂੰ ਵੱਧ ਮਦਦ ਚਾਹੀਦੀ ਹੈ?" },
  { hi: "Training ka impact kahan dikh raha hai?", en: "Where is the training impact showing?", bn: "প্রশিক্ষণের প্রভাব কোথায় দেখা যাচ্ছে?", ta: "பயிற்சியின் தாக்கம் எங்கே தெரிகிறது?", kn: "ತರಬೇತಿಯ ಪ್ರಭಾವ ಎಲ್ಲಿ ಕಾಣುತ್ತಿದೆ?", pa: "ਸਿਖਲਾਈ ਦਾ ਅਸਰ ਕਿੱਥੇ ਦਿਖ ਰਿਹਾ ਹੈ?" },
];

const ACHIEVEMENT_TABS = [
  { title: "Understand what people actually know.", copy: "Move beyond completion rates and see real understanding across your organization." },
  { title: "Support the people who need it early.", copy: "Give teachers, coaches, and leaders what they need before results drop." },
  { title: "Improve every program with evidence.", copy: "Use connected learning activity to improve curriculum, training, and coaching." },
];

const ACHIEVEMENT_IMAGE = [orgHeroContent, orgachivenment, orgbuild];

const TRUST_VALUES = [
  { title: "Privacy", copy: "We design every part of Visionary so that what your people share stays personal.", Icon: Lock, to: "/privacy" },
  { title: "Safety", copy: "We keep Visionary safe to grow with — across every classroom, team, and program.", Icon: ShieldCheck, to: "/security" },
  { title: "Responsibility", copy: "We believe intelligence should help institutions act, never work against the people in them.", Icon: HeartHandshake, to: "/terms" },
];

const JOURNEY_MODALS = {
  "Schools": {
    top: "One school.", accent: "One picture.",
    intro: "Schools work best when everyone sees the same learning. Visionary connects students, teachers, parents, and leaders around one shared understanding.",
    primary: { label: "See how Visionary works", to: "/how-it-works" },
    blocks: [
      { Icon: Eye, t: "See every learner.", c: "A clear picture of understanding across classes, not just attendance.", l: "How it works", to: "/how-it-works" },
      { Icon: UsersRound, t: "Parents stay close.", c: "Progress shared in ways that help at home, not only at report time.", l: "For parents", to: "/parent" },
      { Icon: Globe2, t: "In every language.", c: "Learning and reporting in the language each family thinks in.", l: "Language support", to: "/how-it-works" },
      { Icon: MessageCircle, t: "Bring it to your school.", c: "Start with one class and grow from there.", l: "Talk to us", to: "/contact" },
    ],
  },
  "Colleges and universities": {
    top: "Departments connected.", accent: "Outcomes visible.",
    intro: "Higher education asks for depth across programs and semesters. Visionary helps faculty, departments, and students understand progress across programs, skills, and outcomes.",
    primary: { label: "See how Visionary works", to: "/how-it-works" },
    blocks: [
      { Icon: Brain, t: "Depth, not dashboards.", c: "Real understanding across coursework, projects, and semesters.", l: "How it works", to: "/how-it-works" },
      { Icon: Layers3, t: "Programs that carry forward.", c: "Foundation courses connect to program skills and career readiness.", l: "Keep the record", to: "/how-it-works" },
      { Icon: BookOpen, t: "Faculty see what matters.", c: "Signals that help teaching adjust before outcomes drop.", l: "Get support", to: "/help" },
      { Icon: Building2, t: "Support your institution.", c: "Visionary fits classrooms, labs, and departments.", l: "For organizations", to: "/organization" },
    ],
  },
  "Coaching": {
    top: "Scale the support.", accent: "Keep it personal.",
    intro: "Coaching lives on personalized attention. Visionary scales that support across batches, mentors, learners, and parent conversations.",
    primary: { label: "See how Visionary works", to: "/how-it-works" },
    blocks: [
      { Icon: Target, t: "Every batch, every learner.", c: "Know where each learner is stuck while there is still time to act.", l: "How it works", to: "/how-it-works" },
      { Icon: RefreshCw, t: "Practice with direction.", c: "Mentors see what to revise, skip, and strengthen for each learner.", l: "Start practising free", to: "/register" },
      { Icon: Clock, t: "Exam confidence.", c: "Concept gaps close before the exam, not after the result.", l: "Keep the record", to: "/how-it-works" },
      { Icon: MessageCircle, t: "Talk to us.", c: "Bring Visionary to your batches and mentors.", l: "Contact us", to: "/contact" },
    ],
  },
  "Workplace learning": {
    top: "Real skills.", accent: "Visible capability.",
    intro: "Workplace learning only matters when it changes the work. Visionary helps teams build real skills, apply learning to work, and see capability grow over time.",
    primary: { label: "See how Visionary works", to: "/how-it-works" },
    blocks: [
      { Icon: TrendingUp, t: "From training to application.", c: "See where training turns into capability, and where it stalls.", l: "How it works", to: "/how-it-works" },
      { Icon: UsersRound, t: "Managers see growth.", c: "Signals that help teams and L&D support the people who need it early.", l: "Get support", to: "/help" },
      { Icon: Layers3, t: "Skills that grow.", c: "Each program builds on what your teams already know.", l: "Keep the record", to: "/how-it-works" },
      { Icon: MessageCircle, t: "Start with one team.", c: "Pilot Visionary with one cohort and grow from there.", l: "Talk to us", to: "/contact" },
    ],
  },
};

/* ═══════════════════════ 01 · HERO ═══════════════════════ */

const OrgHeroSection = React.memo(() => (
  <PersonaHero
    words={HERO_WORDS}
    srSentence="Leading, to scale, to last."
    sub="One intelligence across every classroom, team, and program. Understanding stays inside your institution."
    img={orgHero}
    alt="A leader reviewing team progress on a tablet"
    ctaTo="/contact"
    ctaLabel="Talk to us"
  />
));

/* ═══════════════════════ 02 · STRUGGLE ═══════════════════════ */

function OrgStruggleSection() {
  const [index, setIndex] = useState(0);
  const goTo = useCallback((i) => setIndex(Math.min(SLIDES.length - 1, Math.max(0, i))), []);
  const { ref } = UseRevealContinuous();

  return (
    <section ref={ref} data-section="02-struggle" className="relative overflow-x-clip bg-white">
      {/* the bridge's compact band (02-struggle) carries the chapter breath;
          the chapter leads in on Apple's hero-scroll-linked reveal */}
      <StruggleChapter
        linked
        slides={SLIDES}
        index={index}
        goTo={goTo}
        lines={STRUGGLE_LINES}
        label="Organization learning challenges"
        kicker="What you can't see"
        copy="Learning isn't the difficulty. Seeing it is."
      />
    </section>
  );
}

/* ═══════════════════════ 04 · JOURNEY ═══════════════════════ */

function OrgJourneySection() {
  const { ref } = UseRevealOnce();
  const { index } = UseCycleIndex(JOURNEY_WORDS.length, JOURNEY_WORD_MS);
  const [openStage, setOpenStage] = useState(null);

  return (
    <section ref={ref} data-section="04-journey" className="relative isolate overflow-hidden py-24 lg:py-32 bg-white">
      <ScrollReveal>
        {/* header — Apple's card-chapter treatment: statement LEFT-aligned at
            the measured gutter, and the gallery's track carries the same
            gutter so the first card starts exactly at the heading's left
            edge — one spine. */}
        <div className="mx-auto w-full px-6 min-[735px]:max-w-[692px] min-[735px]:px-0 min-[1069px]:max-w-[980px]">
          <h2
            className="font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)] text-balance"
            style={{ color: COLORS.ink, maxWidth: "24ch" }}
          >
            <span className="block">Every organization learns differently.</span>
            <span key={index} className="hero-fade-up accent-gradient block min-h-[1.06em] [animation-duration:1s]">{JOURNEY_WORDS[index]}</span>
          </h2>
          <p
            className="mt-4 max-w-[40ch] text-balance font-normal tracking-[0] leading-[1.4] text-[18px]"
            style={{ color: COLORS.grey }}
          >
            One intelligence, shaped to the way your institution teaches, trains, and grows.
          </p>
        </div>
      </ScrollReveal>

      <JourneyGallery stages={JOURNEY_STAGES} onOpen={setOpenStage} label="Organization contexts" iconMap={STAGE_META} />
      {openStage && <JourneyModal stage={openStage} onClose={() => setOpenStage(null)} modals={JOURNEY_MODALS} stageMeta={STAGE_META} fallbackKey="Schools" secondaryLabel="Start free" />}
    </section>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function OrganizationPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main">
        <OrgHeroSection />
        <OrgStruggleSection />
        <OrgJourneySection />
        <PremiumIntelligenceSection
          steps={INTELLIGENCE_STEPS}
          sub="Every learner, teacher, and professional in one clear picture you can act on."
        />
        <PremiumLanguageSection
          chips={LANGUAGE_CHIPS}
          questions={LANGUAGE_QUESTIONS}
          line1="Your organization."
          accent="In every language"
          tail="."
          sub="People ask, learn, teach, and report in different languages. Visionary keeps the meaning connected across them."
        />
        <PremiumAchievementSection
          heading={<>See what your organization can <span className="accent-gradient">achieve.</span></>}
          tabs={ACHIEVEMENT_TABS}
          images={ACHIEVEMENT_IMAGE}
        />
        <PremiumJourneyFlowSection
          stages={JOURNEY_STAGES}
          eyebrow="Your journey"
          heading={<>Individual journeys.<br /><span className="accent-gradient">Shared intelligence.</span></>}
          sub="When the context changes, the same intelligence carries understanding forward."
        />
        <PremiumTrustSection
          heading={<>Your people's learning stays <span className="accent-gradient">yours.</span></>}
          sub="Your people's questions, conversations, and progress are personal. We keep it that way."
          values={TRUST_VALUES}
        />
        <PremiumCTASection
          heading="Bring Visionary to your organization."
          sub="Start with one class, one team, and build from there."
        />
        <PremiumExploreSection
          heading={<>Explore <span className="accent-gradient">Visionary.</span></>}
          categories={EXPLORE_CATEGORIES}
          images={EXPLORE_CAT_IMG}
        />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
