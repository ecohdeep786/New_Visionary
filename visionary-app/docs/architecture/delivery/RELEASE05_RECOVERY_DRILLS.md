# RELEASE-05 (KAN-128) — Recovery Drill Runbook

**Task:** Execute SQL/Firestore/object restore, reconnect, region-outage procedure, deletion replay, payment reconciliation and deployment rollback against the stated RPO/RTO objectives.
**Status:** drills complete on the local synthetic estate; the full region-outage drill, hosted PITR controls and object-storage restore remain the operator's external gates.
**Registered command:** `npm run release:restore:drill`.
**Depends on:** the ACCEPT-07 migration-rehearsal fixture (synthetic data domain, identity separation) and the BILL-01/02 ingress + webhook harnesses — this branch stacks on those lanes.

## Stated objectives (launch-operations incident table)

| Incident | Objective to prove | Drill status |
| --- | --- | --- |
| Logical SQL corruption | PITR RPO ≤5min, RTO ≤4h — independent restore, sample record/revision checks, re-delete tombstoned data | **DRILLED** |
| Firestore logical damage | Explicitly selected recovery point, RTO ≤4h — named-DB restore + account/billing integrity, no cross-store atomic claim | **DRILLED** (emulator export/import = the recovery point; named-DB PITR = hosted gate) |
| App revision failure | Restore known-good revision ≤15min; commands/invoices preserved; schema compatible | **DRILLED** (registry-drift preflight = schema-compatible law) |
| SQL zonal failure | Restore usable requests ≤5min — reconnect/jitter/idempotent retries, no duplicate submissions | **PARTIAL** (reconnect + reconciliation drilled; hosted zonal failover = external gate) |
| Full region outage | Manual DR RTO ≤24h / RPO ≤24h, cross-region encrypted backups | **EXTERNAL GATE** (owner-run) |

Post-restore laws (from launch-operations): pause external writes/jobs, verify
Auth UID ownership and deletion tombstones, reconcile payment history from
durable event/provider facts, rebuild projections — and restoring a database
must NEVER create a fresh Free record over uncertain subscription state.

## What each drill proves

Executed by `backend/tests/contracts/release-05/restore-drills.test.mjs`
(5 tests) against the disposable synthetic estate:

1. **Logical SQL corruption restore.** A populated, migrated synthetic domain
   (ACCEPT-07 fixture, separate migration/runtime identities) is dumped
   (`pg_dump -n <schema>` + `pg_dumpall --globals-only` for roles) as the
   explicit recovery point. Logical corruption AFTER the backup (RPO exposure
   0) is observed on the read-back; the restore goes into an INDEPENDENT
   database (never in place) with roles recreated first — the operator
   procedure; restored counts and sample records are byte-faithful; RTO is
   measured against the ≤4h target.
2. **Deletion replay / tombstone re-delete.** The tombstone is a SOFT-DELETE
   marker (FK Restrict forbids a hard person delete under it): the person row
   stays, hidden by every visibility law. A backup taken BEFORE the deletion,
   restored after it, resurrects the deleted identity and loses the tombstone
   — the hazard the replay exists to fix. The tombstone journal recorded at
   damage time is REPLAYED after the restore: the identity is hidden again and
   the tombstone restored.
3. **Deployment-rollback law.** The reviewed migration registry is
   forward-only (`ROLLBACK_DENIED` over a populated domain — recovery is
   snapshot-based) and drift-checked: a registry with drifted statements
   FAILS preflight against applied state (`MIGRATION_PREFLIGHT_FAILED`), while
   the exact reviewed registry verifies cleanly. Schema compatibility is
   verified, never assumed.
4. **Firestore logical damage restore.** A paid test subscription is
   established (BILL-02 helpers); the emulator export is the explicit
   recovery point; the durable billing record is destroyed AFTER it; the
   restore (export → restart emulators from the recovery point → restart the
   product stack) brings the account/billing state back BYTE-FAITHFUL — same
   plan, same revision, byte-identical invoice. A fresh Free record is never
   written over the uncertain subscription state.
5. **Reconnect + payment reconciliation after restore.** The restore restart
   re-stamps the identity epoch (recorded BILL-01 law): stale cookies fail
   closed and a fresh verified sign-in recovers the durable paid account; the
   scheduled reconciliation job still converges from provider facts.

Measured times are recorded in
`artifacts/qa/release05-restore-drills/<stamp>/restore-drill-report.json`.

## How to run

```bash
npm run backend:build          # once
export DATA_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5433/visionary_data_test_accept07
export RELEASE05_PG_BIN=<PostgreSQL 16 bin directory>   # or have pg_dump on PATH
npm run release:restore:drill
```

Missing pieces fail fast with a typed `BLOCKED_ENVIRONMENT` record and
guidance. The drill drops every database/schema it created.

## External gates (owner/operator)

1. **Full region outage drill** — manual DR (RTO ≤24h / RPO ≤24h): run the
   cross-region backup/restore procedure against the hosted estate per
   `infrastructure/gcp/README.md`; the local drills prove the per-store
   restore laws the runbook composes.
2. **Hosted PITR controls** — Cloud SQL PITR (RPO ≤5min) and the NAMED
   Firestore database backup/PITR (RTO ≤4h) are managed-service controls;
   the drills prove the restore/independent-restore/replay procedure the
   hosted controls feed.
3. **Object-storage restore** — bucket versioning/lifecycle restore is a
   hosted control; no product object store exists locally yet.

## Scope boundaries

- No production data, credential or cloud resource is touched; every database
  is a disposable `visionary_data_test_*` loopback database, every identity
  synthetic.
- No product source change: the drills consume the reviewed migration
  runner/store/registry, the billing webhook/reconciliation surface and the
  ingress harness exactly as shipped on the stacked lanes.
- The drill's damage and replay mutations are fixture-only control-plane
  operations and direct synthetic-SQL actions, never product paths.
