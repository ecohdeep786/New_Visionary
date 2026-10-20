# KAN-162 exact candidate review — bf3a9489

Jira key / source ID: KAN-162
Acceptance scope: release source — checked dev integration and main publish readiness; hosted production acceptance remains pending.
Implementer: Codex root agent
Reviewer: independent `kan162_review` QA subagent, accepting responsibility for this source review
Worker branch / base commit / candidate head commit: `codex/firebase-visionary-research`; base `1d2e02aa3548afa6aeb227eb7a0a5670e426ef2a`; exact candidate `bf3a9489bddb522e65da33f28b3c7062c2624bf6`
Current dev commit / comparison range: remote dev `1d2e02aa3548afa6aeb227eb7a0a5670e426ef2a`; reviewed `1d2e02aa..bf3a9489`, with the preceding project/workflow migration and prior independent review also inspected.
Owned files/contracts: GCP release/bootstrap code and tests, provisioning documentation, generated source-audit state and append-only QA/STATUS corrections; no product data migration.
Prerequisites: KAN-162 remains the release task. KAN-161/KAN-28 source acceptance does not establish their hosted outcome in the new project; KAN-29 content/source acceptance and KAN-145/KAN-146 testing remain separate.

## Decision

**Approved for checked dev integration and main publish readiness at exact implementation `bf3a9489bddb522e65da33f28b3c7062c2624bf6`.** This approval supersedes the changes-requested decision on `1d2e02aa` only for the corrected source scope. It does not certify a container build, deployed product, canonical baseline, edge/DNS/TLS, real account journey, operational rollback or full launch readiness. It does not approve later implementation commits.

The candidate fixes the source/evidence findings from the prior review. Production configuration consistently targets `visionary-research` / `174851137514` / `asia-south1`, with `https://visionary.org.in` as canonical origin. The workflow still permits cloud publish/deploy only from the exact main workflow on push/manual dispatch, with separate publish/deploy variables and job-scoped OIDC. Dev and pull requests run checks without cloud credentials. No old-project deployment or data operation was performed by this reviewer.

## Acceptance criteria and findings

- **F1/F2 evidence accuracy — resolved.** The appended QA correction explicitly retracts the historical zero-vulnerabilities claim and unsupported 14-test baseline-retry claim. Four moderate advisories remain; zero high/critical and a passing high threshold are the supported claims. Historical log text remains intact, with a superseding correction. New executable baseline tests now provide the previously absent evidence.
- **F3 candidate failure cleanup — resolved.** Deploy, exact revision verification, bounded candidate probing and the main recheck share a guarded path. Every failure re-reads traffic; an unexpectedly live candidate is returned to the verified previous revision and that pin is checked. An operator's different release is preserved. Regression tests cover failed candidate health and failed revision verification when candidate traffic moved unexpectedly.
- **F4 placeholder adoption — resolved.** Foundation now checks placeholder image, runtime identity, CPU/memory/concurrency/timeout, service cap and ingress before treating an existing service as the foundation. An unrelated existing service is refused. A fresh creation explicitly sets the service maximum with `--max=1`; `--max-instances=1` separately limits the revision. The installed gcloud help confirms that distinction; the fresh-creation test covers the missing service-cap case.
- **F5 provisioning prose — resolved.** Current documents and generated audit artifacts distinguish the 17 October observation from 20 October foundation/identity provisioning. They continue to say product image/baseline/edge/DNS/TLS and hosted product acceptance are open. The audit retains `hostedVerified:false`.
- **F6 bootstrap test scope — resolved.** Windows/non-Windows command dispatch, eventual secret-version visibility, strict placeholder validation and fresh service-cap setup now have executable tests. Only fixed bootstrap inputs are shell-dispatched on Windows; secret material remains stdin and is not printed.
- **First baseline safety — passed.** The new injected `baselineRelease` accepts a positively verified bounded hello placeholder or resumes the exact same canonical image/commit. Foreign images, stale main, unrelated or incompatible services and a different canonical baseline are refused. Resolved LATEST traffic is explicitly pinned before deployment. The new revision is deployed without product traffic, checked by exact revision identity and its tagged health URL, and promoted only after another main/traffic check. Post-promotion health and ambiguous CLI failure restore the placeholder if the candidate is live; another operator release is preserved. Same-image/source resume pins and checks health without redeployment.
- **Windows release commands — passed.** The release command helper uses `gcloud.cmd` through the shell only for Windows gcloud calls, quotes arguments and rejects cmd expansion/operators, embedded quotes, newlines and a trailing backslash. Other executables/platforms retain argument-list execution. An actual read-only gcloud version call succeeds through this helper on the exact candidate.
- **Production boundary — unchanged.** Runtime remains the selected backend graph, one CPU/512 MiB/concurrency 20/30 seconds, immutable project image digest, canonical Firebase/database/origin, pinned secret version and bounded service/revision scaling. The first baseline remains an explicit owner operation; automated deploy remains a separate activation after canonical ingress and hosted verification. No role/source/privacy, frontend journey, model/provider or payment behavior is changed by this review.

