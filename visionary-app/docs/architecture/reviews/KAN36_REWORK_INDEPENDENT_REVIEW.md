# KAN-36 replacement independent review

25 October 2026 (Asia/Calcutta). Jira/source: KAN-36 / DATA-01.

**Decision: approved for dev integration as bounded workspace-domain development preparation. Verification: passed.** No blocking defect remains in that scope. This is not complete DATA-01 acceptance, permission to activate a product route or shared migration, or production approval.

## Responsibility and exact revisions

- Implementer: Codex `/root`, taking over DeepSeek's existing task at the founder's direction.
- Independent reviewer/verifier: separate agent `/root/kan36_rework_reviewer`, explicitly accepting responsibility. The reviewer did not edit implementation files, merge to dev, transition Jira or operate the KAN-38 checkout.
- Exact approved replacement implementation: **`5297f4621ad69c0d0d8dfd55227000b7560411d5`**.
- Reviewed corrected handoff head: **`6b26c5a97ac17b43396d231723c0f241fed265bf`**. The only change after implementation is `docs/architecture/delivery/KAN36_DDL_REVIEW.md`; its scope and results are truthful.
- Base/current published dev at review: `9d6d2b5b0e97213ff2e8778c2a1d7469d8df554e`, independently verified from the remote ref.
- Rejected prior submission: `f08d3f5fecaabc43b6f7cdb6807a1adae7869270`. The earlier changes-requested report is retained as history, not approval of that source.
- Existing worker: `deepseek-kan-36-data-ddl`; existing reviewer: `qa-review-kan-36-data-ddl`. No additional worktree was created. The reviewer merged the exact candidate into the existing review branch while retaining its earlier report history and checked that implementation/backend/scripts/integration/workflow/package content matched the submitted handoff head exactly.

Live Jira requirement and comments were read, including transfer receipt 10220. The complete original requirement includes more than workspace preparation: sources/releases, sessions/evidence, classrooms/projects, lifelong-profile reconciliation, affected source/admission/policy decisions and connected/hosted outcomes remain open. This report accepts the explicitly bounded technical preparation only. Full KAN-36 must remain open/Testing; a scoped merge does not establish Done or completed-task cleanup eligibility.

## Resolution of the rejected submission

The schema validates with the locked PostgreSQL connector; invalid native type and opposite relations are repaired. Domain SQL is generated from the marked domain section of the actual Prisma schema, with deliberate PostgreSQL partial indexes and a positive revision check generated in the same command. The fixture applies all ten domain tables with quoted identifiers, enums, relevant foreign keys and uniqueness constraints. Legacy User/account/plan tables are excluded from this migration. Nullable account-wide consent uniqueness and one personal workspace per UID are enforced in PostgreSQL, not inferred from text matches.

Tests import the actual repository. Command digests bind executed fields, actor and operation; same-key changed commands conflict, committed results remain immutable, and replay rechecks ownership and erasure. First-ever same-UID concurrent creation commits one workspace. A Person-row locking protocol serializes mutations and event allocation per UID, while PostgreSQL supplies durable unique sequence cursors. This is a scoped ordering protocol: arbitrary writers bypassing that lock and global commit-order/replay APIs are not accepted by a sequence field alone.

Invitation consumption is a conditional update inside the same transaction as membership, audit and outbox. Concurrent accept and controlled accept/revoke cases are exercised. Tokens cannot grant OWNER, owners cannot consume self-invitations, unknown or forged OWNER membership fails closed, and an existing member is not silently promoted. Same-user replay uses current membership; a previously consumed token cannot restore removed membership. Consent helpers require explicit policy version and check expiry/revocation; erasure markers prevent replay/list/access resurrection without inferring a retention decision from their timestamps.

The broken legacy module registration is removed, and no connected or legacy module registers the workspace controller/module. The controller/DTO remain disconnected scaffolding, not an accepted transport or released permission flow. The unused general receipt mutator had no external source caller and was removed because it could modify receipts without an owning domain transaction. General expected-revision mutations remain DATA-06 scope. The original immutable import manifest is retained; the intentional schema change has a reviewed patch/hash chain. A required CI data step now installs the locked backend, generates/compiles, checks canonical DDL and runs PostgreSQL tests without changing the ordinary frontend check's scope or main-only production conditions.

Three additional issues noticed during review preparation were corrected before the approved SHA: a first-use UID upsert race, self-invitation retry inconsistency, and endorsement of a forged existing OWNER membership through invitation acceptance. The role-enum test was also strengthened to use a valid workspace and assert PostgreSQL's enum error, preventing a foreign-key failure from falsely proving role enforcement. Temporary generator cleanup now verifies its resolved boundary before removal.

