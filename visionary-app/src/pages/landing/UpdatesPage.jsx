import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Languages,
  Lightbulb,
  Mail,
  Settings2,
  Sparkles,
  UsersRound,
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
  blueSoft: "#D2E3FC",
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
  { id: "why", number: "01", title: "Why stay connected", summary: "What updates are for and why they exist." },
  { id: "what-you-get", number: "02", title: "What you will hear about", summary: "Product changes, new languages, research, and useful things worth knowing." },
  { id: "choose", number: "03", title: "Choose what matters", summary: "Select the kinds of updates that are relevant to you." },
  { id: "product", number: "04", title: "Product updates", summary: "Follow the changes that make Visionary more useful." },
  { id: "language", number: "05", title: "Language and access", summary: "Hear when new language and accessibility experiences become available." },
  { id: "research", number: "06", title: "Research and learning", summary: "Follow the questions Visionary is exploring and what we learn." },
  { id: "events", number: "07", title: "Events and conversations", summary: "Hear about relevant sessions, community conversations, and opportunities." },
  { id: "signup", number: "08", title: "Sign up", summary: "Choose your updates and tell us where to send them." },
  { id: "privacy", number: "09", title: "Your inbox, your choice", summary: "How your email preference and personal information should be handled." },
  { id: "contact", number: "10", title: "Contact", summary: "How to reach Visionary about updates." },
];

