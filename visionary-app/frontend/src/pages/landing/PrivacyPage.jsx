import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Database,
  Target,
  Settings2,
  Mail,
  Eye,
  ShieldCheck,
  Cookie,
  Accessibility,
  FileText,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import QuietLink from "@/components/landing/QuietLink";
import ValuesStrip from "@/components/landing/ValuesStrip";
import PolicyTabs from "@/components/landing/PolicyTabs";
import SpotIllustration from "@/components/landing/SpotIllustration";
import { ChevronIcon } from "@/components/landing/persona/PersonaSections";
import { LEGAL_META, GRIEVANCE_OFFICER } from "@/data/legalMeta";
import { fontStack } from "@/components/landing/system/tokens";

const COLORS = {
  ink: "#1d1d1f",
  grey: "#6e6e73",
  lightGrey: "#86868b",
  mist: "#d2d2d7",
  border: "#d2d2d7",
  soft: "#f5f5f7",
  canvas: "#f5f5f7",
  blue: "#0066cc",
  navy: "#0066cc",
  white: "#ffffff",
  graphite: "#6e6e73",
};

/* ═══ Link and pill grammar — the approved public classes, verbatim ═══ */
const quietLink = "inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4";
const inkPill = "inline-flex min-h-12 items-center justify-center rounded-full bg-[#1d1d1f] px-7 text-[16px] font-medium tracking-[0.24px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4";

/* ═══ CONTROLLERS ═══ */
function useRevealOnce(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const hasRevealed = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (hasRevealed.current) { setVisible(true); return undefined; }
    if (!node) { setVisible(true); return undefined; }
    if (typeof IntersectionObserver === "undefined") { setVisible(true); hasRevealed.current = true; return undefined; }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRevealed.current) { setVisible(true); hasRevealed.current = true; observer.disconnect(); }
      },
      { threshold: 0, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}
const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ease-apple ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

const PRIVACY_PROMISES = ["No ads, ever", "Your data is never sold", "Delete on request"];

const AT_A_GLANCE = [
  {
    to: "#what-we-collect",
    label: "Know what is involved",
    text: "Account, learning activity, device, and preference information, explained by category.",
    Icon: Database,
  },
  {
    to: "#sharing",
    label: "Understand who can see it",
    text: "Access depends on account role and the learning relationship — not a public profile.",
    Icon: Eye,
  },
  {
    to: "#your-controls",
    label: "Choose what happens next",
    text: "Find the available settings and a clear route for privacy requests.",
    Icon: Settings2,
  },
];

const SECTIONS = [
  { id: "what-we-collect", number: "01", title: "What we collect" },
  { id: "purpose", number: "02", title: "Why we use it" },
  { id: "sharing", number: "03", title: "Who can see it" },
  { id: "your-controls", number: "04", title: "Your controls" },
  { id: "security", number: "05", title: "How we protect it" },
  { id: "data-requests", number: "06", title: "Access and deletion requests" },
  { id: "retention", number: "07", title: "How long we keep it" },
  { id: "younger-learners", number: "08", title: "Younger learners" },
  { id: "explainers", number: "09", title: "Common questions" },
  { id: "grievance-officer", number: "10", title: "Contact and grievances" },
];

const FAQ = [
  {
    q: "What information does Visionary collect exactly?",
    a: "Depending on how you use Visionary, this can include account details, the questions and content you provide, learning activity, progress, projects, and information needed to provide the service.",
  },
  {
    q: "Why does Visionary use personal information?",
    a: "To provide the service, keep your learning connected across sessions, maintain and improve the service, protect people and the service from misuse, and communicate with you about what matters.",
  },
  {
    q: "Who can see my learning information?",
    a: "Your account's role decides it. Students see their own work; teachers see the classes they teach; parents see what their role allows; institutions see aggregated, role-appropriate views. It is never public.",
  },
  {
    q: "How long is information retained?",
    a: "We keep information only for as long as it is needed to provide the service, meet legal obligations, resolve disputes, and protect Visionary. Records stored on your device remain there until you remove them or clear that browser’s storage.",
  },
  {
    q: "Can I delete my account or learning records?",
    a: "You can review the controls available in Privacy settings or contact the Grievance officer to request access, correction, or deletion. We may need to verify the account before completing a request.",
  },
  {
    q: "Does my information sync across devices?",
    a: "Information saved only on a device stays on that device. Information linked to your Visionary account may be available on devices where you securely sign in. The product identifies which type of storage is in use.",
  },
];

