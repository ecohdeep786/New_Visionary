import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import AboutUsHero from "@/components/landing/AboutUsHero";
import SpotIllustration from "@/components/landing/SpotIllustration";
import LazyImage from "@/components/landing/LazyImage";
import { ChevronIcon } from "@/components/landing/persona/PersonaSections";
import studentImage from "@/assets/student-hero-main-1600w.webp";
import teacherImage from "@/assets/teacher-hero-main-1600w.webp";
import parentImage from "@/assets/parent-hero-main-1600w.webp";
import professionalImage from "@/assets/pro-face-main-1600w.webp";
import organizationImage from "@/assets/org-face-main-1600w.webp";
import imgStagePrimary from "@/assets/student-primary.webp";
import imgStageSecondary from "@/assets/student-secondary.webp";
import imgStageCompetitive from "@/assets/student-competitive.webp";
import imgStageHigher from "@/assets/student-higher.webp";
import { fontStack } from "@/components/landing/system/tokens";

/* ═══ Tokens — the shared premium dialect (#1d1d1f ink, #0066cc/#0066cc
   accents, #f5f5f7 fields under borderless white cards, pill buttons). ═══ */

const ROLES = [
  { to: "/student", label: "Students", line: "From first concepts to higher education and learning on your own.", image: studentImage },
  { to: "/teacher", label: "Teachers", line: "Plan, explain, and support the people learning with you.", image: teacherImage },
  { to: "/parent", label: "Parents", line: "Understand progress and support the next step at home.", image: parentImage },
  { to: "/professional", label: "College & careers", line: "Turn study and experience into practical skills and work.", image: professionalImage },
  { to: "/organization", label: "Organizations", line: "Connect learning across classrooms, teams, and institutions.", image: organizationImage },
];

/* The difference we want to make — quiet white cards on the grey field:
   accent label, big illustration, problem headline, and the building-toward
   answer. */
const IMPACT = [
  { number: "01", problem: "A missed idea can follow someone for years.", answer: "Give each person a way to revisit what they missed, ask in their own words, and keep moving with more confidence.", subject: "ask", accent: "#0066cc" },
  { number: "02", problem: "The people helping them see different pieces.", answer: "Make learning easier to understand for educators and families, so their support can meet the person where they are.", subject: "community", accent: "#0066cc" },
  { number: "03", problem: "A new direction can feel like starting from zero.", answer: "Help people connect what they already know to the skills, decisions, and opportunities in front of them.", subject: "briefcase", accent: "#0066cc" },
];

/* A life in motion — photo cards: real photography of the stages, white
   cards, label + title below the photo. */
const LIFE_STAGES = [
  { number: "01", title: "Find a way in", copy: "An early question becomes something a person can understand.", photo: imgStagePrimary, alt: "A young learner taking a first step into a new idea" },
  { number: "02", title: "Grow with support", copy: "Teachers, families, and mentors help progress take shape.", photo: imgStageSecondary, alt: "A student growing through school years with support" },
  { number: "03", title: "Choose what comes next", copy: "Learning becomes a skill, a project, or a new direction.", photo: imgStageCompetitive, alt: "A student preparing for the choices ahead" },
  { number: "04", title: "Keep growing", copy: "Experience continues through work, change, and helping others.", photo: imgStageHigher, alt: "A learner carrying understanding into what comes next" },
];

