import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  ChevronRight,
  FlaskConical,
  Layers3,
  Lightbulb,
  MessageCircle,
  Network,
  Search,
  Sparkles,
  UsersRound,
  Wrench,
  Lock,
  Code2,
  GraduationCap,
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

const SECTIONS = [
  { id: "why", number: "01", title: "Why we research", summary: "The questions behind Visionary's product and learning experience." },
  { id: "questions", number: "02", title: "Questions we are exploring", summary: "The areas where we need evidence, not assumptions." },
  { id: "learning", number: "03", title: "How people learn", summary: "Understanding explanation, practice, memory, confidence, and progress." },
  { id: "intelligence", number: "04", title: "How intelligence should adapt", summary: "Exploring how an AI system can respond to context rather than only prompts." },
  { id: "language", number: "05", title: "Language and understanding", summary: "Studying what changes when people can think and communicate naturally." },
  { id: "continuity", number: "06", title: "Learning over time", summary: "Understanding how previous learning can help shape what comes next." },
  { id: "responsible", number: "07", title: "Responsible research", summary: "Keeping evidence, uncertainty, privacy, and human impact in the work." },
  { id: "work", number: "08", title: "Research to product", summary: "How ideas move from a question into something people can actually use." },
  { id: "publications", number: "09", title: "Publications and findings", summary: "A home for research that Visionary is ready to share." },
  { id: "collaboration", number: "10", title: "Research with others", summary: "How future academic, educational, and technical collaboration can grow." },
  { id: "contact", number: "11", title: "Contact", summary: "How to reach Visionary about research." },
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

function ResearchCard({ icon: Icon, eyebrow, title, children }) {
  return (
    <div className="rounded-[22px] border bg-white p-6 sm:p-7" style={{ borderColor: COLORS.border }}>
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
        <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
      </div>
      <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.lightGrey }}>{eyebrow}</div>
      <h3 className="mt-1.5 text-[19px] font-normal leading-[1.3]" style={{ color: COLORS.ink }}>{title}</h3>
      <p className="mt-3 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{children}</p>
    </div>
  );
}

