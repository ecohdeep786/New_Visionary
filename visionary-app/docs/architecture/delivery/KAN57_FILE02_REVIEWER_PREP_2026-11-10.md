# KAN-57 / FILE-02 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/deepseek-kan-57-object-manifests` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits on the branch: corrections `021b107e`, stacked integration `1e5007ae` (merge of the corrected `codex/deepseek-kan-53-outbox-jobs` `dd520a57`, carrying accepted dev `2e0b1fbb` + the blob-verified data-04 fix; tsconfig include union; this branch's JOB-02-era lease/attempt tokens also moved to `randomUUID`), test-adaptation commit (runJob-based idempotency test → fenced-completion replay).

## Corrections

1. **Collected generations were mutable at the store**: `transition` applied any patch to a row with `collectedAt` set — once the sweeper detached a generation, `retain`/`release`/`commitReference` could resurrect a detached object behind the sweeper's back. `commitReference` and `retain` had service-level `collected` checks, but `release` (store.get + transition) and any future direct-transition caller had none. The store now refuses every non-collection patch on a collected row (`immutable`); the collection stamp remains the only permitted mutation — generations are immutable after detachment, not just after publication.
2. Layered test proving both enforcement layers: `retain` refuses `collected` at the service (`verifyReference`), `release` refuses `immutable` at the store, `commitReference` refuses `collected`.

## Review observations (verified, deliberately unchanged)

- The declared-vs-sniffed divergence on FILE-01 records is RECORDED, not enforced, at this lane (the reviewed FILE-01 test asserts a pdf-declared/text-plain-sniffed file goes READY); format admission belongs to FILE-04.
- `verifyReference → commitReference` is two-step by design; the in-memory enabler is single-threaded. The SQL adapter must make `transition` the atomic enforcement point (owner + state + collected + immutable-fields checks in one conditional UPDATE) so the verify/commit window cannot race a sweep.
- `nextGeneration` must be a per-object durable sequence in the adapter (two concurrent publishes must never mint the same generation).

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| File + job family suites | `node --test backend/tests/contracts/data-files/{upload,manifest}.test.mjs backend/tests/contracts/data-jobs/{outbox,jobs,admission}.test.mjs` (after `npx tsc -p tsconfig.data.json`, exit 0) | **44/44 pass** — manifests (immutable generations, verify-before-commit, commit-time re-verification, retention-aware collection, store-level post-collection immutability) + upload lifecycle + the full outbox battery |
| Data contracts | `npm run data:check` (disposable loopback PostgreSQL 16 on 127.0.0.1:5433 + Java 21 under `nv-tools/`) | **exit 0 — 315/315 across 11 suites**, incl. data-04 invitations 37/37 |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| data-04 fix | blob diff vs canonical `kan-124/b5771920` | **identical** |
