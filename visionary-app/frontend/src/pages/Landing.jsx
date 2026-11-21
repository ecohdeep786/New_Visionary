import React, { lazy, Suspense } from "react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/NewPersona";
import LazyImage from "@/components/landing/LazyImage";
/* The premium sections sit below the fold on every route that uses them;
 * they load on demand (Suspense fallback null) so the entry graph carries
 * only hero-first-commit content (T13 eager law). Direct module paths, not
 * the barrel, so a section chunk never pulls its siblings. */
const PremiumIntelligenceSection = lazy(() => import("@/components/landing/persona/premium/PremiumIntelligenceSection.jsx"));
const PremiumTrustSection = lazy(() => import("@/components/landing/persona/premium/PremiumTrustSection.jsx"));
const PremiumCTASection = lazy(() => import("@/components/landing/persona/premium/PremiumCTASection.jsx"));
const PremiumExploreSection = lazy(() => import("@/components/landing/persona/premium/PremiumExploreSection.jsx"));
// Hero images (above the fold) — loaded eagerly with high fetch priority
import studentmeet from "@/assets/student-hero-main-1600w.webp";
import teachermeet from "@/assets/teacher-hero-main-1600w.webp";
import parentmeet from "@/assets/parent-hero-main-1600w.webp";
import promeet from "@/assets/pro-face-main-1600w.webp";
import orgmeet from "@/assets/org-face-main-1600w.webp";
// Problem section images — loaded lazily (below the fold)
import problemunderstanding from "@/assets/problem-understanding.webp";
import proProblem from "@/assets/professional-problem-2.webp";
import { Accessibility, ChevronLeft, ChevronRight, HeartHandshake, Lock, ShieldCheck } from "lucide-react";

/* One source of truth: every color resolves from system/tokens.js (the
   measured Apple-neutral system, see APPLE_MEASURED_REFERENCE_2026-10-21.md).
   The measured primitives (reveal, progress dots, CTA pair) live beside it in
   system/ui.jsx and system/hooks.js — the landing consumes the system rather
   than re-declaring it. */
import { color as BRAND } from "@/components/landing/system/tokens";
import { Reveal } from "@/components/landing/system/ui";
import { useCycleIndex, useRevealContinuous } from "@/components/landing/system/hooks";
import { useAuth } from "@/lib/AuthContext";

/* ═══════════════════════ SHARED VIEWS ═══════════════════════ */
/* Every landing reveal rides Apple’s resolve-out curve
   cubic-bezier(0.16,1,0.3,1) — the deceleration you feel on apple.com’s
   own scroll reveals (the --ease-out-apple token in premium.css). */
const EASE_APPLE = "ease-apple";

/* ═══════════════════════ MODELS ═══════════════════════ */
const PROBLEM_SLIDES = [
  {
    black: "Knowing an idea is a start.",
    blue: "Using it takes practice",
    persona: "Illustrative student moment",
    title: "A new problem can still feel unfamiliar.",
    copy: "An explanation can clarify an idea. Trying it yourself can show where more practice may help.",
    image: problemunderstanding,
    alt: "Student reviewing a study problem",
  },
  {
    black: "Finishing a course is one step.",
    blue: "Applying it is another",
    persona: "Illustrative professional moment",
    title: "The next challenge is putting knowledge to work.",
    copy: "A work task or small project can make a new skill concrete.",
    image: proProblem,
    alt: "Professional writing beside a laptop",
  },
];

/* The five journeys — the landing’s category router. Rendered with the
   accepted line-up module (white cards on the grey ground): the studio
   portrait shows WHOLE on its square field, the same anatomy every persona
   page closes with — one card system across the entire product. */
const ROUTER_IMAGES = [studentmeet, teachermeet, parentmeet, promeet, orgmeet];

const ROUTER_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "Learn, practice, and build from what you understand.", alt: "Student studying with books" },
  { slug: "teacher", chip: "Teacher", copy: "Explore learning for teaching and classwork.", alt: "Teacher presenting at a whiteboard" },
  { slug: "parent", chip: "Parent / Guardian", copy: "Understand the learner journey and its boundaries.", alt: "Parent helping a child with homework" },
  { slug: "professional", chip: "Professional", copy: "Connect learning to work and projects.", alt: "Professional writing notes beside a laptop" },
  { slug: "organization", chip: "Organization", copy: "Explore learning paths for teams and institutions.", alt: "Leader reviewing team progress on a tablet" },
];