## Commands and evidence

Reviewer environment: Windows PowerShell, 2026-10-20 UTC. Exact candidate worktree was clean and the feature remote ref was independently verified as `bf3a9489bddb522e65da33f28b3c7062c2624bf6`.

| Check | Exit/result |
| --- | --- |
| Exact candidate: `node --test infrastructure/gcp/tests/*.test.mjs` | 0; 21/21 pass |
| Exact candidate: `python -m unittest discover -s infrastructure/gcp/tests -p '*_test.py'` | 0; 11/11 pass |
| Exact candidate: `git diff --check 1d2e02aa..HEAD` | 0 |
| Exact candidate: imported `command('gcloud', ['version', '--format=json'], true)` | 0; installed SDK 589.0.0 returned valid JSON |
| Installed `gcloud run deploy --help` | Confirms `--max` caps service instances and `--max-instances` caps revision instances |
| Independent `npm run check` during preceding `dbf7e603` inspection | 0; layout/import/source audit, 18 script tests, lint, both typechecks, frontend tests and production build pass; Vite 25.84 seconds |
| Independent `node scripts/production-check.mjs` during preceding `dbf7e603` inspection | 0; 65/65 pass using the runtime dependency lock |
| `git diff --exit-code dbf7e603..bf3a9489 -- frontend scripts backend ml infrastructure/gcp/runtime integration/contracts/product-surface-review.json docs/architecture/tracking/product-surface.json docs/architecture/PRODUCT_SURFACE_AUDIT.md` | 0; every component/input exercised by those full checks is unchanged in the replacement candidate |
| Runtime `npm audit --omit=dev --audit-level=high` | 0; four moderate advisories, zero high/critical |
| `docker version --format '{{json .Server.Version}}'` | 1; local Docker Linux-engine pipe unavailable; no independent container result claimed |

Full checks above are explicitly identified with the tree on which they ran; they are not retroactively described as exact-candidate executions. Replacement changes are confined to release/bootstrap/tests and QA/STATUS documentation, and the exact candidate's relevant focused suites passed. Prior independent review covers the unchanged workflow, public Firebase configuration, Dockerfile and source/runtime boundaries.

## Verification and release boundaries

Frontend/API/backend: local build and isolated regression results above apply; hosted runtime behavior is pending. Data: no reviewer read/write of protected records and no migration. Jobs/ML: N/A, unchanged. Cache/observation: source probes enforce revision/no-store/JSON and the forged forwarded-IP sentinel; no live edge assertion was performed. Device/account outcome: browser sign-in, email/provider recovery and cross-device behavior in the new project remain unverified.

The implementer's read-only cloud receipt says foundation/identity exist, the service still serves the hello placeholder and the image repository is empty. Those are attributed implementation observations, not independent hosted acceptance. Actual main workflow build/smoke/publish evidence, first baseline, edge/DNS/TLS, canonical product checks, account journeys and rollback evidence must be recorded before hosted production acceptance or KAN-162 Done. Four moderate upstream dependency advisories remain visible.

Reviewer decision: **approved**, exact SHA above, 2026-10-20 09:36 UTC.
Verification result: **passed for local source scope; hosted acceptance pending**.
Dev integration commit/checks: pending integrator publication and verification at this review.
Jira transition/comment receipt: none performed by reviewer; Testing/Done remains the integrator's recorded action after the applicable gates.
Next dependent task: not released by this source approval; check its actual prerequisites and accepted hosted scope first.
