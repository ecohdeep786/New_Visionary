import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle, ArrowRight, ChevronDown, Cookie, Database, Eye,
  FileText, Lock, ShieldCheck, UserRound,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import PolicyTabs from "@/components/landing/PolicyTabs";
import SpotIllustration from "@/components/landing/SpotIllustration";
import { LEGAL_META } from "@/data/legalMeta";

const COLORS = {
  ink: "#121317",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  border: "#dadce0",
  soft: "#f8f9fa",
  canvas: "#f7f8fa",
  blue: "#4285F4",
  navy: "#0b57d0",
  white: "#ffffff",
  graphite: "#5f6368",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

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
    <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

const SECURITY_PROMISES = ["Encrypted connections", "Role-based access", "You see every device"];

const AT_A_GLANCE = [
  {
    to: "#protected-in-transit",
    label: "Know it moves safely",
    text: "Encrypted HTTPS connections protect information between your browser and the service.",
    Icon: Lock,
  },
  {
    to: "#access-controlled",
    label: "See who can access",
    text: "Access follows authorized identities and the needs of the role — nothing broader.",
    Icon: UserRound,
  },
  {
    to: "#sync-devices",
    label: "Carry it across devices",
    text: "One Sync Encrypted ID brings your learning to every device — only you can open it.",
    Icon: ShieldCheck,
  },
];

const SECTIONS = [
  { id: "your-information", number: "01", title: "Your information", summary: "Understand the kinds of information that may move through Visionary." },
  { id: "protected-in-transit", number: "02", title: "Protected as it moves", summary: "How information is protected while it travels between you and Visionary." },
  { id: "protected-when-stored", number: "03", title: "Protected when stored", summary: "How Visionary protects stored information." },
  { id: "access-controlled", number: "04", title: "Access is controlled", summary: "How access is limited to the people and systems that need it." },
  { id: "your-control", number: "05", title: "Your control matters", summary: "Security works together with privacy, account controls, and data choices." },
  { id: "security-over-time", number: "06", title: "Security is ongoing", summary: "Security is a continuous process, not a one-time feature." },
  { id: "report-security", number: "07", title: "When something goes wrong", summary: "How to tell Visionary about a security concern." },
  { id: "commitments", number: "08", title: "Our security commitments", summary: "The principles Visionary follows when protecting the service." },
  { id: "sync-devices", number: "09", title: "Sync devices", summary: "Sign in once with your Sync Encrypted ID and carry Visionary across your devices." },
  { id: "contact", number: "10", title: "Contact", summary: "How to contact Visionary about security." },
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
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f0fe]" style={{ color: COLORS.navy }}>
      <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
    </span>
  );
}

function SecurityCard({ icon: Icon, eyebrow, title, children }) {
  return (
    <div className="flex h-full flex-col rounded-[16px] g-card p-6">
      <IconTile Icon={Icon} />
      <div className="mt-4 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>{eyebrow}</div>
      <h3 className="mt-1.5 text-[17px] font-normal leading-[1.3]" style={{ color: COLORS.ink }}>{title}</h3>
      <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{children}</p>
    </div>
  );
}

function Note({ children }) {
  return (
    <div className="mt-6 max-w-[760px] rounded-[16px] bg-[#f8f9fa] px-5 py-5 sm:px-6">
      <p className="text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{children}</p>
    </div>
  );
}

function LearnMoreRow({ to, label }) {
  return (
    <Link to={to} className="mt-5 inline-flex items-center gap-2 text-[14.5px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.navy }}>
      {label}
      <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
    </Link>
  );
}

