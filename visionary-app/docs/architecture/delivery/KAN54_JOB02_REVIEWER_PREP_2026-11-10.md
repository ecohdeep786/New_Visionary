# KAN-54 / JOB-02 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/deepseek-kan-54-job-fencing` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits on the branch: corrections `2f87c503`, stacked integration `1e5daa0e` (merge of the corrected `codex/deepseek-kan-53-outbox-jobs` `dd520a57`, which carries accepted dev `2e0b1fbb` + the byte-identical data-04 fix, blob-verified at HEAD).

## Corrections

1. **The KAN-53 JOB-01 laws carried into the JOB-02 tree, byte-identically** (commit `2f87c503`): `pendingOutbox` due-filter, propagating claim failures, ack-failure clears `nextAttemptAt`, `randomUUID` job ids. This branch's JOB-01 block had been written from the PRE-correction code, so without this the reviewer's 53→54 merge order would have silently regressed the outbox contract.
2. **Lease/attempt token entropy**: `lease_${randomUUID()}` / `attempt_${id}_${randomUUID()}` — the `Date.now()+Math.random` token shape had the same collision class as the old job ids, and a token collision is a fencing break, not just a map overwrite.
3. **Merge resolution (`1e5daa0e`)**: the delete-vs-modify conflict on the old `runJob` resolved in favor of the JOB-02 model (claim→startRun→complete supersedes runJob); 53's terminal-guard intent is preserved by `complete()`'s idempotent DONE check (`fresh?.state === 'DONE'` returns the row untouched). 53's runJob-based idempotency test was rewritten as the fenced-completion replay test: claim → complete → complete again preserves the FIRST `completedAt` and never re-executes.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Data-jobs suites (JOB-01 + JOB-02 acceptance) | `node --test backend/tests/contracts/data-jobs/outbox.test.mjs backend/tests/contracts/data-jobs/jobs.test.mjs` (after `npx tsc -p tsconfig.data.json`, exit 0) | **19/19 pass** — leases, fencing (stale holder refused), deadlines (runBy hard stop via sweeper), cancellation fencing, bounded cleanup quarantine, crash recovery, quarantine, backoff gating, idempotent completion replay |
| Data contracts | `npm run data:check` (disposable loopback PostgreSQL 16 on 127.0.0.1:5433 + Java 21 under `nv-tools/`) | **exit 0 — 315/315 across 11 suites**, incl. data-04 invitations 37/37 |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| data-04 fix | blob diff vs canonical `kan-124/b5771920` | **identical** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-10)

The integrated product that carries this slice was driven as a real user in the live browser:

1. `/pricing` renders the full plan table (Start ₹0 / Personal ₹249 / Family ₹415, billing toggle, feature matrix) — `Pricing | Visionary`.
2. **Start for free** CTA navigates to `/register?plan=start` — "Create a Visionary account" with exactly the three reviewed methods (Email / phone / Google), matching the session audit's live `/api/auth/methods` verification.
3. **Continue with Email** renders the focused email-entry step (screenshot captured).
4. Anonymous `/dashboard` and `/dashboard/subscription?plan=personal&billing=annual` render the sign-in guard with `returnTo` preserving the deep link and plan intent, and truthful checkout copy ("Payment starts only after you review the amount and confirm secure checkout").
5. The journey stops at the credential step by design: creating a real account writes to production auth and requires real email/phone verification delivery — founder-gated, consistent with every handoff in this lane.

## Notes for the reviewer

- The SQL adapter must implement the full shared contract: the `nextAttemptAt` due-filter (JOB-01) AND the fenced `transition` (state set + lease token) — both are now enforced in the in-memory reference implementation the adapters mirror.
- Real hosted delivery of jobs against live infrastructure stays founder-gated as originally recorded.
