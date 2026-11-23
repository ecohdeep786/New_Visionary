import "./landing-home.css";
import React, { lazy, Suspense, useState } from "react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { BRIDGE_EXAMPLE, PLANNING_EXAMPLE } from "@/components/landing/landingExamples";
import PersonaHero from "@/components/landing/NewPersona";
import { Link } from "react-router-dom";
import heroBotWebp from "@/assets/brand/visionary-bot.webp";
import heroBotAvif from "@/assets/brand/visionary-bot.avif";
/* The shared sections sit below the fold;
 * they load on demand (Suspense fallback null) so the entry graph carries
 * only hero-first-commit content (T13 eager law). Direct module paths, not
 * the barrel, so a section chunk never pulls its siblings. */

const PremiumTrustSection = lazy(() => import("@/components/landing/persona/premium/PremiumTrustSection.jsx"));
const PremiumCTASection = lazy(() => import("@/components/landing/persona/premium/PremiumCTASection.jsx"));
// These five portraits appear in the audience gallery.
import studentmeet from "@/assets/student-hero-main-1600w.webp";
import teachermeet from "@/assets/teacher-hero-main-1600w.webp";
import parentmeet from "@/assets/parent-hero-main-1600w.webp";
import promeet from "@/assets/pro-face-main-1600w.webp";
import orgmeet from "@/assets/org-face-main-1600w.webp";
// Problem section images — loaded lazily (below the fold)
import problemunderstanding from "@/assets/problem-understanding.webp";
import proProblem from "@/assets/professional-problem-2.webp";
import { Accessibility, ChevronDown, ChevronRight, HeartHandshake, Lock, ShieldCheck } from "lucide-react";

import { useAuth } from "@/lib/AuthContext";

