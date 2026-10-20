# KAN-162 exact successor review — ad495a66

Jira key / source ID: KAN-162
Acceptance scope: checked dev integration and main publish readiness; hosted production acceptance remains pending.
Implementer: Codex root agent
Reviewer: independent `kan162_review` QA subagent, accepting responsibility
Worker branch / base / candidate: `codex/firebase-visionary-research`; base `1d2e02aa3548afa6aeb227eb7a0a5670e426ef2a`; exact candidate `ad495a66a3e20961e20fd0230db6caaefdef4814`.
Reviewed successor range: `bf3a9489bddb522e65da33f28b3c7062c2624bf6..ad495a66a3e20961e20fd0230db6caaefdef4814`, supplementing the full migration/source review in [the preceding exact-SHA report](KAN162_EXACT_SHA_REVIEW_BF3A9489.md).

## Decision

**Approved for checked dev integration and main publish readiness at exact implementation `ad495a66a3e20961e20fd0230db6caaefdef4814`.** No source blocker remains in the reviewed scope. The earlier approval covers its earlier SHA only; this independent successor review covers the final delta explicitly. No later implementation commit is covered.

The delta replaces `--allow-unauthenticated` with service-specific `--no-invoker-iam-check` for fresh foundation creation and the owner-run first baseline. It avoids the rejected `allUsers` IAM operation while enabling the explicitly authorized public product. It changes neither organization policy nor application session/UID authorization. Automatic deployment still requires the canonical load-balancer ingress contract; owner baseline uses public ingress only during the documented first-release setup. The README explains that boundary and the previously reviewed Windows/traffic/cost constraints.

The installed gcloud 589.0.0 help independently confirms the supported `--[no-]invoker-iam-check` flag. The implementer reported a live placeholder 403 and organization-policy rejection of `allUsers`; this reviewer did not independently mutate or verify cloud IAM. Source inspection confirms no project-wide public grant or organization-policy change is introduced.

An initial successor test placed its new flag assertions in a helper that never received a Run deploy call. Review identified the ineffective coverage. The final test-only commit moves them to the actual fresh-foundation fake, whose exercised `run deploy` call now requires `--no-invoker-iam-check` and rejects `--allow-unauthenticated`. The final candidate's fresh-creation path passes. No approval is inferred from the earlier vacuous assertion.

## Verification

Independent checks on the exact final candidate, clean worktree, 2026-10-20 09:38 UTC:

| Check | Result |
| --- | --- |
| `node --test infrastructure/gcp/tests/*.test.mjs` | Exit 0; 21/21 pass |
| `python -m unittest discover -s infrastructure/gcp/tests -p '*_test.py'` | Exit 0; 11/11 pass |
| `git diff --check bf3a9489..ad495a66` | Exit 0 |
| `git rev-parse HEAD` and independent remote-ref read | Both `ad495a66a3e20961e20fd0230db6caaefdef4814` |

The full root and locked-runtime checks, real Windows command invocation, audit result, unchanged component comparison and detailed migration findings remain recorded in the preceding report. The successor changes only the two public-service flags, README explanation and correctly exercised test assertions. No frontend/backend/model/data behavior, package lock, workflow gate or source-audit artifact changed in this successor range. Repeating unrelated full suites is unnecessary for this delta.

Verification result: **passed for reviewed source scope; hosted acceptance pending**. Four moderate upstream dependency advisories remain. Local Docker's Linux-engine pipe is unavailable, so no independent container build/smoke result is claimed. Main CI must provide actual image build/smoke/publish evidence, followed by baseline, edge/DNS/TLS, canonical public/anonymous-authority/account journeys and rollback verification before hosted acceptance or KAN-162 Done.

Delivery chain: source/runtime boundaries and tests remain as previously reviewed; no cloud, protected-record, provider or Jira mutation was performed by this reviewer. Dev integration/publication checks and Jira receipts remain pending integrator actions. KAN-161/KAN-28 hosted outcomes, KAN-29 source/content acceptance and KAN-145/KAN-146 testing retain their separate gates. This review releases no dependent implementation task by itself.
