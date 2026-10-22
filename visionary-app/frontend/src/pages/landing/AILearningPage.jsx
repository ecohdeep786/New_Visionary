import React, { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, Minus, Sparkles } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import { ChevronIcon } from "@/components/landing/persona/PersonaSections";
import studentImage from "@/assets/student-face-main.webp";
import teacherImage from "@/assets/teacher-face-main.webp";
import parentImage from "@/assets/parent-face-main.webp";
import professionalImage from "@/assets/professional-face-main.webp";
import organizationImage from "@/assets/organization-face-main.webp";


/* ═══ DESIGN TOKENS (same system) ═══ */
const COLORS = {
  ink: "#1d1d1f",
  surface: "#f5f5f7",
  blue: "#0066cc",
  grey: "#6e6e73",
  slate: "#6e6e73",
  lightGrey: "#86868b",
  mist: "rgba(18,19,23,0.12)",
  white: "#ffffff",
};
const PERSONA_IMAGES = {
  Student: studentImage,
  Teacher: teacherImage,
  Parent: parentImage,
  Professional: professionalImage,
  Organization: organizationImage,
};

/* ═══ CONTROLLERS ═══ */
function useRevealOnce(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const hasRevealed = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (hasRevealed.current) { setVisible(true); return undefined; }
    if (!node) { setVisible(true); return undefined; }
    if (typeof IntersectionObserver === "undefined") { setVisible(true); hasRevealed.current = true; return undefined; }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRevealed.current) { setVisible(true); hasRevealed.current = true; observer.disconnect(); }
      },
      { threshold: 0, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}
const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

/* ═══ MODELS — single plan-config fixture (01-PM, Wave L3): src/data/pricingConfig.js ═══ */
import { PLANS, COMPARISON, PERSONA_PLANS, PRICING_FAQ, formatPrice } from "@/data/pricingConfig";
import { billingPath } from '@/lib/billingIntent';
import { fontStack } from "@/components/landing/system/tokens";


