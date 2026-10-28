export * from './scorecard-types';
export * from './scorecard-lookups';
export * from './scorecard-service';
// AI-13 (KAN-142) — the versioned product-capability scorecard.
//
// The checkpoint here is an honest, versioned capability-evaluation contract
// for novel learning/Build tasks — NOT a capability claim machine:
//   - VERSIONED definitions (append-only per version; conflicting redefinition
//     refused; identical re-set idempotent) with a run bound to ONE version.
//   - SIX dimensions: reasoning, planning/replanning, permitted memory, tool
//     execution, feedback-driven correction, transfer across tasks/languages.
//   - HELD-OUT families + contamination controls (hash registry; per-trial
//     checks; late contamination excludes recorded trials at report time).
//   - REPEATED trials with OBSERVED final state (evidence + outcome) — claims
//     never substitute for observations; repeats are enforced before a verdict.
//   - PRODUCT RELIABILITY vs GENERALIZATION are separate sections from
//     disjoint trial sets (released-category vs novel held-out families); the
//     verdict comes from reliability against REVIEWED thresholds alone; the
//     generalization section is `not_adjudicated_by_design` — no capability
//     or AGI verdict exists in this contract.
//   - Human/teacher baselines reported as observed deltas where present.
//
// Exit: measured product reliability evidence with honest scoping; no runtime
// capability or AGI claim is completed by this task.
