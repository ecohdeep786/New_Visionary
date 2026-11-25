import { useEffect, useRef, useState } from "react";
import "./landing-home.css";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/NewPersona";
import { Link } from "react-router-dom";
import heroBotWebp from "@/assets/brand/visionary-bot.webp";
import heroBotAvif from "@/assets/brand/visionary-bot.avif";
import cubeThree from "@/assets/lesson-cube-3.webp";
import cubeSix from "@/assets/lesson-cube-6.webp";
// Each audience destination keeps its original portrait. The Student lineup
// uses a normalized crop from the transparent hero cutout so all five
// portraits share the same white studio ground.
import studentLineup from "@/assets/audience-portraits/student-lineup.webp";
import teachermeet from "@/assets/audience-portraits/teacher.webp";
import parentmeet from "@/assets/audience-portraits/parent.webp";
import promeet from "@/assets/audience-portraits/professional.webp";
import orgmeet from "@/assets/audience-portraits/organization.webp";
import { Accessibility, ChevronLeft, ChevronRight, Lock, ShieldCheck } from "lucide-react";

import { useSignedIn } from "@/components/landing/AuthAwareLink";

const AUDIENCES = [
  {
    slug: "student", label: "Students", castLabel: "Student", portrait: studentLineup,
    headline: "to a project.", outcome: "Try a different explanation, then use the idea in a project.",
    situation: "The lesson still hasn’t clicked.",
    nextStep: "Try another explanation, check what you remember and use the idea in a project.",
  },
  {
    slug: "teacher", label: "Teachers", castLabel: "Teacher", portrait: teachermeet,
    headline: "to a lesson.", outcome: "See where the class is stuck and adapt your next lesson.",
    situation: "Several students missed the same idea.",
    nextStep: "Review each student’s work to see what to explain differently tomorrow.",
  },
  {
    slug: "parent", label: "Parents", castLabel: "Parent", portrait: parentmeet,
    headline: "to a conversation.", outcome: "See what your child understands and how to help at home.",
    situation: "“I got it” leaves you guessing.",
    nextStep: "Use a shared progress summary to guide a conversation at home.",
  },
  {
    slug: "professional", label: "Professionals", castLabel: "Professional", portrait: promeet,
    headline: "to a new skill.", outcome: "Turn today’s work into skills you can reuse.",
    situation: "You solved a problem at work.",
    nextStep: "Save what worked so you can reuse it on the next project.",
  },
  {
    slug: "organization", label: "Organizations", castLabel: "Organization", portrait: orgmeet,
    headline: "to a team plan.", outcome: "Spot gaps across teams and plan what to teach next.",
    situation: "Several teams need training.",
    nextStep: "Spot shared skill gaps and decide where training would help first.",
  },
];

// The original responsive cutouts compose the full audience lineup.
// The original white studio photograph preserves the highlights in the white shirt.
import professionalPhoto from "@/assets/pro-face-main-800w.webp";
import teacherCut480 from "@/assets/hero-cutouts/teacher-480w.webp";
import teacherCut800 from "@/assets/hero-cutouts/teacher-800w.webp";
import studentCut480 from "@/assets/hero-cutouts/student-480w.webp";
import studentCut800 from "@/assets/hero-cutouts/student-800w.webp";
import parentCut480 from "@/assets/hero-cutouts/parent-480w.webp";
import parentCut800 from "@/assets/hero-cutouts/parent-800w.webp";
import orgCut480 from "@/assets/hero-cutouts/organization-480w.webp";
import orgCut800 from "@/assets/hero-cutouts/organization-800w.webp";
/* AVIF siblings — same grids, ~42% smaller wire (see the D3 receipt). */

import professionalPhotoAvif from "@/assets/pro-face-main-800w.avif";
import teacherCut480Avif from "@/assets/hero-cutouts/teacher-480w.avif";
import teacherCut800Avif from "@/assets/hero-cutouts/teacher-800w.avif";
import parentCut480Avif from "@/assets/hero-cutouts/parent-480w.avif";
import parentCut800Avif from "@/assets/hero-cutouts/parent-800w.avif";
import orgCut480Avif from "@/assets/hero-cutouts/organization-480w.avif";
import orgCut800Avif from "@/assets/hero-cutouts/organization-800w.avif";
import { fontStack } from "@/components/landing/system/tokens";

import { UNIVERSAL_HERO_AVIF_SRCSET } from "@/lib/universalHero";

