# KAN-162 exact candidate review

Review date: 2026-10-19  
Reviewer: `/root/kan162_review` (independent reviewer)  
Candidate: `codex/codex-kan-162-main-deployment` at `8bcc1636dae445b6c935af1132248d58e23bea01`  
Base: verified `origin/dev` at `99d67efd585e9e9d48d838b1dcc0c4fd755c658d`  
Decision: **changes requested**  
Verification: **partial pass; container build not run in this reviewer checkout**

## Finding

**P1 — Pin the one-time legacy rollback baseline to the actual KAN-29 release.** `infrastructure/gcp/release.mjs:verifyLegacyBaseline` accepts a currently trafficked revision if it has the expected project, runtime identity, origin, proxy depth, secret reference and resource limits. It checks only that its image string starts with the configured Artifact Registry image path. It does not require the expected legacy revision name or the known deployed KAN-29 image digest, and does not require a syntactically valid digest. Thus an arbitrary or tag-based revision with matching environment settings can pass as the supposedly sole legacy baseline and become an automatic rollback target during first-main deployment. This contradicts the runbook's claim that only the current KAN-29 revision is accepted.

Pin the known current revision and immutable digest from the recorded deployment receipt, and validate the full `@sha256:<64 lowercase hex>` image reference. Add negative tests for a different revision name, a different valid digest, a mutable tag and a malformed digest. Keep the legacy exception limited to the first transition; subsequent rollback must remain restricted to verified main history.

## Reviewed areas and evidence

- The workflow is limited to `main` push/manual runs for publishing and deployment; pull-request checks use no GCP credentials. Actions are pinned to full commit SHAs, deployment token permission is scoped to the production job, and the job is serialized without cancelling an in-flight deployment.
- The Cloud Run release flow checks a current main SHA, immutable image digest and bounded runtime settings; it deploys a no-traffic candidate, checks forwarded-header sanitization, checks main again before promotion, and attempts guarded rollback after canonical smoke failure.
- The GCP bootstrap plan is read-only by default. Edge and identity mutations are separate explicit modes. The edge plan uses a health-only exact-path candidate route and replaces `X-Forwarded-For` with load-balancer values. It reports the GoDaddy apex A record without editing DNS. The runbook keeps Firebase, DNS and user records outside the script.
- The backend runtime has a dedicated lock, preserves the pinned upstream lock, omits legacy Prisma/model/startup code and uses a non-root image. Local `npm audit --omit=dev --audit-level=high --json` on this exact lock exited 0: 0 high, 0 critical, 4 moderate. The moderate findings and graph-scope rationale are recorded in the implementation review handoff.
- Independently ran `node --test infrastructure/gcp/tests/*.test.mjs`: 11 tests passed, 0 failed. Ran the bootstrap test and release test suites separately as well: 1/1 and 10/10 passed. The Docker daemon was unavailable in this reviewer environment, so I could not independently rebuild or execute the image here. The implementer reports Linux image/container checks passed; that reported evidence does not clear the legacy-baseline finding.
- The source configures two trusted proxy hops, while the ALB plan overwrites forwarded client-IP headers and the candidate probe sends a spoofed sentinel. Actual GCP ALB/DNS/TLS/WIF deployment and canonical-domain behavior remain hosted release checks, not completed evidence in this code review.

## Required disposition

Return KAN-162 to implementation for the baseline pin and regression tests. Re-review the new exact candidate SHA and rerun relevant tests. This review grants no approval for GCP/DNS mutation, main promotion, Jira Done or production acceptance. The main-only pipeline, actual domain cutover, TLS, first-main migration, GitHub main-push deploy, and live rollback remain operational gates.
