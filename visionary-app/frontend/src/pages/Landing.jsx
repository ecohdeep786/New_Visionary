import "./landing-home.css";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/NewPersona";
import { Link } from "react-router-dom";
import heroBotWebp from "@/assets/brand/visionary-bot.webp";
import heroBotAvif from "@/assets/brand/visionary-bot.avif";
// Each audience destination keeps its original portrait.
import studentmeet from "@/assets/audience-portraits/student.webp";
import teachermeet from "@/assets/audience-portraits/teacher.webp";
import parentmeet from "@/assets/audience-portraits/parent.webp";
import promeet from "@/assets/audience-portraits/professional.webp";
import orgmeet from "@/assets/audience-portraits/organization.webp";
import { ChevronRight, Lock } from "lucide-react";

import { useSignedIn } from "@/components/landing/AuthAwareLink";

const AUDIENCES = [
  {
    slug: "student", label: "Students", castLabel: "Student", portrait: studentmeet,
    headline: "to a project.", detail: "Work through a tough lesson and try it for yourself.",
  },
  {
    slug: "teacher", label: "Teachers", castLabel: "Teacher", portrait: teachermeet,
    headline: "to a lesson.", detail: "Find another way to explain a difficult idea.",
  },
  {
    slug: "parent", label: "Parents", castLabel: "Parent", portrait: parentmeet,
    headline: "to a conversation.", detail: "Follow the progress your child shares with you.",
  },
  {
    slug: "professional", label: "Professionals", castLabel: "Professional", portrait: promeet,
    headline: "to a new skill.", detail: "Turn a skill you’re learning into work you can show.",
  },
  {
    slug: "organization", label: "Organizations", castLabel: "Organization", portrait: orgmeet,
    headline: "to a team plan.", detail: "Coordinate learning across classes or teams.",
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

const LEARNING_STEPS = [
  { name: "Learn", detail: "Start with an idea you want to understand." },
  { name: "Ask", detail: "Get another explanation where you’re stuck." },
  { name: "Practise", detail: "Try it yourself and see what you understand." },
  { name: "Build", detail: "Put the idea to work in a project." },
];

function LearningJourney() {
  return (
    <section data-section="06-journey" className="home-journey" aria-labelledby="journey-heading">
      <div className="home-width">
        <div className="journey-intro">
          <h2 id="journey-heading" data-type="section">Different goals. <br />The same disconnect.</h2>
          <p data-type="editorial-body">A lesson in one place, practice in another, and a project you have to start from scratch. Visionary brings those steps together.</p>
        </div>
        <ol className="journey-steps" role="list" aria-label="How Visionary connects learning and building">
          {LEARNING_STEPS.map(({ name, detail }) => (
            <li key={name}>
              <h3 data-type="feature-heading">{name}</h3>
              <p>{detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function AudienceDirectory() {
  return (
    <section id="audiences" tabIndex={-1} data-section="13-explore" className="home-audiences" aria-labelledby="audiences-title">
      <div className="home-width audience-layout">
        <h2 id="audiences-title" data-type="section">Find your path.</h2>
        <nav aria-label="Audience pages">
          {AUDIENCES.map((role) => (
            <Link key={role.slug} to={`/${role.slug}`} tabIndex={0} className="audience-destination">
              <span className="destination-portrait"><img src={role.portrait} width="224" height="224" alt="" loading="lazy" decoding="async" /></span>
              <span className="destination-copy">
                <strong>{role.label}</strong>
                <span>{role.detail}</span>
              </span>
              <ChevronRight className="destination-arrow" size={21} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const signedIn = useSignedIn();
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
              <h2 id="intelligence-heading" data-type="section">One Intelligence.</h2>
              <p data-type="editorial-body">One AI guide connects what you learn to what you build. Use the workspace in English, Hindi or Bengali.</p>
              <Link to="/how-it-works" className="home-text-link">How it works <ChevronRight aria-hidden="true" size={17} /></Link>
            </div>
            <picture className="intelligence-portrait" aria-hidden="true">
              <source type="image/avif" srcSet={heroBotAvif} />
              <img src={heroBotWebp} width="1400" height="1774" alt="" loading="lazy" decoding="async" />
            </picture>
          </div>
        </section>
        <LearningJourney />
        <AudienceDirectory />
        <section className="home-privacy" data-section="11-trust" aria-labelledby="privacy-heading">
          <div className="home-width">
            <Lock className="privacy-mark" strokeWidth={1.6} size={32} aria-hidden="true" />
            <h2 id="privacy-heading" data-type="section">Know what’s shared.</h2>
            <p data-type="editorial-body">Teachers and connected parents can follow shared progress. Your private conversations stay out of those views.</p>
            <Link to="/privacy#sharing" className="home-text-link">How sharing works <ChevronRight aria-hidden="true" size={17} /></Link>
          </div>
        </section>
        <section className="home-closing" data-section="12-cta" aria-labelledby="closing-heading">
          <div className="home-width closing-layout">
            <h2 id="closing-heading" data-type="section">{signedIn ? "Continue in Visionary." : "Start with your own question."}</h2>
            <Link className="home-action public-action" to={signedIn ? "/dashboard/home" : "/register"}>
              {signedIn ? "Open Visionary" : "Create an account"}
            </Link>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" compactOnMobile />
    </div>
  );
}
