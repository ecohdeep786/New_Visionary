import "./landing-home.css";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/NewPersona";
import { Link } from "react-router-dom";
import heroBotWebp from "@/assets/brand/visionary-bot.webp";
import heroBotAvif from "@/assets/brand/visionary-bot.avif";
// Each audience destination keeps its original portrait.
import studentmeet from "@/assets/student-hero-main-1600w.webp";
import teachermeet from "@/assets/teacher-hero-main-1600w.webp";
import parentmeet from "@/assets/parent-hero-main-1600w.webp";
import promeet from "@/assets/pro-face-main-1600w.webp";
import orgmeet from "@/assets/org-face-main-1600w.webp";
import { ChevronRight, Lock } from "lucide-react";

import { useSignedIn } from "@/components/landing/AuthAwareLink";

const AUDIENCES = [
  {
    slug: "student", label: "Students", castLabel: "Student", portrait: studentmeet,
    headline: "to a project.", detail: "Work through a tough lesson and try it for yourself.",
  },
  {
    slug: "teacher", label: "Teachers", castLabel: "Teacher", portrait: teachermeet,
    headline: "to a lesson.", detail: "See where a learner needs another explanation.",
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
    headline: "to a team plan.", detail: "Bring your people and their learning together.",
  },
];

// The original responsive cutouts compose the full audience lineup.
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
  lcpPreload.setAttribute("fetchpriority", "high");
  document.head.appendChild(lcpPreload);
}

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

function AudienceDirectory() {
  return (
    <section id="audiences" tabIndex={-1} data-section="13-explore" className="home-audiences" aria-labelledby="audiences-title">
      <div className="home-width audience-layout">
        <h2 id="audiences-title" data-type="section">Find your path.</h2>
        <nav aria-label="Audience pages">
          {AUDIENCES.map((role) => (
            <Link key={role.slug} to={`/${role.slug}`} tabIndex={0} className="audience-destination">
              <span className="destination-portrait"><img src={role.portrait} alt="" loading="lazy" decoding="async" /></span>
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
              <h2 id="intelligence-heading" data-type="section">Visionary Intelligence.</h2>
              <p data-type="editorial-body">Get an explanation for the step you missed. Practise it in Learn and put it to work in Build.</p>
              <Link to="/how-it-works" className="home-text-link">How it works <ChevronRight aria-hidden="true" size={17} /></Link>
            </div>
            <picture className="intelligence-portrait" aria-hidden="true">
              <source type="image/avif" srcSet={heroBotAvif} />
              <img src={heroBotWebp} alt="" loading="lazy" decoding="async" />
            </picture>
          </div>
        </section>
        <AudienceDirectory />
        <section className="home-privacy" data-section="11-trust" aria-labelledby="privacy-heading">
          <div className="home-width">
            <Lock className="privacy-mark" strokeWidth={1.6} size={32} aria-hidden="true" />
            <h2 id="privacy-heading" data-type="section">Know what’s shared.</h2>
            <p data-type="editorial-body">Teachers and connected parents can see shared progress. Private conversations stay out of those views.</p>
            <Link to="/privacy#sharing" className="home-text-link">How sharing works <ChevronRight aria-hidden="true" size={17} /></Link>
          </div>
        </section>
        <section className="home-closing" data-section="12-cta" aria-labelledby="closing-heading">
          <div className="home-width closing-layout">
            <h2 id="closing-heading" data-type="section">{signedIn ? "Continue in Visionary." : "Start your workspace."}</h2>
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
