import "./landing-home.css";
import React, { lazy, Suspense, useState } from "react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { BRIDGE_EXAMPLE, PLANNING_EXAMPLE } from "@/components/landing/landingExamples";
import PersonaHero from "@/components/landing/NewPersona";
import { Link } from "react-router-dom";
import heroBotWebp from "@/assets/brand/visionary-bot.webp";
import heroBotAvif from "@/assets/brand/visionary-bot.avif";
import LazyImage from "@/components/landing/LazyImage";
/* The shared sections sit below the fold;
 * they load on demand (Suspense fallback null) so the entry graph carries
 * only hero-first-commit content (T13 eager law). Direct module paths, not
 * the barrel, so a section chunk never pulls its siblings. */

const PremiumTrustSection = lazy(() => import("@/components/landing/persona/premium/PremiumTrustSection.jsx"));
const PremiumCTASection = lazy(() => import("@/components/landing/persona/premium/PremiumCTASection.jsx"));
const PremiumExploreSection = lazy(() => import("@/components/landing/persona/premium/PremiumExploreSection.jsx"));
// These five portraits appear in the audience gallery.
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
import { useCycleIndex } from "@/components/landing/system/hooks";
import { useAuth } from "@/lib/AuthContext";

/* ═══════════════════════ SHARED VIEWS ═══════════════════════ */
/* Every landing reveal rides Apple’s resolve-out curve
   cubic-bezier(0.16,1,0.3,1) — the deceleration you feel on apple.com’s
   own scroll reveals (the --ease-out-apple token in premium.css). */
const EASE_APPLE = "ease-apple";

/* ═══════════════════════ MODELS ═══════════════════════ */
const EXAMPLES = [
  { label: "Student example", content: BRIDGE_EXAMPLE, image: problemunderstanding, alt: "Student thinking over an open book" },
  { label: "Professional example", content: PLANNING_EXAMPLE, image: proProblem, alt: "Professional working at a desk" },
];

/* The five journeys — the landing’s category router. Rendered with the
   accepted line-up module (white cards on the grey ground): the studio
   portrait shows WHOLE on its square field, the same anatomy every persona
   page closes with — one card system across the entire product. */
const ROUTER_IMAGES = [studentmeet, teachermeet, parentmeet, promeet, orgmeet];

const ROUTER_CATEGORIES = [
  { slug: "student", chip: "Student", detail: "Work through a lesson, practise a skill and try it in a project." },
  { slug: "teacher", chip: "Teacher", detail: "Organize classwork, review submissions and give feedback." },
  { slug: "parent", chip: "Parent or guardian", detail: "Follow learning through the summaries your child shares with you." },
  { slug: "professional", chip: "Professional", detail: "Set a skill goal and build a project for your portfolio." },
  { slug: "organization", chip: "Organization", detail: "Invite people to a workspace and organize learning for your team." },
];

/* Apple’s values anatomy (education-initiative: "Our values lead the way"):
   typographic columns on the shared persona pages — the type carries the
   trust. The landing’s closing chapter takes Apple’s feature-card variant
   instead (the Why-grid), so each value carries a distinct mark from the
   public icon family: Lock (your choice), HeartHandshake (human review),
   ShieldCheck (protection), Accessibility (every learner). The four values
   are the four trust pages themselves. */
