import { ShieldCheck, BadgeCheck, Eye, Users, Flag, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { COLORS, FONT_FAMILY, useRevealOnce, FadeReveal, GreyTag } from "@/components/landing/AboutPageShared";
import SpotIllustration from "@/components/landing/SpotIllustration";
import { LEGAL_META, RESPONSE_TIMES } from "@/data/legalMeta";
import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";

/* ═══ SAFETY PRINCIPLES — each paired with an illustration (Google pattern) ═══ */
const SAFETY_PILLARS = [
  { id: "age-gates", n: "01", Icon: ShieldCheck, subject: "shield", title: "Age-appropriate by default.", copy: "Every answer is checked against guidance for the learner's age — before it reaches them. No overrides, no exceptions." },
  { id: "safe-default", n: "02", Icon: BadgeCheck, subject: "lock", title: "Safety is on from the first question.", copy: "You never enable or disable a safety setting. They're always there — built into every interaction, every model call, every response." },
  { id: "flag-review", n: "03", Icon: Eye, subject: "document", title: "You can flag anything.", copy: "One tap on any answer flags it for human review. We act on every report — usually within 24 hours." },
  { id: "family-controls", n: "04", Icon: Users, subject: "community", title: "Family controls, when you need them.", copy: "Parents and guardians can set boundaries that shape what younger learners see and do — without changing the default safety posture." },
  { id: "transparent-review", n: "05", Icon: Flag, subject: "history", title: "Reviewed, not hidden.", copy: "Our safety policies are reviewed regularly and updated as we learn from real use — just like the product itself." },
];

/* ═══ HERO SECTION — Google style: statement + illustration ═══ */
function SafetyHero() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative overflow-hidden px-6 pb-16 pt-40 lg:pb-24 lg:pt-48" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Safety</GreyTag>
        <h1 className="mx-auto mt-6 max-w-[1080px] text-center font-normal tracking-[-0.045em] leading-[1.06] text-[48px] sm:text-[64px] lg:text-[76px]" style={{ color: COLORS.ink }}>
          Safe by <span style={{ color: COLORS.ink }}>design.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          Guardrails for every learner, by age. Protection is the default — not a setting.
        </p>

        {/* Illustration — safety shield scene */}
        <div className="mx-auto mt-20 flex justify-center">
          <div className="relative flex h-[220px] w-[220px] items-center justify-center rounded-[32px] border" style={{ borderColor: COLORS.mist }}>
            <SpotIllustration subject="shield" className="h-[176px] w-[176px]" title="A shield protects young learners by age" />
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ NUMBERED PILLARS — statement + illustration for each (Google numbered section pattern) ═══ */
function SafetyPillarsSection() {
  return (
    <div className="mx-auto grid w-full max-w-[1240px] gap-16">
      {SAFETY_PILLARS.map((p) => (
        <div key={p.id} className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className={p.n ? "" : ""}>
            <p className="font-medium tracking-[0] text-[13px]" style={{ color: COLORS.lightGrey }}>{p.n}</p>
            <h3 className="mt-2 font-medium tracking-[0] leading-[1.2] text-[clamp(22px,2.4vw,32px)]" style={{ color: COLORS.ink }}>{p.title}</h3>
            <p className="mt-[calc(clamp(22px,2.4vw,32px)*0.545)] max-w-[560px] font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>{p.copy}</p>
          </div>
          <div className="flex justify-center">
            <div className="flex h-[128px] w-[128px] items-center justify-center rounded-[20px] border" style={{ borderColor: COLORS.mist }}>
              <SpotIllustration subject={p.subject} className="h-[96px] w-[96px]" title={p.title} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══ SAFETY TOOLS — flat icon chips (Google safety tools strip) ═══ */
const SAFETY_TOOLS = [
  { Icon: Users, t: "Family controls" },
  { Icon: Flag, t: "Report anything" },
  { Icon: BadgeCheck, t: "Safe by default" },
  { Icon: ShieldCheck, t: "Reviewed guidance" },
  { Icon: Clock, t: "24h response time" },
];

function SafetyToolsSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative border-y bg-white px-6 py-20 lg:py-28" style={{ borderColor: COLORS.mist, fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto flex w-full max-w-[1080px] flex-col items-center gap-6 text-center">
          <GreyTag>Safety tools</GreyTag>
          <h2 className="mt-4 font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink }}>
            Built into every <span style={{ color: COLORS.ink }}>interaction.</span>
          </h2>
          <p className="mt-5 max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
            Safeguards are on from the first question. Nothing to configure, nothing to remember to turn on.
          </p>

          <div className="mx-auto mt-16 flex w-full max-w-[760px] flex-wrap items-center justify-center gap-3">
            {SAFETY_TOOLS.map(({ Icon, t }) => (
              <span key={t} className="flex items-center gap-2 rounded-full border bg-white px-5 py-2.5 font-normal tracking-[0.24px] text-[13px]" style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                <Icon className="h-4 w-4" strokeWidth={1.8} style={{ color: COLORS.blue }} /> {t}
              </span>
            ))}
          </div>

          <p className="mt-8 max-w-[760px] font-normal tracking-[0] leading-[1.7] text-[15px]" style={{ color: COLORS.grey }}>
            {RESPONSE_TIMES.safety}
          </p>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ CTA ═══ */
function SafetyCTA() {
  return (
    <section className="relative border-t bg-white px-6 py-28 lg:py-36" style={{ borderColor: COLORS.mist, fontFamily: FONT_FAMILY }}>
      <div className="mx-auto flex max-w-[1080px] flex-col items-center gap-10 text-center">
        <div>
          <GreyTag>Take action</GreyTag>
          <h2 className="mt-4 font-normal tracking-[-0.03em] leading-[1.12] text-[36px] sm:text-[48px]" style={{ color: COLORS.ink }}>
            Have a safety concern? <span style={{ color: COLORS.ink }}>We respond fast.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
            Report anything that feels wrong. A human reviews every report — usually within 24 hours.
          </p>
        </div>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/contact" className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: COLORS.blue }}>
            Contact safety
          </Link>
          <Link to="/privacy" className="inline-flex h-14 items-center justify-center rounded-full border px-10 font-medium tracking-[0] text-[16px] transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
            Read privacy policy
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══ PAGE ═══ */
export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <Breadcrumb page="Safety" />
      <SafetyHero />

      {/* "How we protect you" — numbered pillars with illustrations */}
      <section className="relative bg-white px-6 py-28 lg:py-36">
        <div className="mx-auto max-w-[1240px]">
          <FadeReveal visible={true}>
            <GreyTag className="text-center">How we protect you</GreyTag>
            <h2 className="mx-auto mt-6 max-w-[1080px] text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink }}>
              Protection is the default, <span style={{ color: COLORS.ink }}>not a setting.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
              You shouldn't have to configure safety. It should be there before you ask your first question.
            </p>
            <div className="mt-20">
              <SafetyPillarsSection />
            </div>
          </FadeReveal>
        </div>
      </section>

      {/* "Safety tools" — flat chip strip */}
      <SafetyToolsSection />

      {/* "Last updated" + CTA */}
      <p className="pb-6 text-center text-[13px] tracking-[0.24px]" style={{ color: "#5f6368" }}>
        Last updated: <strong style={{ color: "#121317" }}>{LEGAL_META.safety.lastUpdated}</strong>
      </p>
      <SafetyCTA />
    <LandingFooter variant="quiet" />
    </div>
  );
};

export { SafetyHero, SafetyPillarsSection, SafetyToolsSection, SafetyCTA, SAFETY_PILLARS };