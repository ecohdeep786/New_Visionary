import { useRef } from "react";
import "./landing-home.css";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/NewPersona";
import { Link } from "react-router-dom";
import heroBotWebp from "@/assets/brand/visionary-bot.webp";
import heroBotAvif from "@/assets/brand/visionary-bot.avif";
// Each audience destination keeps its original portrait. The Student lineup
// uses a normalized crop from the transparent hero cutout so all five
// portraits share the same white studio ground.
import studentLineup from "@/assets/audience-portraits/student-lineup.webp";
import teachermeet from "@/assets/audience-portraits/teacher.webp";
import parentmeet from "@/assets/audience-portraits/parent.webp";
import promeet from "@/assets/audience-portraits/professional.webp";
import orgmeet from "@/assets/audience-portraits/organization.webp";
import { Accessibility, BookOpen, ChevronLeft, ChevronRight, Hammer, Lock, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";

import { useSignedIn } from "@/components/landing/AuthAwareLink";

const AUDIENCES = [
  { slug: "student", label: "Students", castLabel: "Student", portrait: studentLineup, headline: "to a project." },
  { slug: "teacher", label: "Teachers", castLabel: "Teacher", portrait: teachermeet, headline: "to a lesson." },
  { slug: "parent", label: "Parents", castLabel: "Parent", portrait: parentmeet, headline: "to a conversation." },
  { slug: "professional", label: "Professionals", castLabel: "Professional", portrait: promeet, headline: "to a new skill." },
  { slug: "organization", label: "Organizations", castLabel: "Organization", portrait: orgmeet, headline: "to a team plan." },
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

const LOOP_STEPS = [
  { number: "01", title: "Ask", copy: "Bring a question or a goal.", Icon: MessageCircle },
  { number: "02", title: "Understand", copy: "See it explained your way.", Icon: BookOpen },
  { number: "03", title: "Practise", copy: "Try it with feedback.", Icon: RefreshCw },
  { number: "04", title: "Build", copy: "Use it in real work.", Icon: Hammer },
];

const TRUST_VALUES = [
  {
    title: "Private by design.",
    copy: "Teachers and connected parents see shared progress; your private conversations stay out of those views.",
    link: "How sharing works",
    to: "/privacy#sharing",
    Icon: Lock,
  },
  {
    title: "Safe to learn.",
    copy: "Controls and protections for learners, families and schools.",
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

function SharedChallenge() {
  return (
    <section data-section="06-journey" className="home-journey" aria-labelledby="journey-heading">
      <div className="home-width journey-layout">
        <h2 id="journey-heading" data-type="display">Understanding is only the beginning.</h2>
        <div className="journey-copy">
          <p data-type="editorial-body">It’s hard to put an idea to work or see where someone needs help when learning and progress live in different places.</p>
          <p className="journey-answer" data-type="lead">Visionary brings learning, practical work and the people who support it into one workspace.</p>
        </div>
      </div>
    </section>
  );
}

function scrollRail(ref, direction) {
  const rail = ref.current;
  if (!rail) return;
  rail.scrollBy({
    left: direction * Math.min(rail.clientWidth * 0.8, 420),
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  });
}

function RailControls({ id, label, onStep, className }) {
  return (
    <div className={`rail-controls ${className}`}>
      <button type="button" aria-label={`Previous ${label}`} aria-controls={id} onClick={() => onStep(-1)}>
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <button type="button" aria-label={`Next ${label}`} aria-controls={id} onClick={() => onStep(1)}>
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

function LearningLoop() {
  return (
    <section data-section="07-loop" className="home-loop" aria-labelledby="loop-heading">
      <div className="home-width">
        <p className="loop-eyebrow" data-type="metadata">The learning loop</p>
        <h2 id="loop-heading" data-type="section">One loop. Every subject.</h2>
        <div className="loop-row">
          {LOOP_STEPS.map(({ number, title, copy, Icon }) => (
            <div key={title} className="loop-step">
              <span className="loop-number" aria-hidden="true">{number}</span>
              <Icon className="loop-icon" strokeWidth={1.7} size={28} aria-hidden="true" />
              <h3 data-type="feature">{title}</h3>
              <p data-type="value-body">{copy}</p>
            </div>
          ))}
        </div>
        <div className="loop-actions">
          <Link to="/how-it-works" className="home-text-link">
            See the full learning loop <ChevronRight aria-hidden="true" size={17} />
          </Link>
          <p className="loop-note">The guided learning journey is in development. Today, you can create an account and view saved learning history.</p>
        </div>
      </div>
    </section>
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
            <Link key={role.slug} to={`/${role.slug}`} className="path-card">
              <span className="path-media">
                <img src={role.portrait} width="224" height="224" alt="" loading="lazy" decoding="async" />
              </span>
              <span className="path-body">
                <span className="path-title">
                  <strong>{role.label}</strong>
                  <ChevronRight className="path-arrow" size={20} aria-hidden="true" />
                </span>
              </span>
            </Link>
          ))}
        </nav>
        <RailControls id="audience-paths" label="audience" onStep={(step) => scrollRail(pathRow, step)} className="path-controls" />
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
              <p data-type="editorial-body">One AI guide for learning, teaching and building. Use the workspace in English, Hindi or Bengali.</p>
              <Link to="/how-it-works" className="home-text-link">How it works <ChevronRight aria-hidden="true" size={17} /></Link>
            </div>
            <picture className="intelligence-portrait" aria-hidden="true">
              <source type="image/avif" srcSet={heroBotAvif} />
              <img src={heroBotWebp} width="1400" height="1774" alt="" loading="lazy" decoding="async" />
            </picture>
          </div>
        </section>
        <SharedChallenge />
        <LearningLoop />
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
            <RailControls id="trust-values" label="value" onStep={(step) => scrollRail(trustRow, step)} className="trust-controls" />
          </div>
        </section>
        <section className="home-closing" data-section="12-cta" aria-labelledby="closing-heading">
          <div className="closing-frame">
            <div className="closing-panel closing-layout">
              <div className="closing-copy">
                <h2 id="closing-heading" data-type="section">{signedIn ? "Continue in Visionary." : "Start with your own question."}</h2>
                <p className="closing-line" data-type="editorial-body">Free to start. Private by design.</p>
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
