# KAN-39 transaction repair independent review

2 November 2026, Asia/Calcutta. Source DATA-04 / Jira KAN-39.

**Decision: CHANGES REQUESTED for exact checkpoint
`5f91935d030a33f263607deb7da0b5a0874a72ad`. Five additional unsafe outcomes
were independently reproduced against its actual PostgreSQL store. This is not
source acceptance, full-task acceptance, permission to merge, or Jira Done.**

## Responsibility and exact scope

Implementer: /root, branch `codex/principal-kan-39-invitation-rework`.
Independent reviewer: `/root/kan39_transaction_review`, explicitly accepting
responsibility separately from the implementer. The reviewer changed only this
report and its independent probe. No worker implementation, primary checkout,
customer/account/profile/billing record, Jira status, cloud resource or shared
dependency contents were changed.

Fresh D-098 reviewer instance:
`C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-39-transaction-rework`,
branch `codex/qa-review-kan-39-transaction-rework`, created from independently
verified `origin/dev f50868b3eba2c539768c1454a473d4a29459b79b`. Its initial
baseline was pushed and remote-verified before fast-forwarding exact candidate
`5f91935d`. Source remote and diff were independently inspected. The old original
agent checkout and original independent findings remain separate and preserved.

This is a review of the new transactional repair checkpoint, not the unfinished
connected invitation product. Its handoff accurately states that the canonical
workspace/email uniqueness still prevents reissue, there is no installed API or
frontend cutover, current child/guardian/institution proof remains unaccepted,
and no connected browser acceptance or dev merge is claimed. These product
gates cannot be closed by the source/SQL checks below. Live Jira was independently
read as In Progress during this review.

## Repaired original boundaries

The new contract correctly combines token lifecycle, membership creation,
command receipt, audit and outbox in one owning SQL transaction. Workspace and
invitation row locks plus a re-read after waiting address the old two-UID consume
race and completed-revocation race. SQL rollback addresses the old partial-write
failure; same-UID receipt reconciliation addresses retry without duplicate
membership/events. Existing membership is preserved rather than demoted or
silently promoted. Issuer membership is rechecked before a fresh grant.

The submitted13 actual SQL cases exercise those paths, unlike the original
sequential in-memory-only tests. They were inspected; the implementer independently
reported their full registered run passing. This reviewer ran additional real
SQL cases from its own compiled source as recorded below. Those improvements
do not remove the following independent findings.

## Blocking findings at this exact source

| ID | Source | Independently observed result and required correction |
| --- | --- | --- |
| N1 / P1 | `invitation-store.ts:21-24,70` | A workspace deletion tombstone owned by the canonical workspace owner is ignored because acceptance searches only the recipient UID. A new MEMBER is committed into the marked workspace. Read canonical `Workspace.uid` and apply the owning-workspace deletion guard consistently to commands and reads, in addition to recipient erasure checks. |
| N2 / P1 | `invitation.service.ts:24-27`; `invitation-store.ts:81,88` | Acceptance captures its Date before transaction admission/SQL waits. The probe paused after an actual token lookup until the real expiry had elapsed; acceptance then granted membership using the stale Date and recorded that earlier acceptedAt. Check an authoritative current database time at the serialized grant boundary and after delayed stages before committing authority; a test clock must not weaken it. |
| N3 / P1 | `invitation-store.ts:21-29,48` | A membership row marked OWNER for a UID different from canonical `Workspace.uid` can issue an ADMIN invitation. The accepted `WorkspaceRepository.assertMembership` rejects foreign OWNER rows and treats `Workspace.uid` as owner authority. Reconcile with that invariant rather than trusting rank alone. |
| N4 / P1 | `invitation-store.ts:80-87` | A retained pending invitation whose canonical enum role is OWNER can grant a foreign OWNER membership while the workspace's canonical owner remains unchanged. Request validation alone does not validate existing rows. Explicitly reject OWNER/unsupported stored invite roles before grant/replay, as the accepted repository already does. |
| N5 / P1 | `invitation-store.ts:36-43` | For one issuer UID across two different workspaces, pause the first transaction after its actual outbox INSERT allocates a cursor. The second transaction commits a higher cursor while the lower one remains invisible, then the first commits. A consumer that advances to the visible higher cursor can miss the late lower event. Serialize allocation/commit using the canonical UID anchor, consistent with `WorkspaceRepository`; workspace-only serialization is insufficient. |

The accepted `WorkspaceRepository.acceptInvitation` also forbids a canonical
owner accepting an invite to their own workspace. Rejecting that unnecessary
self-accept preserves OWNER authority and aligns the existing domain contract;
do not infer a new owner-transfer policy from the original defective test's
demotion scenario. Existing MEMBER/GUEST rows should never gain a different role
through an invitation; role changes retain their own current-authority operation.

