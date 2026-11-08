# KAN-128 / RELEASE-05 — Recovery Drill Receipt

**Date:** 2026-11-08
**Lane:** zcode backend/ML specialist lane (founder-assigned)
**Branch:** `zcode/kan-128-release05-restore-drills` (worktree `nv-worktrees/kan-128-release05`; lane stack `zcode/kan-102-bill01-ingress-acceptance` → `zcode/kan-103-bill02-webhook-acceptance` → merge of `zcode/kan-123-accept07-migration-rehearsal` → this branch; base `origin/dev` @ `4bb3c22d`)
**Reviewer:** pending per D-095 — this receipt is submitted evidence, not a merge approval.
**Status:** RECOVERY DRILLS COMPLETE — the full region-outage drill, hosted PITR controls and object-storage restore remain the operator's external gates.

## Task

Execute SQL/Firestore/object restore, reconnect, region-outage procedure,
deletion replay, payment reconciliation and deployment rollback against the
stated RPO/RTO objectives (launch-operations incident table).

## Claim verification (before starting)

- KAN-128 had NO local or remote branch from any lane; `blockedBy: []`;
  planningOrder 136 — the next implementable unclaimed task after the
  BILL/ACCEPT local set was exhausted (ACCEPT-03/06 claimed by the principal
  lane; ACCEPT-01/02/04/05/08 blocked or participant-gated; BILL-06/07,
  RELEASE-01/02/03/07/08 hosted/commercial gates).

## What was delivered

- `backend/tests/contracts/release-05/restore-drills.test.mjs` — 5 drills
  over the real product laws (ACCEPT-07 fixture + BILL-01/02 harnesses).
- `scripts/release05-restore-drill.mjs` + `npm run release:restore:drill` —
  env-guarded registered command (typed `BLOCKED_ENVIRONMENT` + guidance for
  DATA_TEST_DATABASE_URL, pg_dump/psql, Java, openssl, compiled runtime).
- Merge of the ACCEPT-07 lane into this branch (shared synthetic data-domain
  fixture); resolution of the two textual-protocol conflicts (package.json
  scripts union; task-executions.json kept ALL lane entries — the file is
  still purely additive vs its inputs).
- `docs/architecture/delivery/RELEASE05_RECOVERY_DRILLS.md` — the drill
  runbook (incident-table coverage map, procedures, external gates).
- `backend/README.md` — D-112 registration paragraph.

## Evidence (green run, 2026-11-08)

| Drill | Proof |
| --- | --- |
| Logical SQL corruption restore | explicit `pg_dump -n <schema>` + `pg_dumpall --globals-only` recovery point; corruption observed post-backup (RPO exposure 0); restore into an INDEPENDENT database (never in place) with roles recreated first; counts + sample records byte-faithful; RTO measured ≪ the stated ≤4h target |
| Deletion replay / tombstone re-delete | the tombstone is a SOFT-DELETE marker (FK Restrict); a pre-deletion backup restored into an independent database resurrects the deleted identity and loses the tombstone — the hazard; the tombstone journal recorded at damage time is replayed after the restore: identity hidden again, tombstone restored |
| Deployment-rollback law | `ROLLBACK_DENIED` over the populated domain (forward-only by design); a drifted registry FAILS preflight (`MIGRATION_PREFLIGHT_FAILED` — schema compatibility is a verified law); the exact reviewed registry verifies cleanly |
| Firestore logical damage restore | paid test subscription established; emulator export = explicit recovery point; the durable billing record destroyed AFTER it; restore restarts the identity plane from the recovery point; account plan + revision and the invoice read back byte-faithful — a fresh Free record was NEVER written over uncertain subscription state |
| Reconnect + reconciliation | stale cookies fail closed after the restore restart (recorded epoch law); fresh verified sign-in recovers the durable paid account; the scheduled reconciliation job still converges from provider facts |

Measured times: `artifacts/qa/release05-restore-drills/<stamp>/restore-drill-report.json`
(RTO seconds vs targets; RPO exposure; external gates list).

## Honest findings recorded during the drills

1. **Deletion is a soft-delete marker, not a row delete.** The reviewed
   schema's `deletion_tombstones` FK is `onDelete: Restrict` against the
   person — a tombstoned person's row REMAINS and every visibility law hides
   it. The replay law is therefore "re-tombstone", not "re-delete rows"; the
   runbook states this because an operator hard-deleting would violate the
   schema law.
2. **An independent restore requires the role globals.** `pg_dump` does not
   dump roles; the drill's restore procedure recreates them first
   (`pg_dumpall --globals-only`) — otherwise the restored schema loses its
   owner and the identity-verification laws would refuse it. Recorded as the
   operator procedure.
3. **Restores are never in place.** Every drill restores into a freshly
   created database and verifies there before any cutover decision.

## Gates (this branch)

- `npm run release:restore:drill` — exit 0 (5/5).
- `npm run data:check` — exit 0 (full data-domain gate incl. the ACCEPT-07
  rehearsal merged into this lane).
- `npm run billing:webhook:acceptance` — exit 0 (BILL-02 regression 8/8).
- `npm run backend:build` — exit 0.
- `npm run check` — exit 0 (lint + typecheck + frontend build + SCOPE-06 runtime).
- `npm test` — 672/672 (dev-base suite; the acceptance/drill suites run via
  their registered commands).

## External gates / boundaries

- Full region outage drill (manual DR RTO/RPO ≤24h), hosted PITR controls
  (Cloud SQL RPO ≤5min; named Firestore DB RTO ≤4h) and object-storage
  restore are owner/operator actions on hosted infrastructure; procedures in
  the runbook.
- No production data, credential or cloud resource touched; Jira transition
  NOT performed (no connector); reviewer pending per D-095.
