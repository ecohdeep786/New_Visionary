# KAN-110 — PRIV-01 — approve purpose/minimization/retention by data class, including auth/device metadata, learning text, source files, billing/audit and model artifacts; define supported age/admission/guardian flows

## Task review and verification handoff

Jira key / source ID: KAN-110 (PRIV-01)
Acceptance scope: feature-enabler (backend-owned privacy core; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-110-privacy-core`; based on the latest lane head `768306c7` (KAN-87 AI-05 scoped cache), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-110-privacy-core`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/privacycore/privacy-core-types.ts` (DataClass, AccessRule, RetentionRule, DataClassPolicy, PrivacyPolicy, GuardianFlowState, PrivacyError)
- `backend/upstream/backend/src/privacycore/privacy-policy.ts` (the shipped approved policy for the five data classes + the fail-closed validator with completeness checks)
- `backend/upstream/backend/src/privacycore/privacy-core-lookups.ts` (PrivacyPolicyStore seam + InMemoryPrivacyStore contract-true state)
- `backend/upstream/backend/src/privacycore/privacy-core-service.ts` (PrivacyCoreService — accessCheck, minimize, requestErasure with derived-cache revocation, guardianFlow, collectArtifact)
- `backend/upstream/backend/src/privacycore/index.ts`
- `backend/upstream/backend/tsconfig.privacycore.json`
- `backend/tests/contracts/privacycore/privacy-core.test.mjs` (PRIV-01 suite, 6 tests)
- `scripts/privacycore-check.mjs`, `package.json` (`privacycore:check`)
Prerequisites: parent KAN-10/PRIV family; the lane head (CONTENT+LEARN+BUILD+AI+CACHE lineage) is the base; CACHE-01/AI-05 revocation composes into erasure.

## Requirement

Approve purpose/minimization/retention by data class, including auth/device metadata, learning text, source files, billing/audit and model artifacts; define supported age/admission/guardian flows. Exit: real-user data has enforceable access, lifecycle and support procedures.

## Acceptance criteria → evidence

- Criterion: the shipped policy is EXECUTABLE and complete — it passes every invariant, covers exactly the five approved data classes (missing and orphan classes refuse), every retention is explicit and justified, and tampering is detectable.
  - Evidence: test "the shipped policy passes every invariant and covers EXACTLY the five approved data classes; tampering detectable".
- Criterion: access is ENFORCEABLE per class — owner classes deny strangers (uid+workspace); operator-scoped classes (billing/audit) deny ordinary users; system classes (model artifacts) deny every interactive actor.
  - Evidence: test "access is ENFORCEABLE per class: owner classes deny strangers; operator classes deny ordinary users; system classes deny all interactive".
- Criterion: minimization is ENFORCED at collection — a field the class forbids refuses (`field_not_minimized`), fail closed rather than silently dropped.
  - Evidence: test "minimization is enforced: a forbidden field refuses (fail closed, not silently dropped)".
- Criterion: erasure is EVENT-DRIVEN and covers derived state — an owner erasure request immediately revokes authorization + derived caches (CACHE-01/AI-05 composition) and deletes the erasable classes; billing/audit is honestly reported as retained per its legal minimum (no invented deletion TTL; no TTL "hopes the data away").
  - Evidence: test "erasure is EVENT-DRIVEN and covers derived state; legal-minimum classes reported honestly as retained".
- Criterion: model artifacts refuse raw private text (`raw_text_in_artifact`) — redacted placeholders collect fine (KAN-91 composition).
  - Evidence: test "model artifacts refuse raw private text; redacted artifacts collect fine".
- Criterion: age/admission/guardian flows are EXPLICIT — adult learners are self-serve; under-admission-age learners without guardian consent refuse processing (`guardian_required`); with active guardian consent processing is permitted and explicitly labeled (`guardian_active`).
  - Evidence: test "age/admission/guardian flows are explicit: under-age without guardian consent refuses; with consent permitted".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; Settings/Privacy surfaces consume the receipts at cutover.
  - API: N/A in the enabler; privacy controllers call the service at cutover with the authenticated actor.
  - Backend: PrivacyCoreService implements enforceable access, minimization, event-driven erasure, guardian flows.
  - Data: in-memory store mirrors ownership/erasure/artifacts; Cloud SQL adapter at integration resolves from per-class tables; the shipped policy is the approved policy record.
  - Jobs/ML: erasure composes with CACHE-01/AI-05 revocation and KAN-85 service identity revocation at cutover; model artifacts stay redacted-only with no automatic training.

## Commands, exit codes, test counts and timestamps

- Privacy core compile + suite: `node scripts/privacycore-check.mjs` → tsc `tsconfig.privacycore.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `scopedcache:check` (KAN-87) → 5 pass/0 fail; `benchmark:check` (KAN-83) → 4 pass/0 fail; `contextassembly:check` (KAN-149) → 8 pass/0 fail; `mlresilience:check` (KAN-91) → 4 pass/0 fail; `qualityscope:check` (KAN-138) → 6 pass/0 fail; `modalities:check` (KAN-92) → 5 pass/0 fail; `deadline:check` (KAN-90) → 6 pass/0 fail; `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- The approved policy values (retention days, admission age) are product/privacy-review decisions recorded in the shipped policy; changing them is a reviewed policy change, not a code change.
- Hosted verification and real support-procedure drills remain open gates; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-110 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: PRIV-02..07 (export/deletion UX flows, consent ledger, support procedures) build on this core; LEARN-14 and ROLE-04 wait on it.
