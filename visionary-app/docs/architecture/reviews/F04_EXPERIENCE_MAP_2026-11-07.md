# F-04 Engineering Receipt — Purpose architecture, CTA trace and journey contracts

Task: F-04 — Chief Experience Architecture & Page Journey Engineer (V5 specialist pack)
Date: 2026-11-07
Baseline beta SHA: 0f31094e (fresh origin/beta; includes F-01..F-03)
Worktree/branch: `C:/Users/Administrator/nv-worktrees/f04-experience` · branch `zcode/f04-experience-map`
Governance: founder-authorized beta-only workflow; D-095 independent review remains PENDING.

## Verified state (S01–S05, live click journeys, Edge 156.0.4314.58, preview server 4197, 1440 + 390)

- **S01 PASS** — student persona CTA "Start learning free" → `/register` (register → onboarding → student workspace); teacher/parent/professional same shape with role-specific labels; verified in the rendered DOM, not diagrams.
- **S02 PASS** — parent and organization value propositions are distinct in voice and action: "Start free" vs "Talk to us" → `/contact` (the B2B path), verified live.
- **S03 PASS** — /research carries "Building the mentor intelligence." + latest-studies structure with no shipped-model overclaim.
- **S04 PASS** — pricing states "English, Hindi & Bengali" (zero "20+ languages" overclaims) with an explicit `/register` door; download keeps "Coming soon" beside the live "Open Visionary" web door.
- **S05 PASS** — trust pages expose rights/choices/requests and `visionary.org.in` contact schemes.

## Work packages and deliverables

1. **Purpose matrix** (all 24 public pages + auth + redirects): audience · problem · promise · proof · primary CTA · follow-through → `docs/visionary/design/F04_EXPERIENCE_MAP_2026-11-07.md`, with page-family differences preserved (six distinct persona voices; distinct research/about/community/careers heroes — verified live h1s).
2. **CTA_TRACE.csv**: `scripts/cta-trace.mjs` walks every public page family with the surface audit's control extractor and resolves each destination against the route graph — 118 destination-bearing controls across 37 files: 80 internal-route, 21 internal-anchor, 17 contact-scheme, **zero dead ends, zero external links**.
3. **CTA contract regressions**: `tests/cta-trace.test.mjs` — 5 assertions: no dead ends; persona primary journey (role-specific labels + destinations incl. organization→/contact via the shared `CtaPair` defaults `/register` + `/how-it-works`); secondary path coverage; pricing/landing conversion doors; truthful contact schemes (≥3 `@visionary.org.in`).
4. **Journey reviews re-run**: persona-review 18/18 PASS · company-review 30/30 PASS (all doors resolve, images load).
5. **Downstream contracts** recorded in the experience map (CtaPair pairing law, new-page checklist, anchor semantics, language-claim law, contact identity, token ownership boundaries).

## Defects verified — and their state

No in-scope IA/CTA defect required a source change in this wave: the recorded corrections (F-01 deep-link recovery; F-31 truthful claims) stand, and this wave's contribution is that the journey architecture became a machine-checked contract (trace script + 5 regressions) instead of an audit claim. Every package recorded `initial state → problem → root cause → behavior → change → test → proof`; the no-change packages carry live verification proof per the master rules' no-change law.

## Gates

lint 0 · typecheck 0 · **npm test 678/678** (673 + 5 new CTA contracts) · build 0 (16.8s) · persona-review 0 · company-review 0.

## Integration

Candidate SHA: this commit. Merged non-force (fast-forward) into `beta` and PUSHED to origin per the founder's instruction; post-merge smoke: route-contract + cta-trace suites on the merged checkout; preview server left running for founder review. Reviewer: PENDING per D-095.

Final status: DONE_AND_VERIFIED_BETA
