import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  Code2,
  FlaskConical,
  GraduationCap,
  Layers3,
  Mail,
  UsersRound,
  Lightbulb,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import PageHeading, { Accent } from "@/components/landing/PageHeading";
import StorySection from "@/components/landing/StorySection";
import LandingFooter from "@/components/landing/LandingFooter";
import imgProWorking from "@/assets/pro-face-main-1600w.webp";
import imgStudentsLearning from "@/assets/student-competitive.webp";
import imgStudentBuilding from "@/assets/student-vocational.webp";
import imgStudentGrowing from "@/assets/student-higher.webp";

const FONT_FAMILY =
  "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const COLORS = {
  ink: "#121317",
  surface: "#ffffff",
  grey: "#5f6368",
  lightGrey: "#9aa0a6",
  mist: "#dadce0",
  border: "#dadce0",
  soft: "#ffffff",
  blue: "#4285F4",
  white: "#ffffff",
};

/* ═══ CONTROLLERS — reveal motion, same system as the landing pages ═══ */
function useRevealOnce(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const hasRevealed = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (hasRevealed.current) { setVisible(true); return undefined; }
    if (!node) { setVisible(true); return undefined; }
    if (typeof IntersectionObserver === "undefined") { setVisible(true); hasRevealed.current = true; return undefined; }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRevealed.current) { setVisible(true); hasRevealed.current = true; observer.disconnect(); }
      },
      { threshold: 0, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}
const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

function scrollToSection(id) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

function RoleCard({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="rounded-[22px] border bg-white p-6 transition-all duration-300 hover:shadow-[0_1px_6px_rgba(32,33,36,0.1)] sm:p-7" style={{ borderColor: COLORS.border }}>
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
        <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} aria-hidden="true" />
      </div>
      <div className="mt-5 text-[11px] font-normal uppercase tracking-[0.08em]" style={{ color: COLORS.lightGrey }}>{eyebrow}</div>
      <h3 className="mt-1.5 text-[19px] font-normal leading-[1.3]" style={{ color: COLORS.ink }}>{title}</h3>
      <p className="mt-3 text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>{description}</p>
    </div>
  );
}

/* What to expect — Google's how-we-hire grammar, framed honestly for a
   small team: four steps, no invented process claims. */
const HIRING_STEPS = [
  { n: "01", title: "Choose a listed role.", copy: "Read the role carefully and decide whether the work and requirements fit your experience." },
  { n: "02", title: "Share your work.", copy: "Send a concise introduction with the links or examples requested in the role description." },
  { n: "03", title: "Work through the role.", copy: "If selected, conversations focus on the work, the team, and the problems the role will help solve." },
  { n: "04", title: "Decide with context.", copy: "We explain the role, process, and next steps clearly so both sides can make an informed decision." },
];

