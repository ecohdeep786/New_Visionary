# KAN-58 corrected source review

Reviewer: independent qa-review agent, 2026-11-06.
Reviewed source: `6d2d8e88680d0e961f750edb9b5c61ff16b38f70`.
Base: published `origin/dev` `3850433bb0d1f061aaeae5ed7e849d949c75b2da`.
Decision: **CHANGES REQUESTED**, including for dormant durable-source integration.

## Confirmed findings

1. **Cumulative byte counters overflow on permitted delivery.** Migration 4 and
   both Prisma models use Int32 for `bytesDelivered` / `deliveredBytes` while a
   gateway supports repeated reads and an export supports up to 500 objects.
   The actual exact-source gateway and ExportService, using the actual durable
   store on PostgreSQL16, both rejected an owned READY four-byte read after
   accounting was seeded to 2147483646. Each returned P2010 / SQLSTATE22003.
   Positive default issuance/read and a normal export read passed first. The
   refused transaction preserved the prior counter; permission was valid but
   the accounting storage could not represent a valid next total. Use an
   appropriately bounded wider representation consistently across DDL, model,
   store and numeric mapping; test a successful Int32 crossing and the chosen
   upper bound without allocating multi-gigabyte fixtures.
2. **Expiry sweep records revocation on a non-revocation transition.** The
   activeOnly `updateGrant` SQL always writes `revokedAt=clock_timestamp()` when
   the patch omits a timestamp. `expire()` passes only `{state:'EXPIRED'}`;
   `requireReadable` then checks revokedAt first and reports revoked rather
   than expired. Preserve timestamps for non-revocation transitions, and test
   actual SQL sweep followed by gateway/signed-link reads against typed errors.

## Verified repairs and limits

Static inspection confirms migration v1 is restored, migration4 is additive in
canonical history, and both delivery methods take an owner-scoped row lock
before evaluating fresh wall time in a subsequent statement. These address the
previous source defects; they do not authorize connected delivery. The separate
consent/source/HTTP/READY/browser/provider gates in the implementation handoff
remain open. No controller/module activation was added by this candidate.

## Reproduction

`evidence/KAN58_CORRECTED_COUNTER_PROBE.cjs` loads the exact reviewed TypeScript
from Git in memory. It verifies lockfile dependency versions/integrities and the
matching generated Prisma model, then uses dependencies read-only. It creates
isolated synthetic schemas and roles on the explicitly admitted loopback55437
fixture, applies actual canonical DDL, calls actual gateway/export/store code,
and removes owned schemas/roles in finally. PostgreSQL was stopped afterward.
No provider, Firebase account or customer data was mutated.

Sanitized observed results are retained in
`evidence/KAN58_CORRECTED_COUNTER_RESULTS.json`. Probe exit0 means the unsafe
outcomes were reproduced as asserted; it is not passing product acceptance.
A corrected exact source requires a new independent decision and complete CI.
No merge, Jira Done, browser download or production readiness is approved.

## Additional export bounds finding

Exact-source `evidence/KAN58_EXPORT_BOUNDS_PROBE.cjs` confirms a READY object of
8 bytes is refused by the gateway under maxDeliverableBytes=4, but accepted and
returned by ExportService under the same policy. Export count alone does not
bound per-object or aggregate bytes. Require explicit per-object and aggregate
checks at creation and delivery, including buffered and callback paths. The
probe uses a tiny synthetic object and in-memory store; it reproduces the actual
service code but does not establish provider or browser acceptance.
