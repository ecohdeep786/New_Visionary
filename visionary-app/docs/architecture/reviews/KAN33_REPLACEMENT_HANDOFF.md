# KAN-33 executable invariant rework

31 October 2026. Implementer: Codex /root. Runtime-test source: `f3961d08ef8d58f9382990259f482eff5353c37c`.
Browser-repaired source: `caf9dcd49319f0a44ead67b8a7513234c0cab44f`.
State: **Done for the scoped regression enabler and corrected existing route; real-source/full feature/release gates remain open**.

The sections below retain the submitted verification checkpoints. The final
closeout at the end records the actual accepted integration and Jira result.

The earlier `5fffa44a` candidate was independently rejected. Its authority and
cancellation assertions compared fixture constants without executing those
boundaries. Its frontend suite did not consume the claimed shared matrix.
That history and the earlier Manus rejection remain preserved in Git and Jira.

## Browser-found integration repair

The actual candidate product ran from this worktree at localhost:5183 with
the real Firebase API at localhost:3003. An existing Professional session
restored normally. Home -> Learn -> authored workplace sample -> chapter ->
Start -> Check my understanding failed visibly on exact handoff500c85d4:
`POST /api/account/learningsessions` returned404 while auth/me and CSRF returned200.
The preserved local JPEG shows the failure and retained authored activity.

The default learning client supplied relative paths to a concatenating auth
transport without a trailing separator in its base path. The repair adds
that separator to the learning client's default base path. A new test uses
the actual default client and auth transport (not an injected request stub)
to verify every start/read/check/assessment/cancel/list URL, account/CSRF
binding, credentials and no-store behavior. It failed on the original source
(six existing tests passed, the new test failed on the malformed path).
After repair, all24 focused client/transport/durable-session tests pass.
The generated product-surface change updates only this source file's hash;
routes, controls and authority declarations are unchanged.

The real Firebase Admin/Firestore read-only probe now passes against the
configured live project/database without reading out profiles or writing
records. The corrected source passed a new full local check and the real
browser journey below. Renewed exact-head independent review and final CI
remain required; earlier approval does not approve this frontend source change.

## Actual acceptance scope and application

This rework adds executable regression evidence for existing product
boundaries, without installing new runtime permission or persistence behavior:

- Draft v1 examples exercise schema validity, complete wire size, payload
  fingerprint comparison and revision comparison only. These helpers do not
  authorize a command or commit a result.
- A bounded isolated runner compiles the actual LearningController,
  LearningService and their production imports using the deployed dependency
  lock. HTTP requests pass through the real controller/request-authority and
  service logic to the existing transactional test store. The upstream
  authentication call is an explicit current-session double; no Firebase
  credential, local configuration, external database or provider is loaded.
- Runtime cases check server assessment, wrong account/workspace/revision,
  expired/revoked-session admission, current authentication before cached
  receipt replay, changed-payload conflict, persisted cancellation, a genuinely
  suspended HTTP request resuming after cancellation, stale-cancel recovery,
  forged scores/account switch/source-version mismatch, and a lost commit
  response followed by one retained assessment on retry. Denials compare the
  complete owning-store snapshot; cancellation does not create assessment
  evidence. Cancellation does commit lifecycle state, as the current API
  actually does.
- The distinct frontend classroom cases exercise the real local service and
  synthetic organization-review/delivery/class/enrollment/submission records.
  They prove local positive/replay/conflict/revision/class-access behavior,
  not the learning HTTP API, server classroom authorization, a shared wire
  matrix, or revoked-consent behavior.

The selected synthetic classroom example is the existing fictional framework,
class6 Mathematics, book-fixture version1, English. The backend authored
fraction-check fixture is separately identified by its actual source IDs.
These are technical fixtures, not one connected server classroom journey or
accepted real curriculum. The founder is preparing real books/curriculum for
later supplied-source integration under KAN-29; final all-board/all-class scope
and English launch are retained.

## Verification commands and current result

Executed technical verification:

- Draft schema examples: five passed locally and in CI.
- `node scripts/scope06-runtime-check.mjs`: actual HTTP/controller/service
  twelve passed locally and in CI, zero failed/skipped.
- Frontend local-service scenarios: six passed in clean Linux CI, including
  actual membership revocation before identical submission replay.
