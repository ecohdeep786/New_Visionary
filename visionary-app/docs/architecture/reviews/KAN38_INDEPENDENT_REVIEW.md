# KAN-38 independent review

27 October 2026. Reviewer: `/root/kan38_review`, separate from implementer
`/root`. This reviewer accepts responsibility for the source inspection and
independent verification recorded here.

Exact candidate: `a05caa540b559781522c079328f9b69e1397a503`.
Runtime implementation: `1b4ea2a7034976c548eca44b2c98b328d8de493d`.
Accepted dev comparison: `f61292efaf6940ec1acc1751a61cb4a7dd17e66b`.
Reviewer branch: `codex/qa-review-kan-38-workspace-provisioning`, a fresh
checkout from that dev followed by a fast-forward to the candidate.

## Scope and decision

Decision: **approved for the scoped backend source/enabler; final product and
dev integration acceptance remain pending**. No unresolved source defect was
found within this scope. This is not permission to merge before the requested
signed-in browser regression and integration receipts are accepted.

The reviewed scope is the opt-in personal-workspace backend enabler: registered
product API, server-derived account authority, durable PostgreSQL domain/receipt
transaction, environment-bound Firestore pending/completion reconciliation and
runtime packaging. The frontend workspace preview is not cut over by this task.
This review does not accept hosted Cloud SQL, production provisioning, two-device
domain journeys, content/source policy, or a main release.

## Source assessment

The replacement executes real PostgreSQL and Firestore adapters. Personal UID
allocation is serialized on the person anchor and protected by the canonical
partial unique index. Workspace, owner membership, command receipt, first-create
audit and outbox commit together. The adapter checks the actual database,
schema, runtime role, privileged/delegated roles and migration metadata control.
It refuses changed receipts, nonowner membership and deletion tombstones.

Firestore reads the original account/identity/storage version and refuses an
active storage migration. It writes dedicated commands and links; local and
staging targets use `developmentWorkspaceLinks/{targetKey}`. Pending state before
SQL and completion after SQL make interrupted acknowledgement recoverable;
success follows completed reconciliation. This is not cross-store ACID, and a
link does not grant membership or source rights. Production target selection is
explicit and local SQL cannot publish the canonical production link.

The registered controller verifies Origin/CSRF, current session/device and
expected account before calling the service. The service remains disabled by
default, creates no SQL pool in that state, performs no startup migration and
uses DML credentials when enabled. Admission is ten calls per UID per minute,
with HTTP429 preserved. Runtime-lock and API-image checks are wired into required
CI; source inspection alone does not establish their successful execution.

## Findings addressed before acceptance

1. Unbounded unique command requests could accumulate durable receipts. The
   candidate adds existing transactional Firebase rate admission before any
   provisioning write. Independent execution verifies the actual counter.
2. The HTTP fixture could inherit ignored product configuration through Prisma's
   environment loading. In the pinned Nest version process environment takes
   precedence over internal ConfigService values. This was reproduced: the
   synthetic fixture resolved the live project and named database and correctly
   received409 from the environment-binding guard. Candidate7a71 uses an explicit
   fixture-only `get` wrapper, including for its disabled case, while retaining
   the ConfigService DI token. The product guard is preserved.
3. The new route required semantic authority/request-limit inventory and derived
   contract updates. The reviewed inventories now include38 registered routes
   and an explicit protected provisioning profile. The subsequent manifest and
   assertion corrections do not change runtime source.

## Independent verification

Own checkout source was compiled into its own `dist` using
`tsconfig.workspace.json` and `tsconfig.data.json`. The installed backend
dependencies were reused through a read-only junction after byte-identical lock
verification; no credentials were copied and no dependency generation/install
was performed by this reviewer. Backend lock SHA256:
`adf2864153b92e52cf3afbfa8f09a553d5b2e672567ad62deb706ab9166f261b`.

| Check | Actual result |
| --- | --- |
| Authority, request-limit and runtime-entrypoint source regressions | 62 passed, 0 failed |
| Focused earlier DDL/receipt rollback timeout case | 1 passed, original15-second transaction limit retained |
| Additional adversarial PostgreSQL/Firestore probes | 6 passed, 0 failed, 57.88 seconds |
| Final official provisioning/HTTP suite | CI11/11 passed under both backend and deployed dependency locks; local full rerun reached its unchanged120-second outer child bound during setup |
| Corrected HTTP fixture in isolation | 1 passed locally on final candidate; original test body, real stores and120-second outer bound retained |
| Cold Admin SDK project/database binding before requests | Explicit demo project and `(default)` database observed without a network request |

