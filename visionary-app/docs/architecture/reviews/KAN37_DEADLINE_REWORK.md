# KAN-37 deadline rework checkpoint

1 November 2026. State: implementation candidate, **not accepted or merged**.
Implementer: Codex /root. Separate reviewer /root/kan38_final_review has
accepted responsibility for the eventual exact candidate; no approval exists.

Fresh branch: codex/principal-kan-37-deadline-rework, based on accepted
dev3aa0d91957b31f44ca708f5af6b1a09515cd4f48. Earlier KAN-37 acceptance remains
historical; native Jira was reopened Rework10513 then In Progress10518.

## Reproduced actual boundary

The unchanged real backend compiles with tsconfig.data.json. On an empty,
authenticated loopback PostgreSQL16 instance, the existing never-resolving
source test with maxDurationMs200 fails with SQLSTATE57014 statement_timeout
instead of the expected deadline error. This is a product regression, not a
passing test or a proven random CI-machine problem.

The new registered DATA02 regression warms actual role connections, adds a
real20ms pg_sleep at the metadata SQL stage, retains the200ms invocation
budget, and checks failure, bounded return, zero target rows, rollback of
uncommitted control/checkpoint tables and cold retry to exactly five rows.
Those checks execute successfully before its final source-entry assertion
fails: the source was never reached. The intentional before-fix test exits1.

Current implementation subtracts1000ms for statement_timeout and500ms for
the callback guard; both collapse small budgets to1ms. Identity checks occur
before the transaction timer, and final privilege checks do not check the
invocation deadline before commit admission.

## Existing implementation repaired

The candidate preserves the existing migrations, roles, SQL stores and job
entry points. It changes backfill budget propagation and transaction admission;
no replacement product or schema is introduced.

The backfill uses one monotonic invocation deadline, callback time capped by
the store's remaining batch budget and proportional capped safety reserves.
It no longer extends nearly exhausted work to100ms or collapses a small budget
to1ms. The optional store guard checks identity, SQL, work and final privileges,
immediately before commit admission. Source/writer continuations resumed after
cancellation cannot submit late guarded SQL. Migration-only callers retain
their default15-second policy.

Only explicit own bounded SQL statement-timeout and Prisma transaction-expiry
diagnostics receive deadline classifications. User-request SQL cancellation,
invalid transaction identity and authority errors retain their identity.
Uncertain commit acknowledgement is marked COMMIT_UNKNOWN; cold retry reconciles
durable checkpoints rather than promising rollback of a durable commit.

Focused real PostgreSQL verification passes the original200ms case, controlled
SQL setup/rollback/cold retry, late identity/source/writer and suspended final
privilege cases. Commit-acknowledgement uncertainty preserves one durable row
and cold-retries without duplicate batches; actual pg_sleep statement timeout
rolls back and recovers. Three separately labelled policy-unit cases run the
actual store/runner against explicit inert Prisma interfaces. The budget
regression fails against the actual old store in an isolated probe, with
original product files untouched. Final exact-head full checks, independent
approval and actual browser evidence remain required.

Physical setup may legitimately consume the unchanged200ms invocation budget.
The SQL test therefore accepts source entry or genuine budget expiry while
checking deadline outcome, no committed target/checkpoint data and cold recovery.
It does not promise source entry on a slow host. The deterministic policy test
separately rejects the old1ms SQL configuration.

## Acceptance still required

Use one monotonic invocation deadline through identity/setup/work/final
authority checks and commit admission; reserve bounded proportional safety
time without extending the requested total budget. Check expiry before
invoking work and after awaited stages, so abandoned source/writer continuations
cannot issue late transactional writes. Preserve authority/configuration errors
and cancellation; do not relabel every57014/P2028 as a deadline. An uncertain
commit acknowledgement needs cold checkpoint/receipt reconciliation, not a
claim that an already durable commit rolled back.

Add actual PostgreSQL cases for delayed identity, late source/writer release,
final privilege delay, cancellation, cold retry and uncertain commit response.
Run relevant registered full checks, separate exact-SHA review and actual
real-Firebase browser regression before dev integration. Testing, accepted
integration, actual Jira Done and configuration-preserving cleanup remain ahead.

## Local evidence and configuration

Raw logs and protected synthetic target configuration are outside Git at
C:/Users/Administrator/Visionary-local/kan37-deadline-rework-20261101.
before-hanging-source-authenticated.log reproduces57014; the new controlled
regression log is before-deterministic-setup.log. Earlier missing-credential
and dependency-cache-layout attempts are setup failures, not product results.

The retained older SQL instance was restored to its stopped state. A fresh
empty reusable synthetic cluster is bound only to127.0.0.1:55437, with generated
test credentials kept outside Git. Stop it while idle. No cloud service or
customer/account/profile/billing data is used. Dependency locks are unchanged;
four verified cache junctions have proper node_modules layout and must be
removed as link objects at eventual cleanup. No schema/role/source permission
or frontend product behavior has changed at this checkpoint.
