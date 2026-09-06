import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronRight,
  Lock,
  ShieldCheck,
  UserRound,
  Database,
  AlertCircle,
  Eye,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const FONT = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const C = {
  ink: "#121317",
  graphite: "#3c4043",
  slate: "#5f6368",
  mist: "#dadce0",
  border: "#e5e7eb",
  canvas: "#f8f9fa",
  blue: "#4285F4",
  white: "#ffffff",
};

const SECTIONS = [
  { id: "your-information", number: "01", title: "Your information", summary: "Understand the kinds of information that may move through Visionary." },
  { id: "protected-in-transit", number: "02", title: "Protected as it moves", summary: "How information is protected while it travels between you and Visionary." },
  { id: "protected-when-stored", number: "03", title: "Protected when stored", summary: "How stored information should be protected across Visionary systems." },
  { id: "access-controlled", number: "04", title: "Access is controlled", summary: "Access should be limited to the people and systems that need it." },
  { id: "your-control", number: "05", title: "Your control matters", summary: "Security works together with privacy, account controls, and data choices." },
  { id: "security-over-time", number: "06", title: "Security is ongoing", summary: "Security is a continuous process, not a one-time feature." },
  { id: "report-security", number: "07", title: "When something goes wrong", summary: "How to tell Visionary about a security concern." },
  { id: "commitments", number: "08", title: "Our security commitments", summary: "The principles Visionary follows when protecting the service." },
  { id: "contact", number: "09", title: "Contact", summary: "How to contact Visionary about security." },
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
      <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: C.blue }}>{number}</div>
      <h2 className="text-[30px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[36px]" style={{ color: C.ink }}>{title}</h2>
    </div>
  );
}

function Paragraph({ children }) {
  return (
    <p className="max-w-[760px] text-[16px] leading-[1.78] tracking-[0.005em]" style={{ color: C.graphite }}>{children}</p>
  );
}

function SecurityCard({ icon: Icon, eyebrow, title, children }) {
  return (
    <div className="rounded-[22px] border p-6 sm:p-7" style={{ borderColor: C.border, backgroundColor: C.white }}>
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: C.canvas }}>
          <Icon className="h-[19px] w-[19px]" strokeWidth={1.65} style={{ color: C.blue }} />
        </div>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: C.slate }}>{eyebrow}</div>
          <h3 className="mt-1.5 text-[19px] font-normal leading-[1.3]" style={{ color: C.ink }}>{title}</h3>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Note({ children }) {
  return (
    <div className="mt-6 rounded-[18px] border px-5 py-5 sm:px-6" style={{ borderColor: C.border, backgroundColor: C.canvas }}>
      <p className="text-[14px] leading-[1.7]" style={{ color: C.graphite }}>{children}</p>
    </div>
  );
}

