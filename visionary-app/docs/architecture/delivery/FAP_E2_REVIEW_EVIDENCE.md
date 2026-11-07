# FAP E2 — Review + release evidence (A0 → E1 chain)

**Jira / source ID:** FAP-57 (FAP-E2) · In Progress
**Acceptance scope:** release gate — every rebuilt-chain task (A0→E1) with reviewer-recorded SHAs, delivery integration evidence, Jira receipts, founder walkthrough.
**Implementer (evidence side):** opencode (FAP lane)
**Reviewer:** **PENDING** — a separate agent/founder must accept responsibility and record the exact reviewed commit per D-095. The implementer cannot approve its own work. No reviewer identity or approval is claimed in this document.

This document supplies the evidence side of the TASK_REVIEW_TEMPLATE for the
A0→E1 chain. Per D-095 the reviewer records the decision; nothing below implies
approval. Each row carries the exact implementation/beta merge SHA so a reviewer
can pin the candidate.

## Chain status (live Jira, read 2026-10-28)

| Task | Jira | Status | Implementer branch / head | Beta merge (--no-ff) | Evidence |
| --- | --- | --- | --- | --- | --- |
| A0 | FAP-41 | Done | KAN-201 A0 @ a1cc4040 | beta (baseline) | 81 captures (27 routes × 3 widths), audit/reference/rebuild docs |
| A1 | FAP-58 | Done | KAN-201 A1 @ c30eb5dc (fwd 632a1dab) | beta | token convergence, 24/24 capture probes |
| A2 | FAP-42 | Done | KAN-201 A2 @ 30109a0f | beta | CTA law across Download/Pricing/Auth, 9/9 probes |
| A3 | FAP-43 | Done | KAN-201 A3 @ c979f5ad | beta | hex sweep 1,144 law replacements, DOM scan 27/27 |
| A4 | FAP-44 | Done | KAN-201 A4 @ 63c68a3e | beta | public-bridge burn-down, merge-marker fix |
| A5 | FAP-45 | Done | KAN-201 A5 @ b4cb8490 | beta | activate ui.jsx; retire dep token keys; kill COLORS |
| B1 | FAP-46 | Done | KAN-201 B1 @ 6d54b76b | beta | voice-type ladder, hero one-voice law |
| B2 | FAP-47 | Done | KAN-201 B2 @ 5339f1e5 | beta | kicker voice codified; 29 next-step doors |
| B3 | FAP-48 | Done | KAN-201 B3 @ 3dc6d346 | beta | pricing store-grade table |
| C1 | FAP-49 | Done | KAN-201 C1 @ 69add673 | beta | auth joins one system + real phone sign-in |
| C2 | FAP-50 | Done | KAN-201 C2 @ d04af411 + 0a01fb58 | beta | onboarding joins one system |
| C3 | FAP-51 | Testing | KAN-201 C3 @ 2e88e302 + ba20027a (in beta) | beta | dashboard v-token completion (retire leaked Material) — moved In Progress → Testing 2026-10-29 (readback verified; re-verified AC in beta tree; delivery comment 10342) |
| C4 | FAP-52 | Testing | opencode/fap-c4-forms @ 793ab758 (branch from beta 6883a844) | 3e9532f5 | forms delivery honesty — moved In Progress → Testing 2026-10-29 (readback verified; delivery comment 10344); D-095 review pending |
| D1 | FAP-53 | Testing | opencode/fap-d1-motion @ af6a8047 | 4dc833dd | D1 motion law; receipt 123→0; qa-motion |
| D2 | FAP-54 | Testing | opencode/fap-d2-responsive @ e486bd38 | 794025c1 | 24-route × 5-width sweep 0 overflow; 98→0 sub-44 |
| D3 | FAP-55 | Testing | opencode/fap-d3-performance @ b21f6bc8 | e9d04f05 | F10 split; 135 chunks; Fast3G receipts; D3_EVIDENCE.md |
| E1 | FAP-56 | Testing | opencode/fap-e1-continuity @ 7d6d5d43 | fe984775 | 7 static laws; 24/24 rendered 0 violations; E1_EVIDENCE.md |
| E2 | FAP-57 | In Progress | opencode/fap-e2-review-evidence @ 19c8ada3 | (pending) | this document |

## D-series/E1 review handoffs (TASK_REVIEW_TEMPLATE)

### D1 — FAP-53 (One motion law)
- Implementer: opencode. Reviewer: PENDING.
- Branch/base/candidate: opencode/fap-d1-motion @ af6a8047; base beta@4dc833dd tip before branch.
- Beta integration: 4dc833dd no-ff merge, pushed + ls-remote verified.
- Acceptance → evidence: one motion law `--ease-out-apple` + 180/280/420/650/900 ms scale enforced end-to-end by qa-motion across 403 files; receipt pair 123→0; scripts/tests/motion-law.test.mjs. Full `npm run check` green, 624/624 tests, lint, both typechecks, vite build 47.63s.
- Jira: FAP-53 Testing (transition id 41, comment 10175). Reviewer decision: **pending**.

