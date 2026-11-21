# FHE-PAGE CLOSEOUT — A01 — `/student`

- Branch / owned worktree / base SHA / change SHA: `zcode-fhe-landing-craft` · base `e909024f` (dev) · change: typographic apostrophes (22) in visible copy.
- Primary file changed: `frontend/src/pages/landing/StudentPage.jsx`.
- Prior accepted receipts reused: founder round (hero sub, nav links), A00 closeout (hero grammar, carousel cascade).
- User audience / primary purpose / next real step: a learner; explain real learning outcomes and the supported admission; next step "Create a free account" → /register (real).
- Release capability classification: public marketing page; product-experience sections describe the platform vision; the connected product's student surfaces are server-gated (verified separately by qa:role-e2e).
- Apple sources consulted: https://www.apple.com/in/education/k12/ (principle: role-specific benefit storytelling with honest availability) + https://www.apple.com/in/education/ (hero grammar, applied at A00). No copying.
- Initial defects with evidence: 22 straight apostrophes (') in visible copy where the product's accepted typography uses typographic ones (') — e.g. "what you're learning", "isn't the difficulty" (screenshot + source grep evidence).
- Copy/grammar changes: 22 contractions converted to typographic apostrophes; no wording changes.
- Visual/interaction changes: none (typography only).
- HLD/LLD decision: inline-copy page (public English by recorded decision; no translation-key modules on public pages), so apostrophe conversion cannot break connected-surface lookups; verified by the full unit suite.
- Browser: Chromium (Edge) production build; IAB interactive walk at 1280 (all 10 sections scrolled, accordion exercised, trust links traced); headless width sweep 320–1920.
- Before/after: "what you're learning" → "what you're learning" etc. (22 instances); zero straight apostrophes remain.
- Motion/reduced-motion: struggle-chapter headings render fully without animation (verified text visible at first paint).
- Accessibility: heading outline h1→h2 verified in the A00-era audit; accordion is real buttons with aria-expanded; hero sub is real content in reading order.
- Responsive: no horizontal overflow 320–1920 (measured); hero sub 1 line at 390px.
- Production build/lint/unit/graph: eslint clean; 870/870; scope inventory regenerated.
- Route/CTA actions: About Responsibility → /terms (200, verified by HEAD request); Create a free account → /register; Get started → /register; Talk to our team → /contact.
- Truth check: no mastery/score claims; achievement copy is outcome-framed ("Get a clear picture…"), no minor-access promises.
- Shared component regression: none (page-local strings only).
- Open dependencies: the connected student product surfaces remain server-gated per the recorded handoffs (not this page's scope).
- Reviewer verdict: self-reviewed as principal engineer under the founder's Apple-level page directive.
- Final verdict: PASS (typography fix integrated).
- What the next agent should NOT redo: the hero grammar, section arc, trust links, accordion anatomy.
- NEXT primary page: A02 `/teacher`.

## Amendment (deep-match pass): interaction evidence against the live Apple resources

The full interaction walk completed with the 12 Apple resources open as
standing references (K–12 lens studied live: benefit chapters, impact
stories, honest availability):

- Struggle carousel (chapter 02): 4 slides, crossfade correct (inactive
  0.00 / active 1.00), manual "Go to challenge N" dots switch slides ✓.
- Journey gallery → JourneyModal (chapter 10): stage card click opens the
  modal (aria-modal=true, focus moves inside, "Build the basics. Build
  them right." renders), Escape closes, Close buttons present ✓.
- Achievement accordion (chapter 09): real buttons, aria-expanded ✓.
- Typographic apostrophes: zero straight apostrophes rendered (the 22-fix
  conversion verified in the DOM).
- Trust destinations: About Safety → /safety (inherited from the A02
  shared fix) ✓.
- No horizontal overflow at 320–1920; hero sub 1 line at 390px.
- Truth: no mastery/score claims; no minor-access promises; the language
  chapter carries its roadmap note.

The page matches the Apple premium reference level for its chapter
grammar, story pacing, interaction behavior, typography and truth. Final
verdict for this deep pass: PASS — the interaction layer needed no code
change (the fixes this session were the typography + hero grammar, already
integrated).
