import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  ChevronRight,
  Lock,
  Mail,
  MessageCircle,
  Newspaper,
  ShieldCheck,
  UsersRound,
  Lightbulb,
  FlaskConical,
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

const ROUTES = [
  { id: "general", icon: MessageCircle, title: "General questions", description: "Questions about Visionary, the product, how it works, or getting started.", email: "hello@visionary.org.in" },
  { id: "institutions", icon: Building2, title: "Schools and institutions", description: "Talk with us about bringing Visionary to a school, college, coaching organization, or workplace.", email: "partnerships@visionary.org.in" },
  { id: "press", icon: Newspaper, title: "Press and media", description: "For journalists, writers, researchers, and people covering Visionary.", email: "press@visionary.org.in" },
  { id: "safety", icon: ShieldCheck, title: "Safety and privacy", description: "Report a safety concern, privacy issue, or something that should not be happening.", email: "safety@visionary.org.in" },
];

const FORM_TYPES = [
  "General question",
  "School or institution",
  "Partnership",
  "Press or media",
  "Safety or privacy",
  "Research",
  "Careers",
  "Other",
];

const NAV_SECTIONS = [
  { id: "contact-routes", number: "01", title: "Contact routes", summary: "Choose the conversation that fits your question." },
  { id: "form", number: "02", title: "Send a message", summary: "Tell us what you are trying to solve." },
  { id: "before-writing", number: "03", title: "Before you write", summary: "A little context helps the right person understand your message." },
  { id: "trust", number: "04", title: "Privacy and safety", summary: "What to do with information that needs more care." },
  { id: "company", number: "05", title: "Other ways to reach us", summary: "Careers, research, and other company conversations." },
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

function ContactCard({ icon: Icon, title, description, email }) {
  return (
    <div className="flex h-full flex-col rounded-[22px] border bg-white p-6 sm:p-7" style={{ borderColor: COLORS.border }}>
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
        <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
      </div>
      <h3 className="mt-5 text-[19px] font-normal leading-[1.3]" style={{ color: COLORS.ink }}>{title}</h3>
      <p className="mt-3 flex-1 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{description}</p>
      <a href={`mailto:${email}`} className="mt-6 inline-flex items-center gap-1.5 text-[14px] break-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
        {email}
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
      </a>
    </div>
  );
}

function Callout({ icon: Icon, title, children }) {
  return (
    <div className="rounded-[22px] border p-6 sm:p-7" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.white }}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} style={{ color: COLORS.blue }} />
        </div>
        <div>
          <h3 className="text-[17px] font-normal" style={{ color: COLORS.ink }}>{title}</h3>
          <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{children}</p>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const [activeId, setActiveId] = useState("contact-routes");
  const [showMobileContents, setShowMobileContents] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("General question");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const activeSection = useMemo(
    () => NAV_SECTIONS.find((section) => section.id === activeId),
    [activeId]
  );

  useEffect(() => {
    const observers = [];
    NAV_SECTIONS.forEach((section) => {
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
    if (!hash || !NAV_SECTIONS.some((section) => section.id === hash)) return;
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "auto", block: "start" });
      setActiveId(hash);
    });
  }, []);

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
            <div className="max-w-[980px]">
              <div className="mb-5 flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>
                <Mail className="h-4 w-4" strokeWidth={1.7} />
                Contact
              </div>
              <h1 className="max-w-[950px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px]" style={{ color: COLORS.ink }}>
                Get in touch.
                <br />
                <span style={{ color: COLORS.blue }}>Start with what you need.</span>
              </h1>
              <p className="mt-8 max-w-[800px] text-[18px] leading-[1.6] tracking-[0.005em] sm:text-[20px]" style={{ color: COLORS.grey }}>
                Whether you have a question about Visionary, want to bring it to an institution, have found something that needs attention, or simply want to talk about the work—we want to know what you are trying to solve.
              </p>
            </div>
          </div>
        </section>

        {/* STORY BAND */}
        <section className="border-b" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
          <div className="mx-auto max-w-[1240px] px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
            <div className="max-w-[940px]">
              <p className="text-[28px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[40px]" style={{ color: COLORS.ink }}>
                You do not need to know
                <br className="hidden sm:block" />
                <span style={{ color: COLORS.blue }}>who at Visionary to contact.</span>
              </p>
              <p className="mt-6 max-w-[760px] text-[17px] leading-[1.75]" style={{ color: COLORS.grey }}>
                Start with the thing you are trying to understand, fix, build, or discuss. We route the conversation from there.
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
                  {NAV_SECTIONS.map((section) => {
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
                  <nav aria-label="Contact sections">
                    <div className="space-y-1">
                      {NAV_SECTIONS.map((section) => {
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
                      One conversation at a time. Start with the thing that brought you here.
                    </p>
                  </div>
                </div>
              </aside>

              <div className="min-w-0">
                <article className="divide-y divide-[#e5e7eb]">
                  {/* 01 */}
                  <section id="contact-routes" className="scroll-mt-24 pb-14 sm:pb-16">
                    <SectionHeading number="01" title="Contact routes" />
                    <Paragraph>Different questions need different conversations. Choose the closest one below. You do not need to get the category exactly right.</Paragraph>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      {ROUTES.map((route) => (
                        <ContactCard key={route.id} icon={route.icon} title={route.title} description={route.description} email={route.email} />
                      ))}
                    </div>
                  </section>

                  {/* 02 */}
                  <section id="form" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="02" title="Send a message" />
                    <Paragraph>Tell us what is happening, what you are trying to do, or what you need help understanding.</Paragraph>
                    <div className="mt-8 rounded-[24px] border bg-white p-6 sm:p-8" style={{ borderColor: COLORS.border }}>
                      {submitted ? (
                        <div className="py-8">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[16px]" style={{ backgroundColor: COLORS.blueSoft }}>
                            <Mail className="h-5 w-5" strokeWidth={1.7} style={{ color: COLORS.blue }} />
                          </div>
                          <h3 className="mt-6 text-[28px] font-normal tracking-[-0.025em]" style={{ color: COLORS.ink }}>Your message is ready.</h3>
                          <p className="mt-3 max-w-[620px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                            The form is connected to the page experience, but the production submission endpoint still needs to be connected before launch.
                          </p>
                          <button type="button" onClick={() => setSubmitted(false)}
                            className="mt-6 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ color: COLORS.blue }}>
                            Send another message
                            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit}>
                          <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                              <label htmlFor="contact-name" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Name</label>
                              <input id="contact-name" name="name" type="text" autoComplete="name" required value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                                style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                            </div>
                            <div>
                              <label htmlFor="contact-email" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Email</label>
                              <input id="contact-email" name="email" type="email" autoComplete="email" required value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                                style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                            </div>
                          </div>
                          <div className="mt-6">
                            <label htmlFor="contact-type" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>What is this about?</label>
                            <select id="contact-type" name="type" value={type}
                              onChange={(event) => setType(event.target.value)}
                              className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                              style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                              {FORM_TYPES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                              ))}
                            </select>
                          </div>
                          <div className="mt-6">
                            <label htmlFor="contact-message" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Message</label>
                            <textarea id="contact-message" name="message" required value={message}
                              onChange={(event) => setMessage(event.target.value)} rows={7}
                              placeholder="Tell us what you are trying to understand, solve, or build."
                              className="mt-2 w-full resize-y rounded-[14px] border bg-white px-4 py-3 text-[15px] leading-[1.6] outline-none transition-colors placeholder:text-[#9AA0A6] focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                              style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                          </div>
                          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="max-w-[530px] text-[12px] leading-[1.6]" style={{ color: COLORS.grey }}>
                              Please do not include passwords, payment card numbers, or other sensitive information that is not needed to answer your question.
                            </p>
                            <button type="submit"
                              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
                              style={{ backgroundColor: COLORS.blue }}>
                              Send message
                              <ArrowUpRight className="ml-2 h-4 w-4" strokeWidth={1.8} />
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </section>

                  {/* 03 */}
                  <section id="before-writing" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="03" title="Before you write" />
                    <Paragraph>The best contact messages are not necessarily long. They simply give enough context for someone to understand what happened and what you need.</Paragraph>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <Callout icon={MessageCircle} title="What happened?">Describe the question, problem, or situation that brought you here.</Callout>
                      <Callout icon={Lightbulb} title="What are you trying to do?">Tell us the outcome you are looking for.</Callout>
                      <Callout icon={UsersRound} title="Who is it for?">A student, teacher, parent, professional, institution, or something else?</Callout>
                    </div>
                  </section>

                  {/* 04 */}
                  <section id="trust" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="04" title="Privacy and safety" />
                    <Paragraph>Some conversations need more care than a normal product question.</Paragraph>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <Callout icon={ShieldCheck} title="Safety concern">Use the safety route when you see harmful, unsafe, abusive, or otherwise concerning behavior involving Visionary.</Callout>
                      <Callout icon={Lock} title="Privacy concern">Contact us when you believe personal information has been handled incorrectly or your privacy rights need attention.</Callout>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                      <Link to="/safety" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
                        Safety <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                      </Link>
                      <Link to="/privacy" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
                        Privacy <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                      </Link>
                      <Link to="/security" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
                        Security <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                      </Link>
                    </div>
                  </section>

                  {/* 05 */}
                  <section id="company" className="scroll-mt-24 pt-14 sm:pt-16">
                    <SectionHeading number="05" title="Other ways to reach us" />
                    <Paragraph>Some conversations already have a home elsewhere in Visionary.</Paragraph>
                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      <Link to="/careers" className="group rounded-[22px] border p-6 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ borderColor: COLORS.border }}>
                        <Briefcase className="h-5 w-5" strokeWidth={1.7} style={{ color: COLORS.blue }} />
                        <h3 className="mt-5 text-[18px] font-normal" style={{ color: COLORS.ink }}>Careers</h3>
                        <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>Ask about joining the team or introducing your work.</p>
                        <span className="mt-5 inline-flex items-center gap-1 text-[14px]" style={{ color: COLORS.blue }}>
                          Visit Careers
                          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
                        </span>
                      </Link>
                      <Link to="/research" className="group rounded-[22px] border p-6 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ borderColor: COLORS.border }}>
                        <FlaskConical className="h-5 w-5" strokeWidth={1.7} style={{ color: COLORS.blue }} />
                        <h3 className="mt-5 text-[18px] font-normal" style={{ color: COLORS.ink }}>Research</h3>
                        <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>Explore research questions or discuss collaboration.</p>
                        <span className="mt-5 inline-flex items-center gap-1 text-[14px]" style={{ color: COLORS.blue }}>
                          Explore Research
                          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
                        </span>
                      </Link>
                      <a href="mailto:hello@visionary.org.in" className="group rounded-[22px] border p-6 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ borderColor: COLORS.border }}>
                        <Mail className="h-5 w-5" strokeWidth={1.7} style={{ color: COLORS.blue }} />
                        <h3 className="mt-5 text-[18px] font-normal" style={{ color: COLORS.ink }}>Everything else</h3>
                        <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>Start with our general address and we will route it.</p>
                        <span className="mt-5 inline-flex items-center gap-1 text-[14px]" style={{ color: COLORS.blue }}>
                          hello@visionary.org.in
                          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
                        </span>
                      </a>
                    </div>
                  </section>
                </article>

                {/* CLOSING */}
                <section className="mt-20 border-t border-[#e5e7eb] pt-14 sm:mt-24 sm:pt-16">
                  <div className="max-w-[900px]">
                    <div className="mb-5 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.blue }}>Contact</div>
                    <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] sm:text-[48px]" style={{ color: COLORS.ink }}>
                      Start with the question.
                      <br />
                      <span style={{ color: COLORS.blue }}>We will find the conversation.</span>
                    </h2>
                    <p className="mt-6 max-w-[720px] text-[17px] leading-[1.7]" style={{ color: COLORS.grey }}>
                      Visionary is being built through questions too. Some come from learners. Some come from teachers, parents, institutions, researchers, and people building the company.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <a href="mailto:hello@visionary.org.in"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                        style={{ backgroundColor: COLORS.blue }}>
                        hello@visionary.org.in
                        <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                      </a>
                      <Link to="/help" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        Visit Help
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