### D2 — FAP-54 (Responsive + tap targets)
- Implementer: opencode. Reviewer: PENDING.
- Branch/base/candidate: opencode/fap-d2-responsive @ e486bd38; base beta@4dc833dd.
- Beta integration: 794025c1 no-ff merge, pushed + verified; delivery record f6111e6e.
- Acceptance → evidence: full public sweep 320/390/768/1024/1440, 120 rows, 0 overflow; 44px tap law static qa:taps (245 controls/90 files) + rendered receipts; 200% font × 18 routes × 320/390 = 36 combos 0 overflow; hero stacks verified at 390; onboarding labels ≥12px. Full check green (also scope:audit rebaseline).
- Jira: FAP-54 Testing (transition 41, comments 10208/10209). Reviewer decision: **pending**.

### D3 — FAP-55 (Performance + image law)
- Implementer: opencode. Reviewer: PENDING.
- Branch/base/candidate: opencode/fap-d3-performance @ b21f6bc8; base beta@33add512.
- Beta integration: e9d04f05 no-ff merge, pushed + ls-remote verified (e2a6d7c9..e9d04f05); delivery record e2a6d7c9.
- Acceptance → evidence: hero AVIF/WebP measured density; LazyImage everywhere; F10 monolith split (PersonaSections 958L→20 modules, PremiumPersonaSections 1375L→7, SpotIllustration 1223L→dir, LandingNav 785L→dir); 135 chunks/3,088,080B gzip 879,418B, 0 stale monolith chunks; qa-perf budget recorded; Fast3G receipts / 6720|7168, /student 5960, /teacher 6288; CLS 0.041/0.032/0.032; fontsDoubleFetched:false. LCP <2.5s AC **honestly unmet** on raw Fast3G (edge-signature recorded, fast-LCP lever named as next-wave).
- Jira: FAP-55 Testing (transition 41, comment 10318 posted 2026-10-28 after auth restored). Reviewer decision: **pending**.

### E1 — FAP-56 (Cross-page continuity QA)
- Implementer: opencode. Reviewer: PENDING.
- Branch/base/candidate: opencode/fap-e1-continuity @ 7d6d5d43; base beta@e2a6d7c9.
- Beta integration: fe984775 no-ff merge, pushed + ls-remote verified (e2a6d7c9..fe984775); delivery record 3e4e8234.
- Acceptance → evidence: qa-continuity.mjs extended 4→7 static laws; rendered qa-continuity-render.mjs 24-route universe 1440×900@1 vs production dist :4173, 0 violations 24/24 (1036 pill census; 52/52 canonical CTAs); fixes CtaPair leading + apple-typography clauses + DownloadPage/AILearningPage pills; mysteryInk deduped to global token. eslint 0, both typechecks 0, law tests 7/7.
- Jira: FAP-56 claimed Idea→To Do→In Progress→Testing (transitions 21/31/41, comment 10319). Reviewer decision: **pending**.

## Integration / audit doc status

- Audit doc `docs/visionary/design/FRONTEND_PRODUCTION_AUDIT_2026-10-21.md` remains **not** flipped to "production-ready": the E2 AC requires reviewer approvals first (D-095). Flip after the D/E reviews and C3/C4 closure.

## Open predecessors / remaining sequence (see companion walkthrough)

1. **C3 = FAP-51 (Dashboard v-token completion)** — implementation merged in beta; candidate moved to Testing 2026-10-29 awaiting separate reviewer (D-095).
2. **C4 = FAP-52 (Forms delivery honesty)** — delivered in `opencode/fap-c4-forms` @ 793ab758 from beta 6883a844; merged beta `3e9532f5`; handoff doc `FAP_C4_FORMS_EVIDENCE.md`; D-095 reviewer required before Done.
3. **D1–E1 reviewer sign-off** — each in Testing awaiting a separate reviewer's exact-SHA approval → Done.
4. **Founder walkthrough** — landing → pricing → download → trust → auth → dashboard (checklist in companion doc).
5. **Audit doc production-ready flip** — only after the above are accepted.

## Carry note (2026-10-29)

`npm run scope:audit` was red at beta tip before this session: D3's monolith split (beta e9d04f05) left 19 split control files unreviewed and 3 obsolete registry rows. The C4 lane carried the minimal rebaseline (rows inherit the monolith boundary profiles) and regenerated the audit receipts — see `FAP_C4_FORMS_EVIDENCE.md`.

## Jira receipts (this session)

- FAP-55 → Testing (transition 41) + comment 10318.
- FAP-56 → claimed Idea→To Do→In Progress→Testing (21/31/41) + comment 10319.
- FAP-57 → claimed Idea→To Do→In Progress (21/31) + comment 10320.
- Journal: `docs/architecture/tracking/jira-sync-journal.jsonl` appended.
- Execution receipts: `docs/architecture/tracking/task-executions.json` (FAP-D3/E1/E2 entries).
