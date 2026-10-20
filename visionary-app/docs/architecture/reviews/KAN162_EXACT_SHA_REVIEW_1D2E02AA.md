# KAN-162 exact candidate review — 1d2e02aa

Jira key / source ID: KAN-162 (release gate; linked platform/release work)
Acceptance scope: release gate — checked `dev` integration and `main`-publish readiness. Hosted acceptance is explicitly out of scope.
Implementer: Codex (candidate history)
Reviewer: general independent QA subagent
Worker branch / base commit / candidate head commit: `codex/firebase-visionary-research` at `1d2e02aa3548afa6aeb227eb7a0a5670e426ef2a`; comparison base `origin/main` at `94aa8117cb318b8211b4815e8d6ff698c3d62f2b`
Current dev commit / comparison range: `origin/dev` = `1d2e02aa3548afa6aeb227eb7a0a5670e426ef2a`; merge-base `89d4f876`; `git diff 89d4f876..origin/main` is empty, so the content diff is `89d4f876..HEAD` (30 files, +531/−171)
Owned files, contracts and migrations: `.github/workflows/production.yml`; `infrastructure/gcp/{release.mjs,bootstrap.py,build-image.mjs,container-smoke.mjs,README.md,Dockerfile,.dockerignore,firebase-web-config.json}`; `firebase.json`; `.firebaserc`; Firebase/auth integration contracts; infrastructure and frontend regression tests; KAN-162 status/decision/QA records. No data migration.
Prerequisites: live KAN-162; prior review `KAN162_EXACT_SHA_REVIEW_6BDCB716.md` covers a different SHA and is not approval for this candidate; KAN-145 and KAN-146 remain in Testing; KAN-29 source coverage remains open.

## Review decisions

All required local checks pass on the exact candidate, and the main safety direction is sound: production targets only `visionary-research`, `dev` runs checks only, publish/deploy are separately gated to `main`, and the WIF condition is narrowly scoped. I am nevertheless returning **changes requested** because the same candidate contains two false QA evidence statements and because the candidate-failure path in `deployRelease` can exit without checking or restoring unexpected production traffic. Stale provisioning statements in Firebase and product-surface documents also conflict with the D-103 receipt included in this candidate.

This is not a rejection of the project switch itself. The release path should not be enabled, and this SHA should not be promoted to `main`, until F1–F3 are corrected and the exact replacement SHA is re-reviewed.

## Acceptance criteria — evidence

### 1. Production target switch and old-project isolation — passed

- `release.mjs` pins project `visionary-research`, project number `174851137514`, region `asia-south1`, service/repository `visionary-product`, runtime/deployer identities in `visionary-research`, origin `https://visionary.org.in`, auth domain `visionary-research.firebaseapp.com`, and image `asia-south1-docker.pkg.dev/visionary-research/visionary-product/product`.
- `bootstrap.py` uses the same project/number/region/service/repository/secret and the new runtime/deployer identities.
- `.github/workflows/production.yml` uses the new WIF provider path, deployer, and `project_id: visionary-research`. `build-image.mjs` and `container-smoke.mjs` derive from `production`.
- No production target in the workflow, release, bootstrap, build, or smoke scripts names `visionary-fd6d2`. Within those paths, the only old-project references are negative test fixtures (`release.test.mjs` rejects `FIREBASE_PROJECT_ID`/`FIREBASE_AUTH_DOMAIN` values); historical/recovery prose also remains in `infrastructure/gcp/README.md` and the Firebase/status records.
- No old-project deployment, GCP mutation, or data migration was performed during this review.

### 2. Branch, event, flag, and OIDC gating — passed

