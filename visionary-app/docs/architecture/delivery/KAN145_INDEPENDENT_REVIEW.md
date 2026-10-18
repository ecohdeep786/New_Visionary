# KAN-145 independent review

Current decision: **approved** exact implementation 98ce3e5916e61b3c76a01b732f29d9b49b692af6 for the KAN-145 / LEARN-09 durable knowledge-projection scope; all required checks passed on that candidate. Dev integration, hosted Firestore/IAM acceptance, native Jira Done and the linked open gates remain separate pending receipts. Two minor non-blocking notes and the cross-branch integration coupling are recorded below.

- Jira/source: KAN-145 / LEARN-09. Task receipt `docs/architecture/tracking/task-executions.json` (added at e017118c) records status Testing, review pending, implementer DeepSeek, implementationCommit 98ce3e5916e61b3c76a01b732f29d9b49b692af6, backendTests 79, backendFailed 0, frontendTests 532, frontendFailed 0, rootCheck true. No Jira access was used or changed by this reviewer.
- Acceptance scope: authenticated owner projects an immutable SERVER-ASSESSED receipt from the durable learning store into one scope-keyed knowledge estimate; calibrated parameters selected server-side by source/criteria; replay, evidence gaps and model rebuilds handled; probability stays an estimate and never a passed check, mastery, taught flag, teacher contact, automatic escalation or verified success; evidence is inspectable. The earlier checkpoint 8738ecc7 accepted a client-supplied `correct`/`assessedAt` command and a workspace enum, and stamped the result `origin: server_assessment`; the recheck 450b7660 replaced that with reference-only commands, and I re-verified the corrected design from source and by running the compiled code myself.
- Implementer: DeepSeek (branch codex/deepseek-kan-145-knowledge-projection). The candidate series is 8738ecc7497f9005d45dc090ff9ac16d4818672b (initial slice), 450b7660cf1f77e1897311880191c806fad991b5 (recheck correction), 98ce3e5916e61b3c76a01b732f29d9b49b692af6 (surface operation + contract); e017118c2fe912e2c502e0e5eff55d1542f1e4bd adds only D-101 docs and the execution receipt.
- Reviewer: **independent_review_kan_145**, a separate agent from the implementer. I accept responsibility for this source review, the verification and the probes explicitly attributed to me.
- Reviewer branch: codex/qa-review-kan-145-knowledge-projection at e017118c2fe912e2c502e0e5eff55d1542f1e4bd. Before this review commit the branch differs from the exact candidate only by the D-101 documentation/receipt commit and this review document. The task branch was not changed, and nothing was pushed.
- Base: 9fd87bcee204f8a74b296112938e4fa7577d2ba7 (origin/dev per the execution receipt). Exact reviewed candidate: 98ce3e5916e61b3c76a01b732f29d9b49b692af6.
- Reviewer checkout: C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-145-knowledge-projection/visionary-app.
- Owned review file: this document only. No product source, configuration, credential or live data was changed by the reviewer. No live database, provider or network service was contacted; all probes ran against the compiled candidate and the in-memory fixture on loopback only.

## Exact-revision proof

```text
git rev-parse HEAD
e017118c2fe912e2c502e0e5eff55d1542f1e4bd

git status --short
(empty — clean)

git diff --stat 98ce3e59..e017118c
 visionary-app/docs/architecture/tracking/task-executions.json | 31 ++++++++++++++++++++++
 visionary-app/docs/visionary/DECISIONS.md                     |  6 +++++
 visionary-app/docs/visionary/QA.md                            |  4 +++
 visionary-app/docs/visionary/STATUS.md                        |  4 +++
 4 files changed, 45 insertions(+)
```

The post-candidate commit adds only the D-101 decision/status/QA entries and the LEARN-09 execution receipt. The receipt claims no acceptance, no Jira Done and no hosted verification; the D-101 entries list every open gate. `git diff --check 9fd87bce..98ce3e59` exits 0. The candidate tree is the full diff `9fd87bce..98ce3e59`: 11 files — the five learning sources, the backend test, `firebase-product.module.ts`, `product-surface.json`, `PRODUCT_SURFACE_AUDIT.md`, `frontend/tests/product-surface.test.mjs`, the surface review registry and `integration/KNOWLEDGE_PROJECTION_CONTRACT.md`. `teaching-policy.ts` is not modified by this branch; the service consumes the pre-existing kernel unchanged.

## What was verified at 98ce3e5916e61b3c76a01b732f29d9b49b692af6

Commands were run by the reviewer on 18 October 2026 (Windows, PowerShell, Node v24.19.0) inside the QA worktree at the exact candidate.

