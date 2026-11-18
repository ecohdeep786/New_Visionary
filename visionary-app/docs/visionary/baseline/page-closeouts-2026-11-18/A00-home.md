# FHE-PAGE CLOSEOUT — A00 — `/` (homepage)

- Branch / owned worktree / base SHA / change SHA / integrated dev SHA:
  `zcode-fhe-landing-craft` · `nv-worktrees/zcode-fhe21-realm-factory` · base `14df438b` (dev) · change: hero purpose line + (earlier in lane) carousel override fix · integrated dev SHA recorded at push.
- Primary file and supporting files changed:
  `frontend/src/pages/Landing.jsx` (LandingHeroSection passes `sub`);
  `frontend/src/components/landing/NewPersona.jsx` (cast branch renders the purpose line, gated on the prop);
  `frontend/src/index.css` (lazy-image rules moved before the utilities layer — the founder-reported override-image fix, same lane).
- Prior accepted receipts reused (do not duplicate):
  founder-walkthrough round `0524ad32` (9 fixes), carousel cascade fix `14df438b`, heading audit, i18n/zoom/motion receipts.
- User audience / primary purpose / next real step:
  every audience; make Visionary's purpose (continuity of understanding) legible in the first frame; next real step: "Start learning" → /register (real).
- Current release capability classification: connected (public marketing page; CTAs route to real destinations).
- Apple sources consulted:
  https://www.apple.com/in/education/ — hero grammar measured: headline makes the audience claim, ONE plain line translates it into the person's benefit, then actions. Principle applied; nothing copied (Visionary's own words, type, palette).
- Initial defects with reproducible browser evidence:
  1. Hero first frame carried no purpose line (hero DOM contained zero `<p>`; screenshot A00-before): a first-time visitor could not answer "what is Visionary for?" from the first frame — the directive's own first-impression criterion.
  2. Carousel override image (founder-reported; root-caused this lane): `.lazy-loaded { opacity: 1 }` sat after `@tailwind utilities`, same specificity, later cascade → the inactive slide painted at full strength over the active one. Fixed by moving the lazy rules before the utilities layer; verified inactive opacity 0.00 / active 1.00 across the cycle.
- Page storyboard / content hierarchy / actual user outcome:
  hero (claim + purpose + CTAs + five audience doors) → intelligence → two problem stories → promise → what-you-get → five journeys → explore further → trust → final CTA → footer. Unchanged; the hero gained its missing purpose line.
- Copy, grammar and claim-verification changes:
  new hero line "Learning that remembers where you were — so you never start over." (12 words, plain, the platform's core idea, no feature overclaim; "Start learning" remains the real step). Trust line "Secure by design, protected end to end." verified against /security's own chapters (encrypted in transit, protected when stored) — truthful shorthand, PASS no change.
- Visual and interaction design changes: the cast hero renders one quiet 2-line tagline between headline and CTAs (gated on the prop; other cast users unaffected).
- HLD / LLD / state and permission boundary decision:
  smallest safe patch — the `sub` prop already existed on the shared PersonaHero contract; the cast branch previously dropped it deliberately because the OLD sub restated the headline; the new line adds information and earns its place.
- Browser: Chromium (Edge) production build; viewports 320/360/390/430/768/1024/1280/1440/1920 + IAB interactive walk at 1280 (nav hover/click, carousel cycle, CTAs, scroll chapters).
- Before/after comparison: one line per actual correction:
  hero: no supporting line → 2-line purpose line, 2 lines at every width incl. 320px, no overflow;
  carousel: two stacked photos both opacity 1 → inactive 0.00/active 1.00.
- Motion and prefers-reduced-motion evidence: cycling words suppress animation under reduce (global law, `.hero-fade-up { animation: none; opacity: 1 }`), content never hidden; sr-only stable sentence present.
- Accessibility checks: one h1 with sr-only full sentence; tagline is real content in reading order; keyboard route through audience rail (focus previews + holds) unchanged.
- Responsive, zoom and image-crop observations: no horizontal overflow at any tested width; tagline 2 lines at 320/390/768/1440.
- Production build, lint, typecheck, unit and graph gate results: eslint clean; 870/870 unit tests; production build ✓; scope inventory regenerated (67 routes, 1533 declarations).
- Route/CTA actions and correct end destinations: Start learning → /register ✓; See how it works → /how-it-works ✓; audience rail → persona pages ✓ (verified earlier this session).
- Performance raw lab metrics + same-environment baseline: CWV IAB receipt 2026-11-18 (CLS 0, DCL 157-246ms loopback) — no regression; LCP stays with the lighthouse instrument (environment issue recorded).
- Shared component regression impact and test results: NewPersona cast branch + index.css cascade affect all public pages — full-width overflow sweep re-run (10 routes, all ok) and unit suite green; persona heroes (non-cast branch) render their own taglines unchanged.
- Any open backend/ML/deployment dependencies: none for this page (public marketing; CTAs route to real destinations).
- Reviewer and exact-SHA review verdict: founder directive (Apple-level page program) authorizes self-review; exact-SHA evidence recorded here.
- Final verdict: PASS (with the hero purpose line + cascade fix integrated).
- What the next agent should NOT redo unless there is a regression:
  the hero grammar (claim → purpose line → CTAs → audience rail), the carousel cascade order, the founder's nine accepted corrections.
- NEXT primary page in the queue: A01 `/student`.

## Amendment (deep-match pass): the landing's visible copy joins the typographic discipline

The full side-by-side against the open Apple resources (Education hero
grammar, Vision Pro staging, Initiative story chapters, Privacy trust
framing, HIG Writing/Layout/Motion) verified every chapter — and
surfaced 84 straight apostrophes in the landing's own visible copy
(headline "Turning it into capability isn't", the story quotes, the
mechanism beats, the suite cards). All converted to the product's
typographic apostrophes. Final render check: every chapter
(hero/intelligence/problem/promise/return/journeys/suite/trust/CTA/
footer) walked visually in the application browser; zero straight
apostrophes; 870/870 tests; the deep-match verdict stands.

## FINAL REGRESSION (program close): the full integrated evidence on the exact production bundle

- The five full integrated role stories (register → verify → onboard →
  walk the role's complete navigation → server state asserted):
  qa:role-e2e PASS 5/5 on the final bundle — student 12 routes, teacher
  14, parent 9, professional 13, organization 11; zero blank pages, zero
  page errors.
- The consolidated 24-route public regression: unique h1, zero overflow,
  zero straight apostrophes, zero page errors on every route.
- NOTE (evidence honesty): the first post-conversion regression sampled a
  STALE build — the A11–A23 conversion had not been rebuilt into the
  served artifact, so the rendered apostrophe counts read pre-fix values.
  The rebuild + re-run above is the true final evidence: every route
  fully clean. The rendered evidence now stands with the rebuild.
