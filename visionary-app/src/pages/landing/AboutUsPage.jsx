import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Compass, HeartHandshake, History, Quote, ShieldCheck, Users } from "lucide-react";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import AboutUsHero from "@/components/landing/AboutUsHero";
import SpotIllustration from "@/components/landing/SpotIllustration";
import studentImage from "@/assets/student-hero-main-1600w.webp";
import teacherImage from "@/assets/teacher-hero-main-1600w.webp";
import parentImage from "@/assets/parent-hero-main-1600w.webp";
import professionalImage from "@/assets/pro-face-main-1600w.webp";
import organizationImage from "@/assets/org-face-main-1600w.webp";

const FONT = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const ROLES = [
  { to: "/student", label: "Students", line: "From first concepts to higher education and learning on your own.", image: studentImage, tint: "#e8f0fe" },
  { to: "/teacher", label: "Teachers", line: "Plan, explain, and support the people learning with you.", image: teacherImage, tint: "#e9f5ef" },
  { to: "/parent", label: "Parents", line: "Understand progress and support the next step at home.", image: parentImage, tint: "#fef3df" },
  { to: "/professional", label: "College & careers", line: "Turn study and experience into practical skills and work.", image: professionalImage, tint: "#f3edff" },
  { to: "/organization", label: "Organizations", line: "Connect learning across classrooms, teams, and institutions.", image: organizationImage, tint: "#fcebe8" },
];

const IMPACT = [
  { number: "01", problem: "A missed idea can follow someone for years.", answer: "Give each person a way to revisit what they missed, ask in their own words, and keep moving with more confidence.", Icon: History, accent: "#0b57d0" },
  { number: "02", problem: "The people helping them see different pieces.", answer: "Make learning easier to understand for educators and families, so their support can meet the person where they are.", Icon: Users, accent: "#137333" },
  { number: "03", problem: "A new direction can feel like starting from zero.", answer: "Help people connect what they already know to the skills, decisions, and opportunities in front of them.", Icon: Compass, accent: "#a15c00" },
];

const LIFE_STAGES = [
  { number: "01", title: "Find a way in", copy: "An early question becomes something a person can understand.", subject: "ask", tint: "#e8f0fe" },
  { number: "02", title: "Grow with support", copy: "Teachers, families, and mentors help progress take shape.", subject: "community", tint: "#e9f5ef" },
  { number: "03", title: "Choose what comes next", copy: "Learning becomes a skill, a project, or a new direction.", subject: "briefcase", tint: "#f3edff" },
  { number: "04", title: "Keep growing", copy: "Experience continues through work, change, and helping others.", subject: "loop", tint: "#fef3df" },
];

const PRINCIPLES = [
  { Icon: Users, title: "Designed around people", copy: "A shared learning foundation adapts to the work students, teachers, parents, professionals, and organizations need to do.", to: "/how-it-works", link: "See the flow", color: "#0b57d0" },
  { Icon: ShieldCheck, title: "Clear about trust", copy: "Privacy, safety, accessibility, and product limits belong in the experience and in plain language.", to: "/safety", link: "Read our approach", color: "#137333" },
  { Icon: HeartHandshake, title: "Built for useful progress", copy: "Visionary connects explanation, practice, and application so progress has context beyond a score or a completed screen.", to: "/research", link: "Explore the research", color: "#a15c00" },
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
  return <section id="mission" className="scroll-mt-28 px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
    <Reveal className="mx-auto max-w-[1240px]">
      <Eyebrow>Why Visionary exists</Eyebrow>
      <div className="mt-5 grid gap-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
        <h2 className="max-w-[760px] text-[40px] font-normal leading-[1.07] tracking-[-0.045em] text-[#202124] sm:text-[52px] lg:text-[64px]">Understanding should open the next door.</h2>
        <p className="max-w-[480px] pb-1 text-[18px] leading-[1.65] text-[#5f6368]">People move between classrooms, homes, work, and new ambitions. Too often, what they have learned gets left behind at each change. We are building Visionary so understanding can grow with them.</p>
      </div>
      <div className="mt-14 grid overflow-hidden rounded-[32px] border border-[#e8eaed]">
        <div className="flex min-h-[300px] flex-col justify-between bg-[#e8f0fe] p-8 sm:p-10 lg:p-14">
          <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#174ea6]">Our founding idea</p>
          <p className="mt-10 max-w-[820px] text-[30px] font-normal leading-[1.18] tracking-[-0.025em] text-[#202124] sm:text-[40px]">A person should not have to start over every time life asks them to learn something new.</p>
          <p className="mt-8 text-[14px] text-[#3c4043]">Md Shahid Ali · Founder and CEO</p>
        </div>
      </div>
    </Reveal>
  </section>;
}

function ImpactSection() {
  return <section className="px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
    <Reveal className="mx-auto max-w-[1240px]">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end lg:gap-20">
        <div><Eyebrow>The difference we want to make</Eyebrow><h2 className="mt-5 max-w-[790px] text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#202124] sm:text-[48px]">AI can make the next step clearer for more people.</h2></div>
        <p className="max-w-[430px] text-[17px] leading-[1.65] text-[#5f6368]">The challenge is bigger than answering a question. It is helping people keep their context, understand their choices, and use what they know as life changes.</p>
      </div>
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {IMPACT.map((item) => <article key={item.number} className="flex min-h-[360px] flex-col rounded-[28px] border border-[#e8eaed] bg-white p-7 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${item.accent}1a`, color: item.accent }}><item.Icon className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" /></div>
            <span className="text-[13px] font-medium" style={{ color: item.accent }}>{item.number} / The challenge</span>
          </div>
          <h3 className="mt-7 text-[25px] font-normal leading-[1.2] tracking-[-0.02em] text-[#202124]">{item.problem}</h3>
          <div className="mt-auto pt-8"><p className="text-[12px] font-medium uppercase tracking-[0.13em]" style={{ color: item.accent }}>What Visionary is building toward</p><p className="mt-3 text-[16px] leading-[1.6] text-[#3c4043]">{item.answer}</p></div>
        </article>)}
      </div>
      <ArrowLink to="/how-it-works" className="mt-8">See how Visionary works</ArrowLink>
    </Reveal>
  </section>;
}