Backend:

```text
npm run backend:build                         exit 0 (nest build, no errors)
$files = Get-ChildItem tests\*.test.cjs | ForEach-Object { $_.FullName }; node --test --test-concurrency=2 $files
exit 0 — tests 79, pass 79, fail 0, cancelled/skipped/todo 0, 7.07 s
```

Root product check and surface audit:

```text
npm run check                                 exit 0
  layout/import integrity: PASS — 3842 imported files match baseline plus 3 recorded patches (10 changed files); credential files excluded
  script regression tests: 18 pass, 0 fail
  source audit: {"task":"KAN-28 / SCOPE-01","routes":68,"registeredEndpoints":29,"controlDeclarations":1637,"routeReachableDeclarations":1479,"controlFiles":219,"states":{"connected":494,"preview":931,"missing":52,"intentionally-unreleased":160},"hostedVerified":false}
  lint (eslint --quiet): clean
  typecheck: tsc -p ./jsconfig.json && tsc -p ./tsconfig.domain.json passed
  frontend tests: 532 pass, 0 fail
  production build (vite): exit 0, built in 15.59 s

npm run scope:audit                           exit 0
  same 68 routes / 29 registeredEndpoints / 1637 controlDeclarations line as above
```

## Acceptance criteria → evidence

- **Reference-only command (corrected flaw).** `knowledge-command.ts` accepts exactly `{version:1, commandId, sessionId, receiptId}` with lowercase UUIDv4 shapes and rejects any other key (`uid`, `correct`, `passed`, `digest`, `assessedAt`, `origin`, `workspaceId`, `schemaVersion`, unknown keys) with 400. I inspected the superseded checkpoint 8738ecc7 directly: its command took client `correct: boolean` and `assessedAt: number` and its own `['personal','classroom','organization']` workspace enum. The candidate contains none of that; the only `correct` value is `assessment.passed` read from the stored record (`knowledge-projection.service.ts` line 63).
- **Evidence comes only from the server store.** `assessed()` requires the owner session (`session.uid === uid`, `session.sessionId === command.sessionId`) with bounded workspace/concept/source/criteria refs, and the assessment under `learningSessions/{sessionId}/assessments/{receiptId}` with matching `uid`/`sessionId`/`receiptId`, boolean `passed`, bounded `digest` and a parseable server timestamp `at`. The command object's sessionId/receiptId/commandId are its only request-derived inputs; no service code path reads a verdict, digest or timestamp from the body.
- **Cross-check against LEARN-10 (read-only, other worktree).** In `deepseek-kan-146-teaching-loop`'s `learning.service.ts` at 83d2964b, the session doc writes `uid` and `sessionId` (line 77) and `concept.{conceptId,sourceVersion,criteriaVersion}`; the assess path computes `passed = command.selection === check.answerIndex` (line 158), derives the digest server-side (line 159) and creates the assessment doc at exactly `learningSessions/{sessionId}/assessments/{command.commandId}` with `{uid, sessionId, checkId, strategy, receiptId, digest, passed, at}` (lines 167-168) using a server `now()` timestamp. Every field and the path the projection reads match what that loop writes, including cancellation semantics (cancel voids the open check; recorded assessments remain immutable). This candidate requires that store and fails closed with 404 until it exists.
- **Atomicity and zero writes on refusal.** Receipt, projection, outbox and command documents are all written inside one `db.runTransaction`, with all reads before any write. Refusal paths (invalid command 400, missing session/receipt 404, tampered/foreign 503, scope/replay/model conflicts 409) throw before any write is queued, so the transaction aborts with nothing committed. The test asserts zero `/knowledge/` documents after foreign/missing/tampered refusals, and my probe reproduced zero knowledge documents after body-injection 400, tampered evidence 503 and cross-session evidence copy 503.
- **Anti-double-count and replay.** The receipt ledger `knowledge/receipts/{receiptId}` is keyed by the assessment `receiptId` and created with `tx.create` inside the same transaction. An identical command replays its stored projection with `replay:true`; the same command id with different references returns 409; the same receipt under a **fresh** command id replays the projection with no second receipt, projection or outbox write (probe F observed receipts=1, projections=1, outbox=1, commands=2 — the second command document is the new command's own idempotency receipt). Kernel `updateKnowledge` re-checks sequence, receipt identity, digest and model version, so the service cannot bypass ordering or replay rules.
- **Model change requires rebuild.** The stored projection carries `modelVersion`; `selectCalibratedModel` is re-selected from the session-stored scope on every projection and `updateKnowledge` throws `rebuild_required` (mapped to 409) when the stored model version differs, refusing to inherit the probability. The test tampers the stored `modelVersion` and asserts the 409 with no new receipt row.
- **Scope key and opaque references.** `scopeKey = 'u' + sha256(workspaceId|conceptId|sourceVersion|criteriaVersion)` derived from the session-stored scope; all four are bounded opaque references (≤256 chars, control characters rejected) with no fixed vocabulary. The old workspace enum is gone. Reads are owner-scoped under `visionary_accounts/{uid}`; the projection collection is per-UID.
- **Error mapping without leaks.** 400 invalid command/reference; 401/403 session/CSRF failures; 404 unknown session/receipt/projection; 409 scope/replay/model conflicts; 503 fixed-message redacted storage/verification failures (`stored()` converts non-HTTP errors to a generic 503). Test and probes confirm internal text ("credentials", the tampered value) never appears in refusal messages.
- **HTTP authority.** `KnowledgeProjectionController` extends `ProductRequestAuthority`: the POST command requires exact Origin + CSRF header/cookie before authority, then the device-bound session and `X-Visionary-Account`; the UID always comes from the authenticated session. Reads re-check the session and expected account with `touch:false`. Query parameters are bounded before use. HTTP test covers missing CSRF 403, account-change 409, injected verdict 400, foreign receipt 404, replay 200, owner-scoped projections read, 404 for an unprojected scope, and `/models` read-back without `pKnown`/mastery fields.
- **Calibration honesty.** `knowledge-calibration.ts` is a pure catalog selected server-side by exact source/criteria (`a2-calib-v1` for a2/rubric-a2, `doc03-reference-calib-v1` fallback `*/*`), each `license: 'reference'`, with `requireModelVersion` returning `rebuild_required` on a mismatch. No mastery threshold, `mastered` or `pKnown` field exists on a model; the test asserts their absence.
- **No over-claim.** Grep of the new sources, test and contract shows `mastery`/`taught`/`teacher`/`escalation`/`verified success` only in explicit negations or as assertions that fields are `undefined`. The contract states the result is "an estimate ... not a passed check, assessed mastery or taught flag"; the service and calibration comments repeat that a probability and its parameters are not an assessment. D-101 in DECISIONS/STATUS/QA repeats the same limits.
- **Surface registry honesty.** `product-surface-review.json` registers operation `knowledge-projection-calibration` (connected/server) with exactly the three endpoints `POST /api/account/learning/knowledge/project`, `GET /api/account/learning/knowledge/projections`, `GET /api/account/learning/knowledge/models`; the updated `product-surface.test.mjs` permits `/api/account/learning/` paths only inside separately reviewed connected/server operations and asserts the endpoint set equals the reviewed union exactly (green in the 532-test run). The learning-check-practice-progress entry now routes its learning gap to the separate enabler entries instead of claiming projections are missing. No frontend source is bound to these endpoints (routes/files empty), consistent with the declared open UI binding.
- **Pipeline chain.** Frontend → API: N/A for this slice — no UI or client calls these endpoints, and no frontend source file changed. API → backend: controller authority re-verified as above. Backend → data: owner-scoped Firestore documents, transactionally composed under `visionary_accounts/{uid}`. Jobs/ML and cache/observation: N/A — no queue, model or cache path is touched; the outbox event is storage for future sync, with no consumer. Device outcome: no real device or hosted run is claimed; loopback HTTP test only.
- **Credentials/secret hygiene.** The candidate diff contains no `.env`, tokens, private keys or service-account material (scanned). Tests use the fictional in-memory transactional fixture ("No Firebase SDK, credentials or network") and a stubbed authenticator; the only network calls are to a 127.0.0.1 loopback server in the HTTP test. No live provider, Admin initialization or database is contacted.

## Adversarial probes (reviewer-run, raw outcomes)

Probe script executed from the temp directory against the compiled candidate and the in-memory fixture (no repo file changed, no network beyond loopback): **14/14 passed**.

```text
PASS | command with injected correct/passed/digest/assessedAt/uid/origin/mastered -> 400 (each field separately)
PASS | body with correct/passed/digest/assessedAt -> 400 and zero knowledge documents | knowledgeDocs=0
PASS | tampered stored passed value -> 503 and zero knowledge documents | knowledgeDocs=0
PASS | assessment copied under another own session -> 503 and zero knowledge documents | knowledgeDocs=0
PASS | stored failed verdict projects correct:false with hand-computed posterior | pKnown=0.19616876818622694 expected=0.19616876818622694
PASS | new command id over an already-projected receipt replays without double count | assessedCount=1 receipts=1 projections=1 outbox=1 commands=2
PASS | reused command id with different reference -> 409; identical command replays byte-identically apart from the replay flag
OBSERVE | receipt re-referenced under a different own session id with a fresh command id | replay=true assessedCount=1
```

The failed-verdict probe re-derives the kernel posterior independently (`guess .25, slip .08, transit .15, initial .35`; denominator `0.35*0.08 + 0.65*0.75`) and matches the service result exactly; the backend test's hand-computed pass posterior (`0.7149122807017544`) is consistent with the same formula. The OBSERVE line is recorded as the minor replay-path note below.

## What was NOT verified

- Hosted Firestore rules, indexes, IAM and the real transaction path (including retry-on-conflict semantics of `tx.create` under genuine concurrency) — not run, not claimed. The in-memory fixture serializes transactions through a promise queue and enforces reads-before-writes plus create-exists semantics; it emulates serialized transactional behavior rather than real Firestore abort/retry cycles.
- Any live provider, model, credential or database: not available and not used; no `.env` or credentials were read.
- The SQL owning store, authoritative content/criteria service, calibration-set publication, UI binding, cross-device sync and a real two-device browser run: explicitly out of this task's scope and left open.
- Native Jira transitions/comments, dev integration and merge: not performed by this reviewer.
- The Vite build time recorded in the QA.md/receipt (15.91 s) differs from the reviewer's run (15.59 s); this is run-to-run variance, not evidence of a different artifact (dates, file list and results identical).

## Remaining defects, limitations and linked open gates

- **Minor (non-blocking) documentation wording:** `integration/KNOWLEDGE_PROJECTION_CONTRACT.md` (Storage section) says a re-referenced receipt returns `replay: true` "with the current projection and no writes". Measured behavior: a fresh command id adds exactly one `knowledge/commands/{commandId}` idempotency document so that command can itself replay later; the receipt, projection and outbox counts stay unchanged (probe F: commands 1→2, others 1). Recommend saying "no evidence writes / no change to the receipt, projection or outbox" at the next docs touch.
- **Minor (non-blocking) replay-path note:** the already-projected-receipt branch keys on the owner UID and the stored receipt ledger entry, takes the scope from that stored receipt, and does not re-check the command's sessionId against the evidence record (probe OBSERVE: a fresh command id referencing a projected receipt under a different own session id returns `replay: true`). There is no knowledge-state change, no new receipt/projection/outbox and no way to double-count; the first-pass path does enforce the session binding. Worth hardening only if the idempotency receipt's session reference later gains meaning.
- **Cross-branch integration coupling:** this candidate needs the LEARN-10 assessment store. LEARN-10's pending branch (KAN-146 at 83d2964b) also edits `firebase-product.module.ts` (its controller/service registration) and adds `teachingLoopState` to `teaching-policy.ts`; this branch adds only its own controller/service to the module and leaves `teaching-policy.ts` untouched. Merging both into dev therefore needs a trivial module conflict resolution carrying both registrations, and the D-100/D-101 append-only log ordering the receipt already anticipates. Any later change to LEARN-10's session/assessment document shape must re-verify this projection.
- **Residual storage-growth risk:** an authenticated client can add one small idempotency `knowledge/commands` document per fresh command id referencing valid evidence; no per-UID admission cap exists on this slice (the same retention pattern exists elsewhere in the account store). Hosted abuse/rate controls remain part of the hosted acceptance gate, not this local enabler.
- Open gates unchanged and listed in the contract, audit row and D-101: hosted Firestore/IAM acceptance, the SQL owning store, the authoritative content/criteria service, held-out calibration-set publication, the UI binding (`account-records-ui-binding`), cross-device sync (SYNC-01/SYNC-02) and a real two-device browser acceptance run; `account-directory` keeps learning unconnected until then.

## Reviewer decision

**Approved — verification passed** for the exact implementation `98ce3e5916e61b3c76a01b732f29d9b49b692af6` at base `9fd87bcee204f8a74b296112938e4fa7577d2ba7`, covering only the KAN-145 / LEARN-09 durable knowledge-projection scope above. The corrected reference-only evidence design is verified from source and by running the compiled candidate; no blocking defect was found. The two minor notes are non-blocking documentation/observation items. This approval does not complete hosted acceptance, dev integration, native Jira Done, or any linked open gate, and no production release is certified. Dev integration and Jira receipts remain for the integrator; any later source change invalidates this exact-SHA approval.

Verifier identity: independent_review_kan_145 (separate from implementer DeepSeek), 18 October 2026. Evidence as recorded above.
