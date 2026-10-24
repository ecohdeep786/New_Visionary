# KAN-35 independent review

24 October 2026. Source requirement: SCOPE-08. Acceptance scope: proposed request-limit contract enabler only.

## Responsibility and exact candidate

- Implementer: Codex backend executor, chat `01a16c45-13e0-7af2-becc-edeca7a281cb`.
- Reviewer/verifier: separate Codex agent `/root/kan35_independent_review`. I explicitly accept independent review responsibility; I did not implement or modify the candidate.
- Reviewed implementation: `a3d0ac63f4ac1d52b66cee4518f0d01130bfb792` on `codex/codex-kan-35-request-limits`.
- Reviewed base and currently published dev at review: `0306703e7eabb996cfdd3f13d12b655a1899fa2b`.
- Review range: `0306703e7eabb996cfdd3f13d12b655a1899fa2b..a3d0ac63f4ac1d52b66cee4518f0d01130bfb792`, all six changed files.
- Independent checkout: `C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-35-request-limits`, created from the exact candidate for this existing task review, branch `codex/qa-review-kan-35-request-limits`. Initial branch push succeeded and remote candidate ref was verified.
- Review ownership: this report only. Runtime, implementation files, frontend, execution receipts and Jira status were not changed by the reviewer.

Live KAN-35 was read during review. Its requirement is to **specify** per-route JSON/stream limits, reconcile the existing 24 KiB parser with bounded project/submission text and exclude file/base64 bodies. Jira was In Progress at that read; review publication and verification do not themselves transition it. The execution registry contains no prior KAN-35 acceptance receipt. KAN-30 schema freeze and KAN-31 authority remain separate adoption prerequisites; this candidate does not claim them.

## Findings and decision

**Decision: approved for the exact implementation above as a contract enabler. Verification result: passed for the independent checks below. No blocking correctness or scope defect was found.** Relevant backend/frontend regression and integrated-result verification remain the integrator's responsibility before publishing dev and recording Jira Done. Approval does not cover later implementation commits or conflict resolutions.

The policy names the actual enforced subset separately from proposed caps, marks runtime enforcement unchanged and leaves existing validators authoritative. Inspection confirmed that only the script tests import the evaluator. No controller, parser registration, client transport, schema, storage, provider or product journey changes in this candidate.

The source inventory covers the six controllers registered by `FirebaseProductModule` and their 37 method/path combinations. The route drift test compares both registered classes and exact route coverage. Source inspection confirmed webhook raw parsing at 256 KiB before general JSON parsing at 24 KiB, token/profile/feedback UTF-16 checks, account/feedback pagination bounds and the client deadline defaults. The route table is an inventory with proposed profile assignments, not a claim that every listed cap is installed.

UTF-8 whole-envelope byte caps and UTF-16 versus Unicode-scalar field units are explicit. The proposed 24,000-scalar project body and 12,000-scalar submission body fit their 128/64 KiB envelopes for four-byte characters; escaped text may hit the body cap earlier, which is documented and tested. Separate method/path parser registration is required before runtime adoption; no global limit is raised. Draft preservation and a separately accepted private-file workflow cover reduction/overflow rather than silently losing existing drafts.

The proposed stream checker rejects missing/misordered completion, cancellation/disconnection and elapsed/idle expiry. Event/count/aggregate budgets and the distinction between completion observation and durable commit are tested. Retry rules require current authorization and identical command/payload; unknown write outcomes require a receipt read. These are offline rules, with actual downstream cancellation, deadline propagation and durable receipts still open.

Nonblocking limits of this evidence must remain visible:

- The stream evaluator uses a fixed 256-byte framing allowance over synthetic event JSON. It does not measure actual SSE framing, heartbeat traffic, cursors, backpressure or provider output. Runtime adoption must measure all actual frames and separately verify those behaviors.
- `checkJson` bounds serialized bytes/structure; field caps are evaluated separately by `checkText`. Neither function is a DTO, permission, file-content, signature or idempotency validator. The synthetic fixtures intentionally do not establish complete request validity.
- The source drift assertions cover selected anchors. Token/preference/pagination/configurable-deadline observations were also inspected directly; not every observed field has a mechanically coupled assertion. A passing suite alone cannot replace source review after related runtime changes.
- Generic response/depth/deadline proposals have not been shown to fit all existing large histories, billing-provider records or account profiles. The explicit adoption gate requires compatible pagination and worst-case fixture evidence before enforcement.

These limitations do not block the scoped specification enabler because both the contract and implementation handoff explicitly retain the corresponding runtime work and acceptance gates.

## Independently executed evidence

Environment: Windows PowerShell, Node `v24.19.0`, fresh independent review checkout; synthetic data only. Commands were run on 24 October 2026 against the exact candidate before adding this report.

| Command / inspected criterion | Result |
| --- | --- |
| `node --test scripts/tests/request-limits.test.mjs` | Exit 0; 40 passed, 0 failed/skipped/cancelled. Includes all profile request/response byte boundaries, multilingual text, structure, malformed JSON/UTF-8, pagination, long-body/global-parser mismatch, stream and retry fixtures. |
| `node scripts/verify-layout.mjs` | Exit 0; component roots separated. |
| `node scripts/verify-imports.mjs` | Exit 0; 3,842 imported files match baseline plus three recorded patches / ten changed files; credential files excluded. |
| `git diff --check` over the exact review range | Exit 0; no whitespace errors. |
| Diff of `scripts/check.mjs` | Existing check order preserved; only the new test registration is added. |
| Current routes, parsers, profile/token/feedback validators, pagination and both client transports | Direct source review plus selected drift assertions; consistent with the documented observed subset and remaining runtime gates. |
| Remote base and review branch | Published dev matched the stated base; review branch initially matched the exact candidate. Report is separately committed/pushed as evidence only. |

Frontend → API → store → jobs/ML → observation → device outcomes are N/A to this additive offline specification. Wrong-user/workspace/consent/source/revision runtime behavior is unchanged and unverified by this suite. No browser, hosted ingress/load, deployment, migration, provider, payment, operational rollback or two-device acceptance is claimed. Parent executor retains separate build/regression and integration evidence.

## Integration, rollback and gates

Integration commit/checks and Jira transition receipt: pending integrator action. Merge only the approved implementation plus evidence-only report/receipts, compare against current dev, run relevant integration checks and verify the published remote. A relevant dev change or conflict requires renewed review of the affected scope.

Rollback is reversion of the additive contract/evaluator/tests/report and the single check registration; no data/schema/configuration migration is involved. KAN-30 compatibility, KAN-31 authority, actual parser/response/deadline/stream enforcement, file/voice policy, hosted/provider/load/privacy and connected feature acceptance remain open. This review approves no production promotion or deployment and closes no linked feature/release gate.
