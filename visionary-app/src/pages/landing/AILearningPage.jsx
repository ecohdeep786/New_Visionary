import React, { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Check, Minus, Sparkles } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const PRICING_HERO_WORDS = ["your journey.", "your classroom.", "your family.", "your work.", "your institution."];

/* ═══ DESIGN TOKENS (same system) ═══ */
const COLORS = {
  ink: "#121317",
  surface: "#F5F6F8",
  blue: "#4285F4",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  chipBg: "#D2E3FC",
  white: "#ffffff",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

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
    <div className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

/* ═══ MODELS ═══ */
const PLANS = [
  {
    id: "start",
    name: "Start",
    tagline: "Begin with one question.",
    monthly: 0,
    annual: 0,
    cta: "Start for free",
    to: "/register",
    highlight: false,
    features: [
      "Ask & explore — 20 questions a day",
      "Visual explanations for core subjects",
      "1 language",
      "7-day memory of your journey",
      "Basic progress snapshot",
    ],
  },
  {
    id: "personal",
    name: "Personal",
    tagline: "One person. Full intelligence.",
    monthly: 9,
    annual: 7,
    cta: "Get Personal",
    to: "/register",
    highlight: true,
    badge: "Most popular",
    features: [
      "Unlimited Ask & explore",
      "Full visual & 3D explanations",
      "Practise mode & no-code Build",
      "All 20+ languages, voice & text",
      "Continuity that never resets",
      "Full progress insights",
    ],
  },
  {
    id: "family",
    name: "Family",
    tagline: "A household that learns together.",
    monthly: 16,
    annual: 13,
    cta: "Get Family",
    to: "/register",
    highlight: false,
    features: [
      "Everything in Personal",
      "Up to 6 members",
      "Parent view across children",
      "Private memory per member",
      "Weekly family digest",
    ],
  },
  {
    id: "institution",
    name: "Institution",
    tagline: "Schools, colleges, coaching, workplaces.",
    monthly: null,
    annual: null,
    cta: "Contact sales",
    to: "/contact",
    highlight: false,
    features: [
      "Everything for every role",
      "Admin & learning analytics",
      "SSO & privacy controls",
      "Rollout support & training",
      "Dedicated success manager",
    ],
  },
];

const PERSONA_PLANS = [
  { persona: "Student", plan: "Start or Personal", note: "Begin free. Upgrade when you're ready.", to: "/student" },
  { persona: "Teacher", plan: "Personal", note: "One classroom, one intelligence.", to: "/teacher" },
  { persona: "Parent", plan: "Family", note: "Every child, one plan.", to: "/parent" },
  { persona: "Professional", plan: "Personal", note: "Skills that compound.", to: "/professional" },
  { persona: "Organization", plan: "Institution", note: "Roll out across your people.", to: "/organization" },
];

const COMPARISON = [
  { feature: "Ask & explore", start: "20/day", personal: "Unlimited", family: "Unlimited", institution: "Unlimited" },
  { feature: "Visual & 3D explanations", start: "Core", personal: "Full", family: "Full", institution: "Full" },
  { feature: "Practise & Build", start: false, personal: true, family: true, institution: true },
  { feature: "Languages", start: "1", personal: "20+", family: "20+", institution: "20+" },
  { feature: "Voice input", start: false, personal: true, family: true, institution: true },
  { feature: "Continuity (memory)", start: "7 days", personal: "Forever", family: "Forever, per member", institution: "Forever, org-wide" },
  { feature: "Progress insights", start: "Snapshot", personal: "Full", family: "Full + digest", institution: "Full + analytics" },
  { feature: "Members", start: "1", personal: "1", family: "Up to 6", institution: "Unlimited" },
  { feature: "Admin & SSO", start: false, personal: false, family: false, institution: true },
  { feature: "Support", start: "Community", personal: "Priority", family: "Priority", institution: "Dedicated" },
];

const PRICING_FAQ = [
  { q: "Can I start free?", a: "Yes. Start is free forever — 20 questions a day, core visual explanations, and a 7-day memory of your journey. No card required." },
  { q: "Can I switch plans later?", a: "Any time. Upgrades apply immediately; downgrades at the next cycle. Your continuity travels with you — nothing resets when you change plans." },
  { q: "What happens to my memory if I downgrade?", a: "Nothing is deleted. Your journey is kept privately and rejoins you the moment you upgrade again." },
  { q: "Do you offer education discounts?", a: "Yes. Students and teachers with a valid institutional email get Personal at a discount, and Start stays free for everyone." },
  { q: "How does Family privacy work?", a: "Each member's memory is completely private. Parents see progress and support signals — never private conversations." },
  { q: "How does Institution billing work?", a: "Per active learner, annual invoicing, with pilot options for a single class, cohort, or campus before you roll out wider." },
];

/* ═══ Billing toggle — same pill language as site tabs ═══ */
const BillingToggle = React.memo(function BillingToggle({ billing, onChange }) {
  return (
    <div className="mx-auto flex h-11 w-fit items-stretch overflow-hidden rounded-full border bg-white p-0" style={{ borderColor: COLORS.mist }} role="tablist" aria-label="Billing period">
      {["monthly", "annual"].map((b) => (
        <button
          key={b}
          type="button"
          role="tab"
          aria-selected={billing === b}
          onClick={() => onChange(b)}
          className={`flex h-full items-center justify-center gap-2 rounded-full px-6 text-[14px] tracking-[0.24px] transition-colors ${billing === b ? "font-medium" : "font-normal hover:bg-[#f8f9fa]"}`}
          style={{ backgroundColor: billing === b ? COLORS.ink : "transparent", color: billing === b ? "#ffffff" : COLORS.slate }}
        >
          {b === "monthly" ? "Monthly" : "Annual"}
          {b === "annual" && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-normal uppercase tracking-[0.43px]" style={{ backgroundColor: billing === "annual" ? COLORS.chipBg : COLORS.surface, color: COLORS.ink }}>
              2 months free
            </span>
          )}
        </button>
      ))}
    </div>
  );
});

