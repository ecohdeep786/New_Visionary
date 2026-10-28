# KAN-97 — ROLE-05 — separate professional records, sponsored membership, explicit portfolio/project shares

## Task review and verification handoff

Jira key / source ID: KAN-97 (ROLE-05)
Acceptance scope: feature-enabler (backend-owned professional-profile domain; controller wiring and company adapters happen at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-97-professional-records`; based on the latest lane head `89a9e9ab` (KAN-95 ROLE-03 submissions), per D-098 (lane lineage …93 → 94 → 95 → 97).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-97-professional-records`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/professional/professional-types.ts` (ProOwner, RecordScope, ProRecord, Sponsorship, ShareGrant, ProfessionalError)
- `backend/upstream/backend/src/professional/professional-lookups.ts` (ProfessionalStore seam + InMemoryProfessionalStore contract-true state)
- `backend/upstream/backend/src/professional/professional-service.ts` (ProfessionalService — addPersonalRecord, addCompanyRecord, readRecord, sponsorMembership, shareToCompany, revokeShare, companyView, readPersonalLearningAsCompany)
- `backend/upstream/backend/src/professional/index.ts`
- `backend/upstream/backend/tsconfig.professional.json`
- `backend/tests/contracts/professional/professional.test.mjs` (ROLE-05 suite, 6 tests)
- `scripts/professional-check.mjs`, `package.json` (`professional:check`)
Prerequisites: parent KAN-9; no hard task prerequisite (Jira: phase/shared prerequisites remain in the parent epic); BUILD-06 (KAN-80, sharing:check green on this lane) is the related explicit-sharing stance.

## Requirement

Implement separate professional personal/company records, sponsored membership and explicit portfolio/project shares; employer access does not include private personal learning (source: docs/architecture/BACKEND_LAUNCH_CHECKLIST.md ROLE-05; KAN-97 description).

## Acceptance criteria → evidence

- SEPARATE scopes — personal and company records are strictly separate stores (per-scope reads); reading is owner-only (uniform `not_owner`, no leak).
  - Evidence: test "SEPARATE scopes…".
- SEPARATION enforced — a company record whose kind/value carries a personal-learning reference refuses (`personal_learning_forbidden`).
  - Evidence: test "SEPARATION enforced…".
- SPONSORED membership — only a company-side principal grants a sponsorship (`sponsor_only` otherwise); the sponsorship type CANNOT carry personal-learning access (`grantsPersonalLearningAccess: false` by construction).
  - Evidence: test "SPONSORED membership…".
- EXPLICIT portfolio/project shares — company visibility of a personal item exists ONLY through an owner-granted, purpose-bound share; revocation removes it immediately; only the owner revokes.
  - Evidence: test "EXPLICIT shares…".
- EMPLOYER ACCESS BOUNDARY — the company view returns company-scope records + explicitly granted items ONLY; personal learning is structurally absent (count 0; the serialized view contains no personal content) even with an active sponsorship; a company-side personal-learning read ALWAYS refuses (`share_grant_required`); a non-company principal cannot open the company view (`sponsor_only`).
  - Evidence: test "EMPLOYER ACCESS BOUNDARY…".
- Input integrity — invalid definitions refuse (`profile_definition_invalid`); unknown record reads deny uniformly (`not_owner`).
  - Evidence: test "invalid definitions refuse…".
- Cross-layer closure: Frontend — N/A in the enabler. API — controller wiring binds validated schemas at cutover. Backend — ProfessionalService composes the lane's sharing stance (BUILD-06 explicit grants). Data — Cloud SQL adapter at integration resolves from pro_record (scope+owner), pro_sponsorship (unique company+member), pro_share_grant (revocable) tables. Personal learning — the five-way context separation from AI-15/KAN-149 (role/workspace/purpose/language) is preserved; the company scope never receives personal-learning references.

## Commands, exit codes, test counts and timestamps

- Professional compile + suite: `node scripts/professional-check.mjs` → tsc `tsconfig.professional.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-29).
- Lane regressions: all 35 modules on this candidate, 0 failures (professional 6, submissions 7, assignment 7, classroom 6, sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8).
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; company-principal identity (company_<id> uid convention) binds to the real account/organization infrastructure at cutover (ROLE-06 organization membership).
- Sponsored-benefit entitlement evaluation binds the billing/entitlement lane (BILL-04/KAN-105) at cutover.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
