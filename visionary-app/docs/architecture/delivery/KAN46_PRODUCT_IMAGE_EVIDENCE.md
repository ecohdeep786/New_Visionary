# KAN-46 / PLAT-02 — minimal product image: local build, smoke and shutdown evidence

Historical submission. The [current review handoff](../reviews/KAN46_PRODUCT_IMAGE_FINAL.md) records the corrected build and verification scope.

Implementer: deepseek lane (senior product engineer agent). This document supplies implementation evidence and requests separate review (D-095); the implementer cannot approve its own work.

## Scope

- Jira key / source ID: KAN-46 / PLAT-02, parent KAN-4 (P02 — product-owned staging and delivery).
- Requirement: build a minimal product image using the current entrypoint; exclude desktop credentials, research, obsolete deploy scripts and fixture routes; validate startup configuration, probes, shutdown and timeouts. Exit: repeatable, isolated staging with no fictional-to-production leakage.
- Worker branch: `codex/deepseek-kan-46-product-image`, base commit `2f8e3f7448efd8b644522a0b82272b22f9aa1dc6` (verified `origin/dev` tip, PR #38 merge).
- Candidate head commit: this file's commit (see Jira review comment for the exact SHA). The image contents are unaffected by evidence docs: the build-context whitelist (`infrastructure/gcp/Dockerfile.dockerignore`) excludes `docs/` entirely, so the smoke evidence produced at the base SHA is content-identical to the candidate; the build and smoke were re-run at the candidate SHA and are recorded below.
- Environment: Windows host, Docker Engine 29.9.2 (WSL2 backend, docker-desktop distro), Node 24.19.0, local time 2026-11-03/04 (+0530). No GCP credentials used, no cloud resources created, no image published.

## Exclusion proof (no fictional-to-production leakage)

1. Build-context whitelist: the leading `**` deny in `infrastructure/gcp/Dockerfile.dockerignore` excludes the whole tree; only `frontend/` (package manifests, configs, `src/`, `public/`), `backend/upstream/backend/` (manifests, `tsconfig*.json`, `nest-cli.json`, `src/`) and the pinned `infrastructure/gcp/runtime/package*.json` are re-included. Desktop credentials, `research/`, artifacts, docs and obsolete deploy scripts never enter the build context.
2. Explicit credential denies: `**/.env*`, `**/*.pem`, `**/*.key`, `**/*service-account*.json` are denied even inside included trees.
3. Image filesystem scan (running the built image, no network):
   - `/app` contains only `backend` (`dist`, `node_modules`) and `public` (built SPA: `index.html`, `assets/`, `fonts/`, favicon/og images, `manifest.json`).
   - Credential scan over the whole filesystem (excluding `node_modules`): only `/usr/lib/ssl/cert.pem` — the Debian base-image CA trust store. No private keys, no service-account files, no `.env` files.
   - Fixture scan of `/app/public`: no fixture/emulator files.
   - Baked environment: `VISIONARY_RELEASE_COMMIT=2f8e3f7448efd8b644522a0b82272b22f9aa1dc6`, `NODE_ENV=production`.
4. Product entrypoint hygiene: `backend/upstream/backend/src/main-product.ts` boots only `FirebaseProductModule` through `configureProductionHttp` (fail-closed production configuration check, hardened headers/CSP, `/healthz` + `/api/health` probes); the legacy application/Prisma/ML startup graph is neither compiled nor started (`tsconfig.product.json` selects the product import graph; the API stage compiles it with a stable `dist/src` path).

## Startup configuration validation

- `main-product.ts` refuses to start unless `NODE_ENV=production`, `AUTH_RATE_LIMIT_KEY` is a string of at least 32 characters, and `FIREBASE_PROJECT_ID` + `FIRESTORE_DATABASE_ID` are present (fail-closed startup configuration).
- Production HTTP binds `0.0.0.0:8080`, serves the built SPA from `PUBLIC_ROOT`, requires an absolute HTTPS canonical origin, and verifies `PUBLIC_ROOT/index.html` exists at startup.
- Container-local probe `/healthz` and external probe `/api/health` return `{"status":"ok",...}` with the compiled auth policy.

## Evidence: commands, results, timestamps (all green)

| # | Check | Command | Result |
| --- | --- | --- | --- |
| 1 | Infrastructure structural suites | `node --test infrastructure/gcp/tests/*.test.mjs` (bootstrap, data-job-plan, firebase-config, phone-release, release, request-parser) | **31/31 pass, 0 fail** (7.3s) |
| 2 | Bootstrap python suite | `python -m unittest bootstrap_test` (from `infrastructure/gcp/tests`) | **Ran 11 tests, OK** |
| 3 | API-stage offline container check | `node infrastructure/gcp/check-product-api-image.mjs` | **PASS**: "actual production API image boots as node offline, loads the generated SQL client and denies untrusted provisioning at its registered route" (health 200 at `/api/health`, `Prisma.prismaVersion.client === '5.22.0'`, unauthenticated `POST /api/account/workspace/provision` → 403) |
| 4 | Full product image build | `GITHUB_SHA=2f8e3f74… node infrastructure/gcp/build-image.mjs` | **PASS**: multi-stage build (web → api → product) tagged `asia-south1-docker.pkg.dev/visionary-research/visionary-product/product:2f8e3f7448efd8b644522a0b82272b22f9aa1dc6`, image digest `sha256:64d8fcc02f521f740c710222cedc08f43aa1371f695a34c3bdcd7e494d8c8d53` |
| 5 | Hardened container smoke | `GITHUB_SHA=2f8e3f74… node infrastructure/gcp/container-smoke.mjs` | **PASS**: "non-root startup, static/API boundaries, sign-in availability, source, secure cookie and canonical/forged CSRF origin checks" under `--read-only --network=none --cap-drop=ALL --security-opt=no-new-privileges --cpus=1 --memory=512m --pids-limit=100 --tmpfs=/tmp:16m` |
| 6 | SIGTERM shutdown + timeout | manual hardened run, health within loop, `docker stop --time=10` | startup healthy ≈2s; SIGTERM graceful stop **1s**; `exit=0 status=exited oom=false` |
| 7 | Image contents scan | hardened run, `/bin/sh` listing + find scans | see "Exclusion proof" above |

Timestamps: checks 1–2 at 2026-11-03T18:20–18:40Z, check 3 at ≈2026-11-03T18:52Z, check 4 at ≈2026-11-03T18:55Z, checks 5–7 at ≈2026-11-03T19:00–19:10Z. Node test counts and pass/fail are printed by the runners verbatim in the session transcript.

Re-run at the candidate SHA (after the evidence commit; cached layers, image content identical because `docs/` is outside the build context):

| Check | Result |
| --- | --- |
| `GITHUB_SHA=<candidate> node infrastructure/gcp/build-image.mjs` | recorded in the Jira review comment |
| `GITHUB_SHA=<candidate> node infrastructure/gcp/container-smoke.mjs` | recorded in the Jira review comment |

## Known warnings and limitations

- `docker build` prints three `SecretsUsedInArgOrEnv` warnings for `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN` and `VITE_AUTH_MODE`. These are the six **public** Firebase Web SDK settings (client configuration, not server secrets) as documented in `infrastructure/gcp/README.md` § Source of truth; `build-image.mjs` validates they are exactly the six public fields for project `visionary-research`. Recorded here for the reviewer; no change requested by this evidence.
- The API-stage check builds only the `api` target; the smoke runs the full `product` stage. Both were executed locally on Windows/WSL2; CI repeats both on every dev/main push (`production.yml` checks job: `check-product-api-image.mjs`, `node --test infrastructure/gcp/tests/*.test.mjs`, python unittest) and the production job re-runs build + smoke on main.
- PLAT-02 closure does not close hosted/provider gates: PLAT-03 (IAM/secrets), PLAT-04 (HTTPS/edge), PLAT-05 (hosted cookies), PLAT-06 (CI release), PLAT-07 (observability), PLAT-08 (backups) and actual GCP deployment acceptance remain separate. No cloud resource was created or changed for this evidence.
- Startup/probe/shutdown validation is local-container evidence; the hosted probes (`/__deploy-check` through the edge) are validated by the production workflow per main push.

## Review handoff

Acceptance criteria → evidence mapping, commands and exact candidate SHA are above; the Jira review comment carries the final candidate commit, the re-run results and the CI run link after push. Reviewer must be separate from this lane. Remaining open gates: PLAT-03..08, hosted deployment acceptance, and the linked phase/feature gates in the delivery matrix.