function PrincipleRow({ icon: Icon, title, children }) {
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

function Note({ children }) {
  return (
    <div className="mt-6 rounded-[18px] border px-5 py-5 sm:px-6" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
      <p className="text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{children}</p>
    </div>
  );
}

export default function ResearchNewsPage() {
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
            <div className="max-w-[1000px]">
              <div className="mb-5 flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>
                <FlaskConical className="h-4 w-4" strokeWidth={1.7} />
                Research
              </div>
              <h1 className="max-w-[960px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px]" style={{ color: COLORS.ink }}>
                We are building Visionary
                <br />
                <span style={{ color: COLORS.blue }}>one question at a time.</span>
              </h1>
              <p className="mt-8 max-w-[800px] text-[18px] leading-[1.6] tracking-[0.005em] sm:text-[20px]" style={{ color: COLORS.grey }}>
                Research at Visionary starts with a simple question: what would make understanding work better for a real person?
              </p>
              <p className="mt-5 max-w-[760px] text-[16px] leading-[1.75]" style={{ color: COLORS.grey }}>
                We study learning, AI, language, memory, interaction, and the systems around them. The goal is not research for its own sake. The goal is to learn something true enough to build from.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a href="#questions" onClick={(event) => { event.preventDefault(); scrollToSection("questions"); }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
                  style={{ backgroundColor: COLORS.blue }}>
                  What we are exploring
                  <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                </a>
                <a href="#publications" onClick={(event) => { event.preventDefault(); scrollToSection("publications"); }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border px-7 text-[15px] transition-colors hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                  style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                  Research library
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* STORY BAND */}
        <section className="border-b" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
          <div className="mx-auto max-w-[1240px] px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
            <div className="max-w-[940px]">
              <p className="text-[28px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[40px]" style={{ color: COLORS.ink }}>
                A feature can work.
                <br />
                That does not mean it works
                <br />
                <span style={{ color: COLORS.blue }}>for learning.</span>
              </p>
              <p className="mt-6 max-w-[760px] text-[17px] leading-[1.75]" style={{ color: COLORS.grey }}>
                Research helps us tell the difference. It gives us a way to test assumptions, understand people more deeply, and decide what belongs in the product.
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

        {/* RESEARCH CONTENT */}
        <section>
          <div className="mx-auto max-w-[1240px] px-6 py-12 sm:px-8 lg:px-10 lg:py-20">
            <div className="grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20">
              {/* DESKTOP CONTENTS */}
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>Contents</div>
                  <nav aria-label="Research sections">
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
                </div>
              </aside>

              <div className="min-w-0">
                <article className="divide-y divide-[#e5e7eb]">
                  {/* 01 */}
                  <section id="why" className="scroll-mt-24 pb-14 sm:pb-16">
                    <SectionHeading number="01" title="Why we research" />
                    <Paragraph>Visionary is trying to solve a problem that cannot be understood from product metrics alone.</Paragraph>
                    <div className="mt-5"><Paragraph>We need to understand what helps someone move from seeing information to understanding it, from understanding to practice, and from practice to something they can actually do.</Paragraph></div>
                    <div className="mt-5"><Paragraph>Research gives us a disciplined way to ask those questions, test ideas, learn from evidence, and change the product when the evidence says we should.</Paragraph></div>
                  </section>

                  {/* 02 */}
                  <section id="questions" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="02" title="Questions we are exploring" />
                    <Paragraph>The important questions are still open questions.</Paragraph>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <ResearchCard icon={Brain} eyebrow="Learning" title="What makes understanding stick?">Which combinations of explanation, questioning, practice, feedback, and repetition help people build durable understanding?</ResearchCard>
                      <ResearchCard icon={MessageCircle} eyebrow="Interaction" title="What should an AI teacher do?">When should an intelligent system explain, ask, demonstrate, challenge, suggest, or step back?</ResearchCard>
                      <ResearchCard icon={Network} eyebrow="Continuity" title="What should carry forward?">Which parts of previous learning are useful context for the next question, lesson, task, or project?</ResearchCard>
                      <ResearchCard icon={Sparkles} eyebrow="Adaptation" title="What should change for each person?">How should depth, pace, examples, practice, and interaction adapt to the person and their goal?</ResearchCard>
                      <ResearchCard icon={Layers3} eyebrow="Creation" title="How does learning become doing?">What helps people turn an understood idea into a project, explanation, decision, or useful piece of work?</ResearchCard>
                      <ResearchCard icon={Search} eyebrow="Measurement" title="How do we know it worked?">How can we distinguish completion from genuine understanding and meaningful progress?</ResearchCard>
                    </div>
                  </section>

                  {/* 03 */}
                  <section id="learning" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="03" title="How people learn" />
                    <Paragraph>We are interested in the full learning journey, not just the moment someone receives an answer.</Paragraph>
                    <div className="mt-6 overflow-hidden rounded-[22px] border bg-white" style={{ borderColor: COLORS.border }}>
                      <PrincipleRow icon={Lightbulb} title="Understand">What changes when an explanation matches what a person already knows?</PrincipleRow>
                      <PrincipleRow icon={MessageCircle} title="Ask">How can a system use questions to uncover confusion instead of simply delivering more information?</PrincipleRow>
                      <PrincipleRow icon={Wrench} title="Practise">Which practice helps people strengthen the concepts they have not yet mastered?</PrincipleRow>
                      <PrincipleRow icon={Layers3} title="Build">What happens when people use their understanding to create something meaningful?</PrincipleRow>
                      <PrincipleRow icon={Network} title="Continue">How can previous learning make the next learning step easier?</PrincipleRow>
                    </div>
                  </section>

                  {/* 04 */}
                  <section id="intelligence" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="04" title="How intelligence should adapt" />
                    <Paragraph>A system can answer the same question differently without becoming inconsistent. It can respond to the person's context.</Paragraph>
                    <div className="mt-5"><Paragraph>For one learner, that may mean a simpler explanation. For another, a deeper derivation. For a teacher, the relevant question may be how to explain the same idea to a class. For a professional, it may be how to apply it to a real task.</Paragraph></div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <ResearchCard icon={UsersRound} eyebrow="Person" title="Who is asking?">The same concept can require a different starting point for a student, teacher, parent, professional, or organization.</ResearchCard>
                      <ResearchCard icon={Lightbulb} eyebrow="Context" title="What happened before?">Previous questions, learning, goals, and work can provide context for what comes next.</ResearchCard>
                      <ResearchCard icon={Sparkles} eyebrow="Goal" title="What are they trying to do?">Understanding for an exam is different from understanding for a project or a real decision.</ResearchCard>
                      <ResearchCard icon={Layers3} eyebrow="Depth" title="How far should it go?">Good adaptation is not simply shorter or longer. It should change the structure of the explanation itself.</ResearchCard>
                    </div>
                  </section>

                  {/* 05 */}
                  <section id="language" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="05" title="Language and understanding" />
                    <Paragraph>Language is part of how people think, explain, question, and make meaning.</Paragraph>
                    <div className="mt-5"><Paragraph>Visionary's broader product direction is built around allowing people to learn and communicate in the language that feels natural to them. Research here should examine whether changing the language of interaction changes comprehension, confidence, and the ability to continue learning.</Paragraph></div>
                    <div className="mt-6 rounded-[22px] border p-6 sm:p-7">
                      <div className="flex items-start gap-4">
                        <MessageCircle className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.6} style={{ color: COLORS.blue }} />
                        <div>
                          <h3 className="text-[20px] font-normal" style={{ color: COLORS.ink }}>
                            The words can change.
                            <br />
                            <span style={{ color: COLORS.blue }}>Understanding should not have to.</span>
                          </h3>
                          <p className="mt-3 max-w-[700px] text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>
                            This is a research question, not merely a language feature: how can technology preserve meaning as people move between languages and ways of expressing an idea?
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 06 */}
                  <section id="continuity" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="06" title="Learning over time" />
                    <Paragraph>One of Visionary's central product ideas is continuity: what you learn today should help with what comes next.</Paragraph>
                    <div className="mt-5"><Paragraph>Research needs to determine when remembering previous interactions genuinely helps and when it becomes noise, distraction, or an incorrect assumption.</Paragraph></div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <ResearchCard icon={BookOpen} eyebrow="Remember" title="What matters?">Which information from earlier learning remains useful later?</ResearchCard>
                      <ResearchCard icon={Network} eyebrow="Connect" title="What relates?">Which concepts, experiences, and goals should be connected?</ResearchCard>
                      <ResearchCard icon={ArrowUpRight} eyebrow="Continue" title="What comes next?">How can previous understanding shape a better next learning step?</ResearchCard>
                    </div>
                  </section>

                  {/* 07 */}
                  <section id="responsible" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="07" title="Responsible research" />
                    <Paragraph>Research about people and education carries responsibilities beyond getting a better model score.</Paragraph>
                    <div className="mt-6 space-y-4">
                      <PrincipleRow icon={Search} title="Evidence before claims">We should distinguish what has been tested from what we simply believe might work.</PrincipleRow>
                      <PrincipleRow icon={UsersRound} title="People before benchmarks">A technical improvement matters only when it improves an actual experience for the person using the product.</PrincipleRow>
                      <PrincipleRow icon={Lock} title="Privacy matters">Learning research should be designed with appropriate care for personal and educational information.</PrincipleRow>
                      <PrincipleRow icon={MessageCircle} title="Uncertainty should be visible">When the evidence is incomplete, the conclusion should remain appropriately qualified.</PrincipleRow>
                    </div>
                    <Note>Specific research protocols, participant protections, ethics review, and data-governance procedures should be documented when Visionary begins conducting formal human-subject research.</Note>
                  </section>

                  {/* 08 */}
                  <section id="work" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="08" title="Research to product" />
                    <Paragraph>Research is useful when what we learn changes what we build.</Paragraph>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <ResearchCard icon={Search} eyebrow="01" title="Ask">Start with a real product or learning question.</ResearchCard>
                      <ResearchCard icon={FlaskConical} eyebrow="02" title="Study">Gather evidence through the appropriate research method.</ResearchCard>
                      <ResearchCard icon={Brain} eyebrow="03" title="Learn">Separate the result from the assumption we started with.</ResearchCard>
                      <ResearchCard icon={Code2} eyebrow="04" title="Build">Turn useful findings into product behavior that can be tested in the real world.</ResearchCard>
                    </div>
                    <Note>This is the intended research loop. It is not a claim that Visionary has completed every stage for every research area shown on this page.</Note>
                  </section>

                  {/* 09 */}
                  <section id="publications" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="09" title="Publications and findings" />
                    <Paragraph>When Visionary has research that is ready to share, this is where it belongs.</Paragraph>
                    <div className="mt-8 rounded-[24px] border p-7 sm:p-8" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                        <BookOpen className="h-5 w-5" strokeWidth={1.7} />
                      </div>
                      <h3 className="mt-6 text-[25px] font-normal tracking-[-0.02em]" style={{ color: COLORS.ink }}>The research library is growing.</h3>
                      <p className="mt-3 max-w-[700px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                        There are no published Visionary research papers or formal findings listed here yet. We would rather leave this space honest than fill it with claims that have not been established.
                      </p>
                      <div className="mt-6 flex flex-wrap gap-4">
                        <Link to="/updates" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
                          Get research updates
                          <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                        </Link>
                        <Link to="/contact" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
                          Talk about research
                          <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                        </Link>
                      </div>
                    </div>
                  </section>

                  {/* 10 */}
                  <section id="collaboration" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="10" title="Research with others" />
                    <Paragraph>Better questions often come from working with people who see the problem from a different side.</Paragraph>
                    <div className="mt-5"><Paragraph>As Visionary's research grows, we expect opportunities to work with educators, universities, researchers, practitioners, and other organizations whose expertise can challenge or extend what we are building.</Paragraph></div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <ResearchCard icon={GraduationCap} eyebrow="Education" title="Educators">Bring classroom experience and practical knowledge of how people actually learn.</ResearchCard>
                      <ResearchCard icon={FlaskConical} eyebrow="Research" title="Researchers">Explore questions that benefit from deeper scientific or methodological work.</ResearchCard>
                      <ResearchCard icon={UsersRound} eyebrow="Practice" title="Organizations">Study how learning and capability change in real institutions and workplaces.</ResearchCard>
                    </div>
                  </section>

                  {/* 11 */}
                  <section id="contact" className="scroll-mt-24 pt-14 sm:pt-16">
                    <SectionHeading number="11" title="Contact" />
                    <Paragraph>For research questions, collaboration ideas, or opportunities to contribute to Visionary's research:</Paragraph>
                    <div className="mt-6">
                      <a href="mailto:research@visionary.org.in"
                        className="inline-flex items-center gap-2 text-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                        style={{ color: COLORS.blue }}>
                        research@visionary.org.in
                        <ArrowUpRight className="h-5 w-5" strokeWidth={1.7} />
                      </a>
                    </div>
                    <Note>This address should be activated and monitored before being published as an official research contact.</Note>
                  </section>
                </article>

                {/* CLOSING */}
                <section className="mt-20 border-t border-[#e5e7eb] pt-14 sm:mt-24 sm:pt-16">
                  <div className="max-w-[900px]">
                    <div className="mb-5 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.blue }}>Research</div>
                    <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] sm:text-[48px]" style={{ color: COLORS.ink }}>
                      Ask better questions.
                      <br />
                      <span style={{ color: COLORS.blue }}>Build from what you learn.</span>
                    </h2>
                    <p className="mt-6 max-w-[720px] text-[17px] leading-[1.7]" style={{ color: COLORS.grey }}>
                      That is how research becomes part of Visionary—not as a claim on a page, but as something that changes the product.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <Link to="/about" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        About Visionary
                      </Link>
                      <Link to="/careers" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        Work with us
                      </Link>
                      <Link to="/contact" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        Contact
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