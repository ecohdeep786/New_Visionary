# KAN-35 independent review

24 October 2026. Source requirement: SCOPE-08. Acceptance scope: proposed request-limit contract enabler plus the narrowly scoped deployed parser dependency correction discovered during verification.

## Responsibility and exact candidate

- Implementer: Codex backend executor, chat `01a16c45-13e0-7af2-becc-edeca7a281cb`.
- Reviewer/verifier: separate Codex agent `/root/kan35_independent_review`. I explicitly accept independent review responsibility; I did not implement or modify the candidate.
- Reviewed implementation: `bcdbe4e7d7048662d2cbe7e6ee5975582e2b8437` on `codex/codex-kan-35-request-limits`.
- Reviewed base and currently published dev at review: `0306703e7eabb996cfdd3f13d12b655a1899fa2b`.
- Review range: `0306703e7eabb996cfdd3f13d12b655a1899fa2b..bcdbe4e7d7048662d2cbe7e6ee5975582e2b8437`. All original six implementation files, three added runtime package/test files and inherited review evidence were inspected. This includes re-review of the response correction at `c785248a`, dependency/test correction at `82d55f49` and infrastructure-surface clarification at `bcdbe4e7`.
- Independent checkout: `C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-35-request-limits`, created from the initial candidate for this existing task review, branch `codex/qa-review-kan-35-request-limits`. Initial branch push succeeded and remote ref was verified. Replacement candidates were fetched/merged without conflicts into this review-only branch; the only source difference from the final replacement candidate is this report.
- Review ownership: this report only. Runtime, implementation files, frontend, execution receipts and Jira status were not changed by the reviewer.

Live KAN-35 was read during review. Its requirement is to **specify** per-route JSON/stream limits, reconcile the existing 24 KiB parser with bounded project/submission text and exclude file/base64 bodies. Jira was In Progress at that read; review publication and verification do not themselves transition it. The execution registry contains no prior KAN-35 acceptance receipt. KAN-30 schema freeze and KAN-31 authority remain separate adoption prerequisites; this candidate does not claim them.

## Findings and decision

**Decision: approved for exact candidate `bcdbe4e7d7048662d2cbe7e6ee5975582e2b8437`. Verification result: independent contract/source/lock audit checks passed, and final-candidate CI root checks, deployed-lock compilation/regressions, parser HTTP regression and infrastructure checks passed as verified below. Accepted integrated-result verification/publication and Jira transition remain the integrator's responsibility before Done.** R1 is resolved; no blocking finding remains in this scoped candidate. Approval does not cover later implementation commits, conflict resolutions, actual new limit enforcement or hosted acceptance.

The initial report commit `e9921ea7ee661fa205e010f0744fd85dc63b21df` recorded approval of the old candidate before a directional error-semantics issue was raised by the integrator and reproduced by this reviewer. Changes-requested report `3726b7fcad729e9ede96c80a78344f88454c9daa` superseded that initial decision. Conditional approval at `c18884d0` covered only `c785248a`; CI then failed the unchanged dependency audit before build/test and could not satisfy its condition. Review responsibility was reopened for the security scope extension recorded in Jira comment `10169`. Earlier decisions are history only; current approval applies exclusively to the final candidate named above.

**R1 (P2), resolved: distinguish generated response failures from client request failures.** The initial evaluator returned request-side 413 for oversized generated response bodies and 400 for invalid response JSON/structure. The corrected evaluator returns bounded `RESPONSE_LIMIT`/503 for response byte/structure overflow and `INVALID_RESPONSE`/503 for malformed, invalid UTF-8 or non-wire responses; request rejection retains 413/400. Contract error metadata and the handoff now document the distinction and receipt-first recovery after an unknown write outcome. The expanded suite and 63 additional independent status/code assertions across all nine profiles passed. No runtime consumes the helper yet.

The policy names the actual enforced subset separately from proposed caps, marks limit enforcement unchanged and leaves existing validators authoritative. Inspection confirmed that only the script tests import the evaluator. No controller, parser registration, client transport, schema, storage, provider or product journey changes in this candidate. The deployed runtime dependency lock does change as described below.

The source inventory covers the six controllers registered by `FirebaseProductModule` and their 37 method/path combinations. The route drift test compares both registered classes and exact route coverage. Source inspection confirmed webhook raw parsing at 256 KiB before general JSON parsing at 24 KiB, token/profile/feedback UTF-16 checks, account/feedback pagination bounds and the client deadline defaults. The route table is an inventory with proposed profile assignments, not a claim that every listed cap is installed.

