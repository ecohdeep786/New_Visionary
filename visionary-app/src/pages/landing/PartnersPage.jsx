import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Globe2,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import PageHeading, { Accent } from "@/components/landing/PageHeading";
import StorySection from "@/components/landing/StorySection";
import LandingFooter from "@/components/landing/LandingFooter";

const FONT_FAMILY =
  "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const COLORS = {
  ink: "#121317",
  surface: "#ffffff",
  grey: "#5f6368",
  lightGrey: "#9aa0a6",
  mist: "#dadce0",
  border: "#e5e7eb",
  soft: "#f8f9fa",
  blue: "#4285F4",
  white: "#ffffff",
};

const SECTIONS = [
  { id: "why-partner", number: "01", title: "Why work with a partner", summary: "When local knowledge, implementation, or support can make Visionary more useful." },
  { id: "what-partners-do", number: "02", title: "What partners can do", summary: "The practical ways partners can help institutions and communities." },
  { id: "education", number: "03", title: "Education partners", summary: "Bring Visionary closer to schools, colleges, coaching, and educators." },
  { id: "implementation", number: "04", title: "Implementation and support", summary: "Help organizations move from deciding to using Visionary." },
  { id: "technology", number: "05", title: "Technology and integration", summary: "Build useful connections around the Visionary experience." },
  { id: "regional", number: "06", title: "Regional partners", summary: "Help Visionary understand and serve local learning contexts." },
  { id: "who-partner", number: "07", title: "Who can become a partner", summary: "The kinds of organizations and people Visionary can work with." },
  { id: "what-we-look", number: "08", title: "What we look for", summary: "The principles that matter when choosing partners." },
  { id: "directory", number: "09", title: "Partner directory", summary: "Find partners as the network becomes available." },
  { id: "become", number: "10", title: "Become a partner", summary: "Introduce your organization and explain what you can contribute." },
  { id: "contact", number: "11", title: "Contact", summary: "How to reach Visionary about partnerships." },
];

function scrollToSection(id) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

function SectionHeading({ number, title }) {
  return (
    <div className="mb-6">
      <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>{number}</div>
      <h2 className="text-[30px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[36px]" style={{ color: COLORS.ink }}>{title}</h2>
    </div>
  );
}

function Paragraph({ children }) {
  return (
    <p className="max-w-[760px] text-[16px] leading-[1.78] tracking-[0.005em]" style={{ color: COLORS.grey }}>{children}</p>
  );
}

function PartnerCard({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="flex h-full flex-col rounded-[22px] border bg-white p-6 sm:p-7" style={{ borderColor: COLORS.border }}>
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
        <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
      </div>
      <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.lightGrey }}>{eyebrow}</div>
      <h3 className="mt-1.5 text-[19px] font-normal leading-[1.3]" style={{ color: COLORS.ink }}>{title}</h3>
      <p className="mt-3 flex-1 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{description}</p>
    </div>
  );
}

function PrincipleRow({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-4 border-b py-6 last:border-b-0" style={{ borderColor: COLORS.border }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.soft }}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} style={{ color: COLORS.blue }} />
      </div>
      <div>
        <h3 className="text-[17px] font-normal" style={{ color: COLORS.ink }}>{title}</h3>
        <p className="mt-2 max-w-[680px] text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{children}</p>
      </div>
    </div>
  );
}

function Note({ children }) {
  return (
    <div className="mt-6 rounded-[18px] border px-5 py-5 sm:px-6" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
      <p className="text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{children}</p>
    </div>
  );
}

const APPLICATION_TYPES = [
  "Education implementation",
  "Professional development",
  "Technology or integration",
  "Regional partnership",
  "Content or learning resources",
  "Other",
];

