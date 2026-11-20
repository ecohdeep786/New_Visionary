# KAN-53 / JOB-01 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/deepseek-kan-53-outbox-jobs` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits on the branch: corrections `6af47b16`, dev integration `0e94dd12` (merge of `2e0b1fbb`; resolves `tsconfig.data.json` by union — dev's admission/concurrency/data/consent/file/commands/overview includes + the outbox entries), data-04 rolling-clock fix `0d41272d`… (the byte-identical data-04 file rode the merge's index during conflict resolution — HEAD's `backend/tests/contracts/data-04/invitations.test.mjs` is byte-identical to the canonical fix `kan-124/b5771920`, verified by diff).

## Corrections (all in the outbox slice)

1. **The exponential backoff was cosmetic**: `pendingOutbox` never honored `nextAttemptAt`, so a claimed-but-unacked row was immediately re-claimable — the documented "stays claimable by nextAttemptAt" contract had no effect. The store now returns only due rows (absent or past `nextAttemptAt`), with a contract test driving a future-dated row (skipped) and a due row (claimed, delivered).
2. **Coherent crash-recovery**: an ack failure now clears the row's `nextAttemptAt` (best-effort) so recovery re-delivers on the next poll instead of waiting out a backoff that belongs to a real action failure — the recovery and quarantine tests keep passing on exactly that path.
3. **Claim failures are no longer swallowed**: `mark()`'s catch made a lost claim indistinguishable from a durable one and could ack a row whose attempts never bumped (poisoned-row hot-retry hazard). Store errors now propagate; the row stays PENDING for the next poll; a vanished row still refuses with `unknown_event`.
4. **`runJob` refuses terminal states** (DONE/FAILED/CANCELLED): the docstring claimed idempotent execution, but a DONE job re-entered executed again. A no-op test pins the second-run behavior and completion timestamp.
5. **Enqueue ids use `randomUUID`** (the `Date.now()+Math.random` id could collide in the store map).

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Outbox suite (JOB-01's own acceptance) | `node --test backend/tests/contracts/data-jobs/outbox.test.mjs` (after `npx tsc -p tsconfig.data.json`, exit 0) | **10/10 pass** (8 original incl. crash-recovery/quarantine/fencing + 2 new contract tests) |
| Data contracts | `npm run data:check` (disposable loopback PostgreSQL 16 on 127.0.0.1:5433 + Java 21 under `nv-tools/`) | **exit 0 — 315/315 across 11 suites**, incl. data-04 invitations 37/37 |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Notes for the reviewer

- The dispatcher/store remain the owning-store enabler over the DATA-01 `outbox_events` shape; the Cloud SQL adapter "implements the same surface" — the `nextAttemptAt` due-filter law now lives in the shared contract, so any SQL adapter must implement it too (`WHERE status='PENDING' AND (next_attempt_at IS NULL OR next_attempt_at <= now)`).
- Real hosted delivery (the private authenticated task delivery slice against live infrastructure) stays founder-gated as originally recorded; this pass adds no claim there.
