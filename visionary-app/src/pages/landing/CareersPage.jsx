import { useEffect, useMemo, useState } from "react";
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
  Wrench,
  Lightbulb,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const FONT_FAMILY =
  "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const COLORS = {
  ink: "#121317",
  surface: "#ffffff",
  grey: "#5f6368",
  lightGrey: "#9aa0a6",
  mist: "#dadce0",
  border: "#e5e7eb",
  soft: "#f8f9fa",
  blue: "#4285F4",
  chipBg: "#D2E3FC",
  white: "#ffffff",
};

function Note({ children }) {
  return (
    <div className="mt-6 rounded-[18px] border px-5 py-5 sm:px-6" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
      <p className="text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{children}</p>
    </div>
  );
}

const SECTIONS = [
  { id: "why", number: "01", title: "Why this work", summary: "The problem Visionary is trying to solve." },
  { id: "what-building", number: "02", title: "What we are building", summary: "The product and system we are working toward." },
  { id: "how-work", number: "03", title: "How we work", summary: "How ideas become product decisions and working software." },
  { id: "where-contribute", number: "04", title: "Where you can contribute", summary: "The disciplines that shape Visionary." },
  { id: "who-we-need", number: "05", title: "Who we need", summary: "The kind of people and thinking that fit the work." },
  { id: "open-roles", number: "06", title: "Open roles", summary: "Current opportunities at Visionary." },
  { id: "students", number: "07", title: "Students and early careers", summary: "Ways to learn with the team as your career begins." },
  { id: "application", number: "08", title: "General application", summary: "Reach out even when your exact role is not listed." },
  { id: "contact", number: "09", title: "Contact", summary: "How to reach Visionary about careers." },
];

function scrollToSection(id) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

function SectionHeading({ number, title }) {
  return (
    <div className="mb-6">
      <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.blue }}>{number}</div>
      <h2 className="text-[30px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[36px]" style={{ color: COLORS.ink }}>{title}</h2>
    </div>
  );
}

function Paragraph({ children }) {
  return (
    <p className="max-w-[760px] text-[16px] leading-[1.78] tracking-[0.005em]" style={{ color: COLORS.grey }}>{children}</p>
  );
}

function RoleCard({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="rounded-[22px] border bg-white p-6 sm:p-7" style={{ borderColor: COLORS.border }}>
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
        <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
      </div>
      <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.lightGrey }}>{eyebrow}</div>
      <h3 className="mt-1.5 text-[19px] font-normal leading-[1.3]" style={{ color: COLORS.ink }}>{title}</h3>
      <p className="mt-3 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{description}</p>
    </div>
  );
}

function ValueRow({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-4 border-b py-6 last:border-b-0" style={{ borderColor: COLORS.border }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.soft }}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} style={{ color: COLORS.blue }} />
      </div>
      <div>
        <h3 className="text-[17px] font-normal" style={{ color: COLORS.ink }}>{title}</h3>
        <p className="mt-2 max-w-[680px] text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{children}</p>
      </div>
    </div>
  );
}

