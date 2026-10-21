import React from "react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/NewPersona";
import LazyImage from "@/components/landing/LazyImage";
import SpotIllustration from "@/components/landing/SpotIllustration";
import {
  PremiumIntelligenceSection,
  PremiumTrustSection,
  PremiumCTASection,
  PremiumExploreSection,
} from "@/components/landing/persona/PremiumPersonaSections";
// Hero images (above the fold) — loaded eagerly with high fetch priority
import studentmeet from "@/assets/student-hero-main-1600w.webp";
import teachermeet from "@/assets/teacher-hero-main-1600w.webp";
import parentmeet from "@/assets/parent-hero-main-1600w.webp";
import promeet from "@/assets/pro-face-main-1600w.webp";
import orgmeet from "@/assets/org-face-main-1600w.webp";
// Problem section images — loaded lazily (below the fold)
import problemunderstanding from "@/assets/problem-understanding.webp";
import teacherProblem from "@/assets/teacher-problem-1.webp";
import problemrevision from "@/assets/problem-revision.webp";
import proProblem from "@/assets/professional-problem-2.webp";
import { Accessibility, ArrowRight, BookOpen, ChevronRight, Eye, Globe2, HeartHandshake, Layers3, Lock, ShieldCheck } from "lucide-react";

/* One source of truth: every color resolves from system/tokens.js (the
   measured Apple-neutral system, see APPLE_MEASURED_REFERENCE_2026-10-21.md).
   The measured primitives (reveal, progress dots, CTA pair) live beside it in
   system/ui.jsx and system/hooks.js — the landing consumes the system rather
   than re-declaring it. */
import { color as BRAND } from "@/components/landing/system/tokens";
import { Reveal, ProgressDots } from "@/components/landing/system/ui";
import { useCycleIndex, useRevealContinuous } from "@/components/landing/system/hooks";

/* ═══════════════════════ SHARED VIEWS ═══════════════════════ */
/* Every landing reveal rides Apple's resolve-out curve
   cubic-bezier(0.16,1,0.3,1) — the deceleration you feel on apple.com's
   own scroll reveals (the --ease-out-apple token in premium.css). */
const EASE_APPLE = "ease-apple";

/* ═══════════════════════ MODELS ═══════════════════════ */
const PROBLEM_SLIDES = [
  { black: "Teaching everyone is possible.", blue: "Reaching everyone isn't", persona: "A teacher", quote: "I taught the whole class. Half of them still left lost.", image: teacherProblem, alt: "Teacher looking overwhelmed after class" },
  { black: "Seeing progress is easy.", blue: "Knowing how to help isn't", persona: "A parent", quote: "The report card says fine. I still don't know how to help at home.", image: problemrevision, alt: "Parent reviewing a child's progress" },
  { black: "Accessing knowledge is easy.", blue: "Applying it isn't", persona: "A student", quote: "I watched eight hours of videos and still couldn't solve a single problem on my own.", image: problemunderstanding, alt: "Student studying alone with a tablet" },
  { black: "Knowledge is everywhere.", blue: "Turning it into capability isn't", persona: "A professional", quote: "I read every article. I still can't turn them into the work.", image: proProblem, alt: "Professional overwhelmed by learning resources" },
];
const PROBLEM_MS = 4200;

/* The five journeys — the landing's category router. Rendered with the
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

/* The suite — the four doors around the product (Apple's services row):
   every line is the destination page's own hero statement, the card
   anatomy is the About page's explore module (white cards on the grey
   ground, spot-illustration field, cutout arrow). */
const SUITE_TILES = [
  { to: "/download", label: "Download", copy: "Get Visionary on every device.", subject: "download" },
  { to: "/pricing", label: "Pricing", copy: "Plans for every journey.", subject: "tag" },
  { to: "/help", label: "Help", copy: "Find your answer.", subject: "help" },
  { to: "/updates", label: "Updates", copy: "What's new at Visionary.", subject: "updates" },
];

/* The mechanism chapter's four beats — the umbrella voice of the loop every
   category page is built around. Verbatim from the student page's
   INTELLIGENCE_STEPS: the front door shows the mark once, for everyone. */
