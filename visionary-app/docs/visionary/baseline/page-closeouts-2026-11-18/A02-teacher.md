# FHE-PAGE CLOSEOUT — A02 — `/teacher`

- Branch / owned worktree / base SHA / change SHA: `zcode-fhe-landing-craft` · base `e909024f`+A01 · change: 56 typographic apostrophes (teacher page + shared persona modules) + Safety trust-card destination fix (five persona pages).
- Primary files changed: `frontend/src/pages/landing/TeacherPage.jsx`; shared persona modules `JourneyGallery/JourneyModal/CarouselDots/ExploreCard/JourneyCategoryCard/PremiumPersonaSections`; Safety href fix in all five persona pages (Student/Teacher/Parent/Organization/College).
- Prior accepted receipts reused: founder round, A00 (hero grammar, cascade), A01 (apostrophe discipline).
- User audience / primary purpose / next real step: a teacher; explain preparation→understanding→growth outcomes; next step "Create a free account" → /register (real).
- Release capability classification: public marketing page; classroom product surfaces are server-gated honest rooms (verified separately by qa:role-e2e).
- Apple sources consulted: https://www.apple.com/in/education/k12/ (teaching-tools benefit storytelling with honest availability); https://www.apple.com/in/education/ (hero grammar). Principle applied, nothing copied.
- Initial defects with evidence:
  1. 56 straight apostrophes across the teacher page and the shared persona modules (rendered-node count 12 on /teacher before the fix; source grep 56 across 7 files).
  2. The "Safety" trust card linked to `/security` on ALL five persona pages while the landing wires Safety→`/safety` — a label/destination mismatch: a user reading "About Safety" landed on the infrastructure-security page instead of the safety story (verified live href + HEAD).
- Copy/grammar changes: 56 contractions → typographic apostrophes; no wording changes.
- Visual/interaction changes: Safety card now routes to /safety on all five persona pages (the trust row's intended destination; /security remains reachable from the landing trust row and the footer).
- HLD/LLD decision: shared-module edit (JourneyGallery et al. serve all five persona pages) → regression scope = all five pages re-walked at 390px post-fix: zero overflow, zero straight apostrophes remaining on teacher/student; the remaining rendered instances belong to the per-page files of LATER work orders (A07/A09/A10/A14/A18…) and will be fixed in those work orders.
- Browser: Chromium (Edge) production build, IAB interactive walk at 1280, headless 390px sweep on all five persona pages.
- Before/after: "don't" → "don't" etc. (56 instances); About Safety → /safety (5 pages).
- Motion/reduced-motion: unchanged; carousel-free page.
- Accessibility: heading outline unchanged; trust row real links.
- Production build/lint/unit/graph: eslint clean; 870/870; scope inventory regenerated.
- Route/CTA actions: Create a free account → /register; Get started → /register; Talk to our team → /contact; About Privacy → /privacy; About Safety → /safety (fixed); About Responsibility → /terms (200, real destination).
- Truth check: classroom copy is narrative, not feature claims; no classroom-tool availability promises (honest rooms server-side).
- Shared component regression: JourneyGallery/JourneyModal/CarouselDots/ExploreCard/JourneyCategoryCard/PremiumPersonaSections serve all five persona pages — all five re-verified post-fix (overflow + apostrophes + safety href).
- Open dependencies: connected teacher surfaces server-gated per recorded handoffs.
- Reviewer verdict: self-reviewed as principal engineer under the founder's Apple-level page directive.
- Final verdict: PASS.
- What the next agent should NOT redo: the teacher page arc, trust destinations (Safety→/safety), shared-module apostrophes.
- NEXT primary page: A03 `/parent` (per the restarted sequence; A00/A01 already closed and main carries them).
