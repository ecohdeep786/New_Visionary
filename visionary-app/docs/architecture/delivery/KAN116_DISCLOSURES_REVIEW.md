# KAN-116 — PRIV-07 — complete required launch privacy/commercial disclosures and content/model/provider rights review with accountable owners; record approvals separately

## Task review and verification handoff

Jira key / source ID: KAN-116 (PRIV-07)
Acceptance scope: feature-enabler (backend-owned disclosure/rights registry; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-116-disclosures`; based on the latest lane head `c2b74dba` (KAN-115 PRIV-06 negative authorization), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-116-disclosures`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/disclosures/disclosure-types.ts` (AccountableOwner, Disclosure, DisclosureApproval, RightsReview, DisclosureError)
- `backend/upstream/backend/src/disclosures/disclosure-lookups.ts` (DisclosureStore seam + InMemoryDisclosureStore contract-true versioned state)
- `backend/upstream/backend/src/disclosures/disclosure-registry.ts` (DisclosureRegistry — recordDisclosure, approve (separate version-bound records), publish, recordRightsReview, launchChecklist)
- `backend/upstream/backend/src/disclosures/index.ts`
- `backend/upstream/backend/tsconfig.disclosures.json`
- `backend/tests/contracts/disclosures/disclosure.test.mjs` (PRIV-07 suite, 5 tests)
- `scripts/disclosures-check.mjs`, `package.json` (`disclosures:check`)
Prerequisites: parent KAN-10/PRIV family; the lane head (CONTENT+LEARN+BUILD+AI+CACHE+PRIV lineage) is the base.

## Requirement

Complete required launch privacy/commercial disclosures and content/model/provider rights review with accountable owners; record approvals separately. Exit: real-user data has enforceable access, lifecycle and support procedures — with the disclosures and rights review to match.

## Acceptance criteria → evidence

- Criterion: disclosure drafts require an ACCOUNTABLE OWNER — a disclosure without an owner refuses (`owner_required`).
  - Evidence: test "disclosure drafts require an ACCOUNTABLE OWNER (missing owner refuses)".
- Criterion: approvals are SEPARATE RECORDS binding the EXACT version (approver identity + date) — the disclosure object never self-approves; approving v1 does not approve v2 (`not_approved`); the approved version still publishes.
  - Evidence: test "approvals are SEPARATE records binding the EXACT version — approving v1 does not approve v2; the disclosure never self-approves".
- Criterion: publishing requires a matching approval for the exact version — an unapproved disclosure refuses (`not_approved`); an unknown disclosure refuses (`unknown_disclosure`).
  - Evidence: test "publishing requires a matching approval for the exact version — an unapproved disclosure refuses".
- Criterion: RIGHTS REVIEW — every launch content source, model and provider requires a review with an accountable owner and a reviewed rights scope; a missing review reports honestly (`missing`).
  - Evidence: test "RIGHTS REVIEW: every launch content/model/provider needs a review with an accountable owner; a missing review reports honestly".
- Criterion: the launch checklist reports approved vs pending per item — never a blanket claim (approved and pending disclosures coexist honestly).
  - Evidence: test "the launch checklist reports approved vs pending per item — never a blanket claim".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; the launch checklist feeds the founder's acceptance review at cutover.
  - API: N/A in the enabler; disclosure controllers call the registry at cutover.
  - Backend: DisclosureRegistry implements accountable, version-bound, separately-approved disclosures and rights reviews.
  - Data: in-memory store mirrors disclosures/approvals/rights reviews; Cloud SQL adapter at integration resolves from disclosure/approval/rights_review tables.
  - Jobs/ML: the rights reviews bind the provider scope gate (KAN-84) and quality collection (KAN-138) at cutover — an unreviewed provider is never authorized by those gates.

## Commands, exit codes, test counts and timestamps

- Disclosure compile + suite: `node scripts/disclosures-check.mjs` → tsc `tsconfig.disclosures.json` exit 0; `node --test` → 5 tests, 5 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `negativeauth:check` (KAN-115) → 5 pass/0 fail; `supportcases:check` (KAN-114) → 6 pass/0 fail; `notifications:check` (KAN-113) → 7 pass/0 fail; `restoretombstone:check` (KAN-112) → 6 pass/0 fail; `privacyjobs:check` (KAN-111) → 5 pass/0 fail; `privacycore:check` (KAN-110) → 6 pass/0 fail; `scopedcache:check` (KAN-87) → 5 pass/0 fail; `benchmark:check` (KAN-83) → 4 pass/0 fail; `contextassembly:check` (KAN-149) → 8 pass/0 fail; `mlresilience:check` (KAN-91) → 4 pass/0 fail; `qualityscope:check` (KAN-138) → 6 pass/0 fail; `modalities:check` (KAN-92) → 5 pass/0 fail; `deadline:check` (KAN-90) → 6 pass/0 fail; `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL wired yet; real adapter swap + controller wiring happen at cutover.
- The actual disclosure TEXTS and the accountable-owner assignments are founder/product decisions recorded through this registry — the enabler owns the accountable, version-bound, separately-approved contract, not the legal text.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-116 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: the PRIV family (PRIV-01..07) is complete through this head; the next eligible family is BILL-01..08 (all unblocked).
