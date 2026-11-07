# KAN-42 — owner projections final engineering handoff

7 November 2026. Source ID DATA-07. This supersedes the unfinished repair
checkpoint and the original disconnected DDL review for current execution state.

Original implementer: deepseek. Corrective implementer/verifier: Codex `/root`.
Separate reviewer: `/root/kan42_final_review`; exact decision recorded below once
returned. Candidate implementation: `7087b81451fd718dfe3c1b9bf10d615b62f40bae`.
Original candidate: `2947c3860e5fc74f20c4cc9dc907e63e4967269f` (rejected).
Current dev baseline: `d3bc3630cb0fd96c4140421b1dccb1111d780f6a`.
Original branch: `codex/deepseek-kan-42-owner-projections`.
Single checkout: `C:/Users/Administrator/nv-worktrees/deepseek-kan-42-owner-projections`.
Review/integration: [PR 46](https://github.com/ecohdeep786/New_Visionary/pull/46).

## Accepted scope to assess

Backend projection engineering: registered authenticated API, real owning-store
adapter and allowlisted account/domain DTOs, bounded continuation, current
permission/deletion behavior, configuration isolation, failure/recovery and
reproducible tests. No migration or new persistence authority. The API contract
is [OWNER_OVERVIEW_API](../../../integration/OWNER_OVERVIEW_API.md).

This implements the backend scope submitted for DATA-07; it does not close
Cloud SQL/hosted rollout, private-model/content/provider qualification, real-user
policy decisions or ROLE-08 client adapters. No frontend source is modified and
no production configuration is enabled. Those acceptance gates remain separate.

## Findings corrected

1. Runtime extras, including a nested profile credential, escaped TypeScript DTO
   annotations. Explicit field allowlists now apply at SQL selection and the
   service boundary; objects in scalar fields fail closed. Raw command results,
   error details and network/session/payment identifiers are excluded.
2. Shared workspace DTO returned the owner's OWNER role to a MEMBER. The real
   SQL adapter derives the current viewer role, rejects forged non-owner OWNER
   memberships and checks current membership and tombstones on every read.
3. Overflowing page-size strings were accepted and three lists were unbounded.
   All five collections now use strict 1–50 cursor pages with limit+1 database
   fetches and immutable-ID ordering. Foreign/missing cursors expose no rows.
4. The disconnected module silently supplied memory data and was not registered.
   It is retired. FirebaseProductModule registers the controller with the lazy,
   opt-in real adapter; unavailable/disabled SQL never falls back to fiction.
   Current session/account verification, no-store and rate budgets precede reads.
5. Registered routing must have one `/api` prefix, pagination must return 400,
   erased actors 403 and store outages a redacted 503 with no partial result.
   Controller composition and actual Chromium requests exercise these outcomes.
6. Independent review found the data checker omitted three tested adapters from
   clean compilation. `src/overview/**/*.ts` is now included; 37 tests pass from
   a fresh data compiler output, without the previous full-build artifacts.

## Actual verification

| Gate | Result |
| --- | --- |
| Locked backend install, explicit Prisma generation | Passed |
| Whole Nest build and selected production TypeScript graph | Passed |
| Focused unit/config/HTTP/real PostgreSQL tests | 37 passed, 0 failed |
| Same tests loaded from fresh `tsconfig.data.json` output | 37 passed, 0 failed |
| Existing DATA-01 through DATA-06 regressions against SQL/Firestore | 155 passed, 0 failed |
| Existing full backend suite with actual loopback Firestore emulator | 162 passed, 0 failed |
| Chromium through registered FirebaseProductModule, no identity/session stubs | Four groups passed |
| Generated source inventory | 55 registered endpoints; no frontend control changes |

Browser groups cover actual emulator-issued and Admin-verified session cookies,
Firestore account/billing reads, SQL owner/member projections, 20/5 pagination,
account switch denial, membership removal, tombstones, disabled/re-enabled
overview, and real SQL SELECT privilege loss/restoration with 503 -> 200 and no
partial data. Bound to demo project `demo-visionary-kan42`, loopback Auth 59042,
Firestore 58042 and disposable SQL 55442. No live account/store or paid resource
was accessed. PostgreSQL image digest ends `ff87138949ad...`; Firestore emulator
image `c3b114528245...`; full image inspection can be reproduced from the retained
task-local containers before retirement.

Receipt: ignored `artifacts/qa/kan42/browser-receipt.json`, SHA256
`ca5825aeaadf0682c53889e72c3d4ac9cd339576332bab96d3d149870f7b97b4`.
Capture and clean compiler output are beside it. Before checkout removal,
preserve non-reproducible local evidence outside the checkout and verify hashes.

The initial 110/111 broad result was missing the Firestore emulator. After it
started, a first 159/162 run exposed a local build setup omission: plain Nest
build did not copy the policy JSON asset. The normal selected production
TypeScript graph emits that declared asset; the complete rerun passed 162/162.
These earlier incomplete results are superseded by the recorded successful runs.

## Review, integration and cleanup receipts

Independent exact-source decision: pending.
Candidate CI and integrated-dev CI: pending.
Accepted dev merge and read-back: pending.
Completed checkout retirement and final Jira status: pending.

Do not advance to the next task until those receipts are populated. Earlier
retired repair-branch references are historical only: its commits were preserved
by a fast-forward into the original branch and the duplicate ref was deleted.