/* The shared landing story: understand an idea, practise it, then use it. */
const INTELLIGENCE_STEPS = [
  { title: "Understand", copy: "Start with an explanation in a language that feels familiar." },
  { title: "Practice", copy: "Try an idea for yourself, step by step." },
  { title: "Build", copy: "Use what you understand in a project or practical task." },
];

/* Four links to published trust information, not product capability claims. */
const LX_TRUST_VALUES = [
  { title: "Privacy", copy: "Read Visionary’s current privacy information and the choices it describes.", Icon: Lock, to: "/privacy" },
  { title: "Safety", copy: "Explore the safety information published for Visionary.", Icon: HeartHandshake, to: "/safety" },
  { title: "Security", copy: "Read the security information published for Visionary.", Icon: ShieldCheck, to: "/security" },
  { title: "Accessibility", copy: "Explore Visionary’s current accessibility information.", Icon: Accessibility, to: "/accessibility" },
];

/* ═══════════════════════ SECTION VIEWS ═══════════════════════ */

/* 01 · HERO — the universal front door, on the one hero law: the static
   "One Intelligence." headline, the promise, the CTA pair, and the five
   personas as alpha cutouts rising from the fold. The section pins to the
   viewport (sticky, in NewPersona’s cast branch) so the story can glide
   over it on frosted glass — the Vision Pro page anatomy. */

/* The family, as alpha cutouts on the page’s own white (the persona hero
   photography with the studio background removed) — so the landing stages
   them as one unbroken lineup, the way Apple stages a product family.
   D3 image law: each tier ships an AVIF sibling at identical pixels
   (generated by scripts/build-image-derivatives.mjs); NewPersona stages
   them through <picture> with the WebP sizeset as the fallback. */
import proCut480 from "@/assets/hero-cutouts/professional-480w.webp";
import proCut800 from "@/assets/hero-cutouts/professional-800w.webp";
import teacherCut480 from "@/assets/hero-cutouts/teacher-480w.webp";
import teacherCut800 from "@/assets/hero-cutouts/teacher-800w.webp";
import studentCut480 from "@/assets/hero-cutouts/student-480w.webp";
import studentCut800 from "@/assets/hero-cutouts/student-800w.webp";
import parentCut480 from "@/assets/hero-cutouts/parent-480w.webp";
import parentCut800 from "@/assets/hero-cutouts/parent-800w.webp";
import orgCut480 from "@/assets/hero-cutouts/organization-480w.webp";
import orgCut800 from "@/assets/hero-cutouts/organization-800w.webp";
/* AVIF siblings — same grids, ~42% smaller wire (see the D3 receipt). */
import proCut480Avif from "@/assets/hero-cutouts/professional-480w.avif";
import proCut800Avif from "@/assets/hero-cutouts/professional-800w.avif";
import teacherCut480Avif from "@/assets/hero-cutouts/teacher-480w.avif";
import teacherCut800Avif from "@/assets/hero-cutouts/teacher-800w.avif";
import studentCut480Avif from "@/assets/hero-cutouts/student-480w.avif";
import studentCut800Avif from "@/assets/hero-cutouts/student-800w.avif";
import parentCut480Avif from "@/assets/hero-cutouts/parent-480w.avif";
import parentCut800Avif from "@/assets/hero-cutouts/parent-800w.avif";
import orgCut480Avif from "@/assets/hero-cutouts/organization-480w.avif";
import orgCut800Avif from "@/assets/hero-cutouts/organization-800w.avif";
import { fontStack } from "@/components/landing/system/tokens";

/* LCP preload — the cast’s largest slot (the student cutout) is the
   landing’s LCP element, but its URL lives inside this module, so the
   browser cannot discover it before module eval + render. Under the lab
   throttle the request then queued behind its four siblings, the auth
   probe and the favicon (~600ms of queueing for a 15KB file). Preloading
   at module scope starts the fetch one commit earlier. The srcset/sizes
   mirror the cast <img>'s AVIF source exactly, so the preload is reused,
   not re-fetched. Gated to the landing path: this module evaluates with
   the entry chunk on every route, and the preload is only true on "/". */