export default function PartnersPage() {
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState(APPLICATION_TYPES[0]);
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
    const [status, setStatus] = useState("idle"); // idle | submitting | success | error (deterministic mock)
  const [showError, setShowError] = useState(false);


    function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setShowError(true);
      return;
    }
    setStatus("submitting");
    setTimeout(() => setStatus("success"), 900); // deterministic mock — no backend yet
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
            <main id="main">
        <PageHeading page="Partners" eyebrow="Partners"
          h1={<>Partner with <Accent>us</Accent>.</>}
          dek="Schools, platforms and governments, on board.">
        </PageHeading>

        {/* STORY BAND */}
        <section className="border-b" style={{ borderColor: COLORS.border }}>
          <div className="mx-auto max-w-[1240px] px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
            <div className="max-w-[940px]">
              <p className="text-[28px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[40px]" style={{ color: COLORS.ink }}>
                The product is one thing.
                <br />
                <span style={{ color: COLORS.ink }}>Knowing where it belongs is another.</span>
              </p>
              <p className="mt-6 max-w-[760px] text-[17px] leading-[1.75]" style={{ color: COLORS.grey }}>
                A school has its own rhythm. A college has different needs. A coaching center works differently from a workplace. Local context matters. Good partners help Visionary understand that context and make the product work within it.
              </p>
            </div>
          </div>
        </section>

        {/* 01 · WHY A PARTNER */},
        <StorySection
          id="why-partner"
          title="Why work with a partner"
          featured={{
            subject: "handshake",
            label: "Partnerships",
            title: "Closer to where learning happens.",
            dek: "The right partner makes Visionary more useful in a specific place.",
          }}
          rows={[
            { label: "Schools", title: "Visionary inside real classrooms." },
            { label: "Platforms", title: "Learning where it already happens." },
            { label: "Regions", title: "Languages and contexts we serve." },
            { label: "Governments", title: "Programs that reach everyone." },
          ]}
        />

        {/* 02 · WHAT PARTNERS DO */}
        <StorySection
          id="what-partners-do"
          title="What partners can do"
          flip
          featured={{
            subject: "community",
            label: "The work",
            title: "Build for more places.",
            dek: "Deployment, integration, support, and reach — together.",
          }}
          rows={[
            { label: "Education", title: "Curriculum and classroom fit." },
            { label: "Implementation", title: "Rollout, training, and support." },
            { label: "Technology", title: "Integration with existing systems." },
            { label: "Regional", title: "Language and community reach." },
          ]}
        />

<section id="directory" className="scroll-mt-24 py-14 sm:py-16 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
                    <SectionHeading number="09" title="Partner directory" />
                    <Paragraph>A directory is useful only when there are real partners to search for and clear criteria for being listed.</Paragraph>
                    <div className="mt-8 rounded-[24px] border p-7 sm:p-8" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                        <Globe2 className="h-5 w-5" strokeWidth={1.7} />
                      </div>
                      <h3 className="mt-6 text-[25px] font-normal tracking-[-0.02em]" style={{ color: COLORS.ink }}>The partner network is growing.</h3>
                      <p className="mt-3 max-w-[700px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                        Public partner listings will appear here as Visionary establishes and verifies its partner network.
                      </p>
                      <p className="mt-4 max-w-[700px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                        Until then, institutions and organizations can contact Visionary directly to discuss the kind of support or partnership they need.
                      </p>
                      <div className="mt-6">
                        <a href="mailto:partnerships@visionary.org.in"
                          className="inline-flex items-center gap-2 text-[17px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                          style={{ color: COLORS.blue }}>
                          partnerships@visionary.org.in
                          <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                        </a>
                      </div>
                    </div>
                    </div>
        </section>

