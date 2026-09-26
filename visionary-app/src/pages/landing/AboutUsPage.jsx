import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import AboutUsHero from "@/components/landing/AboutUsHero";
import SpotIllustration from "@/components/landing/SpotIllustration";
import studentImage from "@/assets/student-hero-main-1600w.webp";
import teacherImage from "@/assets/teacher-hero-main-1600w.webp";
import parentImage from "@/assets/parent-hero-main-1600w.webp";
import professionalImage from "@/assets/pro-face-main-1600w.webp";
import organizationImage from "@/assets/org-face-main-1600w.webp";
import imgStagePrimary from "@/assets/student-primary.webp";
import imgStageSecondary from "@/assets/student-secondary.webp";
import imgStageCompetitive from "@/assets/student-competitive.webp";
import imgStageHigher from "@/assets/student-higher.webp";

/* ═══ Tokens — the shared Material dialect (#202124 ink, #1a73e8/#0b57d0
   actions, #e8eaed hairlines, pill buttons, radius scaled to card size). ═══ */
const FONT = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const ROLES = [
  { to: "/student", label: "Students", line: "From first concepts to higher education and learning on your own.", image: studentImage, tint: "#e8f0fe" },
  { to: "/teacher", label: "Teachers", line: "Plan, explain, and support the people learning with you.", image: teacherImage, tint: "#e9f5ef" },
  { to: "/parent", label: "Parents", line: "Understand progress and support the next step at home.", image: parentImage, tint: "#fef3df" },
  { to: "/professional", label: "College & careers", line: "Turn study and experience into practical skills and work.", image: professionalImage, tint: "#f3edff" },
  { to: "/organization", label: "Organizations", line: "Connect learning across classrooms, teams, and institutions.", image: organizationImage, tint: "#fcebe8" },
];

/* The difference we want to make — full-tint Google cards: caps label, big
   illustration, problem headline, and the building-toward answer, all on
   the pastel surface. */
