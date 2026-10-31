# KAN-33 replacement independent review

31 October 2026 (Asia/Calcutta). Jira/source: KAN-33 / SCOPE-06.

## Responsibility, revision and decision

Independent reviewer: separate agent `/root/kan33_independent_review`, explicitly accepting responsibility. The reviewer did not implement or repair this candidate. Implementer: principal, as recorded by the handoff and Jira comment10362.

Exact reviewed candidate: **5fffa44af74916fda9ac6ad6547b21009dd0882a** on `codex/principal-kan-33-executable-invariants`. Base and verified published dev at review start: `f61292efaf6940ec1acc1751a61cb4a7dd17e66b`. Fresh reviewer instance: `C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-33-replacement`, branch `codex/qa-review-kan-33-replacement`, created from that dev, initially pushed/remote-verified, then fast-forwarded to the exact candidate. The rejected Manus commit `d50e8aebd76017611662d756ce4a0a51c05d7e4e` is not an ancestor of this review head.

**Decision: changes requested.** The replacement adds useful validator checks and five tests that execute the actual local-preview classroom service. It does not yet establish the executable authority/replay/cancellation and shared-case evidence claimed in its handoff. No new product-runtime defect is established by this review; these are acceptance-evidence defects. Do not merge this exact candidate or move KAN-33 to Done. Return the unresolved findings to In Progress under D-095. A corrected candidate requires renewed independent review.

## Findings

### R1 — Bind replay denial to an executed current-authority boundary

`backend/tests/contracts/scope-06/scope-06.test.mjs` lines59–77 label replay authorized/denied but invoke only `fingerprint`/`replayComparison`, which return hash equality and never read UID, workspace, policy, consent or source state. The remaining assertions compare fixture booleans and expected strings with constants. There is no stored receipt returned or denied by an actual backend operation. SC06-01 likewise validates a DTO and labels schema success a commit without executing a commit.

Independent weakening reproduced the gap: after original fixture construction, replace each state UID/workspace/policy with unrelated values, invert current consent, set current source/session false and replace every recovery with `placeholder`, leaving request payload, precondition and expected fields unchanged. **All nine backend tests still pass.** This contradicts the handoff's R1/probe-proof and R3 closure claims. The earlier reported weakening that changed a directly asserted precondition proves sensitivity to the assertion, not an authority check.

Required correction: exercise existing product/controller/service/repository boundaries for the applicable current-authority replay and unchanged owning-state outcome, or explicitly retain the unimplemented scenarios as open and supply the executable backend evidence required by the founder's replacement directive. Do not introduce a test-owned authorization implementation merely to test itself. Keep schema-only checks labeled schema-only.

### R2 — Execute cancellation and late delivery before claiming no commit

`backend/tests/contracts/scope-06/scope-06.test.mjs` lines88–96 validate Cancel command shape and assert `expected.kind`, `expected.notACommit` and that the DTO name is not CommitReceipt. They never cancel a real run/session, deliver a late result, inspect terminal state, or verify an owning-store receipt/revision remains unchanged. SC06-08 differs only in reason text. A service that incorrectly committed after cancellation would not affect these tests.

Required correction: execute the existing cancellation/late-result boundary with actual state/receipt assertions and a meaningful recovery observation, or retain that scenario as an open gap rather than claiming it closes R3. The accepted draft validator intentionally does not authenticate or persist anything; its successful input validation cannot supply the missing lifecycle outcome.

### R3 — Connect the two suites to the same semantic cases

`frontend/tests/contracts/scope-06/scope-06.test.mjs` lines8–19 and the handoff claim the SAME matrix is executed at both boundaries. The frontend suite never imports `scope-06-cases.mjs`; it constructs independent inputs from `classCurriculum.mjs`. SC06-05 means revoked-consent replay in the backend matrix but first-time outsider class denial in the frontend suite. The latter is useful coverage, but it is not the same scenario. The weakened backend matrix above also leaves all five frontend tests passing.

Required correction: bind the shared semantic inputs/authority changes/expected owning-state outcomes into both boundary adapters, and distinguish scenarios unavailable at a given boundary. Preserve the useful existing frontend service assertions and make the handoff accurately describe what actually executes. Real released curriculum/source selection remains KAN-29.

## Independent verification

Environment: Windows, Node24.19.0; isolated synthetic fixtures only. The new review checkout had no credentials copied and no product server, live account, cloud or provider was accessed. The six-package v1 dependency lock was installed independently with `npm ci --ignore-scripts --no-audit --no-fund --prefer-offline` (exit0). Frontend dependency reuse is a reviewer-only junction to the existing principal KAN-33 installation after byte-identical package-lock comparison; no dependency generation or installation wrote through it. An initial frontend attempt before dependency setup failed with missing Firebase package and is not counted as a candidate failure.

| Check | Actual result |
| --- | --- |
| Exact replacement backend suite | Exit0, 9 passed |
| Exact replacement frontend actual classroom-service suite | Exit0, 5 passed |
| Independent mismatched-owning-state/recovery probe | Exit0, backend9/9 and frontend5/5 still pass; blocking evidence gap above |
| `node integration/contracts/v1/check.mjs` | Exit0, 35 passed;30 schemas/12 draft paths, frozen=false, registered endpoints=0 |
| `node scripts/verify-layout.mjs` | Exit0 |
| `node scripts/verify-imports.mjs` | Exit0;3,842 baseline files plus4 recorded patches/11 changed files |
| Registered SCOPE-06 normal-check propagation | Exit1 as intended after injected KAN33_REVIEW_FAILFAST_PROBE mismatch; marker observed; source restored |
| Fixture restoration | Original bytes restored; clean source diff before reviewer report |

The normal-check registration at scripts/check.mjs does explicitly invoke both nested suites and propagates nonzero status. This addresses the old glob omission in source. No whole-product, authenticated browser, connected server/store, two-device, hosted or production acceptance follows from this test-only candidate. No frontend/backend runtime implementation file changed in the candidate.

Reproducible reviewer probe: `docs/architecture/reviews/evidence/KAN33_REPLACEMENT_WEAKENING_PROBE.mjs`. Run it only in an isolated checkout with candidate dependencies; it temporarily weakens the fixture, executes both suites, asserts that the evidence gap is reproduced and restores original bytes in finally. Detailed local logs: `artifacts/qa/kan33-independent-review-20261031/weakening-probe.json` and `failfast-probe.log`. The reviewer did not repair candidate tests, edit shared execution receipts, merge dev, transition Jira, or retire any worktree.

## Integration and remaining gates

This report approves no integration commit. A corrected exact candidate must close the findings, run relevant registered checks, receive separate review, then undergo published dev integration and integrated verification before its accepted scope can move to Done. Keep KAN-29 source/coverage, KAN-30 freeze, connected server/store/consent, two-device and hosted/release gates separate. Rollback of a future test-only integration would be a scoped source revert; no data migration exists here.