N4 deliberately seeds a retained enum-valid OWNER invitation after a legitimate
issue in a synthetic fixture. N3 deliberately seeds a foreign OWNER membership.
These are actual database rows supported by the current schema, not a bypass of
the request parser or claims that the new invite parser accepts OWNER. The store
must fail closed on retained authority rows before it is used for cutover.

## Independent executed evidence

Own reviewer backend dependency junction points to the preserved backend cache.
Both the source lock hash and installed-lock hash independently matched its
manifest before reuse. No dependency install or Prisma generation was performed.
Own `tsconfig.data.json` and `tsconfig.invitations.json` compiles exited0. Fresh
layout and imported-source checks passed:3,842 baseline files, four patches and
11 changed upstream files. These checks preserve provenance; they are not feature
acceptance. Host contention made compilation slow but emitted no diagnostics.

[Independent probe](evidence/KAN39_TRANSACTION_INDEPENDENT_PROBES.cjs) executes
the actual separately compiled store/service through the existing physical SQL
fixture, with distinct migration and DML runtime roles. It refuses to run without
an explicit40-character reviewed source and checks invitation source equality
before importing. Delayed lookup/outbox wrappers only control scheduling around
actual Prisma operations; they do not copy the business logic. Schema/role/data
setup is isolated and fixture-owned.

```powershell
$env:KAN39_REVIEW_SOURCE='5f91935d030a33f263607deb7da0b5a0874a72ad'
# DATA_TEST_DATABASE_URL is loaded privately from the approved loopback target.
node --test --test-reporter=tap docs/architecture/reviews/evidence/KAN39_TRANSACTION_INDEPENDENT_PROBES.cjs
```

Actual result: exit0, **8/8 probe assertions passed**, zero failed/skipped,
8.338 seconds. Five of those assertions explicitly establish N1-N5 unsafe
outcomes; this is a failed review, not eight acceptance tests passing. Three
additional positive/deny probes established:

- Changed durable receipt digest rejects retry with no additional acceptance event.
- An already accepted invitation cannot subsequently be revoked or grant another UID.
- An existing GUEST remains GUEST when accepting a MEMBER invitation.

The expiry test shortened only its synthetic fixture's expiresAt, then waited
until the actual current clock exceeded it after token lookup. The outbox test
inspected actual committed rows while the lower-cursor transaction was paused.
No API/browser or consumer polling implementation was fabricated.

The probe supports `KAN39_EXPECT_REPAIRED=1` for a future exact replacement:
then the five unsafe cases require denial/preserved state or no early outbox
publication. That mode has not run at this rejected checkpoint and is not a
replacement approval. The outbox repaired-mode early-visibility check is bounded
observation; independently inspect the actual canonical-anchor lock as well.

Raw exact-result/logs remain outside Git:
`C:/Users/Administrator/Visionary-local/kan39-independent-review-20261102`.
The reviewer used the parent-coordinated exclusive synthetic PostgreSQL window,
started the retained loopback55437 instance and stopped it in finally; stop log
confirms server stopped. Its private target/password remained outside Git and
were not printed. Only the review checkout's ignored emitted files were compiled.
No weakening mutation was needed to establish these actual unsafe outcomes.

## Next gate

Return/keep this task In Progress. Repair N1-N5 and reconcile canonical-owner
behavior; register their real positive/deny/race/recovery tests. Review a new exact
SHA and its relevant full verification. Retain this rejection and its probes as
history. The main verifier separately reported a deployed-lock command failing
at Prisma generation before invitation tests; the reviewer inspected that local
ENOENT cache/setup log, did not modify the runtime cache and does not relabel the
command as a product pass or invitation assertion failure.

After source acceptance, the still-open role/proof, reissue, authenticated API,
frontend transport, actual browser/two-device, hosted/provider/privacy and release
gates remain. No merge, Jira Done, main promotion or worktree cleanup is approved.
At eventual accepted cleanup remove the reviewer backend dependency junction as
a link object without following or deleting its shared cache target.

## Replacement source review — exact3e4047d7

**Decision: N1-N5 are resolved; the transactional correction is independently
source-approved at exact `3e4047d712aaf6a4562679ec9f50ed694ee6e28f` for continued
KAN-39 work. This is a bounded source-checkpoint decision, not approval to merge
the unfinished task into dev, move Jira to Done, activate protected roles or
release the product. The verification-harness follow-up and product gates below
remain explicit.** Reviewer responsibility and independence are unchanged.

