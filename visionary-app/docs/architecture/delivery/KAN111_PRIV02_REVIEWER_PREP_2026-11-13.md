# KAN-111 / PRIV-02 — reviewer-corrector pass (2026-11-13)

Branch `codex/principal-kan-111-privacy-export` @ 60d2425c (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — one REAL concurrency defect, corrected

The PRIV-02 lifecycle-job law (stop-new-work-first, five-store sweep, honest reconciliation, owner-only inspection) reviewed sound, EXCEPT the idempotency claim: the service checked `byJobId` (saved receipts only) and THEN froze — a window in which **two concurrent `runJob` calls for the same jobId both missed the receipt, both froze the owner, and both swept all five stores → double deletion** (the recurring stale-read-then-write class; the family test only covered the SEQUENTIAL retry, which passes by reading the committed receipt).

**Correction (the atomic-write law, 17th proof):**
- `claimJob(jobId, owner, kind)` added to the `PrivacyJobStore` seam as a **conditional create** (the SQL `INSERT … ON CONFLICT DO NOTHING` law at integration): exactly ONE concurrent run of the same jobId wins; every later claim is false.
- `runJob` claims ATOMICALLY **before any store is touched**; the loser returns an honest `pending` receipt (`complete: false, stores: [], pending: true`) — it never freezes and never sweeps; when the winner has committed, the loser's retry converges to the winner's receipt.
- New test proves: claim semantics (first wins / duplicates lose / a different owner cannot re-claim), the in-flight loser path (pending marker, no freeze, no stores), retry convergence, and that a fresh unclaimed job still runs normally. Suite **6/6**.

## Superseded-variant cleanup (same as KAN-110)

The merge with `origin/dev` resolved the add/add `privacycore` conflicts to **dev's approved baseline** (owner-approved digest-pinned manifest + controller + store, merged via PR #38) and removed this branch's stacked superseded KAN-110 variant (`privacy-core-lookups.ts`, `index.ts`, its own `privacy-core.test.mjs`). The branch's OWN KAN-111 payload — the `privacyjobs` package (types/lookups/service + `tsconfig.privacyjobs.json` + family test) — is genuinely new in dev and is kept.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| Privacyjobs suite (incl. the new atomic-claim test) | `node --test backend/tests/contracts/privacyjobs/privacy-jobs.test.mjs` | **6/6 pass** |
| Backend compile (nest) + privacyjobs tsconfig compile | `npm run build` + `tsc -p tsconfig.privacyjobs.json` | **exit 0** |
| Privacycore suite (KAN-110 baseline intact) | `node scripts/provision-check.mjs --suite privacycore` | **52/52 pass** (manifest copied to dist — nest build omits JSON assets, harness law) |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live journey

PRIV-02's surfaces (export/deletion jobs) are owner-authenticated server jobs — no public UI mounts them; the owner-facing privacy screen is credential-gated (founder-gated). The lifecycle law is proven by the 6/6 family suite + the 52-check privacycore control-plane over the pinned Firestore emulator and real HTTP composition.

## Notes for the reviewer

- The REAL five-store integration implements `PrivacyJobStore` — `claimJob` must be a conditional insert (unique jobId), not a check-then-insert; the contract test pins the semantics.
- Merge order: KAN-110's privacycore baseline is already in dev; this branch adds ONLY the privacyjobs package + the corrections above.