- Checks run on pushes and pull requests to `dev` and `main`; the checks job has repository-default read access and no cloud credentials.
- The production job requires all of: repository `ecohdeep786/New_Visionary`; `github.ref == 'refs/heads/main'`; event `push` or `workflow_dispatch`; `vars.PRODUCTION_PUBLISH_ENABLED == 'true'`.
- `id-token: write` is job-scoped to production only. Concurrency is serialized with `cancel-in-progress: false`.
- Deployment is a separate step gated by `vars.PRODUCTION_DEPLOY_ENABLED == 'true'`; `release.mjs deploy` independently requires the same flag.
- `trustedRun()` also requires the exact workflow ref, 40-character SHA, numeric run ID/attempt, repository, `refs/heads/main`, and push/workflow_dispatch.
- The WIF provider condition requires repository ID `1357462978`, owner ID `221676162`, `refs/heads/main`, exact workflow ref, and push/workflow_dispatch. The provider mapping and condition are created and re-checked by bootstrap.

### 3. Public Firebase configuration and secret hygiene — passed

- `infrastructure/gcp/firebase-web-config.json` contains exactly the six public Web SDK fields: `API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `APP_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`; all values belong to `visionary-research`.
- `.firebaserc` selects `visionary-research`; `firebase.json` targets Native Firestore database `default` and the tracked deny-all rules.
- `build-image.mjs` rejects extra/missing fields, invalid characters, wrong project/auth domain/sender ID. Build arguments are limited to those six public values.
- `.dockerignore` excludes `.env`/`.env.*`, admin SDK JSON, logs, installs, and generated output. No private key, service-account JSON, `.env`, token, or learner record is tracked. The `.tools/go`/test fixture PEM files in the repository are upstream tool artifacts, not product credentials.
- The committed Firebase API key is client configuration, not a server secret. The documented absence of an HTTP-referrer restriction remains a console/security gate, not a source leak.

### 4. Publish, deploy, baseline, promotion, and rollback contracts — mostly passed; one failure-path gap

Verified in `release.mjs`:

- `publish` checks the built image label equals `GITHUB_SHA`, pushes the commit tag, resolves the immutable digest through Artifact Registry, and writes `published-release.json`/`GITHUB_OUTPUT`.
- `deployRelease` validates the exact candidate revision name and immutable image, checks current remote `main` before work and again after the candidate probe, refuses a previous release outside `main` history, requires service-level `maxScale=1`, canonical ingress `internal-and-cloud-load-balancing`, and fully verifies the candidate revision's image, commit, runtime identity, Firebase project/auth domain/database, proxy hops, secret reference, CPU/memory/concurrency/timeout, and cost annotations.
- The candidate is deployed with `--no-traffic` and the `ci-candidate` tag; the probe uses the exact `/__deploy-check` route with a forged `X-Forwarded-For` sentinel and requires `forwardedForSanitized: true`, expected revision header, `no-store`, JSON, and status 200.
- Unexpected candidate traffic is checked after a successful probe and rolled back if the candidate is live; post-promotion failures roll back only when the candidate is still the live revision, verify the previous revision, and re-run canonical checks against the previous commit. Operator changes are not overwritten.
- The baseline path requires explicit `PRODUCTION_BASELINE_CONFIRM`, the current remote `main` commit, the exact immutable digest in the production repository, foundation service-level `maxScale=1`, and ingress `all` before the edge cutover. It creates/reuses the baseline, verifies the bounded revision, probes service health/provenance, and writes a receipt. The same-commit/image resume path checks identity, URL, and health before writing `resumed: true`; a different canonical baseline is refused.
- **Gap:** on a failed `deploy()`, `verifyRevision()`, or exhausted candidate probe, `deployRelease` throws before the `afterCandidate` traffic check. See F3.

### 5. Bootstrap repair, Windows invocation, and idempotency — passed with residual test gaps

- `run_gcloud` uses `subprocess.list2cmdline` and `shell=True` only on Windows for the `gcloud.cmd` shim; non-Windows execution remains list-based. Current call sites use fixed constants; the generated secret is passed on stdin and never printed.
- `missing_resource` detects `NOT_FOUND`, `not found`, `cannot find`, and `could not find` without swallowing `PERMISSION_DENIED`.
- `ensure` retries describe up to five times at two-second intervals after creation and fails with a clear error if the resource never becomes readable.
- `apply-foundation`, `apply-identity`, and `apply-edge` remain explicit owner-run modes; default is plan only.
- A local PowerShell shim test with the exact WIF condition confirmed the condition is passed as one argument through the Windows invocation. This was a manual reviewer check, not a committed test.
- **Gap:** the existing-service adoption check is weak; see F4. `ensure_secret` has no post-create retry, and no test covers `run_gcloud` or `ensure_secret`; see F6.

### 6. No fabricated approval, no KAN-145/KAN-146 Done claim, no unrelated behavior changes — passed

- The earlier review document approves only `6bdcb716`; no document claims this candidate was approved before this report. No Jira transition or approval was fabricated.
- `STATUS.md` and the D-103 receipt keep KAN-145/KAN-146 in Testing. `task-executions.json` contains no KAN-162 entry and no KAN-145/146 Done record. `JIRA_SYNC.md` still lists those stories as partial/In Progress.
- The candidate diff is a project-target/config/docs/test switch: workflow, GCP scripts, Firebase config, CSP/auth-domain test fixtures, integration docs, and status receipts. No product route, pricing, role, learner-data, or unrelated behavior change was found.
- `hostedVerified:false` is retained in the surface audit and status records; the D-103 foundation receipt explicitly says the placeholder is not a product release.

### 7. Documentation consistency — failed

The current-state documentation is internally inconsistent:

- `infrastructure/gcp/README.md` says foundation and identity are applied and the placeholder exists.
- `integration/FIREBASE_SETUP.md` still says the last inventory found no hosted Cloud Run, Artifact Registry, or IAM resources.
- `integration/FIREBASE_AUTH_CONTRACT.md` still says hosted resources are not yet provisioned.
- `docs/architecture/PRODUCT_SURFACE_AUDIT.md` and the generated `product-surface.json`/`product-surface-review.json` still say the project has not been provisioned and `sourceDeliveryProvisioned:false`.
- `frontend/scripts/product-surface.mjs` embeds the same stale provisioning paragraph.

These statements were accurate for the 17 October inspection but are false after the 20 October foundation/identity application recorded later in the same candidate. They are not merely historical because they are presented as current findings. See F5.

### 8. Delivery-chain applicability

- **Frontend:** production build and 532/532 tests pass; CSP/auth-domain fixtures now target `visionary-research`; no route or user-journey behavior changed in this candidate.
- **API:** `production-check` 65/65 passes, including production HTTP/cookie/cache/API boundaries at one and two trusted proxy hops; no API behavior change in this candidate.
- **Backend:** selected Nest runtime dependency audit and release tests pass; no backend source behavior change beyond Firebase project/auth-domain test fixtures.
- **Data:** Firestore database `default` and deny-all rules are configured in source; no user-data migration was performed and hosted rule deployment was not independently verified.
- **Jobs/ML:** N/A — no job, queue, model, or ML code or configuration is changed.
- **Cache/observation:** N/A for a cache change; the release probe requires `Cache-Control: no-store` and tests it, and no caching behavior is modified.
- **Device outcome:** N/A — no device-facing feature is changed; browser sign-in and hosted endpoints remain unverified.

## Commands, exit codes, test counts and timestamps

All commands ran in the exact candidate worktree on 2026-10-20 (local time), with only ignored QA logs present.

| Command | Exit | Result |
|---|---:|---|
| `npm run check` | 0 | Frontend/service/tooling checks passed; 532/532 frontend tests, 18/18 script tests; surface audit 68 routes, 26 registered endpoints, 1,645 control declarations, `hostedVerified:false`; production build completed in 16.24s |
| `node scripts/production-check.mjs` | 0 | 65/65 tests passed in 24.9s |
| `node --test infrastructure/gcp/tests/*.test.mjs` | 0 | 14/14 passed in 1.48s |
| `python -m unittest discover -s infrastructure/gcp/tests -p '*_test.py'` | 0 | 5/5 passed in 0.025s (PowerShell displayed unittest progress on stderr; process exit was 0) |
| `npm audit --omit=dev --audit-level=high` | 0 | 4 moderate, 0 high, 0 critical; 176 production dependencies; threshold allowed the moderate advisories |
| `git diff --check origin/main..HEAD` | 0 | No whitespace errors |

CI evidence:

- `dev` push run `39388978639` on `1d2e02aa` completed **success**; the `checks` job succeeded and the `production` job was **skipped**.
- The latest `main` push run `39304517310` on `94aa8117` had `checks` success and `production` **skipped**. No candidate `main` run exists.
- The dev checks include the Python bootstrap suite via `python3 -m unittest discover`.

Docker/container limitation:

- `node infrastructure/gcp/build-image.mjs` was attempted and failed because the local Docker daemon pipe `//./pipe/dockerDesktopLinuxEngine` was unavailable. This is an environment failure, not a Dockerfile/build failure. `container-smoke.mjs` was therefore not run. The dev CI run skips the production job, so this exact SHA has no independent container build/smoke evidence.

## Remaining defects, limitations and linked open gates

### F1 — P1 blocking — false “zero vulnerabilities” QA claim

`docs/visionary/QA.md` (D-103 foundation receipt, line 1517) says `npm audit --omit=dev --audit-level=high` “reports zero vulnerabilities.” The actual command exits 0 but reports **four moderate** advisories (`@nestjs/core`/`@nestjs/platform-express`, `@nestjs/common` via `file-type`, and `file-type`). The earlier D-103 dev receipt in the same file correctly says four moderate remain. This contradiction must be corrected; “zero high/critical” is accurate, “zero vulnerabilities” is not.

### F2 — P1 blocking — false “baseline retry safety” test claim

`docs/visionary/QA.md` line 1513 says the 14/14 infrastructure tests include “baseline retry safety.” The 14 tests are 11 release tests, 2 Firebase-config tests, and 1 bootstrap plan test. No test imports or executes `baseline()`; `release.test.mjs` covers `deployRelease`, `trustedRun`, `verifyRevision`, `probe`, and `currentRevision`, not the baseline resume/refusal path. The manually inspected resume branch (same commit/image, service URL, health, `resumed:true`) appears logically consistent, but the claimed automated evidence does not exist. Either add a baseline test with injectable reads/health or remove the claim.

### F3 — P1 blocking — failed candidate can exit without traffic recovery

In `release.mjs` `deployRelease` (lines 95–101), the sequence is `deploy()` → `verifyRevision(await readRevision(revision))` → up to 12 candidate probes. Any failure in that sequence throws before the `afterCandidate` check at lines 103–110. The only unexpected-traffic rollback is on the **successful** probe path. The test “unhealthy candidate exhausts bounded retries and never receives product traffic” (lines 45–48) asserts no `traffic:` calls because it assumes `--no-traffic`; the unexpected-traffic test (lines 50–55) moves traffic only while the probe succeeds. There is no regression test for “deploy/verify/probe fails and the candidate is unexpectedly live.”

Recommended fix: wrap deploy, revision verification, and candidate probing in one guarded path; on any failure read the service, and if `currentRevision === revision` move traffic back to `previous`, verify it, then rethrow. Add the failure-path test. Until this is fixed, enabling `PRODUCTION_DEPLOY_ENABLED=true` would rely on Cloud Run honoring `--no-traffic` even on abnormal platform/CLI behavior, with no script-level recovery.

### F4 — P2 non-blocking — foundation can adopt an unrelated existing service

`bootstrap.py` lines 136–158 accept an existing `visionary-product` service if service-level `maxScale=1` and ingress is `all` or `internal-and-cloud-load-balancing`. It does not verify the placeholder image `us-docker.pkg.dev/cloudrun/container/hello`, runtime service account, CPU/memory/concurrency/timeout, or that traffic is on the expected placeholder revision. It then tags `LATEST` as `ci-candidate` and prints `"placeholder": true`. This contradicts the module docstring/README statement that existing objects are checked rather than silently adopting unrelated ones, and the project already contains unrelated service accounts. Verify the full placeholder contract before tagging/printing, or refuse and require manual review.

### F5 — P2 non-blocking — stale provisioning statements in docs and generated audit artifacts

As detailed in §7, these files present the 17 October “no resources” observation as current after D-103 provisioned foundation/identity:

- `integration/FIREBASE_SETUP.md` line 5;
- `integration/FIREBASE_AUTH_CONTRACT.md` line 5;
- `docs/architecture/PRODUCT_SURFACE_AUDIT.md` lines 402 and 408;
- `docs/architecture/tracking/product-surface.json` line 81698 and `sourceDeliveryProvisioned:false` at line 81719;
- `integration/contracts/product-surface-review.json` line 3169 and line 3190;
- `frontend/scripts/product-surface.mjs` line 78.

Update them to say foundation/identity are applied, while product image, canonical baseline, edge/DNS/TLS, and hosted product deployment remain open. Regenerate the product-surface snapshots only after explicit review. A passing `npm run check` does not prove live provisioning; the audit generator is not a cloud-state check.

### F6 — P3 non-blocking — bootstrap repair test/claim scope

`bootstrap_test.py` has five tests: three `missing_resource` cases, one `ensure` retry case, and one URL-map import/validate case. There is no test for `run_gcloud`’s Windows shell path or for `ensure_secret`. The manual shim check passed, but the claim that the repair is fully “with tests” overstates the committed coverage. `ensure_secret` also lacks the post-create retry used by `ensure`, so eventual consistency of secret/version reads is not handled the same way. Keep the Windows shell workaround (current call sites are fixed constants and the secret is stdin) but add tests or narrow the receipt.

### F7 — limitation — no independent container evidence

Docker daemon unavailable; `build-image.mjs` failed at the pipe, and `container-smoke.mjs` was not run. The Dockerfile and smoke script were inspected: pinned Node 24 base, non-root runtime, read-only/network-none smoke container with capabilities dropped, public Firebase build args only, and `.dockerignore` excludes secrets. Those are source-review observations, not an executed container result.

### F8 — acceptance boundary — hosted claims not independently verified

No `gcloud` executable, GCP credentials, or GitHub Actions variable-admin access was available (`/actions/variables` returned HTTP 401). I could not independently verify the D-103 foundation/identity receipt, WIF provider/condition in the live project, Artifact Registry/secret/service state, Firebase authorized domains/API-key/OAuth settings, repository variables, browser sign-in, canonical baseline, load balancer/DNS/TLS, or any hosted product endpoint. The receipt in `STATUS.md`/`DECISIONS.md` is an implementation claim, not reviewer evidence. No GCP mutation or deployment was performed.

## Reviewer decision

**Changes requested.**

Rationale: the project switch, workflow gating, secret hygiene, and most release contracts are implemented correctly, and every required local check passes. Approval is withheld because (1) the exact candidate contains a false audit claim and a false baseline-test claim, both in the QA record that the release gate relies on; (2) the candidate-failure path can leave unexpected candidate traffic live without a recovery attempt; and (3) current-state docs/generated audit artifacts still say the new project is unprovisioned after the same candidate records foundation/identity provisioning. F1–F3 are blocking for release-gate approval. F4–F6 should be corrected in the same follow-up where practical.

Reviewer identity: general independent QA subagent
Exact reviewed commit: `1d2e02aa3548afa6aeb227eb7a0a5670e426ef2a`
Review date: 2026-10-20
Verification result: required local commands passed; approval verification failed on F1–F3; hosted acceptance not executed.

## Integration and Jira receipts

Dev integration commit and checks: `origin/dev` = `1d2e02aa`; GitHub Actions run `39388978639` checks success, production skipped. This confirms checked `dev` integration only; it is not `main` promotion or hosted acceptance.

Jira transition/comment receipt: none. This review did not update Jira, merge to `dev`/`main`, enable deployment, or run any GCP mutation.

Next dependent task and prerequisites: no dependent task is eligible until the fixes are re-reviewed and the exact replacement SHA passes. KAN-29 real-source coverage, KAN-145/KAN-146 team testing, Firebase console verification, browser sign-in, first `main` publish/deploy, and hosted rollback evidence remain open; none of those prerequisites is accepted by this report.
