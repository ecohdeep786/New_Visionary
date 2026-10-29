# KAN-45 — PLAT-01 — reviewed product IaC/environment configuration (data, storage, queues, protection)

## Task review and verification handoff

Jira key / source ID: KAN-45 (PLAT-01)
Acceptance scope: enabler (reviewed product environment configuration extending bootstrap.py's owner-run foundation to the missing PLAT-01 surfaces: data, storage, queues and edge protection; plan/apply execution, ADC/workload identity binding and hosted acceptance remain separately gated — see open gates)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-45-product-env`; based on the latest lane head `2106a110` (KAN-79 BUILD-05 export), per D-098 (lane lineage …79 → 45).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-45-product-env`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `infrastructure/gcp/product_env.py` (declarative desired-state configuration for private Cloud SQL data, one private object bucket, one bounded Cloud Tasks queue, one Cloud Armor throttling policy; `plan` default prints and creates nothing; `apply-data/apply-storage/apply-queue/apply-protection` create only MISSING named resources through bootstrap.ensure and refuse differing existing objects; `validate()` fails closed on any public/unbounded surface or embedded credential)
- `infrastructure/gcp/tests/product-env.test.mjs` (node structural suite, 2 tests incl. plan-output review and no-unknown-mode)
- `infrastructure/gcp/tests/product_env_test.py` (python structural suite, 10 tests: desired-config invariants + fail-closed validator cases)
Prerequisites (native Blocks): none (PLAT-01 had no native blockers). Composes: bootstrap.py owner-run foundation (DONE-11 lineage), P02 topology from docs/architecture/discussions/system-design.md, PLAT-03..08 remain separate.
Not applied: nothing was created in any cloud account; no credentials were used or embedded; `plan` is the default and the tests exercise configuration/structure only.

## Requirement

Create reviewed product IaC/environment configuration for GCP identities/network, data, storage, compute, edge, queues and protection; do not apply imported legacy Terraform/Compose as product deployment. (source: BACKEND_LAUNCH_CHECKLIST.md PLAT-01; KAN-45)

## Acceptance criteria → evidence

- REVIEWED CONFIGURATION AS CODE — the complete desired data/storage/queue/protection environment is a declarative, reviewable manifest produced by `product_env.py environment()`; `plan` (default) prints it and creates nothing (asserted: unknown modes refuse; plan never applies).
- DATA (private) — Cloud SQL PostgreSQL 16, private-IP only (`publicIp: false`, private network, `cloudsql.iam_authentication`), SSL required, automated backups + point-in-time recovery, separate `visionary_app` and `visionary_retrieval` databases, runtime identity as the only IAM-authorized member.
- STORAGE (private) — one bucket with uniform bucket-level access, public access prevention ENFORCED, empty public IAM members, object versioning enabled.
- QUEUES (bounded) — one Cloud Tasks queue with bounded dispatch rate (5/s), bounded concurrency, bounded attempts (5) and bounded retry duration (JOB-01/02 semantics at the platform layer).
- PROTECTION (bounded) — one Cloud Armor policy with a per-client-IP throttle rule (600/min, 429 on exceed) attached to both product backend services.
- FAIL-CLOSED REVIEW — `validate()` refuses public SQL, non-private/public buckets, public IAM members, unbounded queues, missing throttle, and any embedded credential marker (password/private_key/api_key/secret_value); python tests drive each refusal case.
- NO LEGACY IMPORT — the configuration is product-owned Python in the bootstrap.py style; no imported legacy Terraform/Compose is applied as product deployment.
- Cross-layer closure: Frontend — N/A. API — N/A. Backend — N/A (platform layer). Data — the declared SQL/Firestore split matches the system design; migrations remain DATA-02. ML — N/A. Hosted — plan/apply evidence remains open (below).

## Commands, exit codes, test counts and timestamps

- Infra structural suites on this candidate: `node --test tests/bootstrap.test.mjs tests/data-job-plan.test.mjs tests/firebase-config.test.mjs tests/phone-release.test.mjs tests/product-env.test.mjs tests/release.test.mjs tests/request-parser.test.mjs` → 33 tests, 33 pass, 0 fail; `python -m unittest tests.bootstrap_test tests.product_env_test` → 21 tests, OK (2026-10-29). The previously environment-broken `request-parser` fixture passes after installing `infrastructure/gcp/runtime` deps (`npm ci`) in the fresh worktree — a missing-install, not a code defect.
- Note: `infrastructure/gcp/tests` are run directly (no root npm wiring), consistent with the existing infra suite.
- Full backend `backend:build` (Nest) on the lane head `2106a110` → exit 0 (all 44 backend contract modules compile).

## Remaining defects, limitations and linked open gates

- Plan/apply execution (gcloud), ADC/workload-identity binding, DNS/TLS cutover and any hosted acceptance are NOT performed and remain open platform gates (PLAT-02..PLAT-08); this enabler provides the reviewed configuration and its structural verification only.
- Cloud SQL private network assumes the `visionary-product` VPC created at apply time; Firestore native database remains on the foundation's Firestore API enablement.
- Enabler completion never closes hosted, provider, content, privacy or commercial acceptance gates. No secrets, keys or credentials were used or embedded.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
