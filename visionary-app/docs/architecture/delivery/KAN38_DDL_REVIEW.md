# KAN-38 (DATA-03) — Idempotent personal workspace provisioning

```text
Jira key / source ID: KAN-38 (DATA-03)
Acceptance scope: preparation / enabler (pure tested module; NOT wired into the
                 connected runtime; no SQL migration applied, no live database)
Implementer: deepseek (senior principal backend engineer, under codex)
Reviewer: Pending — separate exact-SHA review required; not pre-assigned
Worker branch / base commit / candidate head:
                 branch codex/deepseek-kan-38-workspace-provisioning
                 base 9d6d2b5b0e97213ff2e8778c2a1d7469d8df554e (origin/dev)
                 candidate head <filled at commit>
Current dev commit: origin/dev 9d6d2b5b (unchanged by this branch)
Owned files:
  - backend/upstream/backend/src/workspaces/provision-types.ts
  - backend/upstream/backend/src/workspaces/provision-store.ts
  - backend/upstream/backend/src/workspaces/workspace-provisioner.ts
  - backend/upstream/backend/src/workspaces/index.ts
  - backend/upstream/backend/tsconfig.data.json
  - backend/tests/contracts/data-03/provisioning.test.mjs (10 tests)
  - docs/architecture/delivery/KAN38_DDL_REVIEW.md (this handoff)
Prerequisites: KAN-36 (DATA-01) / KAN-37 (DATA-02) under Testing; not merged.
               DATA-03 builds on the same UID/personal-workspace shape; the SQL
               schema is adopted at integration (single source of truth remains
               prisma/migrations). No shared migration file was modified.

Acceptance criteria → evidence (each verified by an in-repo test):
- Idempotent provisioning → first provision creates Person + personal workspace
  + OWNER membership once; same command id + payload replays the same workspace
  with zero duplicates (tests: provision once; idempotent replay; memberships=1).
- Pending/recovery state → an interrupted run (after Person, or after workspace
  but before membership) resumes and completes without duplicates or conflicting
  workspaces, and reports recovered=true (tests: person-only resume; workspace
  membership repair).
- Server authority / wrong-owner → a client-supplied uid differing from the
  verified uid is rejected; a command belonging to another account cannot be
  replayed; a payload may not carry a foreign uid or another account's personal
  workspace id (tests: three deny cases + wrong-owner foreign reference).
- Duplicate/cancelled work → same command key with a changed payload is rejected;
  invalid/blank command id is rejected and nothing is provisioned
  (tests: changed-payload reject; invalid command).
- Preserve Firestore account/profile/billing → provisioning never writes account/
  billing paths; emulated Firestore rows and IDs stay byte-identical
  (test: preserve records and IDs untouched).
- Every domain command server-authorized and transactionally scoped →
  provisioning is driven by the verified uid, writes pending → provisioned,
  records idempotent command receipts (covered across all tests).

Commands / results:
  - node --test backend/tests/contracts/data-03/provisioning.test.mjs → 10 pass, 0 fail
  - node --test scripts/tests/backend-runtime.test.mjs → 3 pass, 0 fail
  - combined 13 / 0
  - npm run product:verify-layout → PASS
  - tsc (tsconfig.data.json) → exit 0
  Environment: in-memory synthetic store (no live Cloud SQL/Firestore touched).

Remaining defects / limitations / linked open gates:
  - No live Cloud SQL/Firestore was used; the store is the in-memory synthetic
    bridge. Real cross-store (Firestore → Cloud SQL) provisioning runs at
    integration under PLAT/TEST work; hosted acceptance remains open.
  - DATA-03 does not close DATA-01/02, DATA-04..09 or PLAT gates; LEARN-01 is
    unblocked only after acceptance and connected integration.
Hosted / migration / rollback evidence: none performed; review-only.
Reviewer decision / verification / dev integration: pending — cannot self-approve.
Next dependent task: KAN-39 (DATA-04) → invitations/acceptance/verified roles.
```
