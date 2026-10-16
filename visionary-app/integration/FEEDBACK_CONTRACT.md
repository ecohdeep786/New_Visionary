# Account feedback v1

16 October 2026 · D-082 · implemented local slice; hosted acceptance remains open.

The shared dashboard footer offers **Share feedback** without opening a modal, interrupting an activity or requiring a response. Every connected account role can send a rating with an optional note. English, Hindi and Bengali controls are included. This is product feedback, not a support case, emergency channel, model correctness label or consent to model training.

## Authority and storage

The existing product NestJS entrypoint imports `FeedbackController` and `FeedbackService`. Every request re-verifies the device-bound server session and `X-Visionary-Account`. POST also requires the existing same-origin Origin/CSRF protection. The server derives UID from authentication; a caller cannot set UID, role, workspace, email or resource identifiers in the body.

```text
visionary_accounts/{verifiedFirebaseUid}
  identity / profile / onboarding / billing / devices  (existing)
  feedback/{commandId}                               (new immutable submission)
    version, commandId, uid, surface, rating, comment, locale
    status: submitted, createdAt: server ISO timestamp
    fingerprint: internal canonical-command SHA-256
  feedbackState/admission                            (server-only mutable counter)
    uid, hour: server UTC hour bucket, count
```

Feedback is account-level Firestore data; it does not introduce workspace/domain authority or a second SQL account. Server-side owner listing makes saved notes available from another authenticated device. The UI presently displays the submission receipt; feedback-history UI and authorized staff triage are separate work. The prepared Firestore rules deny direct browser reads/writes; real deployment of those rules/IAM remains an existing acceptance gate. Do not add TTL or purge current data.

## HTTP contract

`POST /api/account/feedback` accepts exactly these fields:

```json
{
  "version": 1,
  "commandId": "14b64604-51ee-489d-92ab-5cf8c70413f1",
  "surface": "learn",
  "rating": "needs_improvement",
  "comment": "The next step was unclear.",
  "locale": "en"
}
```

`commandId` is a lowercase UUIDv4. `surface` is one of general/learn/ask/guide/build/classroom/billing/account, a non-authoritative section label. Rating is good/needs_improvement. Locale is en/hi/bn. Comment is optional, trimmed and bounded to 1000 UTF-16 code units before trimming; newlines/tabs are allowed, other ASCII control characters are rejected. Unknown fields are rejected. Existing normal JSON ingress stays bounded at 24 KiB. Raw routes, query strings, IDs, conversations, drafts, attachments, cookies, IPs and payment details are never automatically collected by this feature. User-authored notes can contain personal information; the interface asks users to leave it out. This is minimization, not a claim of automatic PII removal.

Successful creation **and exact replay** return HTTP201 with `{version:1, uid, id, status:"submitted", createdAt}`. A Firestore transaction commits the immutable record and per-account admission counter together. Exact retries return the original receipt before checking the rate cap. Reusing the ID with different canonical content returns409. Parallel API instances share a maximum of10 new submissions per UID per server UTC hour, with429 after that; different UIDs are independent. This is a fixed hourly bucket, not a rolling window or full ingress-abuse protection.

`GET /api/account/feedback?limit=20&after=<last-id>` requires session/expected-account authority, returns `{version:1, uid, items, nextCursor}` and only that account's records. Limit is1–50. Cursor is UUIDv4; ordering is document-ID order, **not chronological order**. Items contain receipt fields plus surface/rating/comment/locale; internal fingerprints/counters are excluded. No staff, guardian, teacher, employer or Family-payer read permission is granted.

Errors:400 malformed command/page;401 missing/expired/revoked session;403 Origin/CSRF failure;409 changed account or mismatched replay;429 hourly admission;503 storage/receipt unavailable. Backend storage failures are redacted and never reported as successful delivery. Existing Nest error envelopes remain compatible with the shared browser auth transport.

## Browser recovery

The frontend sends only after explicit Send, using the current verified Firebase profile and shared CSRF transport. Safe receipt validation checks version, UID, command ID, submitted status and timestamp. Account change checks run before sending and after receiving. No local-preview submission is presented as server success.

While sending, double submission and editing are disabled. On an ambiguous failure, preserve the exact command/ID and note in component memory and offer explicit Retry; this recovers a committed-but-lost receipt. Do not automatically repeat mutations. A deliberate Close, workspace/account change, page reload or unmount discards the unsent local form; it does not retract a possibly saved submission. Ordinary section navigation retains the opened form's original section. Notes are not placed in browser persistent storage, telemetry, Jira or prompts. Success appears only after a validated receipt.

## Verification and remaining gates

`backend/tests/feedback.test.cjs` exercises schema rejection, concurrent deduplication across service instances, lost commit response, changed-payload conflict, hourly cap, cross-user independence, real loopback HTTP session/CSRF/account/pagination denial and redacted database failure. `frontend/tests/feedback.test.mjs` exercises receipt/account binding, transport retries and minimized section/locale behavior. These isolated tests use fictional data and no live credentials or provider.

The isolated browser fixture (`backend/tests/feedback-browser-server.cjs` plus `frontend/tests/browser/feedback.html`) confirms real-controller commit → lost receipt → retained note → explicit retry → one stored submission, close/reopen keyboard focus and English/Hindi/Bengali rendering. It binds loopback3036/5176 with an explicit demo development guard and fictional identity/memory data; it is not a production sign-in bypass or hosted Firestore proof.

Hosted Firestore transaction/IAM/device acceptance, full-product real-device/accessibility acceptance, privacy disclosures/purpose/retention approval, account export integration, operational triage, scoped staff access/audit and support-response policy remain open under PRIV-01/02/05/06/07 and ACCEPT-01/03/05. Existing legacy ML feedback collection is disconnected and is not reused. Submission does not automatically create an external Jira issue or send private learner text to a model.