export default function SecurityPage() {
  const [activeId, setActiveId] = useState("your-information");
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
      <Breadcrumb page="Security" />
      <PolicyTabs />

      <main id="main">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-14">
            {/* SIDEBAR TOC — starts at the top, beside the policy hero */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 py-10">
                <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>In this policy</div>
                <nav aria-label="Security sections">
                  <div className="space-y-1">
                    {SECTIONS.map((section) => {
                      const active = activeId === section.id;
                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => scrollToSection(section.id)}
                          aria-current={active ? "location" : undefined}
                          className="group flex w-full items-start gap-3 rounded-full px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                          style={{ backgroundColor: active ? COLORS.canvas : "transparent" }}
                        >
                          <span className="mt-0.5 w-6 shrink-0 text-[11px] font-medium tabular-nums" style={{ color: active ? COLORS.navy : COLORS.grey }}>{section.number}</span>
                          <span className="text-[13px] leading-[1.45]" style={{ color: active ? COLORS.ink : COLORS.graphite }}>{section.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </nav>
                <div className="mt-8 border-t pt-6">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: COLORS.navy }} />
                    <p className="text-[13px] leading-[1.6]" style={{ color: COLORS.grey }}>
                      Security and privacy work together. For personal data and your rights, see the Privacy Policy.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* CONTENT COLUMN */}
            <div className="min-w-0">
              {/* POLICY HERO — the same policies.google.com opening as Privacy */}
              <FadeReveal visible={heroVisible}>
                <div className="pb-12 pt-2">
                  <div className="flex justify-center"><SpotIllustration subject="shield" className="h-28 w-28 lg:h-36 lg:w-36" /></div>
                  <p className="mt-10 text-[12px] font-medium uppercase tracking-[0.15em]" style={{ color: COLORS.grey }}>Security</p>
                  <h1 className="mt-4 max-w-[720px] text-[36px] font-normal leading-[1.12] tracking-[-0.035em] sm:text-[48px] lg:text-[56px]" style={{ color: COLORS.ink }}>
                    Secure by design, protected end to end.
                  </h1>
                  <p className="mt-6 max-w-[640px] text-[17px] leading-[1.7] sm:text-[18px]" style={{ color: COLORS.grey }}>
                    Encryption, access controls, and clear account tools — described plainly, without security promises we cannot keep.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {SECURITY_PROMISES.map((p) => (
                      <span key={p} className="flex items-center gap-1.5 text-[13.5px] font-medium" style={{ color: COLORS.ink }}>
                        <ShieldCheck className="h-4 w-4" strokeWidth={1.8} style={{ color: COLORS.navy }} aria-hidden="true" />
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Action row */}
                  <div className="mt-10 flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#e8f0fe]" style={{ color: COLORS.navy }}>
                      <ShieldCheck className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[16px] font-medium" style={{ color: COLORS.ink }}>Found a security issue?</p>
                      <p className="mt-0.5 text-[14.5px]" style={{ color: COLORS.grey }}>A clear description and the affected page is all we need.</p>
                      <a href="mailto:security@visionary.org.in" className="mt-1.5 inline-flex items-center gap-1.5 text-[14px] font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.navy }}>
                        security@visionary.org.in
                        <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                      </a>
                    </div>
                  </div>

                  <p className="mt-10 border-t pt-5 text-[13px] leading-5" style={{ borderColor: COLORS.mist, color: COLORS.grey }}>
                    Effective {LEGAL_META.security.lastUpdated}
                  </p>
                </div>

                {/* Mobile TOC */}
                <div className="border-b pb-4 lg:hidden">
                  <button
                    type="button"
                    onClick={() => setShowMobileContents((value) => !value)}
                    aria-expanded={showMobileContents}
                    aria-controls="security-mobile-contents"
                    className="flex min-h-[64px] w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                  >
                    <span>
                      <span className="block text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>In this policy</span>
                      <span className="mt-1 block text-[15px]" style={{ color: COLORS.ink }}>{activeSection?.title ?? "Choose a section"}</span>
                    </span>
                    <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-200 ${showMobileContents ? "rotate-180" : ""}`} strokeWidth={1.8} style={{ color: COLORS.grey }} aria-hidden="true" />
                  </button>
                  {showMobileContents && (
                    <div id="security-mobile-contents" className="pt-4">
                      <div className="overflow-hidden rounded-[16px] border">
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
                              <span className="mt-0.5 text-[11px] font-medium tabular-nums" style={{ color: active ? COLORS.navy : COLORS.grey }}>{section.number}</span>
                              <span className="text-[14px] leading-[1.45]" style={{ color: active ? COLORS.ink : COLORS.graphite }}>{section.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* AT A GLANCE */}
                <section className="py-12" aria-labelledby="security-summary-title">
                  <p className="text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>Start here</p>
                  <h2 id="security-summary-title" className="mt-2 text-[24px] font-normal tracking-[-0.02em] sm:text-[30px]" style={{ color: COLORS.ink }}>The essentials, at a glance</h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {AT_A_GLANCE.map(({ to, label, text, Icon }, index) => (
                      <a key={to} href={to} className="group relative flex min-h-[174px] flex-col overflow-hidden rounded-[20px] g-card bg-white p-5 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] sm:p-6">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fe]" style={{ color: COLORS.navy }}><Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" /></span>
                        <span className="mt-5 flex items-center gap-2 text-[15px] font-medium" style={{ color: COLORS.ink }}><span className="text-[12px] font-normal tabular-nums" style={{ color: COLORS.grey }}>0{index + 1}</span>{label}</span>
                        <span className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{text}</span>
                        {/* google.com card curve — tint sweeps into the corner with the card's arrow nested in it */}
                        <div aria-hidden="true" className="absolute bottom-0 right-0 h-[44px] w-[76px] rounded-tl-[20px] bg-[#e8f0fe]" />
                        <div className="absolute bottom-0 right-0 flex h-[44px] w-[76px] items-center justify-center"><ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" style={{ color: COLORS.navy }} aria-hidden="true" /></div>
                      </a>
                    ))}
                  </div>
                </section>
              </FadeReveal>

              {/* LEGAL CONTENT */}
              <article className="divide-y divide-[#dadce0]">
                {/* 01 */}
                <section id="your-information" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="01" title="Your information" />
                  <Paragraph>Security starts with understanding what information moves through a product.</Paragraph>
                  <div className="mt-5"><Paragraph>Depending on how you use Visionary, this can include information such as your account details, conversations, learning activity, content you provide, and information needed to operate the service.</Paragraph></div>
                  <div className="mt-5"><Paragraph>The Privacy Policy explains what information Visionary collects, why it is used, how it is handled, and the choices available to you.</Paragraph></div>
                  <Note>Security protects information. Privacy explains what information we handle and why.</Note>
                </section>

                {/* 02 */}
                <section id="protected-in-transit" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="02" title="Protected as it moves" />
                  <Paragraph>Information can move between your device, Visionary, and the systems that help provide the service.</Paragraph>
                  <div className="mt-5"><Paragraph>Visionary uses encrypted HTTPS connections when information travels between your browser and the service. Keep your browser and operating system updated so they can use current connection protections.</Paragraph></div>
                  <Note>A secure connection protects information in transit. It does not make an unsafe device or a shared account private.</Note>
                </section>

                {/* 03 */}
                <section id="protected-when-stored" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="03" title="Protected when stored" />
                  <Paragraph>Information that needs to remain available to operate Visionary may be stored in our systems.</Paragraph>
                  <div className="mt-5"><Paragraph>Stored information is protected through technical and organizational measures, including controls around infrastructure, systems, credentials, and access.</Paragraph></div>
                  <div className="mt-5"><Paragraph>We design security around reducing the opportunity for unauthorized access and limiting the impact when something goes wrong.</Paragraph></div>
                  <Note>Some workspace information can remain on your device. Account-linked information follows the storage and retention choices explained in the Privacy Policy.</Note>
                </section>

                {/* 04 */}
                <section id="access-controlled" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="04" title="Access is controlled" />
                  <Paragraph>Not everyone who works on a system should have access to everything inside it.</Paragraph>
                  <div className="mt-5"><Paragraph>Visionary limits access to systems and information according to what a person or service needs to perform its role.</Paragraph></div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <SecurityCard icon={UserRound} eyebrow="Identity" title="Who can access">
                      Access is tied to authorized identities rather than shared credentials.
                    </SecurityCard>
                    <SecurityCard icon={Database} eyebrow="Scope" title="What they can access">
                      Access is limited to the systems and information required for the task.
                    </SecurityCard>
                  </div>
                  <Note>Student, teacher, parent, and organization roles receive different views. A relationship does not grant access beyond its defined purpose.</Note>
                </section>

                {/* 05 */}
                <section id="your-control" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="05" title="Your control matters" />
                  <Paragraph>Security is not separate from privacy or account control.</Paragraph>
                  <div className="mt-5"><Paragraph>You should be able to understand what happens to your information and use the controls Visionary provides to manage your account and data.</Paragraph></div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <SecurityCard icon={Lock} eyebrow="Privacy" title="Understand your data">
                      See what information is collected and how it is used through the Privacy Policy.
                    </SecurityCard>
                    <SecurityCard icon={ShieldCheck} eyebrow="Account" title="Protect your account">
                      Keep your account credentials secure and use the account controls made available by Visionary.
                    </SecurityCard>
                  </div>
                </section>

                {/* 06 */}
                <section id="security-over-time" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="06" title="Security is ongoing" />
                  <Paragraph>A secure product is never finished.</Paragraph>
                  <div className="mt-5"><Paragraph>Software changes. New vulnerabilities are discovered. New threats appear. Security therefore requires continuous attention as Visionary's product and infrastructure evolve.</Paragraph></div>
                  <div className="mt-5"><Paragraph>Our engineering and operations practices should include maintaining dependencies, reviewing configurations, responding to vulnerabilities, and improving protections as the system changes.</Paragraph></div>
                  <Note>This page describes our security approach. It does not claim that any system can prevent every possible security incident.</Note>
                </section>

                {/* 07 */}
                <section id="report-security" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="07" title="When something goes wrong" />
                  <Paragraph>Finding a security problem is the first step toward fixing it.</Paragraph>
                  <div className="mt-5"><Paragraph>If you believe you have discovered a vulnerability, unauthorized access, or another security issue involving Visionary, please report it through our security contact channel.</Paragraph></div>
                  <div className="mt-6">
                    <a href="mailto:security@visionary.org.in"
                      className="inline-flex items-center gap-2 text-[20px] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                      style={{ color: COLORS.navy }}>
                      security@visionary.org.in
                      <ArrowRight className="h-5 w-5" strokeWidth={1.7} />
                    </a>
                  </div>
                  <Note>Include a clear description, the affected page or feature, and steps to reproduce the issue. Do not include passwords or unnecessary personal data.</Note>
                </section>

                {/* 08 */}
                <section id="commitments" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="08" title="Our security commitments" />
                  <div className="mt-8 max-w-[880px] space-y-4">
                    <div className="rounded-[16px] g-card p-5 sm:p-6">
                      <div className="flex gap-4">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: COLORS.navy }} />
                        <div>
                          <h3 className="text-[17px] font-normal" style={{ color: COLORS.ink }}>Protect information</h3>
                          <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>Use appropriate technical and organizational measures to protect information handled by the service.</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[16px] g-card p-5 sm:p-6">
                      <div className="flex gap-4">
                        <UserRound className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: COLORS.navy }} />
                        <div>
                          <h3 className="text-[17px] font-normal" style={{ color: COLORS.ink }}>Limit access</h3>
                          <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>Restrict access to systems and information according to legitimate operational needs.</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[16px] g-card p-5 sm:p-6">
                      <div className="flex gap-4">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: COLORS.navy }} />
                        <div>
                          <h3 className="text-[17px] font-normal" style={{ color: COLORS.ink }}>Respond to problems</h3>
                          <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>Investigate reported security concerns and improve the service when weaknesses are found.</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[16px] g-card p-5 sm:p-6">
                      <div className="flex gap-4">
                        <Eye className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: COLORS.navy }} />
                        <div>
                          <h3 className="text-[17px] font-normal" style={{ color: COLORS.ink }}>Be clear about what we know</h3>
                          <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>Avoid making security promises that are not supported by Visionary's actual systems and practices.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 09 · SYNC DEVICES — the master-order product requirement */}
                <section id="sync-devices" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="09" title="Sync devices" />
                  <Paragraph>
                    Sign in with your Sync Encrypted ID and Visionary carries your learning to every device you use — your questions, progress, and memory arrive as they were, and only you can open them.
                  </Paragraph>
                  <div className="mt-8 max-w-[880px] space-y-4">
                    <div className="rounded-[16px] g-card p-5 sm:p-6">
                      <div className="flex gap-4">
                        <Lock className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: COLORS.navy }} />
                        <div>
                          <h3 className="text-[17px] font-normal" style={{ color: COLORS.ink }}>Sign in with your Sync Encrypted ID</h3>
                          <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>One encrypted identity unlocks Visionary on a new device — the encryption stays with your account, not with the device.</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[16px] g-card p-5 sm:p-6">
                      <div className="flex gap-4">
                        <Database className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: COLORS.navy }} />
                        <div>
                          <h3 className="text-[17px] font-normal" style={{ color: COLORS.ink }}>Your learning follows you</h3>
                          <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>Progress, notes, and memory sync across phone, tablet, and laptop — pick up exactly where you stopped.</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[16px] g-card p-5 sm:p-6">
                      <div className="flex gap-4">
                        <Eye className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: COLORS.navy }} />
                        <div>
                          <h3 className="text-[17px] font-normal" style={{ color: COLORS.ink }}>You see every device</h3>
                          <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>Review the devices signed in to your account and remove any of them, at any time, from your settings.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <LearnMoreRow to="/privacy" label="How privacy works with sync" />
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0b57d0] px-6 text-[14px] font-medium text-white hover:bg-[#0842a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">Sign in with Sync Encrypted ID</Link>
                    <Link to="/dashboard/settings" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#dadce0] px-6 text-[14px] font-medium text-[#121317] hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">Review your devices</Link>
                  </div>
                </section>

                {/* 10 */}
                <section id="contact" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="10" title="Contact" />
                  <Paragraph>Security questions, vulnerability reports, and security concerns can be sent to:</Paragraph>
                  <div className="mt-6">
                    <a href="mailto:security@visionary.org.in"
                      className="inline-flex items-center gap-2 text-[20px] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                      style={{ color: COLORS.navy }}>
                      security@visionary.org.in
                      <ArrowRight className="h-5 w-5" strokeWidth={1.7} />
                    </a>
                  </div>
                  <div className="mt-6">
                    <Paragraph>For privacy, safety, account, billing, or product questions, please use the relevant Visionary support channel.</Paragraph>
                  </div>
                  <LearnMoreRow to="/help" label="Visit the Help Center" />
                </section>
              </article>
            </div>
          </div>
        </div>

        {/* KEY TERMS — the policies.google.com glossary pattern */}
        <section aria-labelledby="key-terms-title" className="px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="mx-auto w-full max-w-[1240px]">
            <h2 id="key-terms-title" className="text-[24px] font-normal tracking-[-0.02em] sm:text-[30px]" style={{ color: COLORS.ink }}>Key terms</h2>
            <div className="mt-8 grid gap-x-14 gap-y-8 border-t pt-10 sm:grid-cols-2">
              {[
                { term: "Encryption", def: "Scrambling information while it travels or rests, so only authorized people and systems can read it." },
                { term: "HTTPS", def: "The encrypted connection used between your browser and Visionary whenever information moves." },
                { term: "Sync Encrypted ID", def: "The single encrypted identity that carries your Visionary learning across your devices." },
                { term: "Role-based access", def: "Access limited to what a student, teacher, parent, or organization role legitimately needs." },
                { term: "Workspace records", def: "The questions, practice, and projects from your sessions — on-device or linked to your account." },
                { term: "Vulnerability", def: "A weakness that could be exploited. If you find one, report it — we investigate every report." },
              ].map(({ term, def }) => (
                <div key={term}>
                  <p className="text-[16px] font-medium" style={{ color: COLORS.ink }}>{term}</p>
                  <p className="mt-1.5 max-w-[520px] text-[14.5px] leading-[1.7]" style={{ color: COLORS.grey }}>{def}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RELATED */}
        <section aria-label="Related policies" className="border-t px-6 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-[1240px]">
            <h2 className="text-[22px] font-normal leading-[1.3] tracking-[-0.01em]" style={{ color: COLORS.ink }}>Read them together</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { to: "/privacy", label: "Privacy Policy", desc: "Your learning is personal.", Icon: Lock },
                { to: "/terms", label: "Terms of service", desc: "Clear rules, written to be understood.", Icon: FileText },
                { to: "/cookies", label: "Cookie policy", desc: "Essential cookies only.", Icon: Cookie },
                { to: "/safety", label: "Safety", desc: "Guardrails for every learner.", Icon: ShieldCheck },
              ].map(({ to, label, desc, Icon }) => (
                <Link key={to} to={to} className="group relative overflow-hidden rounded-[12px] g-card p-5 pb-12 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
                  <div className="flex items-center gap-3">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} style={{ color: COLORS.navy }} />
                    <span className="text-[15px] font-medium" style={{ color: COLORS.ink }}>{label}</span>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-[1.6]" style={{ color: COLORS.grey }}>{desc}</p>
                  {/* google.com card curve — tint sweeps into the corner with the card's arrow nested in it */}
                  <div aria-hidden="true" className="absolute bottom-0 right-0 h-[40px] w-[68px] rounded-tl-[12px] bg-[#e8f0fe]" />
                  <div className="absolute bottom-0 right-0 flex h-[40px] w-[68px] items-center justify-center"><ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1 motion-reduce:transform-none" style={{ color: COLORS.navy }} aria-hidden="true" /></div>
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
