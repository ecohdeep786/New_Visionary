# KAN-55 / JOB-03 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/deepseek-kan-55-admission-limits` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits on the branch: corrections `82e54190`, stacked integration `3dc9a412` (merge of the corrected `codex/deepseek-kan-53-outbox-jobs` `dd520a57`, carrying accepted dev `2e0b1fbb` + the blob-verified data-04 fix), test adaptation commit (runJob-based idempotency test → fenced-completion replay).

## Corrections

1. **The KAN-53/54 JOB-01+02 laws carried into the admission tree** (byte-identical shared hunks so the reviewer's 53→54→55 order auto-resolves): `pendingOutbox` due-filter, propagating claim failures, ack-failure clears `nextAttemptAt`, `randomUUID` job/lease/attempt tokens.
2. **`recordEvent` returned a cursor that replay could not honor**: it minted the cursor from an in-memory instance counter and returned the LOCAL event, while the store's `appendJobEvent` assigns the authoritative durable per-job cursor and returns the stored event. `recordEvent` now returns the STORE's response; the dead instance counter is removed. Replay/refetch semantics (`events strictly after afterCursor`) are now actually backed by the cursors callers receive.
3. **Merge resolutions**: the header comment keeps both JOB-02 and JOB-03 addition blocks; the runJob delete-vs-modify resolved for the JOB-02 model (claim/startRun/complete), and the auto-merged runJob-based idempotency test was adapted to the fenced-completion replay — the same law, executable on this tree.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Data-jobs suites (JOB-01+02+03 acceptance) | `node --test backend/tests/contracts/data-jobs/outbox.test.mjs backend/tests/contracts/data-jobs/jobs.test.mjs backend/tests/contracts/data-jobs/admission.test.mjs` (after `npx tsc -p tsconfig.data.json`, exit 0) | **26/26 pass** — admission limits (per-user / per-workspace / fleet refusals), provider budgets, queue fairness (cursor-ordered across workloads), durable JobEvents with replay/refetch, plus the full JOB-01/02 battery |
| Data contracts | `npm run data:check` (disposable loopback PostgreSQL 16 on 127.0.0.1:5433 + Java 21 under `nv-tools/`) | **exit 0 — 315/315 across 11 suites**, incl. data-04 invitations 37/37 |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| data-04 fix | blob diff vs canonical `kan-124/b5771920` | **identical** |

## Live product check (2026-11-10)

The integrated product re-verified live in the browser (`/pricing` renders the full plan table with the free CTA present) — the standing real-user journey evidence (pricing → register → email step → auth guards with `returnTo`, captured on KAN-54) applies to this slice's integrated product. Admission limits are a backend enabler with no separate UI surface; their real-execution acceptance is the 26/26 suite over the real composition, and hosted fleet-scale verification stays founder-gated as originally recorded.

## Notes for the reviewer

- The SQL adapter must implement the shared contract's newest members: `liveJobCounts`, `providerBudget`/`commitProviderExecution`, and the JobEvent store with **store-assigned durable per-job cursors** (`appendJobEvent` returns the stored event — callers must never mint cursors locally).
- Enqueue-path admission errors surface as typed `JobPolicyError` codes (`admission_per_user` / `admission_per_workspace` / `admission_fleet` / `provider_budget`) so API layers can map them to honest 4xx/429 responses.
