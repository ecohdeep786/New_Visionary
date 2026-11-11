# FAP-62 — type role table verified on every public page (receipt)

Date: 2026-11-04 · Verifier: principal frontend review (opencode session) · Live target: dev server 127.0.0.1:4197 (beta @ 431ab63d)

## Method

1. `npm run qa:fonts` — PASS (Google Sans Flex public / Google Sans product, independent tokens, SPA restoration, fallback markers at 390/1440).
2. `npm run qa:design` — PASS (24-route rendered battery: WCAG contrast, 44px hit areas, 200% text, Hindi typography).
3. Live 24-route type-role sweep at 1440 (playwright, computed styles).

## The law (rhythm.css + apple-typography.css)

| Role | Law | Live |
|---|---|---|
| h1 (hero) | 80/64/44, 600 | 80px/600 on every route that ships an h1 (`/` renders the composite hero: h1 element carries the rotating statement, children voice the display law) |
| h2 (section head) | 64/56/40, 600 | 64px/600 on persona, how-it-works, pricing, careers, contact, partners, referral, community, safety |
| card-name (h3) | measured tier | pricing plan names h3 @21px; contact hygiene-panel heads h3 @17px (c3afd5d5 retags verified live) |
| label | 21px, 600, sentence case | present where authored (download, partners, referral, community) |
| document h2 (policy/updates) | subordinate editorial ladder | 28px rendered via the main-scoped bridge rules — sanctioned by the FAP-59 phase-3 law (not drift) |

## Findings

- No off-law section heads remain after 9b71259d / c3afd5d5; the retag targets (pricing plan names, contact hygiene heads) render the card-name tier.
- h1 exists on every public page (probe of `/`, `/about`, `/research`, `/accessibility` — the sweep's null rows were dev-server first-compile races, re-verified with networkidle waits).
- Battery evidence: qa:fonts + qa:design both exit 0 on 2026-11-04.

Card-name retags queued by the earlier receipt: delivered in c3afd5d5 and verified live here. FAP-62 acceptance complete.
