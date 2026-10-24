# KAN-31 independent review

24 October 2026. Jira/source: KAN-31 / SCOPE-04. Scope: **source-audited operation-authority and owning-store mapping enabler**, not deployed new authorization, final domain-store selection or authority/schema freeze.

## Responsibility and decision

Implementer: Codex backend executor on `codex/codex-kan-31-authority-audit`. Independent reviewer/verifier: separate Codex agent `/root/kan31_independent_review`, explicitly accepting reviewer responsibility and authoring no implementation changes.

**Exact reviewed implementation: `edce28aea671c66c2b0c11c5ca8a8d71e89a5800`. Decision: approved. Verification: passed for the source, dependency-free local checks and exact-source CI described below. No blocking finding remains in this mapping-enabler scope.** Base and published dev independently verified during review: `64a2cecb39d8f039151b6b459157a7415e183887`.

Fresh review checkout: `C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-31-authority-audit`; branch `codex/qa-review-kan-31-authority-audit`, created from the exact candidate, pushed and verified at the matching remote SHA. Reviewer owns only this report. No runtime, frontend, provider, configuration, shared receipt, migration or protected record was edited or accessed.

**Completion judgment:** the source requirement is to map operations and preserve explicit authority/store boundaries, including lists, downloads, exports, jobs and support. This candidate supplies a testable current inventory plus required, explicitly unimplemented future boundaries. Under the issue's D-085 scoped-enabler acceptance clause, the integrator may accept this mapping enabler and move KAN-31 to Done **after** successful final-head/integrated verification, accepted published dev integration and an actual Jira receipt that names this limited scope. This is not permission to declare runtime/domain authorization implemented, source/policy decisions accepted or P00/whole-product release complete. Later relevant source changes or conflicts require renewed semantic review.

## Requirement and semantic source review

The reviewer independently read live KAN-31's mapping requirement/addenda and current execution comments `10187` and `10188`, plus repository delivery instructions and the handoff. The renewed execution preserves the old unimplemented branch rather than resetting it. The candidate changes exactly five paths: generated `operation-authority.v1.json`, its dependency-free generator/verifier, 19 audit tests, the task handoff and one additive root-test registration line. All four runtime component trees—frontend, backend, ML and infrastructure—match the base exactly.

The manifest maps all 37 current Nest method/path pairs to observed profiles, six public production infrastructure method/path pairs, 12 draft/unregistered OpenAPI write paths, 16 future operation families and 32 dated UI groups. Profiles identify actor, workspace, object, source, consent/purpose and owning store. Current Firestore ownership is explicit; future domain/private-object/job/profile owners are proposed, with selection and implementation gates retained. The dated UI group's state does not certify current provider availability or permission, and its summary profile does not override exact registered operation entries.

The reviewer inspected the six controllers and the relevant shared/service logic rather than accepting generated metadata or tests alone:

- Public methods/catalog/probe and CSRF bootstrap do not establish identity. `/auth/me` verifies current session/device without the expected-account header. Ordinary owner reads/commands use compared account hints; mutations retain exact Origin/CSRF. The shared helper verifies cookie/device state before deriving UID.
- Local sign-out is accurately separated from ordinary fully authenticated commands: its service uses the device lookup with expected-UID or cookie-hash matching and absent/invalid-device no-op. Global sign-out additionally verifies session/device/account and transaction epoch/cutoff/replay state. The map does not flatten those paths into one stronger authentication claim.
- Billing browser helpers, the configured reconciliation credential and HMAC over exact raw webhook bytes are distinct authorities. Provider events use server merchant/subscription/payment mappings and durable deduplication; an unmapped event grants nothing. Owner invoice and addressed Family-invitation checks do not create educational guardian consent.
- Feedback remains account-owned optional data, with UID-nested records/admission state and no staff/guardian/training or emergency-channel grant.
- Current learning workspace/source/provider/criteria values are bounded client input and record-consistency bindings, not verified membership, publication rights or withdrawal enforcement. The authored check DTO accepts prompt/options/answerIndex; server scoring of that stored key is not trusted curriculum/rubric provenance. The explicit gaps correctly retain this distinction.
- Knowledge projections derive scope from the owner's saved session/assessment and check UID, receipt and revision/model compatibility. The map does not turn pKnown into assessed mastery or create cross-user reporting rights.
- Proposed end-user export requests/status, worker execution and private download use separate profiles; run status/events/cancel remain end-user domain actions. Support requires a separate scoped strong/step-up operator with reason/audit. Guardian, institutional, private-coaching and stage responsibilities remain distinct. A self-summary does not incorrectly require guardian status, and a future profile is not a second mutable SQL/Firebase authority.

