import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronRight } from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import PageHeading, { Accent } from "@/components/landing/PageHeading";
import SpotIllustration from "@/components/landing/SpotIllustration";
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

function scrollToSection(id) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

export default function ResearchNewsPage() {
  const questions = [
    { number: "01", title: "What helps an idea make sense?", detail: "Explanations, examples, and visual representations can offer different ways into a concept. Which ones help a learner take the next step?", lens: "Understanding" },
    { number: "02", title: "When is practice useful?", detail: "A check can show one response at one moment. How might practice invite reflection without mistaking a score for lasting understanding?", lens: "Practice" },
    { number: "03", title: "What changes across languages?", detail: "A language preference is not the same as translated teaching content. How should learning experiences make availability and gaps clear?", lens: "Language" },
    { number: "04", title: "How does learning become something you can make?", detail: "Projects give a learner a place to apply an idea. What helps connect a learning question with a useful next action?", lens: "Building" },
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <PageHeading
          page="Research"
          eyebrow="Research at Visionary"
          h1={<>Better learning starts with <Accent>better questions.</Accent></>}
          dek="Exploring how explanation, practice, language, and making can support a learner."
        >
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#questions" onClick={(event) => { event.preventDefault(); scrollToSection("questions"); }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
              style={{ backgroundColor: COLORS.blue }}>
              Explore the questions
              <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
            </a>
            <a href="#publications" className="inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-medium transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.ink }}>
              Methods and public work <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </a>
          </div>
        </PageHeading>

        <section className="border-y" style={{ borderColor: COLORS.border }}>
          <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-6 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:px-10">
            <div className="max-w-[590px]">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: COLORS.grey }}>A learning-first lens</p>
              <h2 className="mt-4 text-[30px] font-normal leading-[1.15] tracking-[-0.03em] sm:text-[42px]" style={{ color: COLORS.ink }}>
                A feature can respond.
                <br />
                <span style={{ color: COLORS.blue }}>Did it help someone learn?</span>
              </h2>
              <p className="mt-5 text-[16px] leading-[1.8]" style={{ color: COLORS.grey }}>
                That is the question behind the learning experiences we are exploring. This page shares the questions and the current shape of the work—not a claim of proven educational outcomes.
              </p>
            </div>
            <div className="overflow-hidden rounded-[24px] border" style={{ borderColor: COLORS.mist }}>
              <SpotIllustration subject="research" className="aspect-[4/3] w-full" title="Illustration of learning questions and research" />
            </div>
          </div>
        </section>

        <section id="questions" className="scroll-mt-24 px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div className="max-w-[420px]">
                <p className="text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: COLORS.grey }}>Open questions</p>
                <h2 className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] sm:text-[42px]" style={{ color: COLORS.ink }}>What we are exploring</h2>
                <p className="mt-5 text-[16px] leading-[1.75]" style={{ color: COLORS.grey }}>These are questions to investigate, not conclusions or published findings.</p>
                <div className="mt-8 overflow-hidden rounded-[22px] border" style={{ borderColor: COLORS.mist }}>
                  <SpotIllustration subject="loop" className="aspect-[4/3] w-full" title="Illustration of an open learning question" />
                </div>
              </div>
              <div className="border-t" style={{ borderColor: COLORS.mist }}>
                {questions.map((question) => (
                  <article key={question.number} className="grid gap-2 border-b py-6 sm:grid-cols-[70px_1fr] sm:gap-4" style={{ borderColor: COLORS.mist }}>
                    <p className="text-[12px] font-medium uppercase tracking-[0.12em] sm:pt-1" style={{ color: COLORS.blue }}>{question.lens}</p>
                    <div>
                      <h3 className="text-[20px] font-normal leading-[1.35] tracking-[-0.015em] sm:text-[23px]" style={{ color: COLORS.ink }}>{question.title}</h3>
                      <p className="mt-2 max-w-[640px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>{question.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="work" className="scroll-mt-24 border-y bg-[#f8f9fa] px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24" style={{ borderColor: COLORS.border }}>
          <div className="mx-auto max-w-[1240px]">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-16">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: COLORS.grey }}>From questions to prototypes</p>
                <h2 className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] sm:text-[42px]" style={{ color: COLORS.ink }}>From a question to a better learning experience.</h2>
              </div>
              <p className="max-w-[650px] text-[16px] leading-[1.8]" style={{ color: COLORS.grey }}>
                Research at Visionary begins with a learner need, turns it into a testable product question, and studies what the experience helps a person do. Product signals can guide iteration, while stronger outcome claims require appropriate studies and public evidence.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { step: "01", title: "Frame the learning need", detail: "Begin with a specific difficulty a learner or educator can recognize in real work." },
                { step: "02", title: "Design and observe", detail: "Create an experience, examine how people use it, and separate useful signals from assumptions." },
                { step: "03", title: "Share what the evidence supports", detail: "Describe methods and limits clearly, and reserve outcome claims for findings that can support them." },
              ].map((item) => (
                <article key={item.step} className="rounded-[20px] border bg-white p-6 sm:p-7" style={{ borderColor: COLORS.mist }}>
                  <p className="text-[12px] font-medium uppercase tracking-[0.14em]" style={{ color: COLORS.blue }}>{item.step} / Research practice</p>
                  <h3 className="mt-4 text-[21px] font-normal leading-[1.35]" style={{ color: COLORS.ink }}>{item.title}</h3>
                  <p className="mt-3 text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="publications" className="scroll-mt-24 px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: COLORS.grey }}>Public record</p>
                <h2 className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] sm:text-[42px]" style={{ color: COLORS.ink }}>Methods and public work</h2>
              </div>
              <div className="rounded-[24px] border p-7 sm:p-9" style={{ borderColor: COLORS.mist }}>
                <p className="text-[12px] font-medium uppercase tracking-[0.14em]" style={{ color: COLORS.blue }}>Research record</p>
                <h3 className="mt-4 text-[25px] font-normal leading-[1.3] tracking-[-0.02em]" style={{ color: COLORS.ink }}>Public evidence will live here.</h3>
                <p className="mt-4 max-w-[700px] text-[15px] leading-[1.75]" style={{ color: COLORS.grey }}>
                  Visionary has not published formal research papers yet. When work is ready, this page will link to the method, contributors, evidence, and limitations so readers can assess the finding for themselves.
                </p>
                <div className="mt-7 flex flex-wrap gap-x-7 gap-y-4">
                  <Link to="/updates" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
                    Visit product updates <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                  </Link>
                  <Link to="/contact" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
                    Contact Visionary <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" aria-label="Research contact" className="scroll-mt-24 border-t px-6 py-12 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto flex max-w-[1240px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[17px] font-medium" style={{ color: COLORS.ink }}>Have a research question?</h2>
              <p className="mt-1 text-[14px]" style={{ color: COLORS.grey }}>Write to the Visionary team.</p>
            </div>
            <a href="mailto:research@visionary.org.in" className="inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
              research@visionary.org.in <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </a>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