- [Full CI41184684193](https://github.com/ecohdeep786/New_Visionary/actions/runs/41184684193)
  on exact source `f3961d08`: root check, scripts82, contracts35,
  schema5/runtime12/frontend-scope6, full frontend624, lint/types/build,
  PostgreSQL20+39+11, deployed99+11, actual migration/API images and
  infrastructure JS31/Python11 all passed. Production was skipped.
- Real-service weakening: removing the actual LearningService active-status
  guard in an isolated source copy makes both terminal/late-assessment
  cancellation scenarios fail (two failures, child exit1).
- Current-input weakening: changing actor/workspace/revision/session fixtures
  without changing their expected outcomes makes four actual HTTP scenarios
  fail. The normal `node scripts/check.mjs` exits1 before frontend execution.
  The fixture file was restored byte-for-byte afterward.

## Actual product browser and store verification

The corrected candidate ran with the existing real Firebase Professional
session in the in-app browser. The authored English workplace sample went
from explanation to an actual server-issued check (create/check201), retained
the unscored selection across reload, then recorded a correct assessment201.
The UI disabled the answered options and showed one saved attempt after reload.
A fresh Node process read only the newly created sample session, assessment
and command from the configured live Firestore database: owner/receipt bindings
matched, phase was check_passed, revision2, and the immutable assess receipt existed.
No account/profile/billing scan or write was requested by that readback.

The visible journey continued through guided practice (2/2 recorded correct
answers), the authored project brief and a390x844 project layout without
horizontal overflow. Returning to learning and reloading retained both steps
and the Build stage. Practice/Build here are UI/local workspace evidence, not
a new claim of durable Build, classroom or model acceptance. Browser cancellation
was not exercised; actual controller/service cancellation remains in runtime12.

[Sanitized browser receipt](../delivery/evidence/KAN33_LOCAL_BROWSER_2026-10-31.json)
contains screenshot SHA256, JPEG signatures/dimensions, actual observed assessment
status, safe Firestore readback and limitations. Raw JPEGs, logs, exact new-record
bindings and ignored credentials stay outside Git at
`C:/Users/Administrator/Visionary-local/kan33-rework-20261031/`.
The final reload console had zero errors/warnings. Its truncated network buffer
is not represented as a full HAR; the original assessment201 event is preserved.

Locked frontend/backend restoration completed. Earlier interrupted-install
attempts are retained and not counted as successful tests. Full local
`npm run check` passed at exactcaf9 on2026-10-31T16:09:01Z, including the new
actual-default-client regression (full frontend625). CI41217997684 first passed
root check but failed eight unchanged DATA02 setup cases exceeding existing
15-second transaction bounds. The failed log is preserved. One bounded same-job
retry passed unchanged source and deadlines: checks job124589852792,
[CI41217997684 attempt2](https://github.com/ecohdeep786/New_Visionary/actions/runs/41217997684/attempts/2),
SQL20+39+11, deployed99+11, actual API/migration images and infrastructure31+11
all passed; production skipped. The final documentation head still requires CI.

The runtime runner requires the independently installed locked
`infrastructure/gcp/runtime` dependencies, already installed before the root
check by required CI. It compiles source in a guarded temporary directory and
uses only the existing synthetic transaction fixture. It does not rely on old
dist output or another worker's generated client.

## Remaining gates and review

Current source publication/consent revocation enforcement, real membership
authority, source/rights acceptance, a connected frontend-to-server classroom
journey, broader provider coverage, SQL/hosted, model, two-device feature and
release acceptance remain with their owning tasks. A source-version mismatch
is not proof of current publication reauthorization. No generic consent or
policy checker is added to make fixture tests pass.

Separate reviewer: `/root/kan33_independent_review` accepted responsibility and
passed the caf9 source delta, actual URL mutation probe and18 relevant tests.
Final approval remains pending this exact new handoff/evidence head and passing CI.
Task returned from In Progress to Testing for the corrected browser verification. Only
accepted scope with checked published dev integration and an actual Jira
receipt is eligible for Done and evidence-preserving task cleanup.

## Accepted dev closeout

Independent approval: exact `73e31d55473b178f2985644067b941bd2178fa05`, report-only final
head `133019b725c88e90401d68c941bd92756bc361a4`. Final-head CI passed: https://github.com/ecohdeep786/New_Visionary/actions/runs/41219772606/attempts/2.
PR33 merged into published dev at `10e455a0dba38c69b100fc04e6566f415f0fd8e6`; its
complete tree matches the accepted final head. Integrated CI passed: https://github.com/ecohdeep786/New_Visionary/actions/runs/41220472624.
Production was skipped; main was not promoted. Actual Jira transition51 returned
Done, acceptance comment10514, on2026-10-31T16:40:33Z.

This closes executable invariant regression and the repaired client route only.
Founder-supplied released books/source/rights, current consent/publication and
classroom authority, durable Build, hosted/model/privacy/two-device and release
acceptance remain open. Three ignored local configuration files are byte-preserved
outside Git. Actual worktree retirement follows this evidence-only receipt review
and publication; the resulting cleanup receipt is recorded in Jira.
