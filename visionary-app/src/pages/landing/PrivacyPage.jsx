import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LockKeyhole, Eye, UserRound, Database, Download, Trash2,
  ShieldCheck, Share2, Settings2, Mail, ChevronDown, ArrowRight,
} from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import { LEGAL_META, GRIEVANCE_OFFICER, RESPONSE_TIMES } from "@/data/legalMeta";
import LandingFooter from "@/components/landing/LandingFooter";
import GoogleIllustration from "@/components/landing/sections/GoogleIllustration";
import HighlightCard, { DataRow, CalloutBar } from "@/components/landing/sections/HighlightCard";

/* ═══ Design tokens — Google unified system ═══ */
const C = {
  ink: "#202124", surface: "#f8f9fa", blue: "#1a73e8", blueHover: "#1557b0",
  grey: "#5f6368", lightGrey: "#9aa0a6", mist: "#dadce0", white: "#ffffff",
};
const FONT = "'Google Sans Flex', 'Google Sans', system-ui, -apple-system, sans-serif";

/* ─── Hero blobs ─── */
function HeroBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute rounded-full blur-3xl" style={{ width: 500, height: 500, right: -120, top: -140, background: "radial-gradient(circle, rgba(26,115,232,0.16) 0%, transparent 70%)" }} />
      <div className="absolute rounded-full blur-3xl" style={{ width: 280, height: 280, right: 200, top: 100, background: "radial-gradient(circle, rgba(234,67,53,0.08) 0%, transparent 70%)" }} />
      <div className="absolute rounded-full blur-3xl" style={{ width: 240, height: 240, right: 60, top: 340, background: "radial-gradient(circle, rgba(251,188,4,0.08) 0%, transparent 70%)" }} />
    </div>
  );
}

/* ─── Section wrapper with Google padding ─── */
function Section({ id, children, bg = "white", className = "" }) {
  const bgMap = { white: "bg-white", surface: "bg-[#f8f9fa]" };
  return (
    <section id={id} className={`scroll-mt-24 px-6 py-28 lg:py-36 ${bgMap[bg]} ${className}`}>
      <div className="max-w-[1200px] mx-auto">{children}</div>
    </section>
  );
}

/* ─── Section eyebrow + heading (Google style) ─── */
function SectionTitle({ eyebrow, id, children }) {
  return (
    <div className="mb-12 lg:mb-16">
      {eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.4px] mb-4" style={{ color: C.grey }}>{eyebrow}</p>}
      <h2 id={id} className="text-[clamp(30px,4vw,48px)] font-medium leading-[1.08] tracking-[-0.025em]" style={{ color: C.ink }}>{children}</h2>
    </div>
  );
}

