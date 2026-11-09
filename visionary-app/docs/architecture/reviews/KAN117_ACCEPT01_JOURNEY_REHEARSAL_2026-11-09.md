# KAN-117 / ACCEPT-01 — connected journey rehearsal review handoff

9 November 2026. Implementer: Senior Principal Backend & ML Engineer (ZCode lane).
Branch `zcode/kan-117-accept01-journey-rehearsal` off `dev` (`2e0b1fbb`). Reviewer:
**pending per D-095**. Not merged into `dev`; worktree left for the reviewer at
`C:/Users/Administrator/nv-worktrees/kan-117-accept01`.

## Acceptance scope

Engineering half of ACCEPT-01 delivered: the released journey chain rehearsed
end-to-end over the real production composition (11/11), as an enabler for the
hosted gate. Full statement:
[ACCEPT01_JOURNEY_REHEARSAL.md](../delivery/ACCEPT01_JOURNEY_REHEARSAL.md).
Evidence: [accept01/accept01-journey.tap](../delivery/accept01/accept01-journey.tap)
and [accept01/journey-report.json](../delivery/accept01/journey-report.json).

The **hosted walk itself** (real hosted adapters, real staging data, real devices)
is the ACCEPT-01 exit and is **NOT** claimed here — recorded as the primary
external gate, per the BILL-01 local-maximum doctrine.

## What changed (test/evidence only — no product source change)

- `backend/tests/contracts/accept-01/journey-stack.cjs` — connected stack adapted
  from the RELEASE-03 admission stack (real `configureProductionHttp`, Auth +
  Firestore emulators, TLS terminator, fictional provider) **plus** the composed
  `PersonalWorkspaceService` so the project step provisions a real SQL workspace.
- `backend/tests/contracts/accept-01/accept01-journey.test.mjs` — 11 tests over one
  account: pricing → auth → onboarding → Free → subscription → invoice → learning →
  project (real PostgreSQL, idempotent replay) → second-device resume, plus
  wrong-user 404s, duplicate-checkout 409, stale-revision 409, revision-bound cancel.
- `scripts/accept01-journey.mjs` runner + `accept:journey` npm script.
- Delivery doc + evidence + review handoff + tracking append.

No product source, no authority-inventory change, no lockfile churn.

## Verification at this branch head

| Gate | Result |
| --- | --- |
| `npm run accept:journey` | **11/11** (emulators + real SQL + TLS + fictional provider, zero network) |
| `npm run check` | exit 0 (roots, 3842-file baseline, qa laws, script tests, surface audit, lint, typecheck, unit, build) |

## Explicitly not accepted here

Hosted walk, real merchant/provider adapters, cross-family journey depth
(offline/change-feeds/Build/deterministic-AIRA) and any deployment/GA step are
hosted gates — the rehearsal proves the connected product behavior locally and
never claims hosted acceptance or a launch decision.
