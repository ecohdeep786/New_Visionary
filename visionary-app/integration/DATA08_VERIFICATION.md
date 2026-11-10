# DATA-08 — actual-store concurrency and capacity verification

This is an engineering verification gate, not a second permission system. The
submitted ConcurrencyProver and Map-based pool are withdrawn: they accepted
unknown resources/unowned commands, allowed two simultaneous fresh grants, and
mistook local busy records for fleet socket capacity. No product consumer used
them. Authority remains in the accepted owning repositories and registered
session/account boundary.

The DATA-08 suite now drives actual PostgreSQL repositories:

- Two independent clients race grants and receive one canonical grant, audit
  and outbox record. Real SQL locks serialize revocation ahead of a competing
  grant or delivery; a closed version cannot reactivate and denied delivery
  performs no callback write. Tests observe actual database lock waiters.
- Wrong actor/workspace and a non-owner ADMIN cannot commit owner-only metadata.
  Concurrent changed-account replay is rejected. Competing expected revisions
  admit one write; identical command retries retain one receipt/audit/outbox.
- A real database backend is terminated, the failed client pool explicitly
  retired/reconnected, and the same command identity replayed. Its committed
  result survives without another receipt/outbox. No automatic driver recovery
  or safe retry of a new ambiguous command is claimed.
- Independent child processes each open a real one-connection Prisma pool.
  Three fit a test role's actual limit; a fourth is rejected. Closing one pool
  restores admission. The test measures pg_stat_activity, not simulated spans.

The selected product graph currently constructs four SQL pools, each capped at
three connections. Tests discover them from imports and verify their URL bounds.
Release checks verify revision instance caps and reject a service whose shared
cap drifted. These are configuration checks, not a hosted deployment observation.

## Capacity preflight

`connectionBudget(plan)` validates integer capacity inputs:

`demand(role) = maxInstances × revisionOverlap × sum(poolsPerInstance)`

Each role limit must cover its demand; sum(role limits) plus reserved capacity
must fit the database capacity. Include all roles/pools/overlapping revisions.
Unknown fields, unsafe arithmetic, duplicate/unlimited roles and invalid counts
fail closed. Example numbers in tests are synthetic, not production sizing.

`verifyPostgresConnectionBudget(client, plan)` observes actual max_connections,
server-reserved slots and role login/privilege/connection limits. Missing,
unlimited, privileged or replication roles, server/config drift and mutation of
the plan during observation fail. It is read-only: it does not create roles,
install a pooler, alter production or change Cloud Run scale.

PostgreSQL role limits cover normal connections, exclude background workers and
prepared transactions, and can conservatively reject simultaneous starts. They
do not apply to superusers; privileged roles are refused. See the
[PostgreSQL role documentation](https://www.postgresql.org/docs/17/sql-createrole.html).
This gate does not certify distributed scheduling, load qualification or
continuous fleet enforcement. Hosted rollout still requires actual service,
revision/worker/pool inventory, reserves/role limits and observation/load/recovery
evidence under platform acceptance.

Run after data compilation with disposable loopback DATA_TEST_DATABASE_URL.
scripts/domain-check.mjs registers the suite in CI. The accepted product browser
gate supplies real emulator-session/account-switch/membership/tombstone/SQL
outage recovery evidence; DATA-08 changes no frontend source or product route.