<section id="become" className="scroll-mt-24 py-14 sm:py-16 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
                    <SectionHeading number="10" title="Become a partner" />
                    <Paragraph>Tell us what you do, who you work with, and where you think Visionary could become more useful.</Paragraph>
                    <div className="mt-8 rounded-[24px] border bg-white p-6 sm:p-8" style={{ borderColor: COLORS.border }}>
                      {status === "error" ? (
                        <div className="py-8" role="alert">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist }}>
                            <AlertCircle className="h-5 w-5" strokeWidth={1.7} style={{ color: "#EA4335" }} />
                          </div>
                          <h3 className="mt-6 text-[28px] font-normal tracking-[-0.025em]" style={{ color: COLORS.ink }}>We couldn't send that.</h3>
                          <p className="mt-3 max-w-[650px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                            A name and a valid email are required so the partnerships team can reply to you. Check them and try again.
                          </p>
                          <button type="button" onClick={() => setStatus("idle")}
                            className="mt-6 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ color: COLORS.blue }}>
                            Back to the form
                            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      ) : status === "success" ? (
                        <div className="py-8">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist }}>
                            <CheckCircle2 className="h-5 w-5" strokeWidth={1.7} style={{ color: COLORS.blue }} />
                          </div>
                          <h3 className="mt-6 text-[28px] font-normal tracking-[-0.025em]" style={{ color: COLORS.ink }}>Your introduction is ready.</h3>
                          <p className="mt-3 max-w-[650px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                            The application flow is connected to this page, but the production partnership endpoint still needs to be connected before launch.
                          </p>
                          <button type="button" onClick={() => setStatus("idle")}
                            className="mt-6 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ color: COLORS.blue }}>
                            Send another introduction
                            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} noValidate>
                          <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                              <label htmlFor="partner-name" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Your name</label>
                              <input id="partner-name" name="name" type="text" autoComplete="name" required value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                                style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                            </div>
                            <div>
                              <label htmlFor="partner-organization" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Organization</label>
                              <input id="partner-organization" name="organization" type="text" autoComplete="organization" required value={organization}
                                onChange={(event) => setOrganization(event.target.value)}
                                className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                                style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                            </div>
                          </div>
                          <div className="mt-6 grid gap-6 sm:grid-cols-2">
                            <div>
                              <label htmlFor="partner-email" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Work email</label>
                              <input id="partner-email" name="email" type="email" autoComplete="email" required value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                                style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                            </div>
                            <div>
                              <label htmlFor="partner-type" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Partnership type</label>
                              <select id="partner-type" name="type" value={type}
                                onChange={(event) => setType(event.target.value)}
                                className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                                style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                                {APPLICATION_TYPES.map((item) => (
                                  <option key={item} value={item}>{item}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="mt-6">
                            <label htmlFor="partner-website" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Organization website</label>
                            <input id="partner-website" name="website" type="url" autoComplete="url" placeholder="https://" value={website}
                              onChange={(event) => setWebsite(event.target.value)}
                              className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                              style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                          </div>
                          <div className="mt-6">
                            <label htmlFor="partner-message" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Tell us about the partnership</label>
                            <textarea id="partner-message" name="message" required rows={7} value={message}
                              onChange={(event) => setMessage(event.target.value)}
                              placeholder="Who do you work with, what do you do, and what could we build together?"
                              className="mt-2 w-full resize-y rounded-[14px] border bg-white px-4 py-3 text-[15px] leading-[1.6] outline-none transition-colors placeholder:text-[#9AA0A6] focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                              style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                          </div>
                          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="max-w-[550px] text-[12px] leading-[1.6]" style={{ color: COLORS.grey }}>
                              Please share only information needed to help us understand the partnership.
                            </p>
                            <button type="submit" disabled={status === "submitting"}
                              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
                              style={{ backgroundColor: COLORS.blue }}>
                              {status === "submitting" ? "Sending…" : "Send introduction"}
                              <ArrowUpRight className="ml-2 h-4 w-4" strokeWidth={1.8} />
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                    <Note>Partner approval criteria, commercial terms, technical requirements, and any formal partner program should be published separately once Visionary has defined them.</Note>
                    </div>
        </section>

        {/* CONTACT one-liner */}
        <section id="contact" aria-label="Contact" className="border-t px-6 py-14 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto flex max-w-[1240px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px]" style={{ color: COLORS.grey }}>Partnership questions?</p>
            <a href="mailto:partners@visionary.org.in" className="inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
              partners@visionary.org.in
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </a>
          </div>
        </section>
      </main>

      <LandingFooter variant="quiet" />
    </div>
  );
}