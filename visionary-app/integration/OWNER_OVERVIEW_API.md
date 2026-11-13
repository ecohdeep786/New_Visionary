# Owner overview API — DATA-07 / KAN-42

The registered product backend exposes `GET /api/overview` and continuation
routes `/api/overview/{workspaces,memberships,consents,history,audit}`. All require
the current verified session/device cookies and matching `X-Visionary-Account`.
No UID, workspace selector or role claim is accepted from query parameters.
Responses are `Cache-Control: no-store`; reads use the account-overview rate
budget and do not extend idle sessions.

Overview returns UID, server `asOf`, an allowlisted profile/email hint and billing
summary from the existing Firestore owners, fixed redaction metadata, and five
first pages. Each page is `{items, nextCursor: {value} | null, hasMore}`. Pass the
cursor verbatim as `after`; `limit` is an integer 1–50, default 20. Records are
ordered by immutable ID. Foreign/missing cursors yield empty pages; the owning
UID and current workspace authority are rechecked on every page. SQL selects
public fields before materialization and fetches at most limit+1 rows.

Workspaces use the viewer's current membership role, with OWNER derived from
canonical ownership. A copied OWNER membership is not ownership. Revoked
memberships and workspace/person tombstones hide protected records; erasure
markers do not expire into access. Command payloads/results, raw errors, tokens,
session/device IDs, IP addresses, user agents and payment identifiers are absent.
Consent state is derived from current expiry/revocation; this read cannot grant,
renew or revive consent. No projection claims source rights or learner mastery.

Missing session returns 401; stale account header 409; denied/erased SQL actor
403; malformed pagination 400. Disabled/misconfigured/unavailable stores return
503 with a bounded message and no partial account result. No in-memory fallback
is registered in the product.

## Activation and scope

`DATA_OVERVIEW_ENABLED` defaults to disabled. Reviewed activation reuses
`DATA_WORKSPACE_DATABASE_MODE`, `DATA_WORKSPACE_ENVIRONMENT_ID`,
`DATA_WORKSPACE_RUNTIME_URL`, `DATA_WORKSPACE_RUNTIME_ROLE`,
`DATA_WORKSPACE_SCHEMA`, and the existing Cloud SQL instance/database settings.
Modes are `synthetic` (nonproduction disposable loopback database only) and
`cloud-sql` (reviewed project/region/socket target). Pools are bounded to three
connections, with bounded wait/connect/query/transaction timeouts. Actual role,
schema and database are checked in every transaction; privileged, DDL-capable,
schema-owning or migration-metadata-controlling identities are rejected. Cached
clients cannot survive a configuration/identity-realm change.

Live realm is exactly `visionary-research` and the literal Firestore database
`default`; `(default)` is a different database. An explicit test-only exception
requires NODE_ENV=test, `DATA_OVERVIEW_TEST_ENABLED=true`, demo project
`demo-visionary-kan42`, loopback Auth/Firestore emulators, disposable database
`visionary_data_test_kan42`, and generated `data02_<32 hex>` schema. It cannot
activate production, a foreign demo project or a live UID schema.

This backend capability is ready for reviewed client adapters; it does not edit
or activate existing frontend journeys. Hosted rollout, Cloud SQL provisioning,
real-user policy approval and broader role-screen acceptance retain their own
platform/privacy/ROLE-08 gates. Local emulator evidence does not close them.

## Verification

Focused unit/config/HTTP/real-SQL suite:
`node --test backend/tests/contracts/data-07/*.test.mjs` with a disposable
`DATA_TEST_DATABASE_URL`. Registered by `scripts/domain-check.mjs`.

Manual Chromium gate: `node backend/tests/contracts/data-07/overview-browser.mjs`
with the script's explicit loopback emulator/database targets and `CHROME_PATH`.
It uses the actual FirebaseProductModule, Firebase Admin session verification,
Firestore account/billing state and PostgreSQL owning store. It tests owner and
member roles, pagination, account switch, membership removal, tombstones, loss
and restoration of SQL SELECT privilege, feature-disabled recovery, and absence
of partial responses. Receipt/capture stay in ignored `artifacts/qa/kan42/`.