if (typeof window !== "undefined" && window.location.pathname === "/") {
  const lcpPreload = document.createElement("link");
  lcpPreload.setAttribute("rel", "preload");
  lcpPreload.setAttribute("as", "image");
  /* setAttribute, not the IDL property: this Chromium build does not reflect
     imagesrcset/imagesizes assignments onto the DOM attributes, and an
     attribute-less preload is inert (the same quirk PageMeta’s upsertPreload
     works around). type="image/avif" byte-matches the cast <source>, so the
     preload is reused by the <picture> instead of fighting the fallback. */
  lcpPreload.setAttribute("imagesrcset", `${studentCut480Avif} 480w, ${studentCut800Avif} 800w`);
  lcpPreload.setAttribute("imagesizes", "(max-width: 639px) 44vw, (max-width: 1023px) 30vw, 24vw");
  lcpPreload.setAttribute("type", "image/avif");
  document.head.appendChild(lcpPreload);
}

/* The shared hero states the learning promise without cycling through roles;
   the five audience links remain directly available. */
const LANDING_HERO_WORDS = ["Learning that"];

/* The audience rail under the hero actions — one door per persona on the
   first screen. Order matches HERO_CATEGORY_WORDS one-to-one, so hovering
   a label previews exactly the line it names. Labels are the footer’s
   existing audience names. */
const LANDING_AUDIENCE_LINKS = [
  { label: "Students", to: "/student" },
  { label: "Teachers", to: "/teacher" },
  { label: "Parents and guardians", to: "/parent" },
  { label: "Professionals", to: "/professional" },
  { label: "Organizations", to: "/organization" },
];

const cutSet = (w480, w800) => `${w480} 480w, ${w800} 800w`;
/* avifSet mirrors cutSet for the same-pixel AVIF siblings; the <picture>
   source in NewPersona carries type="image/avif" so the browser only
   downloads it when it actually supports the codec. */
const LANDING_HERO_LINEUP = [
  { label: "Professional", src: proCut800, srcSet: cutSet(proCut480, proCut800), avifSrcSet: cutSet(proCut480Avif, proCut800Avif) },
  { label: "Teacher", src: teacherCut800, srcSet: cutSet(teacherCut480, teacherCut800), avifSrcSet: cutSet(teacherCut480Avif, teacherCut800Avif) },
  { label: "Student", src: studentCut800, srcSet: cutSet(studentCut480, studentCut800), avifSrcSet: cutSet(studentCut480Avif, studentCut800Avif) },
  { label: "Parent", src: parentCut800, srcSet: cutSet(parentCut480, parentCut800), avifSrcSet: cutSet(parentCut480Avif, parentCut800Avif) },
  { label: "Organization", src: orgCut800, srcSet: cutSet(orgCut480, orgCut800), avifSrcSet: cutSet(orgCut480Avif, orgCut800Avif) },
];

/* HERO — one clear promise, a plain-language explanation, five audience
   links, and auth-aware next actions. */
const LandingHeroSection = React.memo(function LandingHeroSection() {
  const { authChecked, isAuthenticated } = useAuth();
  const signedIn = authChecked && isAuthenticated;

  return (
    <PersonaHero
      words={LANDING_HERO_WORDS}
      staticHeadline="grows with you."
      srSentence="Learning that grows with you. Learn in a language that feels familiar, practice ideas, and build from what you understand."
      sub="Visionary brings learning, practice, and project-building together in one connected journey."
      wordMs={2600}
      /* A single sentence underneath the headline explains the learning
         journey before the visitor chooses an audience path. */
      cast={LANDING_HERO_LINEUP}
      audienceLinks={LANDING_AUDIENCE_LINKS}
      ctaTo={signedIn ? "/dashboard/home" : "/register"}
      ctaLabel={signedIn ? "Open Visionary" : "Start learning"}
      secondaryLabel="See how it works"
    />
  );
});

/* THE LEARNING GAP — concrete, illustrative moments instead of
   unattributed testimonial copy. Visitors can move between examples manually. */
