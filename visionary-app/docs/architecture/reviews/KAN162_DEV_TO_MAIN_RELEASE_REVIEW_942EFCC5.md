# KAN-162 dev-to-main release review — 942efcc5

**Decision: BLOCKED — do not promote this `dev` head to `main`.** This decision reviews the proposed dev-to-main integration at exact SHA `942efcc538ff04f3676230171ef9e2b647de4fba`, compared with `origin/main` `78ac46aa6707a228501cfb2342625aaf49ab3091`. It does not revoke the earlier code-level review of KAN-162 implementation SHA `6bdcb716ff6a2f221298ee92ffed9359fc7cc599`.

## Findings

- **P1 — candidate is not a scoped, accepted release.** The main-to-candidate comparison contains 15,751 changed files (+3,831,804/−2,213 lines), including 15,326 files under `.tools/go/`, and 422 under `visionary-app/`. The product-side change set includes account-directory/KAN-161 work, substantial landing-page work and research captures, plus KAN-162 infrastructure. This is far broader than the KAN-162 release task and contains no demonstrated release review for the aggregate candidate. `docs/architecture/BRANCH_WORKFLOW.md` says to promote only accepted scope and preserve dev/main separation.
- **P1 — included acceptance remains open.** Live Jira reads on 2026-10-19 report KAN-29 **Testing**, KAN-145 **Testing**, KAN-146 **Testing**, and KAN-162 **In Progress**. The current `task-executions.json` records KAN-161 and KAN-137 as Done, while KAN-29 is not accepted. Thus several included task scopes are pending independent acceptance; a merge of the full dev head would put them into production history prematurely.
- **P1 — KAN-162 production gates have no completion evidence.** The workflow documentation requires owner setup (WIF provider and repository variables), a GoDaddy apex `A` record, ACTIVE Google-managed TLS, candidate edge-route checks and canonical hosted smoke before deploy enablement. The reviewed candidate contains setup instructions, but no change receipt or hosted evidence establishing these conditions. Jira remains In Progress. Do not treat existing Cloud Run baseline or passing isolated tests as proof of the canonical production journey.

## Workflow and configuration checks

Inspected `.github/workflows/production.yml` at the exact candidate. `checks` run on `dev`/`main` pushes and PRs. The `production` job requires repository `ecohdeep786/New_Visionary`, `refs/heads/main`, a `push` or `workflow_dispatch`, and `PRODUCTION_PUBLISH_ENABLED == 'true'`; deploy additionally requires `PRODUCTION_DEPLOY_ENABLED == 'true'`. It requests only `contents: read` and `id-token: write`, pins the GitHub actions to commit SHAs, disables checkout credential persistence, and serializes production runs. This confirms dev pushes do not enter the production job and PRs do not receive GCP identity tokens.

`build-image.mjs` requires `FIREBASE_WEB_CONFIG` to contain only the six expected public Firebase Web SDK fields and validates the project and Auth domain before passing them as build arguments. The docs correctly treat this as public client configuration, and name `GCP_WORKLOAD_IDENTITY_PROVIDER` as a repository Actions variable. No evidence was inspected proving these repository variables or WIF resources are installed.

The release/bootstrap code and test suite are the same scoped implementation previously reviewed at `6bdcb716`; this release-candidate assessment does not repeat those test runs. The earlier report records 11 release/bootstrap tests, 65 production-account tests, frontend checks and the runtime audit for that implementation SHA. No candidate-SHA GitHub Actions result or hosted DNS/TLS/canonical smoke artifact was available for this integration review.

## Required next step

Keep this dev integration out of `main`. First resolve the outstanding task reviews and KAN-162's own status and hosted release gates. Then create a release candidate containing only explicitly accepted scope, run the production workflow checks on that exact candidate, and attach DNS/TLS/hosted smoke and rollback evidence before promotion.

**Reviewer:** qa-review (independent)
**Reviewed SHA:** `942efcc538ff04f3676230171ef9e2b647de4fba`
**Verification:** workflow/configuration and current acceptance evidence inspected; release-candidate integration **not approved**. No GitHub, Jira, DNS or GCP state was changed.
