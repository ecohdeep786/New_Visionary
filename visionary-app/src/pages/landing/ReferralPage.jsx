import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Gift,
  GraduationCap,
  Link2,
  MessageCircle,
  Network,
  Settings2,
  Share2,
  Sparkles,
  UsersRound,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const FONT_FAMILY =
  "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const COLORS = {
  ink: "#121317",
  grey: "#5f6368",
  lightGrey: "#9aa0a6",
  mist: "#dadce0",
  border: "#e5e7eb",
  soft: "#f8f9fa",
  blue: "#4285F4",
  blueSoft: "#D2E3FC",
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
      <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.blue }}>
        {number}
      </div>
      <h2 className="text-[30px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[36px]" style={{ color: COLORS.ink }}>
        {title}
      </h2>
    </div>
  );
}

function Paragraph({ children }) {
  return (
    <p className="max-w-[760px] text-[16px] leading-[1.78]" style={{ color: COLORS.grey }}>
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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.soft }}>
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
    <div className="mt-6 rounded-[18px] border px-5 py-5 sm:px-6" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
      <p className="text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{children}</p>
    </div>
  );
}

export default function ReferralPage() {
  const [activeId, setActiveId] = useState("why");
  const [showMobileContents, setShowMobileContents] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
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
                <Gift className="h-4 w-4" strokeWidth={1.7} />
                Referral Program
              </div>
              <h1 className="max-w-[960px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px]" style={{ color: COLORS.ink }}>
                Share something useful.
                <br />
                <span style={{ color: COLORS.blue }}>Help someone start.</span>
              </h1>
              <p className="mt-8 max-w-[800px] text-[18px] leading-[1.6] sm:text-[20px]" style={{ color: COLORS.grey }}>
                Visionary grows through people who find it useful enough to share. The referral program gives people a simple way to introduce Visionary to others.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a href="#start" onClick={(event) => { event.preventDefault(); scrollToSection("start"); }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                  style={{ backgroundColor: COLORS.blue }}>
                  Start referring
                  <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                </a>
                <a href="#how" onClick={(event) => { event.preventDefault(); scrollToSection("how"); }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border px-7 text-[15px] hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                  style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                  See how it works
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
                A good recommendation
                <br />
                <span style={{ color: COLORS.blue }}>can change where someone starts.</span>
              </p>
              <p className="mt-6 max-w-[760px] text-[17px] leading-[1.75]" style={{ color: COLORS.grey }}>
                A classmate can introduce a better way to practise. A teacher can share a useful learning resource. A colleague can show someone how Visionary fits into their work. The referral program is built around those moments.
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
              <ChevronRight className={`h-5 w-5 transition-transform ${showMobileContents ? "rotate-90" : ""}`} strokeWidth={1.7} style={{ color: COLORS.grey }} />
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
                        <span className="text-[14px]" style={{ color: active ? COLORS.ink : COLORS.grey }}>{section.title}</span>
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
              {/* DESKTOP TOC */}
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>Contents</div>
                  <nav aria-label="Referral sections">
                    <div className="space-y-1">
                      {SECTIONS.map((section) => {
                        const active = activeId === section.id;
                        return (
                          <button key={section.id} type="button" onClick={() => scrollToSection(section.id)}
                            className="flex w-full items-start gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ backgroundColor: active ? COLORS.soft : "transparent" }}>
                            <span className="mt-0.5 w-6 shrink-0 text-[11px] font-medium" style={{ color: active ? COLORS.blue : COLORS.grey }}>{section.number}</span>
                            <span className="text-[13px]" style={{ color: active ? COLORS.ink : COLORS.grey }}>{section.title}</span>
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
                    <SectionHeading number="01" title="Why referrals exist" />
                    <Paragraph>Visionary should spread because people find it useful, not because they were pressured to promote it.</Paragraph>
                    <div className="mt-5"><Paragraph>The referral program gives existing users a simple way to introduce Visionary to someone who could benefit from it.</Paragraph></div>
                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      <ProgramCard icon={Share2} eyebrow="Share" title="Tell someone" description="Send a Visionary referral to a person you genuinely think could use it." />
                      <ProgramCard icon={UsersRound} eyebrow="Start" title="They begin" description="The person follows your referral and starts their own Visionary journey." />
                      <ProgramCard icon={Gift} eyebrow="Recognition" title="You may benefit" description="Where a referral qualifies under the published program rules, the referral can be recognized for the applicable reward." />
                    </div>
                  </section>

                  {/* 02 */}
                  <section id="how" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="02" title="How it works" />
                    <Paragraph>The experience should be simple enough that the referral itself does not become the work.</Paragraph>
                    <div className="mt-7">
                      <div className="overflow-hidden rounded-[22px] border" style={{ borderColor: COLORS.border }}>
                        <PrincipleRow icon={Link2} title="1. Get your referral link">Your account receives a referral link or referral mechanism that identifies your recommendation.</PrincipleRow>
                        <PrincipleRow icon={Share2} title="2. Share it">Share it directly with someone or through a channel where you already communicate.</PrincipleRow>
                        <PrincipleRow icon={Sparkles} title="3. They start with Visionary">The person follows the referral and creates or uses their own Visionary account.</PrincipleRow>
                        <PrincipleRow icon={Gift} title="4. The referral is evaluated">Visionary checks the referral against the published eligibility and attribution rules before applying any reward.</PrincipleRow>
                      </div>
                    </div>
                  </section>

                  {/* 03 */}
                  <section id="students" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="03" title="For students" />
                    <Paragraph>A student may discover Visionary through another student, classmate, friend, study group, or community.</Paragraph>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <ProgramCard icon={GraduationCap} eyebrow="Student" title="Share how you learn" description="Introduce Visionary when you think it could help another learner understand, practise, or build." />
                      <ProgramCard icon={UsersRound} eyebrow="Community" title="Help another learner start" description="A useful recommendation can remove the first barrier: simply knowing where to begin." />
                    </div>
                  </section>

                  {/* 04 */}
                  <section id="teachers" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="04" title="For teachers" />
                    <Paragraph>Teachers often find, adapt, and share resources that help other educators and learners. Visionary can build a referral path around that knowledge.</Paragraph>
                    <div className="mt-6">
                      <ProgramCard icon={GraduationCap} eyebrow="Educator" title="Share what is genuinely useful" description="Recommend Visionary to learners, fellow teachers, or institutions when it fits a real teaching or learning need." />
                    </div>
                    <Note>Any teacher commissions, resource-sales income, revenue sharing, minimum thresholds, payout schedules, or marketplace rules should be published here only after Visionary has formally defined and implemented them.</Note>
                  </section>

                  {/* 05 */}
                  <section id="creators" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="05" title="For people who create" />
                    <Paragraph>Visionary's long-term learning ecosystem may include people who create lessons, guides, practice material, projects, or other useful resources.</Paragraph>
                    <div className="mt-6">
                      <div className="overflow-hidden rounded-[22px] border" style={{ borderColor: COLORS.border }}>
                        <PrincipleRow icon={BookOpen} title="Create something useful">Build resources around a genuine learning need.</PrincipleRow>
                        <PrincipleRow icon={Share2} title="Help people discover it">Share the resource with people who are likely to benefit from it.</PrincipleRow>
                        <PrincipleRow icon={Network} title="Let the product handle attribution">Where an official creator or referral system exists, eligibility and attribution should be determined by the actual program rules.</PrincipleRow>
                      </div>
                    </div>
                    <Note>The current Visionary sources describe a planned teacher creator platform in the broader product strategy, but do not define a live creator marketplace, commission percentage, or payout mechanism. Those details should remain unpublished until they are real.</Note>
                  </section>

                  {/* 06 */}
                  <section id="sharing" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="06" title="Share in your own way" />
                    <Paragraph>A referral should fit naturally into how people already communicate.</Paragraph>
                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      <ProgramCard icon={MessageCircle} eyebrow="Direct" title="Send it to someone" description="Share a referral directly with a learner, teacher, colleague, or friend." />
                      <ProgramCard icon={UsersRound} eyebrow="Groups" title="Share with a community" description="Use spaces where sharing educational resources is already appropriate." />
                      <ProgramCard icon={Share2} eyebrow="Public" title="Share publicly" description="Where the rules allow it, share your referral through your own public channels." />
                    </div>
                    <Note>Referral links should never be presented as permission to send unsolicited messages or spam. Program rules should define acceptable promotion clearly.</Note>
                  </section>

                  {/* 07 */}
                  <section id="tracking" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="07" title="How referrals are recognized" />
                    <Paragraph>The important part is attribution: Visionary needs to know which referral led to which qualifying action.</Paragraph>
                    <div className="mt-7">
                      <div className="overflow-hidden rounded-[22px] border" style={{ borderColor: COLORS.border }}>
                        <PrincipleRow icon={Link2} title="A referral identifier">The system should associate the referred person or action with the referring account.</PrincipleRow>
                        <PrincipleRow icon={CheckCircle2} title="A qualifying event">A reward should be associated with a clearly defined action, not simply the act of clicking a link.</PrincipleRow>
                        <PrincipleRow icon={Settings2} title="Clear exclusions">Duplicate accounts, self-referrals, abuse, or other invalid activity should be handled according to the published rules.</PrincipleRow>
                      </div>
                    </div>
                    <Note>The exact attribution window, qualification event, and anti-abuse rules are not defined in the current Visionary source material. They should be finalized before the referral system is launched.</Note>
                  </section>

                  {/* 08 */}
                  <section id="rewards" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="08" title="Rewards" />
                    <Paragraph>Rewards should be understandable before someone shares a referral. The person should know what qualifies and what happens next.</Paragraph>
                    <div className="mt-6">
                      <ProgramCard icon={Gift} eyebrow="Recognition" title="Reward the useful introduction" description="When a referral satisfies the official program rules, the corresponding benefit can be applied to the eligible participant." />
                    </div>
                    <Note>This page intentionally does not show a rupee amount, commission percentage, credit value, minimum payout, or reward cap because those terms are not established in the current Visionary materials.</Note>
                  </section>

                  {/* 09 */}
                  <section id="rules" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="09" title="Keep it useful" />
                    <Paragraph>The referral program should strengthen trust in Visionary, not weaken it.</Paragraph>
                    <div className="mt-6">
                      <div className="overflow-hidden rounded-[22px] border" style={{ borderColor: COLORS.border }}>
                        <PrincipleRow icon={UsersRound} title="Recommend honestly">Share Visionary because you believe it can help the person receiving it.</PrincipleRow>
                        <PrincipleRow icon={MessageCircle} title="Do not mislead">Referral communication should accurately describe Visionary and the applicable reward terms.</PrincipleRow>
                        <PrincipleRow icon={CheckCircle2} title="Respect people's choice">A recommendation should leave the other person free to decide whether Visionary is right for them.</PrincipleRow>
                        <PrincipleRow icon={Sparkles} title="Protect the learning experience">Growth should never come at the expense of the learner, teacher, or community experience.</PrincipleRow>
                      </div>
                    </div>
                  </section>

                  {/* 10 */}
                  <section id="start" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="10" title="Start referring" />
                    <Paragraph>Tell us where to send your referral access information.</Paragraph>
                    <div className="mt-8 rounded-[24px] border bg-white p-6 sm:p-8" style={{ borderColor: COLORS.border }}>
                      {submitted ? (
                        <div className="py-8">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[16px]" style={{ backgroundColor: COLORS.blueSoft }}>
                            <CheckCircle2 className="h-5 w-5" strokeWidth={1.7} style={{ color: COLORS.blue }} />
                          </div>
                          <h3 className="mt-6 text-[28px] font-normal tracking-[-0.025em]" style={{ color: COLORS.ink }}>Your request is ready.</h3>
                          <p className="mt-3 max-w-[660px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                            The referral access flow is represented here, but the production referral backend has not yet been connected.
                          </p>
                          <button type="button" onClick={() => setSubmitted(false)}
                            className="mt-6 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ color: COLORS.blue }}>
                            Try again
                            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit}>
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
                            <button type="submit"
                              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                              style={{ backgroundColor: COLORS.blue }}>
                              Continue
                              <ArrowUpRight className="ml-2 h-4 w-4" strokeWidth={1.8} />
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </section>

                  {/* 11 */}
                  <section id="contact" className="scroll-mt-24 pt-14 sm:pt-16">
                    <SectionHeading number="11" title="Contact" />
                    <Paragraph>Questions about referrals, eligibility, attribution, or rewards:</Paragraph>
                    <div className="mt-6">
                      <a href="mailto:hello@visionary.org.in"
                        className="inline-flex items-center gap-2 text-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
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
                    <div className="mb-5 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.blue }}>Referral Program</div>
                    <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] sm:text-[48px]" style={{ color: COLORS.ink }}>
                      One useful recommendation
                      <br />
                      <span style={{ color: COLORS.blue }}>can become someone's beginning.</span>
                    </h2>
                    <p className="mt-6 max-w-[720px] text-[17px] leading-[1.7]" style={{ color: COLORS.grey }}>
                      Share Visionary when you believe it can help someone understand more, practise better, or build what comes next.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <a href="#start" onClick={(event) => { event.preventDefault(); scrollToSection("start"); }}
                        className="inline-flex h-11 items-center justify-center rounded-full px-5 text-[15px] font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                        style={{ backgroundColor: COLORS.blue }}>
                        Start referring
                      </a>
                      <Link to="/community" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        Community
                      </Link>
                      <Link to="/updates" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        Stay updated
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