function SectionHeading({ number, title }) {
  return (
    <div className="mb-6">
      <div className="mb-3 apple-eyebrow" style={{ color: COLORS.grey }}>
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

function IconTile({ Icon }) {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f5f7]" style={{ color: COLORS.navy }}>
      <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
    </span>
  );
}

function LearnMoreRow({ to, label }) {
  return (
    <div className="mt-5">
      <Link to={to} className={quietLink}>
        {label}
        <ChevronIcon className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export default function PrivacyPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeId, setActiveId] = useState("what-we-collect");
  const [showMobileContents, setShowMobileContents] = useState(false);
  const heroReveal = useRevealOnce();
  const heroVisible = heroReveal.visible;

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
    if (hash && SECTIONS.some((section) => section.id === hash)) {
      requestAnimationFrame(() => {
        const element = document.getElementById(hash);
        element?.scrollIntoView({ behavior: "auto", block: "start" });
        setActiveId(hash);
      });
    }
  }, []);

  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <div className="page-privacy min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <Breadcrumb page="Privacy policy" />
      <PolicyTabs />

      <main id="main">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-14">
            {/* SIDEBAR TOC — starts at the top, beside the policy hero */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 py-10">
                <div className="mb-4 apple-eyebrow" style={{ color: COLORS.grey }}>In this policy</div>
                <nav aria-label="Privacy policy sections">
                  <div className="space-y-1">
                    {SECTIONS.map((section) => {
                      const active = activeId === section.id;
                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => scrollToSection(section.id)}
                          aria-current={active ? "location" : undefined}
                          className={`group flex w-full items-start gap-3 rounded-full px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] ${active ? "bg-[#f5f5f7]" : "text-[#6e6e73] hover:text-[#1d1d1f]"}`}
                        >
                          <span className={`mt-0.5 w-6 shrink-0 text-[12px] font-medium tabular-nums ${active ? "text-[#0066cc]" : ""}`}>{section.number}</span>
                          <span className={`text-[13px] leading-[1.45] ${active ? "text-[#1d1d1f]" : ""}`}>{section.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </nav>
                <div className="mt-8 border-t border-[rgba(18,19,23,0.12)] pt-6">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: COLORS.navy }} />
                    <p className="text-[13px] leading-[1.6]" style={{ color: COLORS.grey }}>
                      For safety and security details, see the Safety and Security pages.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* CONTENT COLUMN */}
            <div className="min-w-0">
              {/* POLICY HERO — the policies.google.com opening: centered
                  illustration, eyebrow, trust statement, intro, promises,
                  Privacy-Checkup action row, effective date */}
              <FadeReveal visible={heroVisible}>
                <div className="pb-12 pt-2">
                  <div className="flex justify-center"><SpotIllustration subject="shield" className="h-28 w-28 lg:h-36 lg:w-36" /></div>
                  <p data-type="label" className="mt-10" style={{ color: COLORS.grey }}>Privacy policy</p>
                  <h1 className="mt-4 max-w-[720px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px]" style={{ color: COLORS.ink }}>
                    Your learning is personal. <span className="accent-gradient">Privacy should be clear.</span>
                  </h1>
                  <p className="mt-8 max-w-[760px] text-[17px] leading-[25px]" style={{ color: COLORS.grey }}>
                    This policy explains what information Visionary uses, why, who can see it, and how you can update, manage, or delete it.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {PRIVACY_PROMISES.map((p) => (
                      <span key={p} className="flex items-center gap-1.5 text-[14px] font-medium" style={{ color: COLORS.ink }}>
                        <ShieldCheck className="h-4 w-4" strokeWidth={1.8} style={{ color: COLORS.navy }} aria-hidden="true" />
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Action row — the Privacy Checkup pattern */}
                  <div className="mt-10 flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#f5f5f7]" style={{ color: COLORS.navy }}>
                      <Eye className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[16px] font-medium" style={{ color: COLORS.ink }}>Review your data</p>
                      <p className="mt-0.5 text-[16px]" style={{ color: COLORS.grey }}>Looking to see what is stored on this device?</p>
                      <Link to="/dashboard/privacy" className={`mt-1.5 ${quietLink}`}>
                        Review data on this device
                        <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>

                  <p className="mt-10 border-t border-[rgba(18,19,23,0.12)] pt-5 text-[13px] leading-5" style={{ color: COLORS.grey }}>
                    Effective {LEGAL_META.privacy.lastUpdated}
                  </p>
                </div>

                {/* Mobile TOC */}
                <div className="border-b border-[rgba(18,19,23,0.12)] pb-4 lg:hidden">
                  <button
                    type="button"
                    onClick={() => setShowMobileContents((value) => !value)}
                    aria-expanded={showMobileContents}
                    aria-controls="privacy-mobile-contents"
                    className="flex min-h-[64px] w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
                  >
                    <span>
                      <span className="block apple-eyebrow" style={{ color: COLORS.grey }}>In this policy</span>
                      <span className="mt-1 block text-[16px]" style={{ color: COLORS.ink }}>{activeSection?.title ?? "Choose a section"}</span>
                    </span>
                    <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-200 ${showMobileContents ? "rotate-180" : ""}`} strokeWidth={1.8} style={{ color: COLORS.grey }} aria-hidden="true" />
                  </button>
                  {showMobileContents && (
                    <div id="privacy-mobile-contents" className="pt-4">
                      <div className="rounded-[24px] bg-[#f5f5f7] p-2">
                        {SECTIONS.map((section) => {
                          const active = activeId === section.id;
                          return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => { scrollToSection(section.id); setActiveId(section.id); setShowMobileContents(false); }}
                              aria-current={active ? "location" : undefined}
                              className={`flex min-h-12 w-full items-start gap-4 rounded-[16px] px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] ${active ? "bg-white" : "text-[#6e6e73]"}`}
                            >
                              <span className={`mt-0.5 text-[12px] font-medium tabular-nums ${active ? "text-[#0066cc]" : ""}`}>{section.number}</span>
                              <span className={`text-[14px] leading-[1.45] ${active ? "text-[#1d1d1f]" : ""}`}>{section.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* AT A GLANCE */}
                <section data-section="02-summary" aria-labelledby="privacy-summary-title">
                  <p className="apple-eyebrow" style={{ color: COLORS.grey }}>Start here</p>
                  <h2 id="privacy-summary-title" className="mt-2 text-[24px] font-normal tracking-[-0.02em] sm:text-[30px]" style={{ color: COLORS.ink }}>The essentials, at a glance</h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {AT_A_GLANCE.map(({ to, label, text, Icon }, index) => (
                      <a key={to} href={to} className="group relative flex min-h-[174px] flex-col rounded-[20px] bg-white p-6 pb-16 transition-colors hover:bg-[#f5f5f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]">
                        <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f5f7]" style={{ color: COLORS.navy }}><Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" /></span>
                        <span className="mt-5 flex items-center gap-2 text-[16px] font-medium" style={{ color: COLORS.ink }}><span className="text-[12px] font-normal tabular-nums" style={{ color: COLORS.grey }}>0{index + 1}</span>{label}</span>
                        <span className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{text}</span>
                        <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-[#0066cc] transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </section>
              </FadeReveal>

              {/* LEGAL CONTENT */}
              <article className="divide-y divide-[rgba(18,19,23,0.12)]">
                {/* 01 — WHAT WE COLLECT */}
                <section id="what-we-collect" data-section="03-what-we-collect" className="scroll-mt-24">
                  <SectionHeading number="01" title="What we collect" />
                  <Paragraph>
                    The information involved depends on the features you use. Some workspace records can stay in your browser, while account services use information needed to sign you in and provide connected features. The categories below explain what may be involved.
                  </Paragraph>
                  <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { Icon: Mail, title: "Workspace and account context", text: "The email or identity details used to create or open a workspace, along with the role needed to show the right learning tools." },
                      { Icon: Target, title: "Learning and content you provide", text: "Questions, materials, practice activity, progress records, and projects saved as you use the workspace." },
                      { Icon: Database, title: "Device and technical details", text: "Basic browser, device, and Visionary may use basic browser, device, and diagnostic information to keep the service reliable, secure, and compatible with your device." },
                      { Icon: Settings2, title: "Your preferences", text: "Choices such as language, accessibility, audio interaction, and whether optional learning memory is active." },
                    ].map(({ Icon, title, text }) => (
                      <div key={title} className="rounded-[20px] bg-white p-6">
                        <IconTile Icon={Icon} />
                        <h3 className="mt-5 text-[16px] font-medium" style={{ color: COLORS.ink }}>{title}</h3>
                        <p className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{text}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 02 — WHY WE USE IT */}
                <section id="purpose" data-section="04-purpose" className="scroll-mt-24">
                  <SectionHeading number="02" title="Why we use it" />
                  <Paragraph>
                    We use personal information to provide your workspace, retain the learning activity you choose to save, maintain and protect the service, and respond to your requests.
                  </Paragraph>
                  <div className="mt-10 max-w-[880px]">
                    {[
                      { Icon: Target, title: "Provide Visionary", text: "Answer questions, guide practice, and keep your work in one place as you continue." },
                      { Icon: Database, title: "Keep saved work available", text: "Retain selected learning records, workspace preferences, and activity on this browser so you can resume where supported." },
                      { Icon: Settings2, title: "Maintain and improve", text: "Diagnose issues, understand service performance, and improve the experience." },
                      { Icon: ShieldCheck, title: "Protect people and the service", text: "Prevent misuse, and keep accounts safe from harm." },
                      { Icon: Mail, title: "Communicate with you", text: "Service updates, and the email updates you choose to receive." },
                    ].map(({ Icon, title, text }, i, arr) => (
                      <div key={title} className={`flex items-start gap-5 py-6 ${i < arr.length - 1 ? "border-b border-[rgba(18,19,23,0.12)]" : ""}`}>
                        <IconTile Icon={Icon} />
                        <div>
                          <h3 className="text-[17px] font-medium" style={{ color: COLORS.ink }}>{title}</h3>
                          <p className="mt-1.5 max-w-[620px] text-[16px] leading-[1.65]" style={{ color: COLORS.grey }}>{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 03 — WHO CAN SEE IT */}
                <section id="sharing" data-section="05-sharing" className="scroll-mt-24">
                  <SectionHeading number="03" title="Who can see it" />
                  <Paragraph>
                    Visibility follows the workspace role and any explicit learning relationship. Visionary limits each view to the information needed for that relationship.
                  </Paragraph>
                  <div className="mt-10 border-t border-[rgba(18,19,23,0.12)]">
                    {[
                      ["Student", "Learners can review their own work. Private conversation text is not included in the parent and teacher progress views described here."],
                      ["Teacher", "Class-linked learning evidence is limited to the teacher’s assigned classes in the product model."],
                      ["Parent", "A parent view contains shared progress and activity summaries for connected children, not private conversations."],
                      ["Institution", "The organization view is designed for aggregate, role-appropriate information rather than private learner conversations."],
                      ["Service providers", "Trusted providers may process information only to operate, secure, support, or improve Visionary under appropriate contractual safeguards."],
                    ].map(([who, what], i, arr) => (
                      <div key={who} className={`py-5 ${i < arr.length - 1 ? "border-b border-[rgba(18,19,23,0.12)]" : ""}`}>
                        <p className="text-[16px] font-medium" style={{ color: COLORS.ink }}>{who}</p>
                        <p className="mt-1 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{what}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 max-w-[760px] text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>
                    We may also share information to meet legal obligations under Indian law. Legal demands are handled through the grievance process below.
                  </p>
                </section>

                {/* 04 — YOUR CONTROLS */}
                <section id="your-controls" data-section="06-your-controls" className="scroll-mt-24">
                  <SectionHeading number="04" title="Your controls" />
                  <Paragraph>
                    Your controls depend on where information is stored. Use{" "}
                    <Link to="/dashboard/privacy" className="relative after:absolute after:-inset-y-3 after:-inset-x-2 font-medium text-[#0066cc] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] rounded-sm">Privacy settings</Link>{" "}
                    to review information saved on this device, change workspace preferences, or contact the{" "}
                    <a href="#grievance-officer" className="relative after:absolute after:-inset-y-3 after:-inset-x-2 font-medium text-[#0066cc] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] rounded-sm">Grievance officer</a>{" "}
                    for an access, correction, or deletion request.
                  </Paragraph>
                  <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { Icon: Eye, title: "Review", text: "Inspect the personal workspace records saved in this browser." },
                      { Icon: Settings2, title: "Adjust", text: "Change available language, audio, accessibility, and personalization preferences." },
                      { Icon: Database, title: "Export", text: "No self-service account export is currently connected. Ask the Grievance officer about a data request." },
                      { Icon: Mail, title: "Request removal", text: "Send an account or record deletion request; it is reviewed rather than completed instantly here." },
                    ].map(({ Icon, title, text }) => (
                      <div key={title} className="rounded-[20px] bg-white p-6">
                        <IconTile Icon={Icon} />
                        <h3 className="mt-5 text-[16px] font-medium" style={{ color: COLORS.ink }}>{title}</h3>
                        <p className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                    <Link to="/dashboard/personalization" className={quietLink}>
                      Change workspace preferences
                      <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link to="/cookies" className={quietLink}>
                      Read about cookies
                      <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link to="/security" className={quietLink}>
                      Review security practices
                      <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </section>

                {/* 05 — SECURITY */}
                <section id="security" data-section="07-security" className="scroll-mt-24">
                  <SectionHeading number="05" title="How we protect it" />
                  <Paragraph>
                    Visionary uses access controls, secure transport, and appropriate storage safeguards to protect information. We review these protections as the service changes and limit access to people and providers who need it for their work.
                  </Paragraph>
                  <LearnMoreRow to="/security" label="How security works at Visionary" />
                </section>

                {/* 06 — DATA REQUESTS */}
                <section id="data-requests" data-section="08-data-requests" className="scroll-mt-24">
                  <SectionHeading number="06" title="Access and deletion requests" />
                  <Paragraph>
                    You can contact us to ask about personal information associated with your use of Visionary, request access or correction, or request deletion. The Grievance officer reviews the request and may verify your identity before acting on it.
                  </Paragraph>
                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {[
                      { title: "Access or correction", text: "Tell us which workspace or record your request concerns so we can review it." },
                      { title: "Deletion", text: "Describe the account or information you want removed. We will confirm the scope and any applicable retention requirements." },
                      { title: "Records on this device", text: "Review what is stored in this browser before you clear browser data or change devices." },
                    ].map((item, index) => (
                      <div key={item.title} className="rounded-[20px] bg-white p-6">
                        <p className="text-[12px] font-medium tabular-nums" style={{ color: COLORS.navy }}>0{index + 1}</p>
                        <h3 className="mt-3 text-[16px] font-medium" style={{ color: COLORS.ink }}>{item.title}</h3>
                        <p className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{item.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-col gap-4 rounded-[30px] bg-[#f5f5f7] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div>
                      <p className="text-[16px] font-medium" style={{ color: COLORS.ink }}>Send a privacy request</p>
                      <p className="mt-1 text-[14px] leading-6" style={{ color: COLORS.grey }}>{GRIEVANCE_OFFICER.response}</p>
                    </div>
                    <a href={`mailto:${GRIEVANCE_OFFICER.email}?subject=Privacy%20request`} className={`shrink-0 ${inkPill}`}>
                      Contact the Grievance officer
                    </a>
                  </div>
                </section>

                {/* 07 — RETENTION */}
                <section id="retention" data-section="09-retention" className="scroll-mt-24">
                  <SectionHeading number="07" title="How long we keep it" />
                  <Paragraph>
                    Workspace records stored locally remain in this browser until you remove them or clear browser storage. Account information is retained only while it is needed for the purposes explained in this policy, including legal, safety, and service requirements.
                  </Paragraph>
                  <div className="mt-10 max-w-[880px] rounded-[30px] bg-[#f5f5f7] p-6 sm:p-7">
                    <p className="text-[16px] font-medium" style={{ color: COLORS.ink }}>Your privacy options.</p>
                    <ul className="mt-4 space-y-2.5">
                      {["Review personal workspaces stored in this browser.", "Check whether a record is stored on-device or with your account.", "Ask the Grievance officer about access or deletion requests.", "Sign out of shared devices and review connected devices regularly."].map((t) => (
                        <li key={t} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS.navy }} />
                          <span className="text-[16px] leading-[1.65]" style={{ color: COLORS.grey }}>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* 08 — YOUNGER LEARNERS */}
                <section id="younger-learners" data-section="10-younger-learners" className="scroll-mt-24">
                  <SectionHeading number="08" title="Younger learners" />
                  <Paragraph>
                    Where a learner is a child under the DPDP Act, Visionary applies the consent and safeguard requirements that apply, including age-appropriate experiences and verified consent where required.
                  </Paragraph>
                  <LearnMoreRow to="/safety" label="How safety works for younger learners" />
                </section>

                {/* 09 — COMMON QUESTIONS */}
                <section id="explainers" data-section="11-explainers" className="scroll-mt-24">
                  <SectionHeading number="09" title="Common privacy questions" />
                  <div className="max-w-[880px] border-t border-[rgba(18,19,23,0.12)]">
                    {FAQ.map((item, index) => (
                      <div key={item.q} className="border-b border-[rgba(18,19,23,0.12)]">
                        <button
                          type="button"
                          aria-expanded={openFaq === index}
                          aria-controls={`privacy-faq-${index}`}
                          id={`privacy-faq-trigger-${index}`}
                          onClick={() => setOpenFaq(openFaq === index ? null : index)}
                          className="flex min-h-16 w-full items-center justify-between gap-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
                        >
                          <span className="text-[16px] leading-[1.45]" style={{ color: COLORS.ink }}>{item.q}</span>
                          <ChevronDown className={["h-4 w-4 shrink-0 transition-transform duration-200", openFaq === index ? "rotate-180" : ""].join(" ")} strokeWidth={1.8} style={{ color: COLORS.grey }} />
                        </button>
                        <div id={`privacy-faq-${index}`} role="region" aria-labelledby={`privacy-faq-trigger-${index}`} hidden={openFaq !== index}>
                          <p className="pb-5 pr-8 text-[16px] leading-[1.7]" style={{ color: COLORS.grey }}>{item.a}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 10 — CONTACT AND GRIEVANCES */}
                <section id="grievance-officer" data-section="12-grievance-officer" className="scroll-mt-24">
                  <SectionHeading number="10" title="Contact and grievances" />
                  <Paragraph>
                    For questions about this policy or to submit a privacy grievance, contact the named Grievance officer. Include enough detail to identify the request, but do not send passwords or other secrets by email.
                  </Paragraph>
                  <div className="mt-8 max-w-[640px] rounded-[30px] bg-[#f5f5f7] p-6 sm:p-7">
                    <p className="text-[16px] leading-[1.7]" style={{ color: COLORS.grey }}>
                      {GRIEVANCE_OFFICER.role}: <strong style={{ color: COLORS.ink }}>{GRIEVANCE_OFFICER.name}</strong>
                    </p>
                    <p className="mt-3">
                      <a href={`mailto:${GRIEVANCE_OFFICER.email}`} className={quietLink}>
                        <span className="break-all">{GRIEVANCE_OFFICER.email}</span>
                        <ChevronIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </a>
                    </p>
                    <p className="mt-3 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{GRIEVANCE_OFFICER.response}</p>
                  </div>
                </section>
              </article>
            </div>
          </div>
        </div>

        {/* KEY TERMS — the policies.google.com glossary pattern */}
        <section data-section="13-key-terms" aria-labelledby="key-terms-title" className="px-6 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-[1240px]">
            <h2 id="key-terms-title" className="text-[24px] font-normal tracking-[-0.02em] sm:text-[30px]" style={{ color: COLORS.ink }}>Key terms</h2>
            <div className="mt-8 grid gap-x-14 gap-y-8 border-t border-[rgba(18,19,23,0.12)] pt-10 sm:grid-cols-2">
              {[
                { term: "Workspace", def: "The learning environment you use in a browser. It holds the questions, practice, and projects from your sessions." },
                { term: "Learning records", def: "The activity and progress tied to your account or device: what you asked, practised, and built." },
                { term: "Browser-local storage", def: "Records saved in your browser on this device. They stay until you remove them or clear the browser's storage." },
                { term: "Account services", def: "The connected features that need an identity to work — sign-in, shared progress, and role-based access." },
                { term: "Grievance officer", def: "The named person responsible for reviewing your privacy requests and grievances under Indian law." },
                { term: "DPDP Act", def: "India's Digital Personal Data Protection Act, the law whose consent and safeguard rules this policy follows." },
              ].map(({ term, def }) => (
                <div key={term}>
                  <p className="text-[16px] font-medium" style={{ color: COLORS.ink }}>{term}</p>
                  <p className="mt-1.5 max-w-[520px] text-[16px] leading-[1.7]" style={{ color: COLORS.grey }}>{def}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RELATED */}
        <section data-section="14-related" aria-label="Related policies" className="border-t border-[rgba(18,19,23,0.12)] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-[1240px]">
            <h2 className="text-[22px] font-normal leading-[1.3] tracking-[-0.01em]" style={{ color: COLORS.ink }}>Read them together</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { to: "/cookies", label: "Cookie policy", desc: "Essential cookies only.", Icon: Cookie },
                { to: "/security", label: "Security", desc: "How your information is protected.", Icon: ShieldCheck },
                { to: "/safety", label: "Safety", desc: "Guardrails for every learner.", Icon: Accessibility },
                { to: "/accessibility", label: "Accessibility", desc: "Built for every kind of learner.", Icon: FileText },
              ].map(({ to, label, desc, Icon }) => (
                <Link key={to} to={to} className="group relative rounded-[20px] bg-white p-6 pb-16 transition-colors hover:bg-[#f5f5f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" strokeWidth={1.7} style={{ color: COLORS.navy }} />
                    <span className="text-[16px] font-medium" style={{ color: COLORS.ink }}>{label}</span>
                  </div>
                  <p className="mt-2 text-[14px] leading-[1.6]" style={{ color: COLORS.grey }}>{desc}</p>
                  <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-[#0066cc] transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>
        {/* B2/FAP-47 — the page's one closing contact door (legal door law:
            clauses carry no per-module CTAs; the page ends with a way to
            reach a person). */}
        <section data-section="15-questions" aria-label="Questions about this policy" className="border-t border-[rgba(18,19,23,0.12)] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-6">
            <p className="text-[16px] leading-[1.75]" style={{ color: COLORS.grey }}>
              Questions about this policy?
            </p>
            <QuietLink to="/contact" className="shrink-0">
              Talk to a person <ChevronIcon className="h-4 w-4" aria-hidden="true" />
            </QuietLink>
          </div>
        </section>
      </main>
      <ValuesStrip current="/privacy" />
      <LandingFooter variant="quiet" />
    </div>
  );
}
