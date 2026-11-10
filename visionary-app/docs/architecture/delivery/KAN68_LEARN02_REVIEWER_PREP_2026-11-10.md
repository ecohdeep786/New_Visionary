# KAN-68 / LEARN-02 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-68-attempt-persistence` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections `7743cf98`, stack integration `5f83fe19` (merge of dev `2e0b1fbb`; package.json scripts unioned — privacycore/data/ingestion/publication/catalogadapter/retrievalgate/coverage/mediagate/attempts checks all live), data-04 rolling-clock fix `81787e00` (byte-identical).

## Correction — attempt-number double-allocation closed

The attempt number derived from a stale `attemptsFor` count then inserted: two concurrent different submissions for the same check could share an `attemptNo`, breaking the immutable per-check numbering law. The store gains `recordAttempt` (atomic: an unseen submissionId is required and the number is allocated from the CURRENT accepted count, with the attempt row and the append-only history entry inserted together; a committed submissionId is a duplicate). The service maps a lost race to the idempotent `duplicate` outcome. SQL adapter law: one `INSERT … SELECT` with the count computed inside the statement's transaction.

## Review finding (verified, no further defect)

Server-side eligibility precedes any persistence (session ownership, released revision, check-exists — a denial records nothing and consumes no number); deduplication by client submission id; privacy refusals precede writes; rubric/evidence references preserved verbatim; append-only history never rewritten.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Attempt suite (LEARN-02's own acceptance) | `node --test backend/tests/contracts/attempts/attempt-persistence.test.mjs` (after `npx tsc -p tsconfig.attempts.json`, exit 0) | **6/6 pass** |
| Registered gate | `npm run attempts:check` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Notes for the reviewer

- The store is the in-memory reference; the SQL adapter must implement `recordAttempt` atomically (see the interface comment).
- Hosted attempt persistence at scale stays founder-gated as originally recorded.
