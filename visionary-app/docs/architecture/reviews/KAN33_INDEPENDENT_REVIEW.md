# KAN-33 independent review — changes requested

24 October 2026. Reviewer/verifier: Codex principal integrator in the founder-authorized review chat. Implementer: Manus. Exact reviewed candidate: `d50e8aebd76017611662d756ce4a0a51c05d7e4e`; verified dev/base: `9d6d2b5b0e97213ff2e8778c2a1d7469d8df554e`.

**Decision: changes requested. This candidate is not approved for dev integration or Jira Done.** Review scope is the proposed synthetic contract-case preparation only. This rejection is based on missing preparation/test criteria; it does not demand premature source selection or connected runtime implementation.

Review instance: `C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-33-invariants`, branch `codex/qa-review-kan-33-invariants`, created fresh from the verified dev base, pushed, then fast-forwarded to the exact Manus candidate. The reviewer did not implement or edit the four candidate files. Only this review report is authored by the reviewer. Manus retains implementation ownership. A changed candidate requires a new independent review decision.

## Blocking findings

### R1 / P2 — provide executable fictional fixtures and precise store/receipt expectations

`backend/tests/contracts/scope-06/invariants.mjs` supplies nine prose records. None contains an input/state fixture or an owning-store field. Both added test files import only this static matrix and assert its literal strings; they exercise neither the existing product services nor the accepted draft validator. This does not satisfy the preparation instruction to supply synthetic fixtures and a precondition/operation/receipt/store/recovery/evidence matrix suitable for later backend use.

Independent probe: copy the two test files unchanged into an isolated local fixture tree, replace every case's operation with `x`, precondition with `No executable setup.`, recovery with `No recovery specified.` and evidence with `No evidence.`; **all seven tests still pass**. Thus removal of the meaningful setup, operation and recovery evidence does not fail the suite. This probe does not modify product or candidate source.

Supply bounded fictional request and state fixtures, explicit expected typed receipt/error, authority/store owner (including explicitly proposed/unselected stores), and executable positive/failure/deny/recovery checks against the relevant existing service boundary and/or draft contract validator. Distinguish preview/shape evidence from server enforcement and future disconnected cases. Do not build a fake authorization implementation merely to test itself, invent a released source, or imply deployed enforcement.

### R2 / P2 — register the tests with normal verification

`frontend/package.json` runs `node --test --test-concurrency=2 tests/*.test.mjs`, which does not include `tests/contracts/scope-06/*.test.mjs`. `scripts/check.mjs` has no invocation of either new folder; backend checks also have no registration for the new backend test path. A standard successful check therefore gives no execution evidence for these added tests.

Add a narrow fail-fast registration for the focused suite to the normal root check, preserving all existing checks. The principal integrator authorized that narrow `scripts/check.mjs` extension in Jira; other shared/runtime changes still require explicit ownership. Verify an intentionally failing scoped assertion makes the normal command fail, then restore it before submitting the new exact candidate.

### R3 / P2 — specify safe replay and the required failure/cancellation cases

The duplicate-command precondition states only the same actor/object/command identity/payload. Its expected result unconditionally replays the original receipt. It omits current authorization/consent/source revalidation. The current `integration/contracts/v1/README.md` explicitly requires every replay to be reauthorized and says same-payload does not authorize returning a prior result. The matrix also omits changed-payload same-key conflict and cancellation/no-late-commit cases required by the source task's acceptance.

Make current authority an explicit prerequisite; include positive authorized replay, revoked consent/source replay denial, same-key changed-payload conflict, and cancellation/late-delivery expectations. Keep cancel acknowledgment, terminal run observation and owning-store commit distinct. Reconcile proposed semantic error names with the draft typed error envelope instead of presenting a new runtime error taxonomy. These are preparation fixtures/cases, not a request to bypass runtime prerequisites.

## Independent verification and product fit

| Check | Actual result and boundary |
| --- | --- |
| Focused new test command on exact candidate | 7 passed, 0 failed. Matrix consistency only. |
| Isolated weakened-matrix probe | Same 7 tests passed after every operation/precondition/recovery/evidence was replaced with placeholders. Blocking gap reproduced. |
| Existing product regressions | 19 passed: artifact conflicts/draft recovery, classwork submit/authority race boundaries, workspace/account isolation and onboarding. These existing tests invoke actual frontend services using isolated preview fixtures; not hosted/backend authority proof. |
| Isolated v1 contract generation/check | 35 passed; generated output matches. These draft validators are not installed into product runtime. |
| Three added JavaScript files | `node --check` passed for each. |
| Layout / imported-source provenance | Passed; 3,842 imports match baseline plus three recorded patches (ten changed files). |
| Candidate change scope | Exactly four authorized files, 220 insertions; no runtime/frontend service/API/authority/source-map/provider/config changes. |
| Product trees | Candidate and dev frontend/src `e00d468323656c6288ec1ef8b18ef1708a95b6e8`, backend src `c8fb7c2c5dcb85936278da4772143bd41b792f98`, infrastructure `a2475436eab212b9538fb7ab19247ecb44a479a4` are identical. |
| GitHub recovery | Reviewer pushed Manus's previously local candidate through the existing authorized Git credential path. Remote `manus/kan-33-invariant-cases` reads back exact `d50e8aebd76017611662d756ce4a0a51c05d7e4e`. No password/token printed or stored in evidence. |
| Full root checks | Results are recorded in the final review follow-up/Jira. A green baseline does not resolve R1–R3 or register the new tests automatically. |

Retained local evidence is under primary `visionary-app/artifacts/qa/kan33-20261024/`: focused and contract logs, existing-product regression log, `independent-probe.mjs`, weakened-matrix log and `independent-probe.json`. Logs state their exact source/environment; no learner records or credentials are involved. No browser captures are necessary to substantiate an unchanged UI or these source/test-discovery findings; none are presented as connected acceptance.

## Acceptance, recovery and next step

Jira was Testing at review start. The actual workflow transition 31 returned **In Progress** after the findings were recorded. No dev/main merge, production deployment, approval or Done is asserted. Preserve both task and review worktrees and pushed refs while findings are unresolved; no completed-task cleanup is allowed yet.

Manus must fix the findings, install locked dependencies, run the registered relevant checks, push/verify a new exact SHA and resubmit to Testing. Codex independently reviews the replacement, compares current dev, and only then decides integration/Done using actual checks and accepted scope. KAN-29 real curriculum/source/language/rights selection, KAN-30 affected contract freeze, policy/consent/store/runtime/hosted and feature gates remain separate. KAN-31 mapping and KAN-35 bounds are already accepted enablers; this does not make their future runtime enforcement complete.

The founder assigns KAN-51 isolated implementation to Manus and independent review/testing/integration to Codex afterward. This is a role assignment, not source/policy-owner approval or a promise that an unsubmitted KAN-51 candidate has passed. For this rejected candidate, recovery is simply to leave dev unchanged; no production record or configuration was mutated.