The reviewer fetched and remote-verified exact3e4047d7 and unchanged devf50868b3,
then merged that exact replacement into the same clean matching review instance.
The delta over rejected5f changes only the PostgreSQL invitation adapter, its
submitted SQL regression file and the worker handoff. Before this appendix, the
review tree differed from the candidate only by the two retained independent
report/probe files. Exact-range whitespace passed. No implementation was edited
by the reviewer and the original rejection/probe logs remain preserved.

The replacement reads canonical Workspace.uid and checks its owner-scoped
workspace/person tombstone before every command/read. Its membership query
rejects foreign OWNER rows, fresh acceptance rejects canonical-owner self-join
and stored invite roles outside MEMBER/ADMIN, and existing MEMBER/GUEST rows
retain their roles. This reconciles the accepted repository authority boundary
without introducing an owner-transfer operation.

The current database `clock_timestamp()` is compared at serialized acceptance,
after issuer authorization and after the final outbox write; injected caller time
can only make that check stricter. Delayed work that reaches expiry rolls back
the complete transaction. A canonical Person `FOR UPDATE` anchor is acquired
before workspace locks and held through outbox allocation/commit, so different
workspaces for the same UID cannot publish cursors out of commit order. It is not
a later shared-to-exclusive lock upgrade. The existing authority, receipt and
rollback boundaries were retained.

### Independent replacement execution

The reviewer recompiled its own `tsconfig.data.json` and
`tsconfig.invitations.json` successfully, without shared Prisma generation.
The exact-source probe ran with:

```powershell
$env:KAN39_REVIEW_SOURCE='3e4047d712aaf6a4562679ec9f50ed694ee6e28f'
$env:KAN39_EXPECT_REPAIRED='1'
node --test --test-reporter=tap docs/architecture/reviews/evidence/KAN39_TRANSACTION_INDEPENDENT_PROBES.cjs
```

Actual result: **8/8 passed**, zero failures/skips,13.616 seconds. Unlike the
original baseline mode, this requires the five former unsafe cases to deny or
preserve ordering/state. The three independent receipt/lifecycle/GUEST checks
also remain passing. The source anchor was inspected in addition to the bounded
outbox visibility observation. The baseline8/8 unsafe reproductions are retained
as separate rejected-source evidence, never relabeled as acceptance tests.

The reviewer then independently ran the submitted entire actual PostgreSQL
DATA-04 suite from its same newly compiled exact3e source: **18/18 passed**, zero
failed/skipped,19.421 seconds. This includes delayed final-outbox expiry with
complete rollback, canonical-owner erasure across all command/read entry points,
foreign/retained OWNER denial, original races/outage/cold retry and UID ordering.
No copies of the service business logic were used. Its result is distinct from
the implementer's earlier successful working-tree run before the source commit.

Raw replacement logs and exact-source results are retained at
`C:/Users/Administrator/Visionary-local/kan39-independent-review-20261102/3e4047d7`.
The parent-coordinated exclusive loopback SQL window was used; the synthetic
server was stopped in finally and its stop log confirms that result. No account,
profile, billing, live Firestore or cloud record was used. No dependency cache
contents or product runtime were changed by the reviewer.

The reviewer independently read live
[CI41404661904](https://github.com/ecohdeep786/New_Visionary/actions/runs/41404661904):
checks job125143853280 completed successfully; production job was skipped. This
is the exact replacement's required CI checkpoint. It does not establish the
unfinished connected feature or erase the prior local deployed-lock setup
failure; the integrator retains that failure and any separately corrected rerun.

### Remaining verification and product gates

The submitted expiry tests wait for `pause.ready`. In particular, a sufficiently
slow host can reach the earlier expiry denial before the late-outbox pause, so
readiness may never resolve while the pending operation rejects. No explicit
test timeout/readiness-versus-rejection race is present. Bound the harness and
surface that early failure explicitly before final verification submission.
This is a source-inspection robustness follow-up, not a claim that an actual
hang occurred: the reviewer18/18 execution and current CI both passed. It does
not require weakening the production expiry guard or extending token validity.

KAN-39 still requires reissue/lifecycle/schema reconciliation, current accepted
child/guardian/institution proof under PRIV-01, authenticated and bounded API with
correct authority/rate-limit inventories, current frontend transport, real
browser positive/deny/recovery/two-device outcome and applicable hosted/provider/
privacy/release acceptance. No token or SQL Person row alone activates those
protected roles. Live Jira remains In Progress. New source or final evidence
heads require their own exact review; the earlier rejected5f is not accepted and
this bounded3e decision does not approve an unfinished product merge or cleanup.
