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
  Scale,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import { LEGAL_META, GRIEVANCE_OFFICER } from "@/data/legalMeta";
import imgYoungLearner from "@/assets/student-primary.webp";
import imgParentChild from "@/assets/parent-face-main.webp";

const COLORS = {
  ink: "#121317",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  border: "#e5e7eb",
  soft: "#f8f9fa",
  canvas: "#f7f8fa",
  blue: "#4285F4",
  white: "#ffffff",
  graphite: "#5f6368",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* ═══ CONTROLLERS — reveal motion, same system as the landing pages ═══ */
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
    <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});
const PRIVACY_PROMISES = ["No ads, ever", "Your data is never sold", "Delete on request"];

const AT_A_GLANCE = [
  {
    to: "#what-we-collect",
    label: "Know what is involved",
    text: "Account, learning activity, device, and preference information—explained by category.",
    Icon: Database,
  },
  {
    to: "#sharing",
    label: "Understand who can see it",
    text: "Access depends on account role and the learning relationship—not a public profile.",
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
    a: "Information is kept only for as long as it is needed to provide the service, meet legal obligations, resolve disputes, and protect Visionary. Records stored on your device remain there until you remove them or clear that browser’s storage.",
  },
  {
    q: "Can I delete my account or learning records?",
    a: "You can review the controls available in Privacy settings or contact the Grievance Officer to request access, correction, or deletion. We may need to verify the account before completing a request.",
  },
  {
    q: "Does my information sync across devices?",
    a: "Information saved only on a device stays on that device. Information linked to your Visionary account may be available on devices where you securely sign in. The product identifies which type of storage is being used.",
  },
];

function SectionHeading({ number, title }) {
  return (
    <div className="mb-6">
      <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>
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
    <span className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
      <Icon className="h-5 w-5" strokeWidth={1.7} />
    </span>
  );
}

