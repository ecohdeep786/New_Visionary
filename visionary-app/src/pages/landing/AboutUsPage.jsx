import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Building2, CheckCircle2, HeartHandshake, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
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
  { to: "/student", label: "Students", line: "Understand a concept, practise it, and build with it.", image: studentImage },
  { to: "/teacher", label: "Teachers", line: "Prepare learning and review evidence from the class.", image: teacherImage },
  { to: "/parent", label: "Parents", line: "Follow shared progress and support the next step.", image: parentImage },
  { to: "/professional", label: "Professionals", line: "Learn practical skills through guided work.", image: professionalImage },
  { to: "/organization", label: "Organizations", line: "Coordinate learning across teams and institutions.", image: organizationImage },
];
const FLOW = [
  { Icon: MessageCircle, title: "Ask", copy: "Start with a question, goal, or concept." },
  { Icon: BookOpen, title: "Learn", copy: "Work through an explanation in manageable steps." },
  { Icon: CheckCircle2, title: "Practise", copy: "Try the idea and see where support is needed." },
  { Icon: Sparkles, title: "Build", copy: "Apply what you know in work you can return to." },
];
const PRINCIPLES = [
  { Icon: Users, title: "Designed around people", copy: "A shared learning foundation adapts to the work students, teachers, parents, professionals, and organizations need to do." },
  { Icon: ShieldCheck, title: "Clear about trust", copy: "Privacy, safety, accessibility, and product limits belong in the experience and in plain language." },
  { Icon: HeartHandshake, title: "Built for useful progress", copy: "Visionary connects explanation, practice, and application so progress has context beyond a score or completed screen." },
];
const EXPLORE = [
  { to: "/research", label: "Research", copy: "The learning questions guiding our work.", subject: "research" },
  { to: "/careers", label: "Careers", copy: "How to grow with the team building Visionary.", subject: "briefcase" },
  { to: "/safety", label: "Safety", copy: "Practical information about safer use and reporting.", subject: "shield" },
  { to: "/updates", label: "Updates", copy: "Product changes, announcements, and what is available.", subject: "updates" },
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
function ArrowLink({ to, children, className = "" }) {
  return <Link to={to} className={`group inline-flex min-h-11 items-center gap-2 rounded-sm text-[15px] font-medium text-[#0b57d0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-4 ${className}`}>{children}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>;
}

function AboutHero() {
  return <AboutUsHero />
}

function MissionSection() {
  return (
    <section id="mission" className="scroll-mt-28 px-6 py-24 sm:px-8 lg:px-10 lg:py-36">
      <Reveal className="mx-auto max-w-[1240px]">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div><Eyebrow>Why we are building</Eyebrow><h2 className="mt-5 text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#202124] sm:text-[48px]">Learning should show the way forward.</h2></div>
          <div className="max-w-[760px] space-y-6 text-[18px] leading-[1.75] text-[#5f6368]">
            <p>People often receive a result after learning—a score, a grade, or a completed course—without a clear view of what to do next.</p>
            <p>Visionary brings the question, explanation, practice, and application into one connected flow. The aim is simple: help each person see what they understand, where they need support, and what they can try next.</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function FlowSection() {
  return (
    <section className="bg-[#f8f9fa] px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
      <Reveal className="mx-auto max-w-[1240px]">
        <div className="max-w-[720px]"><Eyebrow>The product</Eyebrow><h2 className="mt-5 text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#202124] sm:text-[48px]">One learning flow. Four useful moves.</h2><p className="mt-5 text-[17px] leading-[1.7] text-[#5f6368]">Every Visionary workspace starts with the same idea: make the path from curiosity to practical work easier to follow.</p></div>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-[28px] border border-[#dadce0] bg-[#dadce0] sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map(({ Icon, title, copy }, index) => <li key={title} className="min-h-[270px] bg-white p-7 sm:p-8"><div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f0fe] text-[#0b57d0]"><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="text-[12px] font-medium text-[#9aa0a6]">0{index + 1}</span></div><h3 className="mt-12 text-[26px] font-normal text-[#202124]">{title}</h3><p className="mt-3 text-[15px] leading-[1.65] text-[#5f6368]">{copy}</p></li>)}
        </ol>
        <ArrowLink to="/how-it-works" className="mt-8">Follow the full learning journey</ArrowLink>
      </Reveal>
    </section>
  );
}

function RolesSection() {
  return (
    <section className="px-6 py-24 sm:px-8 lg:px-10 lg:py-36">
      <Reveal className="mx-auto max-w-[1240px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div className="max-w-[720px]"><Eyebrow>Made for different perspectives</Eyebrow><h2 className="mt-5 text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#202124] sm:text-[48px]">A shared product, shaped for each role.</h2></div><p className="max-w-[390px] text-[16px] leading-[1.7] text-[#5f6368]">Choose the view closest to you. Each page explains the work, tools, and outcomes that matter for that role.</p></div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {ROLES.map((role, index) => <Link key={role.label} to={role.to} className={`group overflow-hidden rounded-[28px] border border-[#dadce0] bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] ${index < 2 ? "lg:col-span-3" : "lg:col-span-2"}`}><div className={`overflow-hidden bg-[#f1f3f4] ${index < 2 ? "aspect-[16/9]" : "aspect-[4/3]"}`}><img src={role.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transform-none" /></div><div className="p-6 sm:p-7"><div className="flex items-center justify-between gap-5"><h3 className="text-[22px] font-normal text-[#202124]">{role.label}</h3><ArrowRight className="h-5 w-5 shrink-0 text-[#0b57d0] transition-transform group-hover:translate-x-1" aria-hidden="true" /></div><p className="mt-3 text-[15px] leading-[1.65] text-[#5f6368]">{role.line}</p></div></Link>)}
        </div>
      </Reveal>
    </section>
  );
}

function PrinciplesSection() {
  return (
    <section className="border-y border-[#dadce0] px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
      <Reveal className="mx-auto max-w-[1240px]"><Eyebrow>How we work</Eyebrow><h2 className="mt-5 max-w-[800px] text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#202124] sm:text-[48px]">Useful technology begins with clear principles.</h2><div className="mt-14 grid gap-10 lg:grid-cols-3 lg:gap-14">{PRINCIPLES.map(({ Icon, title, copy }) => <article key={title} className="border-t border-[#dadce0] pt-7"><Icon className="h-6 w-6 text-[#0b57d0]" strokeWidth={1.7} aria-hidden="true" /><h3 className="mt-8 text-[24px] font-normal leading-[1.25] text-[#202124]">{title}</h3><p className="mt-4 text-[15px] leading-[1.75] text-[#5f6368]">{copy}</p></article>)}</div></Reveal>
    </section>
  );
}

function FounderSection() {
  return (
    <section id="team" className="scroll-mt-28 px-6 py-24 sm:px-8 lg:px-10 lg:py-36">
      <Reveal className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-20"><div className="flex aspect-square max-w-[480px] items-center justify-center overflow-hidden rounded-[32px] bg-[#e8f0fe]"><SpotIllustration subject="team" className="h-[72%] w-[72%]" title="A team building Visionary" /></div><figure><Eyebrow>The question behind Visionary</Eyebrow><blockquote className="mt-7 text-[32px] font-normal leading-[1.28] tracking-[-0.025em] text-[#202124] sm:text-[42px]">“How can a learning product help people see the next useful step while learning is still happening?”</blockquote><figcaption className="mt-8 text-[14px] leading-[1.6] text-[#5f6368]">Md Shahid Ali<br /><span className="text-[#202124]">Founder and CEO</span></figcaption></figure></Reveal>
    </section>
  );
}

function ExploreSection() {
  return (
    <section className="bg-[#f8f9fa] px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
      <Reveal className="mx-auto max-w-[1240px]"><div className="max-w-[720px]"><Eyebrow>Explore Visionary</Eyebrow><h2 className="mt-5 text-[36px] font-normal leading-[1.12] tracking-[-0.035em] text-[#202124] sm:text-[48px]">More about the work around the product.</h2></div><div className="mt-14 grid gap-5 sm:grid-cols-2">{EXPLORE.map((item) => <Link key={item.to} to={item.to} className="group grid min-h-[220px] grid-cols-[1fr_140px] overflow-hidden rounded-[24px] border border-[#dadce0] bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] sm:grid-cols-[1fr_180px]"><div className="flex flex-col justify-between p-6 sm:p-8"><div><h3 className="text-[24px] font-normal text-[#202124]">{item.label}</h3><p className="mt-3 text-[15px] leading-[1.65] text-[#5f6368]">{item.copy}</p></div><ArrowRight className="mt-8 h-5 w-5 text-[#0b57d0] transition-transform group-hover:translate-x-1" aria-hidden="true" /></div><div className="flex items-center justify-center bg-[#e8f0fe]"><SpotIllustration subject={item.subject} className="h-[80%] w-[80%]" /></div></Link>)}</div></Reveal>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-6 py-24 text-center sm:px-8 lg:px-10 lg:py-36"><Reveal className="mx-auto max-w-[840px]"><Building2 className="mx-auto h-7 w-7 text-[#0b57d0]" strokeWidth={1.7} aria-hidden="true" /><h2 className="mt-7 text-[40px] font-normal leading-[1.08] tracking-[-0.04em] text-[#202124] sm:text-[56px]">Find your place in Visionary.</h2><p className="mx-auto mt-6 max-w-[620px] text-[18px] leading-[1.7] text-[#5f6368]">Explore the product for your role, or create an account when you are ready to begin.</p><div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"><Link to="/register" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#0b57d0] px-8 text-[15px] font-medium text-white hover:bg-[#0842a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-4">Get started</Link><ArrowLink to="/contact">Contact Visionary</ArrowLink></div></Reveal></section>
  );
}

export default function AboutUsPage() {
  return <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}><LandingNav /><main id="main"><AboutHero /><MissionSection /><FlowSection /><RolesSection /><PrinciplesSection /><FounderSection /><ExploreSection /><FinalCta /></main><LandingFooter /></div>;
}
