# KAN-36 (DATA-01) — SQL DDL review and verification handoff

```text
Jira key / source ID: KAN-36 (DATA-01)
Acceptance scope: preparation / enabler (SQL DDL + repository review; not wired
                 into the connected runtime; no SQL migration applied to any
                 shared database; no production/real-user store touched)
Implementer (person or agent): deepseek (senior principal backend engineer,
                 working under codex)
Reviewer (different person or agent; must explicitly accept responsibility):
                 Pending — do not assign on the implementer's behalf
Worker branch / base commit / candidate head commit:
                 branch codex/deepseek-kan-36-data-ddl
                 base 9d6d2b5b0e97213ff2e8778c2a1d7469d8df554e (origin/dev)
                 candidate head 6da9ecf7
Current dev commit / comparison range: origin/dev 9d6d2b5b → candidate 6da9ecf7
                 (only DATA-01 prep files added)
Owned files, contracts and migrations:
  - backend/upstream/backend/prisma/schema.prisma (added Person, Workspace,
    WorkspaceMembership, Invitation, ConsentGrant, ShareGrant, CommandResult,
    OutboxEvent, AuditEvent, DeletionTombstone models)
  - backend/upstream/backend/prisma/migrations/20261024000001_data_01_workspaces/
    migration.sql (reviewed DDL; NOT applied to any shared database)
  - backend/upstream/backend/src/workspaces/workspace.repository.ts
  - backend/upstream/backend/src/workspaces/workspaces.controller.ts
  - backend/upstream/backend/src/workspaces/workspaces.module.ts
  - backend/upstream/backend/src/workspaces/dto/create-workspace.dto.ts
  - backend/upstream/backend/src/app.module.ts (registers WorkspacesModule in the
    LEGACY module only; the connected FirebaseProductModule is unchanged, so no
    runtime endpoint is activated)
  - backend/tests/contracts/data-01/workspace-ddl.test.mjs (26 tests)
  - backend/tests/contracts/data-01/workspace-repository.test.mjs (9 tests)
Prerequisites: live Jira keys and accepted evidence
  - KAN-31 (SCOPE-04 authority mapping) merged to dev / accepted
  - KAN-35 (SCOPE-08 request limits) Done / accepted
  - KAN-29, KAN-30, KAN-32, KAN-33 remain open at review time; this handoff is
    preparation evidence for the DDL review, NOT a claim that the phase gates
    are complete. The founder's ticket instruction ("not activated... reconciled
    and accepted for affected schema scope before implementation is claimed")
    means this must be reviewed as a scoped enabler/preparation, not a full
    feature closure.

Acceptance criteria → evidence:
- UID linkage on every domain table → tested: persons(uid) PK, workspaces/
  command_results/consent_grants/share_grants/outbox_events/audit_events/
  deletion_tombstones all FK to persons(uid); test verifies each FK exists
  (workspace-ddl.test.mjs: 'all domain tables reference persons').
- Workspaces/memberships/consent/source/revision/outbox coverage → DDL defines
  workspaces, workspace_memberships (unique uid+workspaceId, role, source,
  sourceVersion), consent tables with consentVersion, command_results with
  payloadDigest+unique commandId, outbox_events with ordered cursor, audit_events,
  deletion_tombstones.
- No duplication of Firestore account/billing authority → persons table stores
  only uid (no email/password/plan/subscription); test asserts persons has no
  auth/payment fields (workspace-repository.test.mjs: 'SQL persons table does
  not store auth fields' and workspace-ddl.test.mjs: 'no auth/identity/billing
  columns in domain command tables').
- Wrong-owner/reference cases → test 'wrong-owner workspace access is denied';
  'command from one user cannot be replayed by another'; 'membership role
  escalation is denied for non-owner'.
- Duplicate-command cases → test 'duplicate command key with same payload is
  idempotent'; 'duplicate command key with changed payload is rejected'
  (reject same command key with changed payload, per DATA-06 dependency).
- Stale-revision cases → test 'stale revision / concurrent edit conflict'.
- Consent/revocation cases → test 'consent revocation blocks subsequent
  operations'.
- Deletion/retention → DDL defines deletion_tombstones with unique
  (uid, resourceType, resourceId) and expiresAt index; test 'deletion tombstone
  prevents revive of erased records'.
- Frontend → API → backend → data → jobs/ML → cache/observation → device outcome:
  N/A for this enabler (no frontend or API route is activated; the connected
  FirebaseProductModule is unchanged). Reason: DATA-01 is a schema/repository
  review artifact; runtime activation is later work after acceptance.

Commands, exit codes, test counts and timestamps:
  - node --test backend/tests/contracts/data-01/*.test.mjs
    → 35 tests, 0 failures (26 DDL + 9 repository)
  - node --test scripts/tests/backend-runtime.test.mjs
    → 3 tests, 0 failures
  - Combined run 38 tests / 0 failures at 2026-10-24 (local), worktree path
    C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/
    deepseek-kan-36-data-ddl
  - npm run product:verify-layout → PASS
Remaining defects, limitations and linked open gates:
  - No running Postgres was used; the DDL/constraints are verified from the
    migration text and in-memory repository behavior. Real RDBMS + migration
    application (with migration/runtime identity separation, backfill,
    compatibility checks, rollback) is DATA-02 work and remains open.
  - The workspaces controller is registered only in the legacy app module; the
    connected runtime does not expose these endpoints. Activation is later work.
  - KAN-29/30/32/33 acceptance gates remain open; this is preparation evidence.
Hosted verification / migration / rollback evidence, when required by scope:
  - None performed. This is review-only; no migration was applied to any
    shared database and no hosted or real-user store was touched. Applying the
    migration to empty synthetic staging belongs to DATA-02 under exclusive
    schema ownership.

Reviewer decision: pending (implementer cannot self-approve)
Reviewer identity, exact reviewed commit, date and written rationale:
  (to be completed by the independent reviewer)
Verification result: pending
Verifier identity, exact verified commit, environment and evidence:
  (to be completed by the independent reviewer)
Dev integration commit and checks on the integrated result:
  NOT yet — integration into dev follows separate acceptance
Jira transition/comment receipt:
  (recorded on KAN-36)
Next dependent task and proof its other prerequisites are accepted:
  KAN-37 (DATA-02) is the next dependent migration task; it requires this
  DDL review acceptance first.
```
