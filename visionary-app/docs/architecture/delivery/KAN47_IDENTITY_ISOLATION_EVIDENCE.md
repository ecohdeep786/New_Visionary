# KAN-47 / PLAT-03 — identity, least-privilege and named-database validation evidence

Historical submission. The [current review handoff](../reviews/KAN47_IDENTITY_ISOLATION_FINAL.md) describes the corrected audit and the live evidence still required.

Implementer: deepseek lane (senior product engineer agent). This document supplies implementation evidence and requests separate review (D-095); the implementer cannot approve its own work.

## Scope

- Jira key / source ID: KAN-47 / PLAT-03, parent KAN-4 (P02 — product-owned staging and delivery).
- Requirement: configure ADC/workload identity, least-privilege service accounts and Secret Manager rotation; isolate environments and validate the existing named Firestore database rather than guessing it.
- Deliverable: a repeatable, fail-closed, **read-only** audit tool that verifies the live project against the reviewed desired state (`infrastructure/gcp/bootstrap.py` + `production.yml`), plus structural tests and a first live run. No cloud resource was created, changed or rotated; no secret payload was read or printed; no image was built or published.
- Worker branch: `codex/deepseek-kan-47-identity-isolation`, base `2f8e3f7448efd8b644522a0b82272b22f9aa1dc6` (verified `origin/dev` tip). Candidate: this file's commit (exact SHA in the Jira review comment).
- Environment: Windows host, gcloud 589.0.0 (Python 3.15 launcher), Node 24.19.0. Live reads on 2026-11-04.

## What the audit verifies (all read-only)

`infrastructure/gcp/identity-audit.mjs` — every check must pass or the whole audit refuses with the remedy:

1. **workload-identity** — pool `visionary-github` and provider `github-main` are ACTIVE, the OIDC issuer is `https://token.actions.githubusercontent.com`, and the attribute condition pins `assertion.repository_id == '1357462978'` (the reviewed GitHub repository) — the exact condition bootstrap.py creates.
2. **runtime-project-roles** — the runtime identity holds exactly `roles/datastore.user` + `roles/firebase.sdkAdminServiceAgent` at project level, nothing broader (set equality; conditional bindings grant nothing unconditionally and are ignored).
3. **runtime-secret-access** — the rate-limit secret grants only `roles/secretmanager.secretAccessor`, only to the runtime identity.
4. **deployer-federation-only** — deployer SA enabled, **zero user-managed keys** (federation only), and exactly the four reviewed bindings: `roles/iam.workloadIdentityUser` for the pinned repository principal, `roles/run.developer` on the service, `roles/artifactregistry.writer` on the repository, `roles/iam.serviceAccountUser` on the runtime identity.
5. **secret-rotation** — secret exists with an enabled version and a rotation schedule; a missing schedule refuses with the exact owner remedy command (rotation itself is an owner mutation requiring founder approval).
6. **service-isolation** — the serving service runs as the runtime identity, ingress is `internal-and-cloud-load-balancing` (post-cutover state), and no public invoker binding exists.
7. **named-firestore-database** — resolves the named database `default` through the **product's own credential chain** (service-account JSON per `GOOGLE_APPLICATION_CREDENTIALS`, RS256 JWT exchange with the read-only `datastore` scope, `firestore.googleapis.com/v1/projects/visionary-research/databases/default`) and requires `type FIRESTORE_NATIVE`, correct project/name, not deleted. The database is validated, never guessed.

## Evidence: commands, results, timestamps

| # | Check | Command | Result |
| --- | --- | --- | --- |
| 1 | Offline structural suite | `node --test infrastructure/gcp/tests/identity-audit.test.mjs` | **9/9 pass, 0 fail** (0.3s) — positive, extra-role, missing-role, conditional-binding, disabled/keyed deployer, wrong principal, wrong issuer, unpinned condition, rotation-gap remedy, wrong SA/ingress/public-invoker, wrong/foreign/deleted database, unauthenticated refusal and full-audit fail-closed cases |
| 2 | Full infrastructure suite | `node --test infrastructure/gcp/tests/*.test.mjs` | recorded in the Jira review comment (fresh-worktree `npm ci` of `infrastructure/gcp/runtime` first) |
| 3 | Live audit (first run) | `GOOGLE_APPLICATION_CREDENTIALS=<dev key> node infrastructure/gcp/identity-audit.mjs` | **1 PASS + 6 honest REFUSE**: `named-firestore-database PASS: projects/visionary-research/databases/default type FIRESTORE_NATIVE`; the six gcloud-backed checks refused with `read failed: ... Reauthentication failed. cannot prompt during non-interactive execution` — the exact deny path, because the owner's gcloud refresh tokens are expired and `gcloud auth login` is an interactive founder action |

Timestamps: suite run and live audit 2026-11-04 (session transcript carries the verbatim runner output).

## Founder-gated remainder (explicit, not silent)

- `gcloud auth login` (interactive) to restore the owner session, then re-run `node infrastructure/gcp/identity-audit.mjs` for the complete live PASS set — the tool is repeatable and needs no further code.
- **Secret rotation schedule**: if the live audit refuses check 5, the remedy (`gcloud secrets update visionary-product-auth-rate-limit --rotation-period=... --next-rotation-time=...`) is an owner mutation requiring founder approval before execution.
- ADC for local owner workflows is the same re-auth; the Cloud Run runtime identity already uses IAM/ADC server-side (unchanged).