/* ═══ Billing toggle — same ink-pill language as site tabs ═══ */
const BillingToggle = React.memo(function BillingToggle({ billing, onChange }) {
  return (
    <div className="flex w-fit max-w-full items-stretch rounded-full bg-white p-1" role="group" aria-label="Billing period">
      {["monthly", "annual"].map((b) => {
        const active = billing === b;
        return (
          <button
            key={b}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(b)}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-[14px] tracking-[0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 sm:px-5 ${active ? "bg-[#1d1d1f] font-medium text-white" : "font-normal text-[#6e6e73] hover:bg-[#f5f5f7]"}`}
          >
            {b === "monthly" ? "Monthly" : "Annual"}
            {b === "annual" && (
              <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium tracking-[0] ${active ? "bg-white/15 text-white" : "bg-[#f5f5f7] text-[#6e6e73]"}`}>
                2 months free
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});

/* ═══ Plan card — a quiet white module on the grey field; the recommended
   plan is the one with the ink chip and the ink pill ═══ */
const PlanCard = React.memo(function PlanCard({ plan, billing }) {
  const price = billing === "annual" ? plan.annual : plan.monthly;
  return (
    <div
      className="relative flex h-full flex-col rounded-[20px] bg-white p-6 sm:p-7 xl:p-8"
    >
      <div className="mb-2 flex h-6 items-center">
        {plan.badge && <span className="rounded-full bg-[#1d1d1f] px-2.5 py-1 text-[12px] font-medium leading-none text-white">{plan.badge}</span>}
      </div>
      <h3 className="text-[24px] font-semibold leading-[1.12] tracking-[0.009em]" style={{ color: COLORS.ink }}>{plan.name}</h3>
      <p className="mt-2 min-h-[44px] font-normal leading-[1.5] text-[14px]" style={{ color: COLORS.grey }}>{plan.tagline}</p>

      <div className="mt-5 flex min-h-[50px] flex-wrap items-baseline gap-x-2 gap-y-0">
        {(() => {
          const fp = formatPrice(plan, billing);
          return fp.kind === "contact" ? (
            <span className="font-medium tracking-[0] leading-[1.15] text-[clamp(22px,2vw,28px)]" style={{ color: COLORS.ink }}>{fp.text}</span>
          ) : (
            <>
              <span className="font-medium tracking-[-0.035em] leading-[1] text-[clamp(36px,3vw,44px)]" style={{ color: COLORS.ink }}>{fp.text}</span>
              <span className="font-normal tracking-[0] text-[14px]" style={{ color: COLORS.grey }}>/ month</span>
            </>
          );
        })()}
      </div>
      <p className="mt-1 min-h-[32px] font-normal tracking-[0] leading-[16px] text-[12px]" style={{ color: COLORS.grey }}>
        {price === null
          ? "Pricing shaped with you · pilots available"
          : price === 0
            ? "Free forever · no card required"
            : billing === "annual"
              ? `Billed yearly (₹${plan.annualTotal}) · 2 months free`
              : "Billed monthly"}
      </p>

      <Link
        to={['personal', 'family'].includes(plan.id) ? billingPath(plan.id, billing) : plan.to}
        className={`mt-5 inline-flex h-11 items-center justify-center rounded-full px-[21px] text-center font-medium tracking-[-0.011em] text-[17px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 ${
          plan.highlight
            ? "bg-[#1d1d1f] text-white hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] active:bg-[#18181a]"
            : "bg-[rgba(0,0,0,0.08)] text-[#1d1d1f] hover:scale-[1.01] hover:bg-[rgba(0,0,0,0.13)] active:scale-[0.98]"
        }`}
      >
        {plan.cta}
      </Link>

      <p className="mt-7 border-t pt-6 text-[14px] font-medium" style={{ borderColor: COLORS.mist, color: COLORS.ink }}>What’s included</p>
      <ul className="mt-4 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} style={{ color: COLORS.blue }} />
            <span className="font-normal tracking-[0] leading-[1.5] text-[14px]" style={{ color: COLORS.ink }}>{f}</span>
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
    <section ref={ref} data-section="01-hero" className="relative px-4 pb-20 pt-24 sm:px-6 lg:px-[var(--frame-x)] lg:pb-24 lg:pt-28" style={{ fontFamily: fontStack }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto max-w-[1440px] text-center">
          <h1 className="mx-auto max-w-[24ch] text-balance text-center font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink }}>
            Plans for <span className="accent-gradient">every journey</span>.
          </h1>
          <p className="mx-auto max-w-[760px] text-[17px] font-normal leading-[25px] text-[#6e6e73]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
            Start free. Find the right fit for yourself, your family, or your organization.
          </p>
        </div>
        <div className="mx-auto mt-12 w-full max-w-[1440px] rounded-[30px] bg-[#f5f5f7] p-4 sm:p-6 lg:p-10">
          <div className="flex flex-col items-center gap-3 px-2 pb-6 sm:px-1 lg:pb-8">
            <BillingToggle billing={billing} onChange={setBilling} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((p) => (<PlanCard key={p.id} plan={p} billing={billing} />))}
          </div>
          <p className="px-2 pt-5 text-center text-[12px] leading-[1.5] sm:text-left" style={{ color: COLORS.grey }}>
            Prices in INR · Taxes may apply · Education discounts available
          </p>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 03 · PERSONA STRIP — which plan is for you ═══ */
function PricingPersonaSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} data-section="02-persona" className="relative bg-white px-6" style={{ fontFamily: fontStack }}>
      <FadeReveal visible={visible}>
        <h2 className="mx-auto max-w-[20ch] text-balance text-center font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>Every journey has a plan.</h2>
        <div className="mx-auto mt-12 w-full max-w-[1280px] rounded-[30px] bg-[#f5f5f7] p-4 sm:p-6 lg:p-10">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PERSONA_PLANS.map((p) => (
            <Link key={p.persona} to={p.to} className="group relative flex h-full flex-col overflow-hidden rounded-[20px] bg-white p-6 pb-16 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(60,64,67,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]">
              <div className="mb-5 flex h-36 items-center justify-center overflow-hidden rounded-[18px] bg-white">
                <img src={PERSONA_IMAGES[p.persona]} alt="" loading="lazy" className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" />
              </div>
              <p className="font-normal tracking-[0] leading-[1.4] text-[16px]" style={{ color: COLORS.grey }}>{p.persona}</p>
              <p className="mt-4 font-medium tracking-[0] leading-[1.2] text-[20px]" style={{ color: COLORS.ink }}>{p.plan}</p>
              <p className="mt-2 font-normal tracking-[0] leading-[1.5] text-[13px]" style={{ color: COLORS.grey }}>{p.note}</p>
              {/* google.com card curve — tint sweeps into the white corner and the card's arrow floats in it with breath */}
              <div aria-hidden="true" className="absolute bottom-0 right-0 h-[56px] w-[92px] rounded-tl-[20px] bg-white"  />
              <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center"><ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" style={{ color: COLORS.blue }} aria-hidden="true" /></div>
            </Link>
          ))}
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 04 · COMPARISON TABLE ═══ */
function CellValue({ value }) {
  if (value === true) return <Check className="mx-auto h-5 w-5" strokeWidth={2} style={{ color: COLORS.blue }} />;
  if (value === false) return <Minus className="mx-auto h-5 w-5" strokeWidth={2} style={{ color: COLORS.lightGrey }} />;
  return <span className="font-normal tracking-[0] text-[14px]" style={{ color: COLORS.ink }}>{value}</span>;
}
function PricingComparisonSection() {
  const { ref, visible } = useRevealOnce();
  return (
    
    <section ref={ref} data-section="03-compare" className="relative px-6" style={{fontFamily: fontStack }}>
      <FadeReveal visible={visible}>
        <h2 className="mx-auto max-w-[20ch] text-balance text-center font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>See exactly what you get.</h2>
        <p className="mx-auto mt-6 max-w-[1240px] text-right text-[12px] text-[#6e6e73] md:hidden">Scroll to compare all plans →</p>
        <div className="mx-auto mt-10 w-full max-w-[1240px] overflow-x-auto rounded-[20px] md:mt-12">
          <table className="w-full min-w-[760px] border-collapse text-center">
            <thead>
              <tr className="border-b bg-[#f5f5f7]" style={{ borderColor: COLORS.mist }}>
                <th scope="col" className="px-6 py-6 text-left font-medium tracking-[0] text-[16px]" style={{ color: COLORS.ink }}>Features</th>
                {["Start", "Personal", "Family", "Institution"].map((h) => (
                  <th key={h} scope="col" className="px-6 py-6 font-medium tracking-[0] text-[16px]" style={{ color: h === "Personal" ? COLORS.blue : COLORS.ink }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} className={i < COMPARISON.length - 1 ? "border-b" : ""} style={{ borderColor: `${COLORS.ink}14` }}>
                  <th scope="row" className="px-6 py-5 text-left font-normal tracking-[0] text-[14px]" style={{ color: COLORS.ink }}>{row.feature}</th>
                  <td className="px-6 py-5"><CellValue value={row.start} /></td>
                  <td className="px-6 py-5"><CellValue value={row.personal} /></td>
                  <td className="px-6 py-5"><CellValue value={row.family} /></td>
                  <td className="px-6 py-5"><CellValue value={row.institution} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 05 · TRUST BAND ═══ */
function PricingTrustBand() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-12" style={{ fontFamily: fontStack }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto flex w-fit max-w-full flex-col items-center gap-4 rounded-full px-10 py-6 sm:flex-row" style={{ backgroundColor: COLORS.surface }}>
          <Sparkles className="h-5 w-5 shrink-0" strokeWidth={1.8} style={{ color: COLORS.blue }} />
          <p className="text-center font-normal tracking-[0.24px] text-[16px]" style={{ color: COLORS.ink }}>
            Cancel anytime · Your memory stays yours · Education discounts for students & teachers
          </p>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 06 · FAQ ═══ */
function PricingFAQSection() {
  const { ref, visible } = useRevealOnce();
  const [open, setOpen] = useState(-1);
  const toggle = useCallback((i) => setOpen((cur) => (cur === i ? -1 : i)), []);
  return (
    <section ref={ref} data-section="04-faq" className="relative bg-white px-6" style={{ fontFamily: fontStack }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <div>
            <p className="text-[18px] font-medium" style={{ color: COLORS.grey }}>FAQ</p>
            <h2 className="mt-[var(--gap-eyebrow-title-display)] max-w-[24ch] text-balance font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink }}>
              Questions about pricing, answered.
            </h2>
          </div>
          <div className="border-t" style={{ borderColor: COLORS.mist }}>
            {PRICING_FAQ.map((item, i) => (
              <div key={item.q} className="border-b" style={{ borderColor: COLORS.mist }}>
                <button id={`pricing-faq-question-${i}`} type="button" aria-controls={`pricing-faq-answer-${i}`} aria-expanded={open === i} onClick={() => toggle(i)} className="flex w-full items-center justify-between gap-6 rounded-[8px] py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2">
                  <span className="text-[19px] font-normal leading-[1.35] sm:text-[20px]" style={{ color: COLORS.ink }}>{item.q}</span>
                  <ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 text-[#6e6e73] transition-transform duration-300 motion-reduce:transition-none ${open === i ? "rotate-180" : ""}`} />
                </button>
                <div id={`pricing-faq-answer-${i}`} aria-labelledby={`pricing-faq-question-${i}`} aria-hidden={open !== i} className={`grid transition-all duration-300 ease-google motion-reduce:transition-none ${open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="max-w-[640px] pb-6 pr-8 text-[16px] leading-[1.65]" style={{ color: COLORS.grey }}>{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}


/* ═══ 07 · FINAL CTA — statement, one ink pill, one quiet path ═══ */
function PricingCTASection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} data-section="05-cta" className="relative rounded-t-[32px] px-6" style={{ backgroundColor: COLORS.surface, fontFamily: fontStack }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <h2 className="mx-auto max-w-[24ch] text-balance font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink }}>Your journey is already happening, so start free.</h2>
        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/register" className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-[#1d1d1f] px-[21px] font-medium tracking-[-0.011em] text-[17px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] active:bg-[#18181a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px]">
            Get started
          </Link>
          <Link to="/contact" className="inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap px-4 text-[17px] font-normal tracking-[-0.011em] text-[#0066cc] transition-colors duration-200 hover:text-[#0071e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px]">
            Talk to sales
            <ChevronIcon className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-8 text-center font-normal tracking-[0] text-[14px] leading-[1.5]" style={{ color: COLORS.grey }}>
          Upgrade only when Visionary has earned it.
        </p>
      </div>
    </section>
  );
}

/* ═══ PAGE — universal for all users, quiet footer ═══ */
export default function AILearningPage() {
  return (
    <div className="page-pricing min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <Breadcrumb page="Pricing" />
      <main id="main">
        <PricingPlansSection />
        <PricingPersonaSection />
        <PricingComparisonSection />
        <PricingTrustBand />
        <PricingFAQSection />
        <PricingCTASection />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
