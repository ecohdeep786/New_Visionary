# Evidence-backed knowledge projections v1

18 October 2026 · KAN-145 / LEARN-09 · implemented local slice; hosted acceptance remains open.

The signed-in owner can turn immutable server-assessed learning receipts into one account-scoped knowledge estimate. The estimate is computed by the product-owned policy kernel with calibrated parameters selected by source/criteria scope; it is an estimate with inspectable evidence, not a passed check, assessed mastery or taught flag. This slice is the durable server counterpart of the local mentor estimate; no UI binds it yet and the existing Learn/Practice/stage journeys are unchanged.

## Evidence authority

The only accepted evidence source is the durable learning store written by the LEARN-10 teaching loop: `learningSessions/{sessionId}/assessments/{receiptId}` with `{uid, sessionId, checkId, strategy, receiptId, digest, passed, at}`. A projection command references that immutable record; the projection service reads the verdict (`passed`), digest and timestamp (`at`) from the stored assessment itself. A command that carries `correct`, `passed`, `digest`, `assessedAt`, `uid` or any other verdict-adjacent field is rejected with 400, and no browser flag, model reply or elapsed time can create evidence.

Because the evidence store is the LEARN-10 store, this slice must be integrated with (or after) the LEARN-10 durable loop. Until that store exists in a runtime, projection commands fail closed with 404 for missing sessions/receipts; nothing is invented. Cancelling a learning session voids only its open check: assessments it already recorded remain valid, immutable evidence.

## Storage

```text
visionary_accounts/{verifiedFirebaseUid}
  learningSessions/{sessionId}/assessments/{receiptId}    (immutable evidence source; written by the teaching loop)
  knowledgeCommands/{commandId}        (immutable idempotency receipt: fingerprint, sessionId, receiptId, projectionKey)
  knowledgeReceipts/{receiptId}        (kernel receipt: scope, digest, sequence, correct, origin: server_assessment, assessedAt)
  knowledgeProjections/{scopeKey}      (pKnown, modelVersion, revision, lastSequence, lastReceiptId/Digest, assessedCount)
  knowledgeOutbox/{eventId}            (one knowledge_projected event per receipt)
```

`scopeKey` is `u` plus a SHA-256 of the JSON-serialized ordered array `[workspaceId, conceptId, sourceVersion, criteriaVersion]`; workspace and concept values are opaque bounded references (for example `demo-adult:student`), never a fixed vocabulary. The receipt ledger is keyed by the assessment `receiptId`, so the same evidence cannot be counted twice even under a new command id; a re-referenced receipt returns `replay: true` with the current exact-scope projection and no receipt/projection/outbox writes; a new command ID adds its own idempotency record. Replay checks the stored session and receipt identity as well as every scope field. Receipt, projection and outbox event commit in one transaction; a stored projection whose recorded model version differs from the server-selected model refuses to inherit its probability and returns 409 until evidence is replayed.

## HTTP contract

All routes are under `/api/account/learning/knowledge` and re-check the device-bound server session and `X-Visionary-Account`; commands also require the existing same-origin Origin/CSRF protection.

- `POST /project` — body `{version:1, commandId, sessionId, receiptId}` (lowercase UUIDv4 references). Loads the owner session and the immutable assessment, selects the calibrated model, and commits receipt/projection/outbox. Returns 200 with the projection receipt; `replay` distinguishes an original commit from an idempotent replay. An identical command replays; the same command with different references returns 409.
- `GET /projections?workspaceId&conceptId&sourceVersion&criteriaVersion` — the owner's projection for one exact scope, or 404 when nothing is projected yet.
- `GET /models?sourceVersion&criteriaVersion` — the server-selected model `{version, guess, slip, transit, license, initial, requires}`. No `pKnown` or mastery label is attached: parameters are not an assessment of the learner.

Responses exclude the authored prompt, answer key and learner selection. Errors map to 400 invalid command/reference, 401/403 session/CSRF failure, 404 unknown session/receipt/scope, 409 scope/replay conflict or model rebuild, and 503 redacted storage/verification failure; storage failures are never reported as success.

## Calibration

`knowledge-calibration.ts` is a pure catalog selected by exact scope: `a2-calib-v1` for `sourceVersion a2`/`criteriaVersion rubric-a2`, and the `doc03-reference-calib-v1` fallback (`*/*`). These are internal reference parameters (`license: reference`); held-out calibration publication remains an open gate, and no mastery threshold is published. `requireModelVersion` returns `rebuild_required` when a requested model differs from the selected one, and the service enforces the same rule against stored projections.

## Verification and remaining gates

`backend/tests/knowledge-projection.test.cjs` (8 tests) covers the command contract (injected verdict fields rejected), calibration selection and rebuild, a hand-computed BKT projection from the stored verdict, refusal of foreign/missing/tampered evidence with zero invented records, concurrent identical commits (one receipt/projection/outbox), re-referenced evidence replay (no double-count), cancelled-session evidence, lost-commit redaction and retry, cross-device reads, model-change rebuild refusal and the HTTP session/CSRF/account/scope denials. The fixtures are fictional, use the in-memory transactional store and touch no live credential, provider or database.

Hosted Firestore transaction/IAM acceptance, the SQL owning store, the authoritative content/criteria service, held-out calibration publication, the UI binding (`account-records-ui-binding`), cross-device sync and a real two-device browser run remain open under LEARN-08/LEARN-09/LEARN-10/SYNC-01/SYNC-02 and the linked platform work; `account-directory` keeps learning unconnected until then. Knowledge probability stays an estimate: no taught/mastered flag, teacher contact, automatic escalation or verified-success claim is introduced.


20 October storage correction: the four knowledge collections are direct subcollections of the verified UID document, so their collection paths have three components and document paths four. Earlier four-component collection strings were invalid in the actual Firestore SDK and are not used as a fallback. Delimiter-based old keys are never read or silently inherited. This unreleased candidate has no accepted hosted learner records; if an alternative earlier deployment persisted data, require an explicit owner audit/rebuild from immutable assessments before rollout, without deleting originals. The HTTP response version remains1.