/* ─── Two-column layout (text + illustration) ─── */
function SplitSection({ eyebrow, id, heading, children, Icon, illustrationSeed = 0, reverse = false }) {
  return (
    <Section id={id} bg="white">
      <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reverse ? "lg:[direction:rtl]" : ""}`}>
        <div className="[direction:ltr]">
          <SectionTitle eyebrow={eyebrow}>{heading}</SectionTitle>
          <div className="space-y-4">{children}</div>
        </div>
        <div className="[direction:ltr]">
          <GoogleIllustration Icon={Icon} seed={illustrationSeed} />
        </div>
      </div>
    </Section>
  );
}

/* ─── FAQ accordion ─── */
function FAQ({ faqs }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="mt-6 space-y-3">
      {faqs.map((item, idx) => {
        const isOpen = open === idx;
        return (
          <div key={idx} className="rounded-2xl border border-[#e8eaed] overflow-hidden hover:shadow-[0_2px_8px_rgba(60,64,67,0.05)] transition-shadow">
            <button
              type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : idx)}
              className="w-full flex items-center justify-between gap-6 px-6 py-5 text-left hover:bg-[#f8f9fa] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
            >
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

/* ═══════════════════════════════════════════════════════════════════
 * PAGE — Privacy designed as Google would build it
 * ═══════════════════════════════════════════════════════════════════ */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}>
      <LandingNav />
      <main id="main">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pb-20 pt-36 lg:pt-44 lg:pb-28">
          <HeroBlobs />
          <div className="relative z-10 max-w-[1200px] mx-auto text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.4px] mb-5" style={{ color: C.grey }}>Privacy</p>
            <h1 className="text-[clamp(44px,6vw,80px)] font-medium leading-[1.02] tracking-[-0.03em]" style={{ color: C.ink }}>
              Your information.<br /><span style={{ color: C.blue }}>Your control.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-[700px] text-[17.5px] text-[#5f6368] leading-[1.65]">
              Your learning is personal. This page explains what Visionary handles, why we use it, and the choices you have.
            </p>
            <p className="mt-5 text-[13px] text-[#5f6368]">
              Last updated: <strong className="text-[#202124]">{LEGAL_META.privacy.lastUpdated}</strong>
            </p>
          </div>
        </section>

        {/* ── AT A GLANCE — visual icon grid (Google pattern) ───────────── */}
        <Section bg="surface">
          <SectionTitle eyebrow="At a glance">We collect what we need<br /><span style={{ color: C.blue }}>to provide Visionary.</span></SectionTitle>
          <p className="text-[16px] text-[#5f6368] leading-[1.7] max-w-[720px] mb-10">
            The information Visionary handles depends on what you do with the product. An account needs account information. Learning features need the context you provide.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <HighlightCard Icon={UserRound} title="Your account">Name, email, role, and account settings.</HighlightCard>
            <HighlightCard Icon={Database} title="Your learning">Questions, sessions, progress, projects, and other content you provide.</HighlightCard>
            <HighlightCard Icon={Settings2} title="Your device">Information needed to keep the product working on the device you use.</HighlightCard>
            <HighlightCard Icon={Eye} title="Your choices">Settings and permissions that affect how your information is used.</HighlightCard>
          </div>
        </Section>

        {/* ── WHY WE USE IT — icon grid (Google "Purpose" pattern) ──────── */}
        <Section>
          <SectionTitle eyebrow="Why we use it" id="purpose">Information should have<br /><span style={{ color: C.blue }}>a clear purpose.</span></SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <HighlightCard Icon={ShieldCheck} title="Provide Visionary">Use the information needed to provide the features and experiences you choose to use.</HighlightCard>
            <HighlightCard Icon={Eye} title="Keep your learning connected">Use relevant context so your experience can continue from what came before.</HighlightCard>
            <HighlightCard Icon={Settings2} title="Maintain and improve">Use appropriate information to fix problems, understand how the product is working, and improve it.</HighlightCard>
            <HighlightCard Icon={ShieldCheck} title="Protect people">Use information where necessary to help prevent abuse, fraud, security problems, and technical issues.</HighlightCard>
            <HighlightCard Icon={Mail} title="Communicate with you">Use your contact information to respond to requests, account notices, and important service updates.</HighlightCard>
          </div>
        </Section>

        {/* ── SHARING — two-column with illustration ────────────────────── */}
        <SplitSection eyebrow="Sharing" id="sharing" heading={<><span>Your information shouldn't travel</span><br /><span style={{ color: C.blue }}>without a reason.</span></>} Icon={Share2} illustrationSeed={1}>
          <p className="text-[16px] text-[#5f6368] leading-[1.7]">
            Visionary may need to work with service providers that help operate the product. Where information is shared, the purpose, scope, and applicable controls should be described clearly.
          </p>
          <div className="mt-6 rounded-[20px] border border-[#e8eaed] bg-white p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.4px] mb-4" style={{ color: C.grey }}>Who can see what</p>
            <DataRow label="Student" value="Their own learning" />
            <DataRow label="Teacher" value="Class information they are allowed to see" />
            <DataRow label="Parent" value="Relevant information shared through the product" />
            <DataRow label="Professional" value="Their own work and learning" />
            <DataRow label="Organization" value="Information permitted by organization controls" />
          </div>
        </SplitSection>

        {/* ── YOUR CONTROLS — action cards (Google settings pattern) ────── */}
        <Section bg="surface" id="your-controls">
          <SectionTitle eyebrow="Your controls">Know what you can do<br /><span style={{ color: C.blue }}>with your information.</span></SectionTitle>
          <p className="text-[16px] text-[#5f6368] leading-[1.7] max-w-[680px] mb-10">
            Privacy is easier to trust when the choices are easy to find. Visionary should give you clear ways to manage your account and the information connected to it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <HighlightCard Icon={Eye} title="View">See the information connected to your account.</HighlightCard>
            <HighlightCard Icon={Settings2} title="Manage">Update settings and permissions where available.</HighlightCard>
            <HighlightCard Icon={Download} title="Export">Download supported account information where available.</HighlightCard>
            <HighlightCard Icon={Trash2} title="Delete">Request account deletion and see what happens next.</HighlightCard>
          </div>
        </Section>

        {/* ── SECURITY — centered band ─────────────────────────────────── */}
        <Section bg="white" id="security">
          <div className="max-w-[700px] mx-auto text-center">
            <GoogleIllustration Icon={LockKeyhole} seed={2} size="sm" />
            <h3 className="mt-8 text-[clamp(28px,3.5vw,42px)] font-medium leading-[1.1] tracking-[-0.02em]" style={{ color: C.ink }}>
              Privacy needs <span style={{ color: C.blue }}>security behind it.</span>
            </h3>
            <p className="mt-4 text-[16px] text-[#5f6368] leading-[1.7]">
              Visionary uses technical and organizational measures to protect information against unauthorized access, loss, misuse, or disclosure.
            </p>
            <Link to="/security" className="inline-flex items-center mt-6 h-11 px-6 rounded-full border border-[#dadce0] text-[14px] font-medium text-[#202124] hover:bg-[#f8f9fa] transition-colors">
              See security <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </Section>

        {/* ── RETENTION — split with illustration ───────────────────────── */}
        <SplitSection eyebrow="Retention" id="retention" heading={<><span>Keep what you need.</span><br /><span style={{ color: C.blue }}>Remove what you don't.</span></>} Icon={Database} illustrationSeed={3} reverse>
          <p className="text-[16px] text-[#5f6368] leading-[1.7]">
            The time information stays in Visionary should depend on why it is needed. The final Privacy Policy should state the retention periods or the criteria used to determine them.
          </p>
          <div className="mt-6 space-y-3">
            {["Provide the service", "Keep your learning connected", "Maintain security", "Meet legal obligations"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[14px] border border-[#e8eaed] bg-white px-5 py-3.5">
                <ShieldCheck className="w-4 h-4" strokeWidth={1.8} style={{ color: C.blue }} />
                <span className="text-[14px] text-[#202124]">{item}</span>
              </div>
            ))}
          </div>
        </SplitSection>

        {/* ── YOUNGER LEARNERS — callout band ──────────────────────────── */}
        <Section bg="surface" id="younger-learners">
          <div className="rounded-[28px] border border-[#e8eaed] bg-white p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${C.blue}12`, color: C.blue }}>
                <ShieldCheck className="w-8 h-8" strokeWidth={1.6} />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.4px] mb-3" style={{ color: C.grey }}>Students & younger learners</p>
                <h3 className="text-[clamp(24px,3vw,36px)] font-medium leading-[1.12] tracking-[-0.01em]" style={{ color: C.ink }}>
                  Extra care for <span style={{ color: C.blue }}>younger learners.</span>
                </h3>
                <p className="mt-4 text-[15.5px] text-[#5f6368] leading-[1.7] max-w-[720px]">
                  Visionary may be used by students at different ages and in different settings. The final policy should clearly explain how information about younger learners is handled, what parents or guardians can do, and which controls apply.
                </p>
                <Link to="/safety" className="inline-flex items-center mt-6 h-11 px-6 rounded-full border border-[#dadce0] text-[14px] font-medium text-[#202124] hover:bg-[#f8f9fa] transition-colors">
                  See safety <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </Section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <Section id="explainers">
          <SectionTitle eyebrow="Questions" align="center">Privacy,<br /><span style={{ color: C.blue }}>clearly explained.</span></SectionTitle>
          <FAQ faqs={[
            { q: "What information does Visionary keep about me?", a: "Depending on how you use Visionary, this can include account details, the questions and content you provide, learning activity, progress, projects, and information needed to provide the service." },
            { q: "Why does Visionary use my information?", a: "We use information to provide the product, keep your learning connected, improve the service, maintain security, and communicate with you when needed." },
            { q: "Who can see my learning information?", a: "That depends on your role and the relationships connected to your Visionary account. Student, teacher, parent, professional, and organization views only expose the information that the product and its permissions allow." },
            { q: "Can I download my information?", a: "Where data export is available, you should be able to request or download the information associated with your account." },
            { q: "Can I delete my account?", a: "Yes, account deletion should have a clear path. The Privacy Policy explains what is deleted, what may need to be retained, and how long any required retention lasts." },
          ]} />
        </Section>

        {/* ── GRIEVANCE & RELATED ───────────────────────────────────────── */}
        <Section bg="surface" id="grievance-officer">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-[24px] border border-[#e8eaed] bg-white p-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.4px]" style={{ color: C.grey }}>Under the DPDP Act, 2023</p>
              <h3 className="mt-3 text-[clamp(22px,2.4vw,30px)] font-medium leading-[1.15] tracking-[-0.01em]" style={{ color: C.ink }}>
                Your grievance has a <span style={{ color: C.blue }}>named person.</span>
              </h3>
              <div className="mt-6 space-y-2 text-[15px] text-[#5f6368] leading-[1.6]">
                <p>{GRIEVANCE_OFFICER.role}: <strong className="text-[#202124]">{GRIEVANCE_OFFICER.name}</strong></p>
                <p>Write to <a href={`mailto:${GRIEVANCE_OFFICER.email}`} className="font-medium underline decoration-[#1a73e8]/40 underline-offset-2 hover:decoration-[#1a73e8]" style={{ color: C.blue }}>{GRIEVANCE_OFFICER.email}</a></p>
                <p>{GRIEVANCE_OFFICER.response}</p>
              </div>
              <CalloutBar Icon={LockKeyhole} className="mt-6">
                Consent states: essential processing runs without consent; optional analytics runs only while your consent is on. See <Link to="/cookies" className="font-medium underline decoration-[#1a73e8]/40 underline-offset-2 hover:decoration-[#1a73e8]" style={{ color: C.blue }}>Cookie policy</Link>.
              </CalloutBar>
            </div>
            <div className="rounded-[24px] border border-[#e8eaed] bg-white p-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.4px]" style={{ color: C.grey }}>Related policies</p>
              <h3 className="mt-3 text-[clamp(22px,2.4vw,30px)] font-medium leading-[1.15] tracking-[-0.01em]" style={{ color: C.ink }}>
                Read them <span style={{ color: C.blue }}>together.</span>
              </h3>
              <ul className="mt-6 space-y-3 text-[15px]">
                {[
                  { to: "/terms", label: "Terms of service", desc: "The agreement behind your use of Visionary." },
                  { to: "/security", label: "Security", desc: "How your information is protected." },
                  { to: "/cookies", label: "Cookie policy", desc: "Essential cookies only." },
                  { to: "/safety", label: "Safety", desc: "Protections, reporting, and family controls." },
                  { to: "/accessibility", label: "Accessibility", desc: "Our commitment to an accessible product." },
                ].map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="inline-flex items-baseline gap-2 font-medium hover:underline" style={{ color: C.blue }}>
                      {l.label} <ArrowRight className="w-3.5 h-3.5 self-center" strokeWidth={1.8} />
                    </Link>
                    <span className="ml-2 text-[13px] text-[#5f6368]">{l.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* ── CTA CLOSING ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 py-32 lg:py-36 bg-[#f8f9fa]">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute rounded-full blur-3xl" style={{ width: 400, height: 400, left: "-6%", top: "-25%", background: "radial-gradient(circle, rgba(26,115,232,0.12) 0%, transparent 70%)" }} />
            <div className="absolute rounded-full blur-3xl" style={{ width: 280, height: 280, right: "-4%", bottom: "-30%", background: "radial-gradient(circle, rgba(52,168,83,0.08) 0%, transparent 70%)" }} />
          </div>
          <div className="relative z-10 max-w-[800px] mx-auto text-center">
            <h2 className="text-[clamp(32px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.03em]" style={{ color: C.ink }}>
              Your information<br /><span style={{ color: C.blue }}>stays yours to manage.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-[620px] text-[16.5px] text-[#5f6368] leading-[1.65]">
              Read the full policy, understand your choices, or explore how Visionary approaches safety and security.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/safety" className="inline-flex h-12 items-center rounded-full border border-[#dadce0] bg-white px-7 text-[14px] font-medium text-[#202124] hover:bg-[#f8f9fa] transition-colors">See safety</Link>
              <Link to="/security" className="inline-flex h-12 items-center rounded-full border border-[#dadce0] bg-white px-7 text-[14px] font-medium text-[#202124] hover:bg-[#f8f9fa] transition-colors">See security</Link>
            </div>
          </div>
        </section>

      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}