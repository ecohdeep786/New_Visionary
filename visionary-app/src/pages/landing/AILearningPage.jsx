import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Minus, Sparkles } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import SpotIllustration from "@/components/landing/SpotIllustration";
import {
  Section, SectionHead, Reveal, useRevealOnce, FAQList, CTABand, PK,
} from "@/components/landing/PageKit";

/* ═══ MODELS — single plan-config fixture (01-PM, Wave L3): src/data/pricingConfig.js ═══ */
import { PLANS, COMPARISON, PERSONA_PLANS, PRICING_FAQ, formatPrice } from "@/data/pricingConfig";

const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* Persona visual identity — one SpotIllustration scene per audience */
const PERSONA_SCENE = {
  student: "student",
  teacher: "teacher",
  parent: "parent",
  professional: "briefcase",
  organization: "team",
};

/* ═══ Billing toggle — Google chip-switch ═══ */
const BillingToggle = React.memo(function BillingToggle({ billing, onChange }) {
  return (
    <div className="mx-auto flex h-11 w-fit items-stretch overflow-hidden rounded-full border bg-white p-0" style={{ borderColor: PK.mist }} role="group" aria-label="Billing period">
      {["monthly", "annual"].map((b) => (
        <button
          key={b}
          type="button"
          aria-pressed={billing === b}
          onClick={() => onChange(b)}
          className={`flex h-full items-center justify-center gap-2 rounded-full px-6 text-[14px] tracking-[0.1px] transition-colors ${billing === b ? "font-medium" : "font-normal hover:bg-[#f8f9fa]"}`}
          style={{ backgroundColor: billing === b ? PK.ink : "transparent", color: billing === b ? "#ffffff" : PK.slate }}
        >
          {b === "monthly" ? "Monthly" : "Annual"}
          {b === "annual" && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-normal uppercase tracking-[0.43px]" style={{ backgroundColor: billing === "annual" ? "#ffffff" : PK.canvas, color: PK.ink }}>
              2 months free
            </span>
          )}
        </button>
      ))}
    </div>
  );
});

