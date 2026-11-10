/**
 * PREMIUM PARITY SECTIONS — the student page's FINAL section anatomy, shared
 * by every persona page so all five pages share one exact Apple-premium
 * section-for-section match. Each component mirrors the student page's inline
 * sections exactly; only the data differs.
 *
 * 05 · INTELLIGENCE — the dark technology chapter: one sticky product stage,
 * four beats swap it as their copy crosses the viewport centre.
 *
 * F10 split: every section is its own side-effect-free module under
 * premium/ and this file is a pure re-export barrel — import sites are
 * unchanged, and rollup tree-shakes per module. The landing's router uses
 * 4 of the 7 sections; category pages use all 7.
 */

export { default as PremiumIntelligenceSection } from "./premium/PremiumIntelligenceSection.jsx";
export { default as PremiumLanguageSection } from "./premium/PremiumLanguageSection.jsx";
export { default as PremiumAchievementSection } from "./premium/PremiumAchievementSection.jsx";
export { default as PremiumJourneyFlowSection } from "./premium/PremiumJourneyFlowSection.jsx";
export { default as PremiumTrustSection } from "./premium/PremiumTrustSection.jsx";
export { default as PremiumCTASection } from "./premium/PremiumCTASection.jsx";
export { default as PremiumExploreSection } from "./premium/PremiumExploreSection.jsx";
