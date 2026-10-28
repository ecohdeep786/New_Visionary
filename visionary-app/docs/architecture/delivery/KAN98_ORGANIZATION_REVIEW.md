# KAN-98 — ROLE-06 — organization membership/roles, approved curriculum publication, settings permissions, audited admin actions

## Task review and verification handoff

Jira key / source ID: KAN-98 (ROLE-06)
Acceptance scope: feature-enabler (backend-owned organization domain; controller wiring and org adapters happen at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-98-org-membership`; based on the latest lane head `deb8c1d9` (KAN-97 ROLE-05 professional records), per D-098 (lane lineage …94 → 95 → 97 → 98).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-98-org-membership`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/organization/organization-types.ts` (OrgOwner, OrgRole, OrgMembership, OrgInvite, CurriculumItem, AuditEntry, OrgError)
- `backend/upstream/backend/src/organization/organization-lookups.ts` (OrganizationStore seam + InMemoryOrganizationStore contract-true state)
- `backend/upstream/backend/src/organization/organization-service.ts` (OrganizationService — createOrg, inviteMember, joinByInvite, changeRole, defineCurriculum, approveCurriculum, publishCurriculum, readCurriculum, updateSettings, getAuditLog)
- `backend/upstream/backend/src/organization/index.ts`
- `backend/upstream/backend/tsconfig.organization.json`
- `backend/tests/contracts/organization/organization.test.mjs` (ROLE-06 suite, 6 tests)
- `scripts/organization-check.mjs`, `package.json` (`organization:check`)
Prerequisites: parent KAN-9; ROLE-05 (KAN-97, delivered `deb8c1d9` on this lane) is the preceding lane head; DATA-04 (KAN-39) invitation infrastructure is in the base.

## Requirement

Implement organization membership/invitations/roles, approved curriculum delivery/publication, settings permissions and scoped audited administrative actions (source: docs/architecture/BACKEND_LAUNCH_CHECKLIST.md ROLE-06; KAN-98 description).

## Acceptance criteria → evidence

- Membership/invitations/roles — admin-only invites with learner-bound role + opaque code + expiry; the exact invitee joins (`invite_invalid` uniformly for unknown code/wrong invitee — no leak); expiry (`invite_expired`) and revocation (`invite_revoked`) refuse; duplicate joins are idempotent; the owner role is immutable via changeRole.
  - Evidence: tests "membership lifecycle…" and "uniform invite refusal…".
- Role checks per operation — members refuse admin actions (`not_org_admin`); curriculum delivery requires CURRENT membership (`not_org_member`); unknown org denies uniformly (`not_owner`, no existence leak).
  - Evidence: test "ROLE checks…".
- Approved curriculum delivery/publication — publishing an unapproved item refuses (`curriculum_not_approved`); approval records a named approver; unpublished curriculum is not readable by members; published curriculum is delivered to current members only.
  - Evidence: test "APPROVED curriculum publication…".
- Settings permissions — settings updates are admin-only (`settings_admin_required` semantics via `not_org_admin`).
  - Evidence: test "SETTINGS permissions…".
- Scoped audited administrative actions — every admin action (invite, role change, settings update, publish) appends an append-only audit entry (actor, action, target, org scope); the log is byte-stable on re-read and admin-readable only (`not_org_admin` otherwise).
  - Evidence: test "SCOPED audited administrative actions…".
- Cross-layer closure: Frontend — N/A in the enabler. API — controller wiring binds validated schemas at cutover. Backend — OrganizationService composes the ROLE-05 professional-domain stance (company scope) and the DATA-04 invitation stance. Data — Cloud SQL adapter at integration resolves from org_membership (unique org+uid), org_invite, org_curriculum (unique org+curriculum+version), org_audit (append-only) tables.

## Commands, exit codes, test counts and timestamps

- Organization compile + suite: `node scripts/organization-check.mjs` → tsc `tsconfig.organization.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-29).
- Lane regressions: all 36 modules on this candidate, 0 failures (organization 6, professional 6, submissions 7, assignment 7, classroom 6, sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8).
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; organization adapters and two-device membership journeys are cutover work.
- Curriculum content delivery binds the content lane (CONTENT-03/KAN-62 publication infrastructure) at cutover; audit-log retention/export binds the operations gates.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