Production `configureProductionHttp` independently installs the same raw 256 KiB parser before global 24 KiB JSON parsing; final tests assert both production and local entrypoints. Separate metadata covers GET/HEAD `/healthz`, `/api/health` and `/__deploy-check` with observed global ingress and a proposed 4 KiB response cap (HEAD has no response body). Static assets/SPA fallback are explicitly excluded from JSON response budgets. Existing probe trust checks and proxy/edge/header/query/time gates remain authoritative; neither composition installs a whole-operation server timer.

UTF-8 whole-envelope byte caps and UTF-16 versus Unicode-scalar field units are explicit. The proposed 24,000-scalar project body and 12,000-scalar submission body fit their 128/64 KiB envelopes for four-byte characters; escaped text may hit the body cap earlier, which is documented and tested. Separate method/path parser registration is required before runtime adoption; no global limit is raised. Draft preservation and a separately accepted private-file workflow cover reduction/overflow rather than silently losing existing drafts.

The proposed stream checker rejects missing/misordered completion, cancellation/disconnection and elapsed/idle expiry. Event/count/aggregate budgets and the distinction between completion observation and durable commit are tested. Retry rules require current authorization and identical command/payload; unknown write outcomes require a receipt read. These are offline rules, with actual downstream cancellation, deadline propagation and durable receipts still open.

Nonblocking limits of this evidence must remain visible:

- The stream evaluator uses a fixed 256-byte framing allowance over synthetic event JSON. It does not measure actual SSE framing, heartbeat traffic, cursors, backpressure or provider output. Runtime adoption must measure all actual frames and separately verify those behaviors.
- `checkJson` bounds serialized bytes/structure; field caps are evaluated separately by `checkText`. Neither function is a DTO, permission, file-content, signature or idempotency validator. The synthetic fixtures intentionally do not establish complete request validity.
- The source drift assertions cover selected anchors. Token/preference/pagination/configurable-deadline observations were also inspected directly; not every observed field has a mechanically coupled assertion. A passing suite alone cannot replace source review after related runtime changes.
- Generic response/depth/deadline proposals have not been shown to fit all existing large histories, billing-provider records or account profiles. The explicit adoption gate requires compatible pagination and worst-case fixture evidence before enforcement.

These limitations do not block the scoped specification enabler because both the contract and implementation handoff explicitly retain the corresponding runtime work and acceptance gates.

## Reopened deployed dependency review

