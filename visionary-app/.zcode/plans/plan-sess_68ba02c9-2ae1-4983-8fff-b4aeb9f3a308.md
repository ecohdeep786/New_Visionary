## Audit Findings & Remediation Plan

### Reference baseline (the "source of truth")
The main Landing page + `LandingNav` + `LandingFooter` + `TrustPage` establish the canonical dialect:
- **Tokens**: ink `#202124`, slate `#5f6368`, mist `#e8eaed`, hairline `#e8eaed`, blue `#4285F4` (selected/active only), dark-blue `#0b57d0` (primary actions).
- **Rhythm**: fluid type via `rhythm.css`, `--gap-title-sub-display` / `--gap-eyebrow-title-display`, `ease-google` timing, 1240px content container, 6/10px side gutters.
- **Eyebrow**: `text-[12px] font-medium uppercase tracking-[0.15em] text-[#5f6368]` — consistent across pages.
- **Heading scale**: H1 `clamp(28px…,5.5vw…,48–76px)` font-normal tracking-[-0.045em]; H2 `clamp(30px,4vw,56px)` → body `clamp(15px,0.8vw,16px)`.
- **Buttons**: `min-h-11/12`, rounded-full, `transition-all`, `focus-visible:ring-2 focus-visible:ring-[#4285F4]`.
- **Cards**: `rounded-2xl`, `border border-[#e8eaed]`, `hover:shadow-[0_2px_8px_rgba(32,33,36,0.16)]`, inner padding 24–28px.
- **Footer**: `variant="quiet"` on all non-landing pages → giant wordmark only on the main landing page.

### What's duplicated / inconsistent
1. **Two FAQ systems exist and don't match.**
   - Main Landing FAQ: custom inline accordion, `ChevronDown` rotated, circular 14/16px control, no "expand all".
   - LandingFAQ.jsx (untracked): radix-style wrapper, `ChevronDown` in a square, "Show more" button — different structure, different token set, not wired in.
   - CommunityPage local `FaqList`: `Plus` icon rotated to 45°, blue circular control (`bg-[#1a73e8] text-white`), "Expand all" + "Show more".
   - ContactPage local `FaqList`: `Plus` rotated 45°, circular control, "Expand all" + "Show more" — matches Community.
   - FAQAccordion.jsx (untracked, in /sections): `ChevronDown`, rounded-2xl border card, no circular control.
   - **Decision**: Product FAQ standard = circular blue-accent control + `Plus` icon (rotate 45°), "Expand all" toggle, optional "Show more" at the bottom. This is the most-populated and most-used pattern from Community + Contact.

2. **Two eyebrow systems.**
   - Canonical: `<p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#5f6368]">`.
   - SectionHeader.jsx: `text-xs rounded-full px-3 py-1.5` pill with blue background — only used by some sections, doesn't match the canonical hairline label.

3. **SectionHeader.jsx vs LandingSectionHeader.** LandingSectionHeader (untracked) is bare; SectionHeader adds a pill. Neither is wired to the rhythm tokens. Both should fold into one canonical component using `rhythm.css` gap tokens.

4. **CTA section inconsistency.** CTASection.jsx uses `#202124` (black) solid button — matches the "dark-action" variant. The rest of the product uses `#0b57d2`/`#1a73e8` blue for primary CTAs. Need to confirm whether dark CTA is intentional (Google's "dark" CTA on white) or a deviation.

5. **Color token drift.** StudentPage uses `#121317` ink (one shade darker than canonical `#202124`). Careers uses `#202124` ink but `#dadce0` borders (canonical uses `#e8eaed` hairlines). These are pixel-level mismatches.

6. **Unwired scaffolding.** `LandingPrimitives.jsx`, `LandingFAQ.jsx`, `PersonaPageShell.jsx` are untracked and not imported anywhere — they're half-built duplicates of patterns that already exist inline in the pages.

### Remediation plan (ordered, surgical, preserve-approved-design)
Per the user's decree, the landing design is approved and verification is observation-only; I'm unifying *deviations*, not the approved direction.

**Phase A — Consolidate the FAQ system (highest impact, 4 pages affected).**
- Create a single canonical `LandingFAQ` component (replacing the untracked one) that uses the circular blue-accent control + `Plus` rotation pattern. Re-export from `@/components/landing` so the import path is stable.
- Replace CommunityPage, ContactPage inline `FaqList`, and the main Landing inline FAQ with the shared component. Wire `visibleCount` + "Show more" and "Expand all" variants through props.
- Delete the redundant `FAQAccordion.jsx` and `LandingFAQ.jsx` untracked files (they're never imported).

**Phase B — Unify section headers & eyebrows.**
- Consolidate `SectionHeader.jsx` (in `/sections`) and `LandingSectionHeader` (untracked) into one `LandingSectionHeader` component using the canonical eyebrow token and `rhythm.css` gap variables.
- Drop the blue-pill eyebrow variant unless explicitly preserved (none of the approved pages use it).

**Phase C — Token drift cleanup (1–2px precision).**
- Align StudentPage ink from `#121317` → `#202124`.
- Standardize hairline borders: `#e8eaed` everywhere (Careers currently uses `#dadce0`).
- Confirm CTASection dark button is intentional (Google's dark CTA pattern) — if so, keep and document; no change.

**Phase D — Wire or remove the page shells.**
- `PersonaPageShell.jsx` (untracked) — wire the persona pages (Student/Teacher/Parent/Professional/Organization) to it so the shell is consistent and the untracked file becomes actually used, OR delete it if the pages are already coherent.
- `LandingPrimitives.jsx` (untracked) — the `LandingShell`/`LandingSection` tokens don't match the canonical `max-w-[1240px]` container. Decide: either retrofit pages to use it, or remove it as duplicate scaffolding.

**Phase E — Footer consistency pass.**
- Verify every non-landing page passes `variant="quiet"` (Community already does; confirm the rest).

**Phase F — Verify.**
- Run `npm run build` and `npm run lint` (per AGENTS.md). Confirm no regressions. Since I can't screenshot in this environment, I'll flag the key visual checks for the user to confirm: FAQ control alignment, eyebrow weight, button height, card shadow on hover.