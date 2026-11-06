# KAN-41 durable metadata commands: independent review

Decision: **CHANGES REQUESTED** for exact implementation
`a757c65ccec6a5a39ed8af1c6ab952f878fbb358`.

Reviewer: separate `/root/kan41_durable_review` agent. Reviewed from a fresh
`qa-review-kan-41-durable-commands` checkout based on verified `origin/dev`
`e12de19c5af5a623a1cd3743fbba16d745ef5188`, then fast-forwarded to the exact
candidate. Only this report and review evidence were added by the reviewer.

## Findings

1. **P1: Resource revision resets when the actor changes or receipt history is
   removed.** The latest-revision aggregate filters both `uid` and `workspaceId`.
   Actual PostgreSQL: owner A commits metadata revision1; the same workspace
   transfers to owner B; B submits expectedRevision0 and successfully writes a
   second revision1. A stale zero-revision command therefore overwrites a resource
   already changed. The same behavior occurs after deleting the previous Person
   and its cascading command receipts. Removing only the UID filter cannot fix
   receipt-erasure reset. Persist the resource's revision independently of actor
   and receipt lifecycle, and compare/increment it in the owning transaction.
   Revisions may be scoped to the explicit metadata domain, but must follow that
   workspace across owner changes.

2. **P1: A retained workspace tombstone is bypassed by changing the owner.** The
   tombstone query applies the current actor UID to both person and workspace
   markers. Actual PostgreSQL: a retained workspace marker blocks owner A, then
   the workspace transfers to B; B successfully mutates that same marked resource
   while the marker remains present. Person-erasure checks should stay scoped to
   the person. Workspace-erasure checks must follow the workspace resource
   identity across ownership changes; wall-clock expiry alone must not revive it.

## Executed evidence

`evidence/KAN41_REVISION_TRANSFER_PROBE.cjs` loads the exact committed TypeScript
source via a review-only in-memory transpiler. It validates 653 installed lock
records/integrities and the generated Prisma schema before executing. It uses a
separate synthetic PostgreSQL16 fixture on loopback55437, randomly isolated
schema/migration/runtime roles, and the accepted migration chain1-4. Runtime
commands use the actual DML-only role and target checks. No source, generated
model, dependency, provider or protected user record is changed.

All three counterexamples reproduced and their actual metadata readbacks were
asserted. Initial positive owned write, same-key replay and prior-owner denial
also passed. Sanitized results are in
`evidence/KAN41_REVISION_TRANSFER_RESULTS.jsonl`. Schema/roles were cleaned and
the reviewer-owned PostgreSQL fixture was stopped afterward.

The replacement is meaningfully stronger than the original in-memory candidate:
it performs actual owning-domain writes, and its account/workspace row locking,
full replay tuple and transactionally pending outbox are real. Those improvements
do not waive the two resource-lifecycle failures above.

## Scope and remaining gates

No merge approval for this revision. Keep unresolved implementation findings
In Progress and submit a new exact source after correction. A later approval may
cover only a dormant metadata-command slice if its checks pass. Verified Firebase
caller/controller, released workspace admission/frontend adapter, browser and
two-device outcomes, other domain operations, applicable consent/source checks,
actual KAN-53 dispatch and hosted acceptance remain separate open gates. No full
KAN-41 Done, product activation, browser result or provider acceptance is claimed.
