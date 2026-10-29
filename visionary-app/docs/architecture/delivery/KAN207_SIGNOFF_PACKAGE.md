# KAN-207 — VMM-R0 — founder signoff package

Purpose: let the acceptance owner execute the R0 gate in one sitting. Everything below is verifiable with the commands shown; nothing requires trust in the implementer's claims.

Candidate: branch `codex/principal-kan-207-research-gate` (research-gate deliverable at `8a4e5e16`; docs-only additions after that SHA are listed at the end).
Handoff: `docs/architecture/delivery/KAN207_RESEARCH_GATE_REVIEW.md` on the branch.

## 1. Verify in minutes (from the worktree root, `visionary-app/`)

```powershell
npm run researchgate:check        # 6 tests, 0 fail — manifest/matrix/plan invariants + deny negatives
node ml/vats/research-gate/smoke.mjs   # passes; writes evidence with exact git HEAD to
                                  # artifacts/research/private/gate-evidence/research-smoke-evidence.json
```

Then read the three frozen artifacts (~10 minutes):
- `ml/vats/research-gate/manifest.json` — reviewer role slots (signatories intentionally pending = these signatures), CPU-only bounded environment, private artifact locations (`artifacts/research/private/*`, gitignored), license policy (authored | rights_cleared only), `trainedOwnedWeights: false`.
- `ml/vats/research-gate/capability-matrix.json` — 5 roles × 4 modes, required en-IN/hi/bn, 4 explicit unqualified OCR slices, both first reference journeys, claims ledger (bounded claimed set; explicit notClaimed set; KAN-172 deferral).
- `ml/vats/research-gate/measurement-plan.json` — fixed research task + primary metric; label taxonomy separation; engineering acceptance as PROPOSALS; independent hidden-data custodian; KAN-172 owns dataset-specific numerics.

## 2. Ready-to-sign statements (fill name + date; the founder may hold all three roles or delegate)

**Model reviewer**
> I reviewed the VMM-R0 manifest at commit `<SHA>` and accept the Tiny-D1 research task, the bounded compute plan (CPU-only, no paid capacity) and the checkpoint inventory honesty (`trainedOwnedWeights: false`). Signed: ____________  Date: ______

**Data reviewer**
> I reviewed the data license policy, the private artifact inventory and the deny-suite coverage (D1–D7) at commit `<SHA>` and accept that no protected records are exported and no public-availability source is used as a training license. Signed: ____________  Date: ______

**Evaluation reviewer**
> I reviewed the measurement plan at commit `<SHA>` and accept the label taxonomy separation, the proposal status of the engineering acceptance bounds, the independent hidden-data custodian rule, and the KAN-172 deferral of dataset-specific numerics. Signed: ____________  Date: ______

## 3. Decision record (pick one; record in this ticket)

- **A — Accept R0 as frozen**: record the three signoffs; the gate closes and KAN-170/171/173/174/175/193 become startable (respecting their native blockers). R0's own boundary stands: no production-data access, no hosted-serving or release claims; KAN-169 retains all product-integration gates.
- **B — Accept with recorded changes**: list the required manifest/matrix/plan changes; the implementer revises on the same branch (new SHA, renewed review) before signoffs apply.
- **C — Keep R0 open**: list the missing evidence; the gate remains open and the VMM sequence stays blocked.

## 4. What acceptance does NOT do

No model training starts by itself; no production-data access, real-user integration, hosted serving or public release follows from R0. Research evidence never closes hosted, user-outcome or release gates (KAN-190 → KAN-130 remain).

## Docs-only note

This package is docs-only; the research-gate deliverable itself is unchanged at `8a4e5e16` (see comment 10356).