function LandingProblemSection() {
  const { index, goTo } = useCycleIndex(PROBLEM_SLIDES.length, 0);
  const { ref, visible } = useRevealContinuous();
  const slide = PROBLEM_SLIDES[index];
  return (
    <section ref={ref} data-section="02-problem" className="relative z-10 overflow-hidden bg-[#f5f5f7]" style={{ fontFamily: fontStack }}>
      <Reveal visible={visible}>
        <p className="sr-only">Stories from a student and a professional about the moment understanding breaks down.</p>
        <div className="mx-auto w-full max-w-[1265px] px-6 lg:px-[80px]">
          <p className="text-[17px] font-medium" style={{ color: BRAND.graphite }}>Why Visionary exists</p>
          {/* the two lines break at the sentence — the claim, then the turn in
              the accent voice — never mid-sentence the way text-balance broke
              it ("Accessing knowledge / is easy. …") */}
          <h2 key={`h-${index}`} data-type="section" className="hero-fade-up mt-[var(--gap-eyebrow-title-display)] font-semibold" style={{ color: BRAND.ink }}>
            <span className="block">{slide.black}</span>
            <span className="block"><span className="accent-gradient">{slide.blue}</span>.</span>
          </h2>
        </div>
        <figure className="m-0">
          <div className="mx-auto w-full max-w-[1265px] px-6 lg:px-[80px]">
            {/* the story card — one white object on the grey ground: the
                subject bleeds on the card’s left field, the voice sits on the
                right panel. The card is the chapter’s one story unit, so the
                statement / image / text never stack as separate blocks. */}
            <div className="mt-[clamp(28px,4vw,56px)] overflow-hidden rounded-[1.75rem] bg-white">
              <div className="grid grid-cols-1 items-stretch min-[1069px]:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <div className="relative h-[clamp(280px,58vw,340px)] overflow-hidden sm:h-[clamp(320px,34vw,440px)] min-[1069px]:h-auto min-[1069px]:min-h-[440px]">
                  {PROBLEM_SLIDES.map((s, i) => (
                    <LazyImage
                      key={s.alt}
                      src={s.image}
                      alt={i === index ? s.alt : ""}
                      aria-hidden={i !== index}
                      eager={i === index}
                      placeholderBg="transparent"
                      decoding="async"
                      draggable="false"
                      style={{
                        /* the studio photos' subjects touch their canvas edges;
                           unframed, those cuts would read as hard lines — dissolve
                           them into the card’s own white (the hero’s floor recipe).
                           The img element is sized to the painted square (h-full
                           w-auto, centered) so the mask tracks the photo, not the
                           column. */
                        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 7%, black 78%, transparent 97%)",
                        WebkitMaskComposite: "source-in",
                        maskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 7%, black 78%, transparent 97%)",
                        maskComposite: "intersect",
                      }}
                      className={`absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 select-none transition-opacity duration-700 ${EASE_APPLE} motion-reduce:transition-none ${i === index ? "opacity-100" : "opacity-0"}`}
                    />
                  ))}
                </div>
                {/* The label identifies an illustrative scenario; the title
                    states the situation without presenting invented testimony. */}
                <figcaption key={`q-${index}`} aria-live="polite" className="hero-fade-up flex flex-col justify-center px-6 py-8 [animation-delay:80ms] [animation-fill-mode:both] sm:px-10 sm:py-10 min-[1069px]:px-12 min-[1069px]:py-12">
                  <p className="text-[14px] font-semibold" style={{ color: BRAND.graphite }}>{slide.persona}</p>
                  <h3 data-type="editorial-lead" className="mt-4 text-balance" style={{ color: BRAND.ink, maxWidth: "24ch" }}>{slide.title}</h3>
                  <p className="mt-4 max-w-[38ch] text-[16px] leading-[1.5]" style={{ color: BRAND.slate }}>{slide.copy}</p>
                </figcaption>
              </div>
            </div>
            {/* Apple's gallery control row — manual prev/next chevrons at the
                card row's bottom-right (/education "Real stories." grammar):
                the reader paces the story; nothing auto-advances. Bounds
                disable, exactly like the journeys gallery's controls. */}
            <div className="mt-6 flex items-center justify-end gap-5">
              <button
                type="button"
                aria-label="Previous example"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                className="flex h-11 w-11 items-center justify-center rounded-full border transition-[opacity,transform] duration-200 hover:opacity-100 disabled:opacity-30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                style={{ borderColor: `${BRAND.ink}33`, color: `${BRAND.ink}99` }}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next example"
                onClick={() => goTo(index + 1)}
                disabled={index === PROBLEM_SLIDES.length - 1}
                className="flex h-11 w-11 items-center justify-center rounded-full border transition-[opacity,transform] duration-200 hover:opacity-100 disabled:opacity-30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                style={{ borderColor: `${BRAND.ink}33`, color: `${BRAND.ink}99` }}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </figure>
      </Reveal>
    </section>
  );
}

