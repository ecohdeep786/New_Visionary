# KAN-146 independent review

Current decision: **approved** exact implementation 83d2964bf9ed3470c999d2023eeb4b9d5ec9b4ec for the KAN-146 / LEARN-10 durable teaching-loop scope; all required checks passed on that candidate. Dev integration, hosted Firestore/IAM acceptance, native Jira Done and the linked open gates remain separate pending receipts. One minor non-blocking documentation note is recorded below.

- Jira/source: KAN-146 / LEARN-10. Task receipt `docs/architecture/tracking/task-executions.json` (added at 8616e4f6) records status Testing, review pending, implementer DeepSeek, implementationCommit 83d2964bf9ed3470c999d2023eeb4b9d5ec9b4ec, backendTests 81, frontendTests 544. No Jira access was used or changed by this reviewer.
- Acceptance scope: signed-in Learn journey durable teaching loop (connected feature slice in the existing runtime): start/present/assess/cancel commands with scope echoes, expectedRevision, idempotent command receipts (exact replay after a lost response), server-side scoring against the server-stored answer key, bounded three-failure stop with a different strategy and a review suggestion, truthful 503-style outage handling, drafts/attempts preserved, no teacher contact, no automatic escalation, no taught/mastery flag, and unchanged local-only behaviour for signed-out/unconfigured sessions. Open gates explicitly not part of this task: SQL owning store, authoritative content/criteria service and calibration, hosted Firestore/IAM acceptance, cross-device sync (LEARN-08/LEARN-09/SYNC-01/SYNC-02); account-directory keeps learning not-connected.
- Implementer: DeepSeek (branch codex/deepseek-kan-146-teaching-loop). The commits ae2113c5 (backend) and 83d2964b (frontend/contract) form the candidate; 8616e4f6 adds only D-100 docs and the execution receipt.
- Reviewer: **independent_review_kan_146**, a separate agent from the implementer. I accept responsibility for this source review, the verification and the probes explicitly attributed to me.
- Reviewer branch: codex/qa-review-kan-146-teaching-loop, fast-forwarded to the candidate locally. Before this review commit, the remote ref still pointed at the base commit 9fd87bce; the push that carries this document fast-forwards the remote QA branch from the base to the candidate plus this review. The task branch was not changed.
- Base: 9fd87bcee204f8a74b296112938e4fa7577d2ba7 (origin/dev). Exact reviewed candidate: 83d2964bf9ed3470c999d2023eeb4b9d5ec9b4ec.
- Reviewer checkout: C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-146-teaching-loop/visionary-app. The reviewer branch differs from the exact implementation only by this review document.
- Owned review file: this document only. No product source, configuration, credential or live data was changed by the reviewer. No live database, provider or network service was contacted.

## Exact-revision proof

```text
git rev-parse HEAD
83d2964bf9ed3470c999d2023eeb4b9d5ec9b4ec

git status --short
(empty — clean)

git diff --stat 83d2964b..8616e4f6
docs/architecture/tracking/task-executions.json | 31 ++++++
docs/visionary/DECISIONS.md                     |  6 +++
docs/visionary/QA.md                            |  4 +++
docs/visionary/STATUS.md                        |  4 +++
4 files changed, 45 insertions(+)
```

The post-candidate commit adds only the D-100 decision/status/QA entries and the LEARN-10 execution receipt. The receipt claims no acceptance, no Jira Done and no hosted verification; the D-100 entries list every open gate. `git diff --check 9fd87bce..83d2964b` exits 0.

## What was verified at 83d2964bf9ed3470c999d2023eeb4b9d5ec9b4ec

Commands were run by the reviewer on 18 October 2026 (Windows, PowerShell, Node v24.19.0) inside the QA worktree at the exact candidate.

Backend:

```text
npm run backend:build                         exit 0 (nest build, no errors)
node --test --test-concurrency=2 backend/tests/account-directory.test.cjs backend/tests/account-storage.test.cjs backend/tests/billing.test.cjs backend/tests/feedback.test.cjs backend/tests/firebase-admin.test.cjs backend/tests/firebase-product.test.cjs backend/tests/learning-loop.test.cjs backend/tests/pedagogy-proposal.test.cjs backend/tests/teaching-policy.test.cjs
exit 0 — tests 81, pass 81, fail 0, 7.44 s
```

Root product check:

```text
npm run check                                 exit 0
  source-control import integrity: PASS — 3842 imported files match baseline plus 3 recorded patches (10 changed files), credential files excluded
  script regression tests: 18 pass, 0 fail
  lint (eslint --quiet): clean
  typecheck: tsc -p ./jsconfig.json && tsc -p ./tsconfig.domain.json passed
  frontend tests: 544 pass, 0 fail
  production build (vite): exit 0, built in 18.01 s
```

