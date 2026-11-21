import React, { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import QuietLink from "@/components/landing/QuietLink";
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
import { Accessibility, BookOpen, ChevronLeft, ChevronRight, Eye, Globe2, HeartHandshake, Layers3, Lock, ShieldCheck } from "lucide-react";

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
  { black: "Accessing knowledge is easy.", blue: "Applying it isn’t", persona: "A student", quote: "I watched eight hours of videos and still couldn’t solve a single problem on my own.", image: problemunderstanding, alt: "Student studying alone with a tablet" },
  { black: "Knowledge is everywhere.", blue: "Turning it into capability isn’t", persona: "A professional", quote: "I read every article. I still can’t turn them into the work.", image: proProblem, alt: "Professional overwhelmed by learning resources" },
];

/* The five journeys — the landing’s category router. Rendered with the
   accepted line-up module (white cards on the grey ground): the studio
   portrait shows WHOLE on its square field, the same anatomy every persona
   page closes with — one card system across the entire product. */
const ROUTER_IMAGES = [studentmeet, teachermeet, parentmeet, promeet, orgmeet];

const ROUTER_CATEGORIES = [
  { slug: "student", chip: "Student", copy: "See the idea, practise it, and use it in the next thing you build.", alt: "Student studying with books" },
  { slug: "teacher", chip: "Teacher", copy: "Plan, explain, and check understanding while the lesson is still in front of you.", alt: "Teacher presenting at a whiteboard" },
  { slug: "parent", chip: "Parent", copy: "See the progress behind the report and find a useful next step at home.", alt: "Parent helping child with homework" },
  { slug: "professional", chip: "Professional", copy: "Turn a question, project, or new skill into work you can use.", alt: "Professional writing notes beside a laptop" },
  { slug: "organization", chip: "Organization", copy: "Give teams a shared view of learning across people, projects, and time.", alt: "Leader reviewing team progress on a tablet" },
];



/* The mechanism chapter’s four beats — the umbrella voice of the loop every
   category page is built around. Verbatim from the student page’s
   INTELLIGENCE_STEPS: the front door shows the mark once, for everyone. */
const INTELLIGENCE_STEPS = [
  { title: "Understand what you’re learning.", copy: "Visionary continues from where you are, and every lesson becomes understanding." },
  { title: "See it. Hear it.\nAsk it another way.", copy: "Open today’s lesson. Visionary already understands where you are and where you’re going next." },
  { title: "Practice what you’re learning.", copy: "Every answer becomes a chance to practise, with feedback that listens and adapts at your pace." },
  { title: "Build from what you know.", copy: "Turn every lesson into real thinking, projects, and creative work that keeps growing with you." },
];

/* Apple’s values anatomy (education-initiative: "Our values lead the way"):
   typographic columns on the shared persona pages — the type carries the
   trust. The landing’s closing chapter takes Apple’s feature-card variant
   instead (the Why-grid), so each value carries a distinct mark from the
   public icon family: Lock (your choice), HeartHandshake (human review),
   ShieldCheck (protection), Accessibility (every learner). The four values
   are the four trust pages themselves. */
