# KAN-38 / DATA-03 durable provisioning rework

26 October 2026. Implementer: Codex /root, continuing the existing DeepSeek
worktree and branch `codex/deepseek-kan-38-workspace-provisioning`.
Accepted dev comparison: `f61292efaf6940ec1acc1751a61cb4a7dd17e66b`.
The branch reconciles that base in `42c6a8a8`; exact rework candidate is recorded
in the subsequent independent-review/Jira submission. Approval is pending.

## Original candidate and findings

Independent reviewer `/root/kan37_final_review` rejected original candidate
`f06e1e2b931e97fdb39aec112e44c4b3b035a722`. Five executable exact-source probes
reproduced concurrent changed-payload success, cross-user global receipt overwrite,
legitimate cross-user key collision, empty UID admission and unstable JSON-order
identity. Its Map/Set implementation had no transaction or durable SQL/Firestore
adapter and no product caller. Its Firestore preservation assertion inspected an
unused Map. Original probe source/results remain outside Git in
`C:/Users/Administrator/Visionary-local/kan38-review/candidate-f06e1e2b/`.

## Current implementation and acceptance scope

Request acceptance of the backend provisioning enabler and its guarded API,
not a frontend workspace cutover or hosted release. The actual product module
registers `POST /api/account/workspace/provision`; existing session verification,
CSRF/origin checks and expected-account binding derive the only authoritative UID.
Input permits a bounded command key and fixed `manual`/`onboarding` source. Client
UID/workspace hints and unknown fields are rejected. Provisioning is disabled by
default, creates no SQL pool while disabled, and never runs migrations on startup.

PostgresProvisionStore uses a real DML-only Prisma client. An actual role/schema/
database and delegated-privilege check precedes writes. The UID anchor serializes
first use; the canonical personal-UID unique index prevents duplicates. Workspace,
OWNER membership, target/UID-scoped command receipt, first-creation audit and outbox
share one transaction. Changed receipts, malformed membership and tombstoned
resources are refused. No raw payload or SQL credential is stored in receipts.

FirestoreProvisionLinks reads the existing original account, requires a consistent
UID/identity/storage version and refuses an active account-storage migration. It
writes only dedicated pending commands and workspace links. It preserves root
account/profile/billing documents. Pending -> SQL commit -> completed link is an
explicit reconciliation protocol, not distributed ACID. If Firestore completion
fails, a retry reads the durable SQL receipt and repairs the link without another
workspace, creation event or audit. Success is returned only after completion.

Both stores bind a canonical environment/target identity including explicit
non-production environment ID, Firestore project/database/mode and SQL project,
region/instance/database/schema. Local/staging links and commands live under
`visionary_accounts/{uid}/developmentWorkspaceLinks/{targetKey}`; they never write
`domainLinks/connections` or production commands. Only the validated production
Cloud SQL target uses the canonical production link. A link is a locator, never a
permission grant. Account/root IDs and role preferences are unchanged.

The production dependency lock now includes the pinned Prisma5.22 runtime client
and build-only generator. The API container generates the same canonical client
and installs its OpenSSL runtime without executing migrations or connecting a DB.
The production-lock verifier also runs the real provisioning cases, and CI checks
the actual non-root API image offline. Runtime URL configuration is separate from
migration credentials; production mode refuses a synthetic loopback target.

## Verification performed

- First full local data check: DATA-01 20, DATA-02 39 and initial DATA-03 8 passed.
- After environment/privilege/account-state corrections: fresh focused compilation
  and all 11 real PostgreSQL + official Firestore-emulator + Nest HTTP cases passed.
- Cases include durable new-client replay, concurrent changed payload/UID isolation,
  same-UID different SQL-target isolation, exact SQL rollback on a real privilege
  failure, completion outage reconciliation, owner/account/migration-state denial,
  tombstone denial, NOINHERIT table/sequence delegation, default-disabled behavior,
  and HTTP session/CSRF/account binding before real store writes.
- Runtime-entrypoint tests3, repository layout and upstream provenance passed.
- Production-lock audit passed the repository high-severity threshold; four
  moderate advisories remain in existing Nest/file-type dependency paths. No
  unrelated breaking framework upgrade is included.

Evidence: `C:/Users/Administrator/Visionary-local/kan38-rework/` logs
`data-check-1.log` and `provision-check-2.log`. PostgreSQL is stopped in the owning
finally block; the pinned emulator and test child are bounded and stopped/reaped.
The official emulator JAR1.22.0 SHA256 and size are checked before execution.
Windows Java initially failed its long AF_UNIX temporary path; a short dedicated
socket directory resolved startup before any result was counted as a pass.

Final candidate CI, production-lock/container result, signed-in in-app product
regression, independent exact-SHA decision, published dev integration and actual
Jira closeout remain pending. No future pass is asserted by this handoff.

## Remaining gates

No GCP database/job/service/IAM resource was created. No live Firestore workspace
record was written by these tests. The existing real Firebase auth/account path
remains available; the founder permits necessary live Firestore integration.
Hosted Cloud SQL/Firebase identity/network/secret/provisioning acceptance, retention/
deletion policy, provider/load/operational recovery and main promotion remain open.
The current frontend still discloses its local domain previews; connecting those
facades, learning/source flows and two-device domain behavior needs separate
accepted work. This does not close full KAN-36, KAN-39..44, ML or KAN-127 gates.
Do not enable production provisioning from a merge alone.