## Known limitations

- The audit reads live state at run time; it is evidence, not a monitor. CI (`production.yml` checks job) runs the offline suite; the live audit is owner-run by design (credentials are not in CI for read-only owner checks).
- The WIF provider check pins repository_id (the condition fragment that restricts trust); the full condition (ref/workflow_ref owner pinning) is verified by bootstrap.py's `ensure` comparison and production.yml's trusted-run gate, and the live check reports the full condition text on any refusal.
- PLAT-03 closure does not close hosted gates PLAT-04..08 or actual deployment acceptance; the audit strengthens the identity/isolation review surface only.

## Review handoff

Exact candidate SHA, full-suite counts and the live-audit transcript are recorded in the Jira review comment. Reviewer must be separate from this lane. The repeatable live command for the reviewer/founder: `GOOGLE_APPLICATION_CREDENTIALS=<dev key> node infrastructure/gcp/identity-audit.mjs` (read-only, exit code is the verdict).

## REVIEWER-PREP pass (2026-11-10, before D-095 review — corrections committed on this branch)

The reviewer-corrector lane reviewed the implementation, corrected two security findings plus one hygiene item, integrated the current dev baseline and re-ran every runnable gate. Commits on `codex/deepseek-kan-47-identity-isolation`: corrections `c7c5ba37`, dev integration `ba04c44d` (merge of `2e0b1fbb`), data-04 rolling-clock fixup `a20d5e11` (byte-identical to the fix carried on the ten prepared Testing branches; the dev merge brings the data-04 invitation contract whose frozen `2026-11-02` clock base expired on 2026-11-09).

### Corrections (all in `infrastructure/gcp/`)

1. **Widened-trust hole closed** in `auditWorkloadIdentityPool`: the old check accepted any attribute condition merely *containing* `repository_id == '1357462978'`, so a condition such as `assertion.repository_id == '1357462978' || assertion.repository_id == '9999999'` (federating an extra repository) **passed**. Now every `repository_id` equality in the condition must equal the reviewed id exclusively, name-form `repository ==` claim forms refuse, and a top-level (outside-parentheses) disjunction refuses. The reviewed conjunction bootstrap.py writes — whose only `||` is the parenthesised `event_name` pair — still passes, pinned verbatim in the tests.
2. **Conditional-binding blindness closed** in `auditRuntimeProjectIam`: an *extra conditioned* role held by the runtime identity passed silently; the least-privilege law is now full set equality and any conditional binding for the runtime identity refuses (the desired state holds none, so this cannot false-refuse).
3. Dead never-called `has()` helper (with a tautological clause) removed from `auditDeployerIdentity`.
4. The credential-chain test upgraded from a stub to a full offline contract: a real 2048-bit RSA key is generated per run; the test verifies the RS256 signature over `head.claims`, the exact claims (`iss` = key service account, `scope` = read-only `datastore`, `aud` = token endpoint, `exp − iat = 60`), that only the reviewed Firestore metadata URL is read with the exchanged bearer token, and that a failed token exchange refuses before any database read.

### Gate evidence on this branch (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| Identity-audit offline suite | `node --test infrastructure/gcp/tests/identity-audit.test.mjs` | **9/9 pass** |
| Full infrastructure suite | `node --test infrastructure/gcp/tests/*.test.mjs` (after `npm ci` in `infrastructure/gcp/runtime`) | **39/43 pass**; the 4 refusals are this host's missing Python (`bootstrap.test.mjs`, `product-env.test.mjs` shell out to `python`, not installed here) — not code failures; the deepseek lane's environment ran them green |
| Data contracts | `npm run data:check` with `DATA_TEST_DATABASE_URL` on a disposable loopback PostgreSQL 16 (`nv-tools/pgsql`, fresh `visionary_data_test_kan47`) and Java 21 (`nv-tools/jdk-21.0.13+9-jre`) on PATH | **exit 0 — 315/315 across 11 suites**, including data-04 invitations 37/37 (clock fix proven on this branch) |
| Product check gate | `npm run check` (layout purity, contracts incl. API contract suite after `npm ci` in `integration/contracts/v1`, scope-06 both sides, lint/typecheck/build) | **exit 0, 844 test lines green, frontend build ok** |
| Live audit (honest refusal) | `node infrastructure/gcp/identity-audit.mjs` | **7/7 REFUSE, exit 1** — gcloud is not installed on this host and no product key is configured; every refusal is the typed fail-closed path (`read failed: …`), the named-database check refuses with the explicit `GOOGLE_APPLICATION_CREDENTIALS` message. The live PASS slice remains the founder-gated re-run documented above. |

### Environment notes for the reviewer

- The 4 Python-gated infrastructure tests and the live gcloud-backed checks require the owner environment (Python 3.15 launcher + gcloud 589.0.0 recorded by the implementer's live run); every other gate is reproducible on this host with the disposable PostgreSQL + Java 21 under `nv-tools/`.
- `verify-layout.mjs` forbids `node_modules` at the product root: dependencies belong in `frontend/`, `backend/upstream/backend/`, `infrastructure/gcp/runtime/` and `integration/contracts/v1/` (each `npm ci` from its own lock). A root `npm install` will create the forbidden directory and fail the layout gate.
