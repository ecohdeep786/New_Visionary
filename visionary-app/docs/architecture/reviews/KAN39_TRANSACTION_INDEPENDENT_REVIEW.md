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

## Bounded harness follow-up — exact0b755723

**Decision: the test-readiness follow-up is resolved and the source/test
checkpoint is approved at exact `0b755723168bd5d13842f6575f8de12f50006805`.
This does not approve the unfinished product for dev merge, native Jira Done,
protected-role activation or release. Exact-head full CI and remaining product
gates still apply.** Reviewer responsibility and independence are unchanged.

The reviewer fetched and remote-verified the exact replacement and merged it into
the matching review instance. Its delta over3e changes only the submitted SQL
test file and worker handoff. Backend runtime, frontend, infrastructure, schemas,
dependencies and locks are byte-identical; the earlier independent own-source
8/8 repaired-mode probes and18/18 SQL execution remain evidence for that runtime.
They are not mislabeled as a fresh independent SQL execution of0b's harness.

Four paused tests now race their readiness promise against the actual pending
operation and each has an explicit15-second test timeout. An operation rejected
before its scheduling pause therefore surfaces as test failure instead of an
unresolved readiness wait. The revoke, real elapsed expiry, final-outbox rollback,
canonical ownership and ordered-cursor assertions remain unchanged. No token
validity or10-second production transaction budget was extended. The owner
self-accept denial and all18 regression cases remain present.

The reviewer independently executed
[the readiness probe](evidence/KAN39_TEST_READINESS_PROBE.cjs): **4/4 passed**,
zero failed/skipped. This dependency-free harness probe extracts and executes
the four exact `Promise.race` expressions from the submitted test source after
checking equality to exact0b. With readiness deliberately unresolved and the
operation rejected, every expression exposed the original synthetic rejection
immediately; a separate1-second sentinel bounds the probe itself. It also checks
that all four test timeout declarations remain present. This is explicitly
harness-only evidence, not SQL, API or product execution. Source test syntax and
exact-range whitespace checks passed. Raw log:
`C:/Users/Administrator/Visionary-local/kan39-independent-review-20261102/readiness-0b755723.log`.

The handoff retains both failed local deployed-lock setup attempts and the
derived-cache/junction diagnosis, states that only derived cache paths changed,
and leaves a successful complete local deployed rerun pending rather than
predicting it. Its statement that18 SQL tests passed with this test delta refers
to the implementer's precommit working-tree result, not a new reviewer SQL run.
The canonical runtime identity and accepted earlier review are explicit. Current
Connections/policy/reissue/API/browser/product gates remain unfinished; no new
permission or institution/child activation is claimed.