const INTELLIGENCE_STEPS = [
  { title: "Understand what you're learning.", copy: "Visionary continues from where you are, and every lesson becomes understanding." },
  { title: "See it. Hear it.\nAsk it another way.", copy: "Open today's lesson. Visionary already understands where you are and where you're going next." },
  { title: "Practice what you're learning.", copy: "Every answer becomes a chance to practise, with feedback that listens and adapts at your pace." },
  { title: "Build from what you know.", copy: "Turn every lesson into real thinking, projects, and creative work that keeps growing with you." },
];

/* Apple's values anatomy (education-initiative: "Our values lead the way"):
   typographic columns on the shared persona pages — the type carries the
   trust. The landing's closing chapter takes Apple's feature-card variant
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
   viewport (sticky, in NewPersona's cast branch) so the story can glide
   over it on frosted glass — the Vision Pro page anatomy. */

/* The family, as alpha cutouts on the page's own white (the persona hero
   photography with the studio background removed) — so the landing stages
   them as one unbroken lineup, the way Apple stages a product family. */
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
import { fontStack } from "@/components/landing/system/tokens";

/* Apple's universal hero grammar: a single declarative statement that
   names the product's universal value and every category it serves — the
   same pattern as /education-initiative/ ("Education moves learners, leaders,
   innovators, communities and everyone forward.") and /education ("Designed
   for every kind of learner."). No cycling, no fragmentation — one line,
   one truth. */
/* Apple's universal hero grammar: the product statement stays put on its line
   ("One intelligence"), and the audience line cycles beneath it — for
   students., for teachers., for parents., for professionals., for organizations.
   — the Apple product-hero rhythm (static lead + moving sub-line). */
const LANDING_HERO_WORDS = ["One intelligence"];

/* The cycling audience line below the static statement — the hero names
   every category in turn. NewPersona appends the trailing period itself. */
const HERO_CATEGORY_WORDS = ["for students", "for teachers", "for parents", "for professionals", "for organizations"];

/* The audience rail under the hero actions — one door per persona on the
   first screen. Order matches HERO_CATEGORY_WORDS one-to-one, so hovering
   a label previews exactly the line it names. Labels are the footer's
   existing audience names. */
const LANDING_AUDIENCE_LINKS = [
  { label: "Students", to: "/student" },
  { label: "Teachers", to: "/teacher" },
  { label: "Parents", to: "/parent" },
  { label: "Professionals", to: "/professional" },
  { label: "Organizations", to: "/organization" },
];

const cutSet = (w480, w800) => `${w480} 480w, ${w800} 800w`;
const LANDING_HERO_LINEUP = [
  { label: "Professional", src: proCut800, srcSet: cutSet(proCut480, proCut800) },
  { label: "Teacher", src: teacherCut800, srcSet: cutSet(teacherCut480, teacherCut800) },
  { label: "Student", src: studentCut800, srcSet: cutSet(studentCut480, studentCut800) },
  { label: "Parent", src: parentCut800, srcSet: cutSet(parentCut480, parentCut800) },
  { label: "Organization", src: orgCut800, srcSet: cutSet(orgCut480, orgCut800) },
];

/* ── HERO ──
   Apple's universal front door: "One intelligence" holds the stage, the
   audience line cycles beneath it, and the five alpha cutouts rise from
   the fold. The CTA pair are the only actions — the story lives below the
   line-up, exactly like an Apple education product hero. */
const LandingHeroSection = React.memo(function LandingHeroSection() {
  return (
    <PersonaHero
      words={LANDING_HERO_WORDS}
      animatedHeadlinePrefix="One intelligence"
      animatedHeadlineWords={HERO_CATEGORY_WORDS}
      srSentence="One intelligence, for students, teachers, parents, professionals, and organizations."
      cast={LANDING_HERO_LINEUP}
      audienceLinks={LANDING_AUDIENCE_LINKS}
      ctaLabel="Start learning"
      secondaryLabel="See how it works"
      wordMs={2600}
    />
  );
});

/* 02 · PROBLEM — Apple's education-initiative story anatomy as measured
   (Oct 2026): the chapter opens on the shared spine with the eyebrow, one
   left-aligned statement at the 64px story tier, and its 24px lead — then a
   single story object: the white 28px card carries the subject and the voice
   together (photo left, quote right), with the pager in Apple's control row
   beneath the card. The photography is studio-white, so inside the white card
   the subject stands on the card's own floor — no frame, no crop. The grey
   ground gives the white card its edge (the initiative's "Our work in
   education doesn't end here." grammar). The four subjects stay mounted and
   crossfade; the dots let the reader pace it. */
