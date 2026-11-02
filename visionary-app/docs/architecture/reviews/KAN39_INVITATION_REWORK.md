# KAN-39 invitation repair checkpoint

2 November 2026, Asia/Calcutta. Implementer: /root. Jira remains In Progress.
Branch codex/principal-kan-39-invitation-rework; fresh D-098 instance from
verified dev f50868b3eba2c539768c1454a473d4a29459b79b. Existing original
candidate a93cc508 and independent reviewer evidence f34b5d17 remain preserved.
No old task ancestry was merged wholesale.

## Product boundary and repair

The original InvitationService/InMemoryInvitationStore independently reproduces
double membership from one token, acceptance after completed revocation,
partially consumed acceptance after membership failure, and OWNER demotion.
The original fifth issuer-authority observation also reproduces. Those five
passing reproduction assertions establish unsafe outcomes, not acceptance.

The replacement service uses an owning-store command contract. The PostgreSQL
adapter verifies the configured DML identity/target and locks the non-personal
workspace, current invitation and relevant authority rows. Acceptance rechecks
token, lifecycle, current issuer membership and an already provisioned canonical
UID. Token state, conditional membership creation, receipt, audit and outbox
commit or roll back together. Existing roles are preserved; invitation acceptance
does not perform role change or owner transfer. A same-UID cold retry replays
without duplicate writes and cannot recreate a removed membership. A different
UID cannot reuse the token. No plaintext token is saved in history or receipts.
IDs use random UUIDs rather than a workspace/email/clock collision.

## Actual verification to date

Fresh layout/import integrity checks passed. Four unchanged source locks and
available installed-lock hashes match the preserved dependency cache manifest;
four ignored junctions are link-only dependencies, not new package installs.
An initial attempt compared source-lock and installed-lock hashes directly;
these deliberately differ. The manifest-based comparison corrected that setup
check before verification. No shared dependency contents were changed.

Own TypeScript compilation passed. All13 actual PostgreSQL invitation tests
passed against disposable fixture schemas with separate migration/runtime roles
on the retained loopback synthetic cluster. They exercise real domain commits,
two-UID concurrency, same-UID/cold-client replay, a completed revocation while
acceptance pauses after real SQL lookup, a physical database-trigger outage
after membership/token changes, complete rollback and recovery, existing-role
preservation, removed issuer and recipient authority, tombstones, wrong scope,
expiry, malformed commands and wrong/privileged SQL identities. No customer,
account, profile or billing record was used. The cluster was stopped afterwards.

Failed attempts are retained outside Git: initial setup used the wrong existing
migration method (apply rather than applyAll), and the next run passed12/13 but
exposed a synchronous validation throw in a promise API. Methods now consistently
return promises; the final13/13 rerun passed. Raw logs/results and protected
synthetic target configuration remain outside Git at
C:/Users/Administrator/Visionary-local/kan39-rework-20261102.

Normal data:check now compiles and runs DATA-04 fail-fast; production-check
explicitly compiles/runs it under the deployed dependency lock. These registered
full commands/CI have not yet passed at this checkpoint.

## Remaining product work and acceptance

This checkpoint is not a completed KAN-39 product or merge approval. The original
in-memory module/controller was not installed as a runtime provider. Current
Connections is explicitly a local browser preview; it has not been replaced by
this adapter. No actual browser or connected invitation acceptance is claimed.

The existing DATA-01 unique workspace/email constraint intentionally remains
unchanged, so repeat invitation to that email is a conflict rather than silent
token replacement. A reviewed lifecycle/reissue/schema evolution is still needed
for a complete production invitation journey. Current child/guardian/institution
proof and activation must follow accepted PRIV-01 policy; a bearer token or SQL
Person row alone must not activate those relationships. No such activation path
is connected here. Do not infer full policy acceptance from these synthetic UIDs.

Remaining: separate exact-SHA source review and findings; full registered checks,
proper runtime/controller input/auth/account/CSRF/rate-limit/error and authority
inventories, current role/proof lifecycle and frontend transport, real browser
positive/deny/recovery/two-device evidence, accepted dev integration and actual
Jira Done before cleanup. Hosted/email/provider/privacy/release gates retain their
own acceptance. No dev merge, main promotion or cloud provisioning is performed.

## Independent findings and replacement checkpoint

