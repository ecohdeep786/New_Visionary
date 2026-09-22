import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  UsersRound,
  Lightbulb,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import PageHeading, { Accent } from "@/components/landing/PageHeading";
import StorySection from "@/components/landing/StorySection";
import SpotIllustration from "@/components/landing/SpotIllustration";
import LandingFooter from "@/components/landing/LandingFooter";

const FONT_FAMILY =
  "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const COLORS = {
  ink: "#121317",
  grey: "#5f6368",
  lightGrey: "#9aa0a6",
  mist: "#dadce0",
  border: "#dadce0",
  soft: "#ffffff",
  blue: "#4285F4",
  white: "#ffffff",
};

const SECTIONS = [
  { id: "why", number: "01", title: "Why referrals exist" },
  { id: "how", number: "02", title: "How it works" },
  { id: "students", number: "03", title: "For students" },
  { id: "teachers", number: "04", title: "For teachers" },
  { id: "creators", number: "05", title: "For people who create" },
  { id: "sharing", number: "06", title: "Share in your own way" },
  { id: "tracking", number: "07", title: "How referrals are recognized" },
  { id: "rewards", number: "08", title: "Rewards" },
  { id: "rules", number: "09", title: "Keep it useful" },
  { id: "start", number: "10", title: "Start referring" },
  { id: "contact", number: "11", title: "Contact" },
];

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

function SectionHeading({ number, title }) {
  return (
    <div className="mb-6">
      <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.ink }}>
        {number}
      </div>
      <h2 className="text-[30px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[36px]" style={{ color: COLORS.ink }}>
        {title}
      </h2>
    </div>
  );
}

function Paragraph({ children }) {
  return (
    <p className="max-w-[760px] text-[16px] leading-[1.6]" style={{ color: COLORS.grey }}>
      {children}
    </p>
  );
}

function ProgramCard({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="flex h-full flex-col rounded-[22px] border bg-white p-6 sm:p-7" style={{ borderColor: COLORS.border }}>
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
        <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
      </div>
      <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.lightGrey }}>
        {eyebrow}
      </div>
      <h3 className="mt-1.5 text-[19px] font-normal leading-[1.3]" style={{ color: COLORS.ink }}>
        {title}
      </h3>
      <p className="mt-3 flex-1 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>
        {description}
      </p>
    </div>
  );
}

function PrincipleRow({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-4 border-b py-6 last:border-b-0" style={{ borderColor: COLORS.border }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border" style={{ borderColor: COLORS.mist }}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} style={{ color: COLORS.blue }} />
      </div>
      <div>
        <h3 className="text-[17px] font-normal" style={{ color: COLORS.ink }}>{title}</h3>
        <p className="mt-2 max-w-[680px] text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>
          {children}
        </p>
      </div>
    </div>
  );
}

function Note({ children }) {
  return (
    <div className="mt-6 rounded-[18px] border bg-white px-5 py-5 sm:px-6" style={{ borderColor: COLORS.border }}>
      <p className="text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{children}</p>
    </div>
  );
}

