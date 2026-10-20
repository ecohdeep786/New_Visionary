# KAN-162 — Main-branch production delivery

The founder confirms `visionary-research` (project number `174851137514`) as the production project, `visionary-product` in `asia-south1` as the service, GitHub `main` as the sole production source and `https://visionary.org.in` as the public origin. `dev` and task branches run development/review checks. GoDaddy owns DNS. The former `visionary-fd6d2` project (also called `visionary-fd262` in the correction request) is a retained recovery reference, not the deployment target. No old-project users or records were migrated.

## Release behavior

PRs and dev pushes run checks without cloud credentials. Main pushes build and smoke-test an immutable container, then use repository/main/workflow-restricted Workload Identity Federation to publish it. Automatic deploy, separately activated after edge acceptance, verifies a no-traffic candidate, exact revision/image/project/environment/cost bounds, sanitized forwarding headers and current remote main before pinning traffic. Failed candidates retain the previous release; failed post-promotion checks restore it only if the failed candidate still owns traffic. Operator changes are not overwritten.

The new project uses an explicit first baseline rather than the former project's legacy fallback. It accepts only the bounded hello placeholder, pins both its traffic and candidate tag (Cloud Run can otherwise merge a LATEST tag into status traffic), verifies a no-traffic immutable candidate and its tagged health, rechecks main and explicitly promotes it. A same-commit/image retry is allowed; another baseline, foreign image, stale main or unrelated service is refused.

Cloud Run uses scale-to-zero, service and revision maximum one, CPU1/512MiB, request CPU, no startup boost, concurrency20, timeout30 and generation2. Public access uses the service-specific invoker-IAM-disabled setting permitted under the existing organization policy; application session/UID/CSRF authorization remains enforced. Canonical cutover restricts ingress to internal/Google load balancing. Both ALB backends replace forwarded client-IP data, and only exact `/__deploy-check` reaches the candidate. The probe returns only a sanitization boolean, never an address.

## Observed state — 20 October 2026

Independent exact-source approvals cover `ad495a66` and the owner-baseline follow-up `4de8a33c`. PR9 passed and merged to dev `3a2626d6`; PR10 passed and merged main `f3cf316e`. [Main workflow39402842556](https://github.com/ecohdeep786/New_Visionary/actions/runs/39402842556) passed Linux build, container smoke, keyless identity and publication. Image digest: `sha256:d7c679901eaa656dd8759291ff0b1d7f736b7006b4feccd154bc29bf9d28cfe2`. Baseline `visionary-product-baseline-f3cf316edb74-mvgi7evq` serves100%.

Foundation/IAM/WIF/secret reference, native Firestore `default`, deny-all client rules, the production authorized domain and actual service/revision limits were read back. Public run.app health/login200, anonymous account/auth401, unknown API404, revision/cache/security headers and Origin/CSRF denial pass independently. A real Firebase custom-token test verifies the KAN161 UID directory/Free billing, two sessions, store read-back, wrong-UID denial, persisted onboarding recovery and logout isolation; its newly created synthetic identity is disabled and records retained. Email/Google/Apple provider acceptance is not inferred.

Edge resources exist at `34.8.58.39`; public and authoritative apex DNS now return that address. Managed TLS is PROVISIONING. Canonical HTTPS, restricted-ingress cutover, ordinary automatic deployment and hosted rollback remain open; deploy stays disabled. KAN162 remains Testing. KAN29 real-source coverage and KAN145/146 remain separately open.

Runtime audit has four moderate upstream advisories and zero high/critical; the configured threshold passes. No SSE/upload handlers from the retired graph are registered. See the current [operational runbook](../../../infrastructure/gcp/README.md), [handoff](../delivery/KAN162_RESEARCH_PRODUCTION_HANDOFF.md) and independent exact-SHA/baseline review reports for evidence and limitations.
