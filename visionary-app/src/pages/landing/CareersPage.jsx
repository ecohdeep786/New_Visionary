import { useMemo, useState } from "react";
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


function CareersNotify() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error

  function handleSubmit(event) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus("error"); return; }
    setStatus("submitting");
    setTimeout(() => setStatus("success"), 900); // deterministic mock
  }

  if (status === "success") {
    return (
      <p role="status" className="mt-6 rounded-[14px] border px-5 py-4 text-[14px] leading-[1.6]" style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
        You're on the list. We'll email <strong>{email}</strong> when a role opens.
      </p>
    );
  }
  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6">
      <label htmlFor="careers-notify-email" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>
        Get told when a role opens
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          id="careers-notify-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? "careers-notify-error" : undefined}
          placeholder="you@example.com"
          className="h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors placeholder:text-[#9AA0A6] focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
          style={{ borderColor: status === "error" ? "#EA4335" : COLORS.mist, color: COLORS.ink }}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 disabled:opacity-70"
          style={{ backgroundColor: COLORS.blue }}
        >
          {status === "submitting" ? "Adding you…" : "Notify me"}
        </button>
      </div>
      {status === "error" && (
        <p id="careers-notify-error" role="alert" className="mt-2 text-[13px]" style={{ color: "#EA4335" }}>
          Please enter a valid email so we can tell you when a role opens.
        </p>
      )}
    </form>
  );
}