const LX_TRUST_VALUES = [
  { title: "Privacy", copy: "Understand what is collected and how to manage your data.", Icon: Lock, to: "/privacy" },
  { title: "Safety", copy: "Find age guidance and ways to report a concern.", Icon: HeartHandshake, to: "/safety" },
  { title: "Security", copy: "See how account access and sign-in sessions are protected.", Icon: ShieldCheck, to: "/security" },
  { title: "Accessibility", copy: "Explore keyboard navigation, text sizing and motion settings.", Icon: Accessibility, to: "/accessibility" },
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

const LANDING_HERO_WORDS = ["From a question"];

const LANDING_AUDIENCE_LINKS = [
  { label: "Students", to: "/student" },
  { label: "Teachers", to: "/teacher" },
  { label: "Parents", to: "/parent" },
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

const LandingHeroSection = React.memo(function LandingHeroSection() {
  const { authChecked, isAuthenticated } = useAuth();
  const signedIn = authChecked && isAuthenticated;

  return (
    <PersonaHero
      words={LANDING_HERO_WORDS}
      staticHeadline="to a project."
      sub="Learn in English, Hindi or Bengali. Explore an idea, practise it and build something of your own."
      cast={LANDING_HERO_LINEUP}
      audienceLinks={LANDING_AUDIENCE_LINKS}
      ctaTo={signedIn ? "/dashboard/home" : "/register"}
      ctaLabel={signedIn ? "Open Visionary" : "Create an account"}
      secondaryTo="/#lesson-example"
      secondaryLabel="Explore an example"
    />
  );
});

function LandingExamples() {
  const { index, goTo } = useCycleIndex(EXAMPLES.length, 0);
  const [language, setLanguage] = useState("en");
  const example = EXAMPLES[index];
  const lesson = example.content[language];
  return (
    <section id="lesson-example" data-section="02-problem" aria-labelledby="example-title" className="relative z-10 scroll-mt-14 bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-[1265px] px-6 lg:px-[80px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-2 font-medium text-[#424245]">Sample lessons</p>
            <h2 id="example-title" data-type="section">Put an idea to work.</h2>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium text-[#424245]">
            Example language
            <select value={language} onChange={(event) => setLanguage(event.target.value)}
              className="min-h-11 rounded-lg border border-[#6e6e73] bg-white px-3 text-base text-[#1d1d1f] focus-visible:ring-2 focus-visible:ring-[#0066cc]">
              {Object.entries(BRIDGE_EXAMPLE).map(([code, item]) => (
                <option key={code} value={code} lang={code}>{item.language}</option>
              ))}
            </select>
          </label>
        </div>
        <figure className="m-0">
          {/* the story card — one white object on the grey ground: the
              subject bleeds on the card’s left field, the voice sits on the
              right panel. The card is the chapter’s one story unit, so the
              statement / image / text never stack as separate blocks. */}
          <div className="mt-[clamp(28px,4vw,56px)] overflow-hidden rounded-[1.75rem] bg-white">
            <div className="grid grid-cols-1 items-stretch min-[1069px]:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="relative h-[clamp(280px,58vw,340px)] overflow-hidden sm:h-[clamp(320px,34vw,440px)] min-[1069px]:h-auto min-[1069px]:min-h-[440px]">
                {EXAMPLES.map((s, i) => (
                  <LazyImage
                    key={s.alt}
                    src={s.image}
                    alt={i === index ? s.alt : ""}
                    aria-hidden={i !== index}
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
              <figcaption className="flex flex-col justify-center p-6 sm:p-10 lg:p-12" aria-live="polite" aria-atomic="true">
                <p className="mb-4 text-sm font-medium text-[#424245]">{example.label} · {index + 1} of {EXAMPLES.length}</p>
                <div lang={language} className="home-example-text">
                  <h3 data-type="editorial-card">{lesson.question}</h3>
                  <p>{lesson.explanation}</p>
                  <h4>{lesson.prompt}</h4>
                  <p>{lesson.activity}</p>
                </div>
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
              disabled={index === EXAMPLES.length - 1}
              className="flex h-11 w-11 items-center justify-center rounded-full border transition-[opacity,transform] duration-200 hover:opacity-100 disabled:opacity-30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
              style={{ borderColor: `${BRAND.ink}33`, color: `${BRAND.ink}99` }}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </figure>
      </div>
    </section>
  );
}

function LandingRouterSection() {
  return (
    <Suspense fallback={null}><PremiumExploreSection
      id="audiences"
      eyebrow="Who it’s for"
      heading="Find your place in Visionary."
      headingRole="section"
      categories={ROUTER_CATEGORIES}
      images={ROUTER_IMAGES}
    /></Suspense>
  );
}

export default function LandingPage() {
  return (
    <div className="page-landing min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main" tabIndex={-1}>
        <LandingHeroSection />
        <div aria-hidden="true" className="glass pointer-events-none relative z-10 h-12 sm:h-16"
          style={{ maskImage: "linear-gradient(transparent, black)" }} />
        <section data-section="05-intelligence" className="scene-dark home-product relative isolate overflow-hidden">
          <div className="public-editorial-frame mx-auto">
            <div className="home-product-copy">
              <h2 data-type="section">Go beyond <span className="accent-gradient-on-dark">the lesson.</span></h2>
              <div><p data-type="editorial-body">In Learn, explore a concept and test it with practice. In Build, turn what you’ve learned into a project.</p></div>
              <Link to="/how-it-works" className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white px-5 font-medium text-[#1d1d1f] focus-visible:ring-2 focus-visible:ring-[#2997ff]">
                How Visionary works <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <picture aria-hidden="true" className="home-product-mark">
            <source type="image/avif" srcSet={heroBotAvif} />
            <img src={heroBotWebp} alt="" loading="lazy" decoding="async" />
          </picture>
        </section>
        <LandingExamples />
        <LandingRouterSection />
        <Suspense fallback={null}><PremiumTrustSection
          heading={<>Your learning stays <span className="accent-gradient">yours.</span></>}
          values={LX_TRUST_VALUES}
        /></Suspense>
        <Suspense fallback={null}><PremiumCTASection
          variant="closing"
          heading="Where will you start?"
          sub="Choose a workspace for learning, teaching or building."
        /></Suspense>
      </main>
      {/* quiet variant: Apple’s footer ends the page in air — no giant
          wordmark — the story itself is the signature */}
      <LandingFooter variant="quiet" />
    </div>
  );
}
