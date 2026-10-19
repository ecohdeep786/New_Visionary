# KAN-162 dev-to-main release review — 8b829d4c

**Decision: BLOCKED for production promotion.** Reviewed candidate `8b829d4c7eb2f187d25b065de22ed77a874939b6` against current `origin/main` `94aa8117cb318b8211b4815e8d6ff698c3d62f2b` on 2026-10-19.

## Scope and code review

The prior broad-snapshot blocker from review `942efcc538ff04f3676230171ef9e2b647de4fba` does **not** persist for this comparison: current main has advanced to the prior integration baseline, and the candidate delta is just three files: `.github/workflows/production.yml`, `visionary-app/infrastructure/gcp/bootstrap.py`, and a new `bootstrap_test.py`.

The PR #8 bootstrap change is safe in its intended setup order. It imports a missing, specifically named URL map before calling static validation, then re-describes and compares the desired redirect, host rules and path matchers. Existing mismatches fail closed. Validation runs before the subsequent HTTPS forwarding resources are created, so a validation failure leaves no active edge route. The test verifies first-run call order and exact submitted configuration. I found no release-critical defect in these three changed files.

Verification on the candidate implementation commit `1dff1605` (the implementation commit merged by candidate SHA): bundled Python `unittest discover -s infrastructure/gcp/tests -p '*_test.py'` passed 1/1; Node `--test infrastructure/gcp/tests/*.test.mjs` passed 11/11. The Python and Node tests exercise the exact implementation commit present in the reviewed merge. The workflow adds the Python suite to the existing checks job; production remains gated to the `main` push/manual event and publish variable, with deploy requiring the separate deploy variable. No credentials are granted to the checks job.

## Release blockers

- **P1 — canonical HTTPS is not ready.** A live read-only check resolved `visionary.org.in` to `136.110.244.48`, but `curl.exe -vk --max-time 20 https://visionary.org.in/__deploy-check` failed the TLS handshake (`schannel: failed to receive handshake, SSL/TLS connection failed`). Thus no valid certificate-backed canonical smoke can pass now. The bootstrap README requires the apex to point at the provisioned load-balancer address and the managed certificate to reach ACTIVE before candidate probe and deploy enablement.
- **P1 — Jira acceptance remains open.** Live Jira on 2026-10-19 reports KAN-162 **In Progress**, KAN-29 **Testing**, KAN-145 **Testing**, and KAN-146 **Testing**. The task execution receipt likewise does not record KAN-162 as independently reviewed, hosted-accepted or Done. A clean file delta does not close those release gates.

The GitHub repository variables/WIF setup and successful candidate edge, DNS/TLS, canonical health/API/static, rollback and post-deploy smoke receipts were not available in the reviewed artifacts. Do not enable publish/deploy or call this a production release until the required setup and live acceptance evidence exist. This is a release-readiness block, not a code change request for the PR #8 bootstrap.

**Reviewer:** qa-review (independent)
**Exact dev SHA:** `8b829d4c7eb2f187d25b065de22ed77a874939b6`
**Base:** `origin/main` `94aa8117cb318b8211b4815e8d6ff698c3d62f2b`
**Decision:** code delta reviewed; production promotion not approved. No implementation, main/dev, Jira or GCP state was changed.
