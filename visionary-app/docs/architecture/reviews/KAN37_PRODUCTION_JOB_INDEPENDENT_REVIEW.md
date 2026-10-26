# KAN-37 production migration job independent review

- Jira/source: KAN-37 / DATA-02.
- Acceptance scope: production-capable migration-job development enabler only.
- Implementer: parent Codex agent `/root`, continuing the existing DeepSeek worktree.
- Reviewer: `/root/kan37_final_review`; I accept responsibility for this independent review.
- Worker branch: `codex/deepseek-kan-37-data-migrations`.
- Reviewed candidate: `52279b91e852f6135abd2763b6872d0c0c6f55d0`.
- Accepted dev comparison base: `65045d72976b629336a150fa18aa32d73537a3bd`.
- Review date: 26 October 2026.

## Scope and evidence

Reviewed the separate data-job Docker image/lock, CLI, explicit Cloud SQL target
and identity guards, pinned staging-receipt admission, deployment-plan bounds,
main-only image publication and CI registration. The HTTP product and ML receive
no migration credentials or automatic database cutover from this change.

Independent reviewer-source compilation passed using the matching locked backend
dependency installation. Five separately authored probes passed: staged-schema
mismatch/missing schema denial, Linux socket-path byte limit, matching deployment
plan denial, offline plan with no credential disclosure/connection, and URL
fragment/options/duplicate-key denial. The compiled data sources are unchanged
between tested `8a1bcbefd8834c5837df06df56e86212ad62b080` and the reviewed candidate;
the intervening commits correct the container fixture only.

Earlier candidate CI run 40279490751 passed normal product checks and all 20
DATA-01 plus 39 DATA-02 tests, then failed disposable image-fixture readiness.
That failure does not count as successful image/database verification. Review
identified receipt-directory permissions under the non-root image UID and the
temporary PostgreSQL initialization-server race. The candidate corrects these,
preserves socket-volume permissions and retains startup diagnostics on failure.
Candidate `af987755621083f6d0569716a3ff9332b072804e` still failed readiness
in CI run 40280559885. Its retained diagnostics establish the actual cause:
PostgreSQL starts on the custom socket, but the official image initialization
helper connects to the default `/var/run/postgresql` socket and exits because
it is absent. The fixture must preserve that default socket in addition to the
custom one. The reviewed candidate adds both socket directories and passes
`node --check infrastructure/gcp/data-job/check-image.mjs`. Earlier
permission/copy-up hypotheses were not the confirmed cause
of these observed startup failures.

The job is explicitly invoked, one task/parallelism one, zero automatic retry,
one CPU/512 MiB and five-minute timeout. It creates no resident service, scheduler,
paid database or new IAM grant. Documentation states Cloud SQL requires explicit
start/stop, cannot wake on a connection, and retains storage/IP charges while
stopped. Shared live dependencies must remain available.

## Decision and remaining gates

Reviewer decision: **approved for the bounded migration-job dev scope** at exact
commit `52279b91e852f6135abd2763b6872d0c0c6f55d0`. Verification result: passed for
this scope. The final fix resolves the observed initialization failure; no
unresolved source defect was found in this continuation.

Final [CI run 40281324192](https://github.com/ecohdeep786/New_Visionary/actions/runs/40281324192)
completed successfully on that exact source commit. Checks job 121435055351
retains the actual compiled-image staging apply/verify/replay and pinned-receipt
production-mode apply/verify success, followed by denied irreversible rollback
and successful state verification. Its log records this positive result at
2026-10-26 06:43:58 UTC. This is an isolated real PostgreSQL Unix-socket fixture,
not a hosted Cloud SQL execution. The same run passes 20 DATA-01 and 39 DATA-02
tests, normal product checks, production checks, 31 infrastructure tests and
the independent data-image production dependency audit with zero vulnerabilities.
Its main-only production job is skipped on this pull request.

Independent verification commands, all exit zero on 26 October 2026:

- `node docs/architecture/reviews/evidence/KAN37_REVIEW_COMPILE.cjs <review-root> <same-lock-worker-backend>`.
- `NODE_PATH=<same-lock-worker-backend>/node_modules node --test docs/architecture/reviews/evidence/KAN37_PRODUCTION_PROBES.cjs` — 5/5 passed.
- `node --check infrastructure/gcp/data-job/check-image.mjs`.

Integrator-owned signed-in in-app product verification and checks on the actual
dev integration remain merge/delivery gates. This source approval does not
replace them or permit unrelated work to be overwritten.

Full KAN-37 remains Rework: hosted Cloud SQL role/secret/IAM provisioning,
actual empty hosted staging execution, production resource/budget/recovery
acceptance, approved operational backfill command/artifact and connected domain
integration remain open. The current canonical baseline intentionally refuses
retained-record DDL and rollback. The receipt hash is an operator-reviewed pin,
not an independent signed attestation. No production deployment, live database
cutover, ML integration or broad feature completion is approved by this report.

Dev integration/checks and Jira transition receipts: pending integrator action.
No full-ticket Done, production release or completed-task worktree cleanup is
authorized by this limited source approval.
