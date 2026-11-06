# KAN-58 FILE-03 durable download store: corrected review handoff

Scope: a dormant PostgreSQL download/export store and bounded service foundation.
No product controller, provider URL, module activation or UI download permission is
installed by this increment. Full KAN-58 acceptance remains open.

## Repairs submitted for independent review

- Preserve accepted migration v1 and versions 2-3. Add download tables, indexes
  and owner foreign keys in canonical migration 4, requiring version 3.
- Grant and export delivery lock the owner-scoped row before evaluating fresh
  wall time in a later statement. A wait past expiry commits no accounting.
- Bound gateway and signed-link read budgets to the PostgreSQL Int32 range.
- Register both FILE-03 suites in the complete data check and record the
  intentional imported Prisma model patch in the source provenance ledger.
- Historical v1 tests assert its ten tables. Current physical DDL is checked
  against the full migration chain and Prisma models by domain-ddl.mjs.
- Added actual SQL default gateway persistence/read, empty-staging v1-3 to v4
  receipt-preserving upgrade, and retained-data refusal tests. The existing
  NON_EMPTY_STAGING_DENIED gate is preserved; this is not authorization to run
  migrations against a populated customer database.

## Verification and environment

The previous checkpoint passed 14 domain and 9 PostgreSQL delivery cases.
The revised full registered data check is in progress against disposable schemas
on loopback PostgreSQL 16, with a pinned local Java 21 Firestore emulator. Logs
are retained outside Git under Visionary-local. Exact candidate CI and separate
review are required before integration; the earlier adc1a4d8 rejection remains
valid historical evidence and does not approve this replacement.

## Open product and release gates

- Authenticated HTTP gateway and current workspace/source authorization.
- KAN-56/KAN-57 real READY immutable object ownership and provider integration.
- Final delivery transaction bound to KAN-40 consent serialization; checking a
  resolver before consuming a grant does not serialize consent revocation.
- Connected browser positive/deny/revoke/two-device outcome, hosted deployment,
  operational acceptance, and a separately reviewed populated-data migration.

These gates prohibit enabling this foundation or claiming private delivery is
production-ready. No browser download acceptance or Jira Done is claimed.

## Independent decision

Pending on the final implementation SHA. The implementer cannot approve it.

Review follow-up: cumulative counters now use BIGINT with native 0..9007199254740991 checks. SQL entrypoints reject invalid deltas and unsafe totals under the row lock; tests cross Int32 and reach the exact safe maximum before denial. Expiry sweeps preserve revokedAt for non-revocation transitions. The CLI plan test now expects canonical versions 1-4. These repairs require a new exact-SHA decision.

