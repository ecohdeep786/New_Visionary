# KAN-33 executable invariant rework

31 October 2026. Implementer: Codex /root. State: **In Progress; new verification and independent review pending**.

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

New verification is pending on this work-in-progress checkpoint:

- `node --test backend/tests/contracts/scope-06/scope-06.test.mjs`
- `node scripts/scope06-runtime-check.mjs`
- `node --test frontend/tests/contracts/scope-06/scope-06.test.mjs`
- `npm run check` (all three steps registered fail-fast)
- Meaningful current-state/service weakening probes, restored byte-for-byte.

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

Separate reviewer: pending exact new candidate and executed evidence. Earlier
approval/rejection cannot approve changed source. Task remains In Progress
until verification is complete, then Testing for independent review. Only
accepted scope with checked published dev integration and an actual Jira
receipt is eligible for Done and evidence-preserving task cleanup.
