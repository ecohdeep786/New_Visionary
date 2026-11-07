# KAN-43 / DATA-08 final verification handoff

7 November 2026. Original implementer: deepseek. Corrective implementer and
verifier: Codex `/root`. Separate exact-source reviewer: `/root/kan43_final_review` (renewed review pending).

Original branch: `codex/deepseek-kan-43-concurrency`, original rejected candidate
`2002da1f4f3fe699adeb39f650ab74bf87894bf0`. Accepted dev baseline
`6cbf958b5887204f17c8cf81fa471131a511b41d` was integrated into this original lane.
No replacement branch or frontend source changes.

## Scope and corrections

Engineering enabler: verify current authority/transaction behavior against real
owning stores and validate finite connection capacity. The old disconnected
memory prover accepted unknown-resource shares and unowned commands, and two
concurrent grants both reported fresh success. Its process-local pool retained
unbounded instance records and could not constrain fleet sockets. Those unused
classes and misleading tests are removed, rather than becoming another source
of permission authority. No deployed consumer or route depended on them.

Actual two-client PostgreSQL tests now cover wrong UID/workspace/non-owner role,
changed-account replay, simultaneous grants, lock-ordered revoke/grant and
revoke/delivery, optimistic revision races, idempotent retries and reconnection
after terminating a real backend. Three independent child-process pools fill an
actual finite role limit; the fourth is refused and disconnect restores access.
Read-only, bounded capacity preflight checks real server reserves, normal-role
limits and privileges. Source inventory includes all four selected product pools
and release instance bounds. See [verification contract](../../../integration/DATA08_VERIFICATION.md).

## Verification and limits

- Whole Nest build and selected production TypeScript compilation passed.
- Focused DATA-08 suite: 23 passed, including real PostgreSQL races/processes.
- DATA-01..08 aggregate: 213/214; the only failure was a production-binding
  configuration test inheriting an explicitly supplied emulator variable. The
  production realm correctly refused it. Isolated DATA-07 rerun: 37/37 passed.
  Remaining DATA-01..06 and DATA-08 suites rerun with the emulator in their
  intended environment: 177/177 passed. Combined isolated result: 214/214.
- Broader backend suite with real loopback Firestore: 162/162 passed.
- Accepted registered backend Chromium gate: four groups passed using real
  Firebase Auth/Firestore emulators and SQL, including account-switch denial,
  tombstones and actual SQL privilege-loss 503 -> restored 200 without partial
  responses. Harness retains its existing demo realm and synthetic database
  `visionary_data_test_kan42`; DATA-08 races use `visionary_data_test_kan43`.

All stores are disposable loopback Docker services. No live account, deployment
or production configuration was changed. Browser source is reused unchanged;
there is no new UI flow. ML/jobs are N/A for this verification enabler.
PostgreSQL limits govern normal connections, not fair distributed scheduling.
This does not install production role limits, certify every hosted workload,
prove automatic driver recovery, or qualify sustained load. Hosted inventory,
load/recovery, provisioning and feature acceptance remain separate gates.

Original Jira candidate returned to In Progress with actual findings in comment
10650 (transition 31). Separate exact-source decision, candidate CI, published dev
integration, integrated checks, evidence preservation, cleanup and actual Jira
Done remain pending. No approval or completed merge is claimed here.

## Independent review correction

Reviewer requested changes on `bfc1f485580afbab0e5d38b434236f956ce0aafb`
after an independent 22/22 run: sparse pool arrays could skip unknown slots, and
barrier/worker-exit waits were unbounded. Sparse arrays now fail closed with a
regression; waits have descriptive deadlines and lock/worker cleanup. Actual
grant/revocation outbox counts are asserted. Corrected focused suite: 23/23.
Earlier 214 total becomes 215 with this regression; unchanged suites retain
their recorded checks. Exact corrected-source decision and CI remain pending.