export default function CareersPage() {
  const storyReveal = useRevealOnce();

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <PageHeading page="Careers" eyebrow="Careers"
          h1={<>Come <Accent>build</Accent> with us.</>}
          dek="Join the work of making learning clearer.">
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#open-roles" onClick={(event) => { event.preventDefault(); scrollToSection("open-roles"); }}
              className="inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
              style={{ backgroundColor: COLORS.blue }}>
              View current roles
            </a>
            <a href="#application" onClick={(event) => { event.preventDefault(); scrollToSection("application"); }}
              className="inline-flex h-12 items-center justify-center rounded-full border px-7 text-[15px] transition-colors hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
              style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
              Introduce yourself
            </a>
          </div>
        </PageHeading>

        {/* STORY BAND — statement + real photograph (Google 2-up pattern) */}
        <section ref={storyReveal.ref} className="border-b" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto max-w-[1240px] px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
            <FadeReveal visible={storyReveal.visible}>
              <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                <div className="max-w-[560px]">
                  <p className="text-[28px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[40px]" style={{ color: COLORS.ink }}>
                    Information alone is not understanding.
                  </p>
                  <p className="mt-3 text-[28px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[40px]" style={{ color: COLORS.ink }}>
                    That is the challenge behind Visionary.
                  </p>
                  <p className="mt-6 max-w-[560px] text-[16px] leading-[1.65]" style={{ color: COLORS.grey }}>
                    Visionary is an education product being built around learning, questions, practice, and projects. Our aim is to make it easier to work through a difficult idea and apply what you learn.
                  </p>
                </div>
                <div className="overflow-hidden rounded-[28px] border" style={{ borderColor: COLORS.mist }}>
                  <img
                    src={imgProWorking}
                    alt="A professional at work — the kind of person building Visionary"
                    loading="lazy"
                    decoding="async"
                    className="aspect-[16/10] w-full object-cover"
                  />
                </div>
              </div>
            </FadeReveal>
          </div>
        </section>

        {/* VALUE PROPS — Google's 3-column icon-card pattern (grow.google/certificates) */}
        <section id="value-props" className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-12 max-w-[700px]">
              <p className="text-[12px] font-normal uppercase tracking-[0.08em]" style={{ color: COLORS.grey }}>Why Visionary</p>
              <h2 className="mt-3 text-[34px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[40px] lg:text-[46px]" style={{ color: COLORS.ink }}>
                A small team solving a real learning problem.
              </h2>
              <p className="mt-4 text-[16px] leading-[1.65]" style={{ color: COLORS.grey }}>
                If you want your work to help someone turn confusion into understanding, these are the problems worth spending time on.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-[20px] border bg-white p-7" style={{ borderColor: COLORS.mist }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px]" style={{ backgroundColor: COLORS.soft, color: COLORS.blue }}>
                  <Code2 className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-[17px] font-medium leading-[1.4]" style={{ color: COLORS.ink }}>Meaningful problems</h3>
                <p className="mt-2 text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>Work tied to helping learners get through difficult ideas and apply what they learn.</p>
              </div>
              <div className="rounded-[20px] border bg-white p-7" style={{ borderColor: COLORS.mist }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px]" style={{ backgroundColor: COLORS.soft, color: COLORS.blue }}>
                  <Lightbulb className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-[17px] font-medium leading-[1.4]" style={{ color: COLORS.ink }}>Early-stage impact</h3>
                <p className="mt-2 text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>Your decisions ship to real learners quickly, with visible effect.</p>
              </div>
              <div className="rounded-[20px] border bg-white p-7" style={{ borderColor: COLORS.mist }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px]" style={{ backgroundColor: COLORS.soft, color: COLORS.blue }}>
                  <UsersRound className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-[17px] font-medium leading-[1.4]" style={{ color: COLORS.ink }}>Learning-centered</h3>
                <p className="mt-2 text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>Product, design, and engineering work shaped by teaching and curriculum expertise.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 01 · WHY THIS WORK — featured photographs + hairline rows */}
        <StorySection
          id="why"
          title="Why this work"
          featured={{
            img: imgStudentsLearning,
            imgAlt: "Students learning together in a classroom",
            label: "The mission",
            title: "A purpose built around learning.",
            dek: "Help make difficult ideas clearer and easier to put into practice.",
            link: { label: "Learn about Visionary", to: "/about" },
          }}
          rows={[
            { label: "Product", title: "Connect real learning needs to practical product decisions." },
            { label: "Design", title: "Make complex workflows clearer and more accessible." },
            { label: "Learning", title: "Bring teaching, curriculum, and learner needs into product work." },
            { label: "Engineering", title: "Build and improve the experiences behind the product." },
            { label: "Evidence", title: "Test assumptions and share what is still uncertain." },
          ]}
        />

        {/* 02 · WHAT WE ARE BUILDING */}
        <StorySection
          id="what-building"
          title="What we are building"
          flip
          featured={{
            img: imgStudentBuilding,
            imgAlt: "A learner turning knowledge into something they have made",
            label: "The product",
            title: "A learning product that connects understanding and practice.",
            dek: "Explore how Visionary is being built—and where your work might contribute.",
          }}
          rows={[
            { label: "Understand", title: "Make difficult ideas clearer." },
            { label: "Practise", title: "Turn knowing into ability." },
            { label: "Build", title: "Make something from knowledge." },
            { label: "Explore the work", title: "Learn what Visionary is building and what is available today." },
          ]}
        />

        {/* 03 · HOW WE WORK */}
        <StorySection
          id="how-work"
          title="How the team works"
          featured={{
            img: imgStudentGrowing,
            imgAlt: "A learner moving forward — growth guided by evidence",
            label: "Principles",
            title: "Work shaped by clear questions.",
            dek: "We want to understand the learner, test assumptions, and make each decision accountable to the people using the product.",
          }}
          rows={[
            { label: "Start with the learner", title: "Understand the need before choosing a feature." },
            { label: "Build and review", title: "Make progress visible and improve the work." },
            { label: "Question assumptions", title: "Keep evidence and uncertainty in view." },
            { label: "Work across disciplines", title: "Bring different expertise to the same problem." },
            { label: "Take responsibility", title: "Communicate clearly about decisions and limits." },
          ]}
        />

        {/* 04 · WHAT TO EXPECT — numbered hiring journey (how-we-hire pattern) */}
        <section id="process" className="border-y bg-[#f8f9fa] px-6 py-20 sm:px-8 lg:px-10 lg:py-28" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto max-w-[1240px]">
            <div className="max-w-[680px]">
              <p className="text-[12px] font-normal uppercase tracking-[0.08em]" style={{ color: COLORS.grey }}>What to expect</p>
              <h2 className="mt-3 text-[34px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[40px] lg:text-[46px]" style={{ color: COLORS.ink }}>
                Four steps. Real people. No tricks.
              </h2>
              <p className="mt-4 text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>
                We are a small, early-stage team, so the process stays simple and honest at every step.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {HIRING_STEPS.map((s) => (
                <div key={s.n} className="border-t-2 pt-6" style={{ borderColor: COLORS.blue }}>
                  <p className="text-[13px] font-medium tabular-nums" style={{ color: COLORS.blue }}>{s.n}</p>
                  <h3 className="mt-3 text-[19px] font-normal leading-[1.35]" style={{ color: COLORS.ink }}>{s.title}</h3>
                  <p className="mt-2.5 text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>{s.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 05 · WHERE YOU CAN CONTRIBUTE */}
        <section id="where-contribute" className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <h2 className="text-[34px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[40px] lg:text-[46px]" style={{ color: COLORS.ink }}>
              Where you can contribute
            </h2>
            <p className="mt-4 max-w-[680px] text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>
              These are areas of work, not advertised vacancies or a promise of hiring. Current openings, if any, are listed below.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <RoleCard icon={Code2} eyebrow="Engineering" title="Product engineering" description="Work on application experiences and the systems that support them." />
              <RoleCard icon={Lightbulb} eyebrow="Product" title="Product and strategy" description="Turn learner needs and open questions into useful product decisions." />
              <RoleCard icon={Layers3} eyebrow="Design" title="Product and experience design" description="Make learning tools clear, usable, and more accessible." />
              <RoleCard icon={FlaskConical} eyebrow="Evidence" title="Learning and evaluation" description="Explore learning approaches carefully; distinguish design intent from measured results." />
              <RoleCard icon={GraduationCap} eyebrow="Education" title="Teaching and curriculum" description="Bring classroom practice and content expertise into product work." />
              <RoleCard icon={UsersRound} eyebrow="Operations" title="Company operations" description="Help coordinate the practical work of building an education product." />
            </div>
          </div>
        </section>

        {/* 06 · OPEN ROLES */}
        <section id="open-roles" className="border-t px-6 py-20 sm:px-8 lg:px-10 lg:py-28" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto max-w-[1240px]">
            <h2 className="text-[34px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[40px] lg:text-[46px]" style={{ color: COLORS.ink }}>
              Open roles
            </h2>
            <div className="mt-10 max-w-[880px] rounded-[24px] border bg-white p-7 sm:p-10" style={{ borderColor: COLORS.mist }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                <Briefcase className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-[25px] font-normal tracking-[-0.02em]" style={{ color: COLORS.ink }}>No public roles listed right now.</h3>
              <p className="mt-3 max-w-[620px] text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>
                There are no public vacancies listed at the moment. This page is the source for open roles; you can still email a general introduction below, but sending one is not an application to a listed vacancy and does not guarantee a response.
              </p>
              <a href="#application" onClick={(event) => { event.preventDefault(); scrollToSection("application"); }}
                className="mt-6 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                style={{ color: COLORS.blue }}>
                Introduce yourself by email
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* 07 · GENERAL APPLICATION */}
        <section id="application" className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <h2 className="text-[34px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[40px] lg:text-[46px]" style={{ color: COLORS.ink }}>
              General application
            </h2>
            <div className="mt-10 max-w-[880px] rounded-[24px] border bg-white p-7 shadow-[0_1px_6px_rgba(32,33,36,0.06)] sm:p-10" style={{ borderColor: COLORS.mist }}>
              <div className="flex items-start gap-4">
                <Mail className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.6} style={{ color: COLORS.blue }} aria-hidden="true" />
                <div>
                  <div className="text-[11px] font-normal uppercase tracking-[0.08em]" style={{ color: COLORS.lightGrey }}>General applications</div>
                  <h3 className="mt-1.5 text-[21px] font-normal" style={{ color: COLORS.ink }}>Start with the work.</h3>
                  <p className="mt-3 max-w-[560px] text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>
                    Send a general introduction by email. You may include a short note about the work you are interested in and links or attachments that help explain your experience. Please do not send passwords, financial details, identity documents, or other sensitive information. This mailbox is not a formal job application portal, and response times are not specified.
                  </p>
                  <a href="mailto:careers@visionary.org.in?subject=General%20application%20%E2%80%94%20Visionary"
                    className="mt-6 inline-flex items-center gap-2 text-[17px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                    style={{ color: COLORS.blue }}>
                    careers@visionary.org.in
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 08 · WORKING AT VISIONARY — cards (Google's "Working at Google" pattern) */}
        <section id="working-at" className="border-t px-6 py-20 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto max-w-[1240px]">
            <h2 className="text-[34px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[40px] lg:text-[46px]" style={{ color: COLORS.ink }}>
              Working at Visionary
            </h2>
            <p className="mt-4 max-w-[680px] text-[16px] leading-[1.65]" style={{ color: COLORS.grey }}>
              Learn about Visionary's approach to research and follow the published information about our work.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Link to="/research" className="group rounded-[16px] border bg-white p-7 transition-all duration-300 hover:shadow-[0_1px_6px_rgba(32,33,36,0.1)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ borderColor: COLORS.mist }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                  <UsersRound className="h-[19px] w-[19px]" strokeWidth={1.7} aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-[20px] font-medium" style={{ color: COLORS.ink }}>Our approach to research</h3>
                <p className="mt-2 text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>See the learning questions Visionary is exploring.</p>
                <span className="mt-5 inline-flex items-center gap-1 text-[15px] font-medium" style={{ color: COLORS.blue }}>
                  Read about our research
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                </span>
              </Link>
              <Link to="/accessibility" className="group rounded-[16px] border bg-white p-7 transition-all duration-300 hover:shadow-[0_1px_6px_rgba(32,33,36,0.1)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ borderColor: COLORS.mist }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                  <Code2 className="h-[19px] w-[19px]" strokeWidth={1.7} aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-[20px] font-medium" style={{ color: COLORS.ink }}>Accessibility at Visionary</h3>
                <p className="mt-2 text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>See how accessibility shapes the product and how to request support during a hiring conversation.</p>
                <span className="mt-5 inline-flex items-center gap-1 text-[15px] font-medium" style={{ color: COLORS.blue }}>
                  Explore accessibility
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                </span>
              </Link>
              <a href="mailto:careers@visionary.org.in?subject=General%20introduction%20%E2%80%94%20Visionary" className="group rounded-[16px] border bg-white p-7 transition-all duration-300 hover:shadow-[0_1px_6px_rgba(32,33,36,0.1)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ borderColor: COLORS.mist }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                  <Mail className="h-[19px] w-[19px]" strokeWidth={1.7} aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-[20px] font-medium" style={{ color: COLORS.ink }}>Make a general introduction</h3>
                <p className="mt-2 text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>Share a note about your interests. It is not an application to a listed vacancy.</p>
                <span className="mt-5 inline-flex items-center gap-1 text-[15px] font-medium" style={{ color: COLORS.blue }}>
                  Email the careers team
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* 09 · ACCESSIBILITY AND INCLUSIVE HIRING */}
        <section id="inclusive-hiring" className="border-y px-6 py-16 sm:px-8 lg:px-10 lg:py-20" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto grid max-w-[1240px] gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-start">
            <div>
              <p className="text-[12px] font-normal uppercase tracking-[0.08em]" style={{ color: COLORS.grey }}>Accessibility and inclusion</p>
              <h2 className="mt-3 text-[34px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[40px] lg:text-[46px]" style={{ color: COLORS.ink }}>
                A fair process starts with clarity.
              </h2>
            </div>
            <div className="space-y-4 text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>
              <p>
                We want career information and conversations with our team to be clear and respectful. This page does not describe a formal interview process or published accommodation program.
              </p>
              <p>
                If you need an accessible format or an adjustment to a hiring conversation, email <a className="font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }} href="mailto:careers@visionary.org.in?subject=Accessibility%20request%20%E2%80%94%20Careers">careers@visionary.org.in</a> with the adjustment you need. Please avoid including medical records or other sensitive personal information; we cannot promise that a particular accommodation is available.
              </p>
              <p>
                For accessibility information about the product, visit <Link className="font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }} to="/accessibility">Visionary accessibility</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="border-t px-6 py-24 sm:px-8 lg:px-10 lg:py-32" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-5 text-[12px] font-normal uppercase tracking-[0.08em]" style={{ color: COLORS.grey }}>Careers</div>
            <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] sm:text-[48px]" style={{ color: COLORS.ink }}>
              What you learn here
              <br />
              <span style={{ color: COLORS.ink }}>should stay with you.</span>
            </h2>
            <p className="mt-6 max-w-[640px] text-[16px] leading-[1.65]" style={{ color: COLORS.grey }}>
              Understand deeply, build from what you know, carry the learning forward.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="mailto:careers@visionary.org.in"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium text-white transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
                style={{ backgroundColor: COLORS.blue }}>
                Email the careers team <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </a>
              <Link to="/about" className="inline-flex h-12 items-center justify-center rounded-full border px-6 text-[15px] transition-colors hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                About Visionary
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.grey }}>
                Other ways to contact us
                <ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
