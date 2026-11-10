# FAP-65 — one icon family, consistent (receipt)

Date: 2026-11-05 · Auditor: principal frontend review (opencode session) · Live target: dev 127.0.0.1:4197 (beta @ 431ab63d)

## Family audit

- **One family everywhere**: lucide/Feather geometry — 164 lucide imports across product + landing, and every hand-inlined landing SVG (ChevronIcon, ui.jsx primitives, LandingNav arrow, LandingFAQ chevron, StageDropdown, JourneyGallery plus) draws the exact lucide path set (`M9 6l6 6-6 6`, `M5 12h14+M13 6l6 6-6 6`, `M6 9l6 6 6-6`) with stroke=currentColor, round caps/joins, 24 viewBox. No foreign icon library (no material/heroicons/font-awesome imports anywhere in src). SpotIllustration + SubjectIllustration are the illustration system, not the icon family.
- **Weight law (after this pass)** — one voice per idiom:
  - `1.8` UI glyphs (nav, buttons, sidebar, cards) — 89 sites, was 1.7×19 / 1.75×8 near-duplicates of 1.8 (visually <3% apart, consolidated for one voice).
  - `2` inline chevron/arrow primitives (ChevronIcon, TextLink, ArrowButton, StageDropdown, LandingFAQ) — CtaPair's 2.5 chevron joined the family voice.
  - `~1.5` display glyphs at 24-44px (GettingStarted, onboarding rail, ArtifactStudio, LearningWorkspace, PremiumTrust, WorkspaceIntro) — Apple's large-symbol weight drop; 1.4/1.55/1.6 are the same idiom at hand-tuned values.
  - `2.4-3` check-in-disc idiom (Partners, Safety, Updates, achievement discs) — heavier check on filled discs, one sanctioned second voice.
  - Illustration-scale strokes (11-16, 0.25-0.7) belong to SpotIllustration art, not the icon family.
- VoiceIcon (48 viewBox, rendered 36px) voices an effective ~1.9 — inside the family weight.

## Changes

- 27 lucide call sites: `strokeWidth={1.7|1.75}` → `{1.8}` (12 files: DashboardSidebar, Landing, DecisionHome, LearningWorkspace, Cookies/Security/Accessibility/Privacy/Terms pages, PremiumTrustSection, JourneyModal, TrustCard).
- `system/ui.jsx` CtaPair chevron: `2.5` → `2` (joins every other chevron primitive).
- Script: frontend/scripts/fap65-icon-weight-fix.mjs (kept as the audit's fix receipt).

## Verification

- lint/typecheck/tests re-run after the edit (see commit).
- Live pages re-captured (landing suite CTA, security page) — glyph rendering unchanged at a glance, family voice now uniform.
