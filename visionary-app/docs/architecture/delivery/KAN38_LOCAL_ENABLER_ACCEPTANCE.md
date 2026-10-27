# KAN-38 local backend enabler acceptance handoff

27 October 2026. Implementer/integrator: Codex `/root`. Independent reviewer:
`/root/kan38_review`; source decision is recorded in
[the exact-source review](../reviews/KAN38_INDEPENDENT_REVIEW.md).

Acceptance scope: durable personal-workspace provisioning backend enabler and
its guarded opt-in product API. Runtime implementation is
`1b4ea2a7034976c548eca44b2c98b328d8de493d`; reviewed/tested candidate is
`a05caa540b559781522c079328f9b69e1397a503`. Base/current accepted dev comparison:
`f61292efaf6940ec1acc1751a61cb4a7dd17e66b`. Later handoff/review commits retain
these exact implementation identities; final branch head must still pass CI.

## Accepted behavior and evidence

- Current server session/device, Origin/CSRF and expected-account checks derive
  UID. Explicit runtime-only SQL credentials, target/schema/privilege admission
  and ten commands per UID per minute precede domain writes. Default-disabled
  startup creates no SQL pool or migration.
- Workspace, OWNER membership, immutable command receipt, audit and outbox share
  one real PostgreSQL transaction. Replay, changed command, concurrent first
  creation, tombstone/owner denial and real rollback/recovery are tested.
- Firestore pending -> SQL commit -> Firestore completion is a recoverable
  protocol, not distributed ACID. Exact project/database/mode/SQL target binding
  prevents local links from becoming production links. Live reconciliation and
  a new-service replay passed with an existing enabled verified identity; one
  workspace, receipt and outbox were retained. Account root/billing hashes and
  the production link were unchanged. The local SQL target is retained outside
  Git and stopped when idle. See the [sanitized live receipt](evidence/KAN38_LIVE_FIRESTORE_2026-10-27.json).
- The founder signed in through the actual local Firebase product. Home, Learn,
  Ask, Practice, Build and Privacy loaded under the Professional role. Full Home
  reload restored the server-backed session. Phone390x844 and tablet768x1024
  Home layouts were visually inspected; document width equaled client width at
  both sizes. Default viewport was restored; no console errors were recorded.
  Source/privacy/local-preview disclosures remained visible. Raw screenshots
  stay outside Git; their hashes are in the [browser receipt](evidence/KAN38_LOCAL_BROWSER_2026-10-27.json).

This browser exercise verifies existing product regression. It does not create
or accept a frontend SQL workspace switch, a model response, a guardian grant,
another role's journey or hosted two-device domain behavior. No personal work,
sharing permission, billing plan or provider password was changed.

## Verification

Exact candidate [CI40459938688](https://github.com/ecohdeep786/New_Visionary/actions/runs/40459938688)
passed: scripts82, API contracts35, frontend624, PostgreSQL DATA-01 20,
DATA-02 39 and real DATA-03 11. Deployed dependency-lock tests99 plus the same
11 real provisioning cases passed. Real migration-container execution, guarded
rollback, actual non-root offline API image/client/route and infrastructure
JS31/Python11 passed. Production deployment was skipped.

Independent reviewer checks: source62, six additional real SQL/Firestore probes,
focused unchanged-deadline migration rollback1 and corrected real HTTP1 passed.
Earlier local full runs had one transaction timeout and later harness scheduling
timeouts; they are preserved as failed attempts, not counted as passes. Final
Linux CI supplies the complete final suites. Browser automation initially stalled;
a fresh ready product tab and user sign-in subsequently supplied the actual
browser result above.

## Integration and remaining gates

Jira remains Testing until final handoff review, checked/published dev integration
and its actual transition receipt. Integrate only this reviewed source into dev.
Main promotion and production enablement are not authorized by this acceptance.

The existing accepted KAN-36 workspace DDL and Done KAN-37 local migration enabler
support this local scope. Full KAN-36 models/policy and KAN-39..44 remain open.
Hosted SQL/IAM/network/secret/operations, content/source/ML/privacy/retention,
provider/load/recovery and release gates stay open. Local PostgreSQL and existing
real Firebase satisfy local development; no paid development cloud service was
created. Cleanup waits for published integration, passed checks and actual Done.
