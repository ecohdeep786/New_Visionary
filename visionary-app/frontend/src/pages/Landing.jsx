import { useState } from "react";
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
import studentQuestionImage from "@/assets/problem-cutouts/student-question.webp";
import teacherQuestionImage from "@/assets/problem-cutouts/teacher-question.webp";
import parentQuestionImage from "@/assets/problem-cutouts/parent-question.webp";
import professionalQuestionImage from "@/assets/problem-cutouts/professional-question.webp";
import organizationQuestionImage from "@/assets/problem-cutouts/organization-question.webp";
import { Accessibility, ChevronRight, Lock, ShieldCheck } from "lucide-react";

import { useSignedIn } from "@/components/landing/AuthAwareLink";

const AUDIENCES = [
  {
    slug: "student", label: "Students", castLabel: "Student", portrait: studentLineup,
    headline: "to a project.",
    outcome: "Make sense of what you learn.",
    roleLabel: "For every student, at every stage",
    question: "Why doesn’t this make sense yet?",
    example: "Shade one half and two quarters on equal-sized bars. Seeing the same area can make equivalent fractions click.",
    questionImage: studentQuestionImage,
  },
  {
    slug: "teacher", label: "Teachers", castLabel: "Teacher", portrait: teachermeet,
    headline: "to a lesson.",
    outcome: "Plan for what your class needs.",
    roleLabel: "For every teacher, in every classroom",
    question: "Did it land with everyone?",
    example: "Ask your class to draw two ways to make a half. Their drawings can show who needs another explanation.",
    questionImage: teacherQuestionImage,
  },
  {
    slug: "parent", label: "Parents", castLabel: "Parent", portrait: parentmeet,
    headline: "to a conversation.",
    outcome: "See where your child needs help.",
    roleLabel: "For every parent, at every age",
    question: "What did they really understand?",
    example: "A shared summary could point to fractions as the next thing to practice, so you know what to ask about at home.",
    questionImage: parentQuestionImage,
  },
  {
    slug: "professional", label: "Professionals", castLabel: "Professional", portrait: promeet,
    headline: "to a new skill.",
    outcome: "Put new skills to work.",
    roleLabel: "For every professional, in every field",
    question: "How do I use this in my work?",
    example: "Build a spreadsheet budget with sample data, then use the same formulas for a budget you manage at work.",
    questionImage: professionalQuestionImage,
  },
  {
    slug: "organization", label: "Organizations", castLabel: "Organization", portrait: orgmeet,
    headline: "to a team plan.",
    outcome: "Find learning gaps across teams.",
    roleLabel: "For every organization, across every team",
    question: "Where are the gaps across our teams?",
    example: "Have a team rehearse a customer handoff. Team-level results could show which step needs more practice.",
    questionImage: organizationQuestionImage,
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
    title: "Who can see what?",
    copy: "See which information is private and what can be shared with families, classrooms and teams.",
    link: "How sharing works",
    to: "/privacy#sharing",
    Icon: Lock,
  },
  {
    title: "Safety for learners.",
    copy: "Read about age eligibility, guardian verification and reporting.",
    link: "How safety works",
    to: "/safety",
    Icon: ShieldCheck,
  },
  {
    title: "Ways to access Visionary.",
    copy: "Find language, keyboard and display options for learning.",
    link: "Accessibility",
    to: "/accessibility",
    Icon: Accessibility,
  },
];

