# KAN-37 (DATA-02) — Versioned migrations, identity separation, backfills, rollback

```text
Jira key / source ID: KAN-37 (DATA-02)
Acceptance scope: preparation / enabler (migration + backfill machinery, tested
                 against in-memory synthetic staging; NOT wired into the connected
                 runtime; no migration applied to any shared database)
Implementer: deepseek (senior principal backend engineer, under codex)
Reviewer: Pending — separate exact-SHA review required; not pre-assigned
Worker branch / base commit / candidate head:
                 branch codex/deepseek-kan-37-data-migrations
                 base 9d6d2b5b0e97213ff2e8778c2a1d7469d8df554e (origin/dev)
                 candidate head <filled at commit>
Current dev commit: origin/dev 9d6d2b5b (unchanged by this branch)
Owned files:
  - backend/upstream/backend/src/data/migration-types.ts
  - backend/upstream/backend/src/data/migration-identities.ts
  - backend/upstream/backend/src/data/migration-store.ts
  - backend/upstream/backend/src/data/migration-registry.ts
  - backend/upstream/backend/src/data/migration-runner.ts
  - backend/upstream/backend/src/data/backfill-runner.ts
  - backend/upstream/backend/src/data/index.ts
  - backend/upstream/backend/tsconfig.data.json
  - backend/tests/contracts/data-02/migrations.test.mjs (12 tests)
  - docs/architecture/delivery/KAN37_DDL_REVIEW.md (this handoff)
Prerequisites: KAN-36 (DATA-01) under Testing; not merged — DATA-02 prepares the
               machinery; the reviewed DATA-01 DDL is registered as version 1
               here for validation. No shared prisma/migrations file was modified.

Acceptance criteria → evidence (each verified by an in-repo test):
- Versioned migrations → registry with ascending unique versions, checksummed
  (test: registry unique/ascending/checksummed; applyAll applies in order).
- Ordering/prerequisite compatibility → preflight refuses a missing prerequisite
  before any statement runs (test: missing prerequisite refused).
- Idempotent apply → re-running applies zero new migrations, stays consistent
  (test: applyAll idempotent).
- No double-apply after outage → injected mid-run outage, resume completes with
  no duplicate ledger state (test: mid-run outage resumes).
- Checksum drift (changed past migration) detected → refused (test: drift).
- Empty-synthetic-staging rule → first non-confirmed apply against non-empty
  domain refused; explicit staged confirmation allows it (test: deny + confirm).
- Separate migration/runtime identities → distinct connection + role enforced;
  migration purpose required; runtime identity denied (test: identity separation).
- Bounded resumable backfills → 500-row batches, persisted cursor, crash
  mid-batch, resume completes 1200 rows with no duplicates; already-done run is
  a no-op; batch bounds enforced (tests: backfill resume + bounds).
- Rollback → newest reversible migration rolls back and history records the
  rolled_back receipt; non-reversible refused; destructive rollback over
  existing records refused without confirmation (tests: rollback + destructive).
- GCP/budget stance → migrations are one-off review-approved jobs (not an
  always-on service), backfill batch ceiling caps Cloud SQL load; no new cloud
  resource, no always-on workload, nothing deployed.

Commands / results:
  - node --test backend/tests/contracts/data-02/migrations.test.mjs → 12 pass, 0 fail
  - node --test scripts/tests/backend-runtime.test.mjs → 3 pass, 0 fail
  - combined 15 / 0
  - npm run product:verify-layout → PASS
  - tsc (tsconfig.data.json) → exit 0 (compiled with @types/node where CI installs it)
  Environment: backend/upstream/backend worktree, compiled dist via focused
  tsconfig, in-memory synthetic store (no live Postgres/Cloud SQL touched).

Remaining defects / limitations / linked open gates:
  - No live Cloud SQL was used; the store is the in-memory synthetic bridge. The
    real adapter (separate migration connection/role against Cloud SQL) is
    wired at integration under PLAT/TEST work; hosted/migration-apply acceptance
    remains open (DATA-02 does not close DATA-01, KAN-38..44 or PLAT gates).
  - Registry version 1 mirrors the DATA-01 DDL for validation; canonical SQL
    remains in prisma/migrations (single source of truth) and is adopted at
    integration when KAN-36 is accepted — no shared migration file was edited.
Hosted / migration / rollback evidence: none performed; this is review-only.
Reviewer decision / verification / dev integration: pending — cannot self-approve.
Next dependent task: KAN-38 (DATA-03) → idempotent personal workspace provisioning.
```