No new runtime grant follows from any proposed profile. Source rights, substantive retention/provider/commercial/safeguarding policy and human operational/release ownership remain with their linked tasks. KAN-30 and KAN-32 retain their unresolved acceptance; this review does not close either ticket or approve their freeze/policy outcomes.

## Actual independent verification

Environment: fresh Windows/PowerShell checkout, existing Node runtime, synthetic in-memory source mutations only. No dependency installation, product server, provider call or database access was needed by this reviewer.

| Command or inspection | Actual result |
| --- | --- |
| `node scripts/authority-audit.mjs` | Exit 0; committed inventory matches generation: 37 registered / 6 infrastructure / 12 proposed / 16 future / 32 UI groups; runtime changes=false |
| `node --test scripts/tests/authority-audit.test.mjs` | Exit 0; all 19 tests passed, zero failed/skipped/cancelled |
| Additional independent source/component/profile assertions | Exit 0; 104 assertions passed, including every recorded normalized source fingerprint, observed/proposed separation, four unchanged component trees and distinct actor/export/summary boundaries |
| Additional independent weakened-source probes | Exit 0; six mutations rejected: expected-account check, reconciliation credential check, raw webhook signature check, learning UID check, knowledge UID check and unreviewed controller registration |
| `node scripts/verify-layout.mjs` | Exit 0; component/configuration roots remain separated |
| `node scripts/verify-imports.mjs` | Exit 0; 3,842 imported files match baseline plus three recorded patches / ten changed files |
| Exact range whitespace and working-tree inspection | Exit 0; no whitespace defect; clean before authoring this report |

The reviewer inspected the task-local GitHub helper before invoking only its read-only `runs`/`jobs` operations. GitHub API independently confirmed [run 40100490351](https://github.com/ecohdeep786/New_Visionary/actions/runs/40100490351), event `pull_request`, exact head `edce28aea671c66c2b0c11c5ca8a8d71e89a5800`, completed successfully; checks job `120891465010` succeeded and production job `120891787576` was skipped. No production deployment is inferred. Parent-reported full log counts are 82 configured script tests, 35 contract tests, 624 frontend tests, 99 backend regressions, 28 Node infrastructure tests and 11 Python tests; those counts are submitted integrator evidence, not additional locally rerun suites by this reviewer.

## Limits, integration and recovery

The generator and its fingerprints are review tripwires, not a TypeScript control-flow or complete transitive import-graph proof. Unsupported known HTTP decorator syntax and reviewed controller/route changes fail closed; changes outside the listed evidence files still need their normal component review. Regeneration is not approval. Some tests assert the required mapping distinctions while others inject drift; none substitutes synthetic identity for real server authorization, proves source licensing or certifies educational outcomes.

This approval covers the exact source inventory enabler. Final evidence-head CI, actual dev integration and integrated checks, before/after preservation evidence, native Jira transition and evidence-preserving cleanup remain integrator actions. Anonymous screenshots show unchanged product presentation only; this reviewer claims no new authenticated/hosted/two-device outcome. Rollback is a scoped manifest/script/test/handoff revert; no persistent product state or migration exists. Keep source/policy, future store selection, membership/consent, provider/privacy, domain implementation, hosted/operational and main release gates open after scoped Done.