The reviewer independently located
[exact-head CI41405789855](https://github.com/ecohdeep786/New_Visionary/actions/runs/41405789855),
still in progress at this review checkpoint. Confirm its actual result before
any later verification closeout; this review does not invent that result or the
main verifier's still-running local deployed command outcome. The reviewer used
no SQL window, shared generation, product browser or account writes for this
two-file follow-up. Later source or evidence changes require exact delta review.

## Reissue/schema checkpoint review — exacta9839eb7

**Decision: CHANGES REQUESTED at exact
`a9839eb7b2a82fbd2864bdeeb8f018e8da2b0dd6`. The reissue/core SQL suites pass,
but the native-invariant verifier falsely accepts three materially weakened
indexes, and valid version2 staging receipt admission fails. Earlier bounded
approvals do not cover this new schema/runtime/verification checkpoint. No merge,
Jira Done, protected activation or release is approved.**

The reviewer fetched and remote-verified exacta983 and unchanged devf50868b3,
then merged this candidate into the same matching review instance while keeping
the original reports. The15-file delta was inspected: new forward-only version2
DDL, current Prisma model, canonical migration registry, transactional reissue,
physical tests, version-chain/model verifier, deployed/image integration and
explicit fifth schema provenance patch. The original version1 artifact remains
byte-identical; it was not regenerated from the current model.

### Independently verified improvements and preservation

The correct version2 artifact replaces the permanent workspace/email key with
a nonunique history lookup and normalized partial uniqueness for PENDING/ISSUED.
Runtime reissue retains old IDs/token hashes and closed lifecycle rows, closes
only actually elapsed active deliveries, records expiry and new issue in one
transaction, and creates a fresh ID/token. Literal equality avoids treating
percent/underscore characters as email patterns. Explicit UTC timestamp
comparison avoids a session-timezone conversion of Prisma's timestamp-without-
time-zone expiry. The accepted authority, deletion, expiry, rollback and UID
event-order guards remain in place.

The existing runner still rejects pending DDL on retained domain rows. Migration2
therefore has no accepted retained-record rollout merely because this SQL/index
change preserves row bytes. Its successful-commit evolution is intentionally
forward-only; restoring permanent uniqueness across closed history cannot be
assumed safe. Transactional rollback of a failed v2 application is distinct from
operator rollback after a successful migration. Historical synthetic migration
tests explicitly pin v1 before introducing their own synthetic v2/v3; separate
new tests exercise the actual current chain and retained-row denial/recovery.

The reviewer independently applied the exact zero-context fifth patch to the
preserved0b schema blob. Before SHA256
`10c22a2e2bfede742ece5db5dee356d5a584f1d75bc55422f23f01fa511ae087`,
after SHA256 `583c9140cb47636abb2d9cccb8865942aef9371a378dbeb26b014239414bfb7b`
and diff SHA256 `6b44aceadb6928e1fc435b7b1a7eb6160ad33b04ebc2ae6aa6fca8e8c790ba05`
all match metadata; actual applied bytes equal the candidate schema. Layout and
import checks pass3,842 baseline files plus five patches/11 changed imported
files. The original import manifest/history was not rewritten. Actual
`node scripts/domain-ddl.mjs --write` refuses and leaves the v1 hash unchanged.

After the main verifier confirmed generation finished, the reviewer verified the
new task-local backend cache's source/installed lock hashes and generated model.
An initial raw-schema comparison stopped before retargeting because Prisma
formats whitespace. A complete lexical comparison preserving string tokens and
ignoring comments/format whitespace established all2,499 schema tokens equal.
Only the reviewer's dependency junction was then retargeted to
`C:/Users/Administrator/Visionary-local/kan39-deps/backend/node_modules`; the old
cache remains intact. Own data/invitation compiles passed. No Prisma generation
or package/lock/cache-content mutation was performed by the reviewer.

### N6 / P2 — native DDL verifier accepts weakened invariant semantics

`scripts/domain-ddl.mjs` inspects index names and substring terms. Those checks
do not establish exact key expressions/count or predicate scope. The reviewer
executed [the actual native-DDL weakening probe](evidence/KAN39_NATIVE_DDL_INDEPENDENT_PROBE.cjs)
against isolated physical replay schemas. It temporarily changed only its own
version2 SQL artifact, ran the real verifier for each variant, and restored the
exact original bytes in finally. No worker or shared dependency file was edited.

| Physical replay variant | Actual verifier result |
| --- | --- |
| Exact candidate baseline | Exit0, as expected |
| Add an unexpected real invitation column | Exit1: model drift detected |
| Remove `lower(email)` from the active unique key | Exit0, incorrect acceptance of case-sensitive uniqueness |
| Add role as a third active unique key | Exit0, incorrect acceptance of multiple active deliveries with different roles |
| Add ACCEPTED to the partial active-status predicate | Exit0, incorrect acceptance of uniqueness across closed accepted history |

The candidate artifact itself defines the intended correct key. This finding is
about the claimed native-invariant verification, not a claim that the shipped
artifact already contains those weaker indexes. Prisma's model diff does detect
an extra physical column, but it does not supply the unsupported partial-index
semantics omitted from the current substring check. Inspect actual catalog
uniqueness/validity/key count/key expressions and exact predicate scope, including
the other native indexes and positive revision constraint. Re-run negative probes
requiring every weakened invariant to fail. Registered behavior tests are useful
additional evidence, not a reason to relabel this verifier false acceptance.

### N7 / integration blocker — production admission remains pinned to version1

The canonical registry and new real image plan now require versions1,2, while
`assertProductionAdmission` in `src/data/migration-command.ts` still compares
the receipt to `[1]`. The reviewer independently ran the exact submitted
production-target suite: **6/7 passed, one failed**, exit1. The valid pinned
receipt case throws `STAGING_RECEIPT_INVALID`; the actual synthetic apply/verify
command case still passes. This is a real current-registry integration failure,
not an optional provider setup issue. Resolve admission against the exact current
registered ordered versions and reject missing/reordered/duplicate/extra receipt
versions; do not simply accept arbitrary arrays or disable pinned receipt checks.

The reviewer independently read [CI41478597797](https://github.com/ecohdeep786/New_Visionary/actions/runs/41478597797),
checks job125390655150 failed at registered `npm run data:check`; production was
skipped. Main verification reported the same49/50 failure. The exact candidate
cannot claim passing full integration on the strength of its focused reissue suite.

### Actual independent SQL evidence and next decision

Own exact-source execution against disposable schemas with separate roles:

- Prior independent repaired-mode probe:8/8 passed,7.071 seconds.
- Submitted core plus reissue/evolution suites:28/28 passed,16.796 seconds.
- Actual native DDL verifier: baseline pass; physical-column drift rejected;
  three independent semantic index weakenings falsely accepted as above.
- Submitted production-target suite:6/7, retained `STAGING_RECEIPT_INVALID` failure.

The28 include closed-history/replay, concurrent reissue, physical normalized
PENDING/ISSUED uniqueness, literal special-character emails, positive/negative
session timezones, actual receipt-trigger outage with rollback/cold retry,
retained-v1-row migration denial and failed-v2-index application recovery. No
consumer, browser, provider or production record was fabricated. Raw results,
variant stdout/stderr and stop log remain outside Git under
`C:/Users/Administrator/Visionary-local/kan39-independent-review-20261102/a9839eb7`.
The exclusive loopback SQL instance was stopped in finally and the stop log
confirms server stopped. Version2 artifact bytes were verified restored to the
exact candidate after all weakening runs.

Keep the task In Progress and retain this rejection. A new source/schema/
verification head needs its own exact review after N6/N7 repair and registered
checks. Current policy, authenticated API/Connections transport, real browser/
two-device, hosted/provider/privacy and release gates remain open; KAN110 policy
blocks protected activation. No merge, Done or completed-worktree removal follows
from the successful focused SQL and provenance checks.

## N6/N7 replacement review — exact1a22f733

**Decision: N6 and N7 are resolved. The reissue/schema/verification source
checkpoint is independently approved at exact
`1a22f73337ad13ccd94ae9890282e5caafb6b76e` for continued KAN-39 work. This
bounded source decision does not approve the unfinished feature for dev merge,
Jira Done, protected-role activation or release.** Reviewer responsibility and
independence remain unchanged; rejecteda983 and its failure evidence are retained.

The reviewer fetched and remote-verified exact1a22f733 and unchanged devf50868b3,
then merged the replacement into the same clean matching reviewer instance.
Five files change over rejecteda983: native DDL verifier, production admission
command, target tests, the physical partial-key regression and worker handoff.
Migration artifacts, Prisma schema and invitation runtime remain unchanged from
the separately inspected and executed reissue checkpoint. Exact-range whitespace
passed. No implementation or worker checkout was edited by the reviewer.

The native verifier now inspects catalog table, method, uniqueness, validity,
readiness, attribute count, ordered key expressions and normalized predicate
instead of accepting substrings in an index definition. The required positive
revision CHECK also has to match its expression. The physical uniqueness test
now uses ADMIN for the second active delivery while the first is MEMBER, so
adding role to the key no longer passes that database-boundary regression.

Production admission receives the actual registered version sequence from the
command, requires strictly increasing positive safe integers and compares the
entire ordered receipt sequence. The positive1,2 case and denial of missing,
reordered, duplicate and extra versions are present. Existing source approval,
digest, target, byte pin, schema, namespace and receipt-age checks remain. This
fix does not turn production admission into acceptance of an arbitrary array or
authorize applying pending DDL to retained records.

### Independent exact replacement execution

The reviewer recompiled its own data and invitation runtime successfully, using
the already verified task-local backend client with unchanged schema. No Prisma
generation or shared dependency mutation was performed. In an exclusive
loopback SQL window the reviewer executed:

| Check | Actual result |
| --- | --- |
| Exact physical DDL/model/native baseline | Exit0 |
| Unexpected physical invitation column | Exit1, model drift rejected |
| Active key without lower(email) | Exit1, native index drift rejected |
| Active key with extra role | Exit1, native index drift rejected |
| Active predicate including ACCEPTED | Exit1, native index drift rejected |
| Positive revision CHECK weakened to revision>0 OR true | Exit1, native constraint drift rejected |
| Eight independent repaired-mode realSQL probes | 8/8, zero failures/skips,4.646 seconds |
| Submitted core/reissue/evolution realSQL suites | 28/28, zero failures/skips,18.764 seconds |
| Submitted production-target suite | 7/7, zero failures/skips,1.584 seconds |

The [native probe](evidence/KAN39_NATIVE_DDL_INDEPENDENT_PROBE.cjs) ran with
`KAN39_NATIVE_EXPECT_STRICT=1`. Its strict mode additionally exercises the
positive revision tautology; prior rejected-source baseline evidence remains
separate. These are real executions of the submitted physical verifier after
temporary weakening of only the reviewer's version2 artifact. All exact original
SQL bytes were restored in finally and independently compared with1a afterward.
No worker source or accepted historical migration was changed. Every negative
variant now fails for the intended model/index/constraint gate, rather than a
missing tool or test-owned constant.

The seven target tests combine policy/configuration checks and an actual
synthetic canonical migration command using quoted IAM-style role names; they
do not establish real GCP/IAM/production execution. Their former valid pinned
version2 receipt failure is resolved. The28 physical cases retain the original
permission/race/outage recovery obligations as well as history, normalized
active-key enforcement, literal email matching, both session timezones,
failed-v2 migration rollback/cold retry and retained-record migration denial.

Raw exact results and each negative verifier stdout/stderr remain outside Git at
`C:/Users/Administrator/Visionary-local/kan39-independent-review-20261102/1a22f733`.
The retained synthetic server was stopped in finally; its stop log confirms it.
The SQL window was returned to the main verifier. No live account, profile,
billing, Firestore, hosted SQL, cloud resource or browser was used by this review.

The reviewer independently located the exact replacement
[CI41481231768](https://github.com/ecohdeep786/New_Visionary/actions/runs/41481231768)
and read its live jobs: checks125399773244 completed successfully; production
125401923856 was skipped. This replaces the earlier failed CI checkpoint for
this new head without erasing that failure. The handoff accurately distinguishes
prior precommit focused results, retained layout/DATA failures and broader gates.

No new blocking source finding remains in this bounded replacement. Current
accepted institution/guardian/age/purpose policy, authenticated bounded API and
authority inventories, Connections transport, actual connected browser and
two-device outcomes, hosted/provider/privacy and release acceptance remain open.
Prerequisite probes are not legal/policy approval or acceptance of their provider.
KAN-39 must not be declared complete from these local SQL/source/CI results.
Any subsequent source or final evidence head requires exact review again; no
merge, Jira transition, activation or worktree cleanup was performed here.
