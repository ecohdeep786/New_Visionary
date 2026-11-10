# KAN-29 independent engineering review

Current decision: **approved** exact engineering candidate ac8f6abc3cf8f5c87ea0639d28ef011ac50a6fd0 for the offline contract/tooling/report enabler only. The historical finding below against 973918b49d98fb2bee03697b86c0685e2dc5fcec is resolved by this replacement. Full KAN-29 launch-matrix/source/provider/admission/product acceptance remains open; this approval must not mark the whole task Done.

- Jira/source: KAN-29 / SCOPE-02. Live Jira read on 18 October 2026 returned Testing.
- Implementer: Codex (/root). Reviewer: account_structure_review, separate agent; I accept responsibility for this independent review and the checks attributed to me.
- Implementer branch: codex/codex-kan-29-coverage-matrix. Verified base/current origin/dev at review start: 9fd87bcee204f8a74b296112938e4fa7577d2ba7.
- Exact candidate: 973918b49d98fb2bee03697b86c0685e2dc5fcec.
- Reviewer branch: codex/qa-review-kan-29-coverage, fresh from verified origin/dev then fast-forwarded to candidate; initial push/remote ref verified.
- Reviewer checkout: C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-29-coverage/visionary-app (sparse).
- Review ownership: this document and reviewer artifacts only. No implementation/runtime/configuration/data/provider changes.
- Mandatory repository instructions, branch workflow and TASK_REVIEW_TEMPLATE govern this review. Live task prerequisites are phase/shared scope; no dependent feature/product acceptance is inferred.

## Finding P2 — refreshed source anchor can hide later selector mutation

`selectorValues` parses only the exported literal declaration. `validateCoverage` accepts a matrix anchor refreshed to the changed whole-file hash without independently fixing the reviewed source revision. Appending valid JavaScript `BOARDS.push({id: "ExtraBoard", label: "Extra Board"});` to the current stepConfigs source therefore changes the active BOARDS array used by ProductSetupFields, while the old five-board matrix still validates after only its source hash is refreshed. This contradicts the catalog drift/fail-closed guarantee and can silently omit an exposed option.

Independent pure-memory reproduction: read the actual candidate matrix and selector source, append that statement in memory, replace only the corresponding matrix sourceAnchor.sha256 using exported sha256, call validateCoverage with the substituted read. It incorrectly returns the normal candidate summary (5 roles, 9 categories, 7 source anchors, 0 released slices). No source file was changed. This is not a runtime authorization vulnerability: the inspector always denies authorization. It is a source inventory correctness issue in the submitted enabler.

An acceptable fix is separately pinning the exact reviewed anchor revisions in tooling, so changing a digest inside the data contract cannot bless new source semantics without an explicit reviewed tool change. Include selector consumers such as ProductSetupFields, not just the literal declaration file. Keep parser grammar regressions and add a real-file mutation/anchor-refresh regression. A partial mutation-method denylist would not provide that boundary.

## Independent evidence and source assessment

- `node --test scripts/tests/launch-coverage.test.mjs`: exit 0, 11 tests passed, 0 failed; 8.406 seconds, 18 October 2026.
- `node scripts/coverage-matrix.mjs`: exit 0; candidate, 5 roles, 9 categories, 3 interface locales, 7 source anchors, 0 released slices. Generated report equality checked by command/test.
- `git diff --check` across the full base/candidate range: exit 0.
- Full candidate diff inspected, including JSON/source anchors, diagnostic/parser, report generator, package scripts, sequential full-check exit handling, worksheet, task receipt and append-only log additions.
- Role/category dimensions match existing reviewed inventory; language identities remain distinct; source/provider/guardian/privacy/commercial gates stay explicit and open. Synthetic fixtures and profile preferences never become released slices or relationship grants. Diagnostic reasons and report state that downstream UI/API/store wiring is pending.
- Founder scope reply all is recorded as breadth only. No named source/edition/rights/provider/admission acceptance has been invented, and no whole-task Done claim is made.
- Current Onboarding imports productSetupSteps and renders only ProductSetupFields. ProductSetupFields imports COMPETITIVE_TARGETS plus Other, which the matrix includes. REFERENCE_BOOKS, COMPETITIVE_EXAMS and SUBJECTS are referenced only by unused older stepConfigs flow definitions, not the active renderer. Subjects are free text in active setup. I do not raise an exposed-catalog omission from those unused declarations.
- Worksheet/report relative links resolve to the intended checked-in contract, generated report and decision worksheet. Source paths are local and restricted; no private paths are accepted by anchor validation.
- Implementer normal full root check on this exact candidate is still running at this review checkpoint. Earlier checkpoint evidence is historical, not a current pass claim.

## Acceptance boundaries and disposition