export default function CareersPage() {

  const activeSection = useMemo(
    () => SECTIONS.find((section) => section.id === activeId),
    [activeId]
  );

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
            <main id="main">
        <PageHeading page="Careers" eyebrow="Careers"
          h1={<>Come <Accent>build</Accent> with us.</>}
          dek="Small team. Unfinished mission. Real ownership.">
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#open-roles" onClick={(event) => { event.preventDefault(); scrollToSection("open-roles"); }}
              className="inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
              style={{ backgroundColor: COLORS.blue }}>
              See open roles
            </a>
            <a href="#general-application" onClick={(event) => { event.preventDefault(); scrollToSection("general-application"); }}
              className="inline-flex h-12 items-center justify-center rounded-full border px-7 text-[15px] transition-colors hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
              style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
              Introduce yourself
            </a>
          </div>
        </PageHeading>

        {/* STORY BAND */}
        <section className="border-b" style={{ borderColor: COLORS.border }}>
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

        {/* 01 · WHY THIS WORK — the capture’s story grammar */}
        <StorySection
          id="why"
          title="Why this work"
          featured={{
            subject: "briefcase",
            label: "The mission",
            title: "One intelligence around one journey.",
            dek: "Information is everywhere. Understanding it — and carrying it forward — should not break into pieces.",
            link: { label: "Learn about Visionary", to: "/about" },
          }}
          rows={[
            { label: "Curious", title: "You ask why before deciding how." },
            { label: "Builders", title: "Ideas become something people can use." },
            { label: "Evidence-minded", title: "The product can change your mind." },
            { label: "Collaborative", title: "Disciplines decide together." },
            { label: "Learners", title: "The problem teaches you something." },
          ]}
        />

        {/* 02 · WHAT WE ARE BUILDING */}
        <StorySection
          id="what-building"
          title="What we are building"
          flip
          featured={{
            subject: "build",
            label: "The product",
            title: "Understanding that continues.",
            dek: "Across questions, practice, projects, languages, people, and time.",
          }}
          rows={[
            { label: "Understand", title: "Make difficult ideas clearer." },
            { label: "Practise", title: "Turn knowing into ability." },
            { label: "Build", title: "Make something from knowledge." },
            { label: "Continue", title: "Keep the journey connected." },
          ]}
        />

        {/* 03 · HOW WE WORK */}
        <StorySection
          id="how-work"
          title="How we work"
          featured={{
            subject: "growth",
            label: "Principles",
            title: "A clear way of working.",
            dek: "The problem is large. The way we work on it stays clear.",
          }}
          rows={[
            { label: "Start with the person", title: "Not a feature looking for a reason." },
            { label: "Build the real thing", title: "Measure, then improve from evidence." },
            { label: "Question assumptions", title: "Test what we think we know." },
            { label: "Work across disciplines", title: "One decision, many perspectives." },
            { label: "Own the outcome", title: "Better for the person using it." },
          ]}
        />

        {/* 04 · WHERE YOU CAN CONTRIBUTE — A-grid (the capture’s card pattern) */}
        <section id="where-contribute" className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <h2 className="text-[30px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink }}>
              Where you can contribute
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <RoleCard icon={Code2} eyebrow="Engineering" title="Software and systems" description="Reliable product experiences, infrastructure, and AI systems." />
              <RoleCard icon={Lightbulb} eyebrow="Product" title="Product and strategy" description="Turn ambiguous questions into useful product decisions." />
              <RoleCard icon={Layers3} eyebrow="Design" title="Product and experience design" description="Make complex intelligence feel clear and natural." />
              <RoleCard icon={FlaskConical} eyebrow="Research" title="Learning and AI research" description="How people learn, how systems reason, responsibly." />
              <RoleCard icon={GraduationCap} eyebrow="Education" title="Learning and pedagogy" description="Classrooms, learners, teaching, and assessment." />
              <RoleCard icon={UsersRound} eyebrow="Operations" title="Building the company" description="The systems and discipline that let the product grow." />
              <div aria-hidden="true" className="hidden lg:block" />
              <div aria-hidden="true" className="hidden lg:block" />
              <div aria-hidden="true" className="hidden lg:block" />
            </div>
          </div>
        </section>

        {/* 05 · OPEN ROLES — honest state + notify */}
        <section id="open-roles" className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <h2 className="text-[30px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink }}>
              Open roles
            </h2>
            <div className="mt-10 max-w-[880px] rounded-[24px] border p-7 sm:p-10" style={{ borderColor: COLORS.mist, backgroundColor: COLORS.soft }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                <Briefcase className="h-5 w-5" strokeWidth={1.7} />
              </div>
              <h3 className="mt-6 text-[25px] font-normal tracking-[-0.02em]" style={{ color: COLORS.ink }}>No public roles listed right now.</h3>
              <p className="mt-3 max-w-[620px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                Roles appear here when there is a real opening and a team ready to support the person joining.
              </p>
              <a href="#application" onClick={(event) => { event.preventDefault(); scrollToSection("application"); }}
                className="mt-6 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                style={{ color: COLORS.blue }}>
                Make a general application
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
              </a>
              <CareersNotify />
            </div>
          </div>
        </section>

        {/* 06 · GENERAL APPLICATION */}
        <section id="application" className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <h2 className="text-[30px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink }}>
              General application
            </h2>
            <div className="mt-10 max-w-[880px] rounded-[24px] border bg-white p-7 sm:p-10" style={{ borderColor: COLORS.mist }}>
              <div className="flex items-start gap-4">
                <Mail className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.6} style={{ color: COLORS.blue }} />
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.lightGrey }}>General applications</div>
                  <h3 className="mt-1.5 text-[21px] font-normal" style={{ color: COLORS.ink }}>Start with the work.</h3>
                  <p className="mt-3 max-w-[560px] text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>
                    Send your introduction, relevant work, and the area you would like to contribute to.
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
          </div>
        </section>

        {/* 07 · CONTACT one-liner */}
        <section id="contact" aria-label="Contact" className="border-t px-6 py-14 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto flex max-w-[1240px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px]" style={{ color: COLORS.grey }}>Career questions and role enquiries?</p>
            <div className="flex flex-wrap items-center gap-5">
              <a href="mailto:careers@visionary.org.in"
                className="inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 rounded-sm"
                style={{ color: COLORS.blue }}>
                careers@visionary.org.in
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
              </a>
              <Link to="/contact" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.grey }}>
                Other ways to contact us
                <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="border-t px-6 py-24 sm:px-8 lg:px-10 lg:py-32" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-5 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>Careers</div>
            <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] sm:text-[48px]" style={{ color: COLORS.ink }}>
              What you learn here
              <br />
              <span style={{ color: COLORS.ink }}>should stay with you.</span>
            </h2>
            <p className="mt-6 max-w-[640px] text-[17px] leading-[1.7]" style={{ color: COLORS.grey }}>
              Understand deeply, build from what you know, carry the learning forward.
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
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}