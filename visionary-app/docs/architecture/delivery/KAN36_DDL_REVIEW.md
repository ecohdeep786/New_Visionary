# KAN-36 / DATA-01 replacement review handoff

25 October 2026 (Asia/Calcutta). Implementer: Codex /root, taking over DeepSeek's existing task at the founder's direction. Separate reviewer: /root/kan36_rework_reviewer, which explicitly accepted responsibility and is reviewing; no approval is inferred here.

Acceptance scope: corrected **workspace-domain development preparation**, suitable for dev integration only after separate review and CI. The complete original DATA-01 scope remains open: source/release, session/evidence, classroom/project and lifelong schema reconciliation, affected source/admission/policy decisions and connected/hosted acceptance. This handoff replaces the earlier mock-only packet; it does not discard its original commit history or claim full production readiness.

- Existing branch: codex/deepseek-kan-36-data-ddl.
- Existing worker checkout: C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/deepseek-kan-36-data-ddl.
- Base/current verified dev: 9d6d2b5b0e97213ff2e8778c2a1d7469d8df554e.
- Rejected submission: f08d3f5fecaabc43b6f7cdb6807a1adae7869270.
- Exact replacement implementation: **5297f4621ad69c0d0d8dfd55227000b7560411d5**, pushed and remote-verified.
- Existing independent review checkout: C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-36-data-ddl. No additional worktree created.

## Corrections and evidence

1. Prisma's unsupported native type/missing relations are repaired. SQL is generated from the marked domain section of the actual Prisma schema; enums, relationships, indexes and exact quoted column names align. Explicit PostgreSQL-only partial indexes enforce one personal workspace per UID and unique account-wide consent versions; command revisions must be positive. No legacy account/plan table appears in this domain migration.
2. The copied mock repository tests are replaced by tests importing the compiled submitted class. A loopback-only synthetic PostgreSQL fixture executes the actual DDL, checks foreign keys, roles and uniqueness, and cleans only its validated unique schema.
3. Workspace command hashes derive from the validated executed fields, actor and operation. Receipt replay verifies current ownership/erasure and returns the recorded immutable result. Changed fields conflict even when a separate caller payload is unchanged. Concurrent first-ever UID commands commit once.
4. Invitation acceptance conditionally consumes a valid ISSUED token within the same transaction as membership, audit and outbox. Same-user retry is idempotent; other users, expired/revoked tokens and OWNER grants are denied. Existing membership is not promoted; forged OWNER rows and owner self-invites are rejected. A controlled accept/revoke race is tested.
5. Unknown/forged roles fail closed. Erasure markers block authorization, list exposure and command replay, including markers with old expiresAt values; no retention decision is invented from time alone.
6. Outbox cursors are durable unique PostgreSQL sequence values. Repository mutations lock the Person row before allocating events, so commits serialize per UID across connections. Every future writer must use this same locking protocol; a raw sequence alone is not a global commit-order guarantee. Existing endpoints do not expose these BigInts; the future bounded wire adapter must serialize cursors explicitly.
7. The intentional schema patch has byte hashes and diff evidence in integration/upstream-patches.json; the original import snapshot remains immutable. A separate required CI data:check step provisions PostgreSQL16, validates/generates, compiles and runs the actual implementation tests. Ordinary frontend check scope remains unchanged.

The unregistered workspace controller DTO/route parameter were corrected, and its broken legacy-module registration was removed. No connected endpoint is activated. The unused general receipt mutator was removed because it could modify receipts without the owning domain transaction; general expected-revision commands remain DATA-06. This replacement makes no claim that a schema constraint alone implements all consent, deletion/restore, source, invitation-product or revision acceptance.

## Verification

Local environment: Windows, Node24.19.0, Prisma5.22.0, isolated native PostgreSQL16.15 on loopback55436 with a disposable visionary_data_test_local database. Synthetic credentials/data only; no product or hosted store contacted. Backend dependency bytes were copied into this task's own node_modules from the primary same-lock installation (lock hashes verified identical, no junction); worker Prisma client was regenerated. A clean Linux locked install is required in CI. Initial local partial-install failures were environment setup failures and are not counted as passing tests.

- npm run data:check: **exit0; schema validate/generate, canonical DDL comparison and workspace TypeScript compile passed;20 tests passed,0 failed/skipped**.
- node scripts/verify-imports.mjs: **exit0;3,842 baseline files plus4 recorded patches /11 changed files**.
- node --test scripts/tests/backend-runtime.test.mjs scripts/tests/upstream-patches.test.mjs: **8 passed,0 failed**; connected runtime excludes the disconnected legacy/domain module.
- git -c core.whitespace=cr-at-eol diff --check: passed. Imported source/patch bytes retain their established CRLF/-text provenance policy; the flag distinguishes those bytes from trailing spaces.
- Hosted/full UI/workspace/real-user SQL migration: **not performed or claimed**. The applicable product, policy, migration and release gates remain explicit.

Reviewer decision: **pending** on the exact replacement source. Relevant full CI and integrated-result checks: pending. Dev integration: not yet. Jira must remain Testing until actual acceptance. Scoped draft integration does not warrant full DATA-01 Done or retirement of unresolved task worktrees. KAN-37 may reconcile preparation against an accepted schema but cannot activate a shared migration or close other prerequisites. KAN-38's unfinished provisioning worktree remains untouched.
