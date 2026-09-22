import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import PageHeading, { Accent } from "@/components/landing/PageHeading";
import StorySection from "@/components/landing/StorySection";
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
      <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>{number}</div>
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


  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
            <main id="main">
        <PageHeading page="Research" eyebrow="Research"
          h1={<>Our <Accent>research</Accent>.</>}
          dek="Questions we’re chasing, and what we’ve learned.">
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#questions" onClick={(event) => { event.preventDefault(); scrollToSection("questions"); }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
              style={{ backgroundColor: COLORS.blue }}>
              What we are exploring
              <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
            </a>
          </div>
        </PageHeading>

        {/* STORY BAND */}
        <section className="border-b" style={{ borderColor: COLORS.border }}>
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

        {/* 01 · WHY WE RESEARCH */},
        <StorySection
          id="why"
          title="Why we research"
          featured={{
            subject: "research",
            label: "The point",
            title: "True enough to build from.",
            dek: "Not research for its own sake — learning something a person can use.",
          }}
          rows={[
            { label: "Learning", title: "How people actually learn." },
            { label: "Intelligence", title: "How it should adapt." },
            { label: "Language", title: "Understanding across scripts." },
            { label: "Continuity", title: "Learning that lasts." },
          ]}
        />

        {/* 02 · QUESTIONS WE ARE EXPLORING */}
        <StorySection
          id="questions"
          title="Questions we explore"
          flip
          featured={{
            subject: "loop",
            label: "Open questions",
            title: "What we are chasing.",
            dek: "Each question connects to something a learner experiences.",
          }}
          rows={[
            { label: "01", title: "What makes understanding stick?" },
            { label: "02", title: "When should help arrive?" },
            { label: "03", title: "How does language shape it?" },
            { label: "04", title: "What carries across years?" },
          ]}
        />

        {/* 03 · RESEARCH TO PRODUCT */}
        <StorySection
          id="work"
          title="Research to product"
          featured={{
            subject: "build",
            label: "The path",
            title: "From question to capability.",
            dek: "Numbered steps from a finding to something a learner can use.",
          }}
          rows={[
            { label: "01 · Ask", title: "A question from a real learner." },
            { label: "02 · Study", title: "Evidence over assumption." },
            { label: "03 · Build", title: "A capability in the product." },
            { label: "04 · Learn", title: "Measure, then improve." },
          ]}
        />

<section id="publications" className="scroll-mt-24 px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-[1240px]">
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
                    </div>
        </section>

        {/* CONTACT one-liner */}
        <section id="contact" aria-label="Contact" className="border-t px-6 py-14 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto flex max-w-[1240px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px]" style={{ color: COLORS.grey }}>Research questions?</p>
            <a href="mailto:research@visionary.org.in" className="inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
              research@visionary.org.in
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </a>
          </div>
        </section>
      </main>

      <LandingFooter variant="quiet" />
    </div>
  );
}