const UPDATE_OPTIONS = [
  { id: "product", icon: Sparkles, title: "Product updates", description: "New Visionary capabilities, improvements, and important changes." },
  { id: "language", icon: Languages, title: "Languages and access", description: "New language experiences and accessibility improvements." },
  { id: "research", icon: BookOpen, title: "Research and learning", description: "Research, experiments, findings, and thinking behind the product." },
  { id: "community", icon: UsersRound, title: "Community and events", description: "Community opportunities, conversations, workshops, and events." },
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

function UpdateCard({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="flex h-full flex-col rounded-[22px] border bg-white p-6 sm:p-7" style={{ borderColor: COLORS.border }}>
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
        <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
      </div>
      <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.lightGrey }}>{eyebrow}</div>
      <h3 className="mt-1.5 text-[19px] font-normal leading-[1.3]" style={{ color: COLORS.ink }}>{title}</h3>
      <p className="mt-3 flex-1 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{description}</p>
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

export default function UpdatesPage() {
  const [activeId, setActiveId] = useState("why");
  const [showMobileContents, setShowMobileContents] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState(["product", "language"]);
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  function toggleOption(id) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return [...current, id];
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        {/* HERO */}
        <section className="border-b pt-28 sm:pt-32" style={{ borderColor: COLORS.border }}>
          <div className="mx-auto max-w-[1240px] px-6 pb-16 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
            <div className="max-w-[1000px]">
              <div className="mb-5 flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>
                <Bell className="h-4 w-4" strokeWidth={1.7} />
                Visionary Updates
              </div>
              <h1 className="max-w-[960px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px]" style={{ color: COLORS.ink }}>
                Stay close to
                <br />
                <span style={{ color: COLORS.blue }}>what comes next.</span>
              </h1>
              <p className="mt-8 max-w-[800px] text-[18px] leading-[1.6] tracking-[0.005em] sm:text-[20px]" style={{ color: COLORS.grey }}>
                Visionary is changing as we build it. New product capabilities, languages, research, and conversations will shape what comes next. Sign up to hear about the things that matter to you.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a href="#signup" onClick={(event) => { event.preventDefault(); scrollToSection("signup"); }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
                  style={{ backgroundColor: COLORS.blue }}>
                  Get updates
                  <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                </a>
                <a href="#what-you-get" onClick={(event) => { event.preventDefault(); scrollToSection("what-you-get"); }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border px-7 text-[15px] transition-colors hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                  style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                  See what you will receive
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
                The product changes.
                <br />
                <span style={{ color: COLORS.blue }}>You should know when it does.</span>
              </p>
              <p className="mt-6 max-w-[760px] text-[17px] leading-[1.75]" style={{ color: COLORS.grey }}>
                Updates are a way to keep the relationship with Visionary going beyond the moment you first discover it. The point is useful information—not a crowded inbox.
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

        {/* CONTENT */}
        <section>
          <div className="mx-auto max-w-[1240px] px-6 py-12 sm:px-8 lg:px-10 lg:py-20">
            <div className="grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20">
              {/* DESKTOP CONTENTS */}
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>Contents</div>
                  <nav aria-label="Updates sections">
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
                    <SectionHeading number="01" title="Why stay connected" />
                    <Paragraph>Visionary is being built continuously. The product you see today is not the end of the journey.</Paragraph>
                    <div className="mt-5"><Paragraph>Staying connected gives you a way to hear about meaningful changes without having to keep checking the site to discover them.</Paragraph></div>
                    <div className="mt-6">
                      <UpdateCard icon={Bell} eyebrow="The idea" title="Useful, not constant" description="Updates should appear when there is something worth telling you—not simply because there is an empty space in an email calendar." />
                    </div>
                  </section>

                  {/* 02 */}
                  <section id="what-you-get" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="02" title="What you will hear about" />
                    <Paragraph>The information should follow the things Visionary is actually working on.</Paragraph>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      {UPDATE_OPTIONS.map((option) => (
                        <UpdateCard key={option.id} icon={option.icon} eyebrow="Updates" title={option.title} description={option.description} />
                      ))}
                    </div>
                  </section>

                  {/* 03 */}
                  <section id="choose" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="03" title="Choose what matters" />
                    <Paragraph>Not everyone needs every update. You should be able to choose the conversations that are relevant to you.</Paragraph>
                    <div className="mt-6">
                      <div className="overflow-hidden rounded-[22px] border bg-white" style={{ borderColor: COLORS.border }}>
                        {UPDATE_OPTIONS.map((option) => {
                          const active = selected.includes(option.id);
                          const Icon = option.icon;
                          return (
                            <button key={option.id} type="button" onClick={() => toggleOption(option.id)} aria-pressed={active}
                              className="flex w-full items-start gap-4 border-b p-5 text-left last:border-b-0 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-inset"
                              style={{ borderColor: COLORS.border }}>
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: active ? COLORS.blueSoft : COLORS.soft }}>
                                <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} style={{ color: COLORS.blue }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-[16px] font-normal" style={{ color: COLORS.ink }}>{option.title}</h3>
                                <p className="mt-1 text-[13px] leading-[1.6]" style={{ color: COLORS.grey }}>{option.description}</p>
                              </div>
                              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                                style={{ borderColor: active ? COLORS.blue : COLORS.mist, backgroundColor: active ? COLORS.blue : COLORS.white }}>
                                {active && <CheckCircle2 className="h-5 w-5" strokeWidth={2} style={{ color: COLORS.white }} />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <Note>Preferences should be stored separately from the content of the email itself, so people can change what they receive without having to subscribe again.</Note>
                  </section>

                  {/* 04 */}
                  <section id="product" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="04" title="Product updates" />
                    <Paragraph>This is where the relationship becomes useful: you hear when Visionary itself changes.</Paragraph>
                    <div className="mt-6">
                      <div className="overflow-hidden rounded-[22px] border bg-white" style={{ borderColor: COLORS.border }}>
                        <PrincipleRow icon={Sparkles} title="New capabilities">Learn when meaningful new ways to understand, practise, build, or continue become available.</PrincipleRow>
                        <PrincipleRow icon={Settings2} title="Important improvements">Hear about changes that materially improve the experience or how Visionary works.</PrincipleRow>
                        <PrincipleRow icon={BookOpen} title="What changed and why">Where useful, explain the problem behind a product change rather than simply announcing a new button.</PrincipleRow>
                      </div>
                    </div>
                  </section>

                  {/* 05 */}
                  <section id="language" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="05" title="Language and access" />
                    <Paragraph>Visionary's product is built around the idea that people should be able to learn and communicate in ways that fit them.</Paragraph>
                    <div className="mt-5"><Paragraph>New language experiences, accessibility improvements, and other ways of reaching the product should be easy to discover when they become available.</Paragraph></div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <UpdateCard icon={Languages} eyebrow="Language" title="New ways to communicate" description="Hear about newly supported language experiences and improvements." />
                      <UpdateCard icon={UsersRound} eyebrow="Access" title="New ways to participate" description="Hear about accessibility improvements and changes that make Visionary easier to use." />
                    </div>
                  </section>

                  {/* 06 */}
                  <section id="research" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="06" title="Research and learning" />
                    <Paragraph>Some of the most valuable updates may not be product announcements at all.</Paragraph>
                    <div className="mt-5"><Paragraph>Visionary is exploring questions around learning, AI, language, memory, adaptation, and how understanding becomes something a person can use. When there is research worth sharing, this is one way to stay close to it.</Paragraph></div>
                    <div className="mt-6">
                      <Link to="/research" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
                        Explore Research
                        <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                      </Link>
                    </div>
                  </section>

                  {/* 07 */}
                  <section id="events" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="07" title="Events and conversations" />
                    <Paragraph>When Visionary has something useful to discuss with people directly, we can tell you about it here.</Paragraph>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <UpdateCard icon={UsersRound} eyebrow="Community" title="Community conversations" description="Discussions and opportunities to learn from other people working on similar problems." />
                      <UpdateCard icon={GraduationCap} eyebrow="Education" title="Learning sessions" description="Sessions that help educators, learners, and institutions understand the product or the ideas behind it." />
                      <UpdateCard icon={Lightbulb} eyebrow="Product" title="Product conversations" description="Occasions to hear what we are building, why we are building it, and what we are learning." />
                    </div>
                    <Note>Upcoming events should appear here only when they are real, scheduled, and open for the audience being shown.</Note>
                  </section>

                  {/* 08 */}
                  <section id="signup" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="08" title="Sign up" />
                    <Paragraph>Choose what you want to hear about and give us an email address where we can reach you.</Paragraph>
                    <div className="mt-8 rounded-[24px] border bg-white p-6 sm:p-8" style={{ borderColor: COLORS.border }}>
                      {submitted ? (
                        <div className="py-8">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[16px]" style={{ backgroundColor: COLORS.blueSoft }}>
                            <CheckCircle2 className="h-5 w-5" strokeWidth={1.7} style={{ color: COLORS.blue }} />
                          </div>
                          <h3 className="mt-6 text-[28px] font-normal tracking-[-0.025em]" style={{ color: COLORS.ink }}>You are on the list.</h3>
                          <p className="mt-3 max-w-[650px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                            Your preferences are ready to be sent to Visionary's updates service. The production subscription endpoint still needs to be connected before this form goes live.
                          </p>
                          <button type="button" onClick={() => setSubmitted(false)}
                            className="mt-6 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ color: COLORS.blue }}>
                            Change your preferences
                            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit}>
                          <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                              <label htmlFor="updates-name" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Name</label>
                              <input id="updates-name" name="name" type="text" autoComplete="name" required value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                                style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                            </div>
                            <div>
                              <label htmlFor="updates-email" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Email</label>
                              <input id="updates-email" name="email" type="email" autoComplete="email" required value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                                style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                            </div>
                          </div>
                          <div className="mt-7">
                            <div className="text-[13px] font-medium" style={{ color: COLORS.ink }}>What would you like to receive?</div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              {UPDATE_OPTIONS.map((option) => {
                                const active = selected.includes(option.id);
                                const Icon = option.icon;
                                return (
                                  <button key={option.id} type="button" onClick={() => toggleOption(option.id)} aria-pressed={active}
                                    className="flex items-start gap-3 rounded-[16px] border p-4 text-left transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                                    style={{ borderColor: active ? COLORS.blue : COLORS.mist, backgroundColor: active ? "#F8FAFF" : COLORS.white }}>
                                    <Icon className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: COLORS.blue }} />
                                    <span className="min-w-0">
                                      <span className="block text-[14px]" style={{ color: COLORS.ink }}>{option.title}</span>
                                      <span className="mt-1 block text-[12px] leading-[1.55]" style={{ color: COLORS.grey }}>{option.description}</span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="mt-7 rounded-[16px] border p-4" style={{ borderColor: COLORS.border }}>
                            <label className="flex items-start gap-3">
                              <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[#4285F4]" />
                              <span className="text-[13px] leading-[1.65]" style={{ color: COLORS.grey }}>
                                I agree to receive the Visionary updates I selected. I understand that I can unsubscribe later.
                              </span>
                            </label>
                          </div>
                          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="max-w-[560px] text-[12px] leading-[1.6]" style={{ color: COLORS.grey }}>
                              We will use your information according to the Visionary Privacy Policy.
                            </p>
                            <button type="submit"
                              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
                              style={{ backgroundColor: COLORS.blue }}>
                              Keep me updated
                              <ArrowUpRight className="ml-2 h-4 w-4" strokeWidth={1.8} />
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </section>

                  {/* 09 */}
                  <section id="privacy" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="09" title="Your inbox, your choice" />
                    <Paragraph>Signing up should not mean giving up control.</Paragraph>
                    <div className="mt-6">
                      <div className="overflow-hidden rounded-[22px] border bg-white" style={{ borderColor: COLORS.border }}>
                        <PrincipleRow icon={Settings2} title="Choose your preferences">Receive the categories of updates you selected.</PrincipleRow>
                        <PrincipleRow icon={Mail} title="Change your mind">You should be able to unsubscribe or change your preferences without unnecessary friction.</PrincipleRow>
                        <PrincipleRow icon={UsersRound} title="Relevant communication">Updates should be useful to the audience receiving them rather than treating every person the same.</PrincipleRow>
                      </div>
                    </div>
                    <div className="mt-6">
                      <Link to="/privacy" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
                        Read the Privacy Policy
                        <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                      </Link>
                    </div>
                  </section>

                  {/* 10 */}
                  <section id="contact" className="scroll-mt-24 pt-14 sm:pt-16">
                    <SectionHeading number="10" title="Contact" />
                    <Paragraph>For questions about Visionary updates, subscriptions, or communication preferences:</Paragraph>
                    <div className="mt-6">
                      <a href="mailto:hello@visionary.org.in"
                        className="inline-flex items-center gap-2 text-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                        style={{ color: COLORS.blue }}>
                        hello@visionary.org.in
                        <ArrowUpRight className="h-5 w-5" strokeWidth={1.7} />
                      </a>
                    </div>
                  </section>
                </article>

                {/* CLOSING */}
                <section className="mt-20 border-t border-[#e5e7eb] pt-14 sm:mt-24 sm:pt-16">
                  <div className="max-w-[900px]">
                    <div className="mb-5 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.blue }}>Stay connected</div>
                    <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] sm:text-[48px]" style={{ color: COLORS.ink }}>
                      The next version of Visionary
                      <br />
                      <span style={{ color: COLORS.blue }}>starts with what we learn today.</span>
                    </h2>
                    <p className="mt-6 max-w-[720px] text-[17px] leading-[1.7]" style={{ color: COLORS.grey }}>
                      Stay close to the changes, questions, research, and ideas that shape what comes next.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <a href="#signup" onClick={(event) => { event.preventDefault(); scrollToSection("signup"); }}
                        className="inline-flex h-11 items-center justify-center rounded-full px-5 text-[15px] font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                        style={{ backgroundColor: COLORS.blue }}>
                        Get updates
                      </a>
                      <Link to="/research" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        Research
                      </Link>
                      <Link to="/community" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        Community
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