Focused frontend suites from `frontend/`:

```text
node --test tests/learning-session-client.test.mjs tests/learning-durable-session.test.mjs tests/learning-pipeline.test.mjs tests/feedback.test.mjs
exit 0 — tests 42, pass 42, fail 0, 2.40 s
node --test tests/product-surface.test.mjs
exit 0 — tests 5, pass 5, fail 0, 5.85 s
```

Surface registry honesty:

```text
npm run scope:audit                           exit 0
routes 68, registeredEndpoints 32, controlDeclarations 1637, routeReachableDeclarations 1479, controlFiles 219, hostedVerified:false
```

`integration/contracts/product-surface-review.json` contains operation `durable-teaching-loop-sessions` (state connected, execution server) with exactly six endpoints, byte-equal to the registered `/api/account/learning/` surface: GET/POST `/api/account/learning/sessions`, GET `/sessions/:sessionId`, POST `/sessions/:sessionId/checks`, POST `/sessions/:sessionId/assessments`, POST `/sessions/:sessionId/cancel`. Model/project/classroom endpoints remain blocked by the updated product-surface test. The audit document's "32 endpoints" count matches.

## Acceptance criteria → evidence

- **Start/present/assess/cancel with scope echoes.** `learning.contract.ts` validates closed field sets plus bounded scope references; `learning.service.ts` compares workspaceId/sourceVersion/criteriaVersion against the stored session and rejects mismatches with 409. `learning-loop.test.cjs` covers wrong workspace/source/criteria. Frontend durable test asserts the exact scope echoes sent (`demo-adult:student`, `2026.1`/`2026.1`, provider/sourceId).
- **expectedRevision.** Commands carry it; stale revisions return 409 (`changed()`), verified in service tests, the HTTP test and the two-device test.
- **Idempotent receipts / exact replay after lost response.** Each command writes `learningCommands/{commandId}` with uid/kind/fingerprint in the same transaction; replay returns the stored receipt before any scope/revision check, and a reused commandId with different canonical content returns 409. Verified in the backend lost-response test (503 then identical replayed assessment, one assessment row) and the frontend durable test (byte-identical command retried, one attempt recorded). The reviewer HTTP probe confirmed replay bodies byte-identical for start, present and assess.
- **Server-side scoring against the server-stored key.** `assess` computes `passed = selection === check.answerIndex` from the stored check; no client field can carry a verdict (`passed`/`correct`/`mastered` rejected with 400 — verified in the contract test and the reviewer HTTP probe). Projection exposes only `checkId`, `strategy`, `optionCount`; the reviewer probe confirmed assess responses contain no `answerIndex`, and tests assert no prompt/option/key leakage in receipts, list, assessments subcollection or stored command receipts.
- **Bounded three-failure stop.** Kernel: `maxFailedChecks` 1–3, a failed check forces a different strategy before the next presentation, third failure yields `review_suggested` where present/assess are refused and check_passed is distinct. Frontend rotates worked_example → analogy → practice, refuses a new automatic check with the bounded copy, and the reviewer confirmed `beginComprehension` stops. No automatic new check starts after the stop; verified in both the backend and the frontend three-failure tests.
- **Truthful outage handling.** Non-HTTP storage failures map to a redacted 503 without leaking internals (service test with an injected `Private database detail`; HTTP test asserts the message never appears). Frontend refusals use a 503-style "could not be confirmed" error. Reviewer probe: keyed/wrong-uid/nested-key receipts refused with status 503 and no echoed content; a valid receipt passes.
- **Drafts/attempts preserved.** The pipeline persists pending commandIds before the network call, keeps `answerDraft`/question on failure, records no grade on refusal and deduplicates attempts by receipt id. Covered by the lost-response and refused-assessment tests; cancellation preserves recorded attempts and evidence (service and frontend tests).
- **No teacher contact / escalation / mastery / notification.** No such records, collections or commands exist in the diff; tests assert their absence in receipts and stored keys; the review suggestion is interface copy only ("Review the explanation … ask a trusted adult or teacher for help"), translated in en/hi/bn.
- **Signed-out/unconfigured local behaviour unchanged.** The adapter is configured only for a signed-in Firebase account in `LearningWorkspace.jsx` (same account-guard pattern as the existing billing/feedback clients) and cleared on unmount; the unconfigured test confirms the exact previous local grading with no server commands. The only local-flow diff in `learningPipelineService.ts` preserves the pre-existing local semantics.
- **Pipeline chain.** Frontend → API: validated client wraps the shared auth transport with `basePath:/api/account/learning` and re-validates every receipt (version, uid, phase, strategy whitelist, bounds, key refusal, account-change guard before send and after receive). API → backend: controller re-verifies the device-bound server session, `X-Visionary-Account` and CSRF/Origin for commands; UID comes only from authentication. Backend → data: Firestore documents under `visionary_accounts/{uid}` composed atomically in transactions. Jobs/ML and cache: N/A for this slice — no queue, model or cache path is touched. Device outcome: signed-in start/present/assess/cancel is exercised by the HTTP test and the client probes; no hosted/device qualification is claimed.
- **Credentials/secret hygiene.** `git diff 9fd87bce..83d2964b` contains no `.env`, tokens, private keys, service-account material or live-database statements; tests use fictional fixtures (`billingMemory`) and 127.0.0.1 HTTP only. No provider/Admin initialization occurs in the reviewed tests or probes.

