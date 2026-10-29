# KAN-33 — SCOPE-06 — replacement handoff: executable product-boundary contract/deny/replay cases

## Task review and verification handoff

Jira key / source ID: KAN-33 (SCOPE-06, parent KAN-2)
Acceptance scope: preparation deliverable per the founder's replacement directive (comment of 2026-10-24): executable product-boundary tests against EXISTING real implementation — no fake authorization implementation, no invented released source, no disconnected feature built merely to test itself. The synthetic vertical slice selected here is the existing fixture's fictional board 'Fictional framework' / sourceId 'book-fixture' version '1' / language 'en' / class 6 Mathematics — clearly fictional; final released curriculum/language/source selection remains KAN-29's founder decision.
Implementer: principal (senior principal backend engineer) — implementing owner per the founder's directive replacing the rejected Manus candidate `d50e8aeb`.
Reviewer: separate reviewer required (D-095). The prior independent review (codex/qa-review-kan-33-invariants, commit 6234c5a7, CHANGES REQUESTED on d50e8aeb) CANNOT approve this Codex-authored replacement; a different reviewer must review the exact final SHA.
Worker branch / base commit: `codex/principal-kan-33-executable-invariants`, fresh worktree from verified `origin/dev` `f61292efaf6940ec1acc1751a61cb4a7dd17e66b` (D-098), per the directive's "from latest verified origin/dev".
Current dev commit / comparison range: f61292ef → candidate head.
Owned files / contracts:
- `backend/tests/contracts/scope-06/scope-06-cases.mjs` (fixture matrix: 9 cases, each binding real input/state fixtures, owning-store fields and preconditions to typed expected outcomes and recovery)
- `backend/tests/contracts/scope-06/scope-06.test.mjs` (executable backend suite: every case runs through the accepted draft v1 contract validator — validateWire, fingerprint, replayComparison, compareRevision)
- `frontend/tests/contracts/scope-06/scope-06.test.mjs` (executable frontend vertical-slice suite: the SAME case matrix executed against the REAL classroomService boundary with the existing classCurriculum fixture; owning-store record assertions)
- `scripts/check.mjs` (R2: narrow fail-fast registration of both suites in the normal root check — the extension the principal integrator authorized in Jira)
- This handoff document.
Preserved, unmerged: `manus/kan-33-invariant-cases` (d50e8aeb) and `codex/qa-review-kan-33-invariants` (6234c5a7) remain exactly as reviewed.

## How this replacement closes the rejection findings

- **R1 (executable fixtures; probe-proof)** — every case binds a real operation payload with owning-store fields (mutationId, workspaceId, expectedRevision), explicit preconditions (current authority/consent/source) and typed expected outcomes; expectations are compared with ACTUAL validator/service output. Weakening probe (executed 2026-10-29): gutting the positive payload body and flipping the revoked-consent precondition made the backend suite FAIL 8/9; restored, it passes 9/9. The rejected matrix passed all tests under the same class of weakening — this one does not.
- **R2 (normal verification registration)** — both suites are registered fail-fast in `scripts/check.mjs` immediately after the API-contracts step. Negative probe (executed 2026-10-29): an intentionally wrong expected error code made the normal `node scripts/check.mjs` FAIL (exit 1, wrong code visible in the log); restored, the suites pass. The glob gap that hid the Manus tests (`tests/*.test.mjs` does not match nested `tests/contracts/scope-06/`) cannot hide these suites.
- **R3 (replay per the draft contract)** — cases SC06-04/05/06/07/08 encode integration/contracts/v1/README.md semantics: an authorized same-payload replay yields the stored receipt ONLY with the current authority/consent/source recheck satisfied (the precondition field carries that recheck; the same payload alone never authorizes a prior result); a revoked-consent replay denies (DENIED) despite the identical fingerprint; a same-key changed payload is a command conflict (COMMAND_CONFLICT); cancellation acknowledges (distinct kind, `notACommit: true`) and late delivery stays acknowledgment-only. Error names come from the draft typed envelope (INVALID_REQUEST, STALE_REVISION, DENIED, COMMAND_CONFLICT, PAYLOAD_TOO_LARGE) — no new runtime taxonomy.

## Vertical slice (synthetic selection, KAN-29-dependent for release)

The executed slice: fictional source 'book-fixture' v1 (Fictional framework, class 6 Mathematics, language 'en') → organization approval → delivery → teacher import/review → class + assignment → learner enrollment → submit. The learner submit path executes the real `submitClassworkResponses` service including its stale-revision guard, changed-payload conflict, class-scoping deny and idempotent replay.

## Acceptance criteria → evidence

- Backend suite: 9 tests, 9 pass (SC06-01..09) through the draft validator.
- Frontend suite: 5 tests, 5 pass (SC06-01/03/04/05/06 against the real service boundary).
- R1 probe: weakened fixtures → suite fails; restored → passes.
- R2 probe: intentionally broken assertion → normal check fails; restored → passes.
- Existing regressions: full frontend suite on this candidate -> green (existing glob `tests/*.test.mjs`: all pass; the nested scope-06 suites run through the registered check.mjs step); v1 `check.mjs` green before the suites were added.
- Boundary honesty: forged-field denial is labeled a SHAPE denial (authorization denial stays with the connected server per the v1 README); the class-scoping deny is asserted with the service's actual message ('not open for submissions in your class'); preview/local fixtures are labeled shape-and-flow evidence, not server authorization proof.

## Commands, exit codes, test counts and timestamps

- `node --test backend/tests/contracts/scope-06/scope-06.test.mjs` → 9 pass, 0 fail (2026-10-29/30 work session).
- `node --test frontend/tests/contracts/scope-06/scope-06.test.mjs` → 5 pass, 0 fail.
- `node integration/contracts/v1/check.mjs` → green (unchanged).
- R1 weakening probe → fail 8/9 weakened; 9/9 restored. R2 negative probe → `node scripts/check.mjs` exit 1 with the wrong-code marker; restored.
- Full frontend regression suite on this candidate: recorded in the Jira handoff comment (npm test in frontend/).
- Whole-repo context: this candidate is based on dev f61292ef; the 8 lane candidates (KAN-45/71/79/147/148/159/160/207) remain separate Testing items with their own SHAs.

## Remaining defects, limitations and linked open gates

- Draft validators are not installed into product runtime (v1 README); connected server/store authorization, two-device and hosted evidence remain with the linked gates.
- KAN-29 released curriculum/language/source selection, KAN-30 affected contract freeze, policy/consent/store/runtime/hosted and feature gates remain separate and open.
- No runtime product code was modified: the four + two changed files are test/registration/handoff files only (product trees unchanged from dev).

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence; the prior Codex review cannot approve this Codex-authored replacement)
