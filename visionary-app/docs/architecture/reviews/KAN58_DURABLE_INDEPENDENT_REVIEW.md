# KAN-58 durable download review

Reviewer: independent agent `/root/kan58_review`, 6 November 2026.

**Decision: CHANGES REQUESTED.** Do not merge this candidate or move KAN-58 to Done. The source has migration, expiry and default-issuance defects. Connected consent, HTTP, READY-object and browser acceptance also remain open.

## Exact scope

- Jira/source: KAN-58 / FILE-03, durable download and export store foundation.
- Implementer branch: `codex/principal-kan-58-download-fencing`.
- Exact reviewed source: `adc1a4d872a57c491701ffe7a768246fc4923ea1`.
- Accepted dev comparison: `65dee5af76d0ccaa3ee7d8bf52155b64108ac13c`.
- Review branch: `codex/qa-review-kan-58-durable-downloads`, based on that dev.
- Candidate source and dependencies were not modified by the reviewer. Exact source was read with `git show` and transpiled in memory; stale compiled output was not used.
- Read-only dependency verification passed for 653 installed version/integrity records; non-applicable optional platform packages were excluded. Generated Prisma schema matched the exact candidate after whitespace/comment normalization. No install or Prisma generation occurred.

## Blocking source findings

1. **P1 — An accepted installation cannot upgrade.** The candidate adds the two tables by rewriting `prisma/migrations/20261024000001_data_01_workspaces/migration.sql`. Installing accepted v1 through the actual `MigrationRunner` and then applying the candidate v1 fails with applied-migration drift. A retained synthetic Person survives and neither download table is installed. Preserve accepted migration bytes and add a new migration/registry version, with a real retained-data upgrade test. The store comment naming a v4 migration does not install that migration.

2. **P1 — Delivery accepts a lease that expired while waiting for its SQL row lock.** `src/file/download-store.sql.ts:61` defines `CURRENT_TIMESTAMP`, consumed by the grant fence at line 95 and export fence at line 166. The independent probe holds each row using a separate real `SELECT ... FOR UPDATE`, starts delivery, observes the actual PostgreSQL lock wait, waits beyond expiry, and releases the unchanged row. Both delivery writes return `ok: true` after the database clock is beyond the lease.

   A review-only mutation replacing `CURRENT_TIMESTAMP` with `clock_timestamp()` **also reproduces both outcomes**. Changing the clock function alone is insufficient: the predicate can be evaluated before the lock wait. Acquire the serialization lock first, then evaluate current time and authorization in a subsequent statement before the owning-store commit. Retain both actual lock-wait regressions.

3. **P1 — The default gateway grant cannot be persisted.** `src/file/download.service.ts:103` uses `Number.MAX_SAFE_INTEGER` as the default gateway read budget, while `prisma/schema.prisma:509` stores `remainingReads` as PostgreSQL/Prisma Int32. Calling the real `DownloadGateway.issueGrant` without a read override raises `PrismaClientUnknownRequestError`; zero grants persist. A caller-supplied small override succeeds. Align the default, accepted overrides and persisted numeric range, and test the default API shape against PostgreSQL.

## Connected acceptance gate

The current store binds final consumption to grant id, owner, state, revocation and lease. It carries no current consent/policy/source/workspace binding. A live consent lookup in a READY resolver is insufficient: the probe lets the actual resolver observe active consent, pauses at `consumeGrant`, commits actual consent revocation, and resumes. The gateway returns four synthetic bytes and the grant stays ACTIVE.

This is an executable demonstration of the remaining KAN-40 consumer cutover gate, not a claim that a declared future HTTP/READY adapter exists. The final owning-store delivery must serialize with current consent/source authorization; an earlier resolver check or asynchronous revocation event alone cannot establish that boundary. Authenticated HTTP, actual READY ownership from KAN-56/KAN-57, browser/two-device recovery and hosted acceptance were not verified in this review.

## Positive verification and recovery

- Explicitly bounded owner grant: actual durable issue/read returned four synthetic bytes.
- Completed grant revocation: the subsequent gateway read was refused with `revoked`.
- All five unsafe outcomes above reproduced against PostgreSQL 16.15. The default-mode probe exited 0 because it asserts the rejected candidate's observed behavior; this is **not** a passing acceptance test.
- The optional wall-clock mutation probe exited 0 while reproducing both unsafe expiry outcomes, proving that repair alone is insufficient.
- Each run created isolated random schemas and dedicated migration/runtime roles, exercised the actual migration/store/service code, and cleaned those schemas/roles in `finally`.
- The dedicated loopback synthetic PostgreSQL fixture was stopped in `finally`; `pg_ctl status` confirmed no server running. No Firebase, customer account, live object store or provider service was mutated.

## Reproduction and retained evidence

Executable probe: [KAN58_DURABLE_INDEPENDENT_PROBES.cjs](evidence/KAN58_DURABLE_INDEPENDENT_PROBES.cjs).

Sanitized results: [KAN58_DURABLE_PROBE_RESULTS.json](evidence/KAN58_DURABLE_PROBE_RESULTS.json).

With the explicitly validated synthetic target running and the matching read-only dependencies selected:

```powershell
$env:KAN58_REVIEW_TARGET = '<private synthetic-only target configuration>'
$env:KAN58_REVIEW_BACKEND = '<candidate checkout>/visionary-app/backend/upstream/backend'
node docs/architecture/reviews/evidence/KAN58_DURABLE_INDEPENDENT_PROBES.cjs
node docs/architecture/reviews/evidence/KAN58_DURABLE_INDEPENDENT_PROBES.cjs --wall-clock-only
```

The probe itself validates loopback, synthetic database naming, port 55437, dependency integrity and generated model before any test writes. It emits no credentials or connection strings. Local raw startup/stop/probe logs remain outside Git under `C:/Users/Administrator/Visionary-local/kan58-independent-review-20261106`.

No candidate source approval, dev integration, Jira transition or production readiness is asserted. A corrected exact source requires fresh independent review and relevant normal/integrated checks before acceptance.
