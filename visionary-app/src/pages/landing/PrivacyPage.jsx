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
import HighlightCard from "@/components/landing/sections/HighlightCard";

const C = {
  ink: "#202124", surface: "#f8f9fa", blue: "#1a73e8",
  grey: "#5f6368", lightGrey: "#9aa0a6", mist: "#dadce0", white: "#ffffff",
};
const FONT = "'Google Sans Flex', 'Google Sans', system-ui, -apple-system, sans-serif";

function Section({ id, children, bg = "white" }) {
  return (
    <section id={id} className={`scroll-mt-24 px-6 ${bg === "surface" ? "bg-[#f8f9fa]" : "bg-white"}`}
      style={{ paddingTop: 100, paddingBottom: 100 }}>
      <div className="max-w-[1200px] mx-auto">{children}</div>
    </section>
  );
}

function SectionTitle({ eyebrow, id, children }) {
  return (
    <div className="mb-10 lg:mb-14 max-w-[800px]">
      {eyebrow && <p className="text-[12px] font-medium uppercase tracking-[0.12em] mb-4" style={{ color: C.grey }}>{eyebrow}</p>}
      <h2 id={id} className="text-[clamp(30px,4vw,48px)] font-normal leading-[1.1] tracking-[-0.025em]" style={{ color: C.ink }}>{children}</h2>
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

function DataRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-[#e8eaed] last:border-b-0">
      <span className="text-[14px] font-medium text-[#202124]">{label}</span>
      <span className="text-[14px] text-[#5f6368]">{value}</span>
    </div>
  );
}

function FAQ({ faqs }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-0 border-t border-[#e8eaed]">
      {faqs.map((item, idx) => {
        const isOpen = open === idx;
        return (
          <div key={idx} className="border-b border-[#e8eaed]">
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : idx)}
              className="w-full flex items-center justify-between gap-6 py-5 text-left hover:bg-[#f8f9fa]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
              <span className="text-[17px] text-[#202124] leading-[1.45]">{item.q}</span>
              <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} strokeWidth={1.8} style={{ color: C.grey }} />
            </button>
            <div className="grid transition-all duration-300" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}>
              <div className="overflow-hidden"><p className="pb-6 text-[15px] text-[#5f6368] leading-[1.7]">{item.a}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}>
      <LandingNav />
      <main id="main">

        {/* HERO — clean, left-aligned, Google pattern: text only, no decorations */}
        <section className="px-6 bg-white" style={{ paddingTop: 140, paddingBottom: 80 }}>
          <div className="max-w-[1200px] mx-auto">
            <div className="max-w-[780px]">
              <p className="text-[12px] font-medium uppercase tracking-[0.12em] mb-5" style={{ color: C.grey }}>Privacy</p>
              <h1 className="text-[clamp(44px,6vw,76px)] font-normal leading-[1.04] tracking-[-0.03em]" style={{ color: C.ink }}>
                Your information.<br /><span style={{ color: C.blue }}>Your control.</span>
              </h1>
              <p className="mt-6 text-[18px] leading-[1.6] max-w-[640px]" style={{ color: C.grey }}>
                Your learning is personal. This page explains what Visionary handles, why we use it, and the choices you have.
              </p>
              <p className="mt-5 text-[13px]" style={{ color: C.lightGrey }}>
                Last updated: <span style={{ color: C.grey }}>{LEGAL_META.privacy.lastUpdated}</span>
              </p>
            </div>
          </div>
        </section>

        {/* AT A GLANCE — icon product grid (like Google Workspace apps grid) */}
        <Section bg="surface">
          <SectionTitle eyebrow="At a glance">We collect what we need to provide Visionary.</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <HighlightCard Icon={UserRound} title="Your account">Name, email, role, and account settings.</HighlightCard>
            <HighlightCard Icon={Database} title="Your learning">Questions, sessions, progress, projects, and content you provide.</HighlightCard>
            <HighlightCard Icon={Settings2} title="Your device">Information needed to keep the product working on your device.</HighlightCard>
            <HighlightCard Icon={Eye} title="Your choices">Settings and permissions that affect how your information is used.</HighlightCard>
          </div>
        </Section>

        {/* PURPOSE — left-aligned text + illustration (Google two-column pattern) */}
        <SplitSection eyebrow="Why we use it" id="purpose" heading="Information should have a clear purpose." Icon={ShieldCheck} seed={0}>
          <p className="text-[16px] text-[#5f6368] leading-[1.7]">The information Visionary handles depends on what you do with the product. An account needs account information. Learning features need the context you provide.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <div className="rounded-[16px] border border-[#e8eaed] bg-white p-5">
              <ShieldCheck className="w-5 h-5 mb-3" strokeWidth={1.7} style={{ color: C.blue }} />
              <h4 className="text-[14px] font-medium text-[#202124]">Provide Visionary</h4>
              <p className="mt-1 text-[13px] text-[#5f6368] leading-[1.6]">Use the information needed to provide features you choose to use.</p>
            </div>
            <div className="rounded-[16px] border border-[#e8eaed] bg-white p-5">
              <Eye className="w-5 h-5 mb-3" strokeWidth={1.7} style={{ color: C.blue }} />
              <h4 className="text-[14px] font-medium text-[#202124]">Keep learning connected</h4>
              <p className="mt-1 text-[13px] text-[#5f6368] leading-[1.6]">Use relevant context so your experience continues from what came before.</p>
            </div>
            <div className="rounded-[16px] border border-[#e8eaed] bg-white p-5">
              <Settings2 className="w-5 h-5 mb-3" strokeWidth={1.7} style={{ color: C.blue }} />
              <h4 className="text-[14px] font-medium text-[#202124]">Maintain and improve</h4>
              <p className="mt-1 text-[13px] text-[#5f6368] leading-[1.6]">Use appropriate information to fix problems and improve the service.</p>
            </div>
            <div className="rounded-[16px] border border-[#e8eaed] bg-white p-5">
              <Mail className="w-5 h-5 mb-3" strokeWidth={1.7} style={{ color: C.blue }} />
              <h4 className="text-[14px] font-medium text-[#202124]">Communicate with you</h4>
              <p className="mt-1 text-[13px] text-[#5f6368] leading-[1.6]">Use your contact information to respond to requests and updates.</p>
            </div>
          </div>
        </SplitSection>

        {/* SHARING — text left + data table right (Google data pattern) */}
        <SplitSection eyebrow="Sharing" id="sharing" heading="Your information shouldn't travel without a reason." Icon={Share2} seed={1} reverse>
          <p className="text-[16px] text-[#5f6368] leading-[1.7]">Visionary may need to work with service providers that help operate the product. Where information is shared, the purpose, scope, and applicable controls should be described clearly.</p>
          <div className="mt-8 rounded-[20px] border border-[#e8eaed] bg-white p-6">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] mb-4" style={{ color: C.grey }}>Who can see what</p>
            <DataRow label="Student" value="Their own learning" />
            <DataRow label="Teacher" value="Class information they are allowed to see" />
            <DataRow label="Parent" value="Relevant information shared through the product" />
            <DataRow label="Professional" value="Their own work and learning" />
            <DataRow label="Organization" value="Information permitted by organization controls" />
          </div>
        </SplitSection>

        {/* YOUR CONTROLS — product icon grid (Google Workspace pattern) */}
        <Section bg="surface" id="your-controls">
          <SectionTitle eyebrow="Your controls">Know what you can do with your information.</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <HighlightCard Icon={Eye} title="View">See the information connected to your account.</HighlightCard>
            <HighlightCard Icon={Settings2} title="Manage">Update settings and permissions where available.</HighlightCard>
            <HighlightCard Icon={Download} title="Export">Download supported account information.</HighlightCard>
            <HighlightCard Icon={Trash2} title="Delete">Request account deletion and see what happens next.</HighlightCard>
          </div>
        </Section>

        {/* SECURITY — clean two-column with illustration (Google pattern) */}
        <SplitSection eyebrow="Security" id="security" heading="Privacy needs security behind it." Icon={LockKeyhole} seed={2}>
          <p className="text-[16px] text-[#5f6368] leading-[1.7]">Visionary uses technical and organizational measures to protect information against unauthorized access, loss, misuse, or disclosure.</p>
          <div className="mt-6">
            <Link to="/security" className="inline-flex items-center gap-2 text-[15px] font-medium hover:underline" style={{ color: C.blue }}>
              See security <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
        </SplitSection>

        {/* RETENTION — reversed two-column */}
        <SplitSection eyebrow="Retention" id="retention" heading="Keep what you need. Remove what you don't." Icon={Database} seed={3} reverse>
          <p className="text-[16px] text-[#5f6368] leading-[1.7]">The time information stays in Visionary should depend on why it is needed.</p>
          <div className="mt-6 space-y-3">
            {["Provide the service", "Keep your learning connected", "Maintain security", "Meet legal obligations"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[14px] border border-[#e8eaed] bg-white px-5 py-3.5">
                <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={1.8} style={{ color: C.blue }} />
                <span className="text-[14px] text-[#202124]">{item}</span>
              </div>
            ))}
          </div>
        </SplitSection>

        {/* YOUNGER LEARNERS — clean callout card (Google pattern) */}
        <Section bg="surface" id="younger-learners">
          <div className="rounded-[24px] border border-[#e8eaed] bg-white p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${C.blue}12`, color: C.blue }}>
                <ShieldCheck className="w-8 h-8" strokeWidth={1.6} />
              </div>
              <div className="max-w-[720px]">
                <p className="text-[12px] font-medium uppercase tracking-[0.12em] mb-3" style={{ color: C.grey }}>Students & younger learners</p>
                <h3 className="text-[clamp(24px,3vw,36px)] font-normal leading-[1.12] tracking-[-0.01em]" style={{ color: C.ink }}>
                  Extra care for <span style={{ color: C.blue }}>younger learners.</span>
                </h3>
                <p className="mt-4 text-[15.5px] leading-[1.7]" style={{ color: C.grey }}>
                  Visionary may be used by students at different ages. The final policy should explain how information about younger learners is handled and which controls apply.
                </p>
                <Link to="/safety" className="inline-flex items-center gap-2 mt-6 text-[14px] font-medium hover:underline" style={{ color: C.blue }}>
                  See safety <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
              </div>
            </div>
          </div>
        </Section>

        {/* FAQ — Google pattern: full-width, clean accordion */}
        <Section id="explainers">
          <SectionTitle eyebrow="Questions">Privacy, clearly explained.</SectionTitle>
          <div className="max-w-[800px]">
            <FAQ faqs={[
              { q: "What information does Visionary keep about me?", a: "Depending on how you use Visionary, this can include account details, questions and content you provide, learning activity, progress, projects, and information needed to provide the service." },
              { q: "Why does Visionary use my information?", a: "We use information to provide the product, keep your learning connected, improve the service, maintain security, and communicate with you when needed." },
              { q: "Who can see my learning information?", a: "That depends on your role and the relationships connected to your Visionary account. Student, teacher, parent, professional, and organization views only expose the information that the product and its permissions allow." },
              { q: "Can I download my information?", a: "Where data export is available, you should be able to request or download the information associated with your account." },
              { q: "Can I delete my account?", a: "Yes, account deletion has a clear path. The Privacy Policy explains what is deleted, what may need to be retained, and how long any required retention lasts." },
            ]} />
          </div>
        </Section>

        {/* GRIEVANCE & RELATED — two-column cards (Google pattern) */}
        <Section bg="surface" id="grievance-officer">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-[24px] border border-[#e8eaed] bg-white p-8">
              <p className="text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: C.grey }}>Under the DPDP Act, 2023</p>
              <h3 className="mt-3 text-[clamp(22px,2.4vw,30px)] font-normal leading-[1.15] tracking-[-0.01em]" style={{ color: C.ink }}>
                Your grievance has a <span style={{ color: C.blue }}>named person.</span>
              </h3>
              <div className="mt-6 space-y-2 text-[15px] leading-[1.6]" style={{ color: C.grey }}>
                <p>{GRIEVANCE_OFFICER.role}: <strong style={{ color: C.ink }}>{GRIEVANCE_OFFICER.name}</strong></p>
                <p>Write to <a href={`mailto:${GRIEVANCE_OFFICER.email}`} className="font-medium underline decoration-[#1a73e8]/40 underline-offset-2 hover:decoration-[#1a73e8]" style={{ color: C.blue }}>{GRIEVANCE_OFFICER.email}</a></p>
                <p>{GRIEVANCE_OFFICER.response}</p>
              </div>
              <div className="mt-6 rounded-[14px] px-5 py-4 text-[13px] leading-[1.6]" style={{ backgroundColor: C.surface, color: C.grey }}>
                Consent states: essential processing runs without consent; optional analytics runs only while your consent is on. See <Link to="/cookies" className="font-medium underline" style={{ color: C.blue }}>Cookie policy</Link>.
              </div>
            </div>
            <div className="rounded-[24px] border border-[#e8eaed] bg-white p-8">
              <p className="text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: C.grey }}>Related policies</p>
              <h3 className="mt-3 text-[clamp(22px,2.4vw,30px)] font-normal leading-[1.15] tracking-[-0.01em]" style={{ color: C.ink }}>
                Read them <span style={{ color: C.blue }}>together.</span>
              </h3>
              <ul className="mt-6 space-y-3 text-[15px]">
                {[
                  { to: "/terms", label: "Terms of service" },
                  { to: "/security", label: "Security" },
                  { to: "/cookies", label: "Cookie policy" },
                  { to: "/safety", label: "Safety" },
                  { to: "/accessibility", label: "Accessibility" },
                ].map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="inline-flex items-baseline gap-2 text-[15px] font-medium hover:underline" style={{ color: C.blue }}>
                      {l.label} <ArrowRight className="w-3.5 h-3.5 self-center" strokeWidth={1.8} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* CTA CLOSING — full-width surface band (Google pattern) */}
        <section className="bg-[#f8f9fa] px-6 text-center" style={{ paddingTop: 100, paddingBottom: 100 }}>
          <div className="max-w-[800px] mx-auto">
            <h2 className="text-[clamp(32px,5vw,56px)] font-normal leading-[1.06] tracking-[-0.025em]" style={{ color: C.ink }}>
              Your information<br /><span style={{ color: C.blue }}>stays yours to manage.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-[620px] text-[16.5px] leading-[1.65]" style={{ color: C.grey }}>
              Read the full policy, understand your choices, or explore how Visionary approaches safety and security.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/safety" className="inline-flex h-12 items-center rounded-full border border-[#dadce0] bg-white px-7 text-[14px] font-medium hover:bg-[#f8f9fa] transition-colors" style={{ color: C.ink }}>See safety</Link>
              <Link to="/security" className="inline-flex h-12 items-center rounded-full border border-[#dadce0] bg-white px-7 text-[14px] font-medium hover:bg-[#f8f9fa] transition-colors" style={{ color: C.ink }}>See security</Link>
            </div>
          </div>
        </section>

      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}