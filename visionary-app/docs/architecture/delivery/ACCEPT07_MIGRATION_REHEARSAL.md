# ACCEPT-07 (KAN-123) — Migration Cutover Rehearsal Runbook

**Task:** Rehearse the reviewed schema/local-data migration with originals retained — counts, digests and ownership checks; canary cutover and rollback; exactly one executor owns each side-effecting command.
**Status:** rehearsal complete on a disposable local synthetic PostgreSQL; the real staging cutover remains the operator's action.
**Registered command:** `npm run data:accept07:rehearsal` (also appended to `npm run data:check`).

## What the rehearsal proves

Executed by `backend/tests/contracts/accept-07/rehearsal.test.mjs` against one
disposable loopback `visionary_data_test_*` PostgreSQL database (synthetic
records only; every schema/role pair is created and dropped inside the run):

1. **Identity separation (bootstrap).** Distinct `accept07m_*` (schema-owner
   migration) and `accept07r_*` (least-privilege runtime) LOGIN roles per run;
   one role can never hold both identities (`IDENTITY_CONFLICT`).
2. **Originals ledger.** A legacy source schema is seeded and snapshotted —
   count plus per-row SHA-256 digests — once, before any command runs.
3. **Reviewed schema migration via the operator command path.**
   `runMigrationCommand('plan')` archives the registry digest and version list;
   `runMigrationCommand('apply')` applies and verifies with separate role URLs.
   The target domain must be EMPTY at apply time (`isDomainEmpty` treats any
   non-control table as domain) — so the legacy source lives in its own schema,
   exactly as in a real cutover where source and target are distinct stores.
4. **Originals retained.** The ledger digest is byte-identical after the schema
   migration, after the canary and after the full cutover.
5. **Least-privilege ground truth.** The runtime role is refused `CREATE TABLE`
   and control-table INSERT by PostgreSQL itself (`permission denied`), matching
   the store's per-transaction `RUNTIME_*` verification.
6. **Production admission.** A production target is refused on an unapproved
   source SHA (`MIGRATION_SOURCE_NOT_APPROVED`), refused without a verified
   staging receipt (`STAGING_RECEIPT_REQUIRED`), and admitted with a valid
   integrity-checked receipt (≤7 days old, matching registry/versions/schema).
7. **Canary cutover.** `BackfillRunner` migrates exactly the bounded subset
   (`maxRows: 5`) with the reviewed UID-linkage rule (person + personal
   workspace + OWNER membership derived deterministically from the legacy
   identity); the checkpoint records the cursor.
8. **Full cutover.** The same name/definition resumes from the checkpoint to
   completion; the cumulative result reports all N rows exactly once; every
   workspace/membership/person triple shares the canonical UID (owner-faithful).
9. **Definition drift refused.** A changed mapping definition cannot attach to
   the recorded checkpoint (`BACKFILL_DEFINITION_DRIFT`).
10. **Rollback law — forward-only by design.** Every reviewed canonical
    migration is non-reversible: `rollbackLast` is refused on the populated
    domain (`ROLLBACK_DENIED` before the populated-domain guard could even be
    relevant) and reports `NOTHING_TO_ROLLBACK` on an empty one. The runner's
    rollback PATH itself is real — a reversible synthetic probe migration
    applies, rolls back, verifies and re-applies cleanly. Recovery from any
    failed cutover is forward-only from the snapshot, never a downgrade.
11. **Exactly one executor.** Two concurrent `applyAll` calls serialize on the
    `pg_advisory_xact_lock`: exactly one side-effecting execution. Two
    concurrent backfills fence on the checkpoint with a deliberately
    non-idempotent probe write — silent duplication is impossible by
    construction; the final person count is exactly N.

## How to run

```bash
# disposable local PostgreSQL required (loopback, visionary_data_test_*)
export DATA_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5433/visionary_data_test_accept07
npm run data:accept07:rehearsal        # the rehearsal only
npm run data:check                     # the whole data-domain gate incl. rehearsal
```

Missing environment fails fast with a typed `BLOCKED_ENVIRONMENT` record and
guidance — never a silent pass. A JSON report is written to
`artifacts/qa/accept-07-rehearsal/<stamp>/rehearsal-report.json`.

## Operator staging checklist (the real cutover)

The rehearsal report embeds the checklist the staging operator must execute:

1. Freeze writers — stop every product instance writing the target before any
   side-effecting command (exactly one executor).
2. Snapshot the originals — full backup plus the counts/digests ledger of every
   legacy table, recorded before the first command.
3. Separate identities — `DATA_MIGRATION_ROLE` (schema owner) and
   `DATA_RUNTIME_ROLE` (least-privilege DML only) as distinct LOGIN roles.
4. Plan first — archive the registry digest + version list.
5. Apply the reviewed schema migration; re-verify the originals ledger digest.
6. Canary — bounded `maxRows` backfill; verify ownership linkage and original
   digests before proceeding.
7. Resume to completion; verify global counts and ownership faithfulness.
8. Rollback of a populated domain is forbidden by design — recovery is
   forward-only from the snapshot.
9. Archive the verified receipt with the release commit; production admission
   requires it.

## Scope boundaries

- **No production data, credential or cloud resource is touched.** The
  rehearsal refuses non-loopback or non-`visionary_data_test_*` databases.
- **No source change** to the migration infrastructure: the rehearsal consumes
  the reviewed runner/store/command/registry exactly as shipped on `dev`.
- The legacy source, its mapping and the UID rule in the rehearsal are the
  reviewed synthetic model; the real cutover's source inventory is the
  operator's input, and the same laws (ledger, canary, digests, single
  executor, forward-only recovery) apply unchanged.