Independent exact5f91935d review requested changes in report7a6cb892:
[eight actual SQL probes](https://github.com/ecohdeep786/New_Visionary/blob/7a6cb892c1f32c633c67e85d7ca28f931eae1d16/visionary-app/docs/architecture/reviews/KAN39_TRANSACTION_INDEPENDENT_REVIEW.md).
Five reproduced unsafe outcomes were owner-workspace tombstone bypass, expiry
after a delayed lookup, foreign OWNER authority, a retained OWNER invite, and
same-UID outbox cursor commit inversion across workspaces. Three additional
deny/preservation probes passed. The former13 SQL passes and successful
CI41400838600 did not establish source acceptance.

Replacement source checks the canonical owner's deletion markers on every
workspace command/read. Membership authority rejects foreign OWNER rows, and
persisted invitations may only grant MEMBER/ADMIN. A canonical owner cannot
self-accept; OWNER authority remains unchanged, matching WorkspaceRepository.
The current database clock (clock_timestamp, not transaction-start NOW) checks
expiry after serialized lookup/authority and again after the final outbox write;
late work rolls back all authority and lifecycle writes. The injected caller
clock may only make expiry stricter. Mutating operations acquire the canonical
actor UID anchor before workspace locks and retain it through commit, fencing
same-UID outbox allocation across workspaces without shared-lock upgrades.

Own replacement compile and18/18 actual PostgreSQL tests passed, including a
second expiry test delayed after actual outbox insertion that verifies complete
rollback. Exact replacement independent review/full checks remain pending.

Full local product check and registered data:check on original5f91935d both
exited0 (DATA01 20, DATA02 50, SQL/Firestore11, invitations13). The separate
local deployed-lock command exited1 at Prisma generation: temporary dependency
junction lacked the derived .cache parent. No invitation assertion ran in that
attempt. Its exact failure/result remain outside Git; CI's separate deployed
lock compile and99+11+13 tests passed. Resolve that local setup before rerun,
without changing package locks or relabeling the failed attempt.

The official candidate root commands started the actual real-Firebase product
at localhost5183/API3003, with byte-identical preserved ignored configuration.
Existing Professional session restored. Direct browser observation confirmed
Connections' empty Requests/Connected/Closed history, the account-email form,
permission-boundary text, and explicit local-preview/no-cloud/no-cross-device
disclosure. Form was opened and restored without entering an email or sending
an invitation. This is a verified remaining product gap, not a completed SQL
invitation journey. Initial connection-refused/cold navigation attempts and
browser API recovery remain retained, not counted as passes.

Raw actual JPEG browser-connections-preview.jpg remains outside Git at the
evidence root:78925 bytes, SHA256
d0fa946b33e1cb30d1b21bf9ade6f80d93bceec6a733cbaac028a34123a3e501.
No new connection, permission, profile, billing or child/institution activation
was requested in that browser inspection. No connected acceptance, dev merge,
Jira Done, main promotion or worktree cleanup is claimed.

## Bounded verification follow-up

Independent replacement reportc06dee096dfac240b26df71aa27e17128bfbb07b
approves the N1-N5 transaction corrections at exact3e4047d7 only. Its own newly
compiled source passed8 repaired-mode independent SQL probes and18 submitted
SQL tests. CI41404661904 also passed all registered checks, including DATA01 20,
DATA02 50, SQL/Firestore11, invitations18 and deployed99+11+18; production
release was skipped. No full task, merge or activation approval was granted.

The reviewer identified a test-harness follow-up: if an operation rejects before
reaching its scheduled pause, waiting only for readiness can hide the failure.
Four paused tests now race readiness against the pending operation and have an
explicit15-second test timeout. No transaction deadline or expiry assertion was
relaxed. The18-case SQL suite passed again with this test-only delta; runtime
source remains byte-identical to reviewed3e4047d7. Exact follow-up review and CI
are still required before any final verification submission.

The first derived-cache-parent preparation did not fix local Prisma generation;
that second failed deployed-lock attempt is retained separately. A dependency-
free Node filesystem probe reproduced Windows ENOENT when creating a new path
through the temporary dependency junction. Creating the complete derived
.cache/prisma directory through its actual cache path made the same probe pass.
Only derived cache directories changed, no package source or lock. The local
deployed-lock command must still be rerun successfully; no pass is predicted.

Live KAN110/PRIV01 remains Testing. The current lifelong contract explicitly
requires accepted policy before child/guardian/institution activation. Native
Blocks link10399 now records KAN110 -> KAN39 for that full product scope;
isolated SQL repair can continue. Current under18 activation denial remains.
KAN39 is still In Progress and draft PR37 remains unmerged.

## Reissue and versioned schema checkpoint

Continuing the same task instance after reviewed0b755723. Live Jira39 remains
In Progress; current dev isf50868b3. This continuation is not covered by the
earlier source approval and needs its own exact review and checks.

The old permanent workspace/email unique key prevented any new delivery after
revocation, expiry or acceptance. New migration2 replaces that key with a history
lookup index and one partial unique normalized-email key for PENDING/ISSUED rows.
The accepted version1 SQL bytes remain unchanged. New deliveries get fresh IDs
and tokens; closed rows, token hashes, receipts and lifecycle history are retained.
Reissue closes only genuinely elapsed pending/issued rows, within the same
workspace/current-authority transaction as the new issue and audit/outbox.
Email comparison is literal and case-normalized; '%'/'_' do not act as patterns.
Accepting a new delivery never silently changes an existing role. Old revoked/
expired tokens remain denied, and accepted same-UID replay cannot recreate a
removed membership. The current identity/policy/admission boundaries stay intact.

Migration2 is forward-only: committed history may contain multiple closed
deliveries, so restoring permanent uniqueness cannot be assumed safe. Actual
transaction failure restores v1 indexes before commit; this is distinct from an
operator rollback after successful migration. The existing migration runner
continues to deny pending DDL on retained domain rows. Empty synthetic upgrade/
failure/retry evidence does not authorize a live retained-record rollout.

Current model verification now replays the canonical version chain in an owned,
empty disposable SQL schema and checks Prisma's physical diff and native partial
indexes/checks. It refuses --write rather than regenerating the accepted v1 SQL
from current models. Historical DATA02 rollback/drift scenarios explicitly pin
v1 before adding their own synthetic v2/v3; DATA04 exercises the actual complete
current chain and failed/current migration2 recovery. Deployed dependency and
migration images include both actual migration files and assert versions1,2.

Schema provenance is an explicit fifth patch chained from the accepted model
hash, with its exact diff and before/after bytes; the original import lock and
prior patches are unchanged. Import verification passes3,842 baseline files,
five patches/11 changed imported files. The only imported file changed in this
continuation is the reviewed-model schema, not an exception to the verifier.

Two fresh lock-matched dependency directories under
C:/Users/Administrator/Visionary-local/kan39-deps isolate new generated Prisma
clients from preserved checkpoints. Source locks are unchanged. Only this task's
backend/runtime dependency junctions were retargeted; old caches/configuration
remain intact. Install receipts are outside Git; no credential or generated
client is committed. New reviewer verification must use the matching model.

Own fresh schema validation/client generation/three component compiles and the
physical model/versioned DDL verifier passed. Focused actual PostgreSQL suites
passed28/28: prior18 plus10 reissue/evolution cases. They cover revoked/expired/
accepted history, concurrent reissue, database-enforced normalized active-delivery
uniqueness across both statuses, literal special characters, current-role
preservation, outbox/receipt failure rollback and cold retry, retained v1-row
migration denial and failed v2-index migration recovery. Positive/negative session
timezones are explicitly exercised. The synthetic SQL cluster was stopped.

The first wrapper used the wrong schema lookup directory and stopped before
product assertions. After correction, the first28-case predecessor ran27 cases,
26 passed/one failed: a timestamptz comparison shifted Prisma UTC timestamps by
the session timezone and closed a still-valid delivery. Runtime SQL now compares
UTC timestamp types explicitly using clock_timestamp() AT TIME ZONE 'UTC'.
The valid/elapsed tests in Asia/Kolkata and America/Los_Angeles pass. Both failed
attempts/logs remain outside Git at
C:/Users/Administrator/Visionary-local/kan39-reissue-20261102, alongside actual
results and dependency-isolation evidence. No failed attempt is relabeled a pass.

Full registered product/data/deployed/image checks and independent exact-source
review of this new schema/runtime delta remain required. API/Connections and
verified institution/guardian policy/browser/two-device gates are still open;
KAN110 is still Testing and blocks the protected activation scope. No new browser
invitation journey, runtime activation, dev merge, Done, main promotion or cleanup
is claimed by this checkpoint.
