import { Link } from "react-router-dom";
import {
  Lock, ShieldCheck, UserRound, Database, AlertCircle, Eye, ArrowUpRight, ChevronRight,
} from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import { LEGAL_META } from "@/data/legalMeta";
import LandingFooter from "@/components/landing/LandingFooter";
import GoogleIllustration from "@/components/landing/sections/GoogleIllustration";
import HighlightCard, { CalloutBar } from "@/components/landing/sections/HighlightCard";

const C = {
  ink: "#202124", surface: "#f8f9fa", blue: "#1a73e8", blueHover: "#1557b0",
  grey: "#5f6368", lightGrey: "#9aa0a6", mist: "#dadce0", white: "#ffffff",
};
const FONT = "'Google Sans Flex', 'Google Sans', system-ui, -apple-system, sans-serif";

function HeroBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute rounded-full blur-3xl" style={{ width: 460, height: 460, right: -100, top: -120, background: "radial-gradient(circle, rgba(26,115,232,0.15) 0%, transparent 70%)" }} />
      <div className="absolute rounded-full blur-3xl" style={{ width: 260, height: 260, right: 180, top: 80, background: "radial-gradient(circle, rgba(52,168,83,0.09) 0%, transparent 70%)" }} />
      <div className="absolute rounded-full blur-3xl" style={{ width: 200, height: 200, right: 60, top: 320, background: "radial-gradient(circle, rgba(251,188,4,0.08) 0%, transparent 70%)" }} />
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