function RolesSection() {
  return <section className="px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
    <Reveal className="mx-auto max-w-[1240px]">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div className="max-w-[760px]"><Eyebrow>For every perspective</Eyebrow><h2 className="mt-5 text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#202124] sm:text-[48px]">Different people. One connected journey.</h2></div><p className="max-w-[360px] text-[16px] leading-[1.65] text-[#5f6368]">Find the experience that fits your work today. Visionary can keep growing with where you go next.</p></div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
        {ROLES.map((role, index) => <Link key={role.label} to={role.to} style={{ borderColor: "#e0e3e7" }} className={`group flex flex-col overflow-hidden rounded-[28px] border bg-white transition-shadow duration-300 hover:shadow-[0_10px_28px_rgba(60,64,67,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] ${index < 2 ? "lg:col-span-3" : "lg:col-span-2"}`}>
          <div className={`overflow-hidden ${index < 2 ? "aspect-[16/9]" : "aspect-[4/3]"}`} style={{ backgroundColor: role.tint }}><img src={role.image} alt="" loading="lazy" style={{ mixBlendMode: "multiply" }} className="h-full w-full object-contain object-bottom transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transform-none" /></div>
          <div className="flex flex-1 flex-col p-6 sm:p-7"><div className="flex items-center justify-between gap-5"><h3 className="text-[24px] font-normal text-[#202124]">{role.label}</h3><ArrowRight className="h-5 w-5 shrink-0 text-[#0b57d0] transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" /></div><p className="mt-3 max-w-[420px] text-[15px] leading-[1.6] text-[#5f6368]">{role.line}</p></div>
        </Link>)}
      </div>
    </Reveal>
  </section>;
}

function PrinciplesSection() {
  return <section className="bg-[#f8f9fa] px-6 py-24 sm:px-8 lg:px-10 lg:py-28">
    <Reveal className="mx-auto max-w-[1240px]">
      <Eyebrow>What guides us</Eyebrow>
      <h2 className="mt-5 max-w-[800px] text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#202124] sm:text-[48px]">Technology is only helpful when people can use and trust it.</h2>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PRINCIPLES.map(({ Icon, title, copy, to, link, color }) => <article key={title} className="flex min-h-[310px] flex-col rounded-[26px] bg-white p-7 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${color}1a`, color }}><Icon className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" /></div>
          <h3 className="mt-8 text-[24px] font-normal leading-[1.2] text-[#202124]">{title}</h3>
          <p className="mt-3 text-[15px] leading-[1.65] text-[#5f6368]">{copy}</p>
          <ArrowLink to={to} className="mt-auto pt-5">{link}</ArrowLink>
        </article>)}
      </div>
    </Reveal>
  </section>;
}

function FounderSection() {
  return <section id="team" className="scroll-mt-28 px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
    <Reveal className="mx-auto grid max-w-[1240px] overflow-hidden rounded-[32px] lg:grid-cols-[0.45fr_1.1fr]">
      <div className="flex min-h-[320px] items-center justify-center bg-[#e8f0fe] p-10"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/80 text-[#174ea6]"><Quote className="h-9 w-9" strokeWidth={1.7} aria-hidden="true" /></span></div>
      <figure className="flex flex-col justify-center p-8 text-white sm:p-12 lg:p-16" style={{ backgroundColor: "#174ea6" }}>
        <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#d2e3fc]">The question behind Visionary</p>
        <blockquote className="mt-6 text-[32px] font-normal leading-[1.25] tracking-[-0.025em] sm:text-[42px]">“How can a learning product help people see the next useful step while learning is still happening?”</blockquote>
        <figcaption className="mt-8 text-[15px] leading-[1.6] text-[#d2e3fc]">Md Shahid Ali<br /><span className="text-white">Founder and CEO</span></figcaption>
        <ArrowLink to="/careers" className="mt-7" style={{ color: "#fff" }}>Explore careers</ArrowLink>
      </figure>
    </Reveal>
  </section>;
}

function ExploreSection() {
  return <section className="bg-[#f8f9fa] px-6 py-24 sm:px-8 lg:px-10 lg:py-28">
    <Reveal className="mx-auto max-w-[1240px]">
      <Eyebrow>Explore further</Eyebrow><h2 className="mt-5 max-w-[760px] text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#202124] sm:text-[48px]">The work around the product.</h2>
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {EXPLORE.map((item) => <Link key={item.to} to={item.to} style={{ borderColor: "#e0e3e7" }} className="group grid min-h-[220px] grid-cols-[1fr_130px] overflow-hidden rounded-[24px] border bg-white transition-shadow duration-300 hover:shadow-[0_10px_28px_rgba(60,64,67,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] sm:grid-cols-[1fr_180px]">
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
  return <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}><LandingNav /><main id="main"><AboutUsHero /><MissionSection /><ImpactSection /><RolesSection /><PrinciplesSection /><FounderSection /><ExploreSection /><FinalCta /></main><LandingFooter /></div>;
}
