import React, { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, Minus, Sparkles } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import LazyImage from "@/components/landing/LazyImage";
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
    <div className={`transition-all duration-700 ease-apple ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
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
            className={`flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-[14px] tracking-[0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 sm:px-5 ${active ? "bg-[#1d1d1f] font-medium text-white" : "font-normal text-[#6e6e73] hover:bg-[#f5f5f7]"}`}
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

/* ═══ Comparison cell — the store-grade row values; strings render the
   entitlement word for word, booleans the quiet ✓/– (truth: pricingConfig) ═══ */
const CellValue = React.memo(function CellValue({ value }) {
  if (value === true) return <Check className="mx-auto h-5 w-5" strokeWidth={2} style={{ color: COLORS.blue }} />;
  if (value === false) return <Minus className="mx-auto h-5 w-5" strokeWidth={2} style={{ color: COLORS.lightGrey }} />;
  return <span className="font-normal tracking-[-0.022em] text-[17px]" style={{ color: COLORS.ink }}>{value}</span>;
});

/* ═══ Store-grade pricing table (FAP-48). One hairline table under the
   statement: the sticky plan-header band (name, tagline, the 28px price with
   its 12px fine print, the commerce-blue action) followed by the COMPARISON
   rows verbatim at 17px — pricingConfig stays the single source; neither
   billing routing nor the toggle changes. Below lg the table swipes inside
   its wrapper with the feature column pinned; at ≥lg the columns fit and the
   header band sticks to the page scroll under the fixed nav (h-14). ═══ */
function PricingStoreSection() {
  const { ref, visible } = useRevealOnce();
  const [billing, setBilling] = useState("annual");
  const plans = PLANS.filter((p) => p.id !== "institution");
  const institution = PLANS.find((p) => p.id === "institution");
  return (
    <section ref={ref} data-section="01-hero" className="relative px-4 pb-16 pt-24 sm:px-6 lg:px-[var(--frame-x)] lg:pb-20 lg:pt-28" style={{ fontFamily: fontStack }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto max-w-[1440px] text-center">
          <h1 className="mx-auto max-w-[24ch] text-balance text-center font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink }}>
            Plans for <span className="accent-gradient">every journey</span>.
          </h1>
          <p className="mx-auto max-w-[760px] text-[17px] font-normal leading-[25px] text-[#6e6e73]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
            Start free. Find the right fit for yourself, your family, or your organization.
          </p>
        </div>
        <div className="mx-auto mt-12 w-full max-w-[1240px]">
          <div className="flex flex-col items-center gap-3 pb-8">
            <BillingToggle billing={billing} onChange={setBilling} />
          </div>
          <div data-overflow className="overflow-x-auto lg:overflow-visible">
            <table data-b3="plan" className="w-full min-w-[860px] border-collapse text-center lg:min-w-0">
              <thead>
                <tr>
                  <th scope="col" aria-label="Plan features" className="sticky left-0 top-14 z-20 w-[210px] min-w-[190px] bg-white align-bottom lg:w-auto" />
                  {plans.map((p) => (
                    <th key={p.id} scope="col" className="sticky top-14 z-10 min-w-[210px] bg-white px-5 align-bottom">
                      <div className="flex flex-col items-stretch pb-6 pt-2 text-center">
                        <div className="flex h-7 items-center justify-center">
                          {p.badge && <span className="rounded-full bg-[#1d1d1f] px-2.5 py-1 text-[12px] font-medium leading-none text-white">{p.badge}</span>}
                        </div>
                        <h2 className="mt-2 text-[21px] font-semibold leading-[1.19] tracking-[-0.009em]" style={{ color: COLORS.ink }}>{p.name}</h2>
                        <p className="mt-1.5 min-h-[40px] text-[14px] font-normal leading-[1.43]" style={{ color: COLORS.grey }}>{p.tagline}</p>
                        <div className="mt-4">
                          {(() => {
                            const fp = formatPrice(p, billing);
                            return (
                              <div data-b3="price" className="whitespace-nowrap font-medium leading-[1.15] tracking-[-0.022em] text-[28px]" style={{ color: COLORS.ink }}>
                                {fp.text}
                              </div>
                            );
                          })()}
                          <p data-b3="fine" className="mt-1 min-h-[18px] text-[12px] font-normal leading-[1.5]" style={{ color: COLORS.grey }}>
                            {billing === "annual"
                              ? p.annual === 0
                                ? "Free forever · no card required"
                                : `Billed yearly (₹${p.annualTotal}) · 2 months free`
                              : p.monthly === 0
                                ? "Free forever · no card required"
                                : p.priceNote.paid}
                          </p>
                        </div>
                        <Link
                          data-b3="cta"
                          to={["personal", "family"].includes(p.id) ? billingPath(p.id, billing) : p.to}
                          className="mt-5 inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-[#0066cc] px-[21px] text-center text-[17px] leading-[1.176] font-medium tracking-[-0.011em] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#0071e3] active:scale-[0.98] active:bg-[#006edb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                        >
                          {p.cta}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-t" style={{ borderColor: "rgba(18,19,23,0.12)" }}>
                    <th scope="row" className="sticky left-0 bg-white px-4 py-4 text-left align-middle sm:px-6">
                      <span className="text-[17px] font-normal leading-[1.47] tracking-[-0.022em]" style={{ color: COLORS.ink }}>{row.feature}</span>
                    </th>
                    <td className="px-5 py-4 align-middle"><CellValue value={row.start} /></td>
                    <td className="px-5 py-4 align-middle"><CellValue value={row.personal} /></td>
                    <td className="px-5 py-4 align-middle"><CellValue value={row.family} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-[12px] leading-[1.5]" style={{ color: COLORS.grey }}>
            Prices in INR · Taxes may apply · Education discounts available
          </p>

          {/* Institution — contact-shaped, priced-inside-config null: its own
             quiet band under the table, entitlements verbatim from config. */}
          <div className="mt-12 border-t pt-10" style={{ borderColor: COLORS.mist }}>
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-[21px] font-semibold leading-[1.19] tracking-[-0.009em]" style={{ color: COLORS.ink }}>{institution.name}</p>
                <p className="mt-1 text-[14px] leading-[1.43]" style={{ color: COLORS.grey }}>{institution.tagline}</p>
                <p className="mt-3 max-w-[760px] text-[17px] leading-[1.47] tracking-[-0.022em]" style={{ color: COLORS.ink }}>
                  {institution.features.join(" · ")}
                </p>
                <p data-b3="fine" className="mt-2 text-[12px] leading-[1.5]" style={{ color: COLORS.grey }}>
                  Pricing shaped with you · pilots available
                </p>
              </div>
              <Link
                data-b3="cta"
                to={institution.to}
                className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#0066cc] px-[21px] text-center text-[17px] leading-[1.176] font-medium tracking-[-0.011em] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#0071e3] active:scale-[0.98] active:bg-[#006edb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
              >
                {institution.cta}
              </Link>
            </div>
          </div>
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
                <LazyImage src={PERSONA_IMAGES[p.persona]} alt="" className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" />
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

/* ═══ 04 · TRUST BAND ═══ */
function PricingTrustBand() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} data-section="03-trust" className="relative bg-white px-6 py-12" style={{ fontFamily: fontStack }}>
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

/* ═══ 05 · FAQ — the shared accordion resolve curve (grid-rows + ease-apple ═══ */
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
                {/* visibility (not display) keeps the grid-rows resolve while
                    the collapsed row stays out of the tab/a11y order */}
                <div id={`pricing-faq-answer-${i}`} aria-labelledby={`pricing-faq-question-${i}`} aria-hidden={open !== i} className={`grid transition-all duration-500 ease-apple motion-reduce:transition-none ${open === i ? "grid-rows-[1fr] opacity-100 visible" : "grid-rows-[0fr] opacity-0 invisible"}`}>
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


/* ═══ 06 · FINAL CTA — statement, one ink pill, one quiet path ═══ */
function PricingCTASection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} data-section="05-cta" className="relative rounded-t-[32px] px-6" style={{ backgroundColor: COLORS.surface, fontFamily: fontStack }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-apple ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <h2 className="mx-auto max-w-[24ch] text-balance font-semibold tracking-[-0.009em] leading-[1.06] text-[clamp(40px,5vw,64px)]" style={{ color: COLORS.ink }}>Your journey is already happening, so start free.</h2>
        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/register" className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-[#1d1d1f] px-[21px] font-medium leading-[1.176] tracking-[-0.011em] text-[17px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] active:bg-[#18181a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px]">
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
        <PricingStoreSection />
        <PricingPersonaSection />
        <PricingTrustBand />
        <PricingFAQSection />
        <PricingCTASection />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