function LearnMoreRow({ to, label }) {
  return (
    <Link to={to} className="mt-5 inline-flex items-center gap-2 text-[14.5px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
      {label}
      <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
    </Link>
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
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <Breadcrumb page="Privacy policy" />

      <main id="main">
        {/* HERO */}
        <section ref={heroReveal.ref} className="border-b px-6 pb-12 pt-24 sm:px-8 sm:pb-16 sm:pt-28 lg:px-10 lg:pb-20 lg:pt-32" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto grid w-full max-w-[1240px] items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-16">
            <FadeReveal visible={heroVisible}>
              <div>
                <div className="mb-5 flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>
                  <Scale className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
                  Privacy at Visionary
                </div>
                <h1 className="max-w-[760px] text-[46px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[60px] lg:text-[68px]" style={{ color: COLORS.ink }}>
                  Your learning is personal. Privacy should be clear.
                </h1>
                <p className="mt-6 max-w-[620px] text-[18px] leading-[1.65] sm:text-[20px]" style={{ color: COLORS.grey }}>
                  Understand what information Visionary uses, who can access it, and how to make a privacy request. No hidden settings, no assumed choices.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <a href="#your-controls" className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-[#4285F4] px-6 text-[14px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">
                    Explore your choices
                    <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  </a>
                  <Link to="/dashboard/privacy" className="inline-flex min-h-11 items-center gap-2 text-[14px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
                    Review data on this device
                    <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  </Link>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {PRIVACY_PROMISES.map((p) => (
                    <span key={p} className="flex items-center gap-1.5 text-[13.5px] font-medium" style={{ color: COLORS.ink }}>
                      <ShieldCheck className="h-4 w-4" strokeWidth={1.8} style={{ color: COLORS.blue }} aria-hidden="true" />
                      {p}
                    </span>
                  ))}
                </div>
                <p className="mt-6 text-[13px] leading-5" style={{ color: COLORS.grey }}>
                  Policy last updated <strong style={{ color: COLORS.ink }}>{LEGAL_META.privacy.lastUpdated}</strong>
                </p>
              </div>
            </FadeReveal>
            <FadeReveal visible className="hero-fade-right">
              <div className="relative mx-auto w-full max-w-[480px] lg:max-w-none">
                <div className="overflow-hidden rounded-[28px] border bg-[#f8f9fa]" style={{ borderColor: COLORS.mist }}>
                  <img
                    src={imgYoungLearner}
                    alt="A student learning calmly — private by default"
                    loading="eager"
                    decoding="async"
                    className="aspect-[5/4] w-full object-cover"
                  />
                </div>
                <div className="relative mx-4 -mt-8 rounded-[18px] border bg-white p-5 shadow-[0_8px_32px_rgba(60,64,67,0.12)] sm:mx-8 sm:p-6" style={{ borderColor: COLORS.mist }}>
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe]" style={{ color: COLORS.blue }}>
                      <ShieldCheck className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-[16px] font-medium" style={{ color: COLORS.ink }}>Privacy starts with a clear picture</h2>
                      <p className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>
                        Visionary explains when information stays on your device, when it is linked to an account, and which people can see shared learning records.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeReveal>
          </div>
        </section>

        {/* PRIVACY SUMMARY */}
        <section className="px-6 py-10 sm:px-8 sm:py-14 lg:px-10" aria-labelledby="privacy-summary-title">
          <div className="mx-auto w-full max-w-[1240px]">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>Start here</p>
            <h2 id="privacy-summary-title" className="mt-2 text-[24px] font-normal tracking-[-0.02em] sm:text-[30px]" style={{ color: COLORS.ink }}>The essentials, at a glance</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {AT_A_GLANCE.map(({ to, label, text, Icon }, index) => (
                <a key={to} href={to} className="group flex min-h-[174px] flex-col rounded-[20px] border bg-white p-5 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] sm:p-6" style={{ borderColor: COLORS.mist }}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fe]" style={{ color: COLORS.blue }}><Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" /></span>
                  <span className="mt-5 flex items-center gap-2 text-[15px] font-medium" style={{ color: COLORS.ink }}><span className="text-[12px] font-normal tabular-nums" style={{ color: COLORS.grey }}>0{index + 1}</span>{label}<ArrowRight className="ml-auto h-4 w-4 shrink-0" style={{ color: COLORS.grey }} aria-hidden="true" /></span>
                  <span className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{text}</span>
                </a>
              ))}
            </div>
          </div>
        </section>


        {/* ON THIS PAGE + LEGAL CONTENT — sticky sidebar on desktop, mobile dropdown */}
        <section className="border-t px-6 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }} aria-label="Privacy policy contents">
          <div className="mx-auto grid w-full max-w-[1240px] gap-8 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-16">
            <aside className="hidden lg:block">
              <div className="sticky top-24 py-10">
                <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>In this policy</div>
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
                          className="group flex w-full items-start gap-3 rounded-[12px] px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                          style={{ backgroundColor: active ? COLORS.canvas : "transparent" }}
                        >
                          <span className="mt-0.5 w-6 shrink-0 text-[11px] font-medium tabular-nums" style={{ color: active ? COLORS.blue : COLORS.grey }}>{section.number}</span>
                          <span className="text-[13px] leading-[1.45]" style={{ color: active ? COLORS.ink : COLORS.graphite }}>{section.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </nav>
                <div className="mt-8 border-t pt-6" style={{ borderColor: COLORS.mist }}>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: COLORS.blue }} />
                    <p className="text-[13px] leading-[1.6]" style={{ color: COLORS.grey }}>
                      For safety and security details, see the Safety and Security pages.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Mobile TOC */}
            <div className="border-b lg:hidden" style={{ borderColor: COLORS.mist }}>
              <button
                type="button"
                onClick={() => setShowMobileContents((value) => !value)}
                aria-expanded={showMobileContents}
                aria-controls="privacy-mobile-contents"
                className="flex min-h-[64px] w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
              >
                <span>
                  <span className="block text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>In this policy</span>
                  <span className="mt-1 block text-[15px]" style={{ color: COLORS.ink }}>{activeSection?.title ?? "Choose a section"}</span>
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-200 ${showMobileContents ? "rotate-180" : ""}`} strokeWidth={1.8} style={{ color: COLORS.grey }} aria-hidden="true" />
              </button>
              {showMobileContents && (
                <div id="privacy-mobile-contents" className="pb-4">
                  <div className="overflow-hidden rounded-[16px] border" style={{ borderColor: COLORS.mist }}>
                    {SECTIONS.map((section) => {
                      const active = activeId === section.id;
                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => { scrollToSection(section.id); setActiveId(section.id); setShowMobileContents(false); }}
                          aria-current={active ? "location" : undefined}
                          className="flex min-h-12 w-full items-start gap-4 border-b px-4 py-3 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                          style={{ borderColor: COLORS.mist, backgroundColor: active ? COLORS.canvas : COLORS.white }}
                        >
                          <span className="mt-0.5 text-[11px] font-medium tabular-nums" style={{ color: active ? COLORS.blue : COLORS.grey }}>{section.number}</span>
                          <span className="text-[14px] leading-[1.45]" style={{ color: active ? COLORS.ink : COLORS.graphite }}>{section.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Main legal copy */}
            <div className="min-w-0">
              <article className="divide-y divide-[#dadce0]">
                {/* 01 — WHAT WE COLLECT */}
        <section id="what-we-collect" className="scroll-mt-24 py-14 sm:py-16">
            <SectionHeading number="01" title="What we collect" />
            <Paragraph>
              The information involved depends on the features you use. Some workspace records can stay in your browser, while account services use information needed to sign you in and provide connected features. The categories below explain what may be involved.
            </Paragraph>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { Icon: Mail, title: "Workspace and account context", text: "The email or identity details used to create or open a workspace, along with the role needed to show the right learning tools." },
                { Icon: Target, title: "Learning and content you provide", text: "Questions, materials, practice activity, progress records, and projects saved as you use the workspace." },
                { Icon: Database, title: "Device and technical details", text: "Basic browser, device, and diagnostic information may be used to keep the service reliable, secure, and compatible with your device." },
                { Icon: Settings2, title: "Your preferences", text: "Choices such as language, accessibility, audio interaction, and whether optional learning memory is used." },
              ].map(({ Icon, title, text }) => (
                <div key={title} className="rounded-[16px] border p-6" style={{ borderColor: COLORS.mist }}>
                  <IconTile Icon={Icon} />
                  <h3 className="mt-5 text-[16px] font-medium" style={{ color: COLORS.ink }}>{title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{text}</p>
                </div>
              ))}
            </div>
        </section>

        {/* 02 — WHY WE USE IT */}
        <section id="purpose" className="scroll-mt-24 py-14 sm:py-16">
            <SectionHeading number="02" title="Why we use it" />
            <Paragraph>
              Personal information is used to provide your workspace, retain the learning activity you choose to save, maintain and protect the service, and respond to your requests.
            </Paragraph>
            <div className="mt-10 max-w-[880px]">
              {[
                { Icon: Target, title: "Provide Visionary", text: "Answer questions, guide practice, and keep your work in one place as you continue." },
                { Icon: Database, title: "Keep saved work available", text: "Retain selected learning records, workspace preferences, and activity on this browser so you can resume where supported." },
                { Icon: Settings2, title: "Maintain and improve", text: "Diagnose issues, understand service performance, and improve the experience." },
                { Icon: ShieldCheck, title: "Protect people and the service", text: "Prevent misuse, and keep accounts safe from harm." },
                { Icon: Mail, title: "Communicate with you", text: "Service updates, and the email updates you choose to receive." },
              ].map(({ Icon, title, text }, i, arr) => (
                <div key={title} className={`flex items-start gap-5 py-6 ${i < arr.length - 1 ? "border-b" : ""}`} style={{ borderColor: COLORS.border }}>
                  <IconTile Icon={Icon} />
                  <div>
                    <h3 className="text-[17px] font-medium" style={{ color: COLORS.ink }}>{title}</h3>
                    <p className="mt-1.5 max-w-[620px] text-[14.5px] leading-[1.65]" style={{ color: COLORS.grey }}>{text}</p>
                  </div>
                </div>
              ))}
            </div>
        </section>

        {/* 03 — WHO CAN SEE IT */}
        <section id="sharing" className="scroll-mt-24 py-14 sm:py-16">
            <SectionHeading number="03" title="Who can see it" />
            <Paragraph>
              Visibility follows the workspace role and any explicit learning relationship. Visionary limits each view to the information needed for that relationship.
            </Paragraph>
            <div className="mt-10 overflow-hidden rounded-[16px] border" style={{ borderColor: COLORS.mist }}>
              {[
                ["Student", "Learners can review their own work. Private conversation text is not included in the parent and teacher progress views described here."],
                ["Teacher", "Class-linked learning evidence is limited to the teacher’s assigned classes in the product model."],
                ["Parent", "A parent view contains shared progress and activity summaries for connected children—not private conversations."],
                ["Institution", "The organization view is designed for aggregate, role-appropriate information rather than private learner conversations."],
                ["Service providers", "Trusted providers may process information only to operate, secure, support, or improve Visionary under appropriate contractual safeguards."],
              ].map(([who, what], i, arr) => (
                <div key={who} className={`px-5 py-4 sm:px-6 ${i < arr.length - 1 ? "border-b" : ""}`} style={{ borderColor: COLORS.mist }}>
                  <p className="text-[14.5px] font-medium" style={{ color: COLORS.ink }}>{who}</p>
                  <p className="mt-1 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{what}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-[760px] text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>
              We may also share information to meet legal obligations under Indian law. Legal demands are handled through the grievance process below.
            </p>
        </section>

        {/* 04 — YOUR CONTROLS */}
        <section id="your-controls" className="scroll-mt-24 py-14 sm:py-16">
            <SectionHeading number="04" title="Your controls" />
            <Paragraph>
              Your controls depend on where information is stored. Use Privacy settings to review information saved on this device, change workspace preferences, or contact the Grievance Officer for an access, correction, or deletion request.
            </Paragraph>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { Icon: Eye, title: "Review", text: "Inspect the personal workspace records saved in this browser." },
                { Icon: Settings2, title: "Adjust", text: "Change available language, audio, accessibility, and personalization preferences." },
                { Icon: Database, title: "Export", text: "No self-service account export is currently connected. Ask the Grievance Officer about a data request." },
                { Icon: Mail, title: "Request removal", text: "Send an account or record deletion request; it is reviewed rather than completed instantly here." },
              ].map(({ Icon, title, text }) => (
                <div key={title} className="rounded-[16px] border p-6" style={{ borderColor: COLORS.mist }}>
                  <IconTile Icon={Icon} />
                  <h3 className="mt-5 text-[16px] font-medium" style={{ color: COLORS.ink }}>{title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link to="/dashboard/privacy" className="inline-flex items-center gap-2 text-[14.5px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
                Review local data
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </Link>
              <Link to="/dashboard/personalization" className="inline-flex items-center gap-2 text-[14.5px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
                Change workspace preferences
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </Link>
              <Link to="/cookies" className="inline-flex items-center gap-2 text-[14.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.grey }}>
                Read about cookies
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </Link>
              <Link to="/security" className="inline-flex items-center gap-2 text-[14.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.grey }}>
                Review security practices
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </div>
        </section>

        {/* 05 — SECURITY */}
        <section id="security" className="scroll-mt-24 py-14 sm:py-16">
            <SectionHeading number="05" title="How we protect it" />
            <Paragraph>
              Visionary uses access controls, secure transport, and appropriate storage safeguards to protect information. We review these protections as the service changes and limit access to people and providers who need it for their work.
            </Paragraph>
            <LearnMoreRow to="/security" label="How security works at Visionary" />
        </section>

        {/* 06 — DATA REQUESTS */}
        <section id="data-requests" className="scroll-mt-24 py-14 sm:py-16">
          <SectionHeading number="06" title="Access and deletion requests" />
          <Paragraph>
            You can contact us to ask about personal information associated with your use of Visionary, request access or correction, or request deletion. The Grievance Officer reviews the request and may verify your identity before acting on it.
          </Paragraph>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { title: "Access or correction", text: "Tell us which workspace or record your request concerns so we can review it." },
              { title: "Deletion", text: "Describe the account or information you want removed. We will confirm the scope and any applicable retention requirements." },
              { title: "Records on this device", text: "Review what is stored in this browser before you clear browser data or change devices." },
            ].map((item, index) => (
              <div key={item.title} className="rounded-[16px] border p-5 sm:p-6" style={{ borderColor: COLORS.mist }}>
                <p className="text-[12px] font-medium tabular-nums" style={{ color: COLORS.blue }}>0{index + 1}</p>
                <h3 className="mt-3 text-[16px] font-medium" style={{ color: COLORS.ink }}>{item.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-4 rounded-[18px] border bg-[#f8f9fa] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" style={{ borderColor: COLORS.mist }}>
            <div>
              <p className="text-[15px] font-medium" style={{ color: COLORS.ink }}>Send a privacy request</p>
              <p className="mt-1 text-[14px] leading-6" style={{ color: COLORS.grey }}>{GRIEVANCE_OFFICER.response}</p>
            </div>
            <a href={`mailto:${GRIEVANCE_OFFICER.email}?subject=Privacy%20request`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#4285F4] px-5 text-[14px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">
              Contact the Grievance Officer
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* 07 — RETENTION */}
        <section id="retention" className="scroll-mt-24 py-14 sm:py-16">
            <SectionHeading number="07" title="How long we keep it" />
            <Paragraph>
              Workspace records stored locally remain in this browser until you remove them or clear browser storage. Account information is retained only while it is needed for the purposes explained in this policy, including legal, safety, and service requirements.
            </Paragraph>
            <div className="mt-10 max-w-[880px] rounded-[16px] border p-6 sm:p-7" style={{ borderColor: COLORS.mist }}>
              <p className="text-[16px] font-medium" style={{ color: COLORS.ink }}>Your privacy options.</p>
              <ul className="mt-4 space-y-2.5">
                {["Review personal workspaces stored in this browser.", "Check whether a record is stored on-device or with your account.", "Ask the Grievance Officer about access or deletion requests.", "Sign out of shared devices and review connected devices regularly."].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS.blue }} />
                    <span className="text-[14.5px] leading-[1.65]" style={{ color: COLORS.grey }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
        </section>

        {/* 08 — YOUNGER LEARNERS */}
        <section id="younger-learners" className="scroll-mt-24 py-14 sm:py-16">
            <SectionHeading number="08" title="Younger learners" />
            <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-center lg:gap-16">
              <div>
                <Paragraph>
                  Where a learner is a child under the DPDP Act, Visionary applies the consent and safeguard requirements that apply, including age-appropriate experiences and verified consent where required.
                </Paragraph>
                <LearnMoreRow to="/safety" label="How safety works for younger learners" />
              </div>
              <div className="overflow-hidden rounded-[24px] border" style={{ borderColor: COLORS.mist }}>
                <img
                  src={imgParentChild}
                  alt="A parent guiding a young learner — safeguarded by default"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
        </section>

        {/* 09 — COMMON QUESTIONS */}
        <section id="explainers" className="scroll-mt-24 py-14 sm:py-16">
            <SectionHeading number="09" title="Common privacy questions" />
            <div className="max-w-[880px] border-t" style={{ borderColor: COLORS.mist }}>
              {FAQ.map((item, index) => (
                <div key={item.q} className="border-b" style={{ borderColor: COLORS.mist }}>
                  <button
                    type="button"
                    aria-expanded={openFaq === index}
                    aria-controls={`privacy-faq-${index}`}
                    id={`privacy-faq-trigger-${index}`}
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex min-h-16 w-full items-center justify-between gap-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                  >
                    <span className="text-[16px] leading-[1.45]" style={{ color: COLORS.ink }}>{item.q}</span>
                    <ChevronDown className={["h-4 w-4 shrink-0 transition-transform duration-200", openFaq === index ? "rotate-180" : ""].join(" ")} strokeWidth={1.8} style={{ color: COLORS.grey }} />
                  </button>
                  <div id={`privacy-faq-${index}`} role="region" aria-labelledby={`privacy-faq-trigger-${index}`} hidden={openFaq !== index}>
                    <p className="pb-5 pr-8 text-[14.5px] leading-[1.7]" style={{ color: COLORS.grey }}>{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
        </section>

        {/* 10 — CONTACT AND GRIEVANCES */}
        <section id="grievance-officer" className="scroll-mt-24 py-14 sm:py-16">
            <SectionHeading number="10" title="Contact and grievances" />
            <Paragraph>
              For questions about this policy or to submit a privacy grievance, contact the named Grievance Officer. Include enough detail to identify the request, but do not send passwords or other secrets by email.
            </Paragraph>
            <div className="mt-8 max-w-[640px] rounded-[16px] border p-6 sm:p-7" style={{ borderColor: COLORS.mist }}>
              <p className="text-[14.5px] leading-[1.7]" style={{ color: COLORS.grey }}>
                {GRIEVANCE_OFFICER.role}: <strong style={{ color: COLORS.ink }}>{GRIEVANCE_OFFICER.name}</strong>
              </p>
              <p className="mt-3">
                <a href={`mailto:${GRIEVANCE_OFFICER.email}`} className="inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
                  {GRIEVANCE_OFFICER.email}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                </a>
              </p>
              <p className="mt-3 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{GRIEVANCE_OFFICER.response}</p>
            </div>
        </section>
              </article>
            </div>
          </div>
        </section>

        {/* RELATED */}
        <section aria-label="Related policies" className="border-t px-6 py-20 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto w-full max-w-[1240px]">
            <h2 className="text-[22px] font-normal leading-[1.3] tracking-[-0.01em]" style={{ color: COLORS.ink }}>Read them together</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { to: "/cookies", label: "Cookie policy", desc: "Essential cookies only.", Icon: Cookie },
                { to: "/security", label: "Security", desc: "How your information is protected.", Icon: ShieldCheck },
                { to: "/safety", label: "Safety", desc: "Guardrails for every learner.", Icon: Accessibility },
                { to: "/accessibility", label: "Accessibility", desc: "Built for every kind of learner.", Icon: FileText },
              ].map(({ to, label, desc, Icon }) => (
                <Link key={to} to={to} className="group rounded-[12px] border p-5 transition-colors hover:shadow-[0_1px_4px_rgba(16,17,20,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ borderColor: COLORS.mist }}>
                  <div className="flex items-center gap-3">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} style={{ color: COLORS.blue }} />
                    <span className="text-[15px] font-medium" style={{ color: COLORS.ink }}>{label}</span>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-[1.6]" style={{ color: COLORS.grey }}>{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
