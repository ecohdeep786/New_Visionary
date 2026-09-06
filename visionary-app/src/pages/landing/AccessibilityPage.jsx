import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Accessibility as AccessibilityIcon,
  ChevronRight,
  Eye,
  Keyboard,
  Mic,
  Volume2,
  MessageCircle,
  Smartphone,
  Monitor,
  UsersRound,
  Mail,
  ArrowUpRight,
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
  { id: "why-accessibility", number: "01", title: "Why accessibility matters", summary: "Learning should not depend on having only one way to understand or participate." },
  { id: "different-ways", number: "02", title: "Different ways to use Visionary", summary: "Different people need different ways to interact with the same intelligence." },
  { id: "vision", number: "03", title: "Seeing and reading", summary: "Make information easier to read, focus on, and understand." },
  { id: "voice", number: "04", title: "Speaking and listening", summary: "Voice can be another way to ask, answer, learn, and continue." },
  { id: "navigation", number: "05", title: "Navigation and interaction", summary: "The interface should work with the ways people already navigate devices." },
  { id: "across-devices", number: "06", title: "Across your devices", summary: "The experience should remain usable wherever your learning happens." },
  { id: "building", number: "07", title: "What we are building", summary: "Accessibility is ongoing as Visionary becomes a larger product." },
  { id: "feedback", number: "08", title: "Tell us what is missing", summary: "The people using Visionary should help shape how it becomes more accessible." },
  { id: "contact", number: "09", title: "Contact", summary: "How to reach Visionary about accessibility." },
];

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
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

function FeatureCard({ icon: Icon, eyebrow, title, children }) {
  return (
    <div className="rounded-[22px] border bg-white p-6 sm:p-7" style={{ borderColor: COLORS.border }}>
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
        <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
      </div>
      <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.lightGrey }}>{eyebrow}</div>
      <h3 className="mt-1.5 text-[19px] font-normal leading-[1.3]" style={{ color: COLORS.ink }}>{title}</h3>
      <div className="mt-3">
        <p className="text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{children}</p>
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

