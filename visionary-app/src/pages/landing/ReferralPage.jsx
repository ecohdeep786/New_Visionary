import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  UsersRound,
  Lightbulb,
  Send,
  Gift,
  ShieldCheck,
  HeartHandshake,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import SpotIllustration from "@/components/landing/SpotIllustration";
import {
  Section, SectionHead, IconChip, FeatureGrid, PK,
} from "@/components/landing/PageKit";

const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* ── How it works — three numbered steps ── */
const STEPS = [
  { n: "01", Icon: Send, tone: "blue", title: "Share Visionary.", copy: "Tell one person who needs it — a classmate, a colleague, a parent. Your invite opens the door." },
  { n: "02", Icon: GraduationCap, tone: "green", title: "They start learning.", copy: "The person you invite begins their own journey — in their language, at their level." },
  { n: "03", Icon: Gift, tone: "yellow", title: "Both of you move forward.", copy: "When they stay and learn, you both get more of Visionary. Recognition is attributed, never tracked." },
];

/* ── Who it's for ── */
const ROLES = [
  { Icon: GraduationCap, tone: "blue", illustration: "student", eyebrow: "Students", title: "Learn together", copy: "Invite classmates who are learning the same things. Practise gets better with company." },
  { Icon: UsersRound, tone: "green", illustration: "teacher", eyebrow: "Teachers", title: "Reach your class", copy: "Bring Visionary to the people you teach and see every learner more clearly." },
  { Icon: Lightbulb, tone: "yellow", illustration: "build", eyebrow: "Creators", title: "Share what you built", copy: "Show your projects to people who can use them — and grow from their feedback." },
];

/* ── Program principles ── */
const PRINCIPLES = [
  { Icon: HeartHandshake, tone: "green", title: "Helpful first", copy: "Share with people who genuinely need it. A recommendation only works when it's honest." },
  { Icon: ShieldCheck, tone: "blue", title: "Attributed, never tracked", copy: "You get recognized for the invite. Nobody's behavior gets monitored beyond that." },
  { Icon: Gift, tone: "yellow", title: "Rewards that matter", copy: "More Visionary for both of you — extra questions, longer memory, fuller features." },
];

