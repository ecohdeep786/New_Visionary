# KAN-162 exact operator-helper review — 4de8a33c

Jira key / source ID: KAN-162. Acceptance scope: owner baseline helper and checked dev/main source integration; hosted production acceptance remains pending.
Implementer: Codex root agent. Reviewer: independent `kan162_review` QA subagent, accepting responsibility.
Exact reviewed implementation: `4de8a33cb223a746c9738dc24554dd8ab812556e` on `codex/firebase-visionary-research`.
Source comparison: previously approved `ad495a66a3e20961e20fd0230db6caaefdef4814` plus two review reports and one baseline CLI-adapter correction. Remote main at review is `f3cf316edb746ef85a8bfb04f71f29165c54944e`; its runtime, workflow and configuration blobs match approved `ad495a66`, with only the two review reports added. See the [preceding review](KAN162_EXACT_SHA_REVIEW_AD495A66.md) and its linked full review for unchanged scope.

## Decision and exact delta

**Approved at exact `4de8a33cb223a746c9738dc24554dd8ab812556e` for the owner baseline operation and subsequent checked source integration.** This does not approve a later implementation SHA or claim hosted acceptance.

The first owner baseline attempt stopped before deploying any product revision. Independent read-back reproduced the cause: `spec.traffic` explicitly pins hello revision `visionary-product-00001-6c4` to 100%, while a separate `ci-candidate` tag still targets LATEST. Cloud Run merges these entries in `status.traffic`, reporting hello at 100% with `latestRevision:true`. The existing strict `currentRevision` correctly refuses that ambiguous status.

The correction adds `--update-tags=ci-candidate=<exact revision>` to the owner baseline's existing `--to-revisions=<exact revision>=100` command. It resolves both tag and percentage together, leaving the strict traffic check intact. Installed gcloud 589.0.0 `run services update-traffic --help` explicitly permits tag and percentage flags in one command and states that tag changes are applied first. The helper also uses this adapter for promotion/recovery, preserving exact pins. The automatic release adapter, main-only gates, runtime image and application behavior are unchanged.

Running this reviewed owner helper from its task checkout with the immutable image/source of current remote main is consistent with the baseline contract: the helper independently verifies current main, source commit, image and revision; the helper is outside the deployed container. The image itself must remain the published current-main image. Advancing main during the first-baseline operation remains prohibited by the helper's rechecks.

Independent exact-candidate checks: clean worktree, remote ref matches `4de8a33c`, `git diff --check ad495a66..4de8a33c` exits 0, and Node infrastructure suite passes 21/21. No Python/bootstrap source changed from its independently passing 11/11 suite at `ad495a66`; no unrelated suite was repeated. The existing injected baseline tests cover LATEST resolution abstractly; they did not predict Cloud Run's tag/status merge. The live reproduction and installed CLI contract are the additional evidence for this adapter correction; no new automated coverage is invented.

## Independent read-only cloud snapshot before product baseline

Observed on 2026-10-20, approximately 09:46–09:51 UTC; root agent owns provisioning/deployment, and this reviewer performed no cloud/Jira mutation or protected-record read:

- GCP project `visionary-research`, number `174851137514`, is ACTIVE. Native Firestore database `default` is in `asia-south1`.
- Firebase Admin config authorized domains include `visionary-research.firebaseapp.com`, `visionary-research.web.app` and `visionary.org.in`. Rules API read-back identifies the deployed `cloud.firestore/default` release and actual ruleset content `allow read, write: if false`. The first read lacked a quota-project request header and failed 403; adding `x-goog-user-project: visionary-research` to the read request succeeded without changing local/cloud configuration. No document query or write was made.
- WIF provider `projects/174851137514/locations/global/workloadIdentityPools/visionary-github/providers/github-main` is ACTIVE, with exact repository ID `1357462978`, owner ID `221676162`, main ref, production workflow ref, push/manual condition, issuer and expected mappings. Deployer WIF IAM targets that repository principal.
- Runtime project roles are `datastore.user` and `firebase.sdkAdminServiceAgent`; deployer has no project-wide role. Resource IAM confirms Run developer on the service, Artifact Registry writer on the repository, act-as on runtime, and secretAccessor for runtime. Secret version 1 is ENABLED; no secret value was accessed or printed.
- The service still serves the hello image digest with service/revision maximum 1, one CPU, 512 MiB, concurrency 20, timeout 30 seconds, request CPU, no startup boost and gen2. Public ingress is still `all`; invoker-IAM-disabled is unset before the first product deployment. No product runtime is claimed by this snapshot.
- Artifact Registry repository is STANDARD/DOCKER in Mumbai. Edge address `34.8.58.39` is EXTERNAL/IPV4/PREMIUM and IN_USE. Apex managed certificate is PROVISIONING; DNS still resolves to old-project `136.110.244.48`.
- Live URL map routes only exact `/__deploy-check` to the candidate backend; normal product routes use the main backend and other hosts redirect to the canonical apex. Both EXTERNAL_MANAGED HTTP backends have CDN disabled, the expected single serverless NEG and `X-Forwarded-For:{client_ip_address},{server_ip_address}` replacement header.

Verification result: source/helper checks passed; product baseline, TLS/DNS cutover, canonical public/anonymous-auth checks, account journeys and operational rollback remain pending. KAN-162 Done and dependent-task acceptance are not established by this report. No local container execution is claimed; its main CI build/smoke/publish evidence and live follow-up still need their own receipt. Integration/Jira receipts remain the integrator's actions.
