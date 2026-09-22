import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  Mail,
  MessageCircle,
  Newspaper,
  ShieldCheck,
  AlertCircle,
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
  darkblue: "#0b57d2",
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("General question");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error (deterministic mock)


  function handleSubmit(event) {
    event.preventDefault();
    const email = document.getElementById("contact-email")?.value || "";
    const name = document.getElementById("contact-name")?.value || "";
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setTimeout(() => setStatus("success"), 900); // deterministic mock — no backend yet
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
            <main id="main">
        <PageHeading page="Contact" eyebrow="Contact"
          h1={<>Talk to <Accent>us</Accent>.</>}
          dek="Pick the route that fits your question.">
        </PageHeading>

        {/* STORY BAND */}
        <section className="border-b" style={{ borderColor: COLORS.border }}>
          <div className="mx-auto max-w-[1240px] px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
            <div className="max-w-[940px]">
              <p className="text-[28px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[40px]" style={{ color: COLORS.ink }}>
                You do not need to know
                <br className="hidden sm:block" />
                <span style={{ color: COLORS.ink }}>who at Visionary to contact.</span>
              </p>
              <p className="mt-6 max-w-[760px] text-[17px] leading-[1.75]" style={{ color: COLORS.grey }}>
                Start with what you need. We route it from there.
              </p>
            </div>
          </div>
        </section>

        {/* 01 · CONTACT ROUTES — story grammar */},
        <StorySection
          id="contact-routes"
          title="Contact routes"
          featured={{
            subject: "mail",
            label: "One inbox",
            title: "Start with what you need.",
            dek: "We route the conversation from there.",
          }}
          rows={[
            { label: "Learners and teachers", title: "Help with using Visionary." },
            { label: "Institutions", title: "Bring Visionary to your school." },
            { label: "Safety and privacy", title: "Something that needs attention." },
            { label: "Press and research", title: "Questions about the work." },
          ]}
        />

<section id="form" className="scroll-mt-24 px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-[1240px]">
                    <SectionHeading number="02" title="Send a message" />
                    <Paragraph>Tell us what is happening, what you are trying to do, or what you need help understanding.</Paragraph>
                    <div className="mt-8 rounded-[24px] border bg-white p-6 sm:p-8" style={{ borderColor: COLORS.border }}>
                      {status === "error" ? (
                        <div className="py-8" role="alert">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist }}>
                            <AlertCircle className="h-5 w-5" strokeWidth={1.7} style={{ color: "#EA4335" }} />
                          </div>
                          <h3 className="mt-6 text-[28px] font-normal tracking-[-0.025em]" style={{ color: COLORS.ink }}>We couldn't send that.</h3>
                          <p className="mt-3 max-w-[620px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                            A name and a valid email are required so we can reply. Check them and try again.
                          </p>
                          <button type="button" onClick={() => setStatus("idle")}
                            className="mt-6 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ color: COLORS.blue }}>
                            Back to the form
                            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      ) : status === "success" ? (
                        <div className="py-8">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist }}>
                            <Mail className="h-5 w-5" strokeWidth={1.7} style={{ color: COLORS.blue }} />
                          </div>
                          <h3 className="mt-6 text-[28px] font-normal tracking-[-0.025em]" style={{ color: COLORS.ink }}>Your message is ready.</h3>
                          <p className="mt-3 max-w-[620px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                            The form is connected to the page experience, but the production submission endpoint still needs to be connected before launch.
                          </p>
                          <button type="button" onClick={() => setStatus("idle")}
                            className="mt-6 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ color: COLORS.blue }}>
                            Send another message
                            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} noValidate>
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
                            <button type="submit" disabled={status === "submitting"}
                              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-70"
                              style={{ backgroundColor: COLORS.blue }}>
                              {status === "submitting" ? "Sending…" : "Send message"}
                              <ArrowUpRight className="ml-2 h-4 w-4" strokeWidth={1.8} />
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                    </div>
        </section>

        {/* CONTACT one-liner */}
        <section id="company" aria-label="Other ways to reach us" className="border-t px-6 py-14 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto flex max-w-[1240px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px]" style={{ color: COLORS.grey }}>Replies within two business days.</p>
            <div className="flex flex-wrap items-center gap-5">
              <a href="mailto:hello@visionary.org.in" className="inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
                hello@visionary.org.in
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
              </a>
              <Link to="/privacy" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.grey }}>
                Privacy and safety
                <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter variant="quiet" />
    </div>
  );
}