const AUDIENCES = [
  {
    slug: "student", label: "Students", castLabel: "Student", headline: "Learn by doing.",
    question: "Where did I lose the thread?", answer: "Go back to the step that felt unclear. Ask about it in your own language, then try a practice question before moving on.",
    detail: "Lessons, practice and projects", portrait: studentmeet, scene: problemunderstanding, example: BRIDGE_EXAMPLE,
  },
  {
    slug: "teacher", label: "Teachers", castLabel: "Teacher", headline: "Teach with insight.",
    question: "Who needs another explanation?", answer: "Bring the assignment, submissions and feedback into one class workspace. Read a learner’s work and respond to the step they missed.",
    detail: "Classwork, submissions and feedback", portrait: teachermeet,
  },
  {
    slug: "parent", label: "Parents", castLabel: "Parent", headline: "Follow progress.",
    question: "How can I help from home?", answer: "Use the learning summary your child shares to start a conversation. See what they’ve been working on and ask what they’d like to try next.",
    detail: "Shared progress for parents and guardians", portrait: parentmeet,
  },
  {
    slug: "professional", label: "Professionals", castLabel: "Professional", headline: "Put skills to work.",
    question: "How do I use what I just learned?", answer: "Start with a skill you need at work. Set a goal, practise it and build a project you can return to and refine.",
    detail: "Skill goals, projects and portfolios", portrait: promeet, scene: proProblem, example: PLANNING_EXAMPLE,
  },
  {
    slug: "organization", label: "Organizations", castLabel: "Organization", headline: "Grow your team.",
    question: "How do we learn together?", answer: "Invite colleagues into a shared workspace. Organize members into cohorts so each group can find the learning meant for them.",
    detail: "Members, cohorts and shared learning", portrait: orgmeet,
  },
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

const LandingHeroSection = React.memo(function LandingHeroSection() {
  const { authChecked, isAuthenticated } = useAuth();
  const signedIn = authChecked && isAuthenticated;

  return (
    <PersonaHero
      cast={LANDING_HERO_LINEUP}
      audiences={AUDIENCES}
      ctaTo={signedIn ? "/dashboard/home" : "/register"}
      ctaLabel={signedIn ? "Open Visionary" : "Create an account"}
    />
  );
});

function LessonExample({ content, language, setLanguage }) {
  const lesson = content[language];
  return (
    <details className="challenge-example">
      <summary>Explore a sample lesson</summary>
      <label>
        Example language
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          {Object.entries(content).map(([code, item]) => (
            <option key={code} value={code} lang={code}>{item.language}</option>
          ))}
        </select>
      </label>
      <div lang={language} className="home-example-text">
        <h4>{lesson.question}</h4><p>{lesson.explanation}</p>
        <h4>{lesson.prompt}</h4><p>{lesson.activity}</p>
      </div>
    </details>
  );
}

function LandingChallenges() {
  const [active, setActive] = useState("student");
  const [language, setLanguage] = useState("en");
  return (
    <section id="lesson-example" tabIndex={-1} data-section="02-problem" aria-labelledby="challenges-title" className="home-challenges">
      <div className="home-frame">
        <h2 id="challenges-title" data-type="section">What’s getting in your way?</h2>
        <div className="challenge-layout">
          {AUDIENCES.map((role) => {
            const expanded = role.slug === active;
            return (
              <div className="challenge-row" key={role.slug}>
                <h3 data-type="editorial-card">
                  <button type="button" aria-expanded={expanded} aria-controls={`challenge-${role.slug}`}
                    aria-disabled={expanded} onClick={() => setActive(role.slug)}>
                    <span><small>{role.label}</small>{role.question}</span>
                    <ChevronDown aria-hidden="true" size={20} />
                  </button>
                </h3>
                <div id={`challenge-${role.slug}`} hidden={!expanded}>
                  {expanded && <>
                    <p className="challenge-answer">{role.answer}</p>
                    {role.example && <LessonExample content={role.example} language={language} setLanguage={setLanguage} />}
                    <div className="challenge-photo"><img src={role.scene || role.portrait} alt="" loading="lazy" decoding="async" /></div>
                  </>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LandingRouterSection() {
  return (
    <section id="audiences" tabIndex={-1} data-section="13-explore" className="audience-directory" aria-labelledby="audiences-title">
      <div className="home-frame">
        <h2 id="audiences-title" data-type="section">Find your Visionary.</h2>
        <nav aria-label="Audience pages">
          {AUDIENCES.map((role) => (
            <Link key={role.slug} to={`/${role.slug}`} className="audience-destination">
              <span className="destination-portrait"><img src={role.portrait} alt="" loading="lazy" decoding="async" /></span>
              <span className="destination-copy"><strong>{role.label}</strong><span>{role.detail}</span></span>
              <span className="destination-arrow"><ChevronRight size={20} aria-hidden="true" /></span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="page-landing min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main" tabIndex={-1}>
        <LandingHeroSection />
        <section data-section="05-intelligence" className="scene-dark home-product relative isolate overflow-hidden">
          <div className="public-editorial-frame mx-auto">
            <div className="home-product-copy">
              <h2 data-type="section">Meet Visionary <span className="accent-gradient-on-dark">Intelligence.</span></h2>
              <div><p data-type="editorial-body">Ask about the part that hasn’t clicked. Practise it in Learn, then take the same idea into Build and make something with it.</p></div>
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
        <LandingChallenges />
        <LandingRouterSection />
        <Suspense fallback={null}><PremiumTrustSection
          heading={<>Know what you <span className="accent-gradient">share.</span></>}
          sub="See how Visionary handles learning data, account access and consent."
          values={LX_TRUST_VALUES}
        /></Suspense>
        <Suspense fallback={null}><PremiumCTASection
          variant="closing"
          heading="Your workspace starts here."
          sub="Choose the workspace that fits how you learn, teach or support others."
        /></Suspense>
      </main>
      <LandingFooter variant="quiet" compactOnMobile />
    </div>
  );
}