const cutSet = (w480, w800) => `${w480} 480w, ${w800} 800w`;
/* avifSet mirrors cutSet for the same-pixel AVIF siblings; the <picture>
   source in NewPersona carries type="image/avif" so the browser only
   downloads it when it actually supports the codec. */
const LANDING_HERO_LINEUP = [
  { label: "Professional", src: professionalPhoto, avifSrcSet: professionalPhotoAvif },
  { label: "Teacher", src: teacherCut800, srcSet: cutSet(teacherCut480, teacherCut800), avifSrcSet: cutSet(teacherCut480Avif, teacherCut800Avif) },
  { label: "Student", src: studentCut800, srcSet: cutSet(studentCut480, studentCut800), avifSrcSet: UNIVERSAL_HERO_AVIF_SRCSET },
  { label: "Parent", src: parentCut800, srcSet: cutSet(parentCut480, parentCut800), avifSrcSet: cutSet(parentCut480Avif, parentCut800Avif) },
  { label: "Organization", src: orgCut800, srcSet: cutSet(orgCut480, orgCut800), avifSrcSet: cutSet(orgCut480Avif, orgCut800Avif) },
];

const TRUST_VALUES = [
  {
    title: "Private by design.",
    copy: "Your private work stays private. When you choose to share, the people you authorize see only what you shared.",
    link: "How sharing works",
    to: "/privacy#sharing",
    Icon: Lock,
  },
  {
    title: "Safe to learn.",
    copy: "Designed with controls and protections for learners, families and schools.",
    link: "How safety works",
    to: "/safety",
    Icon: ShieldCheck,
  },
  {
    title: "Open to everyone.",
    copy: "A learning experience designed to adapt to how you learn.",
    link: "Accessibility",
    to: "/accessibility",
    Icon: Accessibility,
  },
];