The integrator reported [failed CI run 40066021726](https://github.com/ecohdeep786/New_Visionary/actions/runs/40066021726): its unchanged high-severity dependency gate failed before build/test. The reviewer independently inspected the original and final runtime manifests/locks and the primary maintainer advisories. The final overrides move body-parser `1.20.8` to `1.20.9`, the patched 1.x release in [GHSA-27r3-jxmh-p828](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828), and multer `2.4.0` to `2.5.0`, the patched 2.x release in [GHSA-q7qp-rjg7-q26m](https://github.com/expressjs/multer/security/advisories/GHSA-q7qp-rjg7-q26m). Multer is a minor security update, with release-note changes to failed-upload cleanup and exact field-size handling, not a patch-number-only update.

Programmatic comparison of all 303 lock entries found only those two package nodes changed, limited to version/resolved/integrity metadata. No nodes were added/removed; direct dependencies, Node engine, Nest 10, Express 4 and both packages' dependency/engine declarations remain unchanged. Both tarballs retain the npm registry origin. The existing overrides already mediate Nest's exact transitive pins; no new override mechanism or audit bypass is introduced. The upstream backend package/lock and frontend are untouched.

Independent `npm audit --package-lock-only --omit=dev --audit-level=high --json` exited 0 with **zero high, zero critical and four moderate affected package entries**. Those remaining Nest/file-type findings are not remediated or accepted as harmless by this review. This result is scoped to the deployed lock at review time, not a claim that every component or future registry audit is clean.

The new infrastructure test was inspected line by line. It loads Express from the deployed runtime lock in a separate loopback child process, tests below/at/above both parser caps, verifies Buffer preservation and signature failure after JSON reserialization, exercises expanded gzip overflow and follows malformed compressed input with a healthy request. It introduces no upload route, provider calls or credentials. This is an isolated middleware harness with the same inspected parser settings, not a full production bootstrap or exhaustive advisory exploit proof. Final-candidate CI passed this harness and deployed compilation/regressions; source inspection and lock audit alone would not establish runtime compatibility.

## Final CI verification

The reviewer inspected the task-local GitHub read-helper source, then independently queried the GitHub runs/jobs APIs using its read-only `runs` and `jobs 40066737852` commands. The API confirmed [run 40066737852](https://github.com/ecohdeep786/New_Visionary/actions/runs/40066737852) has head `bcdbe4e7d7048662d2cbe7e6ee5975582e2b8437`, event `pull_request`, status completed and conclusion success. Checks job `120791477613` independently reports all required steps successful: both component installs, unchanged high-severity audit, root check, `production-check.mjs`, infrastructure Node tests and Python tests. It completed on 24 October 2026 at **11:05:02 IST** (`05:35:02Z`). Production job `120791727564` was skipped; this verification deployed nothing.

The integrator's downloaded log for that exact job was also inspected: 63 script checks, 624 frontend tests, 99 deployed-lock backend regressions, 28 infrastructure Node tests (including the new parser harness) and 11 Python tests pass, with zero test failures; frontend lint/typecheck/build and deployed compilation steps succeed. These are Linux CI results, not completed local Windows builds. The separate local reviewer `npm ci` stalled and was explicitly stopped after verifying its process identity; it exited 1 and establishes no successful local install or runtime test. Only partial reproducible ignored `node_modules` were created; no local configuration or nonreproducible user evidence requires preservation.

## Independently executed evidence

Environment: Windows PowerShell, Node `v24.19.0`, fresh independent review checkout; synthetic data only. Commands were run on 24 October 2026. The 40-test suite was independently run on both candidates; the final suite and directional assertions used the corrected candidate's exact implementation, with only this report additionally present.

| Command / inspected criterion | Result |
| --- | --- |
| `node --test scripts/tests/request-limits.test.mjs` | Exit 0; 40 passed, 0 failed/skipped/cancelled. Includes all profile request/response byte boundaries, multilingual text, structure, malformed JSON/UTF-8, pagination, long-body/global-parser mismatch, stream and retry fixtures. |
| Independent `node --input-type=module -e` directional assertions | Exit 0; 63 assertions passed across nine profiles: malformed JSON, malformed UTF-8, wrong wire type, oversize bytes and excess array items produce response-side 503 with the expected public code; oversize and malformed requests retain 413/400 and their codes. |
| Deployed lock comparison and lock-only high-severity audit | Exit 0; only body-parser/multer nodes changed among 303 entries; audit reports high 0, critical 0, moderate 4. |
| Final-candidate CI API and downloaded job log | Run `40066737852`, checks job `120791477613`, exact head `bcdbe4e7`; all required steps succeed. Counts: 63 script, 624 frontend, 99 deployed backend, 28 Node infrastructure and 11 Python tests, including actual deployed-lock parser HTTP coverage. Production job skipped. |
| `node scripts/verify-layout.mjs` | Exit 0; component roots separated. |
| `node scripts/verify-imports.mjs` | Exit 0; 3,842 imported files match baseline plus three recorded patches / ten changed files; credential files excluded. |
| `git diff --check` over the exact review range | Exit 0; no whitespace errors. |
| Diff of `scripts/check.mjs` | Existing check order preserved; only the new test registration is added. |
| Current routes, parsers, profile/token/feedback validators, pagination and both client transports | Direct source review plus selected drift assertions; consistent with the documented observed subset and remaining runtime gates. |
| Remote base and review branch | Published dev matched the stated base; review branch initially matched the exact candidate. Report is separately committed/pushed as evidence only. |

Frontend → API → store → jobs/ML → observation → device outcomes are N/A to the offline specification. Wrong-user/workspace/consent/source/revision behavior is unchanged and unverified by the contract suite. The runtime dependency correction has the deployed-lock compile/HTTP/regression evidence above. No browser, hosted ingress/load, deployment, migration, provider, payment, operational rollback or two-device acceptance is claimed. Parent executor retains final CI/build/regression and integration evidence. The interrupted local reviewer runtime installation is not counted as a passed install or test.

## Integration, rollback and gates

Integration commit/checks and Jira transition receipt: pending integrator action. Merge only the approved implementation plus evidence-only report/receipts, compare against current dev, run relevant integration checks and verify the published remote. A relevant dev change or conflict requires renewed review of the affected scope.

Rollback of the additive contract/evaluator/tests/report and check registration is a source revert. Dependency rollback must revert both deployed runtime package files together, rebuild/retest the image and explicitly account for reintroducing the advisories. No data/schema migration is involved. KAN-30 compatibility, KAN-31 authority, actual new parser/response/deadline/stream enforcement, file/voice policy, hosted/provider/load/privacy and connected feature acceptance remain open. This review approves no production promotion or deployment and closes no linked feature/release gate.