export default function AccessibilityPage() {
  const [activeId, setActiveId] = useState("why-accessibility");
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
      const element = document.getElementById(hash);
      element?.scrollIntoView({ behavior: "auto", block: "start" });
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
                <AccessibilityIcon className="h-4 w-4" strokeWidth={1.7} />
                Accessibility
              </div>
              <h1 className="max-w-[940px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px]" style={{ color: COLORS.ink }}>
                Learn your way.
                <br />
                <span style={{ color: COLORS.blue }}>Use Visionary your way.</span>
              </h1>
              <p className="mt-8 max-w-[780px] text-[18px] leading-[1.6] tracking-[0.005em] sm:text-[20px]" style={{ color: COLORS.grey }}>
                People do not all read, hear, speak, move, or interact with technology in the same way. Visionary should make room for those differences so more people can understand, practise, create, and continue.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px]">
                <span style={{ color: COLORS.grey }}>Designed for different ways of learning and interacting</span>
                <span className="hidden h-1 w-1 rounded-full sm:block" style={{ backgroundColor: COLORS.mist }} />
                <a href="mailto:accessibility@visionary.org.in"
                  className="inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                  style={{ color: COLORS.blue }}>
                  accessibility@visionary.org.in
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
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
                The goal is not to make everyone use Visionary the same way.
                <br className="hidden lg:block" />
                <span style={{ color: COLORS.blue }}>It is to give more people a way in.</span>
              </p>
              <p className="mt-6 max-w-[760px] text-[17px] leading-[1.75]" style={{ color: COLORS.grey }}>
                Accessibility is part of the product experience. It affects how information is presented, how people interact with Visionary, and how easily someone can keep going when the usual way of doing something does not work for them.
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

        {/* ACCESSIBILITY CONTENT */}
        <section>
          <div className="mx-auto max-w-[1240px] px-6 py-12 sm:px-8 lg:px-10 lg:py-20">
            <div className="grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20">
              {/* DESKTOP CONTENTS */}
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>Contents</div>
                  <nav aria-label="Accessibility sections">
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

              {/* MAIN CONTENT */}
              <div className="min-w-0">
                <article className="divide-y divide-[#e5e7eb]">
                  {/* 01 */}
                  <section id="why-accessibility" className="scroll-mt-24 pb-14 sm:pb-16">
                    <SectionHeading number="01" title="Why accessibility matters" />
                    <Paragraph>Learning should not depend on having only one way to understand or participate.</Paragraph>
                    <div className="mt-5"><Paragraph>Someone may prefer to listen instead of read. Someone else may need larger text, stronger contrast, keyboard navigation, or more time to process information. Another person may use a different device or input method entirely.</Paragraph></div>
                    <div className="mt-5"><Paragraph>Visionary's goal is to make its learning experience flexible enough to accommodate different needs without making people feel like they are using a different product.</Paragraph></div>
                    <Note>Accessibility is not a separate audience. It is part of building a product that more people can use.</Note>
                  </section>

                  {/* 02 */}
                  <section id="different-ways" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="02" title="Different ways to use Visionary" />
                    <Paragraph>The same idea can be reached in more than one way.</Paragraph>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <FeatureCard icon={Eye} eyebrow="See" title="Read and view">Information should remain understandable when people need to enlarge, simplify, or adjust how they view it.</FeatureCard>
                      <FeatureCard icon={Volume2} eyebrow="Hear" title="Listen and follow">Spoken explanations can provide another way to receive information and stay with an idea.</FeatureCard>
                      <FeatureCard icon={Mic} eyebrow="Speak" title="Use your voice">Voice can be another way to ask questions, explain an idea, or interact with learning tools.</FeatureCard>
                      <FeatureCard icon={Keyboard} eyebrow="Navigate" title="Use your controls">The experience should work with the navigation and interaction methods people use on their devices.</FeatureCard>
                    </div>
                  </section>

                  {/* 03 */}
                  <section id="vision" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="03" title="Seeing and reading" />
                    <Paragraph>Visual presentation can change whether information is easy to understand or difficult to reach.</Paragraph>
                    <div className="mt-5"><Paragraph>Visionary should use clear hierarchy, readable typography, sufficient contrast, meaningful labels, and layouts that remain usable as text size or display conditions change.</Paragraph></div>
                    <div className="mt-5"><Paragraph>Where external device or operating-system features help someone personalize their experience, Visionary should work with those capabilities rather than fighting them.</Paragraph></div>
                    <Note>Specific support for screen readers, magnification, high-contrast modes, color adjustments, and other assistive technologies should be documented against the versions of Visionary that actually support them.</Note>
                  </section>

                  {/* 04 */}
                  <section id="voice" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="04" title="Speaking and listening" />
                    <Paragraph>Voice can make interaction more natural for people who cannot, or simply prefer not to, rely on typing and reading alone.</Paragraph>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <FeatureCard icon={Mic} eyebrow="Input" title="Ask naturally">Voice interaction can provide another path into a question, explanation, or learning activity.</FeatureCard>
                      <FeatureCard icon={MessageCircle} eyebrow="Conversation" title="Keep the conversation going">A conversational interface can reduce the need to translate a thought into a rigid interface action.</FeatureCard>
                      <FeatureCard icon={Volume2} eyebrow="Output" title="Hear information">Spoken output can make explanations easier to follow in situations where reading is difficult or tiring.</FeatureCard>
                      <FeatureCard icon={UsersRound} eyebrow="Choice" title="Use the mode that works">Accessibility should increase choice rather than force one interaction style on everyone.</FeatureCard>
                    </div>
                    <Note>Current voice features should be listed here only after the exact supported devices, languages, and interaction behavior have been verified.</Note>
                  </section>

                  {/* 05 */}
                  <section id="navigation" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="05" title="Navigation and interaction" />
                    <Paragraph>An accessible interface is also an interface that can be operated predictably.</Paragraph>
                    <div className="mt-5"><Paragraph>Visionary should support clear focus states, logical navigation order, understandable controls, usable touch targets, and keyboard interaction wherever applicable.</Paragraph></div>
                    <div className="mt-5"><Paragraph>Interactive content should communicate what is happening, what changed, and what the user can do next.</Paragraph></div>
                    <Note>Accessibility testing should include keyboard navigation, focus behavior, screen-reader review, responsive layouts, zoom, reduced-motion preferences, and representative assistive technologies.</Note>
                  </section>

                  {/* 06 */}
                  <section id="across-devices" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="06" title="Across your devices" />
                    <Paragraph>Learning does not always happen at the same desk.</Paragraph>
                    <div className="mt-5"><Paragraph>Visionary's current product direction supports use across web, desktop, and mobile, so the same learning journey can move with the person using it.</Paragraph></div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <FeatureCard icon={Monitor} eyebrow="Web" title="In the browser">Open Visionary without requiring a separate desktop installation.</FeatureCard>
                      <FeatureCard icon={Smartphone} eyebrow="Mobile" title="On smaller screens">The experience should remain readable, tappable, and understandable on mobile devices.</FeatureCard>
                      <FeatureCard icon={Monitor} eyebrow="Desktop" title="At your desk">Desktop experiences should preserve the same underlying learning journey.</FeatureCard>
                    </div>
                    <Note>The exact platforms and accessibility capabilities should stay synchronized with the Download page as products are released.</Note>
                  </section>

                  {/* 07 */}
                  <section id="building" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="07" title="What we are building" />
                    <Paragraph>Accessibility is not a checkbox that gets completed once.</Paragraph>
                    <div className="mt-5"><Paragraph>As Visionary grows, accessibility should be part of product decisions, interface design, engineering, testing, and research—not something added after the product is finished.</Paragraph></div>
                    <div className="mt-5"><Paragraph>That includes testing with real users, identifying barriers early, and improving the experience when a person tells us that something does not work for them.</Paragraph></div>
                    <div className="mt-6 rounded-[22px] border p-6 sm:p-7">
                      <div className="flex items-start gap-4">
                        <AccessibilityIcon className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.6} style={{ color: COLORS.blue }} />
                        <div>
                          <h3 className="text-[19px] font-normal" style={{ color: COLORS.ink }}>Build with people, not assumptions.</h3>
                          <p className="mt-3 max-w-[680px] text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>
                            Accessibility becomes better when the people experiencing barriers have a meaningful role in identifying and solving them.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 08 */}
                  <section id="feedback" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="08" title="Tell us what is missing" />
                    <Paragraph>You should not have to work around a product in silence.</Paragraph>
                    <div className="mt-5"><Paragraph>Tell us when a page, control, explanation, interaction, or device experience creates a barrier. Specific details help us understand what happened and where it happened.</Paragraph></div>
                    <div className="mt-6">
                      <a href="mailto:accessibility@visionary.org.in"
                        className="inline-flex items-center gap-2 text-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                        style={{ color: COLORS.blue }}>
                        accessibility@visionary.org.in
                        <ArrowUpRight className="h-5 w-5" strokeWidth={1.7} />
                      </a>
                    </div>
                    <Note>This mailbox should be actively monitored before the address is published as an official accessibility support channel.</Note>
                  </section>

                  {/* 09 */}
                  <section id="contact" className="scroll-mt-24 pt-14 sm:pt-16">
                    <SectionHeading number="09" title="Contact" />
                    <Paragraph>For accessibility questions, accessibility feedback, or barriers using Visionary, contact:</Paragraph>
                    <div className="mt-6">
                      <a href="mailto:accessibility@visionary.org.in"
                        className="inline-flex items-center gap-2 text-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                        style={{ color: COLORS.blue }}>
                        accessibility@visionary.org.in
                        <ArrowUpRight className="h-5 w-5" strokeWidth={1.7} />
                      </a>
                    </div>
                    <div className="mt-6">
                      <Link to="/help" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
                        Visit Help
                        <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                      </Link>
                    </div>
                  </section>
                </article>

                {/* CLOSING */}
                <section className="mt-20 border-t border-[#e5e7eb] pt-14 sm:mt-24 sm:pt-16">
                  <div className="max-w-[900px]">
                    <div className="mb-5 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.blue }}>Accessibility</div>
                    <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] sm:text-[48px]" style={{ color: COLORS.ink }}>
                      Understanding should have
                      <br />
                      <span style={{ color: COLORS.blue }}>more than one way in.</span>
                    </h2>
                    <p className="mt-6 max-w-[720px] text-[17px] leading-[1.7]" style={{ color: COLORS.grey }}>
                      Visionary is built around the idea that people learn differently. Accessibility is part of making that idea real.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <Link to="/download" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        See devices
                      </Link>
                      <Link to="/privacy" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        Privacy
                      </Link>
                      <Link to="/security" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        Security
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