/* 03 · THE LEARNING JOURNEY — a visible bridge from familiar-language
   understanding to practice and project work. */
function LandingIntelligenceSection() {
  return (
    <Suspense fallback={null}><PremiumIntelligenceSection
      steps={INTELLIGENCE_STEPS}
      promoHeading="From understanding to building."
      sub="Visionary connects learning in a familiar language with practice and project work."
      promo
      ctaLabel="See how it works"
      ctaTo="/how-it-works"
    /></Suspense>
  );
}

/* 13 · THE ROUTER — the five journeys, as one line-up. The landing’s
   category chapter renders with the accepted explore module verbatim (white
   cards on the #f5f5f7 ground, the studio portrait whole on its square
   field, the quiet blue link) — the same card system every persona page
   closes with, so the product reads as one family. On the landing the
   module is the front door’s fork: after the product promo, opening the
   grey catalogue expanse that the suite below continues. The surface
   carries the join — Apple’s no-seam law.
   The landing opts the header into the measured card-chapter tiers: the
   statement at Education’s "Real stories. Real impact." size (48/40/32) and
   the intro at the editorial-body tier — the persona line-ups keep their
   accepted gallery header. */
function LandingRouterSection() {
  return (
    <Suspense fallback={null}><PremiumExploreSection
      eyebrow="Who it’s for"
      heading={<>One learning journey. <span className="accent-gradient">Five paths to begin.</span></>}
      sub="Choose the path that fits your role. Each link opens its own Visionary page."
      headingRole="section"
      subRole="editorial-body"
      sectionId="who-its-for"
      presentation="directory"
      categories={ROUTER_CATEGORIES}
      images={ROUTER_IMAGES}
    /></Suspense>
  );
}




/* LANDING PAGE — one shared front door for five audiences. The hero names
   the learning journey; the example shows the gap between understanding and
   use; the dark chapter connects familiar-language learning with practice
   and project work; five role paths follow, then current trust information,
   an authenticated next action, and the public-site footer. */
export default function LandingPage() {
  return (
    <div className="page-landing min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main" tabIndex={-1}>
        <LandingHeroSection />
        {/* the glass sheet — the hero's cover. The stage is pinned (founder
            directive 2026-11-21: the hero stays fixed, the story scrolls);
            this frosted sheet rides over it, and its frost fades in from
            the leading edge (mask) so the sheet never slices the pinned
            headline mid-glyph: the family and copy dissolve into white the
            way the hero's own floor dissolves them. */}
        <div
          aria-hidden="true"
          className="glass relative z-10 h-[clamp(200px,30svh,340px)] border-b border-[#1d1d1f]/10"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 62%)",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 62%)",
          }}
        />
        {/* Move from the illustrative learning gap to the connected journey,
            then open the five role-specific paths. */}
        <LandingProblemSection />
        <LandingIntelligenceSection />
        <LandingRouterSection />
        <Suspense fallback={null}><PremiumTrustSection
          heading={<>Clarity matters, <span className="accent-gradient">from the start.</span></>}
          sub="Read Visionary’s current information on privacy, safety, security, and accessibility."
          values={LX_TRUST_VALUES}
        /></Suspense>
        <Suspense fallback={null}><PremiumCTASection
          variant="closing"
          heading="Choose your next step."
          sub="Explore the path that fits your role, or see how learning connects to practice and building."
        /></Suspense>
      </main>
      {/* quiet variant: Apple’s footer ends the page in air — no giant
          wordmark — the story itself is the signature */}
      <LandingFooter variant="quiet" />
    </div>
  );
}