/* ═══ Plan card ═══ */
const PlanCard = React.memo(function PlanCard({ plan, billing }) {
  const price = billing === "annual" ? plan.annual : plan.monthly;
  return (
    <div
      className="relative flex flex-col rounded-[24px] border bg-white p-8"
      style={{
        borderColor: plan.highlight ? COLORS.blue : COLORS.mist,
        boxShadow: plan.highlight ? "0 16px 40px rgba(66,133,244,0.14)" : "0 8px 24px rgba(60,64,67,0.06)",
      }}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-8 rounded-full px-3 py-1 font-normal uppercase tracking-[0.43px] text-[10px]" style={{ backgroundColor: COLORS.chipBg, color: COLORS.ink }}>
          {plan.badge}
        </span>
      )}
      <h3 className="font-medium tracking-[0] leading-[1.15] text-[22px]" style={{ color: COLORS.ink }}>{plan.name}</h3>
      <p className="mt-2 font-normal tracking-[0] leading-[1.5] text-[14px]" style={{ color: COLORS.grey }}>{plan.tagline}</p>

      <div className="mt-6 flex items-baseline gap-2">
        {price === null ? (
          <span className="font-medium tracking-[0] leading-[1] text-[clamp(32px,3vw,44px)]" style={{ color: COLORS.ink }}>Custom</span>
        ) : (
          <>
            <span className="font-medium tracking-[0] leading-[1] text-[clamp(32px,3vw,44px)]" style={{ color: COLORS.ink }}>${price}</span>
            <span className="font-normal tracking-[0] text-[14px]" style={{ color: COLORS.grey }}>/ month</span>
          </>
        )}
      </div>
      <p className="mt-1 font-normal tracking-[0] leading-[16px] text-[12px]" style={{ color: COLORS.lightGrey }}>
        {price === null ? "Annual invoicing · pilots available" : price === 0 ? "Free forever · no card required" : billing === "annual" ? "Per person, billed annually" : "Per person, billed monthly"}
      </p>

      <Link
        to={plan.to}
        className={`mt-8 inline-flex h-12 items-center justify-center rounded-full px-8 font-medium tracking-[0.24px] text-[15px] transition-all focus-visible:outline-none focus-visible:ring-2 ${
          plan.highlight ? "text-white hover:opacity-90 active:scale-[0.98] focus-visible:ring-[#121317]" : "transition-colors hover:bg-[#121317]/5 focus-visible:ring-[#4285F4]"
        }`}
        style={plan.highlight ? { backgroundColor: COLORS.blue } : { border: `1px solid ${COLORS.ink}4D`, color: COLORS.ink }}
      >
        {plan.cta}
      </Link>

      <ul className="mt-8 space-y-3">
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
 const [wordIndex, setWordIndex] = useState(0);
 useEffect(() => {
   const id = setInterval(() => setWordIndex((i) => (i + 1) % PRICING_HERO_WORDS.length), 2600);
   return () => clearInterval(id);
 }, []);
  return (
    <section ref={ref} className="relative overflow-hidden px-6 pb-24 pt-40 lg:pt-48" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Pricing</p>
        
  <h1 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>

   One intelligence.
   <br className="hidden md:block" /> Priced for{" "}
   <span key={wordIndex} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{PRICING_HERO_WORDS[wordIndex]}</span>
 </h1>
         <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
Start free. Upgrade only when it has earned it. The same Visionary for every learner, teacher, parent, professional, and organization.</p>
        <div className="mt-12"><BillingToggle billing={billing} onChange={setBilling} /></div>

        <div className="mx-auto mt-14 grid w-full max-w-[1400px] grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((p) => (<PlanCard key={p.id} plan={p} billing={billing} />))}
        </div>

        <p className="mt-8 text-center font-normal tracking-[0] leading-[16px] text-[12px]" style={{ color: COLORS.lightGrey }}>
          Prices in USD · Regional pricing at checkout · Education discounts available
        </p>
      </FadeReveal>
    </section>
  );
}