function AudienceQuestions() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const role = AUDIENCES[selectedIndex];
  return (
    <section data-section="06-questions" className="home-questions" aria-labelledby="questions-heading">
      <div className="questions-frame">
        <h2 id="questions-heading" className="questions-heading" data-type="section">Every path starts with a question.</h2>
        <p className="questions-intro" data-type="body">Examples of the guided tools we’re building.</p>
        <div className="question-choices" role="group" aria-label="Explore examples by audience">
          {AUDIENCES.map(({ slug, label }, index) => (
            <button
              key={slug}
              type="button"
              aria-controls="question-example-panel"
              aria-pressed={selectedIndex === index}
              onClick={() => setSelectedIndex(index)}
            >
              {label}
            </button>
          ))}
        </div>
        <div id="question-example-panel" className="question-card" data-audience={role.slug}>
          <div className="question-copy">
            <div aria-live="polite" aria-atomic="true">
              <span className="question-role" data-type="body">{role.roleLabel}</span>
              <p className="question-text" data-type="editorial-card">{role.question}</p>
              <p className="question-example" data-type="body">{role.example}</p>
            </div>
            <Link to={`/${role.slug}`} tabIndex={0} className="home-text-link question-link">
              Explore for {role.label.toLowerCase()} <ChevronRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="question-media">
            <img
              key={role.slug}
              src={role.questionImage}
              width="800"
              height="800"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AudienceDirectory() {
  return (
    <section id="audiences" tabIndex={-1} data-section="13-explore" className="home-audiences" aria-labelledby="audiences-title">
      <div className="path-frame">
        <div className="path-intro">
          <h2 id="audiences-title" data-type="section">Find your path.</h2>
          <p id="path-status" className="path-note" data-type="metadata">Preview guided tools in development.</p>
        </div>
        <nav id="audience-paths" aria-label="Audience pages" aria-describedby="path-status" className="path-row">
          {AUDIENCES.map((role) => (
            <Link key={role.slug} to={`/${role.slug}`} tabIndex={0} className="path-card">
              <span className="path-media">
                <img src={role.portrait} width="224" height="224" alt="" loading="lazy" decoding="async" />
              </span>
              <span className="path-body">
                <strong className="path-title">{role.label}</strong>
                <span className="path-outcome">{role.outcome}</span>
              </span>
              <ChevronRight className="path-arrow" size={20} aria-hidden="true" />
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
        <AudienceDirectory />
        <AudienceQuestions />
        <section id="intelligence" tabIndex={-1} data-section="05-intelligence" className="scene-dark home-intelligence" aria-labelledby="intelligence-heading">
          <div className="home-width intelligence-layout">
            <div className="intelligence-copy">
              <h2 id="intelligence-heading" data-type="display">One Intelligence.</h2>
              <p data-type="editorial-body">One workspace designed to adapt explanations, show where help is needed and put learning to work.</p>
              <p className="intelligence-note" data-type="body">Today you can set up an account and view any saved learning history. Guided tools are in development. Selected workspace screens support English, Hindi and Bengali.</p>
              <Link to="/how-it-works" className="home-text-link">How it works <ChevronRight aria-hidden="true" size={17} /></Link>
            </div>
            <picture className="intelligence-portrait" aria-hidden="true">
              <source type="image/avif" srcSet={heroBotAvif} />
              <img src={heroBotWebp} width="1400" height="1774" alt="" loading="lazy" decoding="async" />
            </picture>
          </div>
        </section>
        <section className="home-privacy" data-section="11-trust" aria-labelledby="trust-heading">
          <div className="trust-frame">
            <h2 id="trust-heading" data-type="card-chapter">Your learning stays yours.</h2>
            <div id="trust-values" className="trust-row">
              {TRUST_VALUES.map(({ title, copy, link, to, Icon }) => (
                <div key={title} className="trust-card">
                  <Icon className="trust-icon" strokeWidth={1.7} size={32} aria-hidden="true" />
                  <h3 data-type="feature">{title}</h3>
                  <p data-type="value-body">{copy}</p>
                  <Link to={to} className="home-text-link">{link} <ChevronRight aria-hidden="true" size={17} /></Link>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="home-closing" data-section="12-cta" aria-labelledby="closing-heading">
          <div className="closing-frame">
            <div className="closing-panel closing-layout">
              <div className="closing-copy">
                <h2 id="closing-heading" data-type="section">{signedIn ? "Continue in Visionary." : "Start with a free profile."}</h2>
                <p className="closing-line" data-type="editorial-body">{signedIn ? "Return to your workspace." : "Choose your role during setup. Workspace access is currently for adults."}</p>
              </div>
              <div className="closing-actions">
                <Link className="home-action public-action" to={signedIn ? "/dashboard/home" : "/register"}>
                  {signedIn ? "Open Visionary" : "Create an account"}
                </Link>
                <Link className="home-text-link closing-secondary" to="/how-it-works">
                  See how it works <ChevronRight aria-hidden="true" size={16} />
                </Link>
                <Link className="home-text-link closing-secondary" to="/contact#organization-enquiries">
                  School and team rollouts <ChevronRight aria-hidden="true" size={16} />
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
