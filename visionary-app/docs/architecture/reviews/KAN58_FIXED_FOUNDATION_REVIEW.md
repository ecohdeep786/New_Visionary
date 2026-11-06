# KAN-58 dormant durable foundation: independent approval

**Decision: APPROVED for dormant source integration only.**

Reviewer: independent qa-review agent, 2026-11-06. Exact reviewed implementation:
`b27b5493ec41e8954ad17b93d995a11205216915`. Accepted base:
`3850433bb0d1f061aaeae5ed7e849d949c75b2da` (`origin/dev`).

This decision supersedes the source rejection of `6d2d8e88` for this exact
replacement only. Runtime fixes were inspected at `ca0f684e`; the subsequent
b27 delta changes exactly two explicit DATA-04 registry/count expectations.
The complete independent probe was rerun against b27 Git source, not inferred
from that earlier successful run. No later implementation is approved.

## Why this scope is safe to integrate

- Historical migration versions 1-3 are byte-identical to accepted dev. The new
  schema is an additive canonical migration4. The retained-data migration gate
  is preserved; this does not authorize a populated customer database upgrade.
- Both grant/export consume operations lock their owner-scoped row first and
  evaluate fresh UTC wall time in a later statement before accounting.
- Default gateway issuance fits PostgreSQL Int32 read counts. Cumulative byte
  counts use BIGINT with native nonnegative/JSON-safe upper bounds, validated
  deltas, lock-protected total checks and checked conversion back to numbers.
- Expiry transitions retain null revokedAt and produce the correct expired
  error. Export creation/delivery enforce per-object and aggregate bytes,
  reject oversized stored manifests before callbacks and pin exact identity,
  generation, digest, size and type.
- Source search confirms these classes are not instantiated or registered in a
  controller/module. No product private-download permission or provider URL is
  activated. The outstanding consent/source race is therefore an explicit
  prerequisite to activation, not a claimed repair in this foundation.

## Independent verification

Executable probe: `evidence/KAN58_FIXED_FOUNDATION_PROBES.cjs`.
Sanitized results: `evidence/KAN58_FIXED_FOUNDATION_RESULTS.json`.

The probe loads exact b27 TypeScript from Git in memory. Installed dependency
versions/integrities and the matching generated Prisma model were validated;
verified candidate dependencies were used read-only, without generation or
writes. A separate loopback PostgreSQL16 fixture (55437) used isolated random
schemas, dedicated migration/runtime roles and actual canonical DDL. No cloud
provider, Firebase account or customer record was changed.

Passed independently:

- Actual default gateway issuance/read and actual owned export read.
- Both accounting fields cross Int32, reach the exact Number.MAX_SAFE_INTEGER,
  and refuse excess/invalid deltas with existing totals retained.
- Native SQL CHECK constraints refuse negative and unsafe totals.
- SQL expiry sweep followed by gateway read returns expired and keeps revokedAt
  null.
- Per-object/aggregate export limits and legacy oversized buffered/callback
  reads fail before delivery accounting; callback count remains zero.
- Both grant and export consuming statements were observed in a real PostgreSQL
  lock wait **before** lease expiry (query_start < expiry). Holding the owning
  row across expiry then releasing it produced expired denial and zero bytes.
- Historical migrations 1-3 match accepted dev bytes exactly.
- Independent `node scripts/verify-imports.mjs`: 3842 files, 8 recorded patches,
  17 intentionally changed imported files; passed.

All reviewer schemas/roles were removed in finally. The reviewer fixture was
stopped and pg_ctl stop confirmed server stopped. Raw private setup logs remain
outside Git under Visionary-local/kan58-independent-review-20261106. Earlier
rejection evidence remains preserved and is not passing acceptance.

## Remaining integration and product gates

The implementation handoff reports 29 focused cases passing. Full registered
candidate CI [42245125201](https://github.com/ecohdeep786/New_Visionary/actions/runs/42245125201)
was still in progress at this review receipt. **Require successful complete CI
on b27 before merge, then integrated dev verification before publication
closeout.** This review does not substitute focused probes for registered checks.

Full KAN-58 and connected KAN-40 acceptance remain open: authenticated HTTP
adapter, KAN-56/57 actual immutable READY ownership/provider evidence, current
workspace/source and consent serialization in the final delivery transaction,
connected browser/two-device deny/revoke/recovery, hosted operational acceptance,
and a reviewed retained-data migration path. Do not enable the foundation or
move the full feature ticket to Done from this source approval. No browser,
provider or production readiness is asserted.
