import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronRight,
  FileText,
  ShieldCheck,
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

function BulletList({ items }) {
  return (
    <ul className="mt-5 max-w-[760px] space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3 text-[16px] leading-[1.7]" style={{ color: C.graphite }}>
          <span aria-hidden="true" className="mt-[0.72em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: C.blue }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Note({ children }) {
  return (
    <div className="mt-6 rounded-[18px] border px-5 py-5 sm:px-6" style={{ borderColor: C.border, backgroundColor: C.canvas }}>
      <p className="text-[14px] leading-[1.7]" style={{ color: C.graphite }}>{children}</p>
    </div>
  );
}

export default function TermsPage() {
  const [activeId, setActiveId] = useState("who-can-use");
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
            <div className="max-w-[940px]">
              <div className="mb-5 flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em]" style={{ color: C.slate }}>
                <FileText className="h-4 w-4" strokeWidth={1.7} />
                Terms
              </div>
              <h1 className="max-w-[900px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px]" style={{ color: C.ink }}>
                Using Visionary.
                <br />
                <span style={{ color: C.blue }}>Here is what you are agreeing to.</span>
              </h1>
              <p className="mt-8 max-w-[760px] text-[18px] leading-[1.6] tracking-[0.005em] sm:text-[20px]" style={{ color: C.graphite }}>
                These Terms explain the rules that apply when you use Visionary, our website, applications, products, and services.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px]">
                <span style={{ color: C.slate }}>
                  Last updated: <strong style={{ color: C.ink }}>September 2025</strong>
                </span>
                <span className="hidden h-1 w-1 rounded-full sm:block" style={{ backgroundColor: C.mist }} />
                <a href="mailto:legal@visionary.org.in"
                  className="inline-flex items-center gap-1.5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                  style={{ color: C.blue }}>
                  legal@visionary.org.in
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* INTRO */}
        <section className="border-b" style={{ borderColor: C.border }}>
          <div className="mx-auto max-w-[1240px] px-6 py-12 sm:px-8 sm:py-16 lg:px-10">
            <div className="max-w-[860px]">
              <p className="text-[20px] leading-[1.55] tracking-[-0.01em] sm:text-[24px]" style={{ color: C.ink }}>
                These Terms cover your use of Visionary.
                <br className="hidden sm:block" />
                They are written to be understood, not to obscure.
              </p>
              <p className="mt-5 max-w-[720px] text-[16px] leading-[1.75]" style={{ color: C.slate }}>
                By accessing or using Visionary, you agree to these Terms. Please read them together with our Privacy Policy and any additional terms or policies that apply to particular Visionary products or services.
              </p>
              <div className="mt-6">
                <Link to="/privacy" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ color: C.blue }}>
                  Read the Privacy Policy
                  <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                </Link>
              </div>
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

        {/* LEGAL CONTENT */}
        <section>
          <div className="mx-auto max-w-[1240px] px-6 py-12 sm:px-8 lg:px-10 lg:py-20">
            <div className="grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20">
              {/* STICKY CONTENTS */}
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: C.slate }}>Contents</div>
                  <nav aria-label="Terms sections">
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
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: C.blue }} />
                      <p className="text-[13px] leading-[1.6]" style={{ color: C.slate }}>
                        For privacy, safety, and security information, see the Trust & Legal pages.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>

              {/* MAIN LEGAL COPY */}
              <div className="min-w-0">
                <article className="divide-y divide-[#e5e7eb]">
                  {/* 01 */}
                  <section id="who-can-use" className="scroll-mt-24 pb-14 sm:pb-16">
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
                      <><strong style={{ color: C.ink }}>Learn.</strong> Understand ideas, ask questions, practise skills, and continue your learning.</>,
                      <><strong style={{ color: C.ink }}>Teach.</strong> Create learning experiences, support learners, and use information generated by Visionary as part of teaching.</>,
                      <><strong style={{ color: C.ink }}>Create.</strong> Build projects, ideas, documents, or other work using the features available to you.</>,
                      <><strong style={{ color: C.ink }}>Work.</strong> Use Visionary to support professional learning and tasks.</>,
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
                  </section>

                  {/* 08 */}
                  <section id="changes" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="08" title="When Visionary or your access changes" />
                    <Paragraph>Products change. These Terms may need to change with them.</Paragraph>
                    <div className="mt-5"><Paragraph>We may update, suspend, or discontinue parts of Visionary when reasonably necessary, including for product development, security, legal, or operational reasons.</Paragraph></div>
                    <div className="mt-5"><Paragraph>When changes to these Terms are material, we will provide notice where required by applicable law.</Paragraph></div>
                    <div className="mt-5"><Paragraph>The updated Terms will show a new <strong style={{ color: C.ink }}>Last updated</strong> date.</Paragraph></div>
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
                  <section id="contact" className="scroll-mt-24 pt-14 sm:pt-16">
                    <SectionHeading number="12" title="Contact" />
                    <Paragraph>Questions about these Terms? Contact Visionary at:</Paragraph>
                    <div className="mt-6">
                      <a href="mailto:legal@visionary.org.in"
                        className="inline-flex items-center gap-2 text-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                        style={{ color: C.blue }}>
                        legal@visionary.org.in
                        <ArrowUpRight className="h-5 w-5" strokeWidth={1.7} />
                      </a>
                    </div>
                    <div className="mt-5">
                      <Paragraph>For privacy, safety, account, billing, or product questions, please use the relevant Visionary support channel.</Paragraph>
                    </div>
                  </section>
                </article>

                {/* CLOSING */}
                <section className="mt-20 border-t border-[#e5e7eb] pt-14 sm:mt-24 sm:pt-16">
                  <div className="max-w-[860px]">
                    <div className="mb-5 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: C.blue }}>Terms</div>
                    <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] sm:text-[48px]" style={{ color: C.ink }}>
                      Clear rules.
                      <br />
                      <span style={{ color: C.blue }}>Better understanding.</span>
                    </h2>
                    <p className="mt-6 max-w-[720px] text-[17px] leading-[1.7]" style={{ color: C.slate }}>
                      Visionary is built to help people learn, create, and move forward. These Terms explain the responsibilities that make that possible.
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
                      <Link to="/security" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: C.mist, color: C.ink }}>
                        Security
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