export default function SecurityPage() {
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
                <ShieldCheck className="w-5 h-5" strokeWidth={1.7} style={{ color: C.grey }} />
                <p className="text-[11px] font-medium uppercase tracking-[0.4px]" style={{ color: C.grey }}>Security</p>
              </div>
              <h1 className="text-[clamp(44px,6vw,76px)] font-medium leading-[1.02] tracking-[-0.03em]" style={{ color: C.ink }}>
                What you trust Visionary with,<br /><span style={{ color: C.blue }}>we work to protect.</span>
              </h1>
              <p className="mt-6 text-[17.5px] text-[#5f6368] leading-[1.65] max-w-[700px]">
                Your learning, conversations, ideas, and progress can become part of your journey. Security is what helps keep that information protected as you use Visionary.
              </p>
              <p className="mt-4 text-[13px] text-[#5f6368]">
                Last updated: <strong className="text-[#202124]">{LEGAL_META.security.lastUpdated}</strong>
              </p>
            </div>
          </div>
        </section>

        {/* THREE PRINCIPLES — icon grid */}
        <Section bg="surface">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <HighlightCard Icon={Lock} title="Protect">Build protection into the systems that handle your information.</HighlightCard>
            <HighlightCard Icon={UserRound} title="Control">Keep access limited and make important controls understandable.</HighlightCard>
            <HighlightCard Icon={Eye} title="Explain">Be clear about what we protect, what we can promise, and where details are still being built.</HighlightCard>
          </div>
        </Section>

        {/* YOUR INFORMATION — split */}
        <SplitSection eyebrow="01" id="your-information" heading="Your information" Icon={Database} seed={0}>
          <p className="text-[16px] text-[#5f6368] leading-[1.7]">Security starts with understanding what information moves through a product.</p>
          <p className="mt-4 text-[16px] text-[#5f6368] leading-[1.7]">Depending on how you use Visionary, this can include account details, conversations, learning activity, content you provide, and information needed to operate the service.</p>
        </SplitSection>

        {/* PROTECTED IN TRANSIT — split reversed */}
        <SplitSection eyebrow="02" id="protected-in-transit" heading={<><span>Protected</span><br /><span style={{ color: C.blue }}>as it moves.</span></>} Icon={Lock} seed={1} reverse>
          <p className="text-[16px] text-[#5f6368] leading-[1.7]">Protecting information while it travels is a basic part of operating a modern online service. Visionary should use appropriate transport protections for connections to its services.</p>
          <CalloutBar Icon={ShieldCheck}>Before publication, the exact transport-security technologies used by Visionary should be documented here by the engineering team.</CalloutBar>
        </SplitSection>

        {/* PROTECTED WHEN STORED — split */}
        <SplitSection eyebrow="03" id="protected-when-stored" heading={<><span>Protected</span><br /><span style={{ color: C.blue }}>when stored.</span></>} Icon={Database} seed={2}>
          <p className="text-[16px] text-[#5f6368] leading-[1.7]">Stored information should be protected through appropriate technical and organizational measures, including controls around infrastructure, systems, credentials, and access.</p>
          <p className="mt-4 text-[16px] text-[#5f6368] leading-[1.7]">We design security around reducing the opportunity for unauthorized access and limiting the impact when something goes wrong.</p>
        </SplitSection>

        {/* ACCESS CONTROLLED — icon grid */}
        <Section bg="surface" id="access-controlled">
          <SectionTitle eyebrow="04" id="access-controlled-title">Access<br /><span style={{ color: C.blue }}>is controlled.</span></SectionTitle>
          <p className="text-[16px] text-[#5f6368] leading-[1.7] max-w-[720px] mb-10">
            Visionary should limit access to systems and information according to what a person or service needs to perform its role.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <HighlightCard Icon={UserRound} title="Who can access">Access should be tied to authorized identities rather than shared credentials.</HighlightCard>
            <HighlightCard Icon={Database} title="What they can access">Access should be limited to the systems and information required for the task.</HighlightCard>
          </div>
        </Section>

        {/* YOUR CONTROL — split */}
        <SplitSection eyebrow="05" id="your-control" heading={<><span>Your control</span><br /><span style={{ color: C.blue }}>matters.</span></>} Icon={ShieldCheck} seed={3} reverse>
          <p className="text-[16px] text-[#5f6368] leading-[1.7]">You should be able to understand what happens to your information and use the controls Visionary provides to manage your account and data.</p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-[16px] border border-[#e8eaed] bg-white p-5">
              <Lock className="w-5 h-5 mb-3" strokeWidth={1.7} style={{ color: C.blue }} />
              <h4 className="text-[15px] font-medium text-[#202124] mb-1">Understand your data</h4>
              <p className="text-[13px] text-[#5f6368] leading-[1.6]">See what information is collected and how it is used through the Privacy Policy.</p>
            </div>
            <div className="rounded-[16px] border border-[#e8eaed] bg-white p-5">
              <ShieldCheck className="w-5 h-5 mb-3" strokeWidth={1.7} style={{ color: C.blue }} />
              <h4 className="text-[15px] font-medium text-[#202124] mb-1">Protect your account</h4>
              <p className="text-[13px] text-[#5f6368] leading-[1.6]">Keep your account credentials secure and use the account controls made available.</p>
            </div>
          </div>
        </SplitSection>

        {/* SECURITY IS ONGOING */}
        <Section bg="surface" id="security-over-time">
          <SectionTitle eyebrow="06">Security<br /><span style={{ color: C.blue }}>is ongoing.</span></SectionTitle>
          <p className="text-[16px] text-[#5f6368] leading-[1.7] max-w-[720px]">
            A secure product is never finished. Software changes. New vulnerabilities are discovered. New threats appear. Security therefore requires continuous attention as Visionary's product and infrastructure evolve.
          </p>
        </Section>

        {/* REPORT — centered with illustration */}
        <Section id="report-security">
          <div className="max-w-[700px] mx-auto text-center">
            <GoogleIllustration Icon={AlertCircle} seed={4} size="sm" />
            <h3 className="mt-8 text-[clamp(28px,3.5vw,42px)] font-medium leading-[1.1] tracking-[-0.02em]" style={{ color: C.ink }}>
              When something <span style={{ color: C.blue }}>goes wrong.</span>
            </h3>
            <p className="mt-4 text-[16px] text-[#5f6368] leading-[1.7]">
              If you believe you have discovered a vulnerability, unauthorized access, or another security issue involving Visionary, please report it through our security contact.
            </p>
            <a href="mailto:security@visionary.org.in" className="inline-flex items-center gap-2 mt-6 text-[18px] font-medium hover:underline" style={{ color: C.blue }}>
              security@visionary.org.in <ArrowUpRight className="w-4 h-4" strokeWidth={1.8} />
            </a>
          </div>
        </Section>

        {/* COMMITMENTS — icon grid */}
        <Section bg="surface" id="commitments">
          <SectionTitle eyebrow="08">Our security<br /><span style={{ color: C.blue }}>commitments.</span></SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <HighlightCard Icon={ShieldCheck} title="Protect information">Use appropriate technical and organizational measures to protect information handled by the service.</HighlightCard>
            <HighlightCard Icon={UserRound} title="Limit access">Restrict access to systems and information according to legitimate operational needs.</HighlightCard>
            <HighlightCard Icon={AlertCircle} title="Respond to problems">Investigate reported security concerns and improve the service when weaknesses are found.</HighlightCard>
            <HighlightCard Icon={Eye} title="Be clear about what we know">Avoid making security promises that are not supported by Visionary's actual systems and practices.</HighlightCard>
          </div>
        </Section>

        {/* CTA CLOSING */}
        <section className="relative overflow-hidden px-6 py-32 lg:py-36 bg-[#f8f9fa]">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute rounded-full blur-3xl" style={{ width: 380, height: 380, left: "-6%", top: "-25%", background: "radial-gradient(circle, rgba(26,115,232,0.12) 0%, transparent 70%)" }} />
          </div>
          <div className="relative z-10 max-w-[800px] mx-auto text-center">
            <h2 className="text-[clamp(32px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.03em]" style={{ color: C.ink }}>
              Your knowledge should move forward.<br /><span style={{ color: C.blue }}>Your trust should, too.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-[620px] text-[16.5px] text-[#5f6368] leading-[1.65]">
              Security is part of how Visionary earns the right to carry your learning journey forward.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/privacy" className="inline-flex h-12 items-center rounded-full border border-[#dadce0] bg-white px-7 text-[14px] font-medium text-[#202124] hover:bg-[#f8f9fa] transition-colors">Privacy</Link>
              <Link to="/safety" className="inline-flex h-12 items-center rounded-full border border-[#dadce0] bg-white px-7 text-[14px] font-medium text-[#202124] hover:bg-[#f8f9fa] transition-colors">Safety</Link>
              <Link to="/terms" className="inline-flex h-12 items-center rounded-full border border-[#dadce0] bg-white px-7 text-[14px] font-medium text-[#202124] hover:bg-[#f8f9fa] transition-colors">Terms</Link>
            </div>
          </div>
        </section>

      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}