## Adversarial probes (reviewer-run, raw outcomes)

1. Client validator (inline Node module run from `frontend/`, no repo file changed, stubbed request):
   - receipt with top-level `answerIndex`: refused, status 503, message "Learning progress could not be confirmed…".
   - receipt with `uid: 'other'`: refused, status 503.
   - receipt with nested `check.answerIndex`: refused, status 503.
   - valid receipt: accepted (sessionId returned).
2. Verdict injection over the real compiled HTTP surface (reviewer probe on the built dist, in-memory fixture, 127.0.0.1): assess command with `passed: true`: 400; a second different assessment after the check passed: 409; assess response contains no `answerIndex`; exact replay of start/present/assess returns byte-identical bodies.
3. Idempotency/bounded-stop code inspection: pending `durableStart`/`durablePresent`/`durableAssess` identities saved to storage before every network call and reused on retry; backend kernel validates stored loop state fail-closed (`teachingLoopState`) and refuses corrupted state with 503 rather than an invented pass; `review_suggested` blocks presents and assessments.
4. Secret scan over the full candidate diff: no matches.

## What was NOT verified

- Hosted Firestore rules/IAM/device acceptance of these collections and the real transaction path — not run, not claimed.
- Any live provider, model or database: not available and not used; no `.env` or credentials were read.
- Cross-device sync, SQL owning store, authoritative content/criteria service and calibration: explicitly out of this task's scope and left open.
- Native Jira transitions/comments, dev integration and merge: not performed by this reviewer.
- The Vite build time reported in the implementer's D-100 receipt (15.34 s) differs from the reviewer's run (18.01 s); this is run-to-run variance, not evidence of a difference in artifact.

## Remaining defects, limitations and linked open gates

- **Minor (non-blocking) documentation note:** `integration/LEARNING_LOOP_CONTRACT.md` states that exact command replay "returns the original stored receipt (HTTP 200)". Measured behavior is 201 (Nest `@Post` default status), with otherwise identical semantics (stored receipt returned before scope/revision checks; bodies byte-identical). Recommend correcting the parenthetical to 2xx/201 at the next docs touch. It overstates nothing about verification or hosted scope.
- The present command still carries the authored key as part of the check presentation (the server stores what the signed-in browser presents); the authoritative content/criteria service and calibration remain the named open gate (LEARN-08/LEARN-09), as the contract and the D-100 entries state.
- A legacy browser-local unit already saved at stage `check` (created before this feature, without durable linkage) is still graded by the unchanged local path while signed in; newly started checks always take the durable path. This preserves the intended "unchanged local-only behaviour" but is worth knowing for the future hosted migration.
- Open gates unchanged and listed in the contract, audit row and D-100: LEARN-08, LEARN-09, SYNC-01, SYNC-02, hosted Firestore/IAM acceptance; account-directory keeps learning not-connected.

## Reviewer decision

**Approved — verification passed** for the exact implementation `83d2964bf9ed3470c999d2023eeb4b9d5ec9b4ec` at base `9fd87bcee204f8a74b296112938e4fa7577d2ba7`, covering only the KAN-146 durable teaching-loop scope above. No blocking defect was found; the single documentation note is non-blocking. This approval does not complete hosted acceptance, dev integration, native Jira Done, or any linked open gate, and no production release is certified. Dev integration and Jira receipts remain for the integrator; any later source change invalidates this exact-SHA approval.

Verifier identity: independent_review_kan_146 (separate from implementer DeepSeek), 18 October 2026. Evidence as recorded above.
