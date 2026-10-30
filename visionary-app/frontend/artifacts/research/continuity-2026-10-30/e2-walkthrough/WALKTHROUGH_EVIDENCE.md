# E2 founder-path walkthrough — rendered verification (beta 4cb1ef51)

**Date:** 2026-10-30 · **Build:** production dist of `origin/beta` 4cb1ef51 · **Server:** vite preview :4173
**Viewport:** 1440×900 @1 (the QA harness universe) · **Gate:** `npm run check` exit 0 at 4cb1ef51
**Method:** Playwright (playwright-core, same driver as the QA harness) against the production build; IntersectionObserver-gated sections mounted by a full scroll walk before checks, matching the E1/D2 harness method. In-app-browser session was used for interactive viewing; capture used the harness driver after the IAB screenshot pipeline timed out repeatedly (4/4 attempts, full + clip, two tabs — page interactions verified working throughout).

## Founder path — results

| Step | Route | Verdict | Evidence |
| --- | --- | --- | --- |
| Landing | `/` | One-voice hero; gradient only in the intelligence moment; ink pill + text-link chevron; persona rail; hero art loads | `01-landing-1440.png` |
| Pricing | `/pricing` | Store-grade 3-column table, hairline rows, billing toggle, commerce-blue CTAs, fine print, Institution band | `02-pricing-1440.png` (fullPage) |
| Download | `/download` | Hero choice cards honest ("web is live today"); platforms grid: Web ink CTA; Windows/Mac/Linux/iOS/Android grey disabled pills + visible "Coming soon — not available yet" reasons; notify section honest mailto | `03/04/04b/04c-*.png` |
| Trust | `/safety` | One system, no bridge fallback, ≥44px targets | `05-safety-1440.png` |
| Auth | `/login`, `/register` | C1 law: grey canvas, white card, ink pill, #0066cc links; honest "Sign-in is temporarily unavailable" without local Firebase config | `06/07-*.png` |
| Updates | `/updates` | "Prepare email request" + "Nothing is submitted from this page. Your email app opens a draft for you to review and send." | `08-updates-signup-1440.png` |
| Partners | `/partners` | mailto draft copy + "Nothing is submitted from this page" + "Reply within 5 business days" | `09-partners-1440.png` |
| Dashboard gate | `/dashboard` | Honest signed-out state ("Sign-in is temporarily unavailable… Retry loading account"); signed-in dashboard requires a real founder session (boundary, not a defect) | `10-dashboard-gate-1440.png` |

## DOM honesty receipts (`walkthrough-receipt.json` → `scrolledChecks`)

- `downloadComingSoonButtons`: 5/5 buttons `disabled: true`, `title="Available at launch"`, tap area ≥44×44 — genuinely disabled-with-reason (C4), zero fabricated store badges (`hasNoFabricatedStoreBadge: true`).
- `downloadHonestCopy`: "being prepared" ✓, "Prepare email request" ✓ (mailto draft flow, not a lying subscribe).
- `updatesHonestCopy`: "Prepare email request" ✓, "Nothing is submitted from this page" ✓ (the "has not subscribed you automatically" sentence is the post-submit success state, reached only after the mailto handoff).
- `partnersHonestCopy`: mailto draft ✓, nothing-submitted ✓, reply-time chip ✓.
- `dashboardGate`: no silent crash — honest unavailable state with retry door.

## Notes for the reviewer

- Full-page pricing capture shows a blank band below the Institution section: lazy FAQ/trust sections do not mount during Playwright fullPage capture (virtual scroll, no observer events). Not a product defect; viewport harness + qa:continuity cover those sections.
- The dashboard signed-in surface remains founder-session territory; the gate state is the honest local preview boundary recorded in PRODUCT_SURFACE_AUDIT (`auth-session-profile: connected/server`, hosted checks pending).
- Evidence captured by `zcode_tmp/e2_walkthrough_capture.mjs` + `e2_honesty_checks.mjs` + `e2_platforms_shot.mjs` (scratch scripts outside the repo); outputs committed here.