export default function CareersPage() {
  const [activeId, setActiveId] = useState("why");
  const [showMobileContents, setShowMobileContents] = useState(false);

  const activeSection = useMemo(
    () => SECTIONS.find((section) => section.id === activeId),
    [activeId]
  );

  useEffect(() => {
    const observers = [];
    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (!element) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveId(section.id);
          });
        },
        { rootMargin: "-18% 0px -65% 0px", threshold: 0.01 }
      );
      observer.observe(element);
      observers.push(observer);
    });
    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash || !SECTIONS.some((section) => section.id === hash)) return;
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "auto", block: "start" });
      setActiveId(hash);
    });
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        {/* HERO */}
        <section className="border-b pt-28 sm:pt-32" style={{ borderColor: COLORS.border }}>
          <div className="mx-auto max-w-[1240px] px-6 pb-16 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
            <div className="max-w-[980px]">
              <div className="mb-5 flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>
                <Briefcase className="h-4 w-4" strokeWidth={1.7} />
                Careers
              </div>
              <h1 className="max-w-[950px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px]" style={{ color: COLORS.ink }}>
                Help us build
                <br />
                <span style={{ color: COLORS.blue }}>what understanding can become.</span>
              </h1>
              <p className="mt-8 max-w-[800px] text-[18px] leading-[1.6] tracking-[0.005em] sm:text-[20px]" style={{ color: COLORS.grey }}>
                Visionary is being built around a simple idea: intelligence should understand where a person is, help them move forward, and carry what matters into what comes next.
              </p>
              <p className="mt-5 max-w-[760px] text-[16px] leading-[1.75]" style={{ color: COLORS.grey }}>
                That takes more than one discipline. It takes people who care about the problem deeply enough to work through the hard parts together.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a href="#open-roles" onClick={(event) => { event.preventDefault(); scrollToSection("open-roles"); }}
                  className="inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
                  style={{ backgroundColor: COLORS.blue }}>
                  See open roles
                </a>
                <a href="#application" onClick={(event) => { event.preventDefault(); scrollToSection("application"); }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border px-7 text-[15px] transition-colors hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                  style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                  Introduce yourself
                  <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* STORY BAND */}
        <section className="border-b" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
          <div className="mx-auto max-w-[1240px] px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
            <div className="max-w-[920px]">
              <p className="text-[28px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[40px]" style={{ color: COLORS.ink }}>
                Six hours of lectures.
                <br />
                Still not understanding the problem.
              </p>
              <p className="mt-3 text-[28px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[40px]" style={{ color: COLORS.blue }}>
                That is the problem we are here to solve.
              </p>
              <p className="mt-6 max-w-[760px] text-[17px] leading-[1.75]" style={{ color: COLORS.grey }}>
                Information is easier to find than ever. Understanding, practice, confidence, and continuity are not. Visionary is being built to connect those pieces instead of treating them as separate products.
              </p>
            </div>
          </div>
        </section>

        {/* MOBILE CONTENTS */}
        <section className="border-b lg:hidden" style={{ borderColor: COLORS.border }}>
          <div className="mx-auto max-w-[1240px] px-6 sm:px-8">
            <button type="button" onClick={() => setShowMobileContents((value) => !value)} aria-expanded={showMobileContents}
              className="flex w-full items-center justify-between py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
              <span>
                <span className="block text-[12px] uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>Contents</span>
                <span className="mt-1 block text-[15px]" style={{ color: COLORS.ink }}>{activeSection?.title}</span>
              </span>
              <ChevronRight className={`h-5 w-5 transition-transform duration-200 ${showMobileContents ? "rotate-90" : ""}`} strokeWidth={1.7} style={{ color: COLORS.grey }} />
            </button>
            {showMobileContents && (
              <div className="pb-5">
                <div className="overflow-hidden rounded-[18px] border" style={{ borderColor: COLORS.border }}>
                  {SECTIONS.map((section) => {
                    const active = activeId === section.id;
                    return (
                      <button key={section.id} type="button"
                        onClick={() => { scrollToSection(section.id); setActiveId(section.id); setShowMobileContents(false); }}
                        className="flex w-full items-start gap-4 border-b px-4 py-4 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-inset"
                        style={{ borderColor: COLORS.border, backgroundColor: active ? COLORS.soft : COLORS.white }}>
                        <span className="mt-0.5 text-[12px] font-medium" style={{ color: active ? COLORS.blue : COLORS.grey }}>{section.number}</span>
                        <span className="text-[14px] leading-[1.45]" style={{ color: active ? COLORS.ink : COLORS.grey }}>{section.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* MAIN CONTENT */}
        <section>
          <div className="mx-auto max-w-[1240px] px-6 py-12 sm:px-8 lg:px-10 lg:py-20">
            <div className="grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20">
              {/* DESKTOP CONTENTS */}
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>Contents</div>
                  <nav aria-label="Careers sections">
                    <div className="space-y-1">
                      {SECTIONS.map((section) => {
                        const active = activeId === section.id;
                        return (
                          <button key={section.id} type="button" onClick={() => scrollToSection(section.id)}
                            className="group flex w-full items-start gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ backgroundColor: active ? COLORS.soft : "transparent" }}>
                            <span className="mt-0.5 w-6 shrink-0 text-[11px] font-medium" style={{ color: active ? COLORS.blue : COLORS.grey }}>{section.number}</span>
                            <span className="text-[13px] leading-[1.45]" style={{ color: active ? COLORS.ink : COLORS.grey }}>{section.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </nav>
                  <div className="mt-8 border-t pt-6" style={{ borderColor: COLORS.border }}>
                    <p className="text-[13px] leading-[1.6]" style={{ color: COLORS.grey }}>
                      Careers are part of the company story. They are also a conversation between the person joining and the work already underway.
                    </p>
                  </div>
                </div>
              </aside>

              <div className="min-w-0">
                <article className="divide-y divide-[#e5e7eb]">
                  {/* 01 */}
                  <section id="why" className="scroll-mt-24 pb-14 sm:pb-16">
                    <SectionHeading number="01" title="Why this work" />
                    <Paragraph>Visionary exists because the current experience of learning often breaks into pieces.</Paragraph>
                    <div className="mt-5"><Paragraph>Information is everywhere. But understanding it, practising it, remembering it, applying it, and carrying it into the next challenge can still feel disconnected.</Paragraph></div>
                    <div className="mt-5"><Paragraph>We are building one intelligence around that journey: for the student trying to understand a concept, the teacher trying to reach a class, the parent trying to see progress, the professional trying to grow, and the organization trying to understand what changed.</Paragraph></div>
                    <div className="mt-6">
                      <Link to="/about" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
                        Learn about Visionary
                        <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                      </Link>
                    </div>
                  </section>

                  {/* 02 */}
                  <section id="what-building" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="02" title="What we are building" />
                    <Paragraph>Visionary is more than a conversational interface.</Paragraph>
                    <div className="mt-5"><Paragraph>We are building an experience where understanding can continue across questions, practice, projects, languages, people, and time.</Paragraph></div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <RoleCard icon={Lightbulb} eyebrow="Understand" title="Make difficult ideas clearer" description="Explain an idea at the depth and pace a person needs, rather than stopping at the first answer." />
                      <RoleCard icon={Wrench} eyebrow="Practise" title="Turn knowing into ability" description="Give people a way to test understanding, identify gaps, and keep working on what matters." />
                      <RoleCard icon={Layers3} eyebrow="Build" title="Make something from knowledge" description="Carry understanding into projects, creation, research, code, and useful work." />
                      <RoleCard icon={UsersRound} eyebrow="Continue" title="Keep the journey connected" description="What happened before should help shape what comes next instead of disappearing when the session ends." />
                    </div>
                  </section>

                  {/* 03 */}
                  <section id="how-work" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="03" title="How we work" />
                    <Paragraph>The problem is large. The way we work on it should stay clear.</Paragraph>
                    <div className="mt-6 overflow-hidden rounded-[22px] border bg-white" style={{ borderColor: COLORS.border }}>
                      <ValueRow icon={Lightbulb} title="Start with the person">Begin with what someone is actually trying to understand or accomplish, not with a feature looking for a reason to exist.</ValueRow>
                      <ValueRow icon={Code2} title="Build the real thing">Move from an idea to working product behavior, measure what happens, and improve from evidence.</ValueRow>
                      <ValueRow icon={FlaskConical} title="Question assumptions">Learning, AI, and product design create hard questions. We should be comfortable testing what we think we know.</ValueRow>
                      <ValueRow icon={UsersRound} title="Work across disciplines">Engineering, product, design, research, and people closest to learners should inform the same decisions.</ValueRow>
                      <ValueRow icon={Wrench} title="Own the outcome">The goal is not to finish a task. The goal is to make the experience work better for the person using it.</ValueRow>
                    </div>
                  </section>

                  {/* 04 */}
                  <section id="where-contribute" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="04" title="Where you can contribute" />
                    <Paragraph>Visionary needs different kinds of expertise working toward the same product.</Paragraph>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <RoleCard icon={Code2} eyebrow="Engineering" title="Software and systems" description="Build reliable product experiences, infrastructure, AI systems, data flows, and the technology that connects them." />
                      <RoleCard icon={Lightbulb} eyebrow="Product" title="Product and strategy" description="Understand real problems, decide what matters, and turn ambiguous questions into useful product decisions." />
                      <RoleCard icon={Layers3} eyebrow="Design" title="Product and experience design" description="Make complex intelligence feel clear, usable, accessible, and natural across the product." />
                      <RoleCard icon={FlaskConical} eyebrow="Research" title="Learning and AI research" description="Study how people learn, how systems reason, and how those two can work together responsibly." />
                      <RoleCard icon={GraduationCap} eyebrow="Education" title="Learning and pedagogy" description="Bring practical understanding of classrooms, learners, teaching, assessment, and educational contexts." />
                      <RoleCard icon={UsersRound} eyebrow="Operations" title="Building the company" description="Help create the systems, partnerships, support, and operating discipline that let the product grow." />
                    </div>
                  </section>

                  {/* 05 */}
                  <section id="who-we-need" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="05" title="Who we need" />
                    <Paragraph>A perfect background is not the goal. The work requires people who can learn quickly, think clearly, and stay close to the problem.</Paragraph>
                    <div className="mt-6 space-y-4">
                      <ValueRow icon={Lightbulb} title="Curious">You ask why before deciding how.</ValueRow>
                      <ValueRow icon={Code2} title="Builders">You are comfortable turning ideas into something people can actually use.</ValueRow>
                      <ValueRow icon={FlaskConical} title="Evidence-minded">You can change your mind when the product or the people using it show you something different.</ValueRow>
                      <ValueRow icon={UsersRound} title="Collaborative">You work with people outside your discipline and make the final product better together.</ValueRow>
                      <ValueRow icon={GraduationCap} title="Learners">You expect the problem to teach you something you did not know when you started.</ValueRow>
                    </div>
                  </section>

                  {/* 06 */}
                  <section id="open-roles" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="06" title="Open roles" />
                    <Paragraph>We will list a role here when there is a real opening, a defined responsibility, and a team ready to support the person joining.</Paragraph>
                    <div className="mt-8 rounded-[24px] border p-7 sm:p-8" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                        <Briefcase className="h-5 w-5" strokeWidth={1.7} />
                      </div>
                      <h3 className="mt-6 text-[25px] font-normal tracking-[-0.02em]" style={{ color: COLORS.ink }}>No public roles listed right now.</h3>
                      <p className="mt-3 max-w-[680px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                        That does not mean there is no work to do. Visionary is still being built, and the team will add specific roles as real needs emerge.
                      </p>
                      <a href="#application" onClick={(event) => { event.preventDefault(); scrollToSection("application"); }}
                        className="mt-6 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ color: COLORS.blue }}>
                        Make a general application
                        <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                      </a>
                    </div>
                    <Note>This section should automatically become a live role directory when Visionary has an applicant-tracked hiring process. Until then, do not create artificial vacancies simply to make the page look full.</Note>
                  </section>

                  {/* 07 */}
                  <section id="students" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="07" title="Students and early careers" />
                    <Paragraph>Some of the people who eventually build Visionary may still be learning themselves.</Paragraph>
                    <div className="mt-5"><Paragraph>As the team grows, this section can become a home for internships, student research, apprenticeships, and early-career opportunities. The principle is simple: give people meaningful problems to learn from, not work that exists only to fill time.</Paragraph></div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <RoleCard icon={GraduationCap} eyebrow="Students" title="Learn by working on real problems" description="Future student opportunities should connect learning with actual product or research work." />
                      <RoleCard icon={FlaskConical} eyebrow="Research" title="Explore questions that matter" description="Research opportunities can sit at the intersection of learning, AI, language, and human understanding." />
                    </div>
                  </section>

                  {/* 08 */}
                  <section id="application" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="08" title="General application" />
                    <Paragraph>You do not need to wait for the perfect job title to tell us why you belong in this work.</Paragraph>
                    <div className="mt-5"><Paragraph>Tell us what you build, what you understand deeply, what kind of problems you want to solve, and where you think you could contribute to Visionary.</Paragraph></div>
                    <div className="mt-8 rounded-[24px] border p-7 sm:p-8" style={{ borderColor: COLORS.border }}>
                      <div className="flex items-start gap-4">
                        <Mail className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.6} style={{ color: COLORS.blue }} />
                        <div>
                          <div className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.lightGrey }}>General applications</div>
                          <h3 className="mt-1.5 text-[21px] font-normal" style={{ color: COLORS.ink }}>Start with the work.</h3>
                          <p className="mt-3 max-w-[650px] text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>
                            Send your introduction, relevant work, and the area you would like to contribute to Visionary.
                          </p>
                          <a href="mailto:careers@visionary.org.in?subject=General%20application%20%E2%80%94%20Visionary"
                            className="mt-6 inline-flex items-center gap-2 text-[17px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ color: COLORS.blue }}>
                            careers@visionary.org.in
                            <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                          </a>
                        </div>
                      </div>
                    </div>
                    <Note>Replace this address with Visionary's actual monitored recruiting address before publishing.</Note>
                  </section>

                  {/* 09 */}
                  <section id="contact" className="scroll-mt-24 pt-14 sm:pt-16">
                    <SectionHeading number="09" title="Contact" />
                    <Paragraph>Career questions, role enquiries, and general applications can be directed to the Visionary team.</Paragraph>
                    <div className="mt-6 flex flex-wrap gap-5">
                      <a href="mailto:careers@visionary.org.in"
                        className="inline-flex items-center gap-2 text-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ color: COLORS.blue }}>
                        careers@visionary.org.in
                        <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                      </a>
                      <Link to="/contact" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
                        Other ways to contact us
                        <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                      </Link>
                    </div>
                  </section>
                </article>

                {/* CLOSING */}
                <section className="mt-20 border-t border-[#e5e7eb] pt-14 sm:mt-24 sm:pt-16">
                  <div className="max-w-[900px]">
                    <div className="mb-5 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.blue }}>Careers</div>
                    <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] sm:text-[48px]" style={{ color: COLORS.ink }}>
                      What you learn here
                      <br />
                      <span style={{ color: COLORS.blue }}>should stay with you.</span>
                    </h2>
                    <p className="mt-6 max-w-[720px] text-[17px] leading-[1.7]" style={{ color: COLORS.grey }}>
                      We are building Visionary around the same principle we want the product to embody: understand deeply, build from what you know, and carry the learning forward.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <a href="#open-roles" onClick={(event) => { event.preventDefault(); scrollToSection("open-roles"); }}
                        className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        Open roles
                      </a>
                      <Link to="/about" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        About Visionary
                      </Link>
                      <Link to="/research" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        Research
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}