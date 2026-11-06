# KAN-41 corrected durable metadata commands: independent decision

**APPROVED for dormant source integration only:**
`4e634634783eafc08cf91757b138e64c00d0d4dd`.

Reviewer: separate `/root/kan41_durable_review` agent, 2026-11-06. Review task
checkout/branch remains `qa-review-kan-41-durable-commands`, originally created
from verified dev `e12de19c5af5a623a1cd3743fbba16d745ef5188`. The corrected exact
candidate was merged into this matching review instance; the source/runtime,
migration, script and packaging diff against that candidate is empty. Only QA
reports/probes/results differ. The earlier `a757c65c` rejection and its executable
counterexamples remain preserved and are not retroactively approved.

## Decision and source scope

The two resource-lifecycle findings are corrected. A workspace-keyed revision
table has no Person/receipt dependency; its compare/increment shares the owning
workspace transaction. Native primary/foreign-key and nonnegative constraints
support the contract. Workspace tombstones follow resource ID across actors;
person tombstones remain person-scoped. Current authority is still checked before
replay, and receipt identity binds actor, workspace, operation, expected revision
and normalized value. Domain writes, the revision clock, receipt, audit and pending
outbox commit or roll back together. The source performs actual metadata writes;
it does not echo arbitrary client JSON as a committed domain result or pretend
that pending outbox events were delivered.

Migration5 is additive and canonical, requires4, and does not alter accepted
migrations1-4. The image build and runtime COPY steps, production fixture copy,
explicit plan/receipt version assertions and full ledger-line assertion include
version5. The historical migration4 upgrade test is deliberately pinned to its
original checkpoint; a separate test covers4→5. Existing populated-data migration
admission remains in force. No migration against retained customer data is
authorized by this review.

## Independent executed verification

`evidence/KAN41_CORRECTED_PROBES.cjs` loads **exact committed source** through a
review-only in-memory TypeScript transpiler. Before execution it independently
checks 653 installed dependency versions/integrities and the generated Prisma
schema against the candidate. Reused dependency files were read-only; no model
generation, implementation edit, provider call or protected user mutation occurred.

Actual isolated PostgreSQL16/DML-role probes passed on separate loopback55437:

- A1→owner B: expected0 denied, expected1 commits2; old-owner replay denied.
- Same result after deleting the former Person and cascading command receipts;
  the resource clock retains its revision independently.
- A retained workspace tombstone still denies the new owner, including a marker
  whose wall-clock expiry is past. Marker remains present.
- An injected outbox error rolls back actual metadata, new revision row, receipt
  and audit. Retry commits once.
- Two independent connections using expected1 admit exactly one revision2 writer;
  a cold caller recovers the earlier receipt without another write.
- Native negative-revision UPDATE is refused and leaves the valid clock intact.
- Actual empty-staging4→5 upgrade applies one version, skips four, preserves all
  four earlier SQL receipts, and verifies consistent afterward. Exact accepted
  migration1-4 contents are unchanged.

Sanitized results: `evidence/KAN41_CORRECTED_RESULTS.jsonl`. Reviewer schema and
roles were removed and the reviewer-owned server stopped. Imported provenance
passed3842files/9patches. Both changed packaging JavaScript files and the probe
passed `node --check`. The implementer separately reported12 registered actual
SQL cases and TypeScript data/model checks passed; that report does not replace
the independent executions above.

## Required integration and remaining gates

Full candidate CI, including actual image/deployed-lock checks, must pass before
merge; integrated published dev verification remains mandatory afterward. This
review did not independently run Docker and does not claim that pending CI passed.
Any subsequent implementation change requires its own exact-source decision.

No full KAN-41 Done, product activation, verified Firebase caller/controller,
released workspace admission/frontend adapter, browser/two-device result,
broader domain deletion/revision operation, applicable consent/source consumer,
actual KAN-53 dispatch or hosted/provider acceptance is approved. Those remain
open gates. This bounded source slice may be integrated after its CI gates pass.
