import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Database,
  Target,
  Share2,
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
import SpotIllustration from "@/components/landing/SpotIllustration";
import { LEGAL_META, GRIEVANCE_OFFICER } from "@/data/legalMeta";

const COLORS = {
  ink: "#121317",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  border: "#e5e7eb",
  soft: "#f8f9fa",
  blue: "#4285F4",
  white: "#ffffff",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const AT_A_GLANCE = [
  { to: "#what-we-collect", label: "What we collect", Icon: Database },
  { to: "#purpose", label: "Why we use it", Icon: Target },
  { to: "#sharing", label: "What we share", Icon: Share2 },
  { to: "#your-controls", label: "Your controls", Icon: Settings2 },
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
    a: "Learning records are kept while your account is active. When information is no longer needed, it is deleted or anonymized. You can request deletion at any time.",
  },
  {
    q: "Can I delete my account?",
    a: "Yes. Request deletion through the grievance officer below. We will confirm what will be removed, complete the deletion, and tell you what was done.",
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

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <Breadcrumb page="Privacy policy" />

      <main id="main">
        {/* HERO */}
        <section className="px-6 pb-14 pt-6 sm:px-8 sm:pb-16 lg:px-10">
          <div className="mx-auto w-full max-w-[1240px]">
          <p className="text-[12px] uppercase tracking-[0.43px]" style={{ color: COLORS.grey }}>Privacy</p>
          <h1 className="mt-4 max-w-[960px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px]" style={{ color: COLORS.ink }}>
            Your data, your control.
          </h1>
          <p className="mt-6 max-w-[640px] text-[18px] leading-[1.6] sm:text-[20px]" style={{ color: COLORS.grey }}>
            See what we keep. Change or remove it anytime.
          </p>
          <p className="mt-6 text-[13px] tracking-[0.24px]" style={{ color: COLORS.lightGrey }}>
            Last updated: <strong style={{ color: COLORS.ink }}>{LEGAL_META.privacy.lastUpdated}</strong>
          </p>
          </div>
        </section>

        {/* AT A GLANCE — 4 tiles */}
        <section className="px-6 sm:px-8 lg:px-10" aria-label="At a glance">
          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AT_A_GLANCE.map(({ to, label, Icon }) => (
              <a key={to} href={to} className="group relative flex min-h-[132px] flex-col rounded-[16px] border bg-white p-6 transition-all duration-300 hover:shadow-[0_1px_6px_rgba(32,33,36,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ borderColor: COLORS.mist }}>
                <span className="text-[15px] font-medium leading-[1.4] text-[#121317]">{label}</span>
                <ArrowRight className="absolute right-5 top-6 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.7} style={{ color: COLORS.lightGrey }} />
                <span className="mt-auto flex h-10 w-10 items-center justify-center rounded-[12px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                  <Icon className="h-4 w-4" strokeWidth={1.7} />
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* ON THIS PAGE — anchor chips */}
        <section className="px-6 pt-10 sm:px-8 lg:px-10" aria-label="On this page">
          <nav className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-center gap-2">
            {[
              ["#retention", "Data retention"],
              ["#younger-learners", "Younger learners"],
              ["#security", "Security"],
              ["#explainers", "Explainers"],
              ["#grievance-officer", "Grievance officer"],
            ].map(([to, label]) => (
              <a key={to} href={to} className="rounded-full border bg-white px-4 py-2 text-[13px] tracking-[0.1px] transition-colors hover:bg-[#F5F6F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ borderColor: COLORS.mist, color: COLORS.grey }}>
                {label}
              </a>
            ))}
          </nav>
        </section>

        {/* Illustration panel */}
        <section className="px-6 pt-14 sm:px-8 lg:px-10" aria-hidden="true">
          <div className="mx-auto max-w-[760px] overflow-hidden rounded-[20px] border" style={{ borderColor: COLORS.mist }}>
            <SpotIllustration subject="lock" className="aspect-[16/9] w-full" />
          </div>
        </section>

        {/* 01 — WHAT WE COLLECT */}
        <section id="what-we-collect" className="scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <SectionHeading number="01" title="What we collect" />
            <Paragraph>
              The information Visionary handles depends on what you are trying to do. Personal information is only collected where it is needed to provide the service, keep it working, and honour the choices you make.
            </Paragraph>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { Icon: Mail, title: "Your account", text: "Created with an email address — the details needed to provide access and maintain essential settings for you." },
                { Icon: Target, title: "Your learning", text: "Questions you ask, practice you complete, and projects you build — the work that shapes your progress." },
                { Icon: Database, title: "Your device", text: "Basic device and browser information that keeps the service working on the devices you use." },
                { Icon: Settings2, title: "Your choices", text: "The email updates you opt into, and the privacy preferences you set along the way." },
              ].map(({ Icon, title, text }) => (
                <div key={title} className="rounded-[16px] border p-6" style={{ borderColor: COLORS.mist }}>
                  <IconTile Icon={Icon} />
                  <h3 className="mt-5 text-[16px] font-medium" style={{ color: COLORS.ink }}>{title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 02 — WHY WE USE IT */}
        <section id="purpose" className="scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <SectionHeading number="02" title="Why we use it" />
            <Paragraph>
              Personal information is used to provide, maintain, and improve Visionary — and to keep it safe for the people using it.
            </Paragraph>
            <div className="mt-10 max-w-[880px]">
              {[
                { Icon: Target, title: "Provide Visionary", text: "Answer questions, guide practice, and keep your work in one place as you continue." },
                { Icon: Database, title: "Keep your learning connected", text: "Carry understanding across sessions, devices, and years — never starting over." },
                { Icon: Settings2, title: "Maintain and improve the service", text: "Fix problems, and understand what is helping and what is not." },
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
          </div>
        </section>

        {/* 03 — WHAT WE SHARE */}
        <section id="sharing" className="scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <SectionHeading number="03" title="What we share" />
            <Paragraph>
              We do not sell personal information, and we do not use it for advertising. What is visible depends on the relationship.
            </Paragraph>
            <div className="mt-10 overflow-hidden rounded-[16px] border" style={{ borderColor: COLORS.mist }}>
              {[
                ["Student", "Class-level progress is visible to the teacher of that class. Conversations stay private to the account."],
                ["Teacher", "Sees their classes. Never another class's data."],
                ["Parent", "Progress and activity — not private conversations."],
                ["Institution", "Aggregated, role-appropriate views only."],
                ["Service providers", "Only the processors that run the service — bound by contract to handle data per this page."],
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
          </div>
        </section>

        {/* 04 — YOUR CONTROLS */}
        <section id="your-controls" className="scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <SectionHeading number="04" title="Your controls" />
            <Paragraph>
              You can see, manage, export, and delete your information — and change your mind at any time.
            </Paragraph>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { Icon: Eye, title: "View", text: "Your account and learning history are visible to you in the product." },
                { Icon: Settings2, title: "Manage", text: "Update cookie preferences and email choices from any update you receive." },
                { Icon: Database, title: "Export", text: "Request a copy of your account information where available." },
                { Icon: Mail, title: "Delete", text: "Request account deletion, and see what happens next." },
              ].map(({ Icon, title, text }) => (
                <div key={title} className="rounded-[16px] border p-6" style={{ borderColor: COLORS.mist }}>
                  <IconTile Icon={Icon} />
                  <h3 className="mt-5 text-[16px] font-medium" style={{ color: COLORS.ink }}>{title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link to="/cookies" className="inline-flex items-center gap-2 text-[14.5px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
                Manage cookie preferences
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
              <Link to="/security" className="inline-flex items-center gap-2 text-[14.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.grey }}>
                Review security practices
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </section>

        {/* 05 — SECURITY */}
        <section id="security" className="scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <SectionHeading number="05" title="Security" />
            <Paragraph>
              Privacy needs security behind it. Visionary uses appropriate technical and organizational safeguards — including encryption in transit and access controls — to protect information against unauthorized access, alteration, deletion, or misuse.
            </Paragraph>
            <LearnMoreRow to="/security" label="How security works at Visionary" />
          </div>
        </section>

        {/* 06 — RETENTION */}
        <section id="retention" className="scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <SectionHeading number="06" title="Retention" />
            <Paragraph>
              Learning records are kept while your account is active — that continuity is the product. When information is no longer needed to provide the service, it is deleted or anonymized.
            </Paragraph>
            <div className="mt-10 max-w-[880px] rounded-[16px] border p-6 sm:p-7" style={{ borderColor: COLORS.mist }}>
              <p className="text-[16px] font-medium" style={{ color: COLORS.ink }}>Your privacy options.</p>
              <ul className="mt-4 space-y-2.5">
                {["Request deletion at any time.", "See how long each kind of record is kept.", "Withdraw consent for optional features.", "Export your information."].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS.blue }} />
                    <span className="text-[14.5px] leading-[1.65]" style={{ color: COLORS.grey }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 07 — YOUNGER LEARNERS */}
        <section id="younger-learners" className="scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <SectionHeading number="07" title="Younger learners" />
            <Paragraph>
              Where a learner is a child under the DPDP Act, their information is processed only with the consent of a parent or guardian, and it is never used for advertising or profiling.
            </Paragraph>
            <LearnMoreRow to="/safety" label="How safety works for younger learners" />
          </div>
        </section>

        {/* 08 — EXPLAINERS (FAQ) */}
        <section id="explainers" className="scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <SectionHeading number="08" title="Privacy, clearly explained." />
            <div className="max-w-[880px] border-t" style={{ borderColor: COLORS.mist }}>
              {FAQ.map((item, index) => (
                <div key={item.q} className="border-b" style={{ borderColor: COLORS.mist }}>
                  <button
                    type="button"
                    aria-expanded={openFaq === index}
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                  >
                    <span className="text-[16px] leading-[1.45]" style={{ color: COLORS.ink }}>{item.q}</span>
                    <ChevronDown className={["h-4 w-4 shrink-0 transition-transform duration-200", openFaq === index ? "rotate-180" : ""].join(" ")} strokeWidth={1.8} style={{ color: COLORS.grey }} />
                  </button>
                  {openFaq === index && (
                    <p className="pb-5 text-[14.5px] leading-[1.7]" style={{ color: COLORS.grey }}>{item.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 09 — GRIEVANCE OFFICER */}
        <section id="grievance-officer" className="scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <SectionHeading number="09" title="Grievance officer" />
            <div className="max-w-[880px]">
              <Paragraph>
                Under the DPDP Act, 2023, a named person is responsible for answering privacy requests and complaints.
              </Paragraph>
              <div className="mt-8 rounded-[16px] border p-6 sm:p-7" style={{ borderColor: COLORS.mist }}>
                <p className="text-[14.5px] leading-[1.7]" style={{ color: COLORS.grey }}>
                  {GRIEVANCE_OFFICER.role}: <strong style={{ color: COLORS.ink }}>{GRIEVANCE_OFFICER.name}</strong>
                </p>
                <p className="mt-3">
                  <a href={`mailto:${GRIEVANCE_OFFICER.email}`} className="inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
                    {GRIEVANCE_OFFICER.email}
                    <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                  </a>
                </p>
                <p className="mt-3 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{GRIEVANCE_OFFICER.response}</p>
              </div>
            </div>
          </div>
        </section>

        {/* RELATED */}
        <section aria-label="Related policies" className="border-t px-6 py-20 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto max-w-[1240px]">
            <h2 className="text-[22px] font-normal leading-[1.3] tracking-[-0.01em]" style={{ color: COLORS.ink }}>Read them together</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { to: "/cookies", label: "Cookie policy", desc: "Essential cookies only.", Icon: Cookie },
                { to: "/security", label: "Security", desc: "How your information is protected.", Icon: ShieldCheck },
                { to: "/safety", label: "Safety", desc: "Guardrails for every learner.", Icon: Accessibility },
                { to: "/accessibility", label: "Accessibility", desc: "Built for every kind of learner.", Icon: FileText },
              ].map(({ to, label, desc, Icon }) => (
                <Link key={to} to={to} className="group rounded-[12px] border p-5 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ borderColor: COLORS.mist }}>
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
