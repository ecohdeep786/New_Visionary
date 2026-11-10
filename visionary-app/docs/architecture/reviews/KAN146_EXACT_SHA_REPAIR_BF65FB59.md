# KAN-146 exact-SHA repair review — bf65fb59

20 October 2026. Independent reviewer/verifier `/root/kan146_repair_review`, separate from implementer Codex. I accept responsibility for the independent checks and decision below. Exact implementation: `bf65fb592f7870d992af0ec9b8fe352bf3584ccb`, branch `codex/deepseek-kan-146-teaching-loop`, accepted dev base `e089319a24953bcadb522fcfef0e795065dd0c29`; previous task head `8616e4f681ae548bb4481187da14f695924e92f0`. Matching reviewer checkout resumed clean at `13c8568fb3deed22fa6513c6a4c59fbfb2ee2e98`; candidate merged without conflicts, old review retained, and only that old report differs from candidate product source.

**Decision: changes requested for the remaining echoed source/criteria binding gap.** The reported route-session/command binding defect is repaired, but the complete receipt-binding requirement is not yet met. Full feature, native Done, dev/main integration, prerequisite, deployment and cleanup acceptance are not given by this review.

## Independently verified repairs

- Non-start fingerprints include operation, route session and canonical command in a JSON tuple. Original-route replay remains exact; present/assess/cancel retries against a different route session return409 without writes. Persisted replay rows require the nested receipt UID/session to agree with stored/expected identity.
- Client validation binds requested route session, command workspace, exact assessment command/check ID. The pipeline repeats session/workspace/command/check validation before applying grade/revision. New mismatched session/workspace/command tests retain pending command, draft and local learning evidence.
- Independent `npm run backend:build` exits0; focused learning-loop suite passes11/11,0failed/skipped (6.895s). The client/durable-pipeline suite passes16/16,0failed/skipped (6.633s). Eight additional compiled-service probes corrupt nested receipt UID/session across start/present/assess/cancel; all return409 with zero writes.
- Source audit exits0:68routes,32registered endpoints,1645control declarations,219control files, per-control hosted acceptance false.
- Eight accepted platform files are byte-identical to dev: product entrypoint, platform HTTP helper, product TypeScript configuration, Dockerfile/ignore, runtime package/lock and production workflow. A byte comparison verifies each common-base history plus both original appended tails is preserved as a prefix of STATUS/QA/DECISIONS; new repair receipts only append.
- Production-check includes learning source/tests as a pair. The actual deployed-lock execution was still pending when this decision was recorded; no successful result is invented. Parent reports root18script/548frontend/lint/types/build74s and Ubuntu CI success; those broader checks cannot clear the directly reproduced gap below.

## Remaining P2 — mismatched returned source/criteria are still accepted

The previous review required pinned source/criteria checks where returned. Backend learning projections return `concept.sourceVersion` and `concept.criteriaVersion`. The client `learningReceipt` drops the concept object without comparing either version to the requested command, and the pipeline has no returned version to confirm before applying a verdict.

I directly invoked the actual client with the exact requested UID, session, workspace, assessment command and check, but returned `concept:{sourceVersion:"DIFFERENT-SOURCE",criteriaVersion:"DIFFERENT-CRITERIA"}` for a command pinned to source-v1/criteria-v1. Actual result:

```json
{"probe":"wrong-source-criteria-with-exact-route-and-command","accepted":true,"revision":2,"passed":true,"conceptReturned":false}
```

Correct by validating the echoed versions before trusting the command receipt, retaining a bounded validated version projection for the pipeline seam, and rejecting source/criteria mismatches without advancing local state. Add client and pipeline negative/draft-retention regressions and resubmit a new exact SHA. Existing route/command repair and passing regression suites are retained evidence, not approval of the replacement source before it is reviewed.

## Acceptance limits

Live Jira read during this review: KAN-146 Testing, KAN-145 Testing, KAN-143 To Do. Founder completion-scope decision is pending. The local presentation contract still accepts bounded browser-authored answer material; protected server-owned criteria/source authority, SQL ownership, calibration, providers/workflows, hosted Firestore/IAM/concurrency and real two-device/UI/category/language acceptance remain separate gates. No live user record, credential, provider or cloud resource was read or changed by this reviewer. All tests/probes use fictional local fixtures and loopback HTTP. This report performs no Jira edit/transition, integration, deployment or worktree cleanup.