/* ═══ Plan card — Google One-style: illustration header, price, checks ═══ */
const PLAN_SCENE = { start: "learn", personal: "growth", family: "parent", institution: "team" };
const PlanCard = React.memo(function PlanCard({ plan, billing }) {
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[24px] border bg-white p-7"
      style={{
        borderColor: plan.highlight ? PK.blue : PK.mist,
        boxShadow: plan.highlight ? "0 12px 32px rgba(66,133,244,0.16)" : "0 1px 3px rgba(60,64,67,0.06), 0 4px 12px rgba(60,64,67,0.05)",
      }}
    >
      {plan.badge && (
        <span className="absolute left-7 top-6 rounded-full px-3 py-1 font-normal uppercase tracking-[0.43px] text-[10px]" style={{ backgroundColor: PK.blue, color: "#ffffff" }}>
          {plan.badge}
        </span>
      )}
      <div className="mx-auto -mb-1 mt-8 w-full max-w-[200px]">
        <SpotIllustration subject={PLAN_SCENE[plan.id] || "compass"} className="aspect-[16/9] w-full" />
      </div>
      <h3 className="mt-4 text-center font-medium tracking-[0.1px] leading-[1.15] text-[22px]" style={{ color: PK.ink }}>{plan.name}</h3>
      <p className="mt-2 text-center font-normal tracking-[0.1px] leading-[1.5] text-[14px]" style={{ color: PK.slate }}>{plan.tagline}</p>

      <div className="mt-6 flex items-baseline justify-center gap-2">
        {(() => {
          const fp = formatPrice(plan, billing);
          return fp.kind === "contact" ? (
            <span className="font-medium tracking-[0] leading-[1.15] text-[clamp(22px,2vw,28px)]" style={{ color: PK.ink }}>{fp.text}</span>
          ) : (
            <>
              <span className="font-medium tracking-[-0.02em] leading-[1] text-[clamp(32px,3vw,44px)]" style={{ color: PK.ink }}>{fp.text}</span>
              <span className="font-normal tracking-[0.1px] text-[14px]" style={{ color: PK.slate }}>/ month</span>
            </>
          );
        })()}
      </div>
      <p className="mt-1 text-center font-normal tracking-[0.1px] leading-[16px] text-[12px]" style={{ color: PK.lightGrey }}>
        {billing === "annual" && plan.annual !== null && plan.annual > 0
          ? `Billed yearly (₹${plan.annualTotal}) · 2 months free`
          : plan.monthly === 0
            ? "Free forever · no card required"
            : plan.monthly === null
              ? "Pricing shaped with you · pilots available"
              : "Billed monthly"}
      </p>

      <Link
        to={plan.to}
        className={`mt-7 inline-flex h-11 items-center justify-center rounded-full px-8 font-medium tracking-[0.1px] text-[15px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 ${
          plan.highlight ? "text-white hover:shadow-[0_1px_3px_rgba(60,64,67,0.3)] active:scale-[0.98]" : "border hover:bg-[#f8f9fa]"
        }`}
        style={plan.highlight ? { backgroundColor: PK.blue } : { border: `1px solid ${PK.mist}`, color: PK.ink }}
      >
        {plan.cta}
      </Link>

      <ul className="mt-7 space-y-3 border-t pt-7" style={{ borderColor: `${PK.ink}12` }}>
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} style={{ color: PK.blue }} aria-hidden="true" />
            <span className="font-normal tracking-[0.1px] leading-[1.5] text-[14px]" style={{ color: PK.ink }}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

/* ═══ 01 · HERO + 02 · PLANS ═══ */
function PricingPlansSection() {
  const { ref, visible } = useRevealOnce();
  const [billing, setBilling] = useState("annual");
  return (
    <section ref={ref} className="relative overflow-hidden px-6 pb-16 pt-16 sm:px-8 lg:pb-24 lg:pt-20" style={{ fontFamily: FONT_FAMILY, backgroundColor: PK.white }}>
      <Reveal visible={visible}>
        <SectionHead
          as="h1"
          eyebrow="Pricing"
          title="Plans for"
          accent="every learner."
          sub="Start free. Upgrade when it's working for you."
        />
        <div className="mt-10"><BillingToggle billing={billing} onChange={setBilling} /></div>

        <div className="mx-auto mt-12 grid w-full max-w-[1240px] grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 lg:gap-6">
          {PLANS.map((p) => (<PlanCard key={p.id} plan={p} billing={billing} />))}
        </div>

        <p className="mt-8 text-center font-normal tracking-[0.1px] leading-[16px] text-[12px]" style={{ color: PK.lightGrey }}>
          Prices in INR · Regional pricing at checkout · Education discounts available
        </p>
      </Reveal>
    </section>
  );
}

/* ═══ 03 · PERSONA STRIP — which plan is for you (illustrated) ═══ */
function PricingPersonaSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <Section tone="canvas">
      <Reveal visible={visible}>
        <SectionHead title="Every journey has" accent="a plan." />
        <div className="mx-auto mt-12 grid w-full max-w-[1240px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
          {PERSONA_PLANS.map((p) => (
            <Link
              key={p.persona}
              to={p.to}
              className="group flex flex-col rounded-[20px] border bg-white p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-[0_1px_3px_rgba(60,64,67,0.12),0_6px_16px_rgba(60,64,67,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
              style={{ borderColor: PK.mist }}
            >
              <div className="mx-auto w-full max-w-[140px] overflow-hidden rounded-[16px]">
                <SpotIllustration subject={PERSONA_SCENE[p.persona?.toLowerCase()] || "compass"} className="aspect-[4/3] w-full" />
              </div>
              <p className="mt-4 font-medium uppercase tracking-[0.16em] leading-[14px] text-[11px]" style={{ color: PK.slate }}>{p.persona}</p>
              <p className="mt-2 font-medium tracking-[0.1px] leading-[1.2] text-[19px]" style={{ color: PK.ink }}>{p.plan}</p>
              <p className="mt-2 font-normal tracking-[0.1px] leading-[1.5] text-[13px]" style={{ color: PK.slate }}>{p.note}</p>
              <span className="mt-5 font-normal tracking-[0.1px] leading-[22px] text-[14px] group-hover:underline" style={{ color: PK.blue }}>See your page</span>
            </Link>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

/* ═══ 04 · COMPARISON TABLE ═══ */
function CellValue({ value }) {
  if (value === true) return <Check className="mx-auto h-5 w-5" strokeWidth={2.2} style={{ color: PK.blue }} aria-hidden="true" />;
  if (value === false) return <Minus className="mx-auto h-5 w-5" strokeWidth={2} style={{ color: PK.lightGrey }} aria-hidden="true" />;
  return <span className="font-normal tracking-[0.1px] text-[14px]" style={{ color: PK.ink }}>{value}</span>;
}
function PricingComparisonSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <Section tone="white">
      <Reveal visible={visible}>
        <SectionHead title="See exactly" accent="what you get." />
        <div className="mx-auto mt-12 w-full max-w-[1240px] overflow-x-auto rounded-[24px] border bg-white" style={{ borderColor: PK.mist }}>
          <table className="w-full min-w-[760px] border-collapse text-center">
            <thead>
              <tr className="border-b" style={{ borderColor: PK.mist }}>
                <th scope="col" className="px-6 py-6 text-left font-medium tracking-[0.1px] text-[15px]" style={{ color: PK.ink }}>Features</th>
                {["Start", "Personal", "Family", "Institution"].map((h) => (
                  <th key={h} scope="col" className="px-6 py-6 font-medium tracking-[0.1px] text-[15px]" style={{ color: h === "Personal" ? PK.blue : PK.ink }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} className={i < COMPARISON.length - 1 ? "border-b" : ""} style={{ borderColor: `${PK.ink}12` }}>
                  <th scope="row" className="px-6 py-4 text-left font-normal tracking-[0.1px] text-[14px]" style={{ color: PK.ink }}>{row.feature}</th>
                  <td className="px-6 py-4"><CellValue value={row.start} /></td>
                  <td className="px-6 py-4"><CellValue value={row.personal} /></td>
                  <td className="px-6 py-4"><CellValue value={row.family} /></td>
                  <td className="px-6 py-4"><CellValue value={row.institution} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </Section>
  );
}

/* ═══ 05 · TRUST BAND ═══ */
function PricingTrustBand() {
  return (
    <Section tone="white" pad="tight">
      <div className="mx-auto flex w-fit max-w-full flex-col items-center gap-4 rounded-full px-10 py-5 sm:flex-row" style={{ backgroundColor: PK.canvas }}>
        <Sparkles className="h-5 w-5 shrink-0" strokeWidth={1.8} style={{ color: PK.blue }} aria-hidden="true" />
        <p className="text-center font-normal tracking-[0.1px] text-[15px]" style={{ color: PK.ink }}>
          Cancel anytime · Your memory stays yours · Education discounts for students &amp; teachers
        </p>
      </div>
    </Section>
  );
}

/* ═══ 06 · FAQ ═══ */
function PricingFAQSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <Section tone="canvas" width="narrow">
      <Reveal visible={visible}>
        <SectionHead eyebrow="FAQ" title="Questions about pricing," accent="answered." />
        <div className="mt-10">
          <FAQList items={PRICING_FAQ} />
        </div>
      </Reveal>
    </Section>
  );
}

/* ═══ PAGE — universal for all users, quiet footer ═══ */
export default function AILearningPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <Breadcrumb page="Pricing" />
      <main id="main">
        <PricingPlansSection />
        <PricingPersonaSection />
        <PricingComparisonSection />
        <PricingTrustBand />
        <PricingFAQSection />
        <CTABand
          title="Your journey is already happening."
          accent="Start free."
          sub="Begin with a question today. Upgrade only when Visionary has earned it."
          primary={{ label: "Get started", to: "/register" }}
          secondary={{ label: "Talk to sales", to: "/about" }}
        />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