export default function SecurityPage() {
  const [activeId, setActiveId] = useState("your-information");
  const [showMobileContents, setShowMobileContents] = useState(false);

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

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}>
      <LandingNav />
      <main id="main">
        {/* HERO */}
        <section className="border-b pt-28 sm:pt-32" style={{ borderColor: C.border }}>
          <div className="mx-auto max-w-[1240px] px-6 pb-16 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
            <div className="max-w-[960px]">
              <div className="mb-5 flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em]" style={{ color: C.slate }}>
                <ShieldCheck className="h-4 w-4" strokeWidth={1.7} />
                Security
              </div>
              <h1 className="max-w-[930px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px]" style={{ color: C.ink }}>
                What you trust Visionary with,
                <br />
                <span style={{ color: C.blue }}>we work to protect.</span>
              </h1>
              <p className="mt-8 max-w-[780px] text-[18px] leading-[1.6] tracking-[0.005em] sm:text-[20px]" style={{ color: C.graphite }}>
                Your learning, conversations, ideas, and progress can become part of your journey. Security is what helps keep that information protected as you use Visionary.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px]">
                <span style={{ color: C.slate }}>Security information</span>
                <span className="hidden h-1 w-1 rounded-full sm:block" style={{ backgroundColor: C.mist }} />
                <Link to="/privacy" className="inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ color: C.blue }}>
                  Read Privacy
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* INTRO / THREE PRINCIPLES */}
        <section className="border-b" style={{ borderColor: C.border, backgroundColor: C.canvas }}>
          <div className="mx-auto max-w-[1240px] px-6 py-14 sm:px-8 sm:py-18 lg:px-10 lg:py-20">
            <div className="grid gap-6 md:grid-cols-3">
              <SecurityCard icon={Lock} eyebrow="01" title="Protect">
                <p className="text-[14px] leading-[1.7]" style={{ color: C.slate }}>Build protection into the systems that handle your information.</p>
              </SecurityCard>
              <SecurityCard icon={UserRound} eyebrow="02" title="Control">
                <p className="text-[14px] leading-[1.7]" style={{ color: C.slate }}>Keep access limited and make important controls understandable.</p>
              </SecurityCard>
              <SecurityCard icon={Eye} eyebrow="03" title="Explain">
                <p className="text-[14px] leading-[1.7]" style={{ color: C.slate }}>Be clear about what we protect, what we can promise, and where details are still being built.</p>
              </SecurityCard>
            </div>
          </div>
        </section>

        {/* MOBILE CONTENTS */}
        <section className="border-b lg:hidden" style={{ borderColor: C.border }}>
          <div className="mx-auto max-w-[1240px] px-6 sm:px-8">
            <button type="button" onClick={() => setShowMobileContents((value) => !value)} aria-expanded={showMobileContents}
              className="flex w-full items-center justify-between py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
              <span>
                <span className="block text-[12px] uppercase tracking-[0.12em]" style={{ color: C.slate }}>Contents</span>
                <span className="mt-1 block text-[15px]" style={{ color: C.ink }}>{activeSection?.title}</span>
              </span>
              <ChevronRight className={`h-5 w-5 transition-transform duration-200 ${showMobileContents ? "rotate-90" : ""}`} strokeWidth={1.7} style={{ color: C.slate }} />
            </button>
            {showMobileContents && (
              <div className="pb-5">
                <div className="overflow-hidden rounded-[18px] border" style={{ borderColor: C.border }}>
                  {SECTIONS.map((section) => {
                    const active = activeId === section.id;
                    return (
                      <button key={section.id} type="button"
                        onClick={() => { scrollToSection(section.id); setActiveId(section.id); setShowMobileContents(false); }}
                        className="flex w-full items-start gap-4 border-b px-4 py-4 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-inset"
                        style={{ borderColor: C.border, backgroundColor: active ? C.canvas : C.white }}>
                        <span className="mt-0.5 text-[12px] font-medium" style={{ color: active ? C.blue : C.slate }}>{section.number}</span>
                        <span className="text-[14px] leading-[1.45]" style={{ color: active ? C.ink : C.graphite }}>{section.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECURITY CONTENT */}
        <section>
          <div className="mx-auto max-w-[1240px] px-6 py-12 sm:px-8 lg:px-10 lg:py-20">
            <div className="grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20">
              {/* STICKY CONTENTS */}
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: C.slate }}>Contents</div>
                  <nav aria-label="Security sections">
                    <div className="space-y-1">
                      {SECTIONS.map((section) => {
                        const active = activeId === section.id;
                        return (
                          <button key={section.id} type="button" onClick={() => scrollToSection(section.id)}
                            className="group flex w-full items-start gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ backgroundColor: active ? C.canvas : "transparent" }}>
                            <span className="mt-0.5 w-6 shrink-0 text-[11px] font-medium" style={{ color: active ? C.blue : C.slate }}>{section.number}</span>
                            <span className="text-[13px] leading-[1.45]" style={{ color: active ? C.ink : C.graphite }}>{section.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </nav>
                  <div className="mt-8 border-t pt-6" style={{ borderColor: C.border }}>
                    <p className="text-[13px] leading-[1.6]" style={{ color: C.slate }}>
                      Security and privacy work together. For information about personal data and your rights, see Privacy.
                    </p>
                    <Link to="/privacy" className="mt-3 inline-flex items-center gap-1.5 text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: C.blue }}>
                      Privacy Policy
                      <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </Link>
                  </div>
                </div>
              </aside>

              {/* MAIN CONTENT */}
              <div className="min-w-0">
                <article className="divide-y divide-[#e5e7eb]">
                  {/* 01 */}
                  <section id="your-information" className="scroll-mt-24 pb-14 sm:pb-16">
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
                    <div className="mt-5"><Paragraph>Protecting information while it travels is a basic part of operating a modern online service. Visionary should use appropriate transport protections for connections to its services.</Paragraph></div>
                    <Note>Before publication, the exact transport-security technologies used by Visionary should be documented here by the engineering team.</Note>
                  </section>

                  {/* 03 */}
                  <section id="protected-when-stored" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="03" title="Protected when stored" />
                    <Paragraph>Information that needs to remain available to operate Visionary may be stored in our systems.</Paragraph>
                    <div className="mt-5"><Paragraph>Stored information should be protected through appropriate technical and organizational measures, including controls around infrastructure, systems, credentials, and access.</Paragraph></div>
                    <div className="mt-5"><Paragraph>We design security around reducing the opportunity for unauthorized access and limiting the impact when something goes wrong.</Paragraph></div>
                    <Note>Specific storage locations, encryption methods, backup architecture, and retention mechanisms should be published here only after they are confirmed in Visionary's production infrastructure.</Note>
                  </section>

                  {/* 04 */}
                  <section id="access-controlled" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="04" title="Access is controlled" />
                    <Paragraph>Not everyone who works on a system should have access to everything inside it.</Paragraph>
                    <div className="mt-5"><Paragraph>Visionary should limit access to systems and information according to what a person or service needs to perform its role.</Paragraph></div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <SecurityCard icon={UserRound} eyebrow="Identity" title="Who can access">
                        <p className="text-[14px] leading-[1.7]" style={{ color: C.slate }}>Access should be tied to authorized identities rather than shared credentials.</p>
                      </SecurityCard>
                      <SecurityCard icon={Database} eyebrow="Scope" title="What they can access">
                        <p className="text-[14px] leading-[1.7]" style={{ color: C.slate }}>Access should be limited to the systems and information required for the task.</p>
                      </SecurityCard>
                    </div>
                    <Note>The exact identity, role, administrator, and access controls should reflect the systems Visionary actually operates.</Note>
                  </section>

                  {/* 05 */}
                  <section id="your-control" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="05" title="Your control matters" />
                    <Paragraph>Security is not separate from privacy or account control.</Paragraph>
                    <div className="mt-5"><Paragraph>You should be able to understand what happens to your information and use the controls Visionary provides to manage your account and data.</Paragraph></div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <SecurityCard icon={Lock} eyebrow="Privacy" title="Understand your data">
                        <p className="text-[14px] leading-[1.7]" style={{ color: C.slate }}>See what information is collected and how it is used through the Privacy Policy.</p>
                      </SecurityCard>
                      <SecurityCard icon={ShieldCheck} eyebrow="Account" title="Protect your account">
                        <p className="text-[14px] leading-[1.7]" style={{ color: C.slate }}>Keep your account credentials secure and use the account controls made available by Visionary.</p>
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
                        className="inline-flex items-center gap-2 text-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                        style={{ color: C.blue }}>
                        security@visionary.org.in
                        <ArrowUpRight className="h-5 w-5" strokeWidth={1.7} />
                      </a>
                    </div>
                    <Note>This address should be activated and monitored by Visionary before this page goes live.</Note>
                  </section>

                  {/* 08 */}
                  <section id="commitments" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="08" title="Our security commitments" />
                    <div className="space-y-4">
                      <div className="rounded-[18px] border p-5 sm:p-6" style={{ borderColor: C.border }}>
                        <div className="flex gap-4">
                          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: C.blue }} />
                          <div>
                            <h3 className="text-[17px] font-normal" style={{ color: C.ink }}>Protect information</h3>
                            <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: C.slate }}>Use appropriate technical and organizational measures to protect information handled by the service.</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-[18px] border p-5 sm:p-6" style={{ borderColor: C.border }}>
                        <div className="flex gap-4">
                          <UserRound className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: C.blue }} />
                          <div>
                            <h3 className="text-[17px] font-normal" style={{ color: C.ink }}>Limit access</h3>
                            <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: C.slate }}>Restrict access to systems and information according to legitimate operational needs.</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-[18px] border p-5 sm:p-6" style={{ borderColor: C.border }}>
                        <div className="flex gap-4">
                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: C.blue }} />
                          <div>
                            <h3 className="text-[17px] font-normal" style={{ color: C.ink }}>Respond to problems</h3>
                            <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: C.slate }}>Investigate reported security concerns and improve the service when weaknesses are found.</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-[18px] border p-5 sm:p-6" style={{ borderColor: C.border }}>
                        <div className="flex gap-4">
                          <Eye className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: C.blue }} />
                          <div>
                            <h3 className="text-[17px] font-normal" style={{ color: C.ink }}>Be clear about what we know</h3>
                            <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: C.slate }}>Avoid making security promises that are not supported by Visionary's actual systems and practices.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 09 */}
                  <section id="contact" className="scroll-mt-24 pt-14 sm:pt-16">
                    <SectionHeading number="09" title="Contact" />
                    <Paragraph>Security questions, vulnerability reports, and security concerns can be sent to:</Paragraph>
                    <div className="mt-6">
                      <a href="mailto:security@visionary.org.in"
                        className="inline-flex items-center gap-2 text-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                        style={{ color: C.blue }}>
                        security@visionary.org.in
                        <ArrowUpRight className="h-5 w-5" strokeWidth={1.7} />
                      </a>
                    </div>
                    <div className="mt-6">
                      <Link to="/help" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: C.blue }}>
                        Visit Help
                        <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                      </Link>
                    </div>
                  </section>
                </article>

                {/* CLOSING */}
                <section className="mt-20 border-t border-[#e5e7eb] pt-14 sm:mt-24 sm:pt-16">
                  <div className="max-w-[860px]">
                    <div className="mb-5 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: C.blue }}>Security</div>
                    <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] sm:text-[48px]" style={{ color: C.ink }}>
                      Your knowledge should move forward.
                      <br />
                      <span style={{ color: C.blue }}>Your trust should, too.</span>
                    </h2>
                    <p className="mt-6 max-w-[720px] text-[17px] leading-[1.7]" style={{ color: C.slate }}>
                      Security is part of how Visionary earns the right to carry your learning journey forward.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <Link to="/privacy" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: C.mist, color: C.ink }}>
                        Privacy
                      </Link>
                      <Link to="/safety" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: C.mist, color: C.ink }}>
                        Safety
                      </Link>
                      <Link to="/terms" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: C.mist, color: C.ink }}>
                        Terms
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