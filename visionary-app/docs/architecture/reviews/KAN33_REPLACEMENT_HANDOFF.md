# KAN-33 executable invariant rework

31 October 2026. Implementer: Codex /root. Technical source: `f3961d08ef8d58f9382990259f482eff5353c37c`.
State: **developer checks passed; Testing for mandatory browser verification and independent review**.

The earlier `5fffa44a` candidate was independently rejected. Its authority and
cancellation assertions compared fixture constants without executing those
boundaries. Its frontend suite did not consume the claimed shared matrix.
That history and the earlier Manus rejection remain preserved in Git and Jira.

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

Local evidence: `C:/Users/Administrator/Visionary-local/kan33-rework-20261031/`
contains the full CI job log, local runtime output, both executed probe scripts
and their result/log files. A local frontend attempt failed due to an interrupted,
partial Firebase package install; it is not counted as a passing run. Independent
locked frontend/backend restoration is underway for actual browser testing.
The mandatory candidate product browser run has **not yet passed**; no merge or
Done is authorized until that run and independent exact-SHA review are accepted.

The runtime runner requires the independently installed locked
`infrastructure/gcp/runtime` dependencies, already installed before the root
check by required CI. It compiles source in a guarded temporary directory and
uses only the existing synthetic transaction fixture. It does not rely on old
dist output or another worker's generated client.

## Remaining gates and review

Current source publication/consent revocation enforcement, real membership
authority, source/rights acceptance, a connected frontend-to-server classroom
journey, real Firebase/provider, SQL/hosted, model, two-device feature and
release acceptance remain with their owning tasks. A source-version mismatch
is not proof of current publication reauthorization. No generic consent or
policy checker is added to make fixture tests pass.

Separate reviewer: pending exact new handoff candidate and browser evidence. Earlier
approval/rejection cannot approve changed source. Task remains In Progress
while fixing code, then Testing for browser verification and independent review. Only
accepted scope with checked published dev integration and an actual Jira
receipt is eligible for Done and evidence-preserving task cleanup.
