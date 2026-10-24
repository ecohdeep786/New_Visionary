# KAN-30 / SCOPE-03 review handoff

Acceptance scope: draft contract preparation enabler only. Contract freeze and domain wiring remain gated by KAN-29 source decisions, KAN-31 authority and KAN-32 admission/policy acceptance. The complete KAN-30 requirement is not yet accepted.

Implementer: Codex backend worker. Reviewer: pending separate agent acceptance; no implementer approval.

Worker branch: `codex/codex-kan-30-api-contracts`; base `3aaf0a17567dea1a83230f6c9479535e225723cc`. Exact candidate is recorded in Jira after pushing; this document does not count as approval. Owned paths: `integration/contracts/v1/**`, this handoff and narrow contract check/install registration in `scripts/check.mjs` and repository `.github/workflows/production.yml`. No migrations or current runtime/frontend route changes.

Criteria and evidence:

- Versioned closed DTOs, typed errors, pagination/cursors, mutations/revisions, receipts/events: generated standalone schemas/OpenAPI plus strict runtime validator and synthetic positive/failure tests in the package.
- Voice interim/final, proposal/commit separation, offline replay, lifelong mappings/profile/stage/summary/coaching: bounded shape tests; actual authority, consent/source, transactions, windows, signing and human decisions remain explicit integration gates.
- Compatibility: inherited 37-route Nest inventory plus six infrastructure method/path pairs. No edits to runtime or frontend source. Local anonymous GET smoke and before/after public login/register desktop/mobile screenshots are saved outside Git in primary `artifacts/qa/kan30-20261024/`. They prove observed preservation only; no authenticated or hosted acceptance follows.
- Build/test/rebuild: deterministic generated-output check, strict schema compilation, boundary suite, lock audit and full CI. Exact commands/counts/results/URLs are added to Jira and the independent review, not inferred here.
- Frontend/API/backend/store/jobs/ML/cache/devices: new frontend wiring, store changes, ML calls, cache and multi-device writes are N/A for this draft-only package. They remain necessary for affected connected features. The draft is not installed into the product.

Recovery: revert the scoped task commit; no stored data or deployed runtime changes. Local evidence preserves served source SHA, frontend tree, route and viewport. Hosted/provider/load/privacy/commercial/release gates are open. `main`/`beta` are outside this delivery.

Reviewer decision, exact reviewed SHA, verification result, dev integration checks and native Jira receipt: pending. Keep Jira Testing while review or prerequisite acceptance is unresolved; do not start the next implementation task until this scope is accepted.