/* ═══ 03 · PERSONA STRIP — which plan is for you ═══ */
function PricingPersonaSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <h2 className="text-center font-medium tracking-[0] leading-[1.05] text-[clamp(30px,4vw,56px)]" style={{ color: COLORS.ink }}>Every journey has a plan.</h2>
        <div className="mx-auto mt-14 grid w-full max-w-[1400px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {PERSONA_PLANS.map((p) => (
            <Link key={p.persona} to={p.to} className="group flex flex-col rounded-[24px] border bg-white p-7 transition-all hover:border-[#4285F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ borderColor: COLORS.mist }}>
              <p className="font-normal uppercase tracking-[0.43px] leading-[14px] text-[11px]" style={{ color: COLORS.grey }}>{p.persona}</p>
              <p className="mt-4 font-medium tracking-[0] leading-[1.2] text-[20px]" style={{ color: COLORS.ink }}>{p.plan}</p>
              <p className="mt-2 font-normal tracking-[0] leading-[1.5] text-[13px]" style={{ color: COLORS.grey }}>{p.note}</p>
              <span className="mt-6 font-normal tracking-[0] leading-[22px] text-[15px] group-hover:underline" style={{ color: COLORS.blue }}>See your page</span>
            </Link>
          ))}
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
    
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <h2 className="text-center font-medium tracking-[0] leading-[1.05] text-[clamp(30px,4vw,56px)]" style={{ color: COLORS.ink }}>See exactly what you get.</h2>
        <div className="mx-auto mt-14 w-full max-w-[1240px] overflow-x-auto rounded-[24px] border bg-white" style={{ borderColor: COLORS.mist }}>
          <table className="w-full min-w-[760px] border-collapse text-center">
            <thead>
              <tr className="border-b" style={{ borderColor: COLORS.mist }}>
                <th className="px-6 py-6 text-left font-medium tracking-[0] text-[16px]" style={{ color: COLORS.ink }}>Features</th>
                {["Start", "Personal", "Family", "Institution"].map((h) => (
                  <th key={h} className="px-6 py-6 font-medium tracking-[0] text-[16px]" style={{ color: h === "Personal" ? COLORS.blue : COLORS.ink }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} className={i < COMPARISON.length - 1 ? "border-b" : ""} style={{ borderColor: `${COLORS.ink}14` }}>
                  <td className="px-6 py-5 text-left font-normal tracking-[0] text-[14px]" style={{ color: COLORS.ink }}>{row.feature}</td>
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
    <section ref={ref} className="relative bg-white px-6 py-20" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto flex w-fit max-w-full flex-col items-center gap-4 rounded-full px-10 py-6 sm:flex-row" style={{ backgroundColor: COLORS.surface }}>
          <Sparkles className="h-5 w-5 shrink-0" strokeWidth={1.8} style={{ color: COLORS.blue }} />
          <p className="text-center font-normal tracking-[0.24px] text-[15px]" style={{ color: COLORS.ink }}>
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
  const [open, setOpen] = useState(0);
  const toggle = useCallback((i) => setOpen((cur) => (cur === i ? -1 : i)), []);
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>FAQ</p>
        <h2 className="mx-auto mt-4 max-w-[1100px] text-center font-medium tracking-[0] leading-[1.08] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Questions about pricing, answered.
        </h2>
        <div className="mx-auto mt-24 w-full max-w-[1400px]">
          {PRICING_FAQ.map((item, i) => (
            <div key={item.q} className="border-b py-10 lg:py-12" style={{ borderColor: `${COLORS.ink}26` }}>
              <button type="button" aria-expanded={open === i} onClick={() => toggle(i)} className="flex w-full items-center justify-between gap-6 rounded-[8px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
                <span className="font-normal tracking-[0] leading-[1.15] text-[clamp(20px,2.2vw,30px)]" style={{ color: COLORS.ink }}>{item.q}</span>
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16" style={{ backgroundColor: `${COLORS.ink}0A`, color: COLORS.ink }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`h-6 w-6 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}>
                    <path d="M6 15l6-6 6 6" />
                  </svg>
                </span>
              </button>
              <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <p className="max-w-[1240px] pt-8 font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.ink }}>{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </FadeReveal>
    </section>
  );
}


/* ═══ 07 · FINAL CTA ═══ */
function PricingCTASection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-28 lg:py-36" style={{ backgroundColor: COLORS.surface, fontFamily: FONT_FAMILY }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <h2 className="font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>Your journey is already happening. Start free.</h2>
        <p className="mx-auto mt-6 max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Begin with a question today. Upgrade only when Visionary has earned it.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/register" className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: COLORS.blue }}>
            Get started
          </Link>
          <Link to="/about" className="inline-flex h-14 items-center justify-center rounded-full border px-10 font-medium tracking-[0] text-[16px] transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
            Talk to sales
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══ PAGE — universal for all users, quiet footer ═══ */
export default function AILearningPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
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