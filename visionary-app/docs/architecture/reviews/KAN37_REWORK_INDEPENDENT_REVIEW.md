# KAN-37 replacement independent review

25 October 2026 (Asia/Calcutta). Jira/source: KAN-37 / DATA-02.

**Decision: approved for dev integration as bounded PostgreSQL migration/backfill development preparation. Verification: passed.** No blocking defect remains in that scope at the exact implementation below. Full DATA-02, platform provisioning, shared migrations, connected product acceptance and production release remain open. This decision does not authorize Jira Done or completed-task worktree removal.

## Responsibility and exact source

- Implementer: Codex `/root`, taking over DeepSeek's existing task at founder direction.
- Independent reviewer/verifier: separate agent `/root/kan36_rework_reviewer`, accepting responsibility for this KAN-37 review. The reviewer edited only this report, review probes/compiler and evidence fields/documents; no implementation source was edited by the reviewer.
- Exact approved implementation and submitted handoff/receipt: **`6639a4dd9c211a669573bb960a1f27e8761b928c`**.
- Accepted base/current published dev: `27ba46b73e08071049c36f7999ddf0367e50738d`. Remote ref and integrated [CI 40199709861](https://github.com/ecohdeep786/New_Visionary/actions/runs/40199709861) were independently verified; checks passed and production was skipped. The KAN-36 integration receipt update accurately records bounded acceptance and retains its full open gates.
- Original rejected candidate: `d1488861c54a911dac166a138ca9d5424f70a40f`. Prior rejection report is preserved. Intermediate replacements `584e46d3a4fb0aa6e9b3a1608b2370dca27f0430`, `e09c736a156f6893c5166564a3bec88a6c60d8c3` and `36c6fed47722265b484c8dedbcd1ff52d6bbc51b` are not approved independently of the final corrections.
- Existing worker `deepseek-kan-37-data-migrations` and existing review checkout `qa-review-kan-37-data-migrations` were retained. Exact candidates were merged into the existing reviewer branch without resetting prior history or creating a worktree. Backend/scripts/integration/package/workflow content was compared with the final submitted candidate.

Live Jira was read: KAN-37 is Testing; the original requirement includes versioned migrations, distinct identities, bounded resumable backfills, compatibility/rollback and the phase-wide server-authority exit. This report accepts only the explicitly submitted disposable PostgreSQL preparation. The full task and linked gates remain open. No Jira mutation, dev merge, main promotion, production action or KAN-38..42 edit was performed by this reviewer.

## Corrections and tested behavior

The Map simulator and partial copied registry are replaced by actual PostgreSQL execution of the single accepted DATA-01 migration artifact. All ten domain tables, quoted identifiers, enums, constraints and indexes are exercised with the real workspace repository. The baseline is explicitly non-reversible. Separate synthetic additive migrations demonstrate physical rollback without removing baseline fields. Existing account/profile/billing authority remains in Firestore.

Both connections authenticate as their configured, distinct PostgreSQL roles. The migration role must be a non-superuser schema owner. Runtime authority checks cover privileged flags, schema/database CREATE, migration-role membership and ownership, plus writes to migration/backfill control tables and USAGE/UPDATE of their sequences. Checks conservatively include all MEMBER-reachable roles, including NOINHERIT delegation accessible through SET ROLE. PUBLIC/inherited/default grants are included. Runtime identity is checked before the transaction; explicit runtime-role privileges are rechecked inside it before commit, seeing newly created control tables. SELECT-only control access is permitted.

A schema advisory transaction lock serializes migration and backfill invocations. Pending SQL and append-only receipts share one PostgreSQL transaction. Source artifacts are checksum-bound across version/name/prerequisites/up/down/reversibility; empty, unordered, duplicate or invalid prerequisite registries fail closed. Only a restricted single-statement set of transactional domain DDL and synthetic INSERTs is supported. Transaction/session/role control, CALL/DO and multi-command escapes are refused before forward or rollback DDL. This is a reviewed internal artifact contract, not a sandbox for arbitrary untrusted SQL.

Cold connection/process read-back and a deliberately lost post-commit acknowledgement reconcile durable history without duplicate apply. Physical columns/defaults, constraints, indexes and enum values are fingerprinted; tested drift blocks apply and rollback. This fingerprint is not a complete audit of views, triggers, RLS policies, sequence state, operational settings or production client compatibility. Pending DDL and rollback over retained domain rows are denied, without a boolean override. Nontransactional or retained-record migration execution is unsupported.

Backfill definitions, cursors, visited cursors, per-key payload digests and checkpoints persist in PostgreSQL. Actual non-idempotent database INSERT writers, deduplication markers and checkpoints commit together. Stable duplicates skip the writer; changed payload/definition is rejected. Row/page/batch/time budgets, no-progress/cyclic cursors and cancellation are exercised. A source outage after a completed page preserves that page and resumes its cursor; cancellation after a writer INSERT rolls the page back. Writers must use only the provided transaction, sources must provide stable versioned pages, and neither external effects nor malicious callbacks are accepted by these guarantees.

The data command compiles both focused source sets and runs both PostgreSQL suites in the existing required CI data step. The connected product module graph does not import this machinery. No runtime activation, shared database application, new product endpoint or new upstream source patch is introduced by DATA-02.

## Findings discovered during this review

The reviewer did not accept earlier green test runs as sufficient. Additional actual PostgreSQL probes established:

1. At `584e46d3`, CREATE TABLE followed by COMMIT and a failing statement left an unreceipted committed table. An unordered independent registry also applied successfully and immediately failed verification. These were reproduced against separately compiled reviewer source, then corrected by the statement gate and strict ordering checks at `e09c736a`.
2. At `e09c736a`, a runtime role granted ledger INSERT/UPDATE/DELETE was accepted despite its ability to mutate migration control state. `36c6fed4` added control-table/sequence checks and an in-transaction pre-commit check to catch newly created objects with default grants.
3. At `36c6fed4`, a NOINHERIT runtime member could SET ROLE into a separate ledger-write grantee, successfully update the ledger, and still pass the adapter's effective-privilege check. The final `6639a4dd` checks all MEMBER-reachable roles. Its regression also covers delegated schema CREATE.

All eleven final reviewer probes now pass against the separately compiled final source. The probes retain explicit schema/role cleanup and use only randomly named synthetic fixtures.

## Independent verification

Environment: Windows, Node 24.19.0, locked Prisma 5.22.0, native PostgreSQL 16.15 on loopback port 55436 in guarded disposable `visionary_data_test_local`. Synthetic roles/data only. No product Firebase record, shared/hosted SQL database, provider or protected user content was used in database testing. Worker dependencies were read-only, with matching backend lock hashes; the reviewer made no dependency copy or junction. Linux CI supplies the clean locked-install check.

| Independent check | Result |
| --- | --- |
| Final candidate PostgreSQL suites plus runtime/provenance regressions | Exit 0; **60 passed**, zero failed/skipped/cancelled: 20 DATA-01, 32 DATA-02 and eight runtime/provenance tests. |
| Separate focused TypeScript compilation of reviewer DATA-02 source | Exit 0; `evidence/KAN37_REVIEW_COMPILE.cjs` verifies the matching dependency lock, borrows only compiler/types and emits under ignored reviewer artifacts. |
| Additional probes against that independently emitted repository | Exit 0; **11 passed**, zero failed/skipped/cancelled: transaction escape, registry order, non-DDL/multi-command control, invalid down artifact, direct/default/PUBLIC/delegated control grants, sequence USAGE, actual constraint drift, late cancellation rollback and next-page recovery. |
| Layout and upstream provenance | Exit 0; 3,842 baseline imported files plus four recorded patches / 11 changed files. |
| Source identity and whitespace | Final implementation equals the candidate; `git -c core.whitespace=cr-at-eol diff 27ba46b7 6639a4dd --check` passes. Backend locks match. |

Commands from product roots:

```text
node --test backend/tests/contracts/data-01/*.test.mjs backend/tests/contracts/data-02/*.test.mjs scripts/tests/backend-runtime.test.mjs scripts/tests/upstream-patches.test.mjs
node docs/architecture/reviews/evidence/KAN37_REVIEW_COMPILE.cjs <review-product> <same-lock-worker-backend>
node --test docs/architecture/reviews/evidence/KAN37_REWORK_PROBES.cjs
node scripts/verify-layout.mjs
node scripts/verify-imports.mjs
```

The probes use DATA_TEST_DATABASE_URL for the guarded disposable database, KAN37_WORKER_PRODUCT for the fixture/dependency checkout, and NODE_PATH for its read-only dependencies. They use separately emitted reviewer classes by default. No credential values or local browser account contents are committed.

Failed attempts are retained as part of the evidence: the first `584e46d3` full 55-test local run passed 52 and failed three during severe Windows I/O contention. First-UID provisioning could not obtain a transaction in time; the cancellation and hanging-source cases failed during canonical fixture setup when 15-second transactions expired, before exercising those target behaviors. A first unordered-registry probe also expired before its later successful reproduction. These attempts are not counted as passes. Once contention cleared, all 56 tests at `e09c736a` and 59 at `36c6fed4` passed, followed by the final 60 above. A first delegation harness lacked schema USAGE and failed with permission 42501; after adding the required synthetic grant it demonstrated the real delegation defect. No production timeout or deadline was weakened to obtain these results.

## Product evidence, CI and integration conditions

The reviewer inspected the implementer's local route receipt and mobile screenshot under `C:/Users/Administrator/Visionary-local/kan37-rework/browser/`, rather than repeating the user's signed-in browser session. Evidence records Professional-role Home/Learn/Ask/Practice/Build/Privacy, session reload and a readable 390x844 Home with bottom navigation. Six-route/mobile evidence was captured at `e09c736a`; a final Home reload passed at `6639a4dd`. Frontend and connected auth source are unchanged across those data-only corrections. `KAN37_LOCAL_BROWSER_VERIFICATION.md` preserves that distinction. This is existing-product regression evidence, not a connected migration/backfill UI outcome.

The task-local GitHub helper was inspected before invoking only read-only runs/jobs operations. Final implementation [CI 40203665311](https://github.com/ecohdeep786/New_Visionary/actions/runs/40203665311) at exact `6639a4dd9c211a669573bb960a1f27e8761b928c` independently reports **success**. Checks job `121199944481` passed clean locked installs/audits, the full ordinary root check, backend installation, PostgreSQL-backed data:check (52 PostgreSQL cases), deployed-lock product verification and Node/Python infrastructure checks. Production job `121200353350` was **skipped**. Prior clean CI runs at `584e46d3`, `e09c736a`, `36c6fed4` and browser-doc head `96eea7d4` also passed; their success does not approve the defects subsequently found. The final review-containing PR head must still pass checks before integration, followed by checks of the published dev result. [PR 28](https://github.com/ecohdeep786/New_Visionary/pull/28) targets dev. No future integration or CI outcome is asserted by this report.

Remaining gates include full DATA-02/phase-wide authority, full KAN-36 domain/source/policy scope, reviewed Cloud SQL identities/provisioning, hosted and retained-record migrations/backfills, operational rollback, connected two-device flows and applicable privacy/source/release acceptance. No dependent KAN-38..44 implementation is approved or activated by this decision. Keep KAN-37 open/Testing and preserve its worktrees; only its bounded preparation may integrate into dev after the exact-head checks. Relevant source changes, merge conflicts or changed shared contracts require renewed review.
