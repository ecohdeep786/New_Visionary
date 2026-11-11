# KAN-45 / PLAT-01 final review handoff

8 November 2026. Original implementer: principal agent. Corrective implementer
and verifier: Codex `/root`. Separate exact-source reviewer: pending.

Original branch `codex/principal-kan-45-product-env`, submitted candidate
`dcc9c11ad14f6e673f3a778c825284fb63b5304f`. Accepted baseline
`9b0102dfed78f8baf13965dedeba1cc51cadef91`. No replacement branch.

## Scope and history isolation

Reviewed configuration/command/observation enabler extending the accepted
bootstrap foundation; no cloud apply, credential use or hosted acceptance.
Identity creation, private runtime binding, real staging project selection,
DNS/TLS, workload IAM, SQL grants, worker semantics and restore/load qualification
retain their platform/data/job/release gates. Browser UI is N/A: this changes no
product route or frontend source. Existing production-image/API checks in CI
remain the regression gate; no fictional browser result represents deployed GCP.

The accepted `migrationJobPlan` and backend `CloudSqlTarget` still pin
`visionary-research`; they **cannot yet target the project-isolated staging plan**.
Staging database names use `visionary_data_staging_*` to preserve its accepted
database boundary, but new-project migration identity/job/runtime binding must
be separately implemented and reviewed at DATA-02 / PLAT-03..06 before actual
staging acceptance. Their current project guards remain intact. A generated
isolated plan is not a working current staging deployment.

Original branch carried 367 files/27k lines from unrelated unreviewed task
ancestors. Their original commits remain retained in this branch's history.
Scope commit `1ab5b19f` restored the candidate tree to accepted dev plus KAN-45's
four owned files; merge `d2e48a55` recorded that accepted baseline using the ours
strategy after tree isolation. Net diff was checked to contain only those four
files before corrective work. No prior frontend inventory refresh or unrelated
task implementation is being approved. **Use squash integration**, so those
unreviewed ancestors are not marked integrated into dev. Verify integrated tree
equals the exact accepted candidate and PR evidence retains original history.

## Defects and correction

Original Python10 tests passed, yet actual validator probes accepted PITR off,
public SQL IAM claims, negative concurrency and a zero throttle threshold.
Create commands omitted promised TLS/versioning; observed-state checks ignored
most settings, private-services dependencies were missing, Armor syntax/interval
flags were invalid, and a different backend policy was silently left untouched
while success was printed. There was no environment binding or approved plan.

Current tool emits a pure offline plan containing exact commands, observations,
configuration and source hashes. Owner apply requires an explicit environment,
project ID/number and matching plan digest. Staging must be a different project,
with distinct resource names/identity and no production domain. Project identity
and enabled APIs are observed before mutations. No implicit gcloud project.

Network mode declares custom VPC, allocated private range and service peering.
Data requires those and the runtime identity before creating TLS-only private
PostgreSQL16 with IAM authentication, backups/PITR and deletion protection.
Application/retrieval databases stay separate; SQL IAM users and per-database
grants remain accepted migration/platform responsibilities. Storage creation
explicitly enables versioning/private uniform access and bounded runtime object
role, and observations reject public/excess runtime IAM and lifecycle purge.
Queue checks every rate/concurrency/retry bound; delivery is explicitly not
configured. Armor uses valid wildcard match, IP throttle and deny fallback,
rejects preview/bypass rules, verifies the policy before attaching to both
existing same-project backends and refuses a different policy.

All mode resources/prerequisites are inspected before mutations; new resources
are re-read and verified. Existing differing resources stop the run. Missing
visibility retries are bounded. No deletes, silent repairs, keys or broad project
IAM grants. Partial creation remains preserved and explicitly requires review
when its state differs; no transactional cloud rollback is claimed.

GCP resource APIs are separate operations, not a cross-resource transaction.
Owner apply requires an exclusive change window; preflight and re-read checks
do not create server-side locking against other console operators. In particular
security-policy attachment is a Cloud API operation, not a claimed compare-and-
swap or universal protection guarantee. Actual hosted verification remains open.

## Evidence

- 34 infrastructure Node cases passed in isolated read-only/no-network Node24 /
  Python test container, including current middleware parser regressions.
- 32 Python cases passed (21 corrective environment +11 foundation), with many
  explicit deny variants. Injected command transport fixtures are contract
  evidence only, never described as real GCP resources.
- Real Cloud SDK offline help checked all24 generated command groups: zero
  unsupported flag names. Also corrected enterprise enum spelling after checking
  SDK help. No credentials/network or actual resource command execution.
- Script battery133/133 passed; relevant CI/image checks still required.

Sources checked for the actual command/API shapes:
[SQL create](https://docs.cloud.google.com/sdk/gcloud/reference/sql/instances/create),
[raw bucket describe](https://docs.cloud.google.com/sdk/gcloud/reference/storage/buckets/describe),
[bucket versioning update](https://docs.cloud.google.com/sdk/gcloud/reference/storage/buckets/update),
[Cloud Tasks limits](https://docs.cloud.google.com/sdk/gcloud/reference/tasks/queues/create),
[Armor rules](https://docs.cloud.google.com/sdk/gcloud/reference/compute/security-policies/rules/create),
[private services access](https://docs.cloud.google.com/sql/docs/postgres/about-private-services-access).

Reviewer decision, final candidate/CI, published squash integration, integrated
verification, evidence preservation, cleanup and actual Jira Done remain pending.
Jira findings comment10699 returned the issue to In Progress. No self-approval.

## Independent review correction

`/root/kan45_final_review` independently passed32 Python tests and verified the
seven-file scope/baseline isolation at `6d981e12`, then requested changes. Project
IDs longer than30 passed the local regex despite GCP's limit, and SDK success
with JSON`null` could become missing-resource/create permission. Both now fail
closed, with boundary and null/scalar regressions. Staging database names and the
explicit current migration-project integration gap above were also corrected.
Source/command hashes change with these fixes; renewed exact-source review and
CI are required before integration.

Corrected full Python suite:35/35 passed (24 environment +11 foundation),
including actual staging-shaped command/observation contracts and a complete
reconcile transport case proving successful JSONnull cannot trigger creation.
