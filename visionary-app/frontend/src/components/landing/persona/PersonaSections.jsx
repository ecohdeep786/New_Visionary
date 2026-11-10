/**
 * Shared persona-section components — extracted verbatim from the five
 * persona pages (Student/Teacher/Parent/Professional/Organization), whose
 * implementations were byte-identical except for page-specific strings.
 * Page data (slides, journey modals, icon maps, images) is passed in via
 * props; the visual anatomy, motion, and class strings live here once.
 *
 * Canonical colors come from system/tokens.js (the measured Apple-neutral
 * system): the hairline color.mist #d2d2d7 and the law chip wash
 * color.wash rgba(0,102,204,0.10) apply to every persona page through
 * this module. The pills come from system/ui.jsx (PillButton — the CTA law).
 *
 * F10 split: every component is its own side-effect-free module under
 * sections/ and this file is a pure re-export barrel — import sites are
 * unchanged, and rollup tree-shakes per module, so a page importing only
 * ChevronIcon no longer ships the whole persona section anatomy.
 */

export { default as StruggleChapter } from "./sections/StruggleChapter.jsx";
export { default as CarouselDots } from "./sections/CarouselDots.jsx";
export { default as JourneyGallery } from "./sections/JourneyGallery.jsx";
export { default as JourneyModal } from "./sections/JourneyModal.jsx";
export { default as IntelligenceCopy } from "./sections/IntelligenceCopy.jsx";
export { default as IntelligenceVisual } from "./sections/IntelligenceVisual.jsx";
export { default as IntelligenceArt } from "./sections/IntelligenceArt.jsx";
export { default as LanguageChips } from "./sections/LanguageChips.jsx";
export { default as StageDropdown } from "./sections/StageDropdown.jsx";
export { default as ContinuityCard } from "./sections/ContinuityCard.jsx";
export { default as AchievementAccordion } from "./sections/AchievementAccordion.jsx";
export { default as JourneyCategoryCard } from "./sections/JourneyCategoryCard.jsx";
export { default as TrustCard } from "./sections/TrustCard.jsx";
export { default as ExploreCard } from "./sections/ExploreCard.jsx";
export { default as ChevronIcon } from "./sections/ChevronIcon.jsx";
export { default as VoiceIcon } from "./sections/VoiceIcon.jsx";
export { default as FadeReveal } from "./sections/FadeReveal.jsx";
export { default as ScrollReveal } from "./sections/ScrollReveal.jsx";
export { default as RevealItem } from "./sections/RevealItem.jsx";
