# KAN-29 independent engineering review

Current decision: **changes requested** for exact candidate 973918b49d98fb2bee03697b86c0685e2dc5fcec. This review concerns the offline contract/tooling/report enabler only; the full launch-coverage task remains open regardless of technical approval.

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
