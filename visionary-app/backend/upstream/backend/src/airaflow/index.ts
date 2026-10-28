export * from './airaflow-types';
export * from './airaflow-lookups';
export * from './airaflow-service';
// AI-14 (KAN-143) — the AIRA deterministic teaching/workflow harness.
//
// The checkpoint here is a BOUNDED workflow/agent harness over the durable run
// protocol — never an open-ended autonomous agent:
//   - ONE context owner (uniform denial, no existence leak, no cross-workspace).
//   - TYPED ALLOWLISTED tools only; charging/publishing/grading/private-data
//     families are refused at registration, so autonomous product acts are not
//     expressible.
//   - SERVER POLICY CHECKS on EVERY call (allowlist, ownership, schema,
//     capability, version pins) — a past check is never reused.
//   - PINNED source/model/prompt/tool-registry versions, immutable after start;
//     server-recorded drift refuses every call (no silent version drift).
//   - BOUNDED branches/retries; CHECKPOINT/RESTART from the last checkpoint;
//     EXPLICIT pause/resume/approval; owner/usage/final-step STOP CONDITIONS.
//   - EXACTLY-ONCE accepted product side effects with MEASURED usage (an
//     ambiguous crash-window retry converges to duplicate, never double-applies,
//     never double-debits).
//   - SAFE replanning only after an OBSERVED failure, within the branch bound.
//   - Model-generated plans/memory stay PROVISIONAL until executed and observed.
//
// Exit: bounded, deterministic workflows with exactly-once accepted product
// side effects and measured usage.