const IMPACT = [
  { number: "01", problem: "A missed idea can follow someone for years.", answer: "Give each person a way to revisit what they missed, ask in their own words, and keep moving with more confidence.", subject: "ask", tint: "#e8f0fe", accent: "#0b57d0" },
  { number: "02", problem: "The people helping them see different pieces.", answer: "Make learning easier to understand for educators and families, so their support can meet the person where they are.", subject: "community", tint: "#e9f5ef", accent: "#137333" },
  { number: "03", problem: "A new direction can feel like starting from zero.", answer: "Help people connect what they already know to the skills, decisions, and opportunities in front of them.", subject: "briefcase", tint: "#fef3df", accent: "#a15c00" },
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
  { to: "/research", label: "Research", copy: "The questions and ideas shaping our approach.", subject: "research", tint: "#e9f5ef" },
  { to: "/careers", label: "Careers", copy: "Meet the work and find your place in the team.", subject: "briefcase", tint: "#e8f0fe" },
  { to: "/safety", label: "Safety", copy: "How we think about safer use and clear reporting.", subject: "shield", tint: "#f3edff" },
  { to: "/updates", label: "Updates", copy: "Follow what is changing across the product.", subject: "updates", tint: "#fef3df" },
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
  return <div ref={ref} className={`${className} transition duration-700 ease-out motion-reduce:transform-none motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>{children}</div>;
}

function Eyebrow({ children }) {
  return <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#5f6368]">{children}</p>;
}

function ArrowLink({ to, children, className = "", style }) {
  return <Link to={to} style={style} className={`group inline-flex min-h-11 items-center gap-2 rounded-sm text-[15px] font-medium text-[#0b57d0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-4 ${className}`}>{children}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" /></Link>;
}

function MissionSection() {
  return <section id="mission" className="scroll-mt-28 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
    <Reveal className="mx-auto max-w-[1240px]">
      <Eyebrow>Why Visionary exists</Eyebrow>
      <div className="mt-5 grid gap-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
        <h2 className="max-w-[760px] text-[40px] font-normal leading-[1.07] tracking-[-0.045em] text-[#202124] sm:text-[52px] lg:text-[64px]">Understanding should open the next door.</h2>
        <p className="max-w-[480px] pb-1 text-[18px] leading-[1.65] text-[#5f6368]">People move between classrooms, homes, work, and new ambitions. Too often, what they have learned gets left behind at each change. We are building Visionary so understanding can grow with them.</p>
      </div>
      <div id="team" className="mt-14 grid scroll-mt-28 overflow-hidden rounded-[32px] border border-[#e8eaed] md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex min-h-[320px] flex-col bg-[#e8f0fe] p-8 sm:p-10 lg:p-14">
          <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#174ea6]">Our mission</p>
          <span aria-hidden="true" className="mt-8 select-none text-[88px] font-medium leading-[0.55] text-[#0b57d0]">"</span>
          <p className="max-w-[760px] text-[30px] font-normal leading-[1.18] tracking-[-0.025em] text-[#202124] sm:text-[40px]">
            Build AI intelligence for anyone, anywhere — from student to organization — in India's native languages.
          </p>
          <p className="mt-10 text-[14px] text-[#3c4043]">Visionary · the mission we build toward</p>
        </div>
        <div className="flex min-h-[260px] items-center justify-center bg-[#f8fbff] p-8"><SpotIllustration subject="loop" className="h-56 w-56 sm:h-72 sm:w-72" title="One intelligence across every learner" /></div>
      </div>
    </Reveal>
  </section>;
}

function ImpactSection() {
  return <section className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
    <Reveal className="mx-auto max-w-[1240px]">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end lg:gap-20">
        <div><Eyebrow>The difference we want to make</Eyebrow><h2 className="mt-5 max-w-[790px] text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#202124] sm:text-[48px]">AI can make the next step clearer for more people.</h2></div>
        <p className="max-w-[430px] text-[17px] leading-[1.65] text-[#5f6368]">The challenge is bigger than answering a question. It is helping people keep their context, understand their choices, and use what they know as life changes.</p>
      </div>
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {IMPACT.map((item) => <article key={item.number} className="flex min-h-[470px] flex-col rounded-[24px] p-8" style={{ backgroundColor: item.tint }}>
          <span className="text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: item.accent }}>{item.number} / The challenge</span>
          <SpotIllustration subject={item.subject} className="mx-auto my-7 h-40 w-40 sm:my-9 sm:h-44 sm:w-44" />
          <h3 className="max-w-[360px] text-[25px] font-normal leading-[1.2] tracking-[-0.02em] text-[#202124]">{item.problem}</h3>
          <div className="mt-auto pt-8">
            <p className="text-[12px] font-medium uppercase tracking-[0.13em]" style={{ color: item.accent }}>What Visionary is building toward</p>
            <p className="mt-3 text-[16px] leading-[1.6] text-[#3c4043]">{item.answer}</p>
          </div>
        </article>)}
      </div>
      <ArrowLink to="/how-it-works" className="mt-10">See how Visionary works</ArrowLink>
    </Reveal>
  </section>;
}

function RolesSection() {
  return <section className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
    <Reveal className="mx-auto max-w-[1240px]">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div className="max-w-[760px]"><Eyebrow>For every perspective</Eyebrow><h2 className="mt-5 text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#202124] sm:text-[48px]">Different people. One connected journey.</h2></div><p className="max-w-[360px] text-[16px] leading-[1.65] text-[#5f6368]">Find the experience that fits your work today. Visionary can keep growing with where you go next.</p></div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
        {ROLES.map((role) => <Link key={role.label} to={role.to} className="group flex flex-col overflow-hidden rounded-[24px] border border-[#e8eaed] bg-white transition-shadow duration-300 hover:shadow-[0_10px_28px_rgba(60,64,67,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] lg:col-span-2">
          <div className="overflow-hidden" style={{ backgroundColor: role.tint }}><img src={role.image} alt="" loading="lazy" style={{ mixBlendMode: "multiply" }} className="h-[190px] w-full object-contain object-bottom transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transform-none" /></div>
          <div className="flex flex-1 flex-col p-6"><div className="flex items-center justify-between gap-5"><h3 className="text-[22px] font-normal text-[#202124]">{role.label}</h3><ArrowRight className="h-5 w-5 shrink-0 text-[#0b57d0] transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" /></div><p className="mt-3 max-w-[420px] text-[14px] leading-[1.6] text-[#5f6368]">{role.line}</p></div>
        </Link>)}
      </div>
    </Reveal>
  </section>;
}

function LifeJourneySection() {
  return <section className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
    <Reveal className="mx-auto max-w-[1240px]">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-20">
        <div><Eyebrow>A life in motion</Eyebrow><h2 className="mt-5 max-w-[780px] text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#202124] sm:text-[48px]">One journey. Many beginnings.</h2></div>
        <p className="max-w-[470px] text-[17px] leading-[1.65] text-[#5f6368]">A first lesson, a new skill, a different career, and the chance to guide someone else are not separate stories. Visionary is designed for learning that continues through them all.</p>
      </div>
      <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {LIFE_STAGES.map((stage) => <li key={stage.number} className="flex flex-col overflow-hidden rounded-[24px] border border-[#e8eaed] bg-white transition-shadow duration-300 hover:shadow-[0_10px_28px_rgba(60,64,67,0.08)]">
          <img src={stage.photo} alt={stage.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
          <div className="flex flex-1 flex-col p-6">
            <span className="text-[13px] font-medium tabular-nums text-[#5f6368]">{stage.number} / 04</span>
            <h3 className="mt-3 text-[22px] font-normal leading-[1.18] tracking-[-0.02em] text-[#202124]">{stage.title}</h3>
            <p className="mt-2 text-[14px] leading-[1.6] text-[#5f6368]">{stage.copy}</p>
          </div>
        </li>)}
      </ol>
      <div className="mt-10 flex flex-col gap-5 border-t border-[#e8eaed] pt-8 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-[660px] text-[18px] leading-[1.55] text-[#202124]">Wherever someone begins, what they learn should remain useful for what comes next.</p><ArrowLink to="/how-it-works" className="shrink-0">See how it works</ArrowLink></div>
    </Reveal>
  </section>;
}

function ExploreSection() {
  return <section className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
    <Reveal className="mx-auto max-w-[1240px]">
      <Eyebrow>Explore further</Eyebrow><h2 className="mt-5 max-w-[760px] text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#202124] sm:text-[48px]">The work around the product.</h2>
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {EXPLORE.map((item) => <Link key={item.to} to={item.to} className="group grid min-h-[220px] grid-cols-[1fr_130px] overflow-hidden rounded-[24px] border border-[#e8eaed] bg-white transition-shadow duration-300 hover:shadow-[0_10px_28px_rgba(60,64,67,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] sm:grid-cols-[1fr_180px]">
          <div className="flex flex-col justify-between p-6 sm:p-8"><div><h3 className="text-[24px] font-normal text-[#202124]">{item.label}</h3><p className="mt-3 max-w-[300px] text-[15px] leading-[1.6] text-[#5f6368]">{item.copy}</p></div><ArrowRight className="mt-7 h-5 w-5 text-[#0b57d0] transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" /></div>
          <div className="flex items-center justify-center" style={{ backgroundColor: item.tint }}><SpotIllustration subject={item.subject} className="h-28 w-28 sm:h-36 sm:w-36" /></div>
        </Link>)}
      </div>
    </Reveal>
  </section>;
}

function FinalCta() {
  return <section className="px-6 py-24 text-center sm:px-8 lg:px-10 lg:py-32"><Reveal className="mx-auto max-w-[840px]"><Eyebrow>Start where you are</Eyebrow><h2 className="mt-5 text-[40px] font-normal leading-[1.08] tracking-[-0.04em] text-[#202124] sm:text-[56px]">There is a place for you in Visionary.</h2><p className="mx-auto mt-6 max-w-[620px] text-[18px] leading-[1.65] text-[#5f6368]">Explore the view that fits your role, or begin with the question you have today.</p><div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"><Link to="/register" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#0b57d0] px-8 text-[15px] font-medium text-white hover:bg-[#0842a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-4">Get started</Link><ArrowLink to="/contact">Contact Visionary</ArrowLink></div></Reveal></section>;
}

export default function AboutUsPage() {
  return <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}><LandingNav /><main id="main"><AboutUsHero /><MissionSection /><LifeJourneySection /><ImpactSection /><RolesSection /><ExploreSection /><FinalCta /></main><LandingFooter /></div>;
}
