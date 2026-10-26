# Production migration job

This is a separate production-capable image for DATA-02, not a product HTTP
startup hook. It compiles the actual reviewed migration/backfill modules with
an independent minimal lock, generates the Prisma client and includes only the
canonical domain migration. It does not copy legacy migrations/seeds or Firebase
credentials. CI builds the image, checks offline admission, and executes the
compiled entrypoint against disposable PostgreSQL over an isolated Unix socket.
The image test performs staging apply/verify/replay and production-mode
apply/verify using the real pinned staging receipt, then checks rollback denial.
It does not prove hosted Cloud SQL acceptance.
The trusted main workflow publishes its immutable digest in
`published-data-job.json`; it does not deploy or execute a database job.

`migration-command` accepts `plan`, `apply`, `verify` and `rollback`. Explicit
configuration selects synthetic, staging or production. Synthetic test URLs retain
their loopback/database/query guards, and a production process cannot select that
mode. Hosted mode requires the exact `visionary-research:asia-south1:<instance>`
Cloud Run Cloud SQL socket, matching database/schema, distinct authenticated SQL
roles and bounded pools (maximum three connections per identity). Direct public
database endpoints and URL session/options overrides are rejected. The Cloud SQL
connector IAM identity and the SQL login roles are separate layers of authority.
IAM-style role names are supported; actual SQL role and grant checks still apply.

The command reads `DATA_MIGRATION_DATABASE_URL` and `DATA_RUNTIME_DATABASE_URL`
from separately versioned secrets in the job. The product service must receive
only its runtime credential when its owning domain feature is integrated. The job
must use its own environment-specific service account with Cloud SQL connection
and access only to its required secret versions. This code grants no IAM or SQL
permissions. Never give the product HTTP identity a migration secret or job-admin
permission. Never give ML the application or migration writer credential.

`plan.mjs` produces reviewable bounded deploy/execute argument arrays, using an
immutable source/image and environment-qualified secret versions. The planned
job has one task, parallelism one, no automatic retry, one CPU/512Mi and a five
minute task limit. Apply remains transaction-bounded internally. An interrupted
job must reconcile the ledger through verify/retry, not blindly repeat external
effects. Image publication, job deployment and job execution remain distinct.

## Budget and idle operation

Founder instruction on 26 October 2026: keep spending low and optional services
off when unused. This migration workload is an explicitly invoked Cloud Run Job,
with no scheduler, resident worker, minimum instance or automatic retry. A deployed
job definition does not keep a migration process running between executions.
The product release configuration already uses minimum zero/maximum one Cloud
Run instances and request-based CPU. Do not add a warm instance, periodic keepalive,
ML/GPU endpoint, replica or dedicated staging instance without a reviewed need.

Cloud SQL does not automatically start on an application connection. An idle
non-production instance can be stopped explicitly and must be started and checked
before a job runs. Stopping suspends instance charges but storage and IP charges
continue. Never stop a shared instance while the live product, another job or an
active test depends on it. A production database shutdown therefore needs an
availability plan; automatically stopping it from this migration process would
create outages and race other users. The job identity receives no instance-admin
permission, and this change creates no database or paid service.

Before hosted acceptance, record the exact instance/tier/storage and expected
usage budget, dependency ownership, start/readiness/stop procedure and residual
idle charges. Prefer an existing approved instance with a separate synthetic
staging database when appropriate. Start only for the agreed verification window,
reconcile executions and connections, then stop an exclusively owned test instance.
Do not disable service APIs as a substitute for stopping compute.

Provider reference checked in the in-app browser:
https://docs.cloud.google.com/sql/docs/postgres/start-stop-restart-instance

Hosted execution requires `VISIONARY_RELEASE_COMMIT` to equal
`DATA_MIGRATION_APPROVED_SHA`. Production additionally requires a verified staging
receipt with matching source/artifact/instance/schema, a separate synthetic staging
database, exact applied versions and a verification date within seven days. Its
exact bytes are pinned by `DATA_STAGING_RECEIPT_SHA256` and mounted read-only at
`DATA_STAGING_RECEIPT_PATH`. The release operator must retain/review the real
staging execution receipt and pin it; the JSON/hash is not a cryptographic
signature or independent proof that an operator-supplied receipt is genuine.

Initial canonical apply requires an empty domain. Retained-record DDL/rollback
is still refused; the baseline is non-reversible. A future expand/backfill/switch
release needs its own compatible versioned artifact, backups and recovery
acceptance before affecting existing records. Backfill callbacks must remain
transaction-only; external provider/ML effects are not covered by SQL atomicity.

Live console inventory on25 October2026 showed `visionary-product` in Mumbai and
the Cloud SQL Instances setup screen in `visionary-research`. No SQL instance,
new credential, IAM grant or job was created by this change. A concrete approved
Cloud SQL/staging/production resource and access plan is required before hosted
verification. This does not close dependent workspace, source, ML or hosted
feature acceptance. Local/CI checks cannot be described as a live database cutover.