export default function ReferralPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
    const [status, setStatus] = useState("idle"); // idle | submitting | success | error (deterministic mock)
  const [showError, setShowError] = useState(false);


    function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setShowError(true);
      return;
    }
    setStatus("submitting");
    setTimeout(() => setStatus("success"), 900); // deterministic mock — no backend yet
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
            <main id="main">
        <PageHeading page="Referral" eyebrow="Referral"
          h1={<>Invite and <Accent>grow</Accent>.</>}
          dek="Share Visionary. Both of you move forward.">
        </PageHeading>

        {/* STORY BAND — text + visual (Google 2-up statement pattern) */}
        <section className="border-b" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto max-w-[1240px] px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="max-w-[560px]">
                <p className="text-[28px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[40px]" style={{ color: COLORS.ink }}>
                  A good recommendation
                  <br />
                  <span style={{ color: COLORS.ink }}>can change where someone starts.</span>
                </p>
                <p className="mt-6 max-w-[560px] text-[17px] leading-[1.7]" style={{ color: COLORS.grey }}>
                  A classmate can introduce a better way to practise. A teacher can share a useful learning resource. A colleague can show someone how Visionary fits into their work. The referral program is built around those moments.
                </p>
              </div>
              <div className="flex justify-center lg:justify-end">
                <SpotIllustration subject="gift" className="h-[200px] w-[200px]" />
              </div>
            </div>
          </div>
        </section>

        {/* 01 · WHY REFERRALS */},
        <StorySection
          id="why"
          title="Why referrals exist"
          featured={{
            subject: "gift",
            label: "The idea",
            title: "Help someone start.",
            dek: "A simple way to introduce Visionary to someone who needs it.",
          }}
          rows={[
            { label: "01 · Share", title: "Tell one person who needs it." },
            { label: "02 · They start", title: "Your invite opens the door." },
            { label: "03 · Both move", title: "You both get more Visionary." },
          ]}
        />

        {/* 02 · WHO IT IS FOR — A-grid */}
        <section id="students" className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <h2 className="text-[30px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink }}>
              Who it is for
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <RoleCard icon={GraduationCap} eyebrow="Students" title="Learn together" description="Invite classmates learning the same things." />
              <RoleCard icon={UsersRound} eyebrow="Teachers" title="Reach your class" description="Bring Visionary to the people you teach." />
              <RoleCard icon={Lightbulb} eyebrow="Creators" title="Share what you built" description="Show your work to people who can use it." />
              <div aria-hidden="true" className="hidden lg:block" />
              <div aria-hidden="true" className="hidden lg:block" />
              <div aria-hidden="true" className="hidden lg:block" />
            </div>
          </div>
        </section>

        {/* 03 · REWARDS + RULES rows */}
        <StorySection
          id="rewards"
          title="Rewards and rules"
          flip
          featured={{
            subject: "growth",
            label: "What you earn",
            title: "Both of you move forward.",
            dek: "Rewards apply when the person you invite stays and learns.",
          }}
          rows={[
            { label: "Reward", title: "More Visionary for both of you." },
            { label: "Recognition", title: "Attributed, never tracked." },
            { label: "Keep it useful", title: "Share with people who need it." },
          ]}
        />

<section id="start" className="scroll-mt-24 py-14 sm:py-16 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
                    <SectionHeading number="10" title="Start referring" />
                    <Paragraph>Tell us where to send your referral access information.</Paragraph>
                    <div className="mt-8 rounded-[24px] border bg-white p-6 sm:p-8" style={{ borderColor: COLORS.border }}>
                      {status === "error" ? (
                        <div className="py-8" role="alert">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist }}>
                            <AlertCircle className="h-5 w-5" strokeWidth={1.7} style={{ color: "#EA4335" }} />
                          </div>
                          <h3 className="mt-6 text-[28px] font-normal tracking-[-0.025em]" style={{ color: COLORS.ink }}>We couldn't send that.</h3>
                          <p className="mt-3 max-w-[650px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                            A name and a valid email are required so the referrals team can reply to you. Check them and try again.
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
                            <CheckCircle2 className="h-5 w-5" strokeWidth={1.7} style={{ color: COLORS.blue }} />
                          </div>
                          <h3 className="mt-6 text-[28px] font-normal tracking-[-0.025em]" style={{ color: COLORS.ink }}>Your request is ready.</h3>
                          <p className="mt-3 max-w-[660px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                            The referral access flow is represented here, but the production referral backend has not yet been connected.
                          </p>
                          <button type="button" onClick={() => setStatus("idle")}
                            className="mt-6 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ color: COLORS.blue }}>
                            Try again
                            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} noValidate>
                          <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                              <label htmlFor="referral-name" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Name</label>
                              <input id="referral-name" type="text" autoComplete="name" required value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                                style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                            </div>
                            <div>
                              <label htmlFor="referral-email" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Email</label>
                              <input id="referral-email" type="email" autoComplete="email" required value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                                style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                            </div>
                          </div>
                          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="max-w-[560px] text-[12px] leading-[1.6]" style={{ color: COLORS.grey }}>
                              Referral availability, eligibility, and reward terms should be shown before someone joins the program.
                            </p>
                            <button type="submit" disabled={status === "submitting"}
                              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                              style={{ backgroundColor: COLORS.blue }}>
                              {status === "submitting" ? "Sending…" : "Continue"}
                              <ArrowUpRight className="ml-2 h-4 w-4" strokeWidth={1.8} />
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                    </div>
        </section>

        {/* CONTACT one-liner */}
        <section id="contact" aria-label="Contact" className="border-t px-6 py-14 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto flex max-w-[1240px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px]" style={{ color: COLORS.grey }}>Referral questions?</p>
            <a href="mailto:hello@visionary.org.in" className="inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
              hello@visionary.org.in
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </a>
          </div>
        </section>
      </main>

      <LandingFooter variant="quiet" />
    </div>
  );
}