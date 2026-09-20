import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, ShieldCheck, ChevronDown, ArrowRight, UsersRound, Eye, Lock,
  AlertCircle, BookOpen, Settings2, CreditCard, Gavel, Mail,
} from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import { LEGAL_META } from "@/data/legalMeta";
import LandingFooter from "@/components/landing/LandingFooter";
import GoogleIllustration from "@/components/landing/sections/GoogleIllustration";
import HighlightCard from "@/components/landing/sections/HighlightCard";

const C = {
  ink: "#202124", surface: "#f8f9fa", blue: "#1a73e8",
  grey: "#5f6368", lightGrey: "#9aa0a6", mist: "#dadce0", white: "#ffffff",
};
const FONT = "'Google Sans Flex', 'Google Sans', system-ui, -apple-system, sans-serif";

function HeroBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute rounded-full blur-3xl" style={{ width: 460, height: 460, right: -100, top: -120, background: "radial-gradient(circle, rgba(26,115,232,0.15) 0%, transparent 70%)" }} />
      <div className="absolute rounded-full blur-3xl" style={{ width: 240, height: 240, right: 200, top: 100, background: "radial-gradient(circle, rgba(234,67,53,0.08) 0%, transparent 70%)" }} />
      <div className="absolute rounded-full blur-3xl" style={{ width: 200, height: 200, right: 60, top: 300, background: "radial-gradient(circle, rgba(251,188,4,0.08) 0%, transparent 70%)" }} />
    </div>
  );
}

function Section({ id, children, bg = "white" }) {
  return (
    <section id={id} className={`scroll-mt-24 px-6 py-28 lg:py-36 ${bg === "surface" ? "bg-[#f8f9fa]" : "bg-white"}`}>
      <div className="max-w-[1200px] mx-auto">{children}</div>
    </section>
  );
}

function SectionTitle({ eyebrow, id, children }) {
  return (
    <div className="mb-12 lg:mb-16">
      {eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.4px] mb-4" style={{ color: C.grey }}>{eyebrow}</p>}
      <h2 id={id} className="text-[clamp(30px,4vw,48px)] font-medium leading-[1.08] tracking-[-0.025em]" style={{ color: C.ink }}>{children}</h2>
    </div>
  );
}

function SplitSection({ eyebrow, id, heading, children, Icon, seed = 0, reverse = false }) {
  return (
    <Section id={id}>
      <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reverse ? "lg:[direction:rtl]" : ""}`}>
        <div className="[direction:ltr]">
          <SectionTitle eyebrow={eyebrow}>{heading}</SectionTitle>
          {children}
        </div>
        <div className="[direction:ltr]"><GoogleIllustration Icon={Icon} seed={seed} /></div>
      </div>
    </Section>
  );
}

function BulletList({ items }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] text-[#5f6368] leading-[1.7]">
          <span className="mt-[0.7em] w-1.5 h-1.5 shrink-0 rounded-full" style={{ backgroundColor: C.blue }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="mt-6 space-y-3">
      {items.map((item, idx) => {
        const isOpen = open === idx;
        return (
          <div key={idx} className="rounded-2xl border border-[#e8eaed] overflow-hidden hover:shadow-[0_2px_8px_rgba(60,64,67,0.05)] transition-shadow">
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : idx)}
              className="w-full flex items-center justify-between gap-6 px-6 py-5 text-left hover:bg-[#f8f9fa] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
              <span className="text-[15px] font-medium text-[#202124] leading-[1.4]">{item.q}</span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all"
                style={{ backgroundColor: isOpen ? C.blue : "#f8f9fa", color: isOpen ? "#fff" : C.grey, transform: isOpen ? "rotate(180deg)" : "" }}>
                <ChevronDown className="w-4 h-4" strokeWidth={2} />
              </span>
            </button>
            <div className="grid transition-all duration-300" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}>
              <div className="overflow-hidden"><p className="px-6 pb-6 text-[14.5px] text-[#5f6368] leading-[1.7]">{item.a}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}>
      <LandingNav />
      <main id="main">

        {/* HERO */}
        <section className="relative overflow-hidden px-6 pb-20 pt-36 lg:pt-44 lg:pb-28">
          <HeroBlobs />
          <div className="relative z-10 max-w-[1200px] mx-auto">
            <div className="max-w-[800px]">
              <div className="flex items-center gap-2 mb-5">
                <FileText className="w-5 h-5" strokeWidth={1.7} style={{ color: C.grey }} />
                <p className="text-[11px] font-medium uppercase tracking-[0.4px]" style={{ color: C.grey }}>Terms</p>
              </div>
              <h1 className="text-[clamp(44px,6vw,76px)] font-medium leading-[1.02] tracking-[-0.03em]" style={{ color: C.ink }}>
                Using Visionary.<br /><span style={{ color: C.blue }}>Here is what you are agreeing to.</span>
              </h1>
              <p className="mt-6 text-[17.5px] text-[#5f6368] leading-[1.65] max-w-[700px]">
                These Terms explain the rules that apply when you use Visionary, our website, applications, products, and services.
              </p>
              <p className="mt-4 text-[13px] text-[#5f6368]">
                Last updated: <strong className="text-[#202124]">{LEGAL_META.terms.lastUpdated}</strong>
              </p>
            </div>
          </div>
        </section>

        {/* QUICK OVERVIEW — icon grid */}
        <Section bg="surface">
          <SectionTitle eyebrow="Overview">These Terms cover your use of Visionary.<br /><span style={{ color: C.blue }}>Written to be understood.</span></SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <HighlightCard Icon={UsersRound} title="Who can use it">Anyone legally permitted to enter into these Terms.</HighlightCard>
            <HighlightCard Icon={Eye} title="What you can do">Learn, teach, create, and work with Visionary.</HighlightCard>
            <HighlightCard Icon={Lock} title="What you cannot do">Harm others, break laws, or misuse the service.</HighlightCard>
            <HighlightCard Icon={ShieldCheck} title="What we provide">Technology to support learning and connected progress.</HighlightCard>
            <HighlightCard Icon={Settings2} title="Your account">Keep it accurate, keep it secure.</HighlightCard>
            <HighlightCard Icon={CreditCard} title="Plans & payments">Pricing on the Pricing page. Cancel anytime.</HighlightCard>
          </div>
        </Section>

        {/* WHO CAN USE — split */}
        <SplitSection eyebrow="01" id="who-can-use" heading="Who can use Visionary" Icon={UsersRound} seed={0}>
          <p className="text-[16px] text-[#5f6368] leading-[1.7]">You may use Visionary only if you are legally permitted to enter into these Terms.</p>
          <p className="mt-4 text-[16px] text-[#5f6368] leading-[1.7]">For younger learners, use of Visionary may require involvement or permission from a parent or legal guardian, depending on the learner's age and the applicable law.</p>
        </SplitSection>

        {/* WHAT YOU CAN DO — split reversed */}
        <SplitSection eyebrow="02" id="what-you-can-do" heading={<><span>What you</span><br /><span style={{ color: C.blue }}>can do.</span></>} Icon={BookOpen} seed={1} reverse>
          <p className="text-[16px] text-[#5f6368] leading-[1.7] mb-4">Use Visionary to support learning, teaching, practice, creation, and work.</p>
          <BulletList items={[
            "Learn — understand ideas, ask questions, practise skills, and continue.",
            "Teach — create learning experiences and support learners.",
            "Create — build projects, ideas, documents, or other work.",
            "Work — use Visionary to support professional learning and tasks.",
          ]} />
        </SplitSection>

        {/* WHAT YOU CANNOT DO — icon grid */}
        <Section bg="surface" id="what-you-cannot-do">
          <SectionTitle eyebrow="03">What you<br /><span style={{ color: C.blue }}>cannot do.</span></SectionTitle>
          <p className="text-[16px] text-[#5f6368] leading-[1.7] max-w-[720px] mb-10">Keep Visionary useful and safe for everyone.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <HighlightCard Icon={AlertCircle} title="Don't harm others">No threatening, harassing, exploiting, or deceiving another person.</HighlightCard>
            <HighlightCard Icon={Lock} title="Don't break security">No unauthorized access, reverse engineering, or bypassing protections.</HighlightCard>
            <HighlightCard Icon={ShieldCheck} title="Respect rights">No infringing intellectual-property, privacy, or other legal rights.</HighlightCard>
            <HighlightCard Icon={Eye} title="No misuse">No malicious software, spam, or circumventing usage limits.</HighlightCard>
          </div>
        </Section>

        {/* WHAT WE PROVIDE — split */}
        <SplitSection eyebrow="04" id="what-we-provide" heading={<><span>What we</span><br /><span style={{ color: C.blue }}>provide.</span></>} Icon={ShieldCheck} seed={2}>
          <p className="text-[16px] text-[#5f6368] leading-[1.7]">Visionary provides technology designed to support learning, teaching, practice, creation, and connected progress.</p>
          <p className="mt-4 text-[16px] text-[#5f6368] leading-[1.7]">Features may change over time. We may add, improve, remove, or limit features as the product develops.</p>
          <p className="mt-4 text-[15px] text-[#5f6368] leading-[1.7] rounded-[14px] px-5 py-4" style={{ backgroundColor: `${C.blue}08` }}>
            For decisions that require professional judgment, you should rely on an appropriately qualified professional.
          </p>
        </SplitSection>

        {/* YOUR ACCOUNT — split reversed */}
        <SplitSection eyebrow="06" id="your-account" heading={<><span>Your</span><br /><span style={{ color: C.blue }}>account.</span></>} Icon={Settings2} seed={3} reverse>
          <p className="text-[16px] text-[#5f6368] leading-[1.7] mb-4">Keep your account information accurate and take reasonable steps to protect your account.</p>
          <BulletList items={[
            "Provide accurate information when creating your account.",
            "Keep your login information secure.",
            "Take responsibility for activity that occurs through your account.",
            "Tell us when you believe your account has been compromised.",
          ]} />
        </SplitSection>

        {/* PLANS & PAYMENTS — split */}
        <SplitSection eyebrow="07" id="plans-payments" heading={<><span>Plans, payments,</span><br /><span style={{ color: C.blue }}>and cancellation.</span></>} Icon={CreditCard} seed={4}>
          <p className="text-[16px] text-[#5f6368] leading-[1.7]">Some Visionary features or services may require payment. Prices, billing periods, available features, renewal terms, refunds, and cancellation rules are described on the Pricing page or at the time of purchase.</p>
        </SplitSection>

        {/* CHANGES & RESTRICTION — icon grid */}
        <Section bg="surface" id="changes">
          <SectionTitle eyebrow="08-09">When things<br /><span style={{ color: C.blue }}>change.</span></SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <HighlightCard Icon={Settings2} title="Product changes">We may update, suspend, or discontinue parts of Visionary when reasonably necessary. When changes are material, we provide notice.</HighlightCard>
            <HighlightCard Icon={AlertCircle} title="Access may be restricted">We may restrict, suspend, or terminate access when necessary to protect users, Visionary, or the integrity of the service.</HighlightCard>
          </div>
        </Section>

        {/* DISCLAIMERS — split */}
        <SplitSection eyebrow="10" id="responsibility" heading={<><span>Disclaimers and</span><br /><span style={{ color: C.blue }}>responsibility.</span></>} Icon={Gavel} seed={5} reverse>
          <p className="text-[16px] text-[#5f6368] leading-[1.7]">We do not promise that the service will always be uninterrupted, error-free, completely accurate, or available in every circumstance.</p>
          <p className="mt-4 text-[16px] text-[#5f6368] leading-[1.7]">You remain responsible for reviewing important information before relying on it, particularly where an incorrect result could materially affect a person or organization.</p>
        </SplitSection>

        {/* CONTACT — centered */}
        <Section bg="surface" id="contact">
          <div className="max-w-[700px] mx-auto text-center">
            <GoogleIllustration Icon={Mail} seed={6} size="sm" />
            <h3 className="mt-8 text-[clamp(28px,3.5vw,42px)] font-medium leading-[1.1] tracking-[-0.02em]" style={{ color: C.ink }}>
              Questions about <span style={{ color: C.blue }}>these Terms?</span>
            </h3>
            <a href="mailto:legal@visionary.org.in" className="inline-flex items-center gap-2 mt-6 text-[18px] font-medium hover:underline" style={{ color: C.blue }}>
              legal@visionary.org.in <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
            </a>
          </div>
        </Section>

        {/* CTA CLOSING */}
        <section className="relative overflow-hidden px-6 py-32 lg:py-36 bg-[#f8f9fa]">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute rounded-full blur-3xl" style={{ width: 380, height: 380, left: "-6%", top: "-25%", background: "radial-gradient(circle, rgba(26,115,232,0.12) 0%, transparent 70%)" }} />
          </div>
          <div className="relative z-10 max-w-[800px] mx-auto text-center">
            <h2 className="text-[clamp(32px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.03em]" style={{ color: C.ink }}>
              Clear rules.<br /><span style={{ color: C.blue }}>Better understanding.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-[620px] text-[16.5px] text-[#5f6368] leading-[1.65]">
              Visionary is built to help people learn, create, and move forward. These Terms explain the responsibilities that make that possible.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/privacy" className="inline-flex h-12 items-center rounded-full border border-[#dadce0] bg-white px-7 text-[14px] font-medium text-[#202124] hover:bg-[#f8f9fa] transition-colors">Privacy</Link>
              <Link to="/safety" className="inline-flex h-12 items-center rounded-full border border-[#dadce0] bg-white px-7 text-[14px] font-medium text-[#202124] hover:bg-[#f8f9fa] transition-colors">Safety</Link>
              <Link to="/security" className="inline-flex h-12 items-center rounded-full border border-[#dadce0] bg-white px-7 text-[14px] font-medium text-[#202124] hover:bg-[#f8f9fa] transition-colors">Security</Link>
            </div>
          </div>
        </section>

      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}