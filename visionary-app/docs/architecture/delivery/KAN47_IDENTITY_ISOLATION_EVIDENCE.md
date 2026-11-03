# KAN-47 / PLAT-03 — identity, least-privilege and named-database validation evidence

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