export default function ReferralPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error (deterministic mock)

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setTimeout(() => setStatus("success"), 900); // deterministic mock — no backend yet
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <Breadcrumb page="Referral" />

        {/* ═══ HERO — copy left, visual right ═══ */}
        <section className="px-6 pb-14 pt-16 sm:px-8 lg:pb-16 lg:pt-20" style={{ backgroundColor: PK.white }}>
          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] leading-[16px]" style={{ color: PK.slate }}>Referral</p>
              <h1 className="mt-4 max-w-[14ch] text-balance font-normal tracking-[-0.04em] leading-[1.06] text-[clamp(40px,5.6vw,64px)]" style={{ color: PK.ink }}>
                Invite and <span style={{ color: PK.blue }}>grow</span>.
              </h1>
              <p className="mt-6 max-w-[520px] text-pretty text-[17px] leading-[1.65] tracking-[0.1px] sm:text-[18px]" style={{ color: PK.slate }}>
                Share Visionary. Both of you move forward. A good recommendation can change where someone starts.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
                <a href="#start" className="inline-flex h-12 items-center justify-center rounded-full px-8 text-[15px] font-medium tracking-[0.1px] text-white transition-all hover:shadow-[0_1px_3px_rgba(60,64,67,0.3)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ backgroundColor: PK.blue }}>
                  Start referring
                </a>
                <a href="#how" className="group inline-flex items-center gap-1.5 text-[15px] font-medium tracking-[0.1px] underline-offset-4 hover:underline" style={{ color: PK.blue }}>
                  How it works
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className="overflow-hidden rounded-[28px] border bg-[#f8f9fa]" style={{ borderColor: PK.mist }}>
              <SpotIllustration subject="gift" title="Illustration of sharing a gift of learning" className="aspect-[4/3] w-full" />
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS — numbered steps ═══ */}
        <Section tone="canvas" id="how">
          <SectionHead eyebrow="How it works" title="Three steps," accent="both ways forward." />
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-[20px] border bg-white p-7 transition-shadow duration-300 hover:shadow-[0_1px_3px_rgba(60,64,67,0.12),0_4px_12px_rgba(60,64,67,0.08)]" style={{ borderColor: PK.mist }}>
                <div className="flex items-center justify-between">
                  <IconChip Icon={s.Icon} tone={s.tone} />
                  <span className="font-normal tracking-[0.1px] text-[13px]" style={{ color: PK.lightGrey }}>{s.n}</span>
                </div>
                <h3 className="mt-5 text-[19px] font-medium leading-[1.3] tracking-[0.1px]" style={{ color: PK.ink }}>{s.title}</h3>
                <p className="mt-2.5 text-[14.5px] leading-[1.6] tracking-[0.1px]" style={{ color: PK.slate }}>{s.copy}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══ WHO IT'S FOR — illustrated role cards ═══ */}
        <Section id="who" tone="white">
          <SectionHead title="Who it's" accent="for." />
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {ROLES.map((r) => (
              <div key={r.eyebrow} className="overflow-hidden rounded-[20px] border bg-white transition-shadow duration-300 hover:shadow-[0_1px_3px_rgba(60,64,67,0.12),0_4px_12px_rgba(60,64,67,0.08)]" style={{ borderColor: PK.mist }}>
                <div className="border-b" style={{ borderColor: PK.mist }}>
                  <SpotIllustration subject={r.illustration} className="aspect-[16/9] w-full" />
                </div>
                <div className="p-6 sm:p-7">
                  <IconChip Icon={r.Icon} tone={r.tone} size={40} />
                  <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: PK.slate }}>{r.eyebrow}</p>
                  <h3 className="mt-1.5 text-[19px] font-medium leading-[1.3] tracking-[0.1px]" style={{ color: PK.ink }}>{r.title}</h3>
                  <p className="mt-2.5 text-[14.5px] leading-[1.6] tracking-[0.1px]" style={{ color: PK.slate }}>{r.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══ PRINCIPLES ═══ */}
        <Section tone="canvas">
          <SectionHead eyebrow="The program" title="Rewards that respect" accent="both of you." sub="The referral program is built around real moments of help — not clicks." />
          <FeatureGrid items={PRINCIPLES} />
        </Section>

        {/* ═══ START — request access form ═══ */}
        <Section id="start" tone="white" width="narrow">
          <SectionHead eyebrow="Start referring" title="Tell us where to send" accent="your invite." />
          <div className="mt-10 rounded-[24px] border bg-white p-6 sm:p-8" style={{ borderColor: PK.mist }}>
            {status === "error" ? (
              <div className="py-6" role="alert">
                <IconChip Icon={AlertCircle} tone="red" />
                <h3 className="mt-5 text-[24px] font-normal tracking-[-0.02em]" style={{ color: PK.ink }}>We couldn't send that.</h3>
                <p className="mt-3 max-w-[650px] text-[15px] leading-[1.7]" style={{ color: PK.slate }}>
                  A name and a valid email are required so the referrals team can reply to you. Check them and try again.
                </p>
                <button type="button" onClick={() => setStatus("idle")}
                  className="mt-6 inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                  style={{ color: PK.blue }}>
                  Back to the form
                  <ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                </button>
              </div>
            ) : status === "success" ? (
              <div className="py-6">
                <IconChip Icon={CheckCircle2} tone="green" />
                <h3 className="mt-5 text-[24px] font-normal tracking-[-0.02em]" style={{ color: PK.ink }}>Your request is ready.</h3>
                <p className="mt-3 max-w-[660px] text-[15px] leading-[1.7]" style={{ color: PK.slate }}>
                  The referral access flow is represented here, but the production referral backend has not yet been connected.
                </p>
                <button type="button" onClick={() => setStatus("idle")}
                  className="mt-6 inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                  style={{ color: PK.blue }}>
                  Try again
                  <ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="referral-name" className="block text-[13px] font-medium" style={{ color: PK.ink }}>Name</label>
                    <input id="referral-name" type="text" autoComplete="name" required value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                      style={{ borderColor: PK.mist, color: PK.ink }} />
                  </div>
                  <div>
                    <label htmlFor="referral-email" className="block text-[13px] font-medium" style={{ color: PK.ink }}>Email</label>
                    <input id="referral-email" type="email" autoComplete="email" required value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                      style={{ borderColor: PK.mist, color: PK.ink }} />
                  </div>
                </div>
                <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-[560px] text-[12px] leading-[1.6]" style={{ color: PK.slate }}>
                    Referral availability, eligibility, and reward terms should be shown before someone joins the program.
                  </p>
                  <button type="submit" disabled={status === "submitting"}
                    className="inline-flex h-12 shrink-0 items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                    style={{ backgroundColor: PK.blue }}>
                    {status === "submitting" ? "Sending…" : "Continue"}
                    <ArrowUpRight className="ml-2 h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </Section>

        {/* ═══ CONTACT one-liner ═══ */}
        <section id="contact" aria-label="Contact" className="border-t px-6 py-10 sm:px-8" style={{ borderColor: PK.mist }}>
          <div className="mx-auto flex max-w-[1240px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px]" style={{ color: PK.slate }}>Referral questions?</p>
            <a href="mailto:hello@visionary.org.in" className="inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: PK.blue }}>
              hello@visionary.org.in
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <LandingFooter variant="quiet" />
    </div>
  );
}
