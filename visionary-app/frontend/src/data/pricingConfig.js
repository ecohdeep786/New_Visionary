/**
 * Pricing plan config — the SINGLE source for /pricing (Wave L3, 01-PM owns).
 * Per MASTER_SPEC §8: prices come only from this fixture. Personal ₹299,
 * Family ₹499 (provisional), Institution = "Contact Visionary" (no number).
 * Plan cards, comparison table, and persona-plan rows all read from here.
 * CTAs resolve to /register with a plan query param (or /contact for org).
 */

export const BILLING = {
  monthly: { label: "Monthly", note: "billed monthly" },
  annual: { label: "Annual", badge: "2 months free", note: "billed yearly" },
};

export const PLANS = [
  {
    id: "start",
    name: "Start",
    tagline: "Begin with one question.",
    monthly: 0,
    annual: 0,
    priceNote: { free: "Free forever · no card required" },
    cta: "Start for free",
    to: "/register?plan=start",
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
    monthly: 299,
    annual: 249,
    annualTotal: 2990,
    priceNote: { paid: "Per person" },
    cta: "Get Personal",
    to: "/register?plan=personal",
    highlight: true,
    badge: "Most popular",
    features: [
      "Ask & explore with no daily cap — subject to fair use",
      "Full visual & 3D explanations",
      "Practise mode & no-code Build",
      "All 20+ languages, voice & text",
      "Continuity that stays with you",
      "Full progress insights",
    ],
  },
  {
    id: "family",
    name: "Family",
    tagline: "A household that learns together.",
    monthly: 499,
    annual: 415,
    annualTotal: 4990,
    priceNote: { paid: "Per household" },
    cta: "Get Family",
    to: "/register?plan=family",
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
    cta: "Contact Visionary",
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

/* One row per comparable capability; values read by the comparison table.
   Vocabulary per §15.2: "no daily cap", "subject to fair use" — never
   "unlimited", never absolute guarantees. */
export const COMPARISON = [
  { feature: "Ask & explore", start: "20/day", personal: "No daily cap", family: "No daily cap", institution: "No daily cap" },
  { feature: "Fair-use note", start: "—", personal: "Higher limits subject to fair use", family: "Higher limits subject to fair use", institution: "Higher limits subject to fair use" },
  { feature: "Visual & 3D explanations", start: "Core", personal: "Full", family: "Full", institution: "Full" },
  { feature: "Practise & Build", start: false, personal: true, family: true, institution: true },
  { feature: "Languages", start: "1", personal: "20+", family: "20+", institution: "20+" },
  { feature: "Voice input", start: false, personal: true, family: true, institution: true },
  { feature: "Continuity (memory)", start: "7 days", personal: "Kept while your account is active", family: "Kept per member", institution: "Kept org-wide" },
  { feature: "Progress insights", start: "Snapshot", personal: "Full", family: "Full + digest", institution: "Full + analytics" },
  { feature: "Members", start: "1", personal: "1", family: "Up to 6", institution: "Contact Visionary" },
  { feature: "Admin & SSO", start: false, personal: false, family: false, institution: true },
  { feature: "Support", start: "Community", personal: "Faster replies", family: "Faster replies", institution: "Dedicated team" },
];

export const PERSONA_PLANS = [
  { persona: "Student", plan: "Start or Personal", note: "Begin free. Upgrade when you're ready.", to: "/student" },
  { persona: "Teacher", plan: "Personal", note: "One classroom, one intelligence.", to: "/teacher" },
  { persona: "Parent", plan: "Family", note: "Every child, one plan.", to: "/parent" },
  { persona: "Professional", plan: "Personal", note: "Skills that compound.", to: "/professional" },
  { persona: "Organization", plan: "Institution", note: "Roll out across your people.", to: "/organization" },
];

export const PRICING_FAQ = [
  { q: "Can I start free?", a: "Yes. Start is free forever — 20 questions a day, core visual explanations, and a 7-day memory of your journey. No card required." },
  { q: "Can I switch plans later?", a: "Any time. Upgrades apply immediately; downgrades at the next cycle. Your continuity travels with you — nothing resets when you change plans." },
  { q: "What happens to my memory if I downgrade?", a: "Nothing is deleted. Your journey is kept privately and rejoins you the moment you upgrade again." },
  { q: "Do you offer education discounts?", a: "Yes. Students and teachers with a valid institutional email get Personal at a discount, and Start stays free for everyone." },
  { q: "How does Family privacy work?", a: "Each member's memory is completely private. Parents see progress and support signals — never private conversations." },
  { q: "How does Institution billing work?", a: "Per active learner, annual invoicing, with pilot options for a single class, cohort, or campus before you roll out wider." },
];

/* Format a plan price for display. Institution has no number — the words
   "Contact Visionary" are the price, per MASTER_SPEC §8. */
export const formatPrice = (plan, billing) => {
  const value = billing === "annual" ? plan.annual : plan.monthly;
  if (value === null || value === undefined) return { kind: "contact", text: "Contact Visionary" };
  if (value === 0) return { kind: "free", text: "₹0" };
  return { kind: "paid", text: `₹${value}` };
};
