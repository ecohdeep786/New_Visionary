import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Accessibility, ArrowRight, ChevronDown, Cookie, FileText,
  Lock, ShieldCheck, UsersRound,
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

const TERMS_PROMISES = ["Written to be understood", "Your content stays yours", "Material changes get notice"];

const AT_A_GLANCE = [
  {
    to: "#what-you-cannot-do",
    label: "Know the rules",
    text: "The do's and don'ts that keep Visionary safe and useful for everyone.",
    Icon: ShieldCheck,
  },
  {
    to: "#your-content",
    label: "Understand your content",
    text: "You stay responsible for what you create, and for the rights to it.",
    Icon: FileText,
  },
  {
    to: "#plans-payments",
    label: "See how plans work",
    text: "Billing, renewal, and cancellation follow what the Pricing page describes.",
    Icon: UsersRound,
  },
];

const SECTIONS = [
  { id: "who-can-use", number: "01", title: "Who can use Visionary", summary: "The people and organizations that may use Visionary." },
  { id: "what-you-can-do", number: "02", title: "What you can do", summary: "How Visionary can be used for learning, teaching, creating, and work." },
  { id: "what-you-cannot-do", number: "03", title: "What you cannot do", summary: "The rules that help keep Visionary safe and useful." },
  { id: "what-we-provide", number: "04", title: "What we provide", summary: "What you can expect from the service and where AI can be limited." },
  { id: "your-content", number: "05", title: "Your content", summary: "Your responsibility for content and the permissions needed to provide the service." },
  { id: "your-account", number: "06", title: "Your account", summary: "Your responsibility for account information and account security." },
  { id: "plans-payments", number: "07", title: "Plans, payments, and cancellation", summary: "How paid plans and billing are handled." },
  { id: "changes", number: "08", title: "When Visionary or your access changes", summary: "What happens when the service or these Terms change." },
  { id: "restriction", number: "09", title: "When access may be restricted", summary: "When Visionary may restrict, suspend, or end access." },
  { id: "responsibility", number: "10", title: "Disclaimers and responsibility", summary: "Important limits on the service and your responsibility when using it." },
  { id: "disputes", number: "11", title: "Governing law and disputes", summary: "How disagreements are handled." },
  { id: "contact", number: "12", title: "Contact", summary: "How to reach Visionary about these Terms." },
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

function BulletList({ items }) {
  return (
    <ul className="mt-6 max-w-[760px] rounded-[16px] g-card p-6">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3 py-1.5 text-[14.5px] leading-[1.65]" style={{ color: COLORS.grey }}>
          <span aria-hidden="true" className="mt-[0.68em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS.navy }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
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

export default function TermsPage() {
  const [activeId, setActiveId] = useState("who-can-use");
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
      <Breadcrumb page="Terms" />
      <PolicyTabs />

      <main id="main">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-14">
            {/* SIDEBAR TOC — starts at the top, beside the policy hero */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 py-10">
                <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>In this policy</div>
                <nav aria-label="Terms sections">
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
                      These Terms are read together with the Privacy Policy and the Cookie policy.
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
                  <div className="flex justify-center"><SpotIllustration subject="document" className="h-28 w-28 lg:h-36 lg:w-36" /></div>
                  <p className="mt-10 text-[12px] font-medium uppercase tracking-[0.15em]" style={{ color: COLORS.grey }}>Terms of service</p>
                  <h1 className="mt-4 max-w-[720px] text-[36px] font-normal leading-[1.12] tracking-[-0.035em] sm:text-[48px] lg:text-[56px]" style={{ color: COLORS.ink }}>
                    Clear rules, written to be understood.
                  </h1>
                  <p className="mt-6 max-w-[640px] text-[17px] leading-[1.7] sm:text-[18px]" style={{ color: COLORS.grey }}>
                    What you can expect from Visionary, and what we expect from the people who use it — without the obscure language.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {TERMS_PROMISES.map((p) => (
                      <span key={p} className="flex items-center gap-1.5 text-[13.5px] font-medium" style={{ color: COLORS.ink }}>
                        <ShieldCheck className="h-4 w-4" strokeWidth={1.8} style={{ color: COLORS.navy }} aria-hidden="true" />
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Action row */}
                  <div className="mt-10 flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#e8f0fe]" style={{ color: COLORS.navy }}>
                      <FileText className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[16px] font-medium" style={{ color: COLORS.ink }}>Questions about these Terms?</p>
                      <p className="mt-0.5 text-[14.5px]" style={{ color: COLORS.grey }}>The team reads every message about how these rules apply.</p>
                      <a href="mailto:legal@visionary.org.in" className="mt-1.5 inline-flex items-center gap-1.5 text-[14px] font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.navy }}>
                        legal@visionary.org.in
                        <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                      </a>
                    </div>
                  </div>

                  <p className="mt-10 border-t pt-5 text-[13px] leading-5" style={{ borderColor: COLORS.mist, color: COLORS.grey }}>
                    Effective {LEGAL_META.terms.lastUpdated}
                  </p>
                </div>

                {/* Mobile TOC */}
                <div className="border-b pb-4 lg:hidden">
                  <button
                    type="button"
                    onClick={() => setShowMobileContents((value) => !value)}
                    aria-expanded={showMobileContents}
                    aria-controls="terms-mobile-contents"
                    className="flex min-h-[64px] w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                  >
                    <span>
                      <span className="block text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>In this policy</span>
                      <span className="mt-1 block text-[15px]" style={{ color: COLORS.ink }}>{activeSection?.title ?? "Choose a section"}</span>
                    </span>
                    <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-200 ${showMobileContents ? "rotate-180" : ""}`} strokeWidth={1.8} style={{ color: COLORS.grey }} aria-hidden="true" />
                  </button>
                  {showMobileContents && (
                    <div id="terms-mobile-contents" className="pt-4">
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
                <section className="py-12" aria-labelledby="terms-summary-title">
                  <p className="text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>Start here</p>
                  <h2 id="terms-summary-title" className="mt-2 text-[24px] font-normal tracking-[-0.02em] sm:text-[30px]" style={{ color: COLORS.ink }}>The essentials, at a glance</h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {AT_A_GLANCE.map(({ to, label, text, Icon }, index) => (
                      <a key={to} href={to} className="group flex min-h-[174px] flex-col rounded-[20px] g-card bg-white p-5 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] sm:p-6">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fe]" style={{ color: COLORS.navy }}><Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" /></span>
                        <span className="mt-5 flex items-center gap-2 text-[15px] font-medium" style={{ color: COLORS.ink }}><span className="text-[12px] font-normal tabular-nums" style={{ color: COLORS.grey }}>0{index + 1}</span>{label}<ArrowRight className="ml-auto h-4 w-4 shrink-0" style={{ color: COLORS.grey }} aria-hidden="true" /></span>
                        <span className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{text}</span>
                      </a>
                    ))}
                  </div>
                </section>
              </FadeReveal>

              {/* LEGAL CONTENT */}
              <article className="divide-y divide-[#dadce0]">
                {/* 01 */}
                <section id="who-can-use" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="01" title="Who can use Visionary" />
                  <Paragraph>You may use Visionary only if you are legally permitted to enter into these Terms.</Paragraph>
                  <div className="mt-5"><Paragraph>For younger learners, use of Visionary may require involvement or permission from a parent or legal guardian, depending on the learner's age and the applicable law.</Paragraph></div>
                  <div className="mt-5"><Paragraph>If you are using Visionary on behalf of a school, company, institution, or another organization, you confirm that you have authority to accept these Terms on its behalf.</Paragraph></div>
                  <Note>The final minimum-age and parental-consent language should match Visionary's actual account model and applicable law before publication.</Note>
                </section>

                {/* 02 */}
                <section id="what-you-can-do" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="02" title="What you can do" />
                  <Paragraph>Use Visionary to support learning, teaching, practice, creation, and work.</Paragraph>
                  <BulletList items={[
                    <><strong style={{ color: COLORS.ink }}>Learn.</strong> Understand ideas, ask questions, practise skills, and continue your learning.</>,
                    <><strong style={{ color: COLORS.ink }}>Teach.</strong> Create learning experiences, support learners, and use information generated by Visionary as part of teaching.</>,
                    <><strong style={{ color: COLORS.ink }}>Create.</strong> Build projects, ideas, documents, or other work using the features available to you.</>,
                    <><strong style={{ color: COLORS.ink }}>Work.</strong> Use Visionary to support professional learning and tasks.</>,
                  ]} />
                  <div className="mt-5"><Paragraph>You are responsible for how you use information and output provided by Visionary.</Paragraph></div>
                </section>

                {/* 03 */}
                <section id="what-you-cannot-do" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="03" title="What you cannot do" />
                  <Paragraph>Keep Visionary useful and safe for everyone.</Paragraph>
                  <BulletList items={[
                    "Break applicable laws or regulations.",
                    "Harm, threaten, harass, exploit, or deceive another person.",
                    "Infringe another person's intellectual-property, privacy, or other legal rights.",
                    "Attempt to gain unauthorized access to Visionary or another user's account or information.",
                    "Interfere with, disrupt, reverse engineer, or bypass the security or operation of the service, except where applicable law expressly permits it.",
                    "Upload or distribute malicious software or harmful code.",
                    "Use Visionary to create or distribute content that violates applicable safety policies.",
                    "Misuse automated access or attempt to circumvent usage limits or other service protections.",
                  ]} />
                </section>

                {/* 04 */}
                <section id="what-we-provide" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="04" title="What we provide" />
                  <Paragraph>Visionary provides technology designed to support learning, teaching, practice, creation, and connected progress.</Paragraph>
                  <div className="mt-5"><Paragraph>Features may change over time. We may add, improve, remove, or limit features as the product develops.</Paragraph></div>
                  <div className="mt-5"><Paragraph>Visionary can provide useful information and assistance, but it does not guarantee that every response, explanation, recommendation, or generated result will always be accurate, complete, or suitable for your particular situation.</Paragraph></div>
                  <div className="mt-5"><Paragraph>For decisions that require professional judgment, you should rely on an appropriately qualified professional.</Paragraph></div>
                  <Note>Visionary is a learning and productivity service, not a replacement for qualified medical, legal, financial, or other professional advice.</Note>
                </section>

                {/* 05 */}
                <section id="your-content" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="05" title="Your content" />
                  <Paragraph>You remain responsible for the content you submit, upload, create, or share through Visionary.</Paragraph>
                  <div className="mt-5"><Paragraph>You must have the necessary rights and permissions to provide that content.</Paragraph></div>
                  <div className="mt-5"><Paragraph>When operating Visionary requires us to store, process, display, or transmit your content, you give Visionary the permissions reasonably necessary to provide those services.</Paragraph></div>
                  <div className="mt-5"><Paragraph>Your Privacy Policy explains separately how personal information and other data are handled.</Paragraph></div>
                  <LearnMoreRow to="/privacy" label="Read the Privacy Policy" />
                </section>

                {/* 06 */}
                <section id="your-account" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="06" title="Your account" />
                  <Paragraph>Keep your account information accurate and take reasonable steps to protect your account.</Paragraph>
                  <BulletList items={[
                    "Provide accurate information when creating your account.",
                    "Keep your login information secure.",
                    "Take responsibility for activity that occurs through your account.",
                    "Tell us when you believe your account has been compromised.",
                  ]} />
                  <div className="mt-5"><Paragraph>You must not use another person's account without permission or create accounts in deceptive ways.</Paragraph></div>
                  <div className="mt-5"><Paragraph>For organizational accounts, an authorized administrator may have additional responsibilities and controls.</Paragraph></div>
                </section>

                {/* 07 */}
                <section id="plans-payments" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="07" title="Plans, payments, and cancellation" />
                  <Paragraph>Some Visionary features or services may require payment.</Paragraph>
                  <div className="mt-5"><Paragraph>Prices, billing periods, available features, renewal terms, refunds, and cancellation rules are described on the Pricing page or at the time of purchase.</Paragraph></div>
                  <div className="mt-5"><Paragraph>A subscription does not transfer ownership of Visionary or its underlying technology to you.</Paragraph></div>
                  <Note>The published Terms must be kept consistent with the actual pricing, billing, refund, tax, and cancellation implementation.</Note>
                  <LearnMoreRow to="/pricing" label="See the Pricing page" />
                </section>

                {/* 08 */}
                <section id="changes" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="08" title="When Visionary or your access changes" />
                  <Paragraph>Products change. These Terms may need to change with them.</Paragraph>
                  <div className="mt-5"><Paragraph>We may update, suspend, or discontinue parts of Visionary when reasonably necessary, including for product development, security, legal, or operational reasons.</Paragraph></div>
                  <div className="mt-5"><Paragraph>When changes to these Terms are material, we will provide notice where required by applicable law.</Paragraph></div>
                  <div className="mt-5"><Paragraph>The updated Terms will show a new <strong style={{ color: COLORS.ink }}>Last updated</strong> date.</Paragraph></div>
                </section>

                {/* 09 */}
                <section id="restriction" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="09" title="When access may be restricted" />
                  <Paragraph>We may restrict, suspend, or terminate access when necessary to protect users, Visionary, or the integrity of the service.</Paragraph>
                  <BulletList items={[
                    "These Terms or applicable policies are seriously or repeatedly violated.",
                    "The service is being used in a way that creates a safety, security, or legal risk.",
                    "We are required to do so by law or legal process.",
                    "Your conduct causes harm or significant risk to another person, organization, or Visionary.",
                  ]} />
                  <div className="mt-5"><Paragraph>Where reasonably possible and legally permitted, we should provide an explanation and an opportunity to address the issue.</Paragraph></div>
                </section>

                {/* 10 */}
                <section id="responsibility" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="10" title="Disclaimers and responsibility" />
                  <Paragraph>Visionary is provided subject to applicable law.</Paragraph>
                  <div className="mt-5"><Paragraph>We do not promise that the service will always be uninterrupted, error-free, completely accurate, or available in every circumstance.</Paragraph></div>
                  <div className="mt-5"><Paragraph>You remain responsible for reviewing important information before relying on it, particularly where an incorrect result could materially affect a person or organization.</Paragraph></div>
                  <div className="mt-5"><Paragraph>Any limitation of liability, warranty disclaimer, indemnification provision, or related legal language will apply only to the extent permitted by applicable law.</Paragraph></div>
                </section>

                {/* 11 */}
                <section id="disputes" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="11" title="Governing law and disputes" />
                  <Paragraph>If there is a disagreement, contact Visionary first and give us an opportunity to understand and resolve the issue.</Paragraph>
                  <div className="mt-5"><Paragraph>If a dispute cannot be resolved informally, the applicable governing law, jurisdiction, dispute-resolution procedure, arbitration provisions, and courts will be specified here.</Paragraph></div>
                  <Note>Final jurisdiction, arbitration, governing-law, and dispute provisions should be reviewed and approved by Visionary's legal counsel before publication.</Note>
                </section>

                {/* 12 */}
                <section id="contact" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="12" title="Contact" />
                  <Paragraph>Questions about these Terms? Contact Visionary at:</Paragraph>
                  <div className="mt-6">
                    <a href="mailto:legal@visionary.org.in"
                      className="inline-flex items-center gap-2 text-[20px] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                      style={{ color: COLORS.navy }}>
                      legal@visionary.org.in
                      <ArrowRight className="h-5 w-5" strokeWidth={1.7} />
                    </a>
                  </div>
                  <div className="mt-5">
                    <Paragraph>For privacy, safety, account, billing, or product questions, please use the relevant Visionary support channel.</Paragraph>
                  </div>
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
                { term: "Visionary", def: "The learning workspace, its features, and the connected services described on this site." },
                { term: "Workspace", def: "The learning environment you use in a browser — it holds the questions, practice, and projects from your sessions." },
                { term: "Content", def: "What you submit, upload, create, or share through Visionary, for which you stay responsible." },
                { term: "Plans", def: "Paid feature sets with the prices, billing periods, renewal terms, refunds, and cancellation rules shown at purchase." },
                { term: "Organization administrator", def: "A person authorized to accept these Terms and manage accounts on behalf of a school, company, or institution." },
                { term: "Service protections", def: "The usage limits, security measures, and safeguards that keep the service reliable and safe for everyone." },
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
                { to: "/cookies", label: "Cookie policy", desc: "Essential cookies only.", Icon: Cookie },
                { to: "/safety", label: "Safety", desc: "Guardrails for every learner.", Icon: ShieldCheck },
                { to: "/accessibility", label: "Accessibility", desc: "Built for every kind of learner.", Icon: Accessibility },
              ].map(({ to, label, desc, Icon }) => (
                <Link key={to} to={to} className="group rounded-[12px] g-card p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
                  <div className="flex items-center gap-3">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} style={{ color: COLORS.navy }} />
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