function LandingProblemSection() {
  const { index, goTo } = useCycleIndex(PROBLEM_SLIDES.length, 0);
  const { ref, visible } = useRevealContinuous();
  const slide = PROBLEM_SLIDES[index];
  return (
    <section ref={ref} data-section="02-problem" className="relative z-10 overflow-hidden bg-[#f5f5f7]" style={{ fontFamily: fontStack }}>
      <Reveal visible={visible}>
        <p className="sr-only">Stories from a teacher, a parent, a student, and a professional about the moment understanding breaks down.</p>
        <div className="public-editorial-frame mx-auto">
          <p className="text-[17px] font-medium" style={{ color: BRAND.graphite }}>Why Visionary exists</p>
          <h2 key={`h-${index}`} data-type="section" className="hero-fade-up mt-[var(--gap-eyebrow-title-display)] text-balance font-semibold" style={{ color: BRAND.ink, maxWidth: "980px" }}>
            {slide.black} <span className="accent-gradient">{slide.blue}</span>.
          </h2>
          <p className="mt-[var(--gap-title-sub-display)] max-w-[54ch] font-normal tracking-[0]" style={{ color: BRAND.graphite }}>
            Effort isn't the gap. Knowing whether understanding landed is.
          </p>
        </div>
        <figure className="m-0">
          <div className="public-editorial-frame mx-auto">
            {/* the story card — one white object on the grey ground: the
                subject bleeds on the card's left field, the voice sits on the
                right panel. The card is the chapter's one story unit, so the
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
                           them into the card's own white (the hero's floor recipe).
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
                <figcaption key={`q-${index}`} className="hero-fade-up flex flex-col justify-center px-6 py-8 [animation-delay:80ms] [animation-fill-mode:both] sm:px-10 sm:py-10 min-[1069px]:px-12 min-[1069px]:py-12">
                  <blockquote>
                    <p className="flex min-h-[3.3em] items-center text-balance font-medium tracking-[-0.01em] leading-[1.24] text-[clamp(24px,2.3vw,34px)]" style={{ color: BRAND.ink, maxWidth: "22ch" }}>{slide.quote}</p>
                  </blockquote>
                  <p className="mt-5 text-[15px] font-medium tracking-[0] leading-[20px]" style={{ color: BRAND.slate }}>{slide.persona}</p>
                </figcaption>
              </div>
            </div>
            {/* Apple's carousel control row — the pager sits under the card,
                on the section floor, where the initiative's own controls sit */}
            <div className="mt-6 flex justify-start">
              <ProgressDots total={PROBLEM_SLIDES.length} active={index} onSelect={goTo} />
            </div>
          </div>
        </figure>
      </Reveal>
    </section>
  );
}

/* 03 · PROMISE — the turn of the story, staged as the page's one black
   statement screen: a single line, monumental on the dark ground, with the
   product's own glow kept behind it. It fades up as the reader arrives,
   holds the beat, and lets go as the answer (04) arrives below — Apple's
   black statement beat, not a thin strip between chapters. */
