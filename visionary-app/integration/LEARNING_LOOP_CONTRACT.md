# Durable teaching loop v1

18 October 2026 · KAN-146 / LEARN-10 · implemented local slice; hosted acceptance remains open.

The signed-in Learn journey can now keep its comprehension checks on the owner's server account instead of only in browser storage. One authored check at a time is presented, the server scores the learner's selection against the answer key it stored, and a lost response replays the identical command instead of double-recording. The local-only journey for signed-out visitors, and every existing stage, draft, attempt and language behaviour, is unchanged.

## Authority and storage

The product NestJS entrypoint imports `LearningController` and `LearningService`. Reads re-verify the device-bound server session and `X-Visionary-Account`; commands also require the existing same-origin Origin/CSRF protection. The server derives UID from authentication; callers cannot set UID, role, workspace beyond the pinned scope echoes, or invent trusted assessment fields.

```text
visionary_accounts/{verifiedFirebaseUid}
  learningSessions/{sessionId}                 (serverUUIDv4 document id)
    uid, workspaceId, concept {conceptId, provider, sourceId, sourceVersion, criteriaVersion}
    status: active | cancelled, createdAt, cancelledAt, updatedAt
    loop: { phase, revision, failedChecks, maxFailedChecks, previousStrategy, ... }
    check: { checkId, prompt, optionCount, answerIndex, strategy }   (server-only)
  learningCommands/{commandId}                 (immutable idempotency receipt)
    uid, commandId, kind: start|present|assess|cancel, fingerprint, sessionId, receipt, createdAt
  learningSessions/{sessionId}/assessments/{receiptId}
    uid, sessionId, checkId, strategy, receiptId, digest, passed, at
```

Session documents are Firestore-account data, not a second SQL account and not workspace/domain authority. Every response is a projection: it excludes the stored prompt, option text and answer key, and exposes only `checkId`, `strategy` and `optionCount`. Direct browser reads/writes to these collections are not part of this slice; Firestore rules/IAM deployment remains a hosted gate.

## HTTP contract

All routes are under `/api/account/learning` and re-check session plus expected account. `commandId` is a lowercase UUIDv4. `sessionId` is a server UUIDv4.

- `POST /sessions` — start. Body: `{version:1, commandId, workspaceId, conceptId, sourceVersion, criteriaVersion, provider, sourceId, maxFailedChecks?: 1..3}`. Creates the session and its `start` receipt in one transaction.
- `GET /sessions?workspaceId&after&limit=1..50` — owner listing, document-ID order, `{version:1, uid, items, nextCursor}`.
- `GET /sessions/:sessionId` — current receipt; used for reconnect read-back.
- `POST /sessions/:sessionId/checks` — present one authored check. Body: `{version:1, commandId, expectedRevision, workspaceId, sourceVersion, criteriaVersion, strategy, validation:"passed", checkId, prompt, options, answerIndex}`. The server stores the authored check and records it with the kernel; only one check is open at a time.
- `POST /sessions/:sessionId/assessments` — answer. Body: `{version:1, commandId, expectedRevision, workspaceId, sourceVersion, criteriaVersion, checkId, selection}`. The server scores `selection` against its stored `answerIndex` and returns `receipt:{id, checkId, passed}`. No client correctness flag, model reply or elapsed time creates evidence; `receipt.id` is the `commandId` that the browser persists.
- `POST /sessions/:sessionId/cancel` — explicit learner cancellation; recorded attempts are never deleted.

Exact command replay returns the original stored receipt (HTTP 200) only for the same operation, route session and canonical body. Both the fingerprint and stored receipt/session identity must agree; cross-session reuse returns409 without writes. Reusing a `commandId` with different canonical content returns409. A different `workspaceId`, `sourceVersion` or `criteriaVersion` than the session echoes returns 409. A stale `expectedRevision` returns 409. Errors map to 400 invalid command/session reference, 401/403 session/CSRF failure, 404 unknown session, 409 conflict/closed session and 503 redacted storage/verification failure; storage failures are never reported as success.

## Kernel bounds

`teaching-policy.ts` keeps the bounded loop: `maxFailedChecks` is 1–3 (the product uses 3), each failed check requires a different teaching strategy before another check may be presented, `review_suggested` stops new checks, and `check_passed` is a presented-check outcome, not a mastery claim. `teachingLoopState` re-validates stored state fail-closed; corrupted state produces 503, never an invented pass.

## Browser behaviour

`frontend/src/services/learningSessionClient.js` wraps the shared auth transport (`basePath:/api/account/learning`) and re-validates every receipt: version, UID, workspace, phase, strategy whitelist, revision/failed-check bounds, check shape, bounded option count and a refusal of any payload that could carry `answerIndex`. Account-change checks run before sending and after receiving; check refusals return a truthful 503-style confirmation error, and a changed account returns 409.

`learningPipelineService.ts` gains the `configureLearningSessionAdapter` seam (unconfigured units keep the exact previous local behaviour). The durable branch persists the pending `start`/`present`/`assess` `commandId` before the network call and reuses it on retry, so a committed-but-lost response is recovered with the same identity. Failures keep the saved draft and the question, record no grade and surface the truthful error; the next retry (or an explicit `resumeLearningSession` read-back) reconciles with the server revision. After three failed server checks the unit shows the bounded review suggestion and refuses to start another check automatically. `cancelLearningSession` closes the session and voids its open check; an explicit new check opens a fresh session without erasing recorded attempts. A changed question identity from a language switch discards only the unusable durable linkage. `LearningWorkspace.jsx` configures the adapter only for a signed-in Firebase account and clears it on unmount; signed-out and unconfigured sessions stay browser-local and unverified.

## Verification and remaining gates

`backend/tests/learning-loop.test.cjs` (11 tests) exercises command schema rejection, scope/revision conflicts, fingerprint replay, cross-user isolation, answer-key projection, outage mapping and the bounded stop. `frontend/tests/learning-session-client.test.mjs` (6 tests) covers route building, receipt/account validation, key leakage refusal and invalid references; `frontend/tests/learning-durable-session.test.mjs` (10 tests) covers scope echoes, server verdict authority, lost-commit replay, retained drafts, strategy rotation, the three-failure stop, cancellation/restart and the unconfigured local fallback. These use fictional fixtures, an in-memory transactional store and no live credentials or provider.

Hosted Firestore transaction/IAM/device acceptance, the SQL owning store, the authoritative content/criteria service and calibration, cross-device learning sync and a hosted run of this loop remain open under LEARN-08/LEARN-09/SYNC-01/SYNC-02 and the linked platform work; `account-directory` keeps learning unconnected until then. Automatic UI resume and multi-device conflict presentation are deliberately not implemented in this slice. No teacher contact, automatic escalation, taught/mastered flag or unverified success is introduced; the bounded review suggestion is an interface prompt, not a delivery mechanism.


20 October replay repair: present/assess/cancel fingerprints hash an unambiguous JSON tuple of operation, route sessionId and canonical command. Replayed rows verify the stored UID/session and receipt identity. The connected client validates every routed session, command workspace, and exact assessment command/check IDs; the pipeline repeats session/workspace/command/check checks before applying a verdict or revision. Mismatches retain the pending identity/draft and create no local grade. Existing older fingerprints are not silently reused: unresolved legacy commands conflict and require explicit saved-activity recovery; no original record is deleted. Full authoritative source/criteria acceptance remains KAN-74: this local enabler still accepts authored check material through the existing bounded presentation contract and must not be released as protected production assessment authority.