## Independent verification

Environment: Windows, Node 24.19.0, Prisma 5.22.0, native PostgreSQL 16.15 on loopback port 55436, guarded disposable `visionary_data_test_local` database. Synthetic data/credentials only; no product database, Firestore record, provider or KAN-38 file was accessed or changed. The existing same-lock worker dependency installation was used read-only; no dependency junction was created. Clean locked installation was separately verified by Linux CI below.

| Independent check | Actual result |
| --- | --- |
| Exact source/remote comparison | Submitted source matched the explicit reviewed implementation/handoff; current dev remained 9d6d2b5b. |
| Prisma validation from reviewer schema | Exit 0; schema valid. |
| Canonical DDL regeneration comparison from reviewer source | Exit 0; generated model DDL plus explicit constraints matches the committed SQL. |
| Candidate PostgreSQL tests plus runtime/provenance regressions | Exit 0; **28 passed**, zero failed/skipped/cancelled: 20 data tests, three runtime selection tests and five provenance tests. |
| Separate focused compilation from reviewer source | Exit 0. `KAN36_REVIEW_COMPILE.cjs` uses the locked dependency types read-only and emits only to ignored reviewer artifacts. It preserves the dependency package's declared Firebase subpath type mappings. |
| Six additional reviewer probes against that separately emitted repository | Exit 0; **6 passed**, zero failed/skipped/cancelled. Late audit failure rolls back workspace/membership/receipt/outbox; concurrent changed-payload commands admit one payload; replay binds kind/actor; expired consent denies; existing GUEST is not promoted and removed membership is not restored; forged existing OWNER is rejected with token consumption rolled back. |
| Import provenance | Exit 0; 3,842 baseline files plus four recorded patches / 11 changed files. |
| Layout | Exit 0 after preserving the generated Prisma cache as described below. |
| Exact-range whitespace under repository CRLF policy | Exit 0 with `git -c core.whitespace=cr-at-eol diff <base> <handoff> --check`. Imported source/patch bytes preserve their established CRLF/-text provenance policy. |

The review evidence scripts are `evidence/KAN36_REVIEW_COMPILE.cjs` and `evidence/KAN36_REWORK_PROBES.cjs`. They contain independent assertions against compiled production code, rather than a second implementation of repository behavior. Initial harness attempts had Firebase subpath resolution and CommonJS artifact-scope setup errors; both were repaired in reviewer-only tooling before the successful independent compile/probe run. Those failed attempts are not counted as passing candidate verification.

Invoking Prisma CLI from the product root generated a cache-only root `node_modules`, which the layout rule correctly rejected. The reviewer verified that directory's absolute boundaries, sole `.cache` child and absence of reparse points, then preserved it unchanged under ignored `artifacts/qa/kan36-prisma-root-cache-20261025` with a reversible move. An earlier removal attempt was blocked by automatic approval review; no deletion workaround was used. The required data command runs Prisma from the backend directory. This was local review tooling residue, not a source-layout waiver.

## Clean CI and integration conditions

The reviewer inspected the task-local GitHub helper before invoking only its read-only runs/jobs operations. GitHub independently confirms [run 40171408891](https://github.com/ecohdeep786/New_Visionary/actions/runs/40171408891), exact handoff head `6b26c5a97ac17b43396d231723c0f241fed265bf`, event `pull_request`: **success**. Checks job `121102819117` passed clean locked installs/audits, ordinary root check, backend locked install, PostgreSQL-backed `data:check`, deployed-lock product verification and Node/Python infrastructure checks. The production job was **skipped**. [PR 27](https://github.com/ecohdeep786/New_Visionary/pull/27) targets dev; no production result is inferred from it.

The integrator must still publish the final reviewed report/PR head, verify its checks, compare with current dev, merge only the reviewed scope, and verify the integrated result. Source changes, relevant conflicts or changed shared contracts require renewed review. This report does not perform that integration or claim its future success.

Remaining gates include the full original DATA-01 model scope, KAN-29/30/32/33 affected decisions/criteria, KAN-37 migration/runtime identities and durable migration/backfill/rollback acceptance, KAN-38 provisioning integration, complete invitation/consent/deletion/privacy/observation/revision flows and all applicable hosted/release acceptance. Helpers plus schema constraints do not close those gates. No product UI change, live workspace endpoint, shared migration application, production release, full-ticket Done or worktree cleanup is approved here.