function LandingPromiseSection() {
  const { ref, visible } = useRevealContinuous();
  return (
    <section
      ref={ref}
      data-section="03-promise"
      className="scene-dark relative z-10 isolate flex min-h-[clamp(460px,78svh,780px)] items-center overflow-hidden px-6 [overflow-x:clip]"
      style={{ fontFamily: fontStack }}
    >
      {/* the product's own breath of light, kept behind the line — the same
          glow recipe as the intelligence stage, so the turn belongs to the
          same world instead of being a new surface invention */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(58% 70% at 50% 44%, rgba(66,133,244,0.14) 0%, rgba(66,133,244,0.04) 48%, rgba(10,13,20,0) 82%)" }}
      />
      <Reveal visible={visible} className="relative mx-auto w-full max-w-[1100px]">
          <h2
            data-type="emphasis"
            className="mx-auto text-balance text-center font-semibold"
            style={{ maxWidth: "20ch", color: BRAND.ink }}
          >
          What if your intelligence never forgot{" "}
          <span className="accent-gradient-on-dark">where you were?</span>
        </h2>
      </Reveal>
    </section>
  );
}

/* 04 · THE RETURN — the answer to the promise's "what if": what the reader
   gets back. The founder's conviction, verbatim from /research, opens the
   chapter as Apple's values statement (Education's "Our values lead the way."
   tier: 48/40/32), then the four returns stand as Apple's feature cards — two
   broad #f5f5f7 cards per row on the wide card frame, so each return reads as
   a calm object instead of a column of text. Each return carries the site's
   own block anatomy: the 24px mark, the line, and the achievement return's
   quiet blue door. The chapter's five-journey route line now closes the page
   at the CTA (the tail mini-router), so the returns stay the only text here. */
const LX_RETURNS = [
  { Icon: Layers3, title: "Your hours stack.", copy: "Every lesson builds on the last. This year's work becomes next year's strength.", l: "For students", to: "/student" },
  { Icon: BookOpen, title: "Your place is kept.", copy: "Visionary remembers where you stopped, so every session continues.", l: "Your continuity", to: "/how-it-works" },
  { Icon: Globe2, title: "Your language works.", copy: "Ask, reason, and learn in the language you think in — English, Hindi, and Bengali today.", l: "Language support", to: "/how-it-works" },
  { Icon: Eye, title: "Your progress shows.", copy: "Teachers and parents see progress while it still matters.", l: "For parents", to: "/parent" },
];

/* The return chapter's closing line — the five journeys, labelled exactly as
   the footer labels them. It now rides the page's closer (the CTA's tail
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
            <figcaption className="mt-5 text-[15px] font-normal" style={{ color: BRAND.slate }}>
              Md Shahid Ali · Founder and CEO
            </figcaption>
          </figure>
          {/* The four returns, as Apple's feature cards: two broad #f5f5f7
              cards per row on the wide card frame — a 28px mark, the feature
              title, the explanation, and the editorial door pinned to the
              card's baseline. Two-up on the desktop window, two-up from 640,
              stacked on the phone. */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 min-[1069px]:mt-16">
            {LX_RETURNS.map((item) => (
              <article
                key={item.title}
                className="flex flex-col rounded-[1.75rem] bg-[#f5f5f7] p-8 min-[1069px]:p-10"
              >
                <item.Icon aria-hidden="true" className="h-7 w-7" strokeWidth={1.75} style={{ color: BRAND.ink }} />
                <h3 data-type="feature" className="mt-6" style={{ color: BRAND.ink }}>{item.title}</h3>
                <p data-type="value-body" className="max-w-[46ch]" style={{ color: BRAND.slate }}>{item.copy}</p>
                {/* the editorial link law owns the door's colour and hover
                    underline (#0066cc / underlined) */}
                <Link
                  to={item.to}
                  className="mt-auto inline-flex items-center gap-1.5 pt-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
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

/* 05 · THE PRODUCT PROMO — the front door's dark pivot: the product's
   statement ("One intelligence.") over one slowly morphing stage, with one
   door out to the full mechanism. The four-beat loop lives where it is told
   in depth — /how-it-works and every category page. Rendered with the
   accepted premium module in promo mode — no new copy. */
function LandingIntelligenceSection() {
  return (
    <PremiumIntelligenceSection
      steps={INTELLIGENCE_STEPS}
      sub="From the first question to using what you know."
      promo
      ctaLabel="See how it works"
      ctaTo="/how-it-works"
    />
  );
}

/* 13 · THE ROUTER — the five journeys, as one line-up. The landing's
   category chapter renders with the accepted explore module verbatim (white
   cards on the #f5f5f7 ground, the studio portrait whole on its square
   field, the quiet blue link) — the same card system every persona page
   closes with, so the product reads as one family. On the landing the
   module is the front door's fork: after the product promo, opening the
   grey catalogue expanse that the suite below continues. The surface
   carries the join — Apple's no-seam law.
   The landing opts the header into the measured card-chapter tiers: the
   statement at Education's "Real stories. Real impact." size (48/40/32) and
   the intro at the editorial-body tier — the persona line-ups keep their
   accepted gallery header. */
function LandingRouterSection() {
  return (
    <PremiumExploreSection
      eyebrow="Who it's for"
      heading={<>One intelligence, <span className="accent-gradient">five journeys.</span></>}
      sub="Whether you are learning, teaching, guiding, building, or leading — Visionary adapts to your stage and carries your progress forward."
      headingRole="card-chapter"
      subRole="editorial-body"
      categories={ROUTER_CATEGORIES}
      images={ROUTER_IMAGES}
    />
  );
}

/* 14 · THE SUITE — the four doors around the product (Apple's services row):
   Download, Pricing, Help, Updates. Every line is the destination page's own
   hero statement, so the front door invents nothing; the card anatomy is the
   About page's explore module (white cards on the grey ground, cutout arrow)
   so the whole site speaks one card system. The line-up's grey ground
   continues straight through — one catalogue expanse carries the five
   journeys and then the four doors around the product. */
function LandingSuiteSection() {
  const { ref, visible } = useRevealContinuous();

  return (
    <section ref={ref} data-section="14-suite" className="relative isolate bg-[#f5f5f7] [overflow-x:clip]" style={{ fontFamily: fontStack }}>
      <Reveal visible={visible} className="mx-auto w-full max-w-[1400px] px-6 lg:px-[var(--frame-x)]">
        {/* Apple's accessory/line-up chapters open with a statement over the
            grid ("Explore Apple Vision Pro accessories."). The suite's own
            eyebrow promotes to the measured card-chapter statement tier —
            same words, one statement period — so it reads as the sibling of
            the journeys line-up above, not a second hero. */}
        <h2
          data-type="card-chapter"
          className="text-balance font-semibold"
          style={{ color: BRAND.ink, maxWidth: "20ch" }}
        >
          Explore further.
        </h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:mt-12">
          {SUITE_TILES.map((item) => (
            /* Apple's explore tile: one white card, the spot-illustration
               field inset like a media well, the label/copy on the spine and
               the arrow inside the card — no detached strip, no floating
               notch. The whole card stays the door. */
            <Link
              key={item.to}
              to={item.to}
              className="group relative grid min-h-[220px] grid-cols-[1fr_118px] gap-3 overflow-hidden rounded-[20px] bg-white p-3 transition-shadow duration-200 hover:shadow-[0_12px_32px_rgba(29,29,31,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] sm:grid-cols-[1fr_180px]"
            >
              <div className="flex flex-col justify-between px-4 py-4 sm:px-6 sm:py-6">
                <div>
                  <h3 className="text-[22px] font-medium sm:text-[24px]" style={{ color: BRAND.ink }}>{item.label}</h3>
                  <p className="mt-2 max-w-[300px] text-[15px] leading-[1.6]" style={{ color: BRAND.graphite }}>{item.copy}</p>
                </div>
                <span aria-hidden="true" className="mt-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f7] transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none">
                  <ArrowRight className="h-4 w-4" style={{ color: BRAND.link }} />
                </span>
              </div>
              <div className="flex items-center justify-center rounded-[14px] bg-[#f5f5f7] sm:rounded-[16px]">
                <SpotIllustration subject={item.subject} className="h-20 w-20 sm:h-36 sm:w-36" />
              </div>
            </Link>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════
   The front-door anatomy (the company front door), ordered the way Apple
   tells a product story — show, then explain: the family stage pins to the
   viewport and dissolves under frosted glass; the product answers first
   (intelligence — one dark world, one door to /how-it-works); the story
   explains why it exists (problem — the human voices), the promise turns the
   page on one black statement screen, and the return answers what the reader
   gets back (the founder's conviction and the four returns); the five-journey
   line-up forks, the grey catalogue expanse continues through the suite
   (Download / Pricing / Help / Updates), the four trust values close the
   story (Privacy / Safety / Security / Accessibility), and the closer hands
   the reader their next step. Every module is a door — the feature depth
   lives on the category pages and /how-it-works. */
export default function LandingPage() {
  return (
    <div className="page-landing min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main">
        <LandingHeroSection />
        {/* the glass sheet — the hero's cover. The frost fades in from its
            leading edge (mask), so the sheet never slices the pinned headline
            mid-glyph: the family and copy dissolve into white the way the
            hero's own floor dissolves them. */}
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
        <LandingReturnSection />
        <LandingRouterSection />
        <LandingSuiteSection />
        <PremiumTrustSection
          variant="feature"
          heading={<>Your learning stays <span className="accent-gradient">yours.</span></>}
          sub="Your questions, conversations, ideas, and progress are personal. Visionary keeps it that way."
          values={LX_TRUST_VALUES}
        />
        <PremiumCTASection
          variant="closing"
          heading="Your next step starts here."
          sub="Ask a question. Explore an idea. Start learning. Visionary is ready when you are."
          routeLinks={LX_RETURN_ROUTES}
        />
      </main>
      {/* quiet variant: Apple's footer ends the page in air — no giant
          wordmark — the story itself is the signature */}
      <LandingFooter variant="quiet" />
    </div>
  );
}