The six extra cases executed completed changed-payload replay refusal, poisoned
stored target refusal despite a matching targetKey label, actual Firestore
project/database mismatch before writes, actual runtime SQL role/schema mismatch,
nonowner membership refusal on replay and new commands, and the actual Firebase
transactional counter admitting ten calls and rejecting the eleventh with429.

These cases used PostgreSQL16.15 with distinct migration/runtime roles and fresh
schemas, and the official Firestore emulator1.22.0. The checked-in harness verifies
its136707194-byte JAR and SHA256 before execution. The six-probe runner reuses
those same guards and120-second child deadline with a different test entrypoint.
A separate loopback-only reviewer cluster on55439 avoided the product-test
cluster's stop/start lifecycle. No cloud database, IAM grant or production record
was created by the reviewer.

Evidence remains outside Git at
`C:/Users/Administrator/Visionary-local/kan38-independent-review/`:
`source-tests.log`, `focused-migration.log`, `adversarial.test.mjs`,
`run-adversarial.mjs`, `adversarial-2.log`, `provisioning-final.log`,
`run-http.mjs` and `http-final.log`. The final selected HTTP case passed in21.06
seconds overall and included the actual controller/session/CSRF/account/429
boundary before real PostgreSQL/Firestore writes. Reviewer PostgreSQL was
confirmed stopped with `pg_ctl status` after completion.
Earlier failed attempts are retained: the original official run passed10 of11
before the fixture environment409 above; the first additional-probe attempt hit
the unchanged120-second outer bound during setup. Neither is counted as a pass.
The separate focused rollback rerun passed without weakening any deadline after
the implementer's full data run experienced a15-second transaction expiry.

After7a71, the candidate changes only generated surface JSON/Markdown inventory
and the sanitized live receipt
`docs/architecture/delivery/evidence/KAN38_LIVE_FIRESTORE_2026-10-27.json`.
These changes were inspected. The implementer's receipt records real existing
verified identity/live Firestore with local PostgreSQL, cold replay and one
workspace/receipt/outbox, unchanged account/billing and production link, and a
retained SQL schema. This reviewer did not independently operate that live
account; the receipt is identified as implementer evidence. It establishes no
hosted SQL or signed-in browser outcome.

## Required CI inspected on the exact candidate

[Run40459938688](https://github.com/ecohdeep786/New_Visionary/actions/runs/40459938688)
completed successfully for `a05caa540b559781522c079328f9b69e1397a503`.
The reviewer independently read its live run/job result and job122041874754 log.
The log records root scripts82/82, contracts35/35, frontend624/624,
DATA-01 PostgreSQL20/20, DATA-02 migrations39/39 and DATA-03 real provisioning11/11.
The deployed-lock check separately records99 backend checks and the same11 real
provisioning cases passing. The actual non-root API image booted offline, loaded
the generated Prisma5.22 client and denied an untrusted request at the registered
provisioning route. Migration-job image checks and infrastructure JS/Python steps
also succeeded. The production deployment job was skipped.

The retained full job log is
`C:/Users/Administrator/Visionary-local/kan38-rework/ci-job-122041874754.log`.
This Linux CI evidence supplies the complete final suites; it does not turn the
failed local scheduling attempts into successful runs.

## Integration and release boundary

Required candidate CI is successful and the sanitized implementer live-Firestore
receipt is inspected. The integrator must still obtain and record the actual
signed-in browser product regression, accepted/published dev integration checks
and the real Jira transition. Browser automation previously stalled; this report
does not claim that journey passed. New code invalidates this exact-source
approval and requires renewed review. Main promotion, cloud provisioning,
provider/retention/deletion, load/recovery and linked feature gates remain open.

For eventual cleanup, the review checkout's ignored backend `node_modules` is a
junction into the worker's installed dependencies. Remove only the verified
junction before removing the reviewer worktree; never recurse into its target.
The reviewer evidence and synthetic PostgreSQL data are outside the checkout.
