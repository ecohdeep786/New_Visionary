# KAN-123 / ACCEPT-07 — Migration Cutover Rehearsal Receipt

**Date:** 2026-11-07
**Lane:** zcode backend/ML specialist lane (founder-assigned)
**Branch:** `zcode/kan-123-accept07-migration-rehearsal` (worktree `nv-worktrees/kan-123-accept07`, based on `origin/dev` @ `4bb3c22d`)
**Reviewer:** pending per D-095 — this receipt is submitted evidence, not a merge approval.
**Status:** REHEARSAL COMPLETE — the real staging cutover remains the operator's action.

## Task

Rehearse the reviewed schema/local-data migration with originals retained —
counts, digests and ownership checks; canary cutover and rollback; exactly one
executor owns each side-effecting command.

## What was delivered

- `backend/tests/contracts/accept-07/rehearsal-fixture.cjs` — disposable
  synthetic PostgreSQL bootstrap with the reviewed identity separation
  (distinct `accept07m_*` schema-owner / `accept07r_*` least-privilege runtime
  LOGIN roles, legacy SOURCE schema strictly separate from the target domain,
  cleanup boundary drops everything it created).
- `backend/tests/contracts/accept-07/rehearsal.test.mjs` — the complete
  rehearsal: 10 stages, one green run against a disposable loopback
  `visionary_data_test_*` database.
- `scripts/accept07-rehearsal.mjs` + `npm run data:accept07:rehearsal` —
  env-guarded registered command (typed `BLOCKED_ENVIRONMENT` + guidance on a
  missing environment; refuses non-loopback / non-`visionary_data_test_*`
  targets).
- `scripts/domain-check.mjs` — rehearsal appended after data-08.
- `backend/README.md` — D-110 registration paragraph.
- `docs/architecture/delivery/ACCEPT07_MIGRATION_REHEARSAL.md` — the runbook
  (proven laws, how to run, the operator's staging checklist, boundaries).
- `docs/architecture/delivery/accept07/rehearsal-report.json` — committed
  evidence copy of the green run's report.

No migration-infrastructure source was changed; the rehearsal consumes the
reviewed runner/store/command/registry exactly as shipped on `dev`.

## Evidence (green run, 2026-11-07, report digest in the committed copy)

| Stage | Proof |
| --- | --- |
| Identity separation | distinct roles per run; `IDENTITY_CONFLICT` on a degenerate single-role config |
| Originals ledger | 24 synthetic rows, per-row SHA-256 digests, snapshotted before any command |
| Plan artifact | registry digest archived; versions `[1,2,3,4,5]` |
| Schema apply | `runMigrationCommand('apply')` on an EMPTY target domain; status `verified` |
| Originals retained | ledger digest byte-identical after apply, canary and full cutover |
| Least privilege | runtime role refused `CREATE TABLE` and control INSERT by PostgreSQL itself |
| Production admission | `MIGRATION_SOURCE_NOT_APPROVED` → `STAGING_RECEIPT_REQUIRED` → valid receipt admits |
| Canary cutover | exactly 5 of 24 rows migrated (`maxRows` bound), checkpoint persisted |
| Full cutover | cumulative 24/24 exactly once; every person/workspace/membership triple shares the canonical UID (owner-faithful); `BACKFILL_DEFINITION_DRIFT` on a drifted definition |
| Rollback law | reviewed registry is FORWARD-ONLY BY DESIGN — `ROLLBACK_DENIED` on every canonical migration; `NOTHING_TO_ROLLBACK` on empty; a reversible synthetic probe proves the rollback path (applied → rolled_back → verified → re-applied) |
| Exactly one executor | two concurrent `applyAll` → exactly one side-effecting (`pg_advisory_xact_lock`); two concurrent backfills fence on the checkpoint with a deliberately non-idempotent probe write — final count exactly 24 |

## Honest findings recorded during the rehearsal

1. **The reviewed registry is forward-only by design.** All five canonical
   migrations are non-reversible; the populated-domain guard
   (`NON_EMPTY_STAGING_DENIED`) can never be the deciding refusal for
   `rollbackLast` because the reversibility guard fires first. Recovery from a
   failed cutover is snapshot-based, never a downgrade. The runbook and the
   operator checklist state this explicitly.
2. **The apply-time empty-domain law forces source/target separation.**
   `isDomainEmpty` treats ANY non-`_visionary_` table in the target schema as
   domain, so legacy data must live in its own schema/database — mirrored in
   the fixture and called out in the runbook.
3. **Backfill results are cumulative** (`checkpoint.processed + added`), so a
   resumed run's `processed` includes prior invocations; the rehearsal asserts
   the cumulative law rather than a per-invocation count.

## Gates (this SHA)

- `npm run data:accept07:rehearsal` — exit 0 (10 stages, report committed).
- `npm run data:check` — exit 0 (full data-domain gate incl. rehearsal;
  requires Java 21+ on PATH for the pinned Firestore emulator provision check —
  satisfied by the local Temurin JRE 21).
- `npm run backend:build` — exit 0.
- `npm run check` — exit 0 (lint + typecheck + frontend build).
- `npm test` — 672/672 (dev-base suite).

## External gates / boundaries

- The staging cutover itself (and the production admission it feeds) is an
  owner/operator action on hosted infrastructure; this task rehearses it
  locally and hands over the checklist. No cloud resource, credential or
  production record was touched.
- Jira transition to Testing is NOT performed in this session (no connector);
  the task remains unclaimed on the board. The designated reviewer validates
  and merges per D-095.