Reviewer decision: changes requested for the exact candidate above. Verification result: failed catalog semantic-drift guarantee despite all submitted tests passing. Return unresolved review work to In Progress; only the integrator/user controls actual Jira transitions. I have made no transition.

Frontend/API/backend/store/ML/cache/transport/device runtime changes are N/A: this is offline engineering tooling and has no app permission integration. Actual released-role/source/provider/admission and UI-to-owning-store outcomes remain required through linked gates. Hosted verification and data migration are N/A to this enabler. Rollback is reverting its contract/tooling/report/check wiring; no data rollback is needed.

Dev integration commit/checks: pending, not performed here. Jira review/comment/transition receipt: parent integrator to record actual result. Full KAN-29 acceptance and dependent release prerequisites remain open. Separate engineering approval cannot supply human product/provider/source acceptance.


## Replacement exact-SHA decision — approved engineering enabler only

18 October 2026. Reviewer account_structure_review, separate from implementer Codex, approves exact implementation **ac8f6abc3cf8f5c87ea0639d28ef011ac50a6fd0** for the KAN-29 engineering coverage contract/tooling/report scope. I accept responsibility for this decision. This supersedes the earlier changes-requested source decision, not the still-open human/domain/release acceptance gates.

The replacement independently pins all seven reviewed producer/consumer/authority source revisions inside the checker. Source anchors in the data contract must match both actual normalized source bytes and these separately reviewed digests. A matrix-only rehash can no longer bless changed catalog semantics, aliases, inline consumer options or an altered authority source. The boundary is correctly documented as an exact reviewed snapshot, not a JavaScript data-flow analyzer. Future source changes deliberately need source inspection and renewed tooling/contract review. The previous incomplete semantic-drift guarantee is therefore repaired without an unreliable mutation-method denylist.

I inspected the full replacement delta: checker pins, mutation regressions, generated explanation and implementer handoff. No frontend/backend/ML/product-runtime/package/check wiring changed after the previously reviewed candidate. My branch differs from this exact candidate only by this independent review document.

Independent checks on the replacement:

- `node --test scripts/tests/launch-coverage.test.mjs`: exit 0, 12 tests passed, 0 failed, 1.221 seconds. The new test rehashes changed content across all seven anchors; later BOARDS mutation and inline ProductSetupFields options are explicit cases. Existing grammar/required-gate/synthetic-release/authority tests remain meaningful.
- `node scripts/coverage-matrix.mjs`: exit 0; 5 roles, 9 categories, 3 interface locales, 7 source anchors and 0 released slices. Report content matches its generated contract.
- Repeated my original independent in-memory BOARDS.push reproduction plus a ProductSetupFields inline-board-option reproduction, each with its matrix digest refreshed. Both now throw reviewed source revision drift as expected; assertion command exits 0. No implementation file was edited to perform these checks.
- Syntax checks for scripts/lib/launch-coverage.mjs, scripts/coverage-matrix.mjs and scripts/check.mjs: exit 0. Full base/replacement `git diff --check`: exit 0.

Implementer verification, distinguished by exact source scope:

- All 48 script regressions and coverage CLI pass on replacement ac8f6abc3cf8f5c87ea0639d28ef011ac50a6fd0.
- The normal full `npm run check` started against 973918b49d98fb2bee03697b86c0685e2dc5fcec and exited 0: layout/imports, 29 selected script tests at its initial phase, coverage/source inventory, unchanged 68 routes/1,637 controls/26 endpoints, lint, both typechecks, 532 frontend tests and Vite build (1 minute 46 seconds). The scripts-only replacement occurred while unchanged frontend tests/build ran. This is baseline full-pipeline plus replacement script evidence, not a falsely claimed complete rerun of every phase at the replacement SHA. The unchanged frontend/backend/ML/package/check tree and current replacement scripts justify the relevant verification scope.

Verification result: **passed for the exact engineering enabler**. No remaining actionable source findings. Generated report/decision worksheet keep all five roles and nine categories in scope, do not invent rights/providers or minor admission, reserve meaningful failure/recovery requirements and explicitly distinguish offline diagnosis from product enforcement.

Dev integration and acceptance disposition: integrator must compare the approved candidate with current dev, verify relevant integrated checks and publish only reviewed scope; no dev/main merge was performed by this reviewer. Parent integrator reports Jira comment10024/actual transition31 returned the finding to In Progress, and must record subsequent review/integration receipts truthfully. Technical approval may support a narrowly scoped engineering checkpoint. It does **not** accept or complete the full KAN-29 release matrix, source/edition rights, provider capability, guardian/linked-role admission, commercial/privacy disclosures, hosted delivery or dependent feature gates. Keep the task open pending its actual accountable product/source/provider/admission decisions and connected acceptance. No dependent task is certified ready by this report.
