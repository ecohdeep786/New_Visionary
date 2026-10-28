# KAN-99 — ROLE-07 — authorized reports with provenance, permitted periods, approved aggregation/suppression

## Task review and verification handoff

Jira key / source ID: KAN-99 (ROLE-07)
Acceptance scope: feature-enabler (backend-owned reports domain; controller wiring and real recipient adapters happen at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-99-authorized-reports`; based on the latest lane head `33aaf319` (KAN-96 ROLE-04 guardian), per D-098 (lane lineage …101 → 96 → 99).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-99-authorized-reports`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/reports/reports-types.ts` (ReportOwner, RecipientType, ReportRules, ReportPeriod, ReportDataRow, GeneratedReport, ReportError)
- `backend/upstream/backend/src/reports/reports-lookups.ts` (ReportsStore seam + InMemoryReportsStore contract-true state)
- `backend/upstream/backend/src/reports/reports-service.ts` (ReportsService — defineRules, approveRules, generateReport, getReport)
- `backend/upstream/backend/src/reports/index.ts`
- `backend/upstream/backend/tsconfig.reports.json`
- `backend/tests/contracts/reports/reports.test.mjs` (ROLE-07 suite, 6 tests)
- `scripts/reports-check.mjs`, `package.json` (`reports:check`)
Prerequisites: parent KAN-9; no hard task prerequisite (Jira: phase/shared prerequisites remain in the parent epic). Composes the lane stances: ROLE-01/04/06 recorded relationships (authorization seam), KAN-96 private-content boundary, KAN-139 record discipline.

## Requirement

Implement authorized teacher/guardian/organization reports with provenance, permitted periods and approved aggregation/suppression rules; exclude private learner chat and drafts by default (source: BACKEND_LAUNCH_CHECKLIST.md ROLE-07; KAN-99 description).

## Acceptance criteria → evidence (backend/tests/contracts/reports/reports.test.mjs, 6 tests)

- APPROVED rules required — generation refuses an unapproved rules version (`rules_not_approved`), an unknown version (`rules_version_unknown`), and an empty approver at approval time.
- AUTHORIZED recipients — generation requires the owning store to authorize the recipient against the recorded relationships; unauthorized recipients and unauthorized subjects refuse uniformly (`recipient_not_authorized`, no leak).
- PERMITTED periods — inverted periods and periods exceeding the rules' maximum length refuse (`period_invalid`); periods are bounded, never open-ended.
- PRIVATE CONTENT EXCLUDED BY DEFAULT — data rows carrying private chat/draft content keys (metric or cohort) refuse at generation (`private_content_forbidden`); no override flag exists.
- APPROVED aggregation/suppression — per-cohort aggregation; cohorts below the rules' minCohortSize suppress and are LISTED in suppressedBuckets (never silently merged into other buckets).
- PROVENANCE + determinism — every report carries rules id/version, the exact period, generated-by/time; identical inputs produce a byte-stable report body (asserted excluding ids/timestamps).
- Append-only history — reports are recipient-scoped on read (`not_owner` for others).
- Cross-layer closure: Frontend — N/A in the enabler. API — controller wiring binds validated schemas at cutover. Backend — ReportsService composes the recorded relationships (ROLE-01 classroom, ROLE-04 guardian grants, ROLE-06 organization scope) via the authorization seam. Data — Cloud SQL adapter at integration resolves from report_rules (versioned), generated_report (append-only) tables.

## Commands, exit codes, test counts and timestamps

- Reports compile + suite: `node scripts/reports-check.mjs` → tsc `tsconfig.reports.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-29).
- Lane regressions: all 39 modules on this candidate, 0 failures (reports 6, guardian 6, entitlement 6, organization 6, professional 6, submissions 7, assignment 7, classroom 6, sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8).
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- The authorization seam binds the real ROLE-01/04/06 stores at cutover; the released report catalog (which metrics per recipient type) is cutover evidence with the founder's approved rules versions.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