const LX_TRUST_VALUES = [
  { title: "Privacy", copy: "You choose what Visionary remembers and how you use it.", Icon: Lock, to: "/privacy" },
  { title: "Safety", copy: "Age-aware guidance and human review help keep learning on track.", Icon: HeartHandshake, to: "/safety" },
  { title: "Security", copy: "Secure by design, protected end to end.", Icon: ShieldCheck, to: "/security" },
  { title: "Accessibility", copy: "Help every learner learn how they learn best.", Icon: Accessibility, to: "/accessibility" },
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

/* Apple Education principle: one inclusive promise, understood at a glance.
   The promise's first word IS the cycle — the five verbs of the journeys
   below fade up in place (Learning → Teaching → Guiding → Building →
   Leading) while "that grows with you." stays put. */
const LANDING_HERO_WORDS = ["Learning that"];

/* The cycling verbs — the same five doors the rail below renders, in the
   same order, so the word and the rail move as one tab set. Hover/focus
   holds a door; the cycle never auto-advances under reduced motion. */
const HERO_AUDIENCE_WORDS = ["Learning", "Teaching", "Guiding", "Building", "Leading"];

/* The audience rail under the hero actions — one door per persona on the
   first screen. Order matches HERO_CATEGORY_WORDS one-to-one, so hovering
   a label previews exactly the line it names. Labels are the footer’s
   existing audience names. */
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

/* ── HERO ──
   Apple’s universal front door: "One intelligence" holds the stage, the
   audience line cycles beneath it, and the five alpha cutouts rise from
   the fold. The CTA pair are the only actions — the story lives below the
   line-up, exactly like an Apple education product hero. */
const LandingHeroSection = React.memo(function LandingHeroSection() {
  const { authChecked, isAuthenticated } = useAuth();
  const signedIn = authChecked && isAuthenticated;

  return (
    <PersonaHero
      words={LANDING_HERO_WORDS}
      staticHeadline="grows with you."
      srSentence="Learning that grows with you, for students, teachers, parents, professionals, and organizations."
      audienceWords={HERO_AUDIENCE_WORDS}
      wordMs={2600}
      /* No hero sub — Apple's product heroes are name + fragment ("iPhone
         Duo / Hello, hello.", measured 2026-11-21): the headline, the CTA
         pair, and the audience rail are the whole first screen. The one
         plain explanation lives in the One-intelligence chapter below,
         where the reader arrives already primed to learn what this is. */
      cast={LANDING_HERO_LINEUP}
      audienceLinks={LANDING_AUDIENCE_LINKS}
      ctaTo={signedIn ? "/dashboard/home" : "/register"}
      ctaLabel={signedIn ? "Open Visionary" : "Start learning"}
      secondaryLabel="See how it works"
    />
  );
});

/* 02 · PROBLEM — Apple’s education-initiative story anatomy as measured
   (Oct 2026): the chapter opens on the shared spine with the eyebrow, one
   left-aligned statement at the 64px story tier, and its 24px lead — then a
   single story object: the white 28px card carries the subject and the voice
   together (photo left, quote right), with the pager in Apple’s control row
   beneath the card. The photography is studio-white, so inside the white card
   the subject stands on the card’s own floor — no frame, no crop. The grey
   ground gives the white card its edge (the initiative’s "Our work in
   education doesn’t end here." grammar). The two subjects stay mounted and
   crossfade; the reader paces the story through Apple's own gallery
   controls (measured on /education "Real stories. Real impact.": MANUAL
   prev/next chevrons at the card row's bottom-right — never auto-advance). */
function LandingProblemSection() {
  const { index, goTo } = useCycleIndex(PROBLEM_SLIDES.length, 0);
  const { ref, visible } = useRevealContinuous();
  const slide = PROBLEM_SLIDES[index];
  return (
    <section ref={ref} data-section="02-problem" className="relative z-10 overflow-hidden bg-[#f5f5f7]" style={{ fontFamily: fontStack }}>
      <Reveal visible={visible}>
        <p className="sr-only">Stories from a student and a professional about the moment understanding breaks down.</p>
        <div className="public-editorial-frame mx-auto">
          <p className="text-[17px] font-medium" style={{ color: BRAND.graphite }}>Why Visionary exists</p>
          <h2 key={`h-${index}`} data-type="section" className="hero-fade-up mt-[var(--gap-eyebrow-title-display)] text-balance font-semibold" style={{ color: BRAND.ink, maxWidth: "980px" }}>
            {slide.black} <span className="accent-gradient">{slide.blue}</span>.
          </h2>
          {/* Apple's chapter sub grammar (measured 2026-11-21): the statement
              translates in 17px/400 — the body role, never a semibold lead */}
          <p data-type="body" className="mt-[var(--gap-title-sub-display)] max-w-[54ch] tracking-[0]" style={{ color: BRAND.graphite }}>
            Effort isn’t the gap. Knowing whether understanding landed is.
          </p>
        </div>
        <figure className="m-0">
          <div className="public-editorial-frame mx-auto">
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
                {/* Apple's story-card anatomy (measured on /education
                    "Real stories. Real impact."): the card eyebrow — who is
                    speaking — sits ABOVE the statement, never below it. The
                    quote is the card's statement; the persona is its label. */}
                <figcaption key={`q-${index}`} className="hero-fade-up flex flex-col justify-center px-6 py-8 [animation-delay:80ms] [animation-fill-mode:both] sm:px-10 sm:py-10 min-[1069px]:px-12 min-[1069px]:py-12">
                  <p className="text-[14px] font-semibold" style={{ color: BRAND.graphite }}>{slide.persona}</p>
                  <blockquote className="mt-4">
                    <p data-type="editorial-lead" className="flex min-h-[3.3em] items-center text-balance" style={{ color: BRAND.ink, maxWidth: "24ch" }}>{slide.quote}</p>
                  </blockquote>
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
                aria-label="Previous story"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                className="flex h-11 w-11 items-center justify-center rounded-full border transition-[opacity,transform] duration-200 hover:opacity-100 disabled:opacity-30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                style={{ borderColor: `${BRAND.ink}33`, color: `${BRAND.ink}99` }}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next story"
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

/* 03 · PROMISE — the turn of the story, staged as the page’s one black
   statement screen: a single line, monumental on the flat black ground
   (Apple's dark-chapter law — no glow washes). It fades up as the reader
   arrives, holds the beat, and lets go as the answer (04) arrives below —
   Apple's black statement beat, not a thin strip between chapters. */
function LandingPromiseSection() {
  const { ref, visible } = useRevealContinuous();
  return (
    <section
      ref={ref}
      data-section="03-promise"
      className="scene-dark relative z-10 isolate flex min-h-[clamp(460px,78svh,780px)] items-center overflow-hidden px-6 [overflow-x:clip]"
      style={{ fontFamily: fontStack }}
    >
      {/* Apple's black statement beat is FLAT — no glow behind the line
          (measured 2026-11-21 on /education: the dark chapter is pure black;
          the color lives in the accent words). The line and its gradient
          phrase carry the whole scene. */}
      <Reveal visible={visible} className="relative mx-auto w-full max-w-[1100px]">
          <h2
            data-type="emphasis"
            className="mx-auto text-balance text-center font-semibold"
            style={{ maxWidth: "20ch", color: BRAND.ink }}
          >
          What if your intelligence never forgot{" "}
          <span className="accent-gradient-on-dark">where you were?</span>
        </h2>
        {/* Apple's statement beats keep the next action tight to the line
            (measured flow gaps 10–22px) — 24px here, not a floating row */}
        <div className="mt-6 flex justify-center">
          <QuietLink to="/how-it-works" dark>
            See how the loop remembers your place <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </QuietLink>
        </div>
      </Reveal>
    </section>
  );
}

/* 04 · THE RETURN — the answer to the promise’s "what if": what the reader
   gets back. The founder’s conviction, verbatim from /research, opens the
   chapter as Apple’s values statement (Education’s "Our values lead the way."
   tier: 48/40/32), then the four returns stand as Apple’s feature cards — two
   broad #f5f5f7 cards per row on the wide card frame, so each return reads as
   a calm object instead of a column of text. Each return carries the site’s
   own block anatomy: the 24px mark, the line, and the achievement return’s
   quiet blue door. The chapter’s five-journey route line now closes the page
   at the CTA (the tail mini-router), so the returns stay the only text here. */
const LX_RETURNS = [
  { Icon: Layers3, title: "Your hours stack.", copy: "Every lesson builds on the last. This year’s work becomes next year’s strength.", l: "For students", to: "/student" },
  { Icon: BookOpen, title: "Your place is kept.", copy: "Visionary remembers where you stopped, so every session continues.", l: "Your continuity", to: "/how-it-works" },
  { Icon: Globe2, title: "Your language works.", copy: "Ask, reason, and learn in the language you think in — English, Hindi, and Bengali today.", l: "Language support", to: "/how-it-works" },
  { Icon: Eye, title: "Your progress shows.", copy: "Teachers and parents see progress while it still matters.", l: "For parents", to: "/parent" },
];

/* The return chapter’s closing line — the five journeys, labelled exactly as
   the footer labels them. It now rides the page’s closer (the CTA’s tail
   mini-router) instead of trailing the values cards, so the return chapter
   ends on its cards. */
const LX_RETURN_ROUTES = [
  { label: "Students", to: "/student" },
  { label: "Teachers", to: "/teacher" },
  { label: "Parents", to: "/parent" },
  { label: "Professionals", to: "/professional" },
  { label: "Organizations", to: "/organization" },
];

function LandingReturnSection() {
  const { ref, visible } = useRevealContinuous();
  return (
    <section ref={ref} data-section="04-return" className="relative isolate bg-white [overflow-x:clip]" style={{ fontFamily: fontStack }}>
      <Reveal visible={visible}>
        <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-[var(--frame-x)]">
          <p className="text-[17px] font-medium" style={{ color: BRAND.graphite }}>What you get</p>
          <figure className="m-0">
            <blockquote className="mt-[clamp(20px,2.6vw,32px)]">
              <p data-type="card-chapter" className="text-balance font-semibold" style={{ color: BRAND.ink, maxWidth: "30ch" }}>“A person should not have to start over every time life asks them to learn something new.”</p>
            </blockquote>
            <figcaption className="mt-5 text-[16px] font-normal" style={{ color: BRAND.slate }}>
              Md Shahid Ali · Founder and CEO
            </figcaption>
          </figure>
          {/* The four returns, in Apple's values-column grammar (measured on
              /education "Our values lead the way."): open typographic columns
              under a thin top hairline — a 28px mark, the feature title, the
              explanation, and the editorial door at the column's baseline.
              Four-up on the desktop window, two-up from 640, stacked on the
              phone. No tiles: the values chapter is type on the band. */}
          <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 min-[1069px]:mt-16 min-[1069px]:grid-cols-4">
            {LX_RETURNS.map((item) => (
              <article
                key={item.title}
                className="flex flex-col border-t pt-7"
              >
                <item.Icon aria-hidden="true" className="h-7 w-7" strokeWidth={1.8} style={{ color: BRAND.ink }} />
                <h3 data-type="feature" className="mt-5" style={{ color: BRAND.ink }}>{item.title}</h3>
                <p data-type="value-body" className="mt-3 max-w-[42ch]" style={{ color: BRAND.slate }}>{item.copy}</p>
                {/* the editorial link law owns the door's colour and hover
                    underline (#0066cc / underlined) */}
                <Link
                  to={item.to}
                  className="mt-auto inline-flex items-center gap-1.5 pt-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
                >
                  {item.l}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* 05 · THE PRODUCT PROMO — the front door’s dark pivot: the product’s
   statement ("One intelligence.") over one slowly morphing stage, with one
   door out to the full mechanism. The four-beat loop lives where it is told
   in depth — /how-it-works and every category page. Rendered with the
   accepted premium module in promo mode — no new copy. */
function LandingIntelligenceSection() {
  return (
    <Suspense fallback={null}><PremiumIntelligenceSection
      steps={INTELLIGENCE_STEPS}
      /* The front door's one plain explanation — the reader arrives from the
         hero promise already primed, and this line says what the product is
         in Apple's plain voice: concrete verbs, two short sentences, no
         dashes. Every claim is the platform's own released promise. */
      sub="It remembers where you stopped, answers your questions, and turns practice into progress. In your language."
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
      heading={<>One intelligence, <span className="accent-gradient">five journeys.</span></>}
      sub="Learning, teaching, guiding, building, leading. Visionary adapts to your stage and carries your progress forward."
      headingRole="section"
      subRole="editorial-body"
      categories={ROUTER_CATEGORIES}
      images={ROUTER_IMAGES}
    /></Suspense>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════
   The front-door anatomy (the company front door), ordered the way Apple
   tells a product story — show, then explain: the family stage pins to the
   viewport and dissolves under frosted glass; the product answers first
   (intelligence — one dark world, one door to /how-it-works); the story
   explains why it exists (problem — the human voices), the promise turns the
   page on one black statement screen, and the return answers what the reader
   gets back (the founder’s conviction and the four returns); the five-journey
   line-up forks, the grey catalogue expanse continues through the suite
   (Download / Pricing / Help / Updates), the four trust values close the
   story (Privacy / Safety / Security / Accessibility), and the closer hands
   the reader their next step. Every module is a door — the feature depth
   lives on the category pages and /how-it-works. */
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
        {/* the product answers first — the front door shows what the
            intelligence is on the first scroll after the hero (Apple's
            show-before-explain order), then the story explains why it exists
            and what the reader gets back. */}
        <LandingIntelligenceSection />
        <LandingProblemSection />
        <LandingPromiseSection />
        <LandingRouterSection />
        <LandingReturnSection />
        <Suspense fallback={null}><PremiumTrustSection
          heading={<>Your learning stays <span className="accent-gradient">yours.</span></>}
          sub="Your questions, conversations, ideas, and progress are personal. Visionary keeps it that way."
          values={LX_TRUST_VALUES}
        /></Suspense>
        <Suspense fallback={null}><PremiumCTASection
          variant="closing"
          heading="Your next step starts here."
          sub="Ask a question. Explore an idea. Start learning. Visionary is ready when you are."
          routeLinks={LX_RETURN_ROUTES}
        /></Suspense>
      </main>
      {/* quiet variant: Apple’s footer ends the page in air — no giant
          wordmark — the story itself is the signature */}
      <LandingFooter variant="quiet" />
    </div>
  );
}
