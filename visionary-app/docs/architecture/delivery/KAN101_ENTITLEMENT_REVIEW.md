# KAN-101 — ROLE-09 — entitlement reconciles only with real approved commercial contracts

## Task review and verification handoff

Jira key / source ID: KAN-101 (ROLE-09)
Acceptance scope: feature-enabler (backend-owned entitlement-reconciliation domain; real commercial acceptance and billing-lane binding happen at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-101-entitlement-reconciliation`; based on the latest lane head `5adf3c0d` (KAN-100 ROLE-08 role-access gate), per D-098 (lane lineage …140 → 72 → 100 → 101).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-101-entitlement-reconciliation`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/entitlement/entitlement-types.ts` (EntOwner, CommercialContract, SeatRequest, ReconciliationReport, EntitlementError)
- `backend/upstream/backend/src/entitlement/entitlement-lookups.ts` (EntitlementStore seam + InMemoryEntitlementStore contract-true state)
- `backend/upstream/backend/src/entitlement/entitlement-service.ts` (EntitlementService — recordContract, requestSeats, previewSeatRequest, attachAdministrativeAuthority (always refuses), reconcile)
- `backend/upstream/backend/src/entitlement/index.ts`
- `backend/upstream/backend/tsconfig.entitlement.json`
- `backend/tests/contracts/entitlement/entitlement.test.mjs` (ROLE-09 suite, 6 tests)
- `scripts/entitlement-check.mjs`, `package.json` (`entitlement:check`)
Prerequisites: parent KAN-9; no hard task prerequisite (Jira: phase/shared prerequisites remain in the parent epic); ROLE-05 (KAN-97) and ROLE-06 (KAN-98) delivered on this lane are the related stances.

## Requirement

Reconcile organization-sponsored entitlement requirements with real approved commercial contracts; a seat-request preview cannot invent institutional billing or administrative authority (source: BACKEND_LAUNCH_CHECKLIST.md ROLE-09; KAN-101 description).

## Acceptance criteria → evidence (backend/tests/contracts/entitlement/entitlement.test.mjs, 6 tests)

- No invented billing — a preview with NO approved contract reports `no_approved_contract` honestly and creates NO billing artifact (`billingArtifactCreated: false` by construction; the store has no invoice write path); the reconciliation shows zero entitled seats.
- Requests stay REQUESTS — a seat request without a contract records `pending_approval` with no contract binding; sponsorship submission is sponsor-only (`sponsor_only`).
- REAL contract binding — entitlement derives ONLY from an approved, valid contract: seats within bounds entitle with contract provenance (id recorded on the request); a named approver is required (empty approver or non-company principal refuses).
- Seat bound — requests beyond the contract's seat count refuse (`contract_seat_bound_exceeded`).
- Expiry — an expired contract refuses (`contract_expired`); invalid windows refuse at recording.
- NO administrative authority from a request — the attach-authority path ALWAYS refuses (`no_administrative_authority_from_request`); org authority remains ROLE-06's recorded roles.
- RECONCILIATION — a deterministic report (contract seats, requested, entitled, over-bound, active sponsored members) byte-stable on re-read — the input for real commercial acceptance, never a substitute for it.
- Cross-layer closure: Frontend — N/A in the enabler. API — controller wiring binds validated schemas at cutover. Backend — EntitlementService composes ROLE-05 sponsorship and ROLE-06 role stances. Data — Cloud SQL adapter at integration resolves from commercial_contract (unique contract_id), seat_request (company+request), reconciliation is computed from store state. Billing — NO billing write path exists in this domain; real billing remains BILL-04/KAN-105's accepted lane.

## Commands, exit codes, test counts and timestamps

- Entitlement compile + suite: `node scripts/entitlement-check.mjs` → tsc `tsconfig.entitlement.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-29).
- Lane regressions: all 37 modules on this candidate, 0 failures (entitlement 6, organization 6, professional 6, submissions 7, assignment 7, classroom 6, sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8).
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- Real commercial contracts, invoicing and payment acceptance remain BILL-04/KAN-105's lane; this enabler guarantees the product side never invents them.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