function AudienceNextSteps() {
  return (
    <section data-section="06-next-steps" className="home-next-steps" aria-labelledby="next-steps-heading">
      <div className="next-steps-frame">
        <div className="next-steps-layout">
          <div className="next-steps-intro">
            <h2 id="next-steps-heading" data-type="display">Know what to do next.</h2>
            <p data-type="editorial-body">Keep questions, work and feedback together so you can see where to focus.</p>
            <p id="next-steps-status" data-type="metadata">Guided experiences are in development.</p>
          </div>
          <ul className="next-steps-list" role="list" aria-label="Audience needs" aria-describedby="next-steps-status">
            {AUDIENCES.map(({ slug, label, situation, nextStep }) => (
              <li key={slug} data-audience={slug}>
                <h3 data-type="feature">
                  <span className="next-steps-role">{label}</span>{" "}
                  <span>{situation}</span>
                </h3>
                <p data-type="body">{nextStep}</p>
              </li>
            ))}
          </ul>
          <figure className="next-steps-example">
            <div className="cube-example">
              <h3 data-type="card-name">Doubling a cube’s side.</h3>
              <div className="cube-example-models">
                <div>
                  <img src={cubeThree} width="452" height="416" alt="" loading="lazy" decoding="async" />
                  <p data-type="body">3 × 3 × 3</p>
                  <p data-type="body"><strong>27</strong> cubic units</p>
                </div>
                <div>
                  <img src={cubeSix} width="452" height="416" alt="" loading="lazy" decoding="async" />
                  <p data-type="body">6 × 6 × 6</p>
                  <p data-type="body"><strong>216</strong> cubic units</p>
                </div>
              </div>
            </div>
            <figcaption data-type="metadata">In a Visionary development exercise, learners compare cube volumes before designing a storage box.</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function scrollRail(ref, direction) {
  const rail = ref.current;
  const [first, second] = rail?.children ?? [];
  if (!first || !second) return;
  const step = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
  rail.scrollBy({
    left: direction * step,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  });
}

function RailControls({ id, label, railRef, className }) {
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    const update = () => {
      setCanGoBack(rail.scrollLeft > 1);
      setCanGoForward(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1);
    };
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(rail);
    for (const item of rail.children) observer?.observe(item);
    window.addEventListener("resize", update);
    rail.addEventListener("scroll", update, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      rail.removeEventListener("scroll", update);
    };
  }, [railRef]);

  if (!canGoBack && !canGoForward) return null;

  return (
    <div className={`rail-controls ${className}`}>
      <button type="button" aria-label={`Previous ${label}`} aria-controls={id} aria-disabled={!canGoBack} onClick={() => canGoBack && scrollRail(railRef, -1)}>
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <button type="button" aria-label={`Next ${label}`} aria-controls={id} aria-disabled={!canGoForward} onClick={() => canGoForward && scrollRail(railRef, 1)}>
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

function AudienceDirectory() {
  const pathRow = useRef(null);
  return (
    <section id="audiences" tabIndex={-1} data-section="13-explore" className="home-audiences" aria-labelledby="audiences-title">
      <div className="path-frame">
        <div className="path-intro">
          <h2 id="audiences-title" data-type="section">Find your path.</h2>
        </div>
        <nav id="audience-paths" aria-label="Audience pages" className="path-row" ref={pathRow}>
          {AUDIENCES.map((role) => (
            <Link key={role.slug} to={`/${role.slug}`} tabIndex={0} className="path-card">
              <span className="path-media">
                <img src={role.portrait} width="224" height="224" alt="" loading="lazy" decoding="async" />
              </span>
              <span className="path-body">
                <span className="path-title">
                  <strong>{role.label}</strong>
                  <ChevronRight className="path-arrow" size={20} aria-hidden="true" />
                </span>
                <span className="path-outcome" data-type="body">{role.outcome}</span>
              </span>
            </Link>
          ))}
        </nav>
        <RailControls id="audience-paths" label="audience" railRef={pathRow} className="path-controls" />
      </div>
    </section>
  );
}

export default function LandingPage() {
  const signedIn = useSignedIn();
  const trustRow = useRef(null);
  return (
    <div className="page-landing min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main" tabIndex={-1}>
        <PersonaHero
          cast={LANDING_HERO_LINEUP}
          audiences={AUDIENCES}
          ctaTo={signedIn ? "/dashboard/home" : "/#audiences"}
          ctaLabel={signedIn ? "Open Visionary" : "Find your path"}
        />
        <section id="intelligence" tabIndex={-1} data-section="05-intelligence" className="scene-dark home-intelligence" aria-labelledby="intelligence-heading">
          <div className="home-width intelligence-layout">
            <div className="intelligence-copy">
              <h2 id="intelligence-heading" data-type="display">One Intelligence.</h2>
              <p data-type="editorial-body">One workspace designed to adapt explanations, show where help is needed and put learning to work.</p>
              <p className="intelligence-note" data-type="body">The guided experience is in development. Today, you can create an account and view saved learning history. Selected workspace screens support English, Hindi and Bengali.</p>
              <Link to="/how-it-works" className="home-text-link">How it works <ChevronRight aria-hidden="true" size={17} /></Link>
            </div>
            <picture className="intelligence-portrait" aria-hidden="true">
              <source type="image/avif" srcSet={heroBotAvif} />
              <img src={heroBotWebp} width="1400" height="1774" alt="" loading="lazy" decoding="async" />
            </picture>
          </div>
        </section>
        <AudienceNextSteps />
        <AudienceDirectory />
        <section className="home-privacy" data-section="11-trust" aria-labelledby="trust-heading">
          <div className="trust-frame">
            <h2 id="trust-heading" data-type="card-chapter">Your learning stays yours.</h2>
            <div id="trust-values" className="trust-row" ref={trustRow}>
              {TRUST_VALUES.map(({ title, copy, link, to, Icon }) => (
                <div key={title} className="trust-card">
                  <Icon className="trust-icon" strokeWidth={1.7} size={32} aria-hidden="true" />
                  <h3 data-type="feature">{title}</h3>
                  <p data-type="value-body">{copy}</p>
                  <Link to={to} className="home-text-link">{link} <ChevronRight aria-hidden="true" size={17} /></Link>
                </div>
              ))}
            </div>
            <RailControls id="trust-values" label="value" railRef={trustRow} className="trust-controls" />
          </div>
        </section>
        <section className="home-closing" data-section="12-cta" aria-labelledby="closing-heading">
          <div className="closing-frame">
            <div className="closing-panel closing-layout">
              <div className="closing-copy">
                <h2 id="closing-heading" data-type="section">{signedIn ? "Continue in Visionary." : "Keep your learning in reach."}</h2>
                <p className="closing-line" data-type="editorial-body">{signedIn ? "Return to your workspace." : "A free account gives you access to saved learning history."}</p>
              </div>
              <div className="closing-actions">
                <Link className="home-action public-action" to={signedIn ? "/dashboard/home" : "/register"}>
                  {signedIn ? "Open Visionary" : "Create an account"}
                </Link>
                <Link className="home-text-link closing-secondary" to="/how-it-works">
                  See how it works <ChevronRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" compactOnMobile />
    </div>
  );
}