const EXPLORE = [
  { to: "/research", label: "Research", copy: "The questions and ideas shaping our approach.", subject: "research" },
  { to: "/careers", label: "Careers", copy: "Meet the work and find your place in the team.", subject: "briefcase" },
  { to: "/safety", label: "Safety", copy: "How we think about safer use and clear reporting.", subject: "shield" },
  { to: "/updates", label: "Updates", copy: "Follow what is changing across the product.", subject: "updates" },
];

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") { setVisible(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "0px 0px -8% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "" }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} className={`${className} transition duration-700 ease-apple motion-reduce:transform-none motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>{children}</div>;
}

function Eyebrow({ children }) {
  return <p className="apple-eyebrow text-[#6e6e73]">{children}</p>;
}

function ArrowLink({ to, children, className = "", style }) {
  return <Link to={to} style={style} className={`group relative after:absolute after:-inset-y-3 after:-inset-x-2 inline-flex w-fit items-center gap-1.5 rounded-sm text-[18px] font-medium tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 ${className}`}>{children}<ChevronIcon className="h-4 w-4" /></Link>;
}

function MissionSection() {
  return <section id="mission" data-section="02-mission" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">
    <Reveal className="mx-auto max-w-[1240px]">
      <Eyebrow>Why Visionary exists</Eyebrow>
      <div className="mt-5 grid gap-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
        <h2 className="max-w-[760px] text-[40px] font-normal leading-[1.07] tracking-[-0.045em] text-[#1d1d1f] sm:text-[52px] lg:text-[64px]">Understanding should open the next door.</h2>
        <p className="max-w-[480px] pb-1 text-[18px] leading-[1.65] text-[#6e6e73]">People move between classrooms, homes, work, and new ambitions. Too often, what they have learned gets left behind at each change. We are building Visionary so understanding can grow with them.</p>
      </div>
      <div id="team" className="relative mt-14 grid scroll-mt-28 gap-3 overflow-hidden rounded-[30px] bg-[#f5f5f7] p-4 sm:p-6 md:grid-cols-[1.1fr_0.9fr] lg:p-10">
        <div className="flex min-h-[320px] flex-col rounded-[20px] bg-white p-8 sm:p-10 lg:p-14">
          <p className="apple-eyebrow text-[#6e6e73]">Our mission</p>
          <span aria-hidden="true" className="mt-8 select-none text-[88px] font-medium leading-[0.55] text-[#0066cc]">"</span>
          <p className="max-w-[760px] text-[clamp(28px,2.78vw,40px)] font-normal text-[#1d1d1f]">
            Build AI intelligence for anyone, anywhere, from student to organization, in India's native languages.
          </p>
          <p className="mt-10 text-[14px] text-[#1d1d1f]">Visionary · the mission we build toward</p>
        </div>
        <div className="flex min-h-[260px] items-center justify-center rounded-[20px] bg-white p-8 pb-20 sm:pb-24"><SpotIllustration subject="loop" className="h-56 w-56 sm:h-72 sm:w-72" title="One intelligence across every learner" /></div>
        {/* google.com card curve — the field's cutout sweeps into the
            bottom-right of the illustration card and the action pill
            floats in it with breathing room */}
        <div aria-hidden="true" className="absolute bottom-0 right-0 h-[72px] w-[240px] rounded-tl-[28px] bg-white" />
        <Link to="/how-it-works" className="absolute bottom-3 right-3 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-6 font-medium tracking-[0.24px] text-[16px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2">See how it works<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
    </Reveal>
  </section>;
}

function ImpactSection() {
  return <section data-section="04-impact" className="px-6 sm:px-8 lg:px-10">
    <Reveal className="mx-auto max-w-[1240px]">
      <Eyebrow>The difference we want to make</Eyebrow>
      <div className="mt-5 grid gap-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
        <h2 className="max-w-[790px] text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#1d1d1f] sm:text-[48px]">AI can make the next step clearer.</h2>
        <p className="max-w-[430px] pb-1 text-[17px] leading-[1.65] text-[#6e6e73]">The challenge is bigger than answering a question. It is helping people keep their context, understand their choices, and use what they know as life changes.</p>
      </div>
      <div className="mt-12 rounded-[30px] bg-[#f5f5f7] p-4 sm:p-6 lg:p-10">
        <div className="grid gap-3 lg:grid-cols-3">
          {IMPACT.map((item) => <article key={item.number} className="flex min-h-[470px] flex-col rounded-[20px] bg-white p-8">
            <span className="apple-eyebrow" style={{ color: item.accent }}>{item.number} / The challenge</span>
            <SpotIllustration subject={item.subject} className="mx-auto my-7 h-40 w-40 sm:my-9 sm:h-44 sm:w-44" />
            <h3 className="max-w-[360px] text-[25px] font-normal leading-[1.2] tracking-[-0.02em] text-[#1d1d1f]">{item.problem}</h3>
            <div className="mt-auto pt-8">
              <p className="apple-eyebrow" style={{ color: item.accent }}>What Visionary is building toward</p>
              <p className="mt-3 text-[16px] leading-[1.6] text-[#1d1d1f]">{item.answer}</p>
            </div>
          </article>)}
        </div>
      </div>
      <ArrowLink to="/how-it-works" className="mt-10">See how Visionary works</ArrowLink>
    </Reveal>
  </section>;
}

function RolesSection() {
  return <section data-section="05-roles" className="px-6 sm:px-8 lg:px-10">
    <Reveal className="mx-auto max-w-[1240px]">
      <Eyebrow>For every perspective</Eyebrow>
      <div className="mt-5 grid gap-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
        <h2 className="max-w-[760px] text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#1d1d1f] sm:text-[48px]">Different people, one connected journey.</h2>
        <p className="max-w-[360px] pb-1 text-[16px] leading-[1.65] text-[#6e6e73]">
          Find the experience that fits your work today. Visionary can keep growing with where you go next.
        </p>
      </div>
      <div className="mt-12 rounded-[30px] bg-[#f5f5f7] p-4 sm:p-6 lg:p-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {ROLES.map((role) => <Link key={role.label} to={role.to} className="group relative flex flex-col overflow-hidden rounded-[20px] bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] lg:col-span-2">
            <div className="overflow-hidden"><LazyImage src={role.image} alt="" className="h-[190px] w-full object-contain object-bottom transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transform-none" /></div>
            <div className="flex flex-1 flex-col p-6 pb-16"><h3 className="text-[22px] font-normal text-[#1d1d1f]">{role.label}</h3><p className="mt-3 max-w-[420px] text-[14px] leading-[1.6] text-[#6e6e73]">{role.line}</p></div>
            {/* google.com card curve — the card's cutout sweeps into the
                bottom-right corner and the action button floats in it with breath */}
            <div aria-hidden="true" className="absolute bottom-0 right-0 h-[72px] w-[192px] rounded-tl-[24px] bg-white" />
            <span className="absolute bottom-3 right-3 inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-[#1d1d1f] px-6 font-medium tracking-[0.24px] text-[14px] text-white transition-colors duration-200 group-hover:bg-[#272729]">Explore<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" /></span>
          </Link>)}
        </div>
      </div>
    </Reveal>
  </section>;
}

function LifeJourneySection() {
  return <section data-section="03-journey" className="px-6 sm:px-8 lg:px-10">
    <Reveal className="mx-auto max-w-[1240px]">
      <Eyebrow>A life in motion</Eyebrow>
      <div className="mt-5 grid gap-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
        <h2 className="max-w-[780px] text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#1d1d1f] sm:text-[48px]">One journey, many beginnings.</h2>
        <p className="max-w-[470px] pb-1 text-[17px] leading-[1.65] text-[#6e6e73]">A first lesson, a new skill, a different career, and the chance to guide someone else are not separate stories. Visionary exists for learning that continues through them all.</p>
      </div>
      <ol className="mt-14 grid gap-3 rounded-[30px] bg-[#f5f5f7] p-4 sm:p-6 md:grid-cols-2 lg:grid-cols-4 lg:p-10">
        {LIFE_STAGES.map((stage) => <li key={stage.number} className="flex flex-col overflow-hidden rounded-[20px] bg-white">
          <LazyImage src={stage.photo} alt={stage.alt} className="aspect-[4/3] w-full object-cover" />
          <div className="flex flex-1 flex-col p-6">
            <span className="text-[13px] font-medium tabular-nums text-[#6e6e73]">{stage.number} / 04</span>
            <h3 className="mt-3 text-[22px] font-normal leading-[1.18] tracking-[-0.02em] text-[#1d1d1f]">{stage.title}</h3>
            <p className="mt-2 text-[14px] leading-[1.6] text-[#6e6e73]">{stage.copy}</p>
          </div>
        </li>)}
      </ol>
      <div className="mt-10 flex flex-col gap-5 border-t border-[rgba(18,19,23,0.12)] pt-8 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-[660px] text-[18px] leading-[1.55] text-[#1d1d1f]">Wherever someone begins, what they learn should remain useful for what comes next.</p><ArrowLink to="/how-it-works" className="shrink-0">See how it works</ArrowLink></div>
    </Reveal>
  </section>;
}

function ExploreSection() {
  return <section data-section="06-explore" className="px-6 sm:px-8 lg:px-10">
    <Reveal className="mx-auto max-w-[1240px]">
      <Eyebrow>Explore further</Eyebrow><h2 className="mt-5 max-w-[760px] text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#1d1d1f] sm:text-[48px]">The work around the product.</h2>
      <div className="mt-12 rounded-[30px] bg-[#f5f5f7] p-4 sm:p-6 lg:p-10">
        <div className="grid gap-3 sm:grid-cols-2">
          {EXPLORE.map((item) => <Link key={item.to} to={item.to} className="group relative grid min-h-[220px] grid-cols-[1fr_130px] overflow-hidden rounded-[20px] bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] sm:grid-cols-[1fr_180px]">
            <div className="flex flex-col justify-between p-6 sm:p-8"><div><h3 className="text-[24px] font-normal text-[#1d1d1f]">{item.label}</h3><p className="mt-3 max-w-[300px] text-[16px] leading-[1.6] text-[#6e6e73]">{item.copy}</p></div></div>
            <div className="flex items-center justify-center bg-[#f5f5f7]"><SpotIllustration subject={item.subject} className="h-28 w-28 sm:h-36 sm:w-36" /></div>
            {/* google.com card curve — the card's cutout sweeps into the
                bottom-right corner and the card's arrow floats in it with breath */}
            <div aria-hidden="true" className="absolute bottom-0 right-0 h-[56px] w-[92px] rounded-tl-[20px] bg-white" />
            <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center"><ArrowRight className="h-5 w-5 text-[#0066cc] transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" /></div>
          </Link>)}
        </div>
      </div>
    </Reveal>
  </section>;
}

function FinalCta() {
  return <section data-section="07-cta" className="relative rounded-t-[32px] bg-[#f5f5f7] px-6 text-center sm:px-8 lg:px-10"><Reveal className="mx-auto max-w-[840px]"><Eyebrow>Start where you are</Eyebrow><h2 className="mt-5 text-[40px] font-normal leading-[1.08] tracking-[-0.04em] text-[#1d1d1f] sm:text-[56px]">There is a place for you in Visionary.</h2><div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"><Link to="/register" className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full bg-[#1d1d1f] px-7 font-medium tracking-[0.24px] text-[17px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px]">Get started</Link><Link to="/contact" className="inline-flex h-12 items-center justify-center gap-1.5 whitespace-nowrap px-4 text-[18px] font-medium tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px]">Contact Visionary<ChevronIcon className="h-4 w-4" /></Link></div><p className="mt-8 text-center font-normal tracking-[0] text-[14px] leading-[1.5] text-[#6e6e73]">Explore the view that fits your role, or begin with the question you have today.</p></Reveal></section>;
}

export default function AboutUsPage() {
  return <div className="page-about min-h-screen bg-white" style={{ fontFamily: fontStack }}><LandingNav /><main id="main"><AboutUsHero /><MissionSection /><LifeJourneySection /><ImpactSection /><RolesSection /><ExploreSection /><FinalCta /></main><LandingFooter variant="quiet